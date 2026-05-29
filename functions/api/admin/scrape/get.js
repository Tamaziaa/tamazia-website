import { authed, unauth, json } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!id) return json({ error: 'id required' }, 400);
  if (!env.FORM_SUBMISSIONS) return json({ error: 'kv unbound' }, 503);
  const key = id.startsWith('scrape-run:') ? id : 'scrape-run:' + id;
  const v = await env.FORM_SUBMISSIONS.get(key);
  if (!v) return json({ error: 'not found' }, 404);
  try { return json(JSON.parse(v)); } catch { return json({ error: 'parse' }, 500); }
};
