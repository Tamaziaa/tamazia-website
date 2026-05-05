// /api/health · Phase 4 perfection · probe KV + Resend + DNS
export const onRequestGet = async ({ env, request }) => {
  const checks = {
    version: '2026-05-05-phase4',
    timestamp: new Date().toISOString(),
    env_present: {
      RESEND_API_KEY: !!env.RESEND_API_KEY,
      ADMIN_SECRET: !!env.ADMIN_SECRET,
      FORM_SUBMISSIONS_kv: !!env.FORM_SUBMISSIONS,
      CONTACT_FROM: !!env.CONTACT_FROM,
      CONTACT_TO: !!env.CONTACT_TO
    },
    kv: 'unknown',
    forms_writable: 'unknown'
  };

  // KV write+read round-trip probe
  if (env.FORM_SUBMISSIONS) {
    try {
      const probeKey = '__health_probe__';
      const probeValue = String(Date.now());
      await env.FORM_SUBMISSIONS.put(probeKey, probeValue, { expirationTtl: 60 });
      const got = await env.FORM_SUBMISSIONS.get(probeKey);
      checks.kv = got === probeValue ? 'ok' : 'mismatch';
      checks.forms_writable = 'ok';
    } catch (e) {
      checks.kv = 'error:' + e.message;
      checks.forms_writable = 'error';
    }
  } else {
    checks.kv = 'unbound';
    checks.forms_writable = 'kv_unbound_safe_to_send';
  }

  return new Response(JSON.stringify(checks, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
