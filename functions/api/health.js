// /api/health · Phase 10 hardened · public minimal + admin-only detail
// Public response: version, timestamp, kv_status, resend_status (boolean only).
// X-Admin-Secret header response: full env_present enumeration + format_valid + kv_quota.
export const onRequestGet = async ({ env, request }) => {
  const isAdmin = request.headers.get('x-admin-secret') && env.ADMIN_SECRET && request.headers.get('x-admin-secret') === env.ADMIN_SECRET;
  const VERSION = env.BUILD_VERSION || env.CF_PAGES_COMMIT_SHA?.slice(0,7) || '2026-05-05-phase10';
  const BUILD_AT = env.BUILD_AT || null;
  const DEPLOYED_AT = env.CF_PAGES_DEPLOYMENT_ID ? `cf-${env.CF_PAGES_DEPLOYMENT_ID.slice(0,8)}` : null;

  const publicChecks = {
    version: VERSION,
    timestamp: new Date().toISOString(),
    build_at: BUILD_AT,
    deployed_at: DEPLOYED_AT,
    status: 'ok',
    kv: env.FORM_SUBMISSIONS ? 'bound' : 'unbound',
    resend: env.RESEND_API_KEY ? 'configured' : 'unbound',
    cal_webhook: env.CAL_WEBHOOK_SECRET ? 'configured' : 'unbound'
  };

  if (!isAdmin) {
    return new Response(JSON.stringify(publicChecks), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Vary': 'X-Admin-Secret'
      }
    });
  }

  // Admin-detailed response
  const detail = {
    ...publicChecks,
    format_valid: {
      RESEND_API_KEY: /^re_[A-Za-z0-9_]{16,}$/.test(env.RESEND_API_KEY || ''),
      CAL_WEBHOOK_SECRET: /^[a-f0-9]{32,128}$/.test(env.CAL_WEBHOOK_SECRET || ''),
      INDEXNOW_KEY: /^[a-f0-9]{32}$/.test(env.INDEXNOW_KEY || ''),
      SHEETS_HMAC_SECRET: (env.SHEETS_HMAC_SECRET || '').length >= 16,
      ALERT_TO: /@/.test(env.ALERT_TO || env.CONTACT_TO || ''),
      DSAR_SIGNING_SECRET: (env.DSAR_SIGNING_SECRET || '').length >= 16,
      TURNSTILE_SECRET_KEY: /^0x[A-Za-z0-9_-]+$/.test(env.TURNSTILE_SECRET_KEY || '')
    },
    env_present: {
      RESEND_API_KEY: !!env.RESEND_API_KEY,
      ADMIN_SECRET: !!env.ADMIN_SECRET,
      DSAR_SIGNING_SECRET: !!env.DSAR_SIGNING_SECRET,
      FORM_SUBMISSIONS_kv: !!env.FORM_SUBMISSIONS,
      CONTACT_FROM: !!env.CONTACT_FROM,
      CONTACT_TO: !!env.CONTACT_TO,
      CAL_WEBHOOK_SECRET: !!env.CAL_WEBHOOK_SECRET,
      INDEXNOW_KEY: !!env.INDEXNOW_KEY,
      SHEETS_WEBHOOK_URL: !!env.SHEETS_WEBHOOK_URL,
      SHEETS_HMAC_SECRET: !!env.SHEETS_HMAC_SECRET,
      RESEND_FROM_ALERT: !!env.RESEND_FROM_ALERT,
      RESEND_FROM_ACK: !!env.RESEND_FROM_ACK,
      TURNSTILE_SECRET_KEY: !!env.TURNSTILE_SECRET_KEY,
      ZEROBOUNCE_API_KEY: !!env.ZEROBOUNCE_API_KEY,
      HUNTER_API_KEY: !!env.HUNTER_API_KEY,
      NEVERBOUNCE_API_KEY: !!env.NEVERBOUNCE_API_KEY
    }
  };

  // KV quota probe (count keys across known namespaces; first 1000 each)
  if (env.FORM_SUBMISSIONS) {
    try {
      const counts = {};
      for (const prefix of ['contact:', 'briefings:', 'audit:', 'bookings:', 'cal-uid:', 'admin-access:', 'erase-log:']) {
        const list = await env.FORM_SUBMISSIONS.list({ prefix, limit: 1000 });
        counts[prefix.replace(':', '')] = list.keys.length + (list.list_complete === false ? '+' : '');
      }
      detail.kv_namespaces = counts;
    } catch (e) {
      detail.kv_error = e.message;
    }
  }

  // Resend auth probe
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY }
      });
      detail.resend_probe = r.ok ? 'ok' : ('http_' + r.status);
    } catch (e) {
      detail.resend_probe = 'error:' + e.message;
    }
  }

  return new Response(JSON.stringify(detail, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Vary': 'X-Admin-Secret'
    }
  });
};
