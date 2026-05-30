import { authed, unauth, json } from '../_lib.js';
const ONBOARD = [[0, 'Kickoff call + access'], [1, 'Audit walkthrough'], [7, 'First compliance-reviewed content live'], [14, 'Technical SEO fixes shipped'], [21, 'GEO + Maps citations live'], [30, 'Month-1 review + GA4 report']];
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const leadId = Number(b.lead_id); if (!leadId) return json({ ok: false, error: 'missing lead_id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (sql, params = []) => { const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql, params }) }); if (!r.ok) throw new Error('Neon ' + r.status + ' (revenue-ops tables may need migration)'); return r.json(); };
  try {
    const lead = await q('SELECT company, domain FROM leads WHERE id=$1', [leadId]);
    const lr = lead.rows || lead.results || []; const company = (lr[0] && lr[0].company) || ('lead-' + leadId);
    const slug = String(company).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 150) + '-' + leadId;
    const ins = await q("INSERT INTO client_accounts (lead_id, client_slug, legal_name, tier, status, account_manager) VALUES ($1,$2,$3,$4,'active','Aman') RETURNING id", [leadId, slug, company, b.tier || 'authority']);
    const cid = ((ins.rows || ins.results || [])[0] || {}).id;
    for (const [day, title] of ONBOARD) { await q("INSERT INTO onboarding_tasks (client_id, client_account_id, day_offset, title, due_date, status) VALUES ($1,$2,$3,$4, CURRENT_DATE + $3, 'pending')", [leadId, cid, day, title]); }
    await q("UPDATE leads SET status='won', lifecycle_stage='client', updated_at=NOW() WHERE id=$1", [leadId]);
    return json({ ok: true, client_id: cid, company, onboarding_tasks: ONBOARD.length });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
