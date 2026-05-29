import { authed, unauth, json } from '../_lib.js';
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const body = await request.json().catch(() => ({}));
  const { input, sector, email = 'admin-rerun@tamazia.co.uk' } = body || {};
  if (!input) return json({ error: 'input required' }, 400);
  // Call /api/audit on the same origin
  const u = new URL(request.url);
  const auditUrl = `${u.protocol}//${u.host}/api/audit`;
  const r = await fetch(auditUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-rerun': '1' },
    body: JSON.stringify({ 'audit-input': input, sector, email, 'admin-source': '1' }),
  });
  const data = await r.json();
  return json({ ok: r.ok, status: r.status, result: data });
};
