import { authed, unauth, json, listKv } from './_lib.js';

// GET /api/admin/audits?limit=50&q=keyword
// Returns saved audit runs from KV (key prefix audit-run:*)
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  const q = (url.searchParams.get('q') || '').toLowerCase();
  const all = await listKv(env, 'audit-run:', limit);
  let filtered = all;
  if (q) {
    filtered = all.filter(a =>
      (a.input || '').toLowerCase().includes(q) ||
      (a.sector || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    );
  }
  filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return json({ audits: filtered.slice(0, limit), count: filtered.length });
};
