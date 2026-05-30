import { authed, unauth, json } from '../_lib.js';
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const id = Number(b.id); if (!id) return json({ ok: false, error: 'missing id' });
  const st = ['done', 'skipped', 'pending', 'sent'].includes(b.status) ? b.status : 'done';
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "UPDATE onboarding_tasks SET status=$1, completed_at=CASE WHEN $1='done' THEN NOW() ELSE completed_at END WHERE id=$2", params: [st, id] }) });
    return json({ ok: r.ok, id, status: st });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
