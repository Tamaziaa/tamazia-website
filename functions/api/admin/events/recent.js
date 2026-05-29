import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  // Synthesize recent events from KV (last 20)
  const events = [];
  const contact = await listKv(env, 'contact:', 5);
  const bookings = await listKv(env, 'bookings:', 5);
  const briefings = await listKv(env, 'briefings:', 5);
  for (const c of contact) events.push({ t: (c.submitted_at || '').slice(11, 16), msg: 'contact form · ' + (c.email || '?'), sev: 'info' });
  for (const b of briefings) events.push({ t: (b.submitted_at || '').slice(11, 16), msg: 'briefings form · ' + (b.email || '?'), sev: 'info' });
  for (const b of bookings) events.push({ t: (b.cal_start_time || '').slice(11, 16), msg: 'cal booking · ' + (b.name || '?'), sev: 'ok' });
  events.sort((a, b) => (b.t || '').localeCompare(a.t || ''));
  return json({ events });
};
