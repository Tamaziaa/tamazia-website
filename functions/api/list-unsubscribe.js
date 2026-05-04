// /api/list-unsubscribe · RFC 8058 One-Click Unsubscribe
// 2024 Bulk Sender Compliance · Gmail and Yahoo enforce
// Returns 200 with empty body on POST · idempotent

export const onRequestPost = async ({ request, env }) => {
  let body;
  try {
    body = await request.formData();
  } catch {
    body = null;
  }
  const id = body?.get('id') || new URL(request.url).searchParams.get('id') || 'unknown';

  // Forward to Apps Script for sheet append (errors tab + suppression list)
  if (env.SHEETS_WEBHOOK_URL && env.SHEETS_HMAC_SECRET) {
    const payload = JSON.stringify({
      tab_source: 'errors',
      request_id: id,
      notes: 'List-Unsubscribe One-Click triggered',
      consent_legal_basis: 'withdrawn',
      consent_timestamp: new Date().toISOString()
    });
    const sig = await hmacHex(payload, env.SHEETS_HMAC_SECRET);
    try {
      await fetch(env.SHEETS_WEBHOOK_URL + '?sig=' + sig, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    } catch { /* fire-and-forget */ }
  }

  return new Response('', { status: 200, headers: { 'Cache-Control': 'no-store' } });
};

export const onRequestGet = async ({ request, env }) => {
  // Browser-friendly fallback · RFC 8058 also requires List-Unsubscribe URL to work via GET
  const id = new URL(request.url).searchParams.get('id') || 'unknown';
  const html = `<!doctype html><meta charset="utf-8"><title>Unsubscribed · Tamazia</title>
<style>body{font-family:Georgia,serif;color:#2A0C14;background:#FAF7F2;padding:64px 24px;text-align:center}h1{font-weight:500}</style>
<h1>You have been unsubscribed.</h1><p>Reference <code>${id.slice(0,8)}</code>.</p><p>If this was unintentional, write to <a href="mailto:founder@tamazia.co.uk">founder@tamazia.co.uk</a>.</p>`;
  // Also log
  if (env.SHEETS_WEBHOOK_URL && env.SHEETS_HMAC_SECRET) {
    const payload = JSON.stringify({
      tab_source: 'errors',
      request_id: id,
      notes: 'List-Unsubscribe via GET',
      consent_legal_basis: 'withdrawn',
      consent_timestamp: new Date().toISOString()
    });
    const sig = await hmacHex(payload, env.SHEETS_HMAC_SECRET);
    try {
      await fetch(env.SHEETS_WEBHOOK_URL + '?sig=' + sig, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    } catch { /* fire-and-forget */ }
  }
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
};

async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
