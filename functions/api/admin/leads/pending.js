import { authed, unauth, json } from '../_lib.js';
// GET /api/admin/leads/pending — the Tier-2 approval queue: scored but NOT auto-fit (quality_fit IS NOT TRUE),
// still pre-outreach. Includes 'pending_approval' (the tier-router's explicit Tier-2 stage) alongside the
// spec'd 'enriched'/'sourced'. Modeled on leads.js.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ leads: [], count: 0, error: 'NEON_URL unbound' });
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
  try {
    const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
    const sql = `SELECT id, company, domain, contact_email, primary_email, sector, lifecycle_stage, status,
        quality_score, icp_tier, conversion_tier, decision_maker_confidence, email_verified,
        personalisation_pointers->>'top_finding' AS top_finding, created_at, updated_at
      FROM leads
      WHERE quality_fit IS NOT TRUE
        AND lifecycle_stage IN ('enriched','sourced','pending_approval')
        AND COALESCE(lead_type,'') NOT IN ('investor','institution','internal')
        AND COALESCE(status,'') NOT IN ('duplicate','suppressed','dnc','bounced')
      ORDER BY quality_score DESC NULLS LAST, updated_at DESC NULLS LAST LIMIT $1`;
    const r = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params: [limit] }),
    });
    if (!r.ok) { const txt = await r.text(); return json({ leads: [], count: 0, error: `Neon HTTP ${r.status}`, detail: txt.slice(0, 240) }); }
    const d = await r.json();
    const rows = d.rows || d.results || [];
    return json({ leads: rows, count: rows.length });
  } catch (e) { return json({ leads: [], count: 0, error: e.message }); }
};
