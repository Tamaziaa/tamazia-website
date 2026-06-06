// /api/stripe/checkout · create a Stripe Checkout Session for an audit add-on.
// The plan pane's `data-addon` button POSTs { addon, audit_domain, company, ... }.
// We map the add-on -> Stripe price_id (functions/audit/_commerce.js, from env),
// create a subscription Checkout Session via the Stripe REST API (no SDK, because the
// Workers runtime has no Node), and return { ok, url } for the client to redirect to.
//
// NO STRIPE KEY IS SET TODAY. When STRIPE_SECRET_KEY (or the per-add-on STRIPE_PRICE_*
// id) is absent, this endpoint does NOT error: it returns HTTP 200 with
// { ok:false, fallback:true, addon, reason } so the client opens the intake modal with
// that add-on preselected instead of hitting a broken redirect. The Stripe path below is
// kept fully correct so it goes live the moment the keys are bound, no further code change.
//
// GO-LIVE DEPS (not set yet): STRIPE_SECRET_KEY + the STRIPE_PRICE_* ids in _commerce.js.
// Optional: SITE_ORIGIN (defaults to the request origin) for success/cancel URLs.

import { addonKey, addonPriceId, ADDON_CATALOGUE } from '../../audit/_commerce.js';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: HEADERS });
const clip = (v, n = 300) => (v == null ? '' : String(v)).slice(0, n);

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { ...HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const key = addonKey(body.addon || body.addon_key || body.name);
  if (!key) return json({ ok: false, error: 'unknown_addon' }, 400);

  // No Stripe key bound today. Return a 200 fallback signal (NOT an error) so the client
  // opens the intake modal with this add-on preselected rather than a dead redirect.
  // `addon` is echoed back as the add-on key so the modal can carry it as the intent.
  if (!env.STRIPE_SECRET_KEY) {
    return json({ ok: false, fallback: true, addon: key, reason: 'stripe_not_configured' });
  }
  const priceId = addonPriceId(env, key);
  if (!priceId) {
    return json({ ok: false, fallback: true, addon: key, reason: 'price_not_configured' });
  }

  const origin = (env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/$/, '');
  const auditDomain = clip(body.audit_domain || body.audit, 200);
  const company = clip(body.company, 200);

  // Stripe Checkout Session (subscription). x-www-form-urlencoded per Stripe's API.
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('line_items[0][price]', priceId);
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', `${origin}/audit/checkout-complete?status=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${origin}/audit/checkout-complete?status=cancel`);
  form.set('allow_promotion_codes', 'true');
  form.set('billing_address_collection', 'required');
  // metadata + subscription metadata so the webhook can persist a labelled order
  form.set('client_reference_id', `${key}:${auditDomain || 'na'}`);
  form.set('metadata[addon_key]', key);
  form.set('metadata[addon_name]', ADDON_CATALOGUE[key].name);
  form.set('metadata[audit_domain]', auditDomain);
  form.set('metadata[company]', company);
  form.set('subscription_data[metadata][addon_key]', key);
  form.set('subscription_data[metadata][audit_domain]', auditDomain);
  if (company) form.set('customer_email', ''); // left blank → Stripe collects it on the hosted page

  let resp, data;
  try {
    resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-06-20',
      },
      body: form.toString(),
    });
    data = await resp.json().catch(() => ({}));
  } catch (e) {
    return json({ ok: false, error: 'stripe_unreachable', message: clip(e && e.message, 200) }, 502);
  }

  if (!resp.ok || !data || !data.url) {
    const msg = (data && data.error && data.error.message) || ('stripe_http_' + (resp ? resp.status : '0'));
    return json({ ok: false, error: 'stripe_error', detail: clip(msg, 300) }, 502);
  }

  return json({ ok: true, url: data.url, id: data.id });
}
