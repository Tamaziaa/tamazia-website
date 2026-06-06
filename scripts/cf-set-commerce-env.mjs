// scripts/cf-set-commerce-env.mjs
// Push NON-SECRET commerce env vars (Stripe price IDs, Cal slugs) into the live
// Cloudflare Pages project (production) via the CF API. Refuses to push anything that
// looks like a secret (sk_…, whsec_…, cal_…, *_KEY, *_SECRET) — those you set yourself
// in the dashboard as encrypted secrets. Idempotent (merges, never wipes existing vars).
//
// USAGE:
//   node scripts/cf-set-commerce-env.mjs scripts/.stripe-prices.json          # price IDs from stripe-setup
//   node scripts/cf-set-commerce-env.mjs CAL_SLUG_FOUNDATION=tamazia/foundation-onboarding ...
//   (mix a JSON file and KEY=VALUE args freely)
//
// Needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (already in COWORK-OS-EXECUTION/.env).

import { readFileSync } from 'fs';

const ROOT = new URL('../../', import.meta.url).pathname;
// load .env (token + account) if not already in process.env
try {
  for (const line of readFileSync(ROOT + 'COWORK-OS-EXECUTION/.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT = process.env.CF_PAGES_PROJECT || 'tamazia-website';
if (!TOKEN || !ACCOUNT) { console.error('  ✗ CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID missing'); process.exit(1); }

// collect KEY=VALUE pairs from args + any JSON files ({env:{...}} or flat {KEY:val})
const vars = {};
for (const arg of process.argv.slice(2)) {
  if (arg.includes('=') && !arg.endsWith('.json')) {
    const i = arg.indexOf('='); vars[arg.slice(0, i)] = arg.slice(i + 1);
  } else if (arg.endsWith('.json')) {
    const j = JSON.parse(readFileSync(arg, 'utf8'));
    const src = j.env && typeof j.env === 'object' ? j.env : j;
    for (const [k, v] of Object.entries(src)) if (typeof v === 'string') vars[k] = v;
  }
}
// refuse secrets — these must be set by the founder in the dashboard as encrypted secrets
const SECRET_RX = /(SECRET|_KEY$|API_KEY|^sk_|whsec_|^cal_)/i;
const refused = [], safe = {};
for (const [k, v] of Object.entries(vars)) {
  if (SECRET_RX.test(k) || /^sk_(test|live)_|^whsec_|^cal_[a-z0-9]/i.test(v)) refused.push(k);
  else safe[k] = v;
}
if (refused.length) console.log('  ⚠ refusing to push (set these as dashboard secrets yourself):', refused.join(', '));
if (!Object.keys(safe).length) { console.error('  ✗ nothing safe to push'); process.exit(1); }

const api = 'https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT + '/pages/projects/' + PROJECT;
const hdr = { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

// merge into existing production env_vars (GET then PATCH)
const cur = await (await fetch(api, { headers: hdr })).json();
if (!cur.success) { console.error('  ✗ GET project failed:', JSON.stringify(cur.errors)); process.exit(1); }
const existing = (cur.result?.deployment_configs?.production?.env_vars) || {};
const env_vars = { ...existing };
for (const [k, v] of Object.entries(safe)) env_vars[k] = { type: 'plain_text', value: v };

const patch = await (await fetch(api, { method: 'PATCH', headers: hdr,
  body: JSON.stringify({ deployment_configs: { production: { env_vars } } }) })).json();
if (!patch.success) { console.error('  ✗ PATCH failed:', JSON.stringify(patch.errors)); process.exit(1); }

console.log('  ✓ pushed to ' + PROJECT + ' (production):');
for (const k of Object.keys(safe)) console.log('    ' + k + ' = ' + safe[k]);
console.log('  Redeploy (or next push) picks them up.');
