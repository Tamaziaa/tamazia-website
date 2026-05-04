// /api/briefings · Phase 3 perfection · KV-backed receiver
import { handleSubmission } from '../_shared/forms-receiver.js';

export const onRequestPost = ({ request, env }) => handleSubmission(request, env, 'briefings');

export const onRequestOptions = () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
