import { authed, unauth, json } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!id) return json({ error: 'id required' }, 400);
  if (!env.FORM_SUBMISSIONS) return json({ error: 'kv unbound' }, 503);
  // id format: audit-run:<ts>:<rid>  OR just the rid suffix
  const key = id.startsWith('audit-run:') ? id : 'audit-run:' + id;
  const v = await env.FORM_SUBMISSIONS.get(key);
  if (!v) return json({ error: 'not found', key }, 404);
  try { return json(JSON.parse(v)); } catch { return json({ error: 'parse' }, 500); }
};
