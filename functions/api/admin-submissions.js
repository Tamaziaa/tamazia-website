// /api/admin-submissions · Phase 3 perfection · auth-gated KV read
// Authentication: Cloudflare Access OR a basic shared secret in ADMIN_SECRET env

export const onRequestGet = async ({ request, env }) => {
  // Phase 10 · header-only auth (URL-param dropped; key in CDN logs is unsafe)
  const auth = request.headers.get('x-admin-secret');
  if (!env.ADMIN_SECRET || auth !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  // Per-access audit log
  if (env.FORM_SUBMISSIONS) {
    const auditKey = `admin-access:${Date.now()}:${crypto.randomUUID().slice(0,16)}`;
    await env.FORM_SUBMISSIONS.put(auditKey, JSON.stringify({
      at: new Date().toISOString(),
      ip_country: request.headers.get('cf-ipcountry') || '',
      ip_truncated: (request.headers.get('cf-connecting-ip') || '').replace(/\.\d+$/, '.x'),
      ua: (request.headers.get('user-agent') || '').slice(0, 200),
      auth_via: 'header',
      tab: new URL(request.url).searchParams.get('tab') || 'all'
    }), { expirationTtl: 60 * 60 * 24 * 365 }).catch(() => {});
  }

  if (!env.FORM_SUBMISSIONS) {
    return new Response(JSON.stringify({ error: 'kv_not_bound' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || '';
  const ALLOWED_TABS = ['', 'contact', 'briefings', 'audit', 'bookings', 'nel', 'csp', 'admin-access', 'erase-log', 'unsub-log'];
  if (!ALLOWED_TABS.includes(tab)) {
    return new Response(JSON.stringify({ error: 'invalid_tab', allowed: ALLOWED_TABS.filter(t => t) }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 1000);

  const cursor = url.searchParams.get('cursor') || undefined;
  const list = await env.FORM_SUBMISSIONS.list({
    prefix: tab ? `${tab}:` : '',
    limit,
    cursor
  });
  const records = await Promise.all(list.keys.map(async k => {
    const value = await env.FORM_SUBMISSIONS.get(k.name);
    return value ? JSON.parse(value) : null;
  }));

  return new Response(JSON.stringify({
    count: records.length,
    truncated: list.list_complete === false,
    next_cursor: list.list_complete ? null : list.cursor,
    submissions: records.filter(Boolean).sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'https://tamazia.co.uk',
      'Vary': 'Origin'
    }
  });
};
