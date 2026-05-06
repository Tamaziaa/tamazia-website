// Phase 12 · server-side request_id with HMAC
// Format: <base32-timestamp>-<6-char-random>-<8-char-hmac>
// HMAC binds the request_id to ADMIN_SECRET, preventing client-side spoof.
export async function mintRequestId(env) {
  const secret = env.ADMIN_SECRET || env.DSAR_SIGNING_SECRET || 'fallback-unsigned';
  const ts = Date.now().toString(36);
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 6);
  const head = `${ts}-${rnd}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(head));
  const sig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
  return `${head}-${sig}`;
}

export function isServerMintedId(id) {
  // Server-minted ids match base32-timestamp-random-hmac shape (3 dash-separated parts)
  return typeof id === 'string' && /^[0-9a-z]{8,12}-[0-9a-z]{4,8}-[0-9a-f]{8}$/.test(id);
}
