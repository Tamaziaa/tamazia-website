// /api/nel-report · Phase 9 hardened · Network Error Logging receiver
// Body-size cap 32KB · Content-Type validation · 30-day KV TTL · IP truncated.

const MAX_BODY_BYTES = 32 * 1024;

export const onRequestPost = async ({ request, env }) => {
  const cl = parseInt(request.headers.get('content-length') || '0', 10);
  if (cl > MAX_BODY_BYTES) return new Response('payload_too_large', { status: 413 });
  const ctype = (request.headers.get('content-type') || '').toLowerCase();
  if (ctype && !/(application\/reports\+json|application\/json)/.test(ctype)) {
    return new Response('unsupported_media_type', { status: 415 });
  }
  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return new Response('payload_too_large', { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response('invalid_json', { status: 400 });
  }
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ip_truncated = ip.replace(/\.\d+$/, '.x').replace(/:[\da-f]+$/i, ':x');
  if (env.FORM_SUBMISSIONS) {
    const key = `nel:${Date.now()}:${crypto.randomUUID().slice(0,8)}`;
    await env.FORM_SUBMISSIONS.put(key, JSON.stringify({
      at: new Date().toISOString(),
      ip_truncated,
      ip_country: request.headers.get('cf-ipcountry') || '',
      reports: Array.isArray(body) ? body.slice(0, 50) : body
    }), { expirationTtl: 60 * 60 * 24 * 30 });
  }
  return new Response(null, { status: 204 });
};

export const onRequestOptions = () => new Response(null, { status: 204 });
