import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const today = new Date().toISOString().slice(0, 10);
  // Pull KV-based today counts
  const contact = await listKv(env, 'contact:', 200);
  const briefings = await listKv(env, 'briefings:', 200);
  const bookings = await listKv(env, 'bookings:', 200);
  const t = {
    contact: contact.length,
    briefings: briefings.length,
    bookings: bookings.length,
    contact_today: contact.filter(c => (c.submitted_at||'').startsWith(today)).length,
    briefings_today: briefings.filter(c => (c.submitted_at||'').startsWith(today)).length,
    bookings_today: bookings.filter(b => (b.received_at||b.cal_start_time||'').startsWith(today)).length,
  };
  // 8-stage conveyor (Sourced → Enriched → Verified → Qualified → Audited → Sent → Replied → Booked)
  const stages = [
    { key: 'source',      letter: 'A', label: 'Sourcing',        total: t.contact + t.briefings + t.bookings, today: t.contact_today + t.briefings_today + t.bookings_today },
    { key: 'enrich',      letter: 'B', label: 'Enrichment',      total: t.contact + t.briefings, today: t.contact_today + t.briefings_today },
    { key: 'verify',      letter: 'C', label: 'Verification',    total: t.contact + t.briefings, today: t.contact_today + t.briefings_today },
    { key: 'qualify',     letter: 'D', label: 'Qualification',   total: t.contact + t.briefings, today: t.contact_today + t.briefings_today },
    { key: 'audit',       letter: 'E', label: 'Audit minted',    total: t.briefings, today: t.briefings_today },
    { key: 'send',        letter: 'F', label: 'Send',            total: t.briefings, today: t.briefings_today },
    { key: 'reply',       letter: 'G', label: 'Reply',           total: 0, today: 0 },
    { key: 'book',        letter: 'H', label: 'Booked',          total: t.bookings, today: t.bookings_today },
  ];
  return json({ stages, generated_at: new Date().toISOString() });
};
