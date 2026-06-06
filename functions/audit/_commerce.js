// functions/audit/_commerce.js
// ONE server-side source of truth for commerce mapping used by the audit Functions:
//   - add-on name  -> Stripe price_id (read from env; go-live dep)
//   - tier / fix   -> Cal.com event slug (prefilled on the inline embed)
//   - allowed intent values + add-on catalogue keys
// Pure data + tiny resolvers. No I/O. Safe to import from any Function.
//
// GO-LIVE DEPENDENCIES (env vars, NOT set yet, implement-now/wire-later):
//   STRIPE_SECRET_KEY        sk_live_… (checkout.js / webhook.js)
//   STRIPE_WEBHOOK_SECRET    whsec_…   (webhook.js signature verification)
//   STRIPE_PRICE_GEO         price_…   GEO / AI Search Presence            £1,800/mo
//   STRIPE_PRICE_COLD_EMAIL  price_…   Cold Email Outreach Engine          £1,400/mo
//   STRIPE_PRICE_COMPLIANCE  price_…   Compliance Monitoring               £399/mo
//   STRIPE_PRICE_LINKEDIN    price_…   LinkedIn Executive Authority        £1,100/mo
//   STRIPE_PRICE_REPUTATION  price_…   Reputation Monitoring + Crisis      £1,500/mo
//   STRIPE_PRICE_ENTITY      price_…   AI Entity + Knowledge Panel         £1,200/mo
//   STRIPE_PRICE_GBP         price_…   GBP Domination                      £650/mo
//   STRIPE_PRICE_REG_ALERTS  price_…   Regulatory Change Alerts            £199/mo
//   STRIPE_PRICE_YMYL        price_…   YMYL Content                        £800–1,200/piece
// Optional override: STRIPE_PRICE_MAP (JSON {"<addonKey>":"price_…"}) wins over the per-key vars.

// Stable key per add-on (slug of the display name). The client sends data-addon="<display name>";
// addonKey() normalises it to this stable key so a copy tweak never breaks checkout.
//
// This catalogue is the ONE source of truth the render pane mirrors (audit-app.js P.plan).
// Each entry carries the market-sourced display data (was/list price, billing unit and the
// outcome-led USP) so the pane leads with value, never a score or rank.
//   gbp   current Tamazia price (the live, corrected price)
//   was   prior / commodity price shown struck-through (0 when there was no change)
//   unit  'mo' monthly · 'piece' per deliverable
//   usp   the concrete, outcome-first one-liner the tablet leads with (R5: no em dashes / pause hyphens)
//   spec  the full-detail bullets revealed on hover / tap
export const ADDON_CATALOGUE = {
  geo: {
    key: 'geo', name: 'GEO / AI Search Presence', envKey: 'STRIPE_PRICE_GEO',
    gbp: 1800, was: 950, unit: 'mo', market: 'vs market £1,900 to £6,300/mo',
    usp: 'Appear inside ChatGPT, Perplexity, Claude, Gemini, Copilot and Google AI Overviews. AI visitors convert 4.4 to 23 times organic. The only compliance-reviewed GEO for regulated firms.',
    spec: ['Per-engine citation measurement across all 6 engines', 'Entity, schema, llms.txt and Wikidata build', 'Compliance review of what AI says about you, which no other agency offers', 'Monthly share of voice tracking against named rivals', 'Best for every regulated firm, because AI is now the first research step'],
  },
  cold_email: {
    key: 'cold_email', name: 'Cold Email Outreach Engine', envKey: 'STRIPE_PRICE_COLD_EMAIL',
    gbp: 1400, was: 499, unit: 'mo', market: 'vs market £2,400 to £6,400/mo',
    usp: 'We source 30,000 ICP-targeted leads, build a compliant B2B template per jurisdiction, run 5 to 7 follow-ups and track every lead. The same engine that found you as a client.',
    spec: ['Built on the 403-rule compliance database, so FCA and COBS sends stay compliant', 'Self-healing deliverability with inbox rotation', 'Personalised per prospect and classified by intent', '3 to 8 percent target reply rate, pure pipeline margin', 'Best for clinics building patient lists and firms doing active business development'],
  },
  compliance: {
    key: 'compliance', name: 'Compliance Monitoring', envKey: 'STRIPE_PRICE_COMPLIANCE',
    gbp: 399, was: 0, unit: 'mo', market: 'correctly priced, highest uptake',
    usp: 'Monthly re-scan of the full 403-rule catalogue. The loss-leader every budget holder approves without escalation.',
    spec: ['Catches new breaches the day the law changes', 'Alerts within 24 hours of a new gap appearing', 'Quarterly board-ready compliance certificate', 'Sits at 8.9 percent of a core retainer, frictionless to approve', 'Best for any firm that wants the audit to stay live, not a one-off'],
  },
  linkedin: {
    key: 'linkedin', name: 'LinkedIn Executive Authority', envKey: 'STRIPE_PRICE_LINKEDIN',
    gbp: 1100, was: 750, unit: 'mo', market: 'vs market £600 to £5,800/mo',
    usp: 'Ghostwritten, SEO-optimised, compliance-reviewed partner posts. 4 times the conversion of company content. Ranks on LinkedIn and Google.',
    spec: ['Dual distribution, so every post works on LinkedIn and Google', '8 to 12 posts per month per executive', 'Every post compliance-checked before it publishes', 'Builds the named-expert E-E-A-T signal Google rewards', 'Best for law and finance partners and clinic founders'],
  },
  reputation: {
    key: 'reputation', name: 'Reputation Monitoring + Crisis', envKey: 'STRIPE_PRICE_REPUTATION',
    gbp: 1500, was: 0, unit: 'mo', market: 'at market',
    usp: 'Real-time monitoring, pre-built suppression, 24 hour crisis response. Share prices fall 35 percent on average after a reputational crisis.',
    spec: ['Real-time review, mention and press monitoring', 'Crisis playbook on standby with the founder', 'Suppression architecture, not just alerting', 'Compliance-aware responses from minute one', 'Best for any firm with £5M or more of revenue to protect'],
  },
  entity: {
    key: 'entity', name: 'AI Entity + Knowledge Panel', envKey: 'STRIPE_PRICE_ENTITY',
    gbp: 1200, was: 0, unit: 'mo', market: 'at market, bundles with GEO',
    usp: 'Your machine-readable entity: Organization schema, sameAs, Wikidata and llms.txt, so AI engines identify and cite you correctly.',
    spec: ['Wikidata entry and Google Knowledge Panel build', 'sameAs across every verified profile', 'Notability-backed Wikipedia presence where eligible', 'Feeds the identity layer every AI engine reads first', 'Best for firms invisible in AI today, with entity readiness below 70'],
  },
  gbp_dom: {
    key: 'gbp_dom', name: 'GBP Domination', envKey: 'STRIPE_PRICE_GBP',
    gbp: 650, was: 850, unit: 'mo', market: 'up to 3 locations',
    usp: '30,000 or more compliance-checked map citations per location. Every listing, post and review response reviewed against MHRA and sector ad rules.',
    spec: ['Up to 3 locations, each with its own category strategy', 'Every GBP element checked against MHRA and sector ad rules', 'Posting schedule, Q&A and review response system', 'Local pack drives 44 percent of all search clicks', 'Best for healthcare, hospitality and multi-branch firms'],
  },
  reg_alerts: {
    key: 'reg_alerts', name: 'Regulatory Change Alerts', envKey: 'STRIPE_PRICE_REG_ALERTS',
    gbp: 199, was: 0, unit: 'mo', market: 'loss-leader, 71% uptake',
    usp: 'Every new ruling in your sector, the day it lands. The loss-leader that keeps you ahead of enforcement.',
    spec: ['Names the exact page affected and the exact rule that applies', 'Sits below the discretionary approval threshold', 'Sector and jurisdiction filtered, never generic noise', 'Every alert is a natural brief for a fix', 'Best for any regulated firm that wants early warning, not a fine'],
  },
  ymyl: {
    key: 'ymyl', name: 'YMYL Content', envKey: 'STRIPE_PRICE_YMYL',
    gbp: 800, was: 550, unit: 'piece', market: 'vs market £630 to £1,580/piece',
    usp: 'Per compliance-reviewed piece. Health and legal grade, held to Google\'s highest YMYL standard, not generic.',
    spec: ['1,200 or more words, reviewed before it publishes', 'Passes your compliance function first time', 'Held to Google\'s Your Money or Your Life standard', 'Cheaper than the internal cost of content that fails review', 'Best for healthcare, finance and law content programmes at volume'],
  },
};

// ---- Recurring tiers + one-time fix (canonical prices) ------------------------
// List prices are verbatim from src/content/pricing.ts (priceGbp). The pilot is a
// compliance-safe limited engagement at 40 percent off, computed as 0.6 x list and
// rounded to the nearest £50 so it always reads as a clean figure. NO fake countdown.
export const ONE_TIME_FIX_GBP = 7500;

function pilotOf(listGbp) { return Math.round((listGbp * 0.6) / 50) * 50; }

export const PRICING_TIERS = [
  { key: 'foundation', intent: 'foundation', name: 'Foundation', listGbp: 2500, pilotGbp: pilotOf(2500) },
  { key: 'authority',  intent: 'authority',  name: 'Authority',  listGbp: 4500, pilotGbp: pilotOf(4500), popular: true },
  { key: 'enterprise', intent: 'enterprise', name: 'Enterprise', listGbp: 9500, pilotGbp: pilotOf(9500) },
];

// Aliases: display name (lowercased) -> catalogue key. Tolerant of the live copy.
const ADDON_ALIASES = (() => {
  const m = {};
  for (const k of Object.keys(ADDON_CATALOGUE)) {
    const c = ADDON_CATALOGUE[k];
    m[c.name.toLowerCase()] = k;
    m[k] = k;
  }
  // explicit fallbacks for partial/legacy labels
  m['geo / ai search presence'] = 'geo';
  m['geo'] = 'geo';
  m['cold email outreach engine'] = 'cold_email';
  m['compliance monitoring'] = 'compliance';
  m['linkedin executive authority'] = 'linkedin';
  m['reputation monitoring + crisis'] = 'reputation';
  m['ai entity + knowledge panel'] = 'entity';
  m['gbp domination'] = 'gbp_dom';
  m['regulatory change alerts'] = 'reg_alerts';
  m['ymyl content'] = 'ymyl';
  return m;
})();

// Normalise any client-sent add-on identifier to a catalogue key (or null).
export function addonKey(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (ADDON_ALIASES[s]) return ADDON_ALIASES[s];
  // last-ditch: collapse to slug and re-test
  const slug = s.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return ADDON_ALIASES[slug] || null;
}

// Resolve the Stripe price_id for an add-on from env. Returns null if not configured
// (keys not live yet) so the caller can surface a clean "not enabled" message.
export function addonPriceId(env, key) {
  if (!key || !ADDON_CATALOGUE[key]) return null;
  // optional JSON map override
  if (env && env.STRIPE_PRICE_MAP) {
    try {
      const map = JSON.parse(env.STRIPE_PRICE_MAP);
      if (map && map[key]) return String(map[key]);
    } catch { /* ignore malformed map */ }
  }
  const envKey = ADDON_CATALOGUE[key].envKey;
  const v = env && env[envKey];
  return v ? String(v) : null;
}

// ---- Cal.com: tier / one_time_fix -> event slug -------------------------------
// Only `tamazia/strategy-call` exists in the Cal.com workspace today (mirrors the
// note in src/pages/book/[event].astro). Every intent resolves to it until the
// dedicated event types are created; the chosen tier is still recorded in Neon and
// passed to Cal as prefill notes. Override per-intent via env if/when they exist:
//   CAL_SLUG_DEFAULT, CAL_SLUG_FOUNDATION, CAL_SLUG_AUTHORITY,
//   CAL_SLUG_ENTERPRISE, CAL_SLUG_ONE_TIME_FIX
export const CAL_DEFAULT_SLUG = 'tamazia/strategy-call';

const CAL_ENV_KEY = {
  foundation: 'CAL_SLUG_FOUNDATION',
  authority: 'CAL_SLUG_AUTHORITY',
  enterprise: 'CAL_SLUG_ENTERPRISE',
  one_time_fix: 'CAL_SLUG_ONE_TIME_FIX',
};

// Allowed `intent` values posted from the intake modal.
export const INTENT_VALUES = ['foundation', 'authority', 'enterprise', 'one_time_fix'];

export function normaliseIntent(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (INTENT_VALUES.includes(s)) return s;
  // tolerate "tier:enterprise" / "package" style
  if (s.includes('foundation')) return 'foundation';
  if (s.includes('authority')) return 'authority';
  if (s.includes('enterprise') || s === 'package') return 'enterprise';
  if (s.includes('fix') || s.includes('one_time') || s.includes('sprint')) return 'one_time_fix';
  return null;
}

export function calSlugForIntent(env, intent) {
  const key = normaliseIntent(intent);
  if (env) {
    if (key && CAL_ENV_KEY[key] && env[CAL_ENV_KEY[key]]) return String(env[CAL_ENV_KEY[key]]);
    if (env.CAL_SLUG_DEFAULT) return String(env.CAL_SLUG_DEFAULT);
  }
  return CAL_DEFAULT_SLUG;
}
