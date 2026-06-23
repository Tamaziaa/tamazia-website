import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  // Try Neon first
  if (env.NEON_URL) {
    try {
      const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
      // Join the matched lead so the inbox shows the company name, not a bare email address.
      // matched_lead_id is the column the reply-matcher writes (LEFT JOIN: unmatched replies still show).
      const sql = `SELECT ie.id, ie.from_email, ie.subject, ie.body, ie.classification, ie.received_at,
          l.company, l.domain
        FROM inbound_emails ie LEFT JOIN leads l ON l.id = ie.matched_lead_id
        ORDER BY ie.received_at DESC NULLS LAST LIMIT $1`;
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
