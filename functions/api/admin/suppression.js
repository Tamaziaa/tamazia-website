import { authed, unauth, json } from './_lib.js';
// GET  /api/admin/suppression           — count + recent entries (the do-not-contact truth)
// POST /api/admin/suppression {email, reason?} — add an address (founder action; never deletes)
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ count: 0, rows: [], error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params = []) => {
    const r = await fetch(`https://${host}/sql`, { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, params }) });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    const d = await r.json(); return d.rows || d.results || [];
  };
  try {
    const count = ((await q(`SELECT COUNT(*)::int n FROM suppression`))[0] || {}).n || 0;
    const rows = await q(`SELECT email, reason, scope, notes, suppressed_at FROM suppression ORDER BY suppressed_at DESC NULLS LAST LIMIT 25`);
    return json({ count, rows });
  } catch (e) { return json({ count: 0, rows: [], error: e.message }); }
};

export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'bad_email' }, 400);
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch(`https://${host}/sql`, { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `INSERT INTO suppression (email, reason, scope, notes, suppressed_at) VALUES ($1,$2,'all','added from cockpit',NOW()) ON CONFLICT DO NOTHING`, params: [email, String(b.reason || 'manual').slice(0, 40)] }) });
    return json({ ok: r.ok, email });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
