// /api/csp-report · Phase 9 hardened · CSP violation receiver
// Body-size cap 32KB · Content-Type accepts application/csp-report or
// application/reports+json · CF Logpush captures the structured log.
// Persists to KV with 30-day TTL so we can query for trends.

const MAX_BODY_BYTES = 32 * 1024;

export const onRequestPost = async ({ request, env }) => {
  const cl = parseInt(request.headers.get('content-length') || '0', 10);
  if (cl > MAX_BODY_BYTES) {
    return new Response('payload_too_large', { status: 413 });
  }
  const ctype = (request.headers.get('content-type') || '').toLowerCase();
  if (ctype && !/(application\/csp-report|application\/reports\+json|application\/json)/.test(ctype)) {
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
  // CF Logpush picks up console output
  console.log('[csp-report]', JSON.stringify({
    at: new Date().toISOString(),
    ip_country: request.headers.get('cf-ipcountry') || '',
    body_summary: summarize(body)
  }));
  if (env.FORM_SUBMISSIONS) {
    const key = `csp:${Date.now()}:${crypto.randomUUID().slice(0,8)}`;
    await env.FORM_SUBMISSIONS.put(key, JSON.stringify({
      at: new Date().toISOString(),
      ip_country: request.headers.get('cf-ipcountry') || '',
      summary: summarize(body)
    }), { expirationTtl: 60 * 60 * 24 * 30 });
  }
  return new Response(null, { status: 204 });
};

function summarize(b) {
  // Reports format includes report-uri legacy (csp-report key) and
  // report-to modern (array of {type, body}).
  if (Array.isArray(b)) {
    return b.map(r => ({ type: r.type, directive: r.body?.['effective-directive'] || r.body?.['violated-directive'], blocked: r.body?.['blocked-uri'] }));
  }
  if (b['csp-report']) {
    return [{
      type: 'csp-violation',
      directive: b['csp-report']['effective-directive'] || b['csp-report']['violated-directive'],
      blocked: b['csp-report']['blocked-uri']
    }];
  }
  return [{ type: 'unknown', raw: 'shape unrecognised' }];
}

export const onRequestOptions = () => new Response(null, { status: 204 });
