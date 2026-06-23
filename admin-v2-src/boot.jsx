// boot.jsx — Tamazia Cockpit v2 LIVE data layer.
// Replaces the mock data.jsx. Defines every global the design's tabs read,
// seeded with safe empty defaults so the UI renders instantly and never throws,
// then fetches the real /api/admin/* endpoints and re-renders when data lands.
// One file = one contract: the tab files are used VERBATIM from the design.

// ── auth key (behind Cloudflare Access; the key is the second factor) ──────────
// If the Access app covers /api/admin*, the injected JWT auths every call and no key
// is needed. Otherwise the cockpit sends x-admin-secret from a key the founder pastes
// ONCE (stored in this browser only). Never hardcoded.
let _memKey = '';  // auto-acquired from the Access-gated /admin/session (in-memory only)
const getKey = () => { if (_memKey) return _memKey; try { return localStorage.getItem('tz_admin_key') || ''; } catch (_) { return ''; } };
const setKey = (k) => { try { localStorage.setItem('tz_admin_key', k); } catch (_) {} };
const authHeaders = () => { const k = getKey(); return k ? { 'x-admin-secret': k } : {}; };
window.tzSetKey = (k) => { setKey(k); location.reload(); };

// Auto-unlock: /admin/* is behind Cloudflare Access, so the founder's authenticated
// session can fetch the cockpit key from /admin/session (which verifies the Access JWT
// before returning it). Zero paste, no dashboard change. Falls back to the paste modal.
async function acquireKey() {
  if (getKey()) return;
  try {
    const r = await fetch('/admin/session', { credentials: 'same-origin' });
    if (r.ok) { const d = await r.json(); if (d && d.key) _memKey = d.key; }
  } catch (_) {}
}

// ── tiny api client (same-origin; Access cookie + x-admin-secret ride along) ──
const API = (p, opts) =>
  fetch('/api/admin/' + p, { credentials: 'same-origin', headers: authHeaders(), ...(opts || {}) })
    .then(r => { if (r.status === 401) window.__authFailed = true; return r.ok ? r.json() : null; })
    .catch(() => null);
window.API = API;

// POST helper for action buttons (approve/reject/suppress/mint/kill-switch…)
const POST = (p, body) =>
  fetch('/api/admin/' + p, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body || {}),
  }).then(r => r.json().catch(() => ({ ok: r.ok }))).catch(e => ({ ok: false, error: e.message }));
window.POST = POST;

// ── static config (no endpoint needed) ────────────────────────────────────────
const ICP_SECTORS = ['law firms', 'healthcare', 'finance', 'real estate'];
const SECTORS = ['law-firms', 'healthcare', 'dental', 'aesthetics', 'finance', 'real-estate', 'hospitality', 'food', 'pharmacy', 'education'];
const GEOS = ['UK', 'EU', 'US', 'ME'];
const STREAMS = ['organic', 'sponsored', 'registry', 'website_form', 'manual'];
const LIFECYCLE = ['sourced', 'enriched', 'verified', 'qualified', 'pending_approval', 'minted', 'contacted', 'replied', 'booked', 'won', 'lost', 'rejected'];
const TEST_ADDRESSES = ['@tamazia.co.uk', '@tamazia.in'];
const CADENCE = [
  { key: 'T0', label: 'Touch 0', day: 0, kind: 'personal', purpose: 'Personalised opener with audit link', live: true },
  { key: 'T1', label: 'Touch 1', day: 5, kind: 'locked', purpose: 'Audit nudge + 1 concrete finding', live: true },
  { key: 'T2', label: 'Touch 2', day: 10, kind: 'locked', purpose: 'Sector-relevant case-study', live: true },
  { key: 'T3', label: 'Touch 3', day: 20, kind: 'locked', purpose: 'Direct ask — call or pass', live: true },
  { key: 'T4', label: 'Touch 4', day: 35, kind: 'locked', purpose: 'Break-up — keep audit live?', live: true },
  { key: 'T5', label: 'Touch 5', day: 90, kind: 'locked', purpose: 'Long-nurture re-engagement', live: true },
];

// ── safe empty defaults for everything the tabs read ──────────────────────────
const DEFAULTS = {
  ICP_SECTORS, SECTORS, GEOS, STREAMS, LIFECYCLE, TEST_ADDRESSES, CADENCE,
  TRUTH: {
    real: { prospects: 0, sent: 0, replies: 0, booked: 0, won: 0 },
    test: { prospects: 0, sent: 0, replies: 0, booked: 0, won: 0 },
    health: 0, sentToday: 0, cap: 1800,
    bounceRate24h: 0, bounceRate7d: 0, bounceRate30d: 0,
    replyRate: 0, openRate: 0, clickRate: 0, ttfr_hours: 0,
    uptime: '—', killSwitchOn: false, paused: true,
    funnel: {}, // sourced/enriched/verified/qualified/pending_approval/minted/contacted/replied/booked
  },
  CONVEYOR: [], RELAYS: [], ALIASES: [], DOMAINS: [], DOMAIN_AUTH: [],
  LEADS: [], REPLIES: [], REPLY_CATS: [], DRAFTS: [], DRAFT_STATES: ['ready', 'awaiting_approval', 'pending_personal', 'sent'],
  AUDITS: [], BOOKINGS: [], FORM_SUBS: [], GBP: {},
  HEALTH_CATEGORIES: [
    { key: 'infra', label: 'Infrastructure' }, { key: 'keys', label: 'API keys & quotas' },
    { key: 'liveness', label: 'Worker liveness' }, { key: 'send', label: 'Send' },
    { key: 'reply', label: 'Reply handling' }, { key: 'data', label: 'Data integrity' },
  ],
  HEALTH_PROBES: [], CONNECTORS: [], BRIEFS: [{ n: 0, timestamp: '', summary: 'Loading the latest intel brief…', improvements: [], flags: [], question: null, approved: true }],
  EVENTS: [{ t: '··:··', src: 'system', m: 'Connecting to the engine…', sev: '', ch: [] }],
  SUPPRESSION: [], PENDING: [],
};
Object.assign(window, DEFAULTS);

// ── mappers: endpoint payload -> the design's global shapes ────────────────────
const titleCase = s => String(s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const sevFromStatus = s => ({ green: 'ok', amber: 'warn', red: 'bad', ok: 'ok', warn: 'warn' }[s] || 'idle');

function mapLeads(d) {
  const rows = (d && d.leads) || [];
  return rows.map((l, i) => {
    const score = l.quality_score != null ? Number(l.quality_score) : 0;
    return {
      id: l.id != null ? String(l.id) : 'L' + i,
      company: l.company || l.domain || '—',
      domain: l.domain || '',
      sector: l.sector || '—',
      geo: l.jurisdiction || '', jurisdiction: l.jurisdiction || '',
      stream: l.acquisition_channel || 'organic',
      score, fit: l.quality_fit === true || l.quality_fit === 't',
      icp_tier: l.icp_tier != null ? Number(l.icp_tier) : null,
      stage: l.lifecycle_stage || l.status || 'sourced',
      contact_email: l.best_email || l.contact_email || '',
      contact_first: (l.contact_first || (l.contact_email || '').split('@')[0] || '').slice(0, 24),
      contact_role: l.contact_title || l.contact_role || '',
      all_emails: l.all_emails || (l.contact_email ? 1 : 0),
      all_socials: { linkedin: !!l.contact_linkedin, instagram: false, facebook: false },
      website: l.domain ? 'https://' + l.domain : '',
      audit_url: l.audit_url || null,
      verify_status: l.verify_status || 'unknown',
      verify_confidence: l.contact_confidence != null ? Number(l.contact_confidence) : 0,
      next_touch: 'T0', next_touch_date: l.next_touch_date || '',
      replied: l.replied === true || l.replied === 't',
      last_reply: l.last_reply_received_at || null,
      last_touch_sent: l.first_contacted_at || '',
      top_finding: l.top_finding || '',
      is_test: false, is_aggressive: l.acquisition_channel === 'aggressive',
      priority_source: l.priority_source || null,
      created_at: (l.created_at || '').slice(0, 10), query: '',
      touch_history: Array.isArray(l.touch_history) ? l.touch_history.map(t => t || '—') : ['—', '—', '—', '—', '—', '—'],
      opens: l.opens || l.email_opens || 0, clicks: l.clicks || l.email_clicks || 0,
    };
  });
}

function mapPipeline(d, funnel) {
  const stages = (d && d.stages) || [];
  const oneLiners = {
    Sourced: 'Registry + SERP + signal adapters tag every lead at birth.',
    Enriched: 'Free crawler waterfall finds named decision-makers + channels.',
    Qualified: '10-layer quality gate + ICP tiers; Tier-1 mints, Tier-2 approves.',
    Minted: 'Audit micro-site built before any send (Touch-1 link).',
    Contacted: 'Mystrika 5-touch cadence over 20 days; reply stops follow-up.',
    Replied: 'Inbound captured + classified; positive replies surface here.',
  };
  return stages.map((s, i) => ({
    key: (s.label || 'stage').toLowerCase(), letter: s.letter || String.fromCharCode(65 + i),
    label: s.label || '—', one_liner: oneLiners[s.label] || '',
    counts: { in: null, out: s.total || 0 },
    today: funnel && funnel[(s.label || '').toLowerCase()] != null ? funnel[(s.label || '').toLowerCase()] : null,
    actions: [], metrics: [{ l: 'in stage', v: s.total || 0 }], detail: '',
  }));
}

function mapHealth(d) {
  const probes = (d && d.probes) || [];
  return probes.map(p => ({
    k: (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    c: /kv|neon|worker|cloudflare|r2|github/i.test(p.name) ? 'infra'
      : /slack|telegram|resend|key|token|quota|api/i.test(p.name) ? 'keys'
      : /send|relay|mystrika/i.test(p.name) ? 'send'
      : /imap|reply|inbound|classif/i.test(p.name) ? 'reply'
      : /suppress|data|dedup/i.test(p.name) ? 'data' : 'liveness',
    s: sevFromStatus(p.status), d: (p.detail || '') + (p.latency_ms ? ` · ${p.latency_ms}ms` : ''),
    name: p.name,
  }));
}

function mapAudits(d) {
  const rows = (d && d.audits) || [];
  return rows.map((a, i) => ({
    id: a.id || a.slug || 'AU-' + i,
    company: a.company || a.input || a.domain || '—',
    domain: a.input || a.domain || '',
    sector: a.sector || '',
    url: a.live_url || a.url || (a.slug && a.hash ? `/audit/${a.slug}/${a.hash}` : ''),
    minted_at: (a.created_at || a.minted_at || '').slice(0, 16).replace('T', ' '),
    views: a.open_count != null ? a.open_count : (a.views != null ? a.views : 0),
    last_view: a.last_opened_at || a.last_view || null,
    kind: a.kind || 'full',
    tag: a.tag || (a.kind === 'manual' ? 'manual' : 'auto'),  // manual vs auto mint
    status: a.status || 'live',
  }));
}

function mapBookings(d) {
  const rows = (d && d.bookings) || [];
  return rows.map((b, i) => {
    const startRaw = b.start_at || b.cal_start_time || b.when || b.start_time || b.start || '';
    const t = Date.parse(startRaw);
    const today = new Date(); const isSameDay = t && new Date(t).toDateString() === today.toDateString();
    return {
      id: b.id || b.cal_event_id || 'CB' + i,
      lead: { company: b.attendee_company || b.company || b.attendee_name || b.name || '—', domain: b.domain || '', contact_email: b.attendee_email || b.email || '' },
      name: b.attendee_name || b.name || '—', email: b.attendee_email || b.email || '',
      event_type: b.event_type || b.cal_event_type || '',
      when: startRaw ? String(startRaw).slice(0, 16).replace('T', ' ') : '—',
      ts: t || 0, bucket: !t ? 'unknown' : (isSameDay ? 'today' : (t > Date.now() ? 'upcoming' : 'past')),
      duration: b.duration || 30,
      status: (b.status || b.cal_status || 'confirmed').toLowerCase(),
      source: b.source || 'cal.com', outcome: b.outcome || '', notes: b.notes || b.next_step || '',
      lead_id: b.lead_id || null,
    };
  });
}

function mapForms(d) {
  const rows = (d && (d.submissions || d.forms)) || [];
  return rows.map((f, i) => ({
    id: f.id || 'FS' + i, type: f.type || f.form || 'contact',
    when: (f.when || f.created_at || '').slice(0, 16).replace('T', ' '),
    name: f.name || f.full_name || '—', email: f.email || '',
    source: f.source || f.source_url || f.page || '', converted: !!f.converted,
  }));
}

function mapReplies(d) {
  const rows = (d && d.replies) || [];
  return rows.map((r, i) => ({
    id: r.id || 'R' + i,
    lead: {
      company: r.company || r.from_name || r.from || r.from_email || '—',
      domain: r.domain || '',
      contact_email: r.from_email || r.email || r.from || '',
    },
    cat: r.category || r.classification || r.cat || 'unmatched',
    conf: r.confidence != null ? Number(r.confidence) : (r.conf != null ? Number(r.conf) : 0),
    received_at: r.received_at || r.created_at || '',
    t: (r.received_at || r.created_at || r.t || '').slice(11, 16) || '—',
    preview: r.preview || r.snippet || r.body_preview || r.subject || '', drafted: !!r.drafted, reviewed: !!r.reviewed,
  }));
}

function mapDrafts(d) {
  const rows = (d && d.drafts) || [];
  return rows.map((x, i) => ({
    id: x.id || 'D' + i, lead: { company: x.company || x.domain || '—', domain: x.domain || '' },
    touch: 'T' + (x.touch != null ? x.touch : 0), state: x.send_status || x.state || 'ready',
    subj: x.subject || x.subj || '(no subject)', updated_min: x.updated_min || 0,
  }));
}

function mapEvents(d) {
  const rows = (d && (d.events || d.recent)) || [];
  if (!rows.length) return null;
  const srcOf = (e) => e.source || e.src || e.kind || 'system';
  return rows.slice(0, 40).map(e => ({
    t: (e.at || e.t || e.created_at || '').slice(11, 16) || '··:··',
    src: srcOf(e), m: e.message || e.m || e.detail || e.title || '',
    sev: sevFromStatus(e.severity || e.sev || e.level), ch: e.channels || e.ch || [],
  }));
}

function mapBriefs(d) {
  const rows = (d && (d.briefs || d.intel)) || [];
  if (!rows.length) return null;
  return rows.map((b, i) => ({
    n: b.n || b.id || (1000 - i), timestamp: (b.created_at || b.timestamp || '').slice(0, 16).replace('T', ' '),
    summary: b.summary || b.body || '', improvements: b.improvements || b.recommendations || [],
    flags: b.flags || [], question: b.question || null, approved: b.approved !== false,
  }));
}

// reply-category roll-up (from the inbox list) so tab-inbox's bars render real counts
function rollupReplyCats(replies) {
  const palette = {
    interest: 'var(--ok)', meeting: 'var(--ok)', question: 'var(--clay)', pricing: 'var(--clay)',
    ooo: 'var(--ink-3)', wrong_person: 'var(--ink-3)', referral: 'var(--info)', not_now: 'var(--warn)',
    not_interested: 'var(--warn)', opt_out: 'var(--ink-2)', gdpr: 'var(--info)', bounce: 'var(--clay-2)',
    spam_complaint: 'var(--clay-2)', unmatched: 'var(--warn)',
  };
  const counts = {};
  replies.forEach(r => { counts[r.cat] = (counts[r.cat] || 0) + 1; });
  return Object.keys(counts).map(k => ({ key: k, label: titleCase(k), v: counts[k], color: palette[k] || 'var(--ink-3)' }));
}

// ── the boot sequence: render empty, fetch all, re-render with real data ───────
let _root = null;
function renderApp() {
  const el = document.getElementById('root');
  if (!el) return;
  if (!_root) _root = ReactDOM.createRoot(el);
  _root.render(React.createElement(window.CockpitApp));
}
window.__rerender = renderApp;

async function hydrate() {
  const [now, leads, pipeline, health, audits, bookings, forms, inbox, outbox, pending, events, queue, suppression, engineStatus, sends, sequences, n8n, channels, deliverability] =
    await Promise.all([
      API('now'), API('leads?limit=300'), API('pipeline'), API('health'),
      API('audits?limit=100'), API('bookings'), API('forms'), API('inbox'),
      API('outbox'), API('leads/pending'), API('events/recent'),
      API('queue'), API('suppression'), API('engine/status'),
      API('sends?limit=200'), API('sequences?limit=200'), API('n8n'),
      API('channels'), API('deliverability'),
    ]);

  // funnel from pipeline + now
  const funnel = {};
  ((pipeline && pipeline.stages) || []).forEach(s => { funnel[(s.label || '').toLowerCase()] = s.total; });
  const pt = (now && now.pipeline_today) || {};

  // TRUTH
  const T = Object.assign({}, DEFAULTS.TRUTH);
  if (now && now.truth) { T.real = now.truth.real || T.real; T.test = now.truth.test || T.test; }
  T.funnel = funnel;
  T.sentToday = pt.sent || 0;
  const probes = mapHealth(health);
  T.health = probes.length ? Math.round(100 * probes.filter(p => p.s === 'ok').length / probes.length) : 0;
  T.killSwitchOn = !!(now && now.paused);
  window.TRUTH = T;

  window.LEADS = mapLeads(leads);
  window.CONVEYOR = mapPipeline(pipeline, pt);
  window.HEALTH_PROBES = probes;
  window.AUDITS = mapAudits(audits);
  window.BOOKINGS = mapBookings(bookings);
  window.FORM_SUBS = mapForms(forms);
  const replies = mapReplies(inbox);
  window.REPLIES = replies;
  window.REPLY_CATS = rollupReplyCats(replies);
  window.DRAFTS = mapDrafts(outbox);
  window.PENDING = mapLeads(pending);
  const ev = mapEvents(events); if (ev) window.EVENTS = ev;
  // mint queue + suppression + engine workflow truth (live Neon/GitHub)
  window.QUEUE = (queue && { counts: queue.counts || {}, rows: queue.rows || [] }) || { counts: {}, rows: [] };
  window.SUPPRESSION_LIVE = (suppression && { count: suppression.count || 0, rows: suppression.rows || [] }) || { count: 0, rows: [] };
  window.ENGINE_STATUS = engineStatus || null;
  // outreach: every email sent + the follow-up cadence + drafts + the n8n automation layer
  window.SENDS = sends || { sends: [], counts: {}, total: 0, opened: 0, replied: 0, today: 0 };
  window.SEQUENCES = sequences || { rows: [], byTouch: {}, active: 0, dueNow: 0 };
  window.OUTBOX = (outbox && { drafts: outbox.drafts || [], count: outbox.count || 0 }) || { drafts: [], count: 0 };
  window.N8N = n8n || { reachable: false, workflows: [] };
  window.CHANNELS = channels || { connected: false, linkedin: [], instagram: [], counts: {} };
  window.DELIVERABILITY = deliverability || { connected: false, by_relay: [], by_status: [], volume_14d: [], sent_total: 0, bounce_total: 0, bounce_rate_pct: 0 };
  window.DATA_AT = new Date().toLocaleTimeString();

  // CONNECTORS from health probes (so the Health tab connector grid is real)
  window.CONNECTORS = probes.map(p => ({ name: p.name || titleCase(p.k), category: p.c, status: p.s === 'ok' ? 'ok' : p.s === 'warn' ? 'warn' : 'bad', detail: p.d }));

  // If every call 401'd and we have no key, the cockpit is reachable (Access passed
  // to /admin) but the API isn't authed — offer a one-time key entry.
  const allEmpty = !((leads && leads.leads) || []).length && !((now && now.cards));
  if (window.__authFailed && !getKey() && allEmpty) showKeyGate();

  renderApp();
}

function showKeyGate() {
  if (document.getElementById('tz-keygate')) return;
  const d = document.createElement('div');
  d.id = 'tz-keygate';
  d.className = 'tz-keygate';
  d.innerHTML =
    '<div class="tz-keygate-card">' +
    '<div class="tz-keygate-title">Unlock the cockpit</div>' +
    '<div class="tz-keygate-desc">You are behind Cloudflare Access. Paste the cockpit key once to load live data (or add <code>/api/admin*</code> to the Access app to skip this).</div>' +
    '<input id="tz-key" type="password" placeholder="ADMIN_SECRET" class="tz-keygate-input" />' +
    '<button id="tz-key-go" class="tz-keygate-btn">Unlock</button></div>';
  document.body.appendChild(d);
  const go = () => { const v = document.getElementById('tz-key').value.trim(); if (v) window.tzSetKey(v); };
  document.getElementById('tz-key-go').onclick = go;
  document.getElementById('tz-key').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

// initial paint (empty-but-valid), auto-acquire the key behind Access, hydrate, poll 60s
async function start() { renderApp(); await acquireKey(); hydrate(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
setInterval(hydrate, 60000);
