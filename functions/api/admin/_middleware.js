// /api/admin/_middleware.js · fail-closed auth gate for EVERY /api/admin/* endpoint.
// Context: /admin (the UI) is behind Cloudflare Access, but /api/admin/* was reachable
// unauthenticated on both tamazia.co.uk and the *.pages.dev host, exposing the lead DB.
// This middleware closes both, with zero edits to the 44 endpoint handlers.
//
// Accepted credentials, in order:
//   1. x-admin-secret header matching env.ADMIN_SECRET (scripts/CLI/cockpit login)
//   2. Cf-Access-Jwt-Assertion verified against the team certs (browser sessions on
//      tamazia.co.uk once the Access app covers /api/admin*)
//   3. ?s=ADMIN_SECRET query — ONLY for events/stream (EventSource cannot set headers;
//      stream.js re-checks this itself)
// Exempt: notify-deploy (POST-only, self-verifying via GitHub API run lookup).

import { verifyAccessJwt } from './_access.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');

  if (path === '/api/admin/notify-deploy') return next();

  const secret = env.ADMIN_SECRET;
  const headerKey = request.headers.get('x-admin-secret');
  if (secret && headerKey === secret) return next();

  if (path === '/api/admin/events/stream' && secret && url.searchParams.get('s') === secret) {
    return next();
  }

  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (jwt && (await verifyAccessJwt(jwt, env))) return next();

  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
