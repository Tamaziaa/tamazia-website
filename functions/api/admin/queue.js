import { authed, unauth, json } from './_lib.js';
// GET /api/admin/queue — minting_queue truth: counts by status + the latest rows (with source tag).
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ counts: {}, rows: [], error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params = []) => {
    const r = await fetch(`https://${host}/sql`, { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, params }) });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    const d = await r.json(); return d.rows || d.results || [];
  };
  try {
    const counts = {};
    (await q(`SELECT status, COUNT(*)::int n FROM minting_queue GROUP BY 1`)).forEach(r => { counts[r.status] = r.n; });
    const rows = await q(`SELECT id, domain, company, sector, status, COALESCE(source,'auto') AS source, retries, error, enqueued_at, minted_at, slug, hash
      FROM minting_queue ORDER BY enqueued_at DESC LIMIT 30`);
    return json({ counts, rows, count: rows.length });
  } catch (e) { return json({ counts: {}, rows: [], error: e.message }); }
};
