import { authed, unauth, json } from '../_lib.js';

// POST /api/admin/scrape/run · runs SERPER / Hunter / NeverBounce and persists to KV
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const body = await request.json().catch(() => ({}));
  const { type, query, sector = '', geo = '' } = body || {};
  if (!type || !query) return json({ error: 'type + query required' }, 400);
  const t0 = Date.now();
  let result; let ok = false; let result_count = 0;
  try {
    if (type === 'serper') {
      if (!env.SERPER_API_KEY) return json({ error: 'SERPER_API_KEY unbound' }, 503);
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': env.SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: geo || 'gb', num: 50 })
      });
      result = await r.json();
      result_count = (result.organic || []).length + (result.sponsored || []).length;
      ok = r.ok;
    } else if (type === 'hunter-domain') {
      if (!env.HUNTER_API_KEY) return json({ error: 'HUNTER_API_KEY unbound' }, 503);
      const r = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(query)}&api_key=${env.HUNTER_API_KEY}`);
      result = await r.json();
      result_count = (result.data?.emails || []).length;
      ok = r.ok;
    } else if (type === 'hunter-verify') {
      if (!env.HUNTER_API_KEY) return json({ error: 'HUNTER_API_KEY unbound' }, 503);
      const r = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(query)}&api_key=${env.HUNTER_API_KEY}`);
      result = await r.json();
      result_count = 1;
      ok = r.ok;
    } else if (type === 'neverbounce') {
      if (!env.NEVERBOUNCE_API_KEY) return json({ error: 'NEVERBOUNCE_API_KEY unbound' }, 503);
      const r = await fetch(`https://api.neverbounce.com/v4/single/check?key=${env.NEVERBOUNCE_API_KEY}&email=${encodeURIComponent(query)}`);
      result = await r.json();
      result_count = 1;
      ok = r.ok;
    } else {
      return json({ error: 'unknown type · supported: serper, hunter-domain, hunter-verify, neverbounce' }, 400);
    }
  } catch (e) {
    result = { error: e.message };
  }
  const latency_ms = Date.now() - t0;
  // Persist
  const ts = new Date().toISOString();
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0, 12) : Date.now().toString(36);
  const record = {
    id, created_at: ts, type, query, sector, geo,
    ok, result_count, latency_ms,
    result,
    request_id: request.headers.get('cf-ray') || '',
  };
  if (env.FORM_SUBMISSIONS) {
    try { await env.FORM_SUBMISSIONS.put('scrape-run:' + ts + ':' + id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 365 * 2 }); } catch (_e) {}
  }
  return json({ ok, type, query, result_count, latency_ms, id, key: 'scrape-run:' + ts + ':' + id, preview: result });
};
