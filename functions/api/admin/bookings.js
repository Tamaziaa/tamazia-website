import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  const all = await listKv(env, 'bookings:', limit);
  all.sort((a, b) => (b.cal_start_time || '').localeCompare(a.cal_start_time || ''));
  return json({ count: all.length, bookings: all.slice(0, limit) });
};
