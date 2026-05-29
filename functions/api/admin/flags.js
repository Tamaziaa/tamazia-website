import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const contact = await listKv(env, 'contact:', 500);
  const briefings = await listKv(env, 'briefings:', 500);
  const bookings = await listKv(env, 'bookings:', 500);
  const flags = [];
  // F1: High-intent form submission today
  const highIntent = [...contact, ...briefings].filter(s => /authority|enterprise|magic.?circle|ipo|fortune|ftse|sovereign/i.test((s.message || s.brief || s.company || '')));
  const todayHI = highIntent.filter(s => (s.submitted_at || '').startsWith(today));
  if (todayHI.length) flags.push({ level: 'p1', kind: 'high-intent-form', count: todayHI.length, msg: `${todayHI.length} high-intent form submission(s) today need founder review.` });
  // F2: Cal booking today
  const todayBookings = bookings.filter(b => (b.received_at || b.cal_start_time || '').startsWith(today) && b.cal_trigger === 'BOOKING_CREATED');
  if (todayBookings.length) flags.push({ level: 'p1', kind: 'cal-booking', count: todayBookings.length, msg: `${todayBookings.length} new Cal.com booking(s) today.` });
  // F3: Cancellation
  const cancels = bookings.filter(b => b.cal_trigger === 'BOOKING_CANCELLED' && (b.received_at || '').startsWith(today));
  if (cancels.length) flags.push({ level: 'p2', kind: 'cal-cancel', count: cancels.length, msg: `${cancels.length} booking cancellation(s) today.` });
  // F4: Form rate change (last 7d vs prev week — placeholder)
  const week = [...contact, ...briefings].filter(s => (s.submitted_at || '') > weekAgo);
  if (week.length > 0) flags.push({ level: 'info', kind: 'form-rate', count: week.length, msg: `${week.length} form submissions in the last 7 days.` });
  // F5: No bookings in 7 days but >5 forms (conversion drop)
  if (week.length > 5 && bookings.filter(b => (b.received_at || '') > weekAgo && b.cal_trigger === 'BOOKING_CREATED').length === 0) {
    flags.push({ level: 'p2', kind: 'conversion-drop', count: week.length, msg: `${week.length} forms last week but 0 bookings · conversion at risk.` });
  }
  return json({ flags, checked_at: new Date().toISOString() });
};
