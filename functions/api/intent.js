// /api/intent · audit intake receiver
// The plan/pricing pane's intake modal (tier card OR one-time Fix Sprint) POSTs here.
// Validates → inserts a row into Neon `audit_intents` → returns { ok, calSlug, prefill }
// so the client mounts the Cal.com inline embed prefilled from the form.
//
// Neon migration (run once by the founder — DO NOT auto-run against prod):
//
//   CREATE TABLE IF NOT EXISTS audit_intents (
//     id            BIGSERIAL PRIMARY KEY,
//     intent        TEXT NOT NULL,              -- foundation | authority | enterprise | one_time_fix
//     firm_name     TEXT,
//     domain        TEXT,
//     sector        TEXT,
//     jurisdictions TEXT,
//     locations     TEXT,                       -- locations / scale
//     revenue_band  TEXT,
//     goal          TEXT,                       -- goal / pain / trigger
//     buyer_role    TEXT,
//     timeline      TEXT,
//     audit_domain  TEXT,                       -- domain of the audit the modal opened from
//     audit_slug    TEXT,
//     top_finding   TEXT,
//     ip_country    TEXT,
//     referer       TEXT,
//     user_agent    TEXT,
//     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
//   );
//   CREATE INDEX IF NOT EXISTS audit_intents_created_idx ON audit_intents (created_at DESC);
//   CREATE INDEX IF NOT EXISTS audit_intents_intent_idx  ON audit_intents (intent);

import { neonQuery, neonConfigured } from './_neon.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { notifySlack, notifyTelegram, buildJourneyContext } from '../_lib/notify.js';
import { calSlugForIntent, normaliseIntent } from '../audit/_commerce.js';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: HEADERS });
const clip = (v, n = 600) => (v == null ? '' : String(v)).slice(0, n);

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

  // honeypot — silently accept, never persist
  if (body['bot-field'] || body.honeypot_value || body.c_website_2) return json({ ok: true, silent: true });

  const intent = normaliseIntent(body.intent);
  if (!intent) return json({ ok: false, error: 'invalid_intent' }, 400);

  // firm name OR domain is the minimum signal we keep
  const firm = clip(body.firm_name || body.firm || body.company, 200);
  const domain = clip(body.domain || body.audit_domain, 200);
  if (!firm && !domain) return json({ ok: false, error: 'missing_firm' }, 400);

  // Turnstile (fail-open when no secret bound — matches the rest of the site)
  const ts = await verifyTurnstile(request, body, env);
  if (!ts.ok) return json({ ok: false, error: 'turnstile_failed', reason: ts.reason }, 403);

  const row = {
    intent,
    firm_name: firm,
    domain,
    sector: clip(body.sector, 160),
    jurisdictions: clip(body.jurisdictions, 240),
    locations: clip(body.locations || body.scale, 240),
    revenue_band: clip(body.revenue_band || body.revenue, 120),
    goal: clip(body.goal || body.pain || body.trigger, 1200),
    buyer_role: clip(body.buyer_role || body.role, 160),
    timeline: clip(body.timeline, 120),
    audit_domain: clip(body.audit_domain, 200),
    audit_slug: clip(body.audit_slug, 200),
    top_finding: clip(body.top_finding, 400),
    ip_country: clip(request.headers.get('cf-ipcountry'), 8),
    referer: clip(request.headers.get('referer'), 300),
    user_agent: clip(request.headers.get('user-agent'), 300),
  };

  // Persist (best-effort — never block the booking flow on a DB hiccup).
  let saved = false, dbError = null;
  if (neonConfigured(env)) {
    const sql = `INSERT INTO audit_intents
      (intent, firm_name, domain, sector, jurisdictions, locations, revenue_band, goal,
       buyer_role, timeline, audit_domain, audit_slug, top_finding, ip_country, referer, user_agent)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id`;
    const params = [
      row.intent, row.firm_name, row.domain, row.sector, row.jurisdictions, row.locations,
      row.revenue_band, row.goal, row.buyer_role, row.timeline, row.audit_domain, row.audit_slug,
      row.top_finding, row.ip_country, row.referer, row.user_agent,
    ];
    const r = await neonQuery(env, sql, params);
    saved = r.ok;
    if (!r.ok) dbError = r.error; // e.g. relation does not exist until the migration is run
  } else {
    dbError = 'neon_unconfigured';
  }

  // Notify the founder (fail-open). Do not await-block the response on failures.
  if (context.waitUntil) {
    const ctxJ = buildJourneyContext(request, body);
    const label = intent === 'one_time_fix' ? 'One-time Fix Sprint' : (intent.charAt(0).toUpperCase() + intent.slice(1)) + ' tier';
    const summary = `New audit intent · ${label}${firm ? ' · ' + firm : ''}`;
    const detail = [
      `*Intent:* ${label}`,
      firm && `*Firm:* ${firm}`,
      domain && `*Domain:* ${domain}`,
      row.sector && `*Sector:* ${row.sector}`,
      row.jurisdictions && `*Jurisdictions:* ${row.jurisdictions}`,
      row.locations && `*Locations/scale:* ${row.locations}`,
      row.revenue_band && `*Revenue:* ${row.revenue_band}`,
      row.buyer_role && `*Buyer:* ${row.buyer_role}`,
      row.timeline && `*Timeline:* ${row.timeline}`,
      row.goal && `*Goal/pain:* ${row.goal}`,
      row.audit_domain && `*From audit:* ${row.audit_domain}`,
      `*Source:* ${ctxJ.country} · ${ctxJ.device}`,
      !saved && `:warning: NOT persisted (${dbError}) — run the audit_intents migration`,
    ].filter(Boolean).join('\n');
    context.waitUntil(Promise.allSettled([
      notifySlack(env, { level: saved ? 'p1' : 'p0', summary, detail }),
      notifyTelegram(env, { level: saved ? 'p1' : 'p0', summary, detail }),
    ]));
  }

  // Build Cal prefill so the embed opens pre-filled from the form.
  const calSlug = calSlugForIntent(env, intent);
  const prefill = {
    name: firm || '',
    notes: [
      `Audit intent: ${intent}`,
      domain && `Domain: ${domain}`,
      row.sector && `Sector: ${row.sector}`,
      row.jurisdictions && `Jurisdictions: ${row.jurisdictions}`,
      row.revenue_band && `Revenue: ${row.revenue_band}`,
      row.timeline && `Timeline: ${row.timeline}`,
      row.goal && `Goal/pain: ${row.goal}`,
    ].filter(Boolean).join(' · '),
    guests: [],
  };

  // Always return ok:true so the client mounts the calendar even if the DB write is
  // pending the migration — the lead is still captured via notify + the booking itself.
  return json({ ok: true, saved, intent, calSlug, prefill });
}
