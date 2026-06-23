import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/audits/mint
//   single : { brand?, domain?, sector?, country? }
//   bulk   : { items: ["mishcon.com", "Clyde & Co", ...], sector?, country? }
//
// The "audit search" box. Each item is either a website (resolved to a domain) or a plain
// company name. Domains enqueue directly into minting_queue (source='manual'); names enqueue
// with domain=NULL so the engine resolves the domain before crawling (needs_resolve signal =
// domain IS NULL). A hard daily cap (default 2000/day, manual lane) protects Neon + the worker:
// items over the remaining budget are rejected with an explicit message, never silently dropped.
// Never writes audit_pages directly — the engine owns minting. History (GET /audits) shows the
// minted link, status and open-count as the worker drains the queue.

const DAILY_CAP = 2000;

// Returns { domain, company } — domain is '' when the input is a bare company name.
function classify(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  const lower = s.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
  if (/\./.test(lower) && !/\s/.test(lower)) return { domain: lower, company: null };
  // bare company name (has spaces or no dot) — let the engine resolve the domain
  return { domain: '', company: s.slice(0, 160) };
}

export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' }, 500);
  let b = {}; try { b = await request.json(); } catch (_e) {}

  // Normalise to a list. Back-compat: a single {domain|brand} still works.
  let inputs = [];
  if (Array.isArray(b.items)) inputs = b.items;
  else if (b.domain || b.brand) inputs = [b.domain || b.brand];
  inputs = inputs.map(x => String(x || '').trim()).filter(Boolean);
  if (!inputs.length) {
    return json({ ok: false, error: 'need_input', detail: 'Enter at least one website (example.com) or company name.' }, 400);
  }

  const sector = b.sector ? (String(b.sector).toLowerCase().replace(/[^a-z0-9 &/-]/g, '').slice(0, 40) || 'general') : 'general';
  const country = b.country ? (String(b.country).slice(0, 8).toUpperCase().replace(/[^A-Z]/g, '') || 'UK') : 'UK';

  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params) => {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params: params || [] }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return r.json();
  };
  const rowsOf = (d) => d.rows || d.results || [];

  // Parse + dedupe within this batch.
  const seen = {};
  const parsed = [];
  const rejected = [];
  for (const raw of inputs) {
    const c = classify(raw);
    if (!c) { rejected.push({ input: raw, reason: 'empty' }); continue; }
    const key = (c.domain || c.company || '').toLowerCase();
    if (seen[key]) continue;
    seen[key] = 1;
    parsed.push({ input: raw, ...c });
  }

  // Daily cap (manual lane). Reject the overflow with a clear message.
  let usedToday = 0;
  try {
    const d = await q("SELECT count(*)::int AS n FROM minting_queue WHERE source='manual' AND enqueued_at::date = current_date");
    usedToday = (rowsOf(d)[0] || {}).n || 0;
  } catch (_e) { /* cap query best-effort; fail open to not block legit mints */ }
  const remaining = Math.max(0, DAILY_CAP - usedToday);

  const accept = parsed.slice(0, remaining);
  for (const over of parsed.slice(remaining)) rejected.push({ input: over.input, reason: 'daily_cap' });

  const accepted = [];
  for (const it of accept) {
    try {
      if (it.domain) {
        await q(
          `INSERT INTO minting_queue (domain, company, sector, country, status, source, enqueued_at)
           VALUES ($1, $2, $3, $4, 'pending', 'manual', now())
           ON CONFLICT (domain) DO UPDATE SET status='pending', source='manual',
             company=COALESCE(EXCLUDED.company, minting_queue.company),
             sector=EXCLUDED.sector, country=EXCLUDED.country, error=NULL, enqueued_at=now()`,
          [it.domain, it.company, sector, country]
        );
      } else {
        // company-name only: minting_queue.domain is NOT NULL, so use a sentinel domain
        // ("resolve:<slug>") that the engine resolver (mint-worker.resolveNames) detects and
        // rewrites to the real domain before minting. ON CONFLICT keeps re-mints idempotent.
        const slug = it.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'unknown';
        await q(
          `INSERT INTO minting_queue (domain, company, sector, country, status, source, enqueued_at)
           VALUES ($1, $2, $3, $4, 'pending', 'manual', now())
           ON CONFLICT (domain) DO UPDATE SET status='pending', source='manual', company=EXCLUDED.company,
             sector=EXCLUDED.sector, country=EXCLUDED.country, error=NULL, enqueued_at=now()`,
          ['resolve:' + slug, it.company, sector, country]
        );
      }
      accepted.push({ input: it.input, domain: it.domain || null, company: it.company || null, needs_resolve: !it.domain });
    } catch (e) {
      rejected.push({ input: it.input, reason: 'enqueue_failed', detail: (e.message || '').slice(0, 120) });
    }
  }

  // Fire the fast-lane mint workflow so the worker drains soon (best-effort; never blocks).
  let dispatched = false;
  if (accepted.length && env.GH_TOKEN) {
    try {
      const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-cowork-os/actions/workflows/mint-now.yml/dispatches', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'main' }),
      });
      dispatched = r.status === 204;
    } catch (_e) {}
  }

  const cap = { limit: DAILY_CAP, used_today: usedToday, remaining: Math.max(0, remaining - accepted.length) };
  const capHit = rejected.some(r => r.reason === 'daily_cap');
  let message = dispatched
    ? `Minting now (fast lane) — links appear in History within ~1 minute.`
    : `Queued — mints on the next engine cycle (within ~30 min) and appears in History.`;
  if (capHit) message = `${accepted.length} of ${parsed.length} accepted — daily cap ${DAILY_CAP}/day reached. The rest will queue tomorrow.`;

  // Back-compat single-item shape: keep top-level domain/queued for old callers.
  const first = accepted[0] || null;
  return json({
    ok: accepted.length > 0,
    accepted, rejected, cap, dispatched, message,
    domain: first ? first.domain : null, queued: accepted.length > 0,
  }, accepted.length ? 200 : 400);
};
