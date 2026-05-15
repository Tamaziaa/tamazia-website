// /api/list-unsubscribe · Phase 9 hardened · RFC 8058 + HMAC-signed tokens
// Accepts both GET (List-Unsubscribe browser click) and POST (one-click).
// Token format: dsar-token signed payload { email, action: 'unsubscribe', request_id }
// Legacy support: ?id=<request_id> query parameter still honoured for emails
// already in the wild from before Phase 9.
import { mintToken, verifyToken } from '../_lib/dsar-token.js';

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const id = url.searchParams.get('id');
  return await unsubscribe(request, env, { token, id });
};

export const onRequestPost = async ({ request, env }) => {
  // RFC 8058 §3 · One-Click POST with body "List-Unsubscribe=One-Click"
  const url = new URL(request.url);
  let token = url.searchParams.get('token');
  let id = url.searchParams.get('id');
  // Some MUAs send the body URL-encoded
  try {
    const text = await request.text();
    if (text && text.includes('List-Unsubscribe=One-Click')) {
      // Honour as per RFC; token already from URL params
    }
  } catch {}
  return await unsubscribe(request, env, { token, id });
};

async function unsubscribe(request, env, { token, id }) {
  const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };
  if (!env.FORM_SUBMISSIONS) {
    if (request.method === 'POST') {
      // RFC 8058 §3: POST must return 200 OK regardless
      return new Response('unsubscribed', { status: 200, headers });
    }
    return Response.redirect('https://tamazia.co.uk/unsubscribed/?status=error&reason=kv_unbound', 303);
  }
  let email = null;
  let request_id = null;
  if (token) {
    const v = await verifyToken(token, env);
    if (!v.ok) {
      return Response.redirect(`https://tamazia.co.uk/unsubscribed/?status=error&reason=${encodeURIComponent(v.reason)}`, 303);
    }
    if (v.payload.action !== 'unsubscribe') {
      return Response.redirect('https://tamazia.co.uk/unsubscribed/?status=error&reason=wrong_action', 303);
    }
    email = v.payload.email;
    request_id = v.payload.request_id;
  } else if (id) {
    // Legacy path · find KV record by request_id and delete
    request_id = id;
    const list = await env.FORM_SUBMISSIONS.list({ prefix: 'briefings:' });
    for (const k of list.keys) {
      if (k.name.endsWith(':' + request_id)) {
        const v = await env.FORM_SUBMISSIONS.get(k.name);
        try { email = JSON.parse(v).email; } catch {}
        await env.FORM_SUBMISSIONS.delete(k.name);
        break;
      }
    }
  } else {
    if (request.method === 'POST') {
      return new Response('unsubscribed', { status: 200, headers });
    }
    return Response.redirect('https://tamazia.co.uk/unsubscribed/?status=error&reason=missing_token', 303);
  }

  // Audit log of unsubscribe (13-month retention per ICO guidance evidence)
  const auditKey = `unsub-log:${Date.now()}:${crypto.randomUUID().slice(0,16)}`;
  await env.FORM_SUBMISSIONS.put(auditKey, JSON.stringify({
    email_hash: email ? await hashEmail(email) : null,
    request_id,
    at: new Date().toISOString(),
    via: token ? 'token' : 'legacy_id',
    method: request.method
  }), { expirationTtl: 60 * 60 * 24 * 30 * 13 }).catch(() => {});

  // Phase 12 · O(1) lookup via email-briefings reverse index (legacy prefix scan as fallback)
  if (email) {
    // Try reverse index first
    const idxList = await env.FORM_SUBMISSIONS.list({ prefix: `email-briefings:${email.toLowerCase()}:`, limit: 100 });
    if (idxList.keys.length) {
      for (const k of idxList.keys) {
        const v = await env.FORM_SUBMISSIONS.get(k.name);
        if (!v) continue;
        try {
          const r = JSON.parse(v);
          if (r.kv_key) await env.FORM_SUBMISSIONS.delete(r.kv_key);
        } catch {}
        await env.FORM_SUBMISSIONS.delete(k.name);
      }
    } else {
      // Fallback for pre-Phase-12 records that have no reverse index
      const list = await env.FORM_SUBMISSIONS.list({ prefix: 'briefings:' });
      for (const k of list.keys) {
      const v = await env.FORM_SUBMISSIONS.get(k.name);
      if (!v) continue;
      try {
        const r = JSON.parse(v);
        if ((r.email || '').toLowerCase() === email.toLowerCase()) {
          await env.FORM_SUBMISSIONS.delete(k.name);
        }
      } catch {}
      }
    }
  }

  if (request.method === 'POST') {
    // RFC 8058 §3: one-click unsubscribe POST must return 200 OK
    return new Response('unsubscribed', { status: 200, headers });
  }
  return Response.redirect('https://tamazia.co.uk/unsubscribed/', 303);
}

async function hashEmail(email) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(email.toLowerCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Helper · mint a fresh unsubscribe token (used by auto-ack)
export async function mintUnsubscribeToken(email, request_id, env) {
  return mintToken({ email, action: 'unsubscribe', request_id }, env, 365 * 24 * 60 * 60);
}

export const onRequestOptions = () => new Response(null, {
  status: 204,
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
});
