// /api/cal-webhook · Phase 5 perfection · Cal.com booking lifecycle webhook
// Verifies the x-cal-signature-256 header (HMAC-SHA256 of raw body using
// CAL_WEBHOOK_SECRET) before persisting the booking record to KV under
// `bookings:cal:<uid>` with a 2-year TTL. Fires a Resend alert for visibility.
// Idempotent: Cal.com retries 5xx responses for up to 30 days, so we dedupe
// on the booking uid before writing.
//
// Triggers handled: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED.

export const onRequestPost = async ({ request, env }) => {
  const baseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  const expected = env.CAL_WEBHOOK_SECRET || '';
  if (!expected) {
    return new Response(JSON.stringify({ error: 'webhook_secret_unbound' }), { status: 503, headers: baseHeaders });
  }

  // Read the raw body so we can verify the HMAC against it before parsing.
  const rawBody = await request.text();

  const sigHeader = request.headers.get('x-cal-signature-256') || '';
  const computed = await hmacSha256Hex(expected, rawBody);
  if (!sigHeader || !timingSafeEqual(sigHeader, computed)) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401, headers: baseHeaders });
  }

  let body;
  try { body = JSON.parse(rawBody); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: baseHeaders });
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
    cal_status: payload.status || (triggerEvent === 'BOOKING_CANCELLED' ? 'CANCELLED' : 'CONFIRMED'),
    cal_trigger: triggerEvent
  };

  // Idempotency check on the lifecycle key. We allow rescheduled/cancelled events
  // to overwrite the record (those are different triggers but the same booking uid).
  if (env.FORM_SUBMISSIONS) {
    const existing = await env.FORM_SUBMISSIONS.get(`bookings:${record.request_id}`);
    if (existing && triggerEvent === 'BOOKING_CREATED') {
      return new Response(JSON.stringify({ ok: true, request_id: record.request_id, deduped: true }), { status: 200, headers: baseHeaders });
    }
    await env.FORM_SUBMISSIONS.put(`bookings:${record.request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
  }

  // Fire-and-forget alert
  if (env.RESEND_API_KEY && record.email) {
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
        subject: `[Cal.com ${triggerEvent}] ${record.name || 'unknown'} · ${record.cal_event_type || 'strategy-call'}`,
        html
      })
    }).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true, request_id: record.request_id, event: triggerEvent }), {
    status: 200, headers: baseHeaders
  });
};

// Reject GET so accidental browser hits show 405 instead of leaking handler details.
export const onRequest = async () => new Response(JSON.stringify({ error: 'method_not_allowed' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
});

async function hmacSha256Hex(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
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
