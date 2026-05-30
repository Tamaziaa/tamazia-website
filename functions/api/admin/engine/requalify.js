import { authed, unauth, json } from '../_lib.js';
// Reset FIT leads with no stored finding so the next engine cycle re-scores + stores top_finding.
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "UPDATE leads SET quality_score=NULL WHERE quality_fit IS TRUE AND COALESCE(personalisation_pointers->>'top_finding','')='' RETURNING id", params: [] }) });
    const d = await r.json(); const n = (d.rows || d.results || []).length;
    return json({ ok: r.ok, requalified: n, note: 'Reset ' + n + ' FIT leads · run the engine to re-qualify with findings.' });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
