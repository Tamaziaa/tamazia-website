// /api/intent · audit intake receiver
// The plan/pricing pane's intake modal POSTs here. It opens from three routes, all carried
// in the hidden `intent` field:
//   - a recurring tier      foundation | authority | enterprise
//   - the one-time fix       one_time_fix
//   - an add-on              the add-on key (e.g. geo, cold_email), used when Stripe checkout
//                            is unavailable and the buyer is routed to a call instead.
// Validates, inserts a row into Neon `audit_intents`, fires a founder notify (Slack /
// Telegram / email when bound), and returns { ok, calSlug, prefill, isAddon } so the
// client mounts the Cal.com inline embed prefilled from the form.
//
// The intent column is free TEXT, so it stores tier, one_time_fix or an add-on key without
// a schema change. Add-on validation is done here (against ADDON_CATALOGUE) so _commerce.js
// stays the single source of truth and is not modified.
//
// Neon migration (run once by the founder, DO NOT auto-run against prod). See also
// docs/neon-commerce-schema.sql:
//
//   CREATE TABLE IF NOT EXISTS audit_intents (
//     id            BIGSERIAL PRIMARY KEY,
//     intent        TEXT NOT NULL,              -- tier | one_time_fix | add-on key
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
import { calSlugForIntent, normaliseIntent, addonKey, ADDON_CATALOGUE } from '../audit/_commerce.js';

// Resolve the posted intent into a canonical value + label.
// Add-on FIRST, then tier. This order matters: the add-on "LinkedIn Executive Authority"
// contains the word "authority", which normaliseIntent would otherwise read as the Authority
// tier. addonKey matches only exact add-on display names / keys (it returns null for bare
// tier words), so checking it first disambiguates the two cleanly.
// Returns null when the value matches nothing we sell.
function resolveIntent(raw) {
  const ak = addonKey(raw);
  if (ak && ADDON_CATALOGUE[ak]) {
    return { intent: ak, label: ADDON_CATALOGUE[ak].name + ' add-on', isAddon: true };
  }
  const tier = normaliseIntent(raw);
  if (tier) {
    const label = tier === 'one_time_fix'
      ? 'One-time Fix Sprint'
      : tier.charAt(0).toUpperCase() + tier.slice(1) + ' tier';
    return { intent: tier, label, isAddon: false };
  }
  return null;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: HEADERS });
const clip = (v, n = 600) => (v == null ? '' : String(v)).slice(0, n);

// Schema for audit_intents. The Neon HTTP /sql endpoint runs ONE statement per call,
// so these are sent in sequence. Each is idempotent (IF NOT EXISTS).
const AUDIT_INTENTS_DDL = [
  `CREATE TABLE IF NOT EXISTS audit_intents (
     id            BIGSERIAL PRIMARY KEY,
     intent        TEXT NOT NULL,
     firm_name     TEXT,
     domain        TEXT,
     sector        TEXT,
     jurisdictions TEXT,
     locations     TEXT,
     revenue_band  TEXT,
     goal          TEXT,
     buyer_role    TEXT,
     timeline      TEXT,
     audit_domain  TEXT,
     audit_slug    TEXT,
     top_finding   TEXT,
     ip_country    TEXT,
     referer       TEXT,
     user_agent    TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS audit_intents_created_idx ON audit_intents (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_intents_intent_idx ON audit_intents (intent)`,
];

// Create the table + indexes on demand. Best-effort: returns true only if the CREATE TABLE
// statement succeeded. Never throws (neonQuery never throws).
async function ensureAuditIntentsTable(env) {
  const t = await neonQuery(env, AUDIT_INTENTS_DDL[0], []);
  if (!t.ok) return false;
  for (let i = 1; i < AUDIT_INTENTS_DDL.length; i++) await neonQuery(env, AUDIT_INTENTS_DDL[i], []);
  return true;
}

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

  // honeypot: silently accept, never persist
  if (body['bot-field'] || body.honeypot_value || body.c_website_2) return json({ ok: true, silent: true });

  const resolved = resolveIntent(body.intent);
  if (!resolved) return json({ ok: false, error: 'invalid_intent' }, 400);
  const intent = resolved.intent;

  // firm name OR domain is the minimum signal we keep
  const firm = clip(body.firm_name || body.firm || body.company, 200);
  const domain = clip(body.domain || body.audit_domain, 200);
  if (!firm && !domain) return json({ ok: false, error: 'missing_firm' }, 400);

  // Turnstile (fail-open when no secret bound, to match the rest of the site)
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

  // Persist (best-effort, never block the booking flow on a DB hiccup).
  // First attempt the insert; if the table is missing (migration not yet run), create it
  // on the fly and retry once, so the very first lead is captured without manual setup.
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
    let r = await neonQuery(env, sql, params);
    if (!r.ok) {
      // Table missing on first run, or any deterministic SQL error: create the table and retry once.
      const created = await ensureAuditIntentsTable(env);
      if (created) r = await neonQuery(env, sql, params);
    }
    saved = r.ok;
    if (!r.ok) dbError = r.error;
  } else {
    dbError = 'neon_unconfigured';
  }

  // Notify the founder (fail-open). Do not await-block the response on failures.
  if (context.waitUntil) {
    const ctxJ = buildJourneyContext(request, body);
    const label = resolved.label;
    const summary = `New audit intent · ${label}${firm ? ' · ' + firm : ''}`;
    const fields = [
      ['Intent', label],
      ['Firm', firm],
      ['Domain', domain],
      ['Sector', row.sector],
      ['Jurisdictions', row.jurisdictions],
      ['Locations/scale', row.locations],
      ['Revenue', row.revenue_band],
      ['Buyer', row.buyer_role],
      ['Timeline', row.timeline],
      ['Goal/pain', row.goal],
      ['From audit', row.audit_domain],
      ['Source', `${ctxJ.country} · ${ctxJ.device}`],
    ].filter(([, v]) => v);
    const detail = fields.map(([k, v]) => `*${k}:* ${v}`).join('\n')
      + (saved ? '' : `\n:warning: NOT persisted (${dbError}). Run the audit_intents migration.`);
    context.waitUntil(Promise.allSettled([
      notifySlack(env, { level: saved ? 'p1' : 'p0', summary, detail }),
      notifyTelegram(env, { level: saved ? 'p1' : 'p0', summary, detail }),
      notifyEmail(env, { summary, fields, saved, dbError }),
    ]));
  }

  // Build Cal prefill so the embed opens pre-filled from the form. Add-on intents resolve to
  // the default strategy-call slug (calSlugForIntent falls through for non-tier values), with
  // the add-on name carried in the notes so the founder sees exactly what the buyer wanted.
  const calSlug = calSlugForIntent(env, intent);
  const prefill = {
    name: firm || '',
    notes: [
      `Audit intent: ${resolved.label}`,
      domain && `Domain: ${domain}`,
      row.sector && `Sector: ${row.sector}`,
      row.jurisdictions && `Jurisdictions: ${row.jurisdictions}`,
      row.revenue_band && `Revenue: ${row.revenue_band}`,
      row.timeline && `Timeline: ${row.timeline}`,
      row.goal && `Goal/pain: ${row.goal}`,
    ].filter(Boolean).join(' · '),
    guests: [],
  };

  // Always return ok:true so the client mounts the calendar even if the DB write is pending
  // the migration. The lead is still captured via notify and the booking itself. isAddon lets
  // the client label the confirmation correctly.
  return json({ ok: true, saved, intent, isAddon: resolved.isAddon, calSlug, prefill });
}

// Email the founder a copy of the intent. Fail-open and entirely optional:
//   - Resend  : RESEND_API_KEY (prod binding) or RESEND_KEY (local .env name)
//   - Brevo   : BREVO_KEY (used only if no Resend key is bound)
// Recipient + sender reuse the site's existing vars (ALERT_TO / RESEND_FROM_ALERT). Returns
// null and never throws when no email key is present, so the booking flow is never blocked.
function escHtml(s) {
  return String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
async function notifyEmail(env, { summary, fields, saved, dbError }) {
  if (!env) return null;
  const resendKey = env.RESEND_API_KEY || env.RESEND_KEY;
  const brevoKey = env.BREVO_KEY;
  if (!resendKey && !brevoKey) return null; // no email channel bound: silent no-op

  const to = (env.ALERT_TO || env.CONTACT_TO || 'realfamemedia@gmail.com');
  const fromName = 'Tamazia Audit';
  const fromEmail = 'forms@tamazia.in';
  const fromCombined = env.RESEND_FROM_ALERT || `${fromName} <${fromEmail}>`;
  const subject = `[Audit intent] ${summary.replace(/\*/g, '')}`.slice(0, 180);
  const rows = fields.map(([k, v]) =>
    `<tr><td style="padding:6px 12px;background:#f5f0ea;font-weight:600">${escHtml(k)}</td><td style="padding:6px 12px">${escHtml(v)}</td></tr>`
  ).join('');
  const warn = saved ? '' : `<p style="color:#9a1f1f">Not yet persisted (${escHtml(dbError)}). Run the audit_intents migration.</p>`;
  const html = `<h2 style="font-family:Georgia,serif;color:#2A0C14">New audit intent</h2>${warn}
    <table style="border-collapse:collapse;font-family:system-ui;font-size:14px">${rows}</table>`;

  try {
    if (resendKey) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromCombined, to: [to], subject, html }),
      });
      return r.ok;
    }
    // Brevo (transactional email) fallback.
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}
