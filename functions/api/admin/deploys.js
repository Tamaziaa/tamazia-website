import { authed, unauth, json } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.GH_TOKEN) return json({ runs: [], error: 'GH_TOKEN unbound' });
  try {
    const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-website/actions/workflows/deploy.yml/runs?per_page=10', {
      headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json' }
    });
    const d = await r.json();
    const runs = (d.workflow_runs || []).map(rn => ({
      sha: rn.head_sha.slice(0, 8),
      status: rn.status,
      conclusion: rn.conclusion,
      title: (rn.display_title || '').slice(0, 120),
      created_at: rn.created_at,
      url: rn.html_url,
    }));
    return json({ runs, total: d.total_count || 0 });
  } catch (e) { return json({ runs: [], error: e.message }); }
};
