import { authed, unauth, json } from './_lib.js';
// GET /api/admin/sends?limit= — every email actually sent (the `sends` table): recipient,
// subject, which touch, sent/opened/replied. The "all the emails sent" tracking.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ sends: [], counts: {}, error: 'NEON_URL unbound' });
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params = []) => {
    const r = await fetch(`https://${host}/sql`, { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, params }) });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    const d = await r.json(); return d.rows || d.results || [];
  };
  try {
    const rows = await q(`SELECT s.id, s.recipient, s.subject, s.smtp_relay, s.sent_at, s.delivery_status,
        s.opened_at, s.replied_at, s.sequence_step, s.kind, s.thread_id,
        (SELECT company FROM leads WHERE id = s.lead_id) AS company
      FROM sends s ORDER BY s.sent_at DESC NULLS LAST LIMIT $1`, [limit]);
    const c = {};
    (await q(`SELECT delivery_status, COUNT(*)::int n FROM sends GROUP BY 1`)).forEach(r => { c[r.delivery_status || 'unknown'] = r.n; });
    const tot = ((await q(`SELECT COUNT(*)::int n FROM sends`))[0] || {}).n || 0;
    const opened = ((await q(`SELECT COUNT(*)::int n FROM sends WHERE opened_at IS NOT NULL`))[0] || {}).n || 0;
    const replied = ((await q(`SELECT COUNT(*)::int n FROM sends WHERE replied_at IS NOT NULL`))[0] || {}).n || 0;
    const todayN = ((await q(`SELECT COUNT(*)::int n FROM sends WHERE sent_at::date = CURRENT_DATE`))[0] || {}).n || 0;
    return json({ sends: rows, counts: c, total: tot, opened, replied, today: todayN });
  } catch (e) { return json({ sends: [], counts: {}, error: e.message }); }
};
