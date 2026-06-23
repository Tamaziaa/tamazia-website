import { authed, unauth, json } from './_lib.js';
// GET /api/admin/deliverability — live send-health: sends by relay, delivery-status mix, 14-day
// volume, bounce count. Real numbers from Neon (sends + bounce_events), no hardcoded zeros. Each
// query is independent + fail-soft so a missing table yields an empty section, never a 500.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, connected: false, error: 'NEON_URL unbound' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query) => {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return (await r.json());
  };
  const rowsOf = (d) => d.rows || d.results || [];
  const safe = async (sql, fb) => { try { return rowsOf(await q(sql)); } catch (_e) { return fb; } };

  const [byRelay, byStatus, volume, bounces, total] = await Promise.all([
    safe("SELECT COALESCE(NULLIF(relay_used,''),NULLIF(relay_name,''),'?') AS relay, count(*)::int AS n FROM sends GROUP BY 1 ORDER BY 2 DESC LIMIT 12", []),
    safe("SELECT COALESCE(delivery_status,'?') AS status, count(*)::int AS n FROM sends GROUP BY 1 ORDER BY 2 DESC", []),
    safe("SELECT to_char(sent_at::date,'MM-DD') AS d, count(*)::int AS n FROM sends WHERE sent_at > now()-interval '14 days' GROUP BY sent_at::date ORDER BY sent_at::date", []),
    safe("SELECT count(*)::int AS n FROM bounce_events", [{ n: 0 }]),
    safe("SELECT count(*)::int AS n FROM sends", [{ n: 0 }]),
  ]);
  const sentTotal = (total[0] || {}).n || 0;
  const bounceTotal = (bounces[0] || {}).n || 0;
  const bounce_rate_pct = sentTotal ? Math.round((bounceTotal / sentTotal) * 1000) / 10 : 0;
  return json({
    ok: true, connected: true,
    by_relay: byRelay, by_status: byStatus, volume_14d: volume,
    sent_total: sentTotal, bounce_total: bounceTotal, bounce_rate_pct,
    checked_at: new Date().toISOString(),
  });
};
