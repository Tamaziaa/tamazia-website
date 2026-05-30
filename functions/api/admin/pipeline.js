import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ stages: [], error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (sql) => {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql, params: [] }) });
    if (!r.ok) return [];
    const d = await r.json(); return d.rows || d.results || [];
  };
  try {
    const sr = await q("SELECT COALESCE(lifecycle_stage,'unknown') k, COUNT(*)::int n FROM leads GROUP BY 1");
    const m = {}; for (const r of sr) m[r.k] = r.n;
    const one = async (sql) => { const x = await q(sql); return (x[0] && (x[0].n ?? x[0].count)) || 0; };
    const fit = await one('SELECT COUNT(*)::int n FROM leads WHERE quality_fit IS TRUE');
    const drafts = await one("SELECT COUNT(*)::int n FROM outreach_drafts WHERE send_status IN ('pending','ready')");
    const replies = await one('SELECT COUNT(*)::int n FROM inbound_emails');
    const stages = [
      { letter: 'A', label: 'Sourced', total: m['sourced'] || 0 },
      { letter: 'B', label: 'Enriched', total: m['enriched'] || 0 },
      { letter: 'C', label: 'Qualified', total: m['qualified'] || 0 },
      { letter: 'D', label: 'FIT', total: fit },
      { letter: 'E', label: 'Drafts', total: drafts },
      { letter: 'F', label: 'Contacted', total: m['contacted'] || 0 },
      { letter: 'G', label: 'Replied', total: replies },
      { letter: 'H', label: 'Booked', total: m['booked'] || 0 },
    ];
    return json({ stages, generated_at: new Date().toISOString(), source: 'neon' });
  } catch (e) { return json({ stages: [], error: e.message }); }
};
