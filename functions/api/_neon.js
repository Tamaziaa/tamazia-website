// Single source of truth for Neon access from Cloudflare Pages Functions.
// Resolves the connection string from any of the accepted env names so no channel
// can silently break on a naming mismatch, and uses the HTTP /sql endpoint that
// works on the Workers runtime (the TCP pg Pool driver does not).
export function neonUrl(env) {
  return (env && (env.NEON_URL || env.NEON_CONNECTION_STRING || env.NEON_DATABASE_URL)) || null;
}
export function neonConfigured(env) {
  return !!neonUrl(env);
}
// Run a parameterised query. Returns { ok, rows, error }. Never throws.
// Retries transient failures (network blip / 5xx) with backoff; does NOT retry 4xx (deterministic SQL errors).
export async function neonQuery(env, query, params = [], opts = {}) {
  const url = neonUrl(env);
  if (!url) return { ok: false, rows: [], error: 'neon_unconfigured' };
  const host = url.replace(/.*@([^/]+)\/.*/, '$1');
  const retries = opts.retries == null ? 2 : opts.retries;
  let lastErr = 'neon_unknown';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch('https://' + host + '/sql', {
        method: 'POST',
        headers: { 'Neon-Connection-String': url, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, params }),
      });
      if (r.ok) { const d = await r.json(); return { ok: true, rows: d.rows || d.results || [], error: null }; }
      lastErr = 'neon_http_' + r.status;
      if (r.status >= 400 && r.status < 500) return { ok: false, rows: [], error: lastErr }; // deterministic — don't retry
    } catch (e) {
      lastErr = (e && e.message) || 'neon_exception';
    }
    if (attempt < retries) await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
  }
  return { ok: false, rows: [], error: lastErr };
}
