// /api/portability · Phase 8 · UK GDPR Article 20 · right to data portability
// Same flow as /api/dsar but returns CSV format suitable for migration to another controller.
import { mintToken, verifyToken } from '../_lib/dsar-token.js';
import { validateEmail, shouldRejectEmail } from '../_lib/email-validator.js';
import { csvFromObjects } from '../_lib/csv.js';
import { notifyFounder } from '../_lib/notify.js';

export const onRequestPost = async (context) => {
  const { request, env } = context;
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
        subject: 'Data portability request · Tamazia Ltd',
        html: `<p>Click within 7 days to receive a structured machine-readable export under UK GDPR Article 20: <a href="${link}">${link}</a></p>`
      })
    });
  }
  // Founder alert (non-blocking): a UK GDPR Art.20 portability/export request was filed.
  const fb = notifyFounder(env, {
    level: 'p1',
    summary: '[DSAR] Data PORTABILITY request · ' + email,
    detailTg: '<b>Article:</b> UK GDPR Art.20 (portability)\n<b>Subject:</b> ' + email,
    subject: '[DSAR] Data portability request · ' + email,
  });
  if (context.waitUntil) context.waitUntil(fb); else await fb;
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
  // Phase 9 · dynamic columns derived from union of all keys + RFC 4180 + optional BOM
  const wantBom = url.searchParams.get('bom') === '1';
  const allKeys = new Set();
  for (const r of records) for (const k of Object.keys(r)) if (k !== '_kv_key') allKeys.add(k);
  // Stable ordering: known fields first, unknown alphabetical
  const knownOrder = ['submitted_at', 'tab_source', 'request_id', 'name', 'email', 'company', 'role', 'country', 'intent_text', 'utm_source', 'utm_medium', 'utm_campaign', 'ip_country', 'ip_truncated', 'ua', 'referer', 'cal_event_type', 'cal_start_time', 'cal_end_time', 'cal_status', 'cal_trigger', 'email_validation'];
  const known = knownOrder.filter(k => allKeys.has(k));
  const unknown = [...allKeys].filter(k => !knownOrder.includes(k)).sort();
  const columns = [...known, ...unknown];
  // Hash filename to avoid leaking email in Downloads folder · compute SHA-256 once
  const emailDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
  const filenameHash = Array.from(new Uint8Array(emailDigest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  const csv = csvFromObjects(records, columns, { bom: wantBom });
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tamazia-portability-${filenameHash}-${new Date().toISOString().slice(0,10)}.csv"`,
      'Cache-Control': 'no-store'
    }
  });
};

export const onRequestOptions = () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
