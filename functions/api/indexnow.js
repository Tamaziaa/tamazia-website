// /api/indexnow · Phase 5 perfection · ping IndexNow API on demand
// Body: { urls: ["https://tamazia.co.uk/insights/foo/", ...] }
// Verifies x-indexnow-secret header against env.

const INDEXNOW_KEY = 'a8c7e0d2f6b4490fbda115c6d23e8740';

export const onRequestPost = async ({ request, env }) => {
  const baseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  // Auth · shared secret
  const auth = request.headers.get('x-indexnow-secret');
  if (env.INDEXNOW_TRIGGER_SECRET && auth !== env.INDEXNOW_TRIGGER_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: baseHeaders });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: baseHeaders }); }

  const urls = Array.isArray(body.urls) ? body.urls.slice(0, 10000) : [];
  if (!urls.length) return new Response(JSON.stringify({ error: 'no_urls' }), { status: 400, headers: baseHeaders });

  // Phase 11 · daily rate-limit (Bing IndexNow allows 10k URLs/day)
  if (env.FORM_SUBMISSIONS) {
    const today = new Date().toISOString().slice(0, 10);
    const counterKey = `indexnow-daily:${today}`;
    const existingRaw = await env.FORM_SUBMISSIONS.get(counterKey);
    const existing = existingRaw ? Number(existingRaw) : 0;
    if (existing + urls.length > 9000) {
      return new Response(JSON.stringify({ error: 'daily_quota_exceeded', sent_today: existing, would_send: urls.length }), { status: 429, headers: baseHeaders });
    }
    // Update counter atomically (eventual consistency acceptable for daily quota)
    await env.FORM_SUBMISSIONS.put(counterKey, String(existing + urls.length), { expirationTtl: 60 * 60 * 36 });
  }

  const payload = {
    host: 'tamazia.co.uk',
    key: INDEXNOW_KEY,
    keyLocation: `https://tamazia.co.uk/${INDEXNOW_KEY}.txt`,
    urlList: urls
  };

  // Submit to IndexNow shared endpoint (Bing forwards to Yandex, Naver, etc.)
  const r = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return new Response(JSON.stringify({
    ok: r.ok,
    status: r.status,
    submitted: urls.length,
    indexnow_response: r.status
  }), { status: r.ok ? 200 : 502, headers: baseHeaders });
};

export const onRequestGet = async () => new Response(JSON.stringify({
  service: 'indexnow-trigger',
  key: INDEXNOW_KEY,
  keyLocation: `https://tamazia.co.uk/${INDEXNOW_KEY}.txt`,
  usage: 'POST { urls: [...] } with x-indexnow-secret header'
}), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
