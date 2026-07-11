// functions/audit/[[path]].js
// Cloudflare Pages Function · serves /audit/<slug>/<hash> from Neon payload_json.
// Mirrors the old worker's loadAudit (serve by slug+hash, honour expires_at; sig is
// optional and not required on page load), but renders the new contract-driven page.
import { neonQuery } from '../api/_neon.js';
import { payloadToD } from './_adapter.js';
import { renderShell, errorShell } from './_shell.js';

// Founder-confirmed direct line. Threaded to window.D.contactPhone so the audit founder block
// (and any element keyed on it) renders the number beside founder@tamazia.co.uk. env.CONTACT_PHONE
// (wrangler.toml [vars]) overrides this; the default guarantees it renders even without a secret set.
const CONTACT_PHONE_DEFAULT = '+44 7778243657';

const htmlResponse = (body, status = 200, maxAge = 300) => new Response(body, {
  status,
  // maxAge <= 0 forces no-store + revalidate (used for an unlocked render so a paying customer is never
  // served a stale, locked, cached copy). Errors are always no-store. (C-D)
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': (status === 200 && maxAge > 0) ? `public, max-age=${maxAge}` : 'no-store, must-revalidate' },
});

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/audit\/([^/]+)\/([^/]+)\/?$/);
  if (!m) {
    // This catch-all also sits in front of the static render assets under /audit/ (audit-app.js,
    // audit-charts.js, audit.css, fonts/*.woff2, engine-logos/*.svg, trusted-logos/*.svg). Without this
    // pass-through the function 404s them and every audit page renders blank. Anything that looks like a file
    // (has an extension) or lives in a known asset sub-path falls through to the Pages static-asset server.
    if (/\.[a-z0-9]{2,6}$/i.test(url.pathname) || /\/(fonts|engine-logos|trusted-logos)\//.test(url.pathname)) {
      return context.next();
    }
    return htmlResponse(errorShell('Audit not found', 'This link is malformed.'), 404);
  }
  const slug = decodeURIComponent(m[1]);
  const hash = decodeURIComponent(m[2]);

  // TRUTH FILTER (E-218, audit-of-the-audits P-002/P-003/P-004/P-008): the render now reads the verifier's
  // verdict. verified=true renders in full; anything else renders only evidence-clean content (see _adapter.js
  // sanitisePayload). generated_at powers the point-in-time banner; status powers the superseded banner.
  const q = `SELECT payload_json, domain, sector, country, lead_id, expires_at,
    verified, status, generated_at,
    COALESCE(unlocked, false) AS unlocked,
    (SELECT company FROM leads WHERE id = audit_pages.lead_id) AS company
    FROM audit_pages WHERE slug = $1 AND hash = $2 LIMIT 1`;
  const r = await neonQuery(env, q, [slug, hash]);
  if (!r.ok) return htmlResponse(errorShell('Temporarily unavailable', 'Please refresh in a moment.'), 503);
  if (!r.rows.length) return htmlResponse(errorShell('Audit not found', 'This audit link is invalid or has been retired.'), 404);

  const row = r.rows[0];
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return htmlResponse(errorShell('Audit expired', 'Contact Tamazia for a fresh assessment.'), 410);
  }

  // C-J / X28 — per-recipient HMAC verification.
  // The audit ENGINE (off-limits) signs each minted link over `slug|hash|lead_id|exp` and appends ?sig=&exp=.
  // Today the website does NOT verify it: the 8-char hash is the only barrier. We CANNOT verify without the
  // shared secret, so this block is fully gated behind env.AUDIT_HMAC_SECRET — inert until the secret is bound.
  // TODO(founder/engine): (1) provide AUDIT_HMAC_SECRET as a Pages secret; (2) CONFIRM the exact signed-payload
  // format + param names against the engine signer before enabling (assumed `${slug}|${hash}|${lead_id}|${exp}`,
  // hex HMAC-SHA256, params ?sig=&exp=). When confirmed this rejects forged/expired links with a clean 403/410.
  if (env.AUDIT_HMAC_SECRET) {
    const sig = url.searchParams.get('sig') || '';
    const expQ = url.searchParams.get('exp') || '';
    const expN = parseInt(expQ, 10);
    if (Number.isFinite(expN) && expN > 0 && expN * 1000 < Date.now()) {
      return htmlResponse(errorShell('Audit expired', 'This link has expired. Contact Tamazia for a fresh assessment.'), 410);
    }
    const signedPayload = `${slug}|${hash}|${row.lead_id != null ? row.lead_id : ''}|${expQ}`;
    const ok = await verifyHmacHex(env.AUDIT_HMAC_SECRET, signedPayload, sig);
    if (!ok) {
      return htmlResponse(errorShell('Audit not found', 'This audit link is invalid or has been retired.'), 404);
    }
  }

  let payload = row.payload_json;
  if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { payload = {}; } }

  // R2 dual-path: new rows store {r2:true} in Neon and the full payload in the AUDITS bucket.
  // Old rows (full payload in Neon) render exactly as before.
  if (!payload || payload.r2) {
    const obj = env.AUDITS ? await env.AUDITS.get(`audits/${slug}/${hash}.json`) : null;
    if (!obj) return htmlResponse(errorShell('Audit not found', 'This audit link is invalid or expired.'), 404);
    payload = JSON.parse(await obj.text());
  }

  // C-D: an unlocked report (paid via webhook, or optimistically opened with ?unlocked=1) must not be cached,
  // or the customer can be handed a stale locked copy from the edge. Locked pages keep the 5-minute cache.
  const isUnlocked = row.unlocked === true || row.unlocked === 't' || url.searchParams.get('unlocked') === '1';

  let html;
  try {
    // FOUNDER-BLOCKED links + contact (env-gated). Passed through to window.D so the client renders each
    // element ONLY when its value is present; when an env var is unset the field is '' and the element is omitted.
    const links = {
      booking: env.BOOKING_URL || '',
      stripeUnlock: env.STRIPE_LINK_UNLOCK || '',
      stripeCover: env.STRIPE_LINK_COVER || '',
      stripeFix10: env.STRIPE_LINK_FIX10 || '',
      stripeFix20: env.STRIPE_LINK_FIX20 || '',
      stripeFix30: env.STRIPE_LINK_FIX30 || '',
    };
    const D = payloadToD(payload, {
      company: row.company, now: Date.now(), generated_at: row.generated_at || null,
      // E-218: verifier verdict + row status drive the truth-filtered render for anything not verified=true.
      verified: row.verified === true || row.verified === 't',
      row_status: row.status || 'live',
      // C-B: thread the page's slug+hash so D.meta carries them; both audit forms then POST
      // audit_slug + audit_domain (+ top_finding) and the lead resolves back to this exact report.
      slug, hash,
      // C-D: a paying customer who lands on ?unlocked=1 sees the report open immediately even before
      // the webhook's audit_pages.unlocked write has propagated. isUnlocked ORs the column with the param.
      unlocked: isUnlocked,
      links, contactPhone: env.CONTACT_PHONE || CONTACT_PHONE_DEFAULT,
      posthogKey: env.POSTHOG_KEY || '', posthogHost: env.POSTHOG_HOST || '',
    });
    html = renderShell(D);
  } catch (e) {
    return htmlResponse(errorShell('Audit could not be rendered', 'The Tamazia team has been notified.'), 500);
  }

  // E-219 (P-010 root cause): the open beacon wrote ONLY to PostHog while the cockpit reads audit_pages.open_count
  // and last_opened_at from Neon, so the whole intent funnel recorded zero opens forever. Server-side write, same
  // Neon the page was just loaded from; fire-and-forget, never blocks the response.
  if (context.waitUntil) {
    context.waitUntil(
      neonQuery(env, `UPDATE audit_pages SET open_count = COALESCE(open_count, 0) + 1, last_opened_at = now() WHERE slug = $1 AND hash = $2`, [slug, hash]).catch(() => {})
    );
  }
  // fire-and-forget open tracking (best-effort; never blocks the response)
  if (env.POSTHOG_KEY && context.waitUntil) {
    context.waitUntil(fetch((env.POSTHOG_HOST || 'https://eu.i.posthog.com') + '/capture/', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: env.POSTHOG_KEY, event: 'audit_opened', distinct_id: row.domain || slug, properties: { slug, domain: row.domain, sector: row.sector, country: row.country, lib: 'tamazia-pages' } }),
    }).catch(() => {}));
  }
  return htmlResponse(html, 200, isUnlocked ? 0 : 300);
}

// C-J / X28 — verify a hex HMAC-SHA256 over `data` with `secret` against the provided hex `sig`, timing-safe.
// Returns false on any missing input or crypto unavailability (fail-closed, since this only runs when a secret
// is bound and the caller treats false as "reject the link").
async function verifyHmacHex(secret, data, sigHex) {
  if (!secret || !sigHex) return false;
  const cryptoObj = (globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : null;
  if (!cryptoObj) return false;
  try {
    const enc = new TextEncoder();
    const key = await cryptoObj.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await cryptoObj.subtle.sign('HMAC', key, enc.encode(data));
    const bytes = new Uint8Array(mac);
    let expected = '';
    for (let i = 0; i < bytes.length; i++) expected += bytes[i].toString(16).padStart(2, '0');
    const got = String(sigHex).trim().toLowerCase();
    if (got.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  } catch (_e) { return false; }
}
