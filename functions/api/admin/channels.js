import { authed, unauth, json } from './_lib.js';
// GET /api/admin/channels — pending LinkedIn + Instagram touches from channel_sends, joined to leads.
// The channel-aware operator view (ported from the old standalone admin worker). Degrades gracefully:
// if channel_sends does not exist yet, returns connected:false with empty lists instead of a 500.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, connected: false, error: 'NEON_URL unbound', linkedin: [], instagram: [], counts: {} });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params) => {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params: params || [] }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return r.json();
  };
  const rowsOf = (d) => d.rows || d.results || [];

  try {
    const sel = (channel, handleCol) => q(
      `SELECT cs.id, cs.touch, cs.message_text, l.company, COALESCE(l.${handleCol},'') AS handle
       FROM channel_sends cs JOIN leads l ON l.id = cs.lead_id
       WHERE cs.channel = $1 AND cs.status = 'pending'
       ORDER BY cs.touch ASC, cs.id ASC LIMIT 200`, [channel]);
    const [li, ig, cnt] = await Promise.all([
      sel('linkedin', 'linkedin_url'),
      sel('instagram', 'instagram_handle'),
      q("SELECT channel, count(*)::int AS n FROM channel_sends WHERE status='pending' GROUP BY channel"),
    ]);
    const counts = {};
    rowsOf(cnt).forEach(r => { counts[r.channel] = r.n; });
    return json({ ok: true, connected: true, linkedin: rowsOf(li), instagram: rowsOf(ig), counts });
  } catch (e) {
    // table missing / schema drift — surface as not-connected, never a hard error
    return json({ ok: true, connected: false, note: 'channel_sends not available: ' + (e.message || '').slice(0, 80), linkedin: [], instagram: [], counts: {} });
  }
};
