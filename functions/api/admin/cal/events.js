import { authed, unauth, json } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.CAL_API_KEY) return json({ event_types: [], error: 'CAL_API_KEY unbound' });
  try {
    const r = await fetch('https://api.cal.com/v2/event-types', {
      headers: { 'Authorization': 'Bearer ' + env.CAL_API_KEY }
    });
    const d = await r.json();
    const groups = d.data?.eventTypeGroups || [];
    const all = [];
    for (const g of groups) {
      for (const et of (g.eventTypes || [])) {
        all.push({
          id: et.id,
          slug: et.slug,
          title: et.title,
          length: et.length,
          hidden: !!et.hidden,
          description: (et.description || '').slice(0, 240),
          url: `https://cal.com/${g.profile?.slug || 'tamazia'}/${et.slug}`,
        });
      }
    }
    return json({ event_types: all, count: all.length });
  } catch (e) { return json({ event_types: [], error: e.message }); }
};
