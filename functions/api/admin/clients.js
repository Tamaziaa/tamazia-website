import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ clients: [], error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT ca.id, ca.client_slug, ca.metadata, ca.legal_name, ca.tier, ca.deal_value, ca.currency, ca.status, ca.health_score, ca.contract_start, ca.contract_end, l.company, l.domain FROM client_accounts ca LEFT JOIN leads l ON l.id=ca.lead_id ORDER BY ca.created_at DESC LIMIT 200", params: [] }) });
    if (!r.ok) return json({ clients: [], error: 'client_accounts table not present yet (no clients signed)' });
    const d = await r.json(); const rows = d.rows || d.results || [];
    return json({ clients: rows, count: rows.length });
  } catch (e) { return json({ clients: [], error: e.message }); }
};
