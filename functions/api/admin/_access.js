// /api/admin/_access.js · Cloudflare Access JWT verification (WebCrypto, RS256)
// Used by the /api/admin/* middleware as the second auth factor: a request that
// traversed Cloudflare Access on the custom domain carries Cf-Access-Jwt-Assertion,
// which we verify against the team's public certs. Closes the pages.dev bypass
// (a forged header fails signature verification).

const DEFAULT_TEAM_DOMAIN = 'tamazia-pvt-ltd.cloudflareaccess.com';

let CERT_CACHE = { keys: null, fetched: 0 };

function teamDomain(env) {
  return (env.ACCESS_TEAM_DOMAIN || DEFAULT_TEAM_DOMAIN).replace(/^https?:\/\//, '').replace(/\/$/, '');
}

async function getKeys(env) {
  if (CERT_CACHE.keys && Date.now() - CERT_CACHE.fetched < 3600 * 1000) return CERT_CACHE.keys;
  try {
    const r = await fetch(`https://${teamDomain(env)}/cdn-cgi/access/certs`);
    if (!r.ok) return CERT_CACHE.keys || [];
    const jwks = await r.json();
    if (Array.isArray(jwks.keys) && jwks.keys.length) CERT_CACHE = { keys: jwks.keys, fetched: Date.now() };
  } catch { /* keep stale cache */ }
  return CERT_CACHE.keys || [];
}

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function verifyAccessJwt(jwt, env) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return false;
    const [h, p, s] = parts;
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return false;
    if (payload.iss !== `https://${teamDomain(env)}`) return false;
    // AUD pinning is enforced once ACCESS_AUD is configured; issuer+signature
    // already bind the token to this team's Access instance.
    if (env.ACCESS_AUD) {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(env.ACCESS_AUD)) return false;
    }

    const keys = await getKeys(env);
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)
    );
  } catch {
    return false;
  }
}
