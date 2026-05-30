import { authed, unauth, json } from '../_lib.js';
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const caid = Number(b.client_account_id); if (!caid) return json({ ok: false, error: 'missing client_account_id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const num = 'TZ-' + Date.now().toString().slice(-8);
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "INSERT INTO invoices (client_account_id, invoice_number, invoice_kind, amount, currency, status, due_date) VALUES ($1,$2,$3,$4,'GBP','draft', CURRENT_DATE + 14) RETURNING id", params: [caid, num, b.kind || 'monthly_retainer', Number(b.amount) || 4500] }) });
    if (!r.ok) throw new Error('Neon ' + r.status); const d = await r.json();
    return json({ ok: true, invoice_id: ((d.rows || d.results || [])[0] || {}).id, invoice_number: num });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
