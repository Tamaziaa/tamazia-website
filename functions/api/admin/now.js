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
  // Engine kill-switch truth (system_state.paused in Neon — what send-due actually checks)
  let paused = null;
  if (env.NEON_URL) {
    try {
      const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
      const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT value FROM system_state WHERE key='paused'", params: [] }) });
      if (r.ok) { const d = await r.json(); const rows = d.rows || d.results || []; paused = String((rows[0] || {}).value || '').toLowerCase() === 'true'; }
    } catch (_e) {}
  }
  return json({
    paused,
    greeting,
    truth: {
      real: { prospects: contact.length + briefings.length, sent: 0, replies: 0, booked: bookings.length, won: 0 },
      test: { prospects: 0, sent: 0, replies: 0, booked: 0, won: 0 },
    },
    cards,
    flags,
    pipeline_today: { sourced: 0, sent: 0, replies: 0, bookings: todayBookings.length, forms: todayContact.length + todayBriefings.length },
    build_sha: env.CF_PAGES_COMMIT_SHA || 'dev',
    build_at: env.CF_PAGES_BRANCH ? new Date().toISOString() : '',
  });
};
