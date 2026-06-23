import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ drafts: [], count: 0, source: 'neon-unbound' });
  try {
    const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
    // Alias to the names the cockpit reads (touch, subject) and join the lead so drafts show the
    // company name instead of "lead #123".
    const sql = `SELECT od.id, od.lead_id, od.touch_number AS touch, od.send_status, od.subject_line AS subject,
        od.created_at, l.company, l.domain
      FROM outreach_drafts od LEFT JOIN leads l ON l.id = od.lead_id
      WHERE od.send_status IN ('pending','ready','draft') ORDER BY od.created_at DESC LIMIT 100`;
    const r = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params: [] }),
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ drafts: [], count: 0, source: 'neon-error', detail: t.slice(0,240) });
    }
    const d = await r.json();
    return json({ drafts: d.rows || d.results || [], count: (d.rows||d.results||[]).length, source: 'neon' });
  } catch (e) { return json({ drafts: [], count: 0, source: 'neon-error', error: e.message }); }
};
