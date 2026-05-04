// Cloudflare Pages Function · /api/csp-report
// Phase 0 leftover · captures CSP violation reports during Report-Only windows.
// Logs to Cloudflare Pages Functions logs (visible at Cloudflare dashboard).

export const onRequestPost = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const violation = body['csp-report'] || body[0]?.body || body;
  if (violation) {
    console.warn('[csp-violation]', JSON.stringify({
      blocked: violation['blocked-uri'] || violation.blockedURL,
      directive: violation['violated-directive'] || violation.effectiveDirective,
      source: violation['source-file'] || violation.sourceFile,
      line: violation['line-number'] || violation.lineNumber,
      ts: new Date().toISOString(),
    }));
  }

  return new Response(null, { status: 204 });
};

export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' },
});
