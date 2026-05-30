// Public client portal data · GET /api/portal?slug=<client_slug>&t=<portal_token>
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || '';
  const t = url.searchParams.get('t') || '';
  const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (!slug || !t) return J({ error: 'missing slug or token' }, 400);
  if (!env.NEON_URL) return J({ error: 'unavailable' }, 503);
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (sql, params) => { const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql, params }) }); if (!r.ok) throw new Error('db ' + r.status); const d = await r.json(); return d.rows || d.results || []; };
  try {
    const ca = await q('SELECT id, lead_id, legal_name, tier, status, health_score, contract_start, contract_end, metadata FROM client_accounts WHERE client_slug=$1', [slug]);
    if (!ca.length) return J({ error: 'not found' }, 404);
    const acct = ca[0];
    const token = (acct.metadata && acct.metadata.portal_token) || '';
    if (!token || token !== t) return J({ error: 'invalid token' }, 403);
    const onboarding = await q('SELECT day_offset, title, status, due_date FROM onboarding_tasks WHERE client_account_id=$1 ORDER BY day_offset', [acct.id]);
    const lead = acct.lead_id ? await q('SELECT company, domain, sector, audit_url FROM leads WHERE id=$1', [acct.lead_id]) : [];
    const invoices = await q('SELECT invoice_number, invoice_kind, amount, currency, status, due_date FROM invoices WHERE client_account_id=$1 ORDER BY created_at DESC', [acct.id]);
    return J({ ok: true, account: { name: acct.legal_name, tier: acct.tier, status: acct.status, health: acct.health_score, contract_end: acct.contract_end }, company: (lead[0] && lead[0].company) || acct.legal_name, audit_url: (lead[0] && lead[0].audit_url) || '', sector: (lead[0] && lead[0].sector) || '', onboarding, invoices });
  } catch (e) { return J({ error: e.message }, 500); }
};
