// /api/portability · Phase 8 · UK GDPR Article 20 · right to data portability
// Same flow as /api/dsar but returns CSV format suitable for migration to another controller.
import { mintToken, verifyToken } from '../_lib/dsar-token.js';

export const onRequestPost = async ({ request, env }) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers }); }
  const email = (body.email || '').toString().toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), { status: 400, headers });
  }
  if (!env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'admin_secret_unbound' }), { status: 503, headers });
  }
  const token = await mintToken({ email, action: 'portability' }, env);
  const link = `https://tamazia.co.uk/api/portability?token=${encodeURIComponent(token)}`;
  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || 'Tamazia DPO <dpo@tamazia.in>',
        to: [email],
        reply_to: 'dpo@tamazia.co.uk',
        subject: 'Data portability request · Tamazia',
        html: `<p>Click within 7 days to receive a structured machine-readable export under UK GDPR Article 20: <a href="${link}">${link}</a></p>`
      })
    });
  }
  return new Response(JSON.stringify({ ok: true, message: 'Confirmation email sent. Click within seven days.' }), { status: 200, headers });
};

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const v = await verifyToken(token, env);
  if (!v.ok) return new Response(JSON.stringify({ error: v.reason }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  if (v.payload.action !== 'portability') return new Response(JSON.stringify({ error: 'wrong_action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!env.FORM_SUBMISSIONS) return new Response(JSON.stringify({ error: 'kv_unbound' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

  const email = v.payload.email;
  const records = [];
  for (const tab of ['contact', 'briefings', 'audit', 'bookings']) {
    const list = await env.FORM_SUBMISSIONS.list({ prefix: tab + ':', limit: 1000 });
    for (const k of list.keys) {
      const value = await env.FORM_SUBMISSIONS.get(k.name);
      if (!value) continue;
      try {
        const r = JSON.parse(value);
        if ((r.email || '').toLowerCase() === email) records.push(r);
      } catch {}
    }
  }

  // Build a CSV (Article 20 requires structured, commonly used, machine-readable)
  const headers = ['submitted_at', 'tab_source', 'request_id', 'name', 'email', 'company', 'role', 'country', 'intent_text', 'utm_source', 'utm_medium', 'utm_campaign', 'ip_country', 'ip_truncated', 'ua', 'referer'];
  const rows = [headers.join(',')];
  for (const r of records) {
    rows.push(headers.map(h => JSON.stringify((r[h] || '').toString())).join(','));
  }
  const csv = rows.join('\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tamazia-portability-${email}-${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
};

export const onRequestOptions = () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
