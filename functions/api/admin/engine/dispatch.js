import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/engine/dispatch  { workflow?: 'engine'|'intel'|'backlog'|'requalify', inputs?: {} }
//   engine             -> engine-cycle.yml  (full 30-min cycle incl. the fixed mint seam)
//   intel              -> intel-pulse.yml
//   backlog / requalify-> backlog-burst.yml (re-score the pile + enrich + mint; NEVER sends)
// Allowlist of engine workflows the cockpit may dispatch. file = the .yml in
// Tamaziaa/tamazia-cowork-os/.github/workflows; inputs = whether it takes workflow_dispatch inputs.
// Only real, present workflow files are listed (verified against the repo).
const WORKFLOWS = {
  engine: { file: 'engine-cycle.yml', inputs: false },
  intel: { file: 'intel-pulse.yml', inputs: false },
  backlog: { file: 'backlog-burst.yml', inputs: true },
  requalify: { file: 'backlog-burst.yml', inputs: true },
  // pipeline drains / quality
  verify: { file: 'verify-backlog.yml', inputs: true },
  deliverability: { file: 'deliverability-guard.yml', inputs: false },
  llm_rescue: { file: 'llm-rescue-backlog.yml', inputs: true },
  mint: { file: 'mint-now.yml', inputs: false },
  remint: { file: 'remint-audits.yml', inputs: true },
  // sourcing
  source: { file: 'source-leads.yml', inputs: true },
  source_registers: { file: 'source-registers.yml', inputs: true },
  source_sponsored: { file: 'source-sponsored.yml', inputs: true },
  smatleads: { file: 'smatleads-sync.yml', inputs: true },
  // enrichment
  ahrefs: { file: 'ahrefs-enrich.yml', inputs: true },
  apollo: { file: 'apollo-enrich.yml', inputs: true },
  // sync / reporting
  notion: { file: 'notion-sync.yml', inputs: false },
  digest: { file: 'daily-digest.yml', inputs: false },
  capacity: { file: 'capacity-report.yml', inputs: false },
};
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ ok: false, error: 'GH_TOKEN unbound' });
  let body = {}; try { body = await request.json(); } catch (_e) {}
  // Reject unknown workflow names instead of silently dispatching the full engine cycle.
  const wf = WORKFLOWS[body.workflow];
  if (!wf) return json({ ok: false, error: 'unknown_workflow', allowed: Object.keys(WORKFLOWS) }, 400);
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
