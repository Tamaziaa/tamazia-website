// /admin/session — hands the cockpit its API key, but ONLY to a request that
// genuinely traversed Cloudflare Access. /admin/* is Access-gated, so the founder's
// authenticated browser session carries a valid Cf-Access-Jwt-Assertion here; we
// verify it cryptographically before returning the key. Anyone hitting this without
// a valid Access JWT (e.g. the *.pages.dev host, or Access misconfigured) gets null.
//
// Result: the cockpit auto-unlocks for the founder with ZERO paste and no dashboard
// change. The key never leaves an Access-authenticated session.
import { verifyAccessJwt } from '../api/admin/_access.js';

export const onRequestGet = async ({ request, env }) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' };
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (jwt && env.ADMIN_SECRET && (await verifyAccessJwt(jwt, env))) {
    return new Response(JSON.stringify({ key: env.ADMIN_SECRET, source: 'access' }), { headers });
  }
  // No valid Access JWT — do not leak anything. The cockpit falls back to the
  // one-time paste modal (or the founder adds /api/admin* to the Access app).
  return new Response(JSON.stringify({ key: null, source: jwt ? 'jwt-invalid' : 'no-jwt' }), { headers });
};
