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
      const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT ap.id, ap.slug, ap.hash, ap.domain, ap.sector, ap.generated_at, ap.status, ap.open_count, ap.last_opened_at, l.company FROM audit_pages ap LEFT JOIN leads l ON l.id=ap.lead_id ORDER BY ap.generated_at DESC LIMIT $1", params: [limit] }) });
      if (r.ok) { const d = await r.json(); engine = (d.rows || d.results || []).map(a => ({ id: 'ap-' + a.id, kind: 'full', source: 'engine', input: a.domain, sector: a.sector, company: a.company, created_at: a.generated_at, status: a.status, open_count: a.open_count, last_opened_at: a.last_opened_at, live_url: '/audit/' + a.slug + '/' + a.hash })); }
    } catch (_e) {}
  }
  let all = kvAudits.concat(engine);
  if (q) all = all.filter(a => ((a.input || a.domain || '') + ' ' + (a.sector || '') + ' ' + (a.company || '') + ' ' + (a.email || '')).toLowerCase().includes(q));
  all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return json({ audits: all.slice(0, limit), count: all.length, kv: kvAudits.length, engine: engine.length });
};
