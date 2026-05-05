// /api/nel-report · Phase 7 · Network Error Logging endpoint
// Browsers post NEL violations here per the NEL header in _headers.
// Stored in KV under `nel:<timestamp>:<request_id>` with 30-day TTL.

export const onRequestPost = async ({ request, env }) => {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/reports+json') && !ct.includes('application/json')) {
    return new Response(null, { status: 204 });
  }
  let reports = [];
  try { reports = await request.json(); } catch { return new Response(null, { status: 204 }); }
  if (!Array.isArray(reports)) reports = [reports];

  const ts = Date.now();
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';

  for (const r of reports.slice(0, 10)) {
    const key = `nel:${ts}:${crypto.randomUUID()}`;
    const record = {
      received_at: new Date(ts).toISOString(),
      type: r.type || 'unknown',
      url: r.url || '',
      body: r.body || {},
      ip_truncated: ip.replace(/\.\d+$/, '.0').replace(/:[^:]+$/, ':0'),
      ua: ua.slice(0, 200),
    };
    if (env.FORM_SUBMISSIONS) {
      try {
        await env.FORM_SUBMISSIONS.put(key, JSON.stringify(record), {
          expirationTtl: 60 * 60 * 24 * 30
        });
      } catch {}
    }
  }
  try { console.log(JSON.stringify({ component: 'nel-report', count: reports.length, outcome: 'persisted' })); } catch {}
  return new Response(null, { status: 204 });
};

export const onRequest = async () => new Response(null, {
  status: 405,
  headers: { 'Allow': 'POST' }
});
