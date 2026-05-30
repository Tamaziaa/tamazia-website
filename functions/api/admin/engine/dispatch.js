import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/engine/dispatch  { workflow?: 'engine' | 'intel' }
// Fires the Tamazia engine cycle (or intel pulse) in the tamazia-cowork-os repo via GitHub Actions.
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ ok: false, error: 'GH_TOKEN unbound' });
  let body = {}; try { body = await request.json(); } catch (_e) {}
  const wf = body.workflow === 'intel' ? 'intel-pulse.yml' : 'engine-cycle.yml';
  try {
    const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-cowork-os/actions/workflows/' + wf + '/dispatches', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' })
    });
    return json({ ok: r.status === 204, status: r.status, workflow: wf });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
