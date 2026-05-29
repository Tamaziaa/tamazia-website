import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ leads: [], count: 0, error: 'NEON_URL unbound' });
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  try {
    // Use Neon Serverless HTTP driver via fetch
    // Extract host from connection string
    const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
    const sql = `SELECT id, company, domain, contact_email, sector, lifecycle_stage, status, acquisition_channel, created_at, updated_at FROM leads ORDER BY updated_at DESC NULLS LAST LIMIT $1`;
    const r = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params: [limit] }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return json({ leads: [], count: 0, error: `Neon HTTP ${r.status}`, detail: txt.slice(0, 240) });
    }
    const d = await r.json();
    const rows = d.rows || d.results || [];
    // Get total count
    const cr = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'SELECT COUNT(*)::int AS n FROM leads', params: [] }),
    });
    let total = 0;
    if (cr.ok) {
      const cd = await cr.json();
      total = (cd.rows && cd.rows[0] && (cd.rows[0].n ?? cd.rows[0].count)) || 0;
    }
    return json({ leads: rows, count: rows.length, total });
  } catch (e) { return json({ leads: [], count: 0, error: e.message }); }
};
