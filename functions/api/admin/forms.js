import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  const tab = url.searchParams.get('tab') || '';
  const prefix = tab ? tab + ':' : '';
  const all = tab
    ? await listKv(env, prefix, limit)
    : [...await listKv(env, 'contact:', limit), ...await listKv(env, 'briefings:', limit)];
  all.sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''));
  return json({ count: all.length, submissions: all.slice(0, limit) });
};
