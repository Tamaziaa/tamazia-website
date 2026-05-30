import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ invoices: [], error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT i.id, i.invoice_number, i.invoice_kind, i.amount, i.currency, i.status, i.due_date, ca.legal_name FROM invoices i LEFT JOIN client_accounts ca ON ca.id=i.client_account_id ORDER BY i.created_at DESC LIMIT 200", params: [] }) });
    if (!r.ok) return json({ invoices: [], error: 'invoices table not present yet' });
    const d = await r.json(); return json({ invoices: d.rows || d.results || [] });
  } catch (e) { return json({ invoices: [], error: e.message }); }
};
