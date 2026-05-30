// /api/admin/_lib.js · shared auth + helpers for cockpit endpoints
export function authed(request, env) {
  // Founder removed the in-page secret gate 2026-05-30 (single-user cockpit; outer gate = Cloudflare Access).
  // To re-enable: const k = request.headers.get('x-admin-secret'); return !!env.ADMIN_SECRET && k === env.ADMIN_SECRET;
  return true;
}
export function unauth() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}

// List KV keys with a prefix and bulk-read their JSON values
export async function listKv(env, prefix, limit = 100) {
  if (!env.FORM_SUBMISSIONS) return [];
  const out = [];
  let cursor;
  do {
    const r = await env.FORM_SUBMISSIONS.list({ prefix, limit: Math.min(limit, 1000), cursor });
    for (const k of r.keys) {
      const v = await env.FORM_SUBMISSIONS.get(k.name);
      if (!v) continue;
      try { out.push(JSON.parse(v)); } catch {}
      if (out.length >= limit) return out;
    }
    cursor = r.cursor;
    if (r.list_complete) break;
  } while (cursor && out.length < limit);
  return out;
}

// State getter/setter via KV
export async function getState(env, key, fallback = null) {
  if (!env.FORM_SUBMISSIONS) return fallback;
  const v = await env.FORM_SUBMISSIONS.get('admin-state:' + key);
  return v == null ? fallback : v;
}
export async function setState(env, key, value) {
  if (!env.FORM_SUBMISSIONS) return false;
  await env.FORM_SUBMISSIONS.put('admin-state:' + key, String(value));
  return true;
}

// Probe a URL with timeout (returns {ok, latency_ms, detail, status})
export async function probe(name, url, opts = {}) {
  const t0 = Date.now();
  const timeout = opts.timeout || 5000;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(to);
    return { name, status: r.ok ? 'green' : 'amber', latency_ms: Date.now() - t0, detail: 'HTTP ' + r.status, http: r.status };
  } catch (e) {
    return { name, status: 'red', latency_ms: Date.now() - t0, detail: (e.message || 'err').slice(0, 120) };
  }
}
