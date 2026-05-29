import { authed, unauth, json } from '../_lib.js';
// CF Pages stats proxy · for v1, returns deploy frequency + last deploy state
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ error: 'GH_TOKEN unbound' });
  try {
    const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-website/actions/workflows/deploy.yml/runs?per_page=20', {
      headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit' }
    });
    const d = await r.json();
    const runs = d.workflow_runs || [];
    const last24h = runs.filter(rn => new Date(rn.created_at) > new Date(Date.now() - 86400000));
    const last7d = runs.filter(rn => new Date(rn.created_at) > new Date(Date.now() - 7 * 86400000));
    const successes = last7d.filter(rn => rn.conclusion === 'success').length;
    const failures = last7d.filter(rn => rn.conclusion === 'failure').length;
    return json({
      last_24h_deploys: last24h.length,
      last_7d_deploys: last7d.length,
      last_7d_success: successes,
      last_7d_failure: failures,
      last_7d_success_rate: last7d.length ? Math.round((successes / last7d.length) * 100) : 100,
    });
  } catch (e) { return json({ error: e.message }); }
};
