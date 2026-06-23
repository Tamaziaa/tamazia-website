import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/channels/marksent  { id }
// Operator marks a manual LinkedIn/Instagram touch as sent (the cockpit can't auto-send on those
// channels). Idempotent: flipping an already-sent row is a no-op. Returns the new status.
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' }, 500);
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const id = parseInt(b.id, 10);
  if (!id) return json({ ok: false, error: 'id required' }, 400);
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "UPDATE channel_sends SET status='sent', sent_at=now() WHERE id=$1 AND status<>'sent' RETURNING id", params: [id] }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    const d = await r.json();
    const changed = (d.rows || d.results || []).length > 0;
    return json({ ok: true, id, status: 'sent', changed });
  } catch (e) {
    return json({ ok: false, error: (e.message || '').slice(0, 120) }, 500);
  }
};
