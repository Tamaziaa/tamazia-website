// /api/audit-request · the homepage "Run my audit" lead-capture (founder r2).
// Does NOT run the live scoring engine (/api/audit). It captures the request,
// persists it (KV + Neon leads pipeline) and alerts the founder on Slack +
// Telegram, then the audit is prepared and emailed. Reuses the proven
// handleSubmission pipeline (validation, honeypots, idempotency, Resend ack).
import { handleSubmission } from './contact.js';

export const onRequestPost = (context) => handleSubmission(context.request, context.env, 'audit', context);

// S1[D1/C81/C82] · CORS preflight restricted to the site origin (+ Cloudflare Pages previews),
// off the previous '*'. Mirrors contact.js / briefings.js allowOrigin() so this endpoint matches
// the rest of the form stack: a same-origin POST (no Origin header) still works and a cross-site
// browser caller is denied by CORS. (The POST itself already runs through handleSubmission, which
// sets the same restricted Access-Control-Allow-Origin on the response.)
export const onRequestOptions = ({ request }) => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': allowOrigin(request),
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});

function allowOrigin(request) {
  const SITE = 'https://tamazia.co.uk';
  const origin = (request && request.headers && request.headers.get('Origin')) || '';
  if (!origin) return SITE;
  try {
    const u = new URL(origin);
    if (u.protocol === 'https:' && (
      u.hostname === 'tamazia.co.uk' ||
      u.hostname === 'www.tamazia.co.uk' ||
      u.hostname.endsWith('.pages.dev')
    )) return origin;
  } catch (_e) { /* malformed Origin → fall through to canonical */ }
  return SITE;
}
