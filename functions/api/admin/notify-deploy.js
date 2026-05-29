// /api/admin/notify-deploy · self-verifying deploy-failure notifier
// Triggered by deploy.yml on-failure step with { run_id, sha, title }
// No shared secret required: endpoint verifies the workflow run exists + failed
// by querying the GitHub API using its own GH_TOKEN (which is in CF Pages env).
// This avoids the GitHub Actions repo-secret requirement entirely.

import { notifySlack, notifyTelegram } from '../../_lib/notify.js';

const REPO = 'Tamaziaa/tamazia-website';

export const onRequestPost = async ({ request, env }) => {
  let body;
  try { body = await request.json(); } catch { return new Response('{}', { status: 400 }); }
  const { run_id, sha = '', title = 'deploy' } = body || {};
  if (!run_id || !env.GH_TOKEN) {
    return new Response(JSON.stringify({ error: 'missing run_id or GH_TOKEN' }), { status: 400 });
  }

  // 1. Verify the run actually exists and actually failed via GitHub API
  let run;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${run_id}`, {
      headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json' }
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'run lookup failed', http: r.status }), { status: 404 });
    run = await r.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'gh api error', msg: e.message }), { status: 502 });
  }

  // 2. Only fire if conclusion is failure or cancelled (avoid spam on success)
  if (!['failure', 'cancelled', 'timed_out', 'action_required'].includes(run.conclusion)) {
    return new Response(JSON.stringify({ ok: true, skipped: true, conclusion: run.conclusion }), { status: 200 });
  }

  // 3. Fire to Slack + Telegram via env vars
  const shortSha = (sha || run.head_sha || '').slice(0, 8);
  const url = run.html_url || `https://github.com/${REPO}/actions/runs/${run_id}`;
  const summary = `Deploy ${run.conclusion} · ${shortSha} · ${title || run.display_title || ''}`.slice(0, 200);
  const detail = `*Status:* ${run.conclusion}\n*Branch:* ${run.head_branch}\n*SHA:* \`${run.head_sha}\`\n*Title:* ${run.display_title || ''}\n*Triggered:* ${run.created_at}\n*URL:* ${url}`;
  const tg = `<b>Status:</b> ${run.conclusion}\n<b>Branch:</b> ${run.head_branch}\n<b>SHA:</b> <code>${(run.head_sha||'').slice(0,8)}</code>\n<b>Title:</b> ${(run.display_title||'').slice(0,180)}\n<b>URL:</b> ${url}`;

  await Promise.allSettled([
    notifySlack(env, { level: 'p0', summary, detail }),
    notifyTelegram(env, { level: 'p0', summary, detail: tg }),
  ]);

  return new Response(JSON.stringify({ ok: true, fired: true, run_id, conclusion: run.conclusion }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Reject other methods
export const onRequestGet = () => new Response('POST only', { status: 405 });
