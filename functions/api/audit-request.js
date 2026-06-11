// /api/audit-request · the homepage "Run my audit" lead-capture (founder r2).
// Does NOT run the live scoring engine (/api/audit). It captures the request,
// persists it (KV + Neon leads pipeline) and alerts the founder on Slack +
// Telegram, then the audit is prepared and emailed. Reuses the proven
// handleSubmission pipeline (validation, honeypots, idempotency, Resend ack).
import { handleSubmission } from './contact.js';

export const onRequestPost = ({ request, env }) => handleSubmission(request, env, 'audit');

export const onRequestOptions = () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
