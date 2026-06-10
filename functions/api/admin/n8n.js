import { authed, unauth, json } from './_lib.js';
// GET /api/admin/n8n — the n8n automation layer status (warmup / send orchestration / reply
// handler / bounce kill-switch / audit delivery). Surfaces each workflow's active state so the
// cockpit shows whether the email pipeline is live. Read-only; fail-soft if n8n is unreachable.
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const base = (env.N8N_URL || '').replace(/\/$/, '');
  if (!base || !env.N8N_API_KEY) return json({ ok: false, reachable: false, error: 'n8n not configured', workflows: [] });
  try {
    const r = await fetch(base + '/api/v1/workflows', { headers: { 'X-N8N-API-KEY': env.N8N_API_KEY, 'Accept': 'application/json' } });
    if (!r.ok) return json({ ok: false, reachable: false, status: r.status, workflows: [] });
    const d = await r.json();
    const ws = (d.data || d || []).map(w => ({ name: w.name, active: !!w.active }));
    ws.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return json({ ok: true, reachable: true, count: ws.length, active: ws.filter(w => w.active).length, workflows: ws });
  } catch (e) { return json({ ok: false, reachable: false, error: e.message, workflows: [] }); }
};
