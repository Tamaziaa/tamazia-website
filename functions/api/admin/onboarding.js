import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ tasks: [], error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT ot.id, ot.day_offset, ot.title, ot.status, ot.due_date, ot.needs_aman, ca.legal_name FROM onboarding_tasks ot LEFT JOIN client_accounts ca ON ca.id=ot.client_account_id ORDER BY ot.due_date NULLS LAST LIMIT 200", params: [] }) });
    if (!r.ok) return json({ tasks: [], error: 'onboarding_tasks table not present yet' });
    const d = await r.json(); return json({ tasks: d.rows || d.results || [] });
  } catch (e) { return json({ tasks: [], error: e.message }); }
};
