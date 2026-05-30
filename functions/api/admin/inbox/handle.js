import { authed, unauth, json } from '../_lib.js';
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const id = Number(b.id); if (!id) return json({ ok: false, error: 'missing id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'UPDATE inbound_emails SET reviewed=TRUE WHERE id=$1', params: [id] }) });
    return json({ ok: r.ok, id, handled: true });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
