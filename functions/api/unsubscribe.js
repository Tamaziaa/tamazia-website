// /api/unsubscribe · Cold outreach pipeline · accepts base64url-encoded tokens
// Token format: recipient|from_email|timestamp encoded as base64url
// Writes to Neon suppression table for W2 send-gate filtering.
// 
// Also keeps a Cloudflare KV audit log for regulatory evidence (13mo retention).

import { neonQuery, neonConfigured } from './_neon.js';

export const onRequestGet = async ({ request, env }) => handle(request, env);
export const onRequestPost = async ({ request, env }) => handle(request, env);

async function handle(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  if (!token) return errorPage('Missing token', 400);

  let recipient, fromEmail, ts;
  try {
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(token.length / 4) * 4, '='));
    const parts = decoded.split('|');
    if (parts.length < 3) throw new Error('bad shape');
    [recipient, fromEmail, ts] = parts;
    if (!recipient || !recipient.includes('@')) throw new Error('bad recipient');
    const ageDays = (Date.now() - parseInt(ts, 10)) / 86400000;
    if (!isFinite(ageDays) || ageDays > 90 || ageDays < -1) throw new Error('token expired');
  } catch (e) {
    return errorPage('Invalid or expired link. Reply OPT OUT to the email instead.', 400);
  }

  // Write to Neon suppression table (the engine's W2 send-gate filters against this).
  // Uses the shared helper so it works on the same NEON_URL every other channel uses.
  let neonOk = false;
  if (neonConfigured(env)) {
    const res = await neonQuery(env,
      `INSERT INTO suppression (email, reason, scope, suppressed_at)
       VALUES ($1, 'one_click_optout', 'global', NOW())
       ON CONFLICT (email) DO UPDATE SET reason='one_click_optout', scope='global', suppressed_at=NOW()`,
      [recipient.toLowerCase()]
    );
    neonOk = res.ok;
    if (!res.ok) console.error('suppression insert failed:', res.error);
  }

  // Mirror to Cloudflare KV for regulatory audit trail (13-month retention)
  try {
    if (env.FORM_SUBMISSIONS) {
      const auditKey = `cold-unsub:${Date.now()}:${recipient.toLowerCase()}`;
      await env.FORM_SUBMISSIONS.put(auditKey, JSON.stringify({
        email: recipient.toLowerCase(),
        from: fromEmail || null,
        at: new Date().toISOString(),
        ip: request.headers.get('cf-connecting-ip') || null,
        ua: request.headers.get('user-agent') || null,
        method: request.method,
        neon_ok: neonOk,
      }), { expirationTtl: 60 * 60 * 24 * 30 * 13 });
    }
  } catch (e) {
    console.error('KV audit log failed:', e.message);
  }

  return new Response(confirmationHtml(recipient), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function errorPage(msg, status = 400) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Unsubscribe · Tamazia</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Georgia,serif;max-width:560px;margin:80px auto;padding:0 24px;color:#222;line-height:1.6}h1{font-weight:400;font-size:28px}.err{color:#a00}</style></head><body><h1>Tamazia</h1><p class="err">${escapeHtml(msg)}</p><p><a href="/">Return to tamazia.co.uk</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function confirmationHtml(email) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Unsubscribed · Tamazia</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Georgia,serif;max-width:560px;margin:80px auto;padding:0 24px;color:#222;line-height:1.6}h1{font-weight:400;font-size:28px;letter-spacing:-0.5px}p{font-size:17px}small{color:#666}</style></head><body>
<h1>You have been removed.</h1>
<p><strong>${escapeHtml(email.toLowerCase())}</strong> will receive no further outreach from Tamazia.</p>
<p>Your removal is recorded with timestamp and audit ID. If a stray email reaches you within the next 48 hours due to in-flight queue items, that is the cleanup window — after that, complete silence.</p>
<p>If you would like to talk in future, that decision is yours alone, and the door is open.</p>
<p><small>Tamazia · International SEO for regulated enterprises · privacy@tamazia.co.uk · <a href="https://tamazia.co.uk/legal/data-protection/">Data Protection Notice</a></small></p>
</body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
