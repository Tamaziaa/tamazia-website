// /api/stripe/webhook · Stripe webhook receiver for add-on subscriptions.
// Verifies the `Stripe-Signature` header (HMAC-SHA256 over `t.payload` via WebCrypto,
// because the Stripe Node SDK is unavailable on the Workers runtime), then on
// `checkout.session.completed` writes a row to Neon `addon_orders` and notifies.
//
// GO-LIVE DEPS (not set yet): STRIPE_WEBHOOK_SECRET (whsec_...). Until it is bound this
// endpoint no-ops cleanly: it returns 401 and never trusts an unverified event. No keys,
// no writes, no errors. It goes live untouched the moment the secret is bound.
//
// Neon migration (run once by the founder, DO NOT auto-run against prod):
//
//   CREATE TABLE IF NOT EXISTS addon_orders (
//     id             BIGSERIAL PRIMARY KEY,
//     stripe_session TEXT UNIQUE,              -- Checkout Session id (idempotency)
//     stripe_customer TEXT,
//     subscription   TEXT,
//     addon_key      TEXT,
//     addon_name     TEXT,
//     audit_domain   TEXT,
//     company        TEXT,
//     customer_email TEXT,
//     amount_total   INTEGER,                  -- minor units (pence)
//     currency       TEXT,
//     status         TEXT,                     -- e.g. 'complete'
//     created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
//   );
//   CREATE INDEX IF NOT EXISTS addon_orders_created_idx ON addon_orders (created_at DESC);

import { neonQuery, neonConfigured } from '../_neon.js';
import { notifySlack, notifyTelegram } from '../../_lib/notify.js';

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const clip = (v, n = 300) => (v == null ? '' : String(v)).slice(0, n);

// Constant-time-ish hex compare.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function toHex(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

// Verify Stripe's signature header: "t=<ts>,v1=<sig>,v1=<sig2>,...".
// signed_payload = `${t}.${rawBody}` ; HMAC-SHA256 with the endpoint secret.
async function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300, nowMs = Date.now()) {
  if (!header || !secret) return false;
  let t = null;
  const sigs = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') t = v;
    else if (k === 'v1') sigs.push(v);
  }
  if (!t || !sigs.length) return false;
  // replay window
  const ts = parseInt(t, 10);
  if (!isFinite(ts) || Math.abs(Math.floor(nowMs / 1000) - ts) > toleranceSec) return false;

  const enc = new TextEncoder();
  const cryptoObj = (globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : null;
  if (!cryptoObj) return false;
  const keyData = await cryptoObj.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await cryptoObj.subtle.sign('HMAC', keyData, enc.encode(`${t}.${rawBody}`));
  const expected = toHex(mac);
  return sigs.some((s) => timingSafeEqual(s, expected));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Unverified webhooks are never trusted.
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ ok: false, error: 'webhook_not_configured' }, 401);

  const sig = request.headers.get('stripe-signature') || '';
  const raw = await request.text();

  const valid = await verifyStripeSignature(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return json({ ok: false, error: 'bad_signature' }, 400);

  let event;
  try { event = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  // We only persist completed checkouts; ack everything else 200 so Stripe stops retrying.
  if (!event || event.type !== 'checkout.session.completed') {
    return json({ ok: true, ignored: event ? event.type : 'unknown' });
  }

  const s = (event.data && event.data.object) || {};
  const md = s.metadata || {};
  const order = {
    stripe_session: clip(s.id, 120),
    stripe_customer: clip(typeof s.customer === 'string' ? s.customer : (s.customer && s.customer.id), 120),
    subscription: clip(typeof s.subscription === 'string' ? s.subscription : (s.subscription && s.subscription.id), 120),
    addon_key: clip(md.addon_key, 64),
    addon_name: clip(md.addon_name, 200),
    audit_domain: clip(md.audit_domain, 200),
    company: clip(md.company, 200),
    customer_email: clip((s.customer_details && s.customer_details.email) || s.customer_email, 200),
    amount_total: Number.isFinite(s.amount_total) ? s.amount_total : null,
    currency: clip(s.currency, 8),
    status: clip(s.status || 'complete', 32),
  };

  let saved = false, dbError = null;
  if (neonConfigured(env)) {
    // idempotent on the session id
    const sql = `INSERT INTO addon_orders
      (stripe_session, stripe_customer, subscription, addon_key, addon_name, audit_domain,
       company, customer_email, amount_total, currency, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (stripe_session) DO NOTHING
      RETURNING id`;
    const params = [
      order.stripe_session, order.stripe_customer, order.subscription, order.addon_key,
      order.addon_name, order.audit_domain, order.company, order.customer_email,
      order.amount_total, order.currency, order.status,
    ];
    const r = await neonQuery(env, sql, params);
    saved = r.ok;
    if (!r.ok) dbError = r.error;
  } else {
    dbError = 'neon_unconfigured';
  }

  if (context.waitUntil) {
    const amt = order.amount_total != null ? `${(order.amount_total / 100).toFixed(0)} ${(order.currency || 'gbp').toUpperCase()}` : '';
    const summary = `Add-on purchased · ${order.addon_name || order.addon_key}${amt ? ' · ' + amt : ''}`;
    const detail = [
      `*Add-on:* ${order.addon_name || order.addon_key}`,
      order.company && `*Company:* ${order.company}`,
      order.audit_domain && `*Audit:* ${order.audit_domain}`,
      order.customer_email && `*Email:* ${order.customer_email}`,
      amt && `*Amount:* ${amt}/mo`,
      `*Subscription:* ${order.subscription || 'n/a'}`,
      !saved && `:warning: NOT persisted (${dbError}). Run the addon_orders migration.`,
    ].filter(Boolean).join('\n');
    context.waitUntil(Promise.allSettled([
      notifySlack(env, { level: 'ok', summary, detail }),
      notifyTelegram(env, { level: 'ok', summary, detail }),
    ]));
  }

  // Always 200 on a verified event so Stripe does not retry a row we already have.
  return json({ ok: true, saved });
}
