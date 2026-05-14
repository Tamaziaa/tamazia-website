// /api/dsar · Phase 8 · UK GDPR Article 15 + EU GDPR Article 15 right of access
// Two-step flow:
//   1. POST { email } → mints a signed token, emails it to the data subject's address
//   2. GET ?token=... → returns JSON of all KV records matching email
//
// Why two-step: prevents anyone from enumerating someone else's data by guessing.
// Token signed with HMAC + ADMIN_SECRET, 7-day TTL.
import { mintToken, verifyToken } from '../_lib/dsar-token.js';
import { validateEmail, shouldRejectEmail } from '../_lib/email-validator.js';

export const onRequestPost = async ({ request, env }) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers }); }
  const email = (body.email || '').toString().toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), { status: 400, headers });
  }
  // Phase 10 · email validator gate (reject disposable on DSAR endpoints to prevent abuse)
  const validation = await validateEmail(email, env);
  const reject = shouldRejectEmail(validation, env);
  if (reject.reject) {
    return new Response(JSON.stringify({ error: 'email_check_failed', reason: reject.reason }), { status: 422, headers });
  }
  if (!env.ADMIN_SECRET && !env.DSAR_SIGNING_SECRET) {
    return new Response(JSON.stringify({ error: 'admin_secret_unbound' }), { status: 503, headers });
  }
  const token = await mintToken({ email, action: 'access' }, env);
  const link = `https://tamazia.co.uk/api/dsar?token=${encodeURIComponent(token)}`;

  // Email the data subject the signed link
  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || 'Tamazia DPO <dpo@tamazia.in>',
        to: [email],
        reply_to: 'dpo@tamazia.co.uk',
        subject: 'Data access request · Tamazia Ltd',
        html: `<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">
          <p>Hello,</p>
          <p>Tamazia received your data access request under UK GDPR Article 15. To complete the request, click the link below within seven days.</p>
          <p><a href="${link}">Confirm access request</a></p>
          <p>If you did not request this, you may ignore this email and no data will be shared.</p>
          <p>Best regards,<br>Tamazia Data Protection Office<br>dpo@tamazia.co.uk</p>
        </div>`
      })
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    message: 'A confirmation email has been sent to the address. Click the link in that email to retrieve your data. The link is valid for seven days.'
  }), { status: 200, headers });
};

export const onRequestGet = async ({ request, env }) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const v = await verifyToken(token, env);
  if (!v.ok) {
    return new Response(JSON.stringify({ error: v.reason }), { status: 401, headers });
  }
  if (v.payload.action !== 'access') {
    return new Response(JSON.stringify({ error: 'wrong_action' }), { status: 400, headers });
  }
  if (!env.FORM_SUBMISSIONS) {
    return new Response(JSON.stringify({ error: 'kv_unbound' }), { status: 503, headers });
  }

  const email = v.payload.email;
  const records = [];
  for (const tab of ['contact', 'briefings', 'audit', 'bookings']) {
    const list = await env.FORM_SUBMISSIONS.list({ prefix: tab + ':', limit: 1000 });
    for (const k of list.keys) {
      const value = await env.FORM_SUBMISSIONS.get(k.name);
      if (!value) continue;
      try {
        const r = JSON.parse(value);
        if ((r.email || '').toLowerCase() === email) {
          // Phase 11 · explicit allowlist (no spread) prevents future field leaks
          records.push({
            submitted_at: r.submitted_at,
            tab_source: r.tab_source,
            request_id: r.request_id,
            name: r.name,
            email: r.email,
            company: r.company,
            role: r.role,
            country: r.country,
            intent_text: r.intent_text,
            utm_source: r.utm_source,
            utm_medium: r.utm_medium,
            utm_campaign: r.utm_campaign,
            ip_country: r.ip_country,
            email_validation: r.email_validation,
            cal_event_type: r.cal_event_type,
            cal_start_time: r.cal_start_time,
            cal_end_time: r.cal_end_time,
            cal_status: r.cal_status,
            cal_trigger: r.cal_trigger,
            attendees: r.attendees
          });
        }
      } catch {}
    }
  }

  return new Response(JSON.stringify({
    article: 'UK GDPR Article 15',
    data_subject: email,
    fulfilled_at: new Date().toISOString(),
    records,
    count: records.length
  }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="dsar-${email}-${new Date().toISOString().slice(0,10)}.json"` } });
};

export const onRequestOptions = () => new Response(null, {
  status: 204,
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
});
