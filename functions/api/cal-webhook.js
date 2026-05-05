// /api/cal-webhook · Phase 5/6 perfection · Cal.com booking lifecycle webhook
//
// Verifies the x-cal-signature-256 header (HMAC-SHA256 of raw body using
// CAL_WEBHOOK_SECRET) before persisting the booking record to KV under
// `bookings:cal:<uid>` with a 2-year TTL.
//
// Security stack:
// 1. Body size cap at 64 KB (defends against payload DoS).
// 2. HMAC-SHA256 verification on raw body, timing-safe comparison.
// 3. Replay-window enforcement: rejects events whose `createdAt`/timestamp is
//    older than 5 minutes (Cal.com retries 5xx for up to 30 days, but a fresh
//    event should always arrive within seconds; a stale signed payload is a
//    replay attempt).
// 4. Idempotency: BOOKING_CREATED on a uid we've already stored is a no-op.
//    BOOKING_RESCHEDULED and BOOKING_CANCELLED overwrite the record.
//
// Lifecycle handled: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED,
// MEETING_ENDED, MEETING_STARTED, BOOKING_NO_SHOW_UPDATED.
//
// Observability:
// - Structured JSON log line per request with outcome and timings.
// - Resend alert on every successful event with a meaningful subject line.

const MAX_BODY_BYTES = 64 * 1024;
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

export const onRequestPost = async ({ request, env }) => {
  const t0 = Date.now();
  const baseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const log = (outcome, extra = {}) => {
    try { console.log(JSON.stringify({ component: 'cal-webhook', outcome, duration_ms: Date.now() - t0, ...extra })); } catch {}
  };

  const expected = env.CAL_WEBHOOK_SECRET || '';
  if (!expected) {
    log('webhook_secret_unbound');
    return new Response(JSON.stringify({ error: 'webhook_secret_unbound' }), { status: 503, headers: baseHeaders });
  }

  // Read body with size cap. Reading via .text() doesn't enforce a cap, so we
  // read the underlying stream and throw early if it overruns.
  const reader = request.body?.getReader();
  if (!reader) {
    log('no_body');
    return new Response(JSON.stringify({ error: 'no_body' }), { status: 400, headers: baseHeaders });
  }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      log('body_too_large', { size: total });
      return new Response(JSON.stringify({ error: 'body_too_large' }), { status: 413, headers: baseHeaders });
    }
    chunks.push(value);
  }
  const rawBytes = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { rawBytes.set(c, off); off += c.byteLength; }
  const rawBody = new TextDecoder().decode(rawBytes);

  const sigHeader = request.headers.get('x-cal-signature-256') || '';
  const computed = await hmacSha256Hex(expected, rawBody);
  if (!sigHeader || !timingSafeEqual(sigHeader, computed)) {
    log('invalid_signature');
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401, headers: baseHeaders });
  }

  let body;
  try { body = JSON.parse(rawBody); } catch {
    log('invalid_json');
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: baseHeaders });
  }

  // Replay-window enforcement. Cal.com sends `createdAt` ISO timestamp on the
  // outer envelope. If the event is older than REPLAY_WINDOW_MS, treat it as a
  // replay regardless of valid signature.
  const createdAt = body.createdAt || body.created_at;
  if (createdAt) {
    const eventTime = Date.parse(createdAt);
    if (Number.isFinite(eventTime)) {
      const skew = Date.now() - eventTime;
      if (skew > REPLAY_WINDOW_MS) {
        log('replay_window_exceeded', { skew_ms: skew });
        return new Response(JSON.stringify({ error: 'event_too_old' }), { status: 409, headers: baseHeaders });
      }
    }
  }

  const triggerEvent = body.triggerEvent || body.event || 'unknown';
  const payload = body.payload || body.data || {};
  const request_id = payload.uid || payload.id || crypto.randomUUID();

  const record = {
    tab_source: 'bookings',
    request_id: 'cal:' + request_id,
    submitted_at: new Date().toISOString(),
    name: payload.attendees?.[0]?.name || payload.attendee?.name || '',
    email: payload.attendees?.[0]?.email || payload.attendee?.email || '',
    intent_text: triggerEvent + ' · ' + (payload.title || ''),
    notes: JSON.stringify(payload).slice(0, 2000),
    cal_event_type: payload.eventType?.title || payload.eventType?.slug || '',
    cal_start_time: payload.startTime || payload.start_time || '',
    cal_end_time: payload.endTime || payload.end_time || '',
    cal_status: payload.status || lifecycleStatus(triggerEvent),
    cal_trigger: triggerEvent
  };

  if (env.FORM_SUBMISSIONS) {
    const existing = await env.FORM_SUBMISSIONS.get(`bookings:${record.request_id}`);
    if (existing && triggerEvent === 'BOOKING_CREATED') {
      log('deduped', { trigger: triggerEvent, request_id: record.request_id });
      return new Response(JSON.stringify({ ok: true, request_id: record.request_id, deduped: true }), { status: 200, headers: baseHeaders });
    }
    await env.FORM_SUBMISSIONS.put(`bookings:${record.request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
  }

  if (env.RESEND_API_KEY && record.email) {
    const subject = `[Cal] ${humanTrigger(triggerEvent)} · ${record.name || 'unknown'} · ${record.cal_event_type || 'strategy-call'}`;
    const html = `<h2 style="font-family:Georgia,serif">Cal.com ${esc(triggerEvent)}</h2>
      <p><strong>${esc(record.name)}</strong> at <strong>${esc(record.cal_event_type)}</strong></p>
      <p>${esc(record.cal_start_time)} &rarr; ${esc(record.cal_end_time)}</p>
      <p>Email: ${esc(record.email)}</p>
      <p>Cal UID: <code>${esc(request_id)}</code></p>`;
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || 'Tamazia Forms <forms@tamazia.in>',
        to: [env.ALERT_TO || 'realfamemedia@gmail.com'],
        subject,
        html
      })
    }).catch(() => {});
  }

  log('persisted', { trigger: triggerEvent, request_id: record.request_id });
  return new Response(JSON.stringify({ ok: true, request_id: record.request_id, event: triggerEvent }), {
    status: 200, headers: baseHeaders
  });
};

export const onRequest = async () => new Response(JSON.stringify({ error: 'method_not_allowed' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
});

function lifecycleStatus(trigger) {
  if (trigger === 'BOOKING_CANCELLED' || trigger === 'BOOKING_CANCELED') return 'CANCELLED';
  if (trigger === 'BOOKING_NO_SHOW_UPDATED') return 'NO_SHOW';
  if (trigger === 'MEETING_ENDED') return 'COMPLETED';
  return 'CONFIRMED';
}
function humanTrigger(trigger) {
  return String(trigger).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
async function hmacSha256Hex(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function esc(s) {
  return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}
