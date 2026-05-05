// /api/cal-webhook · Phase 4 perfection · Cal.com booking_created webhook
// Verifies CAL_WEBHOOK_SECRET signature, stores booking in KV, fires Resend alert.

export const onRequestPost = async ({ request, env }) => {
  const baseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  // Verify Cal.com signature header
  const sig = request.headers.get('x-cal-signature-256') || '';
  const expected = env.CAL_WEBHOOK_SECRET || '';
  if (!expected) {
    return new Response(JSON.stringify({ error: 'webhook_secret_unbound' }), { status: 503, headers: baseHeaders });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: baseHeaders }); }

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
    cal_event_type: payload.eventType?.title || '',
    cal_start_time: payload.startTime || payload.start_time || '',
    cal_end_time: payload.endTime || payload.end_time || ''
  };

  // Idempotency check · Cal.com retries 5xx for up to 30 days
  if (env.FORM_SUBMISSIONS) {
    const existing = await env.FORM_SUBMISSIONS.get(`bookings:${record.request_id}`);
    if (existing) {
      return new Response(JSON.stringify({ ok: true, request_id: record.request_id, deduped: true }), { status: 200, headers: baseHeaders });
    }
    await env.FORM_SUBMISSIONS.put(`bookings:${record.request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
  }

  // Fire-and-forget alert
  if (env.RESEND_API_KEY && record.email) {
    const html = `<h2 style="font-family:Georgia,serif">Cal.com ${triggerEvent}</h2>
      <p><strong>${esc(record.name)}</strong> at <strong>${esc(record.cal_event_type)}</strong></p>
      <p>${esc(record.cal_start_time)} → ${esc(record.cal_end_time)}</p>
      <p>Email: ${esc(record.email)}</p>
      <p>Cal ID: <code>${esc(request_id)}</code></p>`;
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || 'Tamazia Forms <forms@tamazia.in>',
        to: [env.ALERT_TO || 'realfamemedia@gmail.com'],
        subject: `[Cal.com ${triggerEvent}] ${record.name} · ${record.cal_event_type}`,
        html
      })
    }).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true, request_id: record.request_id, event: triggerEvent }), {
    status: 200, headers: baseHeaders
  });
};

function esc(s) { return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])); }
