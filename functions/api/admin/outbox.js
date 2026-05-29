import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ drafts: [], count: 0, source: 'neon-unbound' });
  try {
    const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
    const sql = `SELECT id, lead_id, touch_number, send_status, subject_line, created_at FROM outreach_drafts WHERE send_status IN ('pending','ready','draft') ORDER BY created_at DESC LIMIT 100`;
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
