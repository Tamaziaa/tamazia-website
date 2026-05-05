// /api/admin-submissions · Phase 3 perfection · auth-gated KV read
// Authentication: Cloudflare Access OR a basic shared secret in ADMIN_SECRET env

export const onRequestGet = async ({ request, env }) => {
  const auth = request.headers.get('x-admin-secret') || new URL(request.url).searchParams.get('key');
  if (!env.ADMIN_SECRET || auth !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  if (!env.FORM_SUBMISSIONS) {
    return new Response(JSON.stringify({ error: 'kv_not_bound' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || '';
  const ALLOWED_TABS = ['', 'contact', 'briefings', 'audit', 'bookings'];
  if (!ALLOWED_TABS.includes(tab)) {
    return new Response(JSON.stringify({ error: 'invalid_tab', allowed: ALLOWED_TABS.filter(t => t) }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 1000);

  const list = await env.FORM_SUBMISSIONS.list({
    prefix: tab ? `${tab}:` : '',
    limit
  });
  const records = await Promise.all(list.keys.map(async k => {
    const value = await env.FORM_SUBMISSIONS.get(k.name);
    return value ? JSON.parse(value) : null;
  }));

  return new Response(JSON.stringify({
    count: records.length,
    truncated: list.list_complete === false,
    submissions: records.filter(Boolean).sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
