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
export async function neonQuery(env, query, params = []) {
  const url = neonUrl(env);
  if (!url) return { ok: false, rows: [], error: 'neon_unconfigured' };
  try {
    const host = url.replace(/.*@([^/]+)\/.*/, '$1');
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': url, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });
    if (!r.ok) return { ok: false, rows: [], error: 'neon_http_' + r.status };
    const d = await r.json();
    return { ok: true, rows: d.rows || d.results || [], error: null };
  } catch (e) {
    return { ok: false, rows: [], error: (e && e.message) || 'neon_exception' };
  }
}
