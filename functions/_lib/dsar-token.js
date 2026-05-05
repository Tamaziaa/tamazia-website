// Phase 8 · Signed token for DSAR/erase/portability one-click confirmation
// HMAC-SHA256 with ADMIN_SECRET as the signing key.
// Token format: <base64url payload>.<base64url signature>
// Payload: { email, action, request_id, exp }

async function sign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verify(message, sig, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
  const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(message));
}

function b64uEncode(obj) {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(s) {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4);
  return JSON.parse(atob(padded));
}

export async function mintToken({ email, action, request_id }, env, ttlSeconds) {
  // DSAR_SIGNING_SECRET preferred · falls back to ADMIN_SECRET for transition
  const secret = env.DSAR_SIGNING_SECRET || env.ADMIN_SECRET;
  if (!secret) throw new Error('signing secret unbound · cannot mint DSAR tokens');
  // Configurable default TTL via env, else 7 days
  if (!ttlSeconds) {
    const envTtl = parseInt(env.DSAR_TOKEN_TTL_SECONDS || '0', 10);
    ttlSeconds = envTtl > 0 ? envTtl : 7 * 24 * 60 * 60;
  }
  const payload = {
    email: (email || '').toLowerCase().trim(),
    action,
    request_id: request_id || null,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    iss: 'tamazia.co.uk',
    iat: Math.floor(Date.now() / 1000)
  };
  const head = b64uEncode(payload);
  const sig = await sign(head, secret);
  return `${head}.${sig}`;
}

export async function verifyToken(token, env) {
  const secret = env.DSAR_SIGNING_SECRET || env.ADMIN_SECRET;
  if (!secret) return { ok: false, reason: 'signing_secret_unbound' };
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'malformed_token' };
  }
  const [head, sig] = token.split('.');
  const ok = await verify(head, sig, secret);
  if (!ok) return { ok: false, reason: 'bad_signature' };
  let payload;
  try { payload = b64uDecode(head); } catch { return { ok: false, reason: 'bad_payload' }; }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return { ok: false, reason: 'expired', issued_at: payload.iat, expired_at: payload.exp, ttl_seconds: 7 * 24 * 60 * 60 };
  }
  if (payload.nbf && payload.nbf > now) {
    return { ok: false, reason: 'not_yet_valid' };
  }
  // Domain isolation: only honour tokens minted for tamazia.co.uk
  if (payload.iss && payload.iss !== 'tamazia.co.uk') {
    return { ok: false, reason: 'wrong_issuer' };
  }
  return { ok: true, payload };
}
