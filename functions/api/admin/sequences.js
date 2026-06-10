import { authed, unauth, json } from './_lib.js';
// GET /api/admin/sequences — the follow-up cadence state per lead (email_sequence_state):
// which touch each lead is on, when the next is due, whether it's paused. The "follow-ups" tracking.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ rows: [], counts: {}, error: 'NEON_URL unbound' });
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params = []) => {
    const r = await fetch(`https://${host}/sql`, { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, params }) });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    const d = await r.json(); return d.rows || d.results || [];
  };
  try {
    const rows = await q(`SELECT ess.id, ess.lead_id, ess.current_touch, ess.last_touch_sent_at, ess.next_due_at,
        ess.status, ess.paused_reason, l.company, l.domain
      FROM email_sequence_state ess LEFT JOIN leads l ON l.id = ess.lead_id
      ORDER BY ess.next_due_at ASC NULLS LAST LIMIT $1`, [limit]);
    const byTouch = {};
    (await q(`SELECT current_touch, COUNT(*)::int n FROM email_sequence_state GROUP BY 1 ORDER BY 1`)).forEach(r => { byTouch['T' + (r.current_touch ?? '?')] = r.n; });
    const active = ((await q(`SELECT COUNT(*)::int n FROM email_sequence_state WHERE status='active'`))[0] || {}).n || 0;
    const dueNow = ((await q(`SELECT COUNT(*)::int n FROM email_sequence_state WHERE status='active' AND next_due_at <= NOW()`))[0] || {}).n || 0;
    return json({ rows, byTouch, active, dueNow });
  } catch (e) { return json({ rows: [], byTouch: {}, error: e.message }); }
};
