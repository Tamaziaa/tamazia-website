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
  const baseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  const log = (outcome, extra = {}) => {
    try { console.log(JSON.stringify({ component: 'cal-webhook', outcome, duration_ms: Date.now() - t0, ...extra })); } catch {}
  };

  const expected = env.CAL_WEBHOOK_SECRET || '';
  if (!expected) {
    log('webhook_secret_unbound', { request_id: 'cal:unset', trigger: 'config_error' });
    return new Response(JSON.stringify({ error: 'webhook_secret_unbound' }), { status: 503, headers: baseHeaders });
  }

  // Read body with size cap. Reading via .text() doesn't enforce a cap, so we
  // read the underlying stream and throw early if it overruns.
  const reader = request.body?.getReader();
  if (!reader) {
    log('no_body', { request_id: 'cal:unset', trigger: 'bad_request' });
    return new Response(JSON.stringify({ error: 'no_body' }), { status: 400, headers: baseHeaders });
  }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      log('body_too_large', { size: total, request_id: 'cal:unset', trigger: 'bad_request' });
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
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const ipHash = await sha256Hex(ip).then(h => h.slice(0, 8));
    const sigPrefix = (sigHeader || 'absent').slice(0, 8);
    log('invalid_signature', { request_id: `cal:sig-fail:${ipHash}:${sigPrefix}`, trigger: 'invalid_signature' });
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401, headers: baseHeaders });
  }

  let body;
  try { body = JSON.parse(rawBody); } catch {
    log('invalid_json', { request_id: 'cal:bad-json', trigger: 'bad_request' });
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: baseHeaders });
  }

  // Replay-window enforcement. Cal.com sends `createdAt` ISO timestamp on the
  // outer envelope. If the event is older than REPLAY_WINDOW_MS, treat it as a
  // replay regardless of valid signature.
  const createdAt = body.createdAt || body.created_at || body.payload?.createdAt || body.payload?.created_at;
  if (createdAt) {
    const eventTime = Date.parse(createdAt);
    if (Number.isFinite(eventTime)) {
      const skew = Date.now() - eventTime;
      if (skew > REPLAY_WINDOW_MS) {
        log('replay_window_exceeded', { skew_ms: skew, request_id: 'cal:replay', trigger: 'stale_event' });
        return new Response(JSON.stringify({ ok: true, stale: true, skew_ms: skew }), { status: 200, headers: baseHeaders });
      }
    }
  }

  const triggerEvent = body.triggerEvent || body.event || 'unknown';
  const payload = body.payload || body.data || {};
  const request_id = payload.uid || payload.bookingId || payload.iCalUID || payload.id || crypto.randomUUID();

  const record = {
    tab_source: 'bookings',
    request_id: 'cal:' + request_id,
    cal_uid: payload.uid || '',
    cal_booking_id: payload.bookingId || '',
    cal_ical_uid: payload.iCalUID || '',
    submitted_at: new Date().toISOString(),
    name: payload.attendees?.[0]?.name || payload.attendee?.name || '',
    email: payload.attendees?.[0]?.email || payload.attendee?.email || '',
    attendees: Array.isArray(payload.attendees) ? payload.attendees.map(a => ({ name: a.name || '', email: a.email || '', timeZone: a.timeZone || '' })).slice(0, 10) : [],
    intent_text: triggerEvent + ' · ' + (payload.title || ''),
    notes: smartTruncate(payload, 2000),
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
    // Orphan-detect: RESCHEDULED/CANCELLED on a uid we never saw CREATED for
    if (!existing && (triggerEvent === 'BOOKING_RESCHEDULED' || triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_CANCELED')) {
      record.cal_orphan = true;
    }
    await env.FORM_SUBMISSIONS.put(`bookings:${record.request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
    // Bidirectional indexes — operator can lookup by Cal IDs without scan
    const indexValue = JSON.stringify({ kv_key: `bookings:${record.request_id}`, indexed_at: new Date().toISOString() });
    if (payload.uid) {
      await env.FORM_SUBMISSIONS.put(`cal-uid:${payload.uid}`, indexValue, { expirationTtl: 60 * 60 * 24 * 365 * 2 });
    }
    if (payload.bookingId) {
      await env.FORM_SUBMISSIONS.put(`cal-bid:${payload.bookingId}`, indexValue, { expirationTtl: 60 * 60 * 24 * 365 * 2 });
    }
    if (payload.iCalUID) {
      await env.FORM_SUBMISSIONS.put(`cal-ical:${payload.iCalUID}`, indexValue, { expirationTtl: 60 * 60 * 24 * 365 * 2 });
    }
    if (record.email) {
      await env.FORM_SUBMISSIONS.put(`email-bookings:${record.email.toLowerCase()}:${record.request_id}`, indexValue, { expirationTtl: 60 * 60 * 24 * 365 * 2 });
    }
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

export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': 'https://app.cal.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Cal-Signature-256',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  }
});

export const onRequest = async () => new Response(JSON.stringify({ error: 'method_not_allowed' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' }
});

function smartTruncate(payload, maxBytes) {
  // Phase 11 · keep top-level keys whole; truncate the value of the largest key first
  const keep = ['title', 'eventType', 'startTime', 'endTime', 'status', 'metadata', 'description', 'location', 'uid', 'bookingId', 'iCalUID'];
  const out = {};
  for (const k of keep) if (payload[k] !== undefined) out[k] = payload[k];
  let s = JSON.stringify(out);
  if (s.length <= maxBytes) return s;
  // Drop description first (often the largest)
  if (out.description) { delete out.description; s = JSON.stringify(out); }
  if (s.length <= maxBytes) return s;
  // Final hard cut at byte boundary, then JSON-end-cap fallback
  return s.slice(0, maxBytes - 12) + '..."truncated"';
}

function lifecycleStatus(trigger) {
  if (trigger === 'BOOKING_CANCELLED' || trigger === 'BOOKING_CANCELED') return 'CANCELLED';
  if (trigger === 'BOOKING_REJECTED') return 'REJECTED';
  if (trigger === 'BOOKING_REQUESTED') return 'REQUESTED';
  if (trigger === 'BOOKING_PAID' || trigger === 'BOOKING_PAYMENT_INITIATED') return 'PAID';
  if (trigger === 'BOOKING_NO_SHOW_UPDATED') return 'NO_SHOW';
  if (trigger === 'MEETING_STARTED') return 'IN_PROGRESS';
  if (trigger === 'MEETING_ENDED') return 'COMPLETED';
  if (trigger === 'MEETING_NO_ANSWER') return 'NO_ANSWER';
  if (trigger === 'FORM_SUBMITTED' || trigger === 'FORM_SUBMITTED_NO_EVENT') return 'FORM';
  if (trigger === 'OOO_CREATED') return 'OOO_CREATED';
  if (trigger === 'OOO_UPDATED') return 'OOO_UPDATED';
  if (trigger === 'RECORDING_TRANSCRIPTION_GENERATED') return 'TRANSCRIPTION';
  if (trigger === 'BOOKING_BUSY_TIMES_UPDATED') return 'BUSY_TIMES_UPDATED';
  return 'CONFIRMED';
}
function humanTrigger(trigger) {
  return String(trigger).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
async function sha256Hex(data) {
  const enc = new TextEncoder();
  const sig = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
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
