import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  // Try Neon first
  if (env.NEON_URL) {
    try {
      const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
      const sql = `SELECT id, from_email, subject, body, classification, received_at FROM inbound_emails ORDER BY received_at DESC NULLS LAST LIMIT $1`;
      const r = await fetch(`https://${host}/sql`, {
        method: 'POST',
        headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql, params: [limit] }),
      });
      if (r.ok) {
        const d = await r.json();
        const rows = d.rows || d.results || [];
        return json({ source: 'neon', replies: rows, count: rows.length });
      }
    } catch (e) { /* fall through to KV */ }
  }
  // KV fallback (replies via cf-email-worker would land here)
  const replies = await listKv(env, 'reply:', limit);
  return json({ source: 'kv', replies, count: replies.length });
};
