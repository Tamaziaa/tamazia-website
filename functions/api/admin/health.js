import { authed, unauth, json, probe } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const probes = [];
  // KV
  probes.push({ name: 'Cloudflare KV (FORM_SUBMISSIONS)', status: env.FORM_SUBMISSIONS ? 'green' : 'red', latency_ms: 0, detail: env.FORM_SUBMISSIONS ? 'bound' : 'unbound' });
  // Resend
  probes.push({ name: 'Resend (transactional email)', status: env.RESEND_API_KEY ? 'green' : 'red', latency_ms: 0, detail: env.RESEND_API_KEY ? 'configured' : 'unbound' });
  // Slack
  if (env.SLACK_BOT_TOKEN) {
    const t0 = Date.now();
    try {
      const r = await fetch('https://slack.com/api/auth.test', { headers: { Authorization: 'Bearer ' + env.SLACK_BOT_TOKEN } });
      const d = await r.json();
      probes.push({ name: 'Slack bot (chat:write)', status: d.ok ? 'green' : 'red', latency_ms: Date.now() - t0, detail: d.ok ? ('@' + d.user + ' · ' + d.team) : (d.error || 'fail') });
    } catch (e) { probes.push({ name: 'Slack bot', status: 'red', latency_ms: Date.now() - t0, detail: e.message }); }
  } else probes.push({ name: 'Slack bot', status: 'red', latency_ms: 0, detail: 'SLACK_BOT_TOKEN unbound' });
  // Telegram
  if (env.TELEGRAM_BOT_TOKEN) {
    const t0 = Date.now();
    try {
      const r = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/getMe');
      const d = await r.json();
      probes.push({ name: 'Telegram bot', status: d.ok ? 'green' : 'red', latency_ms: Date.now() - t0, detail: d.ok ? '@' + d.result.username : (d.description || 'fail') });
    } catch (e) { probes.push({ name: 'Telegram bot', status: 'red', latency_ms: Date.now() - t0, detail: e.message }); }
  } else probes.push({ name: 'Telegram bot', status: 'red', latency_ms: 0, detail: 'TELEGRAM_BOT_TOKEN unbound' });
  // Cal webhook secret
  probes.push({ name: 'Cal.com webhook', status: env.CAL_WEBHOOK_SECRET ? 'green' : 'amber', latency_ms: 0, detail: env.CAL_WEBHOOK_SECRET ? 'configured' : 'unbound' });
  // GitHub Pages deploy status (latest run)
  if (env.GH_TOKEN || env.GITHUB_TOKEN) {
    const tok = env.GH_TOKEN || env.GITHUB_TOKEN;
    const t0 = Date.now();
    try {
      const r = await fetch('https://api.github.com/repos/Tamaziaa/tamazia-website/actions/workflows/deploy.yml/runs?per_page=1', { headers: { Authorization: 'Bearer ' + tok, 'User-Agent': 'tamazia-cockpit' } });
      const d = await r.json();
      const run = d.workflow_runs && d.workflow_runs[0];
      probes.push({ name: 'GitHub deploy', status: run && run.conclusion === 'success' ? 'green' : (run ? 'amber' : 'red'), latency_ms: Date.now() - t0, detail: run ? (run.head_sha.slice(0, 8) + ' · ' + (run.conclusion || run.status)) : 'no runs' });
    } catch (e) { probes.push({ name: 'GitHub deploy', status: 'red', latency_ms: Date.now() - t0, detail: e.message }); }
  } else probes.push({ name: 'GitHub deploy', status: 'amber', latency_ms: 0, detail: 'GH_TOKEN unbound · no live check' });
  // Public site self-probe
  probes.push(await probe('Public site tamazia-website.pages.dev', 'https://tamazia-website.pages.dev/api/health', { timeout: 4000 }));

  return json({ probes, checked_at: new Date().toISOString() });
};
