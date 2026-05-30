import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/sourcing/run { source:'serp-top'|'all'|..., max:'25' } → fires source-leads.yml
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ ok: false, error: 'GH_TOKEN unbound' });
  let body = {}; try { body = await request.json(); } catch (_e) {}
  const source = (body.source || 'serp-top').toString();
  const max = String(parseInt(body.max, 10) || 25);
  try {
    const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-cowork-os/actions/workflows/source-leads.yml/dispatches', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { source, max } }),
    });
    return json({ ok: r.status === 204, status: r.status, source, max });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
