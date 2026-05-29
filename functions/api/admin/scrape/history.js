import { authed, unauth, json, listKv } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  const q = (url.searchParams.get('q') || '').toLowerCase();
  const all = await listKv(env, 'scrape-run:', limit);
  let runs = all;
  if (q) runs = all.filter(r =>
    (r.query || '').toLowerCase().includes(q) ||
    (r.type || '').toLowerCase().includes(q) ||
    (r.sector || '').toLowerCase().includes(q)
  );
  runs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  // Strip large `result` blobs from list view
  const list = runs.slice(0, limit).map(r => ({ ...r, result: undefined }));
  return json({ runs: list, count: list.length });
};
