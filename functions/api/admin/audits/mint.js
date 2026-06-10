import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/audits/mint  { brand?, domain?, sector?, country? }
// Manual "mint any brand" box. Normalises the input to a domain, enqueues it into
// minting_queue tagged source='manual', then fires the engine cycle so the mint-worker
// drains it within minutes. The minted audit appears in the cockpit History tab with a
// Manual tag (History joins audit_pages.slug -> minting_queue.slug WHERE source='manual').
// Never writes audit_pages directly — the engine owns minting.

function toDomain(raw) {
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
  // if they typed a brand name with spaces (no dot), we can't resolve a domain here — reject.
  if (!/\./.test(s) || /\s/.test(s)) return '';
  return s;
}

export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}

  const domain = toDomain(b.domain || b.brand);
  if (!domain) {
    return json({ ok: false, error: 'need_domain', detail: 'Enter a website (e.g. example.com or https://example.com). A brand name alone cannot be resolved here.' }, 400);
  }
  const company = (b.brand && !/\./.test(String(b.brand))) ? String(b.brand).slice(0, 120) : (b.company ? String(b.company).slice(0, 120) : null);
  const sector = b.sector ? String(b.sector).slice(0, 64) : 'general';
  const country = b.country ? String(b.country).slice(0, 8).toUpperCase() : 'UK';

  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params) => {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return r.json();
  };

  try {
    // Re-queue if the domain is already there (manual re-mint should always win).
    await q(
      `INSERT INTO minting_queue (domain, company, sector, country, status, source, enqueued_at)
       VALUES ($1, $2, $3, $4, 'pending', 'manual', now())
       ON CONFLICT (domain) DO UPDATE SET status='pending', source='manual', company=COALESCE(EXCLUDED.company, minting_queue.company),
         sector=EXCLUDED.sector, country=EXCLUDED.country, error=NULL, enqueued_at=now()`,
      [domain, company, sector, country]
    );
  } catch (e) {
    return json({ ok: false, error: 'enqueue_failed', detail: e.message }, 500);
  }

  // Fire the engine cycle so mint-worker drains the queue soon (best-effort; never blocks the response).
  let dispatched = false;
  if (env.GH_TOKEN) {
    try {
      const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-cowork-os/actions/workflows/engine-cycle.yml/dispatches', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'main' }),
      });
      dispatched = r.status === 204;
    } catch (_e) {}
  }

  return json({ ok: true, domain, company, sector, country, queued: true, dispatched,
    message: dispatched ? 'Queued and the engine is minting it now. It will appear in History shortly.'
                        : 'Queued. It mints on the next engine cycle (within ~30 min) and appears in History.' });
};
