import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/leads/approve  { id }  — founder approval of a Tier-2 lead: quality_fit=TRUE +
// lifecycle_stage='qualified' routes it into the existing enqueue -> mint -> push path.
// Parameterized throughout (modeled on leads/update.js).
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const id = Number(b.id);
  if (!id) return json({ ok: false, error: 'missing id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'UPDATE leads SET quality_fit=TRUE, lifecycle_stage=$1, updated_at=NOW() WHERE id=$2 RETURNING id', params: ['qualified', id] }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    const d = await r.json();
    const rows = d.rows || d.results || [];
    if (!rows.length) return json({ ok: false, error: 'lead not found' });
    return json({ ok: true, id, approved: true });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
