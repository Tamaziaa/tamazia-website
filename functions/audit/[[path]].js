// functions/audit/[[path]].js
// Cloudflare Pages Function · serves /audit/<slug>/<hash> from Neon payload_json.
// Mirrors the old worker's loadAudit (serve by slug+hash, honour expires_at; sig is
// optional and not required on page load), but renders the new contract-driven page.
import { neonQuery } from '../api/_neon.js';
import { payloadToD } from './_adapter.js';
import { renderShell, errorShell } from './_shell.js';

const htmlResponse = (body, status = 200, maxAge = 300) => new Response(body, {
  status,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': status === 200 ? `public, max-age=${maxAge}` : 'no-store' },
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

  const q = `SELECT payload_json, domain, sector, country, lead_id, expires_at,
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

  let payload = row.payload_json;
  if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { payload = {}; } }

  // R2 dual-path: new rows store {r2:true} in Neon and the full payload in the AUDITS bucket.
  // Old rows (full payload in Neon) render exactly as before.
  if (!payload || payload.r2) {
    const obj = env.AUDITS ? await env.AUDITS.get(`audits/${slug}/${hash}.json`) : null;
    if (!obj) return htmlResponse(errorShell('Audit not found', 'This audit link is invalid or expired.'), 404);
    payload = JSON.parse(await obj.text());
  }

  let html;
  try {
    const D = payloadToD(payload, { company: row.company, now: Date.now(), generated_at: null, unlocked: row.unlocked === true || row.unlocked === 't' });
    html = renderShell(D);
  } catch (e) {
    return htmlResponse(errorShell('Audit could not be rendered', 'Our team has been notified.'), 500);
  }

  // fire-and-forget open tracking (best-effort; never blocks the response)
  if (env.POSTHOG_KEY && context.waitUntil) {
    context.waitUntil(fetch((env.POSTHOG_HOST || 'https://eu.i.posthog.com') + '/capture/', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: env.POSTHOG_KEY, event: 'audit_opened', distinct_id: row.domain || slug, properties: { slug, domain: row.domain, sector: row.sector, country: row.country, lib: 'tamazia-pages' } }),
    }).catch(() => {}));
  }
  return htmlResponse(html, 200);
}
