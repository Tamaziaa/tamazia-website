import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/leads/update  { id, action: 'advance'|'won'|'lost'|'reopen'|'stage', stage? }
const STAGES = ['inbound_lead','sourced','enriched','qualified','contacted','replied','booked','won'];
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const id = Number(b.id);
  if (!id) return json({ ok: false, error: 'missing id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params) => {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params })
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return r.json();
  };
  try {
    if (b.action === 'won') { await q('UPDATE leads SET status=$1, lifecycle_stage=$2, updated_at=NOW() WHERE id=$3', ['won', 'won', id]); }
    else if (b.action === 'lost') { await q('UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2', ['lost', id]); }
    else if (b.action === 'reopen') { await q('UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2', ['open', id]); }
    else if (b.action === 'stage' && b.stage) { await q('UPDATE leads SET lifecycle_stage=$1, updated_at=NOW() WHERE id=$2', [String(b.stage), id]); }
    else if (b.action === 'advance') {
      const cur = await q('SELECT lifecycle_stage FROM leads WHERE id=$1', [id]);
      const rows = cur.rows || cur.results || [];
      const stage = rows[0] && rows[0].lifecycle_stage;
      const idx = STAGES.indexOf(stage);
      const next = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : (idx === -1 ? STAGES[0] : stage);
      await q('UPDATE leads SET lifecycle_stage=$1, updated_at=NOW() WHERE id=$2', [next, id]);
      return json({ ok: true, id, stage: next });
    }
    else { return json({ ok: false, error: 'unknown action' }); }
    return json({ ok: true, id, action: b.action });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
