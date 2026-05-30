import { authed, unauth, json } from '../_lib.js';
// GET /api/admin/engine/status — last engine-cycle + intel-pulse runs from tamazia-cowork-os
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ ok: false, error: 'GH_TOKEN unbound' });
  const H = { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json' };
  const base = 'https://api.github.com/repos/Tamaziaa/tamazia-cowork-os/actions/workflows/';
  const one = async (wf) => {
    try {
      const r = await fetch(base + wf + '/runs?per_page=1', { headers: H });
      const d = await r.json();
      const run = (d.workflow_runs || [])[0];
      return run ? { status: run.status, conclusion: run.conclusion, at: run.created_at, url: run.html_url } : null;
    } catch (e) { return { error: e.message }; }
  };
  const [engine, intel] = await Promise.all([one('engine-cycle.yml'), one('intel-pulse.yml')]);
  return json({ ok: true, engine, intel });
};
