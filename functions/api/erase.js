// /api/erase · Phase 8 · UK GDPR Article 17 + EU GDPR Article 17 right to erasure
// Two-step: POST { email } → email signed link · GET ?token=... → deletes all matching records
import { mintToken, verifyToken } from '../_lib/dsar-token.js';
import { validateEmail, shouldRejectEmail } from '../_lib/email-validator.js';
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
  const token = await mintToken({ email, action: 'erase' }, env);
  const link = `https://tamazia.co.uk/api/erase?token=${encodeURIComponent(token)}`;

  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || 'Tamazia DPO <dpo@tamazia.in>',
        to: [email],
        reply_to: 'dpo@tamazia.co.uk',
        subject: 'Data erasure request · Tamazia Ltd',
        html: `<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">
          <p>Hello,</p>
          <p>Tamazia received your data erasure request under UK GDPR Article 17. To complete the request, click the link below within seven days. <strong>This action is irreversible.</strong></p>
          <p><a href="${link}">Confirm erasure</a></p>
          <p>If you did not request this, ignore this email.</p>
          <p>Tamazia Data Protection Office<br>dpo@tamazia.co.uk</p>
        </div>`
      })
    });
  }
  // Founder alert (non-blocking): a UK GDPR Art.17 erasure request was filed.
  const fb = notifyFounder(env, {
    level: 'p1',
    summary: '[DSAR] Data ERASURE request · ' + email,
    detailTg: '<b>Article:</b> UK GDPR Art.17 (erasure)\n<b>Subject:</b> ' + email + '\n<b>Note:</b> irreversible once the subject confirms',
    subject: '[DSAR] Data erasure request · ' + email,
  });
  if (context.waitUntil) context.waitUntil(fb); else await fb;
  return new Response(JSON.stringify({ ok: true, message: 'Confirmation email sent. Click the link within seven days.' }), { status: 200, headers });
};

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const v = await verifyToken(token, env);
  if (!v.ok) {
    return Response.redirect(`https://tamazia.co.uk/erased/?status=error&reason=${encodeURIComponent(v.reason)}`, 302);
  }
  if (v.payload.action !== 'erase') {
    return Response.redirect('https://tamazia.co.uk/erased/?status=error&reason=wrong_action', 302);
  }
  if (!env.FORM_SUBMISSIONS) {
    return Response.redirect('https://tamazia.co.uk/erased/?status=error&reason=kv_unbound', 302);
  }

  const email = v.payload.email;

  // LEGAL_HOLD env list · halt erasure for emails on hold (Article 17(3)(b) defence of legal claims)
  const legalHold = (env.LEGAL_HOLD_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (legalHold.includes(email)) {
    return Response.redirect('https://tamazia.co.uk/erased/?status=error&reason=legal_hold', 303);
  }

  let deleted = 0;

  // Phase 1 · primary records across 4 tabs · parallel ACROSS tabs and within
  // Phase 12 · also matches name+company composite (handles same-person multiple-emails case)
  const compositeKey = v.payload.composite_key || null;  // {name_norm, company_norm}
  function normalise(s) { return (s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  const tabResults = await Promise.all(['contact', 'briefings', 'audit', 'bookings'].map(async tab => {
    let cursor = null;
    let tabMatches = [];
    do {
      const list = await env.FORM_SUBMISSIONS.list({ prefix: tab + ':', limit: 1000, cursor });
      const checks = await Promise.all(list.keys.map(k => env.FORM_SUBMISSIONS.get(k.name).then(v => ({ k, v }))));
      for (const { k, v: value } of checks) {
        if (!value) continue;
        try {
          const r = JSON.parse(value);
          const emailMatch = (r.email || '').toLowerCase() === email;
          const compositeMatch = compositeKey
            && normalise(r.name) === compositeKey.name_norm
            && normalise(r.company) === compositeKey.company_norm
            && compositeKey.name_norm
            && compositeKey.company_norm;
          if (emailMatch || compositeMatch) tabMatches.push(k.name);
        } catch {}
      }
      cursor = list.list_complete ? null : list.cursor;
    } while (cursor);
    if (tabMatches.length) await Promise.all(tabMatches.map(name => env.FORM_SUBMISSIONS.delete(name)));
    return tabMatches.length;
  }));
  deleted = tabResults.reduce((a, n) => a + n, 0);

  // Phase 2 · clean reverse indexes (cal-uid, cal-bid, cal-ical, email-bookings)
  const emailBookings = await env.FORM_SUBMISSIONS.list({ prefix: `email-bookings:${email}:`, limit: 1000 });
  await Promise.all(emailBookings.keys.map(k => env.FORM_SUBMISSIONS.delete(k.name)));

  // The cal-uid/bid/ical reverse keys point at bookings:* records that are now deleted.
  // Sweep with cursor pagination so all entries are checked even beyond 1000.
  await Promise.all(['cal-uid:', 'cal-bid:', 'cal-ical:'].map(async prefix => {
    let cursor = null;
    do {
      const list = await env.FORM_SUBMISSIONS.list({ prefix, limit: 1000, cursor });
      const sweeps = await Promise.all(list.keys.map(async k => {
        const v = await env.FORM_SUBMISSIONS.get(k.name);
        if (!v) return null;
        try {
          const r = JSON.parse(v);
          const target = r.kv_key;
          if (target && target.startsWith('bookings:')) {
            const exists = await env.FORM_SUBMISSIONS.get(target);
            if (!exists) return k.name;  // dangling reverse index
          }
        } catch {}
        return null;
      }));
      const toDelete = sweeps.filter(Boolean);
      if (toDelete.length) await Promise.all(toDelete.map(name => env.FORM_SUBMISSIONS.delete(name)));
      cursor = list.list_complete ? null : list.cursor;
    } while (cursor);
  }));

  // Phase 3 · send completion email if Resend bound · Phase 12 · failure → retry queue
  if (env.RESEND_API_KEY && email) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || 'Tamazia Ltd · DPO <dpo@tamazia.in>',
        to: [email],
        reply_to: 'dpo@tamazia.co.uk',
        subject: 'Erasure complete · Tamazia Ltd',
        html: `<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">
          <p>Hello,</p>
          <p>Your erasure request under UK GDPR Article 17 is complete. Tamazia Ltd has deleted ${deleted} records associated with your email address.</p>
          <p>Tamazia Ltd retains an audit log of this erasure (without your email content) for seven years to evidence compliance with the regulation.</p>
          <p>Tamazia Ltd · Data Protection Office<br>dpo@tamazia.co.uk</p>
        </div>`
      })
    }).then(r => {
      if (!r.ok) {
        // Phase 12 · queue retry record
        const retryKey = `resend-retry:${Date.now()}:${crypto.randomUUID().slice(0,16)}`;
        env.FORM_SUBMISSIONS.put(retryKey, JSON.stringify({
          at: new Date().toISOString(),
          context: 'erase_completion',
          email_hash: hashEmailSync(email),
          deleted,
          http_status: r.status,
          retries: 0
        }), { expirationTtl: 60 * 60 * 24 * 7 }).catch(() => {});
      }
    }).catch(err => {
      const retryKey = `resend-retry:${Date.now()}:${crypto.randomUUID().slice(0,16)}`;
      env.FORM_SUBMISSIONS.put(retryKey, JSON.stringify({
        at: new Date().toISOString(),
        context: 'erase_completion',
        email_hash_pending: true,
        deleted,
        error: String(err).slice(0, 200),
        retries: 0
      }), { expirationTtl: 60 * 60 * 24 * 7 }).catch(() => {});
    });
  }

  // Audit-log the erasure (separate KV key, not deletable by user)
  const auditKey = `erase-log:${Date.now()}:${crypto.randomUUID()}`;
  await env.FORM_SUBMISSIONS.put(auditKey, JSON.stringify({
    email_hash: await hashEmail(email),
    deleted,
    at: new Date().toISOString(),
    article: 'UK GDPR Article 17',
    iss: 'token verified'
  }), { expirationTtl: 60 * 60 * 24 * 365 * 7 });  // 7 years for audit

  return Response.redirect(`https://tamazia.co.uk/erased/?status=success&deleted=${deleted}`, 302);
};

function hashEmailSync(email) { return (email || '').toLowerCase().slice(0, 16); }

async function hashEmail(email) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(email));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export const onRequestOptions = () => new Response(null, {
  status: 204,
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
});
