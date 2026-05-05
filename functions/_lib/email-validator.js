// Phase 7 · Email validator · graceful fail-open with provider chain
// Order: ZeroBounce (5 free credits) → Hunter (25/mo free) → NeverBounce (0 free, paid only)
// Modes via env EMAIL_VALIDATION_MODE: off | tag (default) | strict
// Hard caps: 1500ms timeout per provider, fail-open on timeout/HTTP error.

const TIMEOUT_MS = 1500;

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

async function checkZeroBounce(email, key) {
  const t0 = Date.now();
  try {
    const r = await withTimeout(
      fetch(`https://api.zerobounce.net/v2/validate?api_key=${key}&email=${encodeURIComponent(email)}&ip_address=`),
      TIMEOUT_MS
    );
    if (!r.ok) return null;
    const j = await r.json();
    const status = j.status === 'valid' ? 'valid'
      : j.status === 'invalid' ? 'invalid'
      : j.status === 'spamtrap' || j.status === 'abuse' || j.status === 'do_not_mail' ? 'risky'
      : j.status === 'catch-all' || j.status === 'unknown' ? 'accept_all'
      : 'unknown';
    const isDisposable = j.disposable === true || j.disposable === 'true';
    return {
      provider: 'zerobounce',
      status: isDisposable ? 'disposable' : status,
      score: status === 'valid' ? 95 : status === 'invalid' ? 5 : 50,
      raw_status: j.status,
      disposable: !!isDisposable,
      free_email: j.free_email === true,
      role: j.role === true,
      mx_found: j.mx_found === 'true' || j.mx_found === true,
      latency_ms: Date.now() - t0
    };
  } catch { return null; }
}

async function checkHunter(email, key) {
  const t0 = Date.now();
  try {
    const r = await withTimeout(
      fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`),
      TIMEOUT_MS
    );
    if (!r.ok) return null;
    const j = await r.json();
    const d = j.data || {};
    const status = d.result === 'deliverable' ? 'valid'
      : d.result === 'undeliverable' ? 'invalid'
      : d.result === 'risky' ? 'risky'
      : 'unknown';
    return {
      provider: 'hunter',
      status: d.disposable ? 'disposable' : status,
      score: typeof d.score === 'number' ? d.score : (status === 'valid' ? 90 : 50),
      raw_status: d.result,
      disposable: !!d.disposable,
      role: !!d.role,
      mx_found: d.mx_records !== false,
      latency_ms: Date.now() - t0
    };
  } catch { return null; }
}

async function checkNeverBounce(email, key) {
  const t0 = Date.now();
  try {
    const r = await withTimeout(
      fetch('https://api.neverbounce.com/v4/single/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}&credits_info=0`
      }),
      TIMEOUT_MS
    );
    if (!r.ok) return null;
    const j = await r.json();
    if (j.status !== 'success') return null;
    const status = j.result === 'valid' ? 'valid'
      : j.result === 'invalid' ? 'invalid'
      : j.result === 'disposable' ? 'disposable'
      : j.result === 'catchall' ? 'accept_all'
      : 'unknown';
    return {
      provider: 'neverbounce',
      status,
      score: status === 'valid' ? 98 : status === 'invalid' ? 2 : 50,
      raw_status: j.result,
      disposable: j.result === 'disposable',
      latency_ms: Date.now() - t0
    };
  } catch { return null; }
}

export async function validateEmail(email, env) {
  const mode = (env.EMAIL_VALIDATION_MODE || 'tag').toLowerCase();
  if (mode === 'off') return { skipped: true, reason: 'mode_off' };
  if (!email || typeof email !== 'string') return { skipped: true, reason: 'no_email' };

  if (env.ZEROBOUNCE_API_KEY) {
    const r = await checkZeroBounce(email, env.ZEROBOUNCE_API_KEY);
    if (r) return r;
  }
  if (env.HUNTER_API_KEY) {
    const r = await checkHunter(email, env.HUNTER_API_KEY);
    if (r) return r;
  }
  if (env.NEVERBOUNCE_API_KEY) {
    const r = await checkNeverBounce(email, env.NEVERBOUNCE_API_KEY);
    if (r) return r;
  }
  return { skipped: true, reason: 'no_provider_available' };
}

export function shouldRejectEmail(validation, env) {
  const mode = (env.EMAIL_VALIDATION_MODE || 'tag').toLowerCase();
  if (mode !== 'strict') return { reject: false };
  if (!validation || validation.skipped) return { reject: false };
  if (validation.status === 'invalid') return { reject: true, reason: 'invalid_email' };
  if (validation.status === 'disposable') return { reject: true, reason: 'disposable_email' };
  return { reject: false };
}
