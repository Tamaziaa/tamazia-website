import { authed, unauth, json, listKv } from './_lib.js';
// GET /api/admin/audits?limit=&q=  — merges KV public/manual audits + Neon engine full audits.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  const q = (url.searchParams.get('q') || '').toLowerCase();
  // 1) KV: public website audits + manual admin audits
  const kv = await listKv(env, 'audit-run:', limit);
  const kvAudits = kv.map(a => ({ ...a, kind: a.admin_source ? 'manual' : 'quick', source: a.admin_source ? 'admin' : 'public' }));
  // 2) Neon: engine full audits (the £1,500 Touch-1 audits) with live links + open tracking
  let engine = [];
  if (env.NEON_URL) {
    try {
      const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
      const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT ap.id, ap.slug, ap.hash, ap.domain, ap.sector, ap.generated_at, ap.status, ap.open_count, ap.last_opened_at, l.company, COALESCE(mq.source,'auto') AS mint_source FROM audit_pages ap LEFT JOIN leads l ON l.id=ap.lead_id LEFT JOIN minting_queue mq ON mq.slug=ap.slug ORDER BY ap.generated_at DESC LIMIT $1", params: [limit] }) });
      if (r.ok) { const d = await r.json(); engine = (d.rows || d.results || []).map(a => ({ id: 'ap-' + a.id, kind: 'full', source: 'engine', tag: a.mint_source === 'manual' ? 'manual' : 'auto', input: a.domain, sector: a.sector, company: a.company, created_at: a.generated_at, status: a.status, open_count: a.open_count, last_opened_at: a.last_opened_at, live_url: '/audit/' + a.slug + '/' + a.hash })); }
    } catch (_e) {}
  }
  let all = kvAudits.concat(engine);
  if (q) all = all.filter(a => ((a.input || a.domain || '') + ' ' + (a.sector || '') + ' ' + (a.company || '') + ' ' + (a.email || '')).toLowerCase().includes(q));
  all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  // KPI stats computed across the full merged set (not just the returned page)
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const stats = {
    total: all.length,
    full: all.filter(a => a.kind === 'full').length,
    quick: all.filter(a => a.kind === 'quick').length,
    manual: all.filter(a => a.kind === 'manual').length,
    opened: all.filter(a => a.kind === 'full' && (a.open_count || 0) > 0).length,
    this_week: all.filter(a => { const t = Date.parse(a.created_at || ''); return t && t >= weekAgo; }).length,
  };
  // Hot audits: full £1,500 audits a prospect has actually opened — the strongest buy signal
  const hot = all.filter(a => a.kind === 'full' && (a.open_count || 0) > 0)
    .sort((a, b) => (b.last_opened_at || '').localeCompare(a.last_opened_at || ''))
    .slice(0, 10);
  return json({ audits: all.slice(0, limit), count: all.length, kv: kvAudits.length, engine: engine.length, stats, hot });
};
