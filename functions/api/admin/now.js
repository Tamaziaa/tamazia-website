import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const h = new Date().getUTCHours();
  const greeting = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
  // KV-based real counts
  const contact = await listKv(env, 'contact:', 1000);
  const briefings = await listKv(env, 'briefings:', 1000);
  const bookings = await listKv(env, 'bookings:', 1000);
  const today = new Date().toISOString().slice(0, 10);
  const todayContact = contact.filter(s => (s.submitted_at || '').startsWith(today));
  const todayBriefings = briefings.filter(s => (s.submitted_at || '').startsWith(today));
  const todayBookings = bookings.filter(b => (b.received_at || b.submitted_at || '').startsWith(today));
  // High-intent detection (used in both cards + flags)
  const highIntentToday = [...todayContact, ...todayBriefings].filter(s => /authority|enterprise|magic.?circle|ipo|fortune|ftse|sovereign/i.test(s.message || s.brief || s.company || ''));
  // Cards
  const cards = [];
  if (todayBookings.length) cards.push({ kind: 'booking', title: todayBookings.length + ' Cal.com booking' + (todayBookings.length > 1 ? 's' : '') + ' today.' });
  if (highIntentToday.length) cards.push({ kind: 'high-intent', title: highIntentToday.length + ' high-intent form submission' + (highIntentToday.length > 1 ? 's' : '') + ' today.' });
  if (!cards.length) cards.push({ kind: 'ok', title: 'All quiet · no critical action items right now.' });
  // Flags (Phase B)
  const flags = [];
  if (highIntentToday.length) flags.push({ level: 'p1', msg: highIntentToday.length + ' high-intent form(s) today' });
  if (todayBookings.length) flags.push({ level: 'p1', msg: todayBookings.length + ' new Cal booking(s) today' });
  // Engine kill-switch truth (system_state.paused in Neon) + live sent/reply totals so the
  // dashboard shows real numbers instead of hardcoded zeros.
  let paused = null, sentTotal = 0, repliesTotal = 0, sentToday = 0, repliesToday = 0;
  if (env.NEON_URL) {
    const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
    const q = async (query) => {
      const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, params: [] }) });
      if (!r.ok) throw new Error('Neon HTTP ' + r.status);
      const d = await r.json(); return d.rows || d.results || [];
    };
    const safe = async (sql) => { try { return ((await q(sql))[0] || {}).n || 0; } catch (_e) { return 0; } };
    try { const rows = await q("SELECT value FROM system_state WHERE key='paused'"); paused = String((rows[0] || {}).value || '').toLowerCase() === 'true'; } catch (_e) {}
    [sentTotal, repliesTotal, sentToday, repliesToday] = await Promise.all([
      safe("SELECT count(*)::int AS n FROM sends"),
      safe("SELECT count(*)::int AS n FROM inbound_emails WHERE matched_lead_id IS NOT NULL"),
      safe("SELECT count(*)::int AS n FROM sends WHERE sent_at::date = current_date"),
      safe("SELECT count(*)::int AS n FROM inbound_emails WHERE received_at::date = current_date"),
    ]);
  }
  return json({
    paused,
    greeting,
    truth: {
      real: { prospects: contact.length + briefings.length, sent: sentTotal, replies: repliesTotal, booked: bookings.length, won: 0 },
      test: { prospects: 0, sent: 0, replies: 0, booked: 0, won: 0 },
    },
    cards,
    flags,
    pipeline_today: { sourced: 0, sent: sentToday, replies: repliesToday, bookings: todayBookings.length, forms: todayContact.length + todayBriefings.length },
    build_sha: env.CF_PAGES_COMMIT_SHA || 'dev',
    build_at: env.CF_PAGES_BRANCH ? new Date().toISOString() : '',
  });
};
