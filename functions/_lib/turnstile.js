// Phase 7 · Cloudflare Turnstile server-side verification
// Verifies cf-turnstile-response token via siteverify endpoint.
// Returns { ok: true } if pass OR if TURNSTILE_SECRET_KEY env not bound (fail-open).
// Returns { ok: false, reason } if token invalid OR challenge failed.
export async function verifyTurnstile(request, body, env) {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: true, skipped: 'no_secret' };
  const token = body['cf-turnstile-response'] || body.cf_turnstile_response || '';
  if (!token) return { ok: false, reason: 'missing_token' };
  const ip = request.headers.get('cf-connecting-ip') || '';
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip
      })
    });
    if (!r.ok) return { ok: false, reason: 'siteverify_http_' + r.status };
    const j = await r.json();
    if (j.success) return { ok: true, action: j.action || null, hostname: j.hostname || null };
    return { ok: false, reason: 'challenge_failed', codes: j['error-codes'] || [] };
  } catch (e) {
    return { ok: false, reason: 'siteverify_error', message: e.message };
  }
}
