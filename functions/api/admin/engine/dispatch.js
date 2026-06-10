import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/engine/dispatch  { workflow?: 'engine'|'intel'|'backlog'|'requalify', inputs?: {} }
//   engine             -> engine-cycle.yml  (full 30-min cycle incl. the fixed mint seam)
//   intel              -> intel-pulse.yml
//   backlog / requalify-> backlog-burst.yml (re-score the pile + enrich + mint; NEVER sends)
const WORKFLOWS = {
  engine: { file: 'engine-cycle.yml', inputs: false },
  intel: { file: 'intel-pulse.yml', inputs: false },
  backlog: { file: 'backlog-burst.yml', inputs: true },
  requalify: { file: 'backlog-burst.yml', inputs: true },
};
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ ok: false, error: 'GH_TOKEN unbound' });
  let body = {}; try { body = await request.json(); } catch (_e) {}
  const wf = WORKFLOWS[body.workflow] || WORKFLOWS.engine;
  const payload = { ref: 'main' };
  if (wf.inputs) payload.inputs = body.inputs || (body.workflow === 'requalify' ? { requalify: '800', mint: '300' } : {});
  try {
    const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-cowork-os/actions/workflows/' + wf.file + '/dispatches', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return json({ ok: r.status === 204, status: r.status, workflow: wf.file });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
