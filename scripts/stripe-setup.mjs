// scripts/stripe-setup.mjs
// One-command Stripe setup: creates the 9 add-on products + prices from the SAME
// catalogue the site uses (functions/audit/_commerce.js → ADDON_CATALOGUE), then prints
// a ready-to-paste Cloudflare env block + a STRIPE_PRICE_MAP JSON.
//
// Idempotent: re-running uses Stripe Idempotency-Key per add-on, so it never duplicates.
// Recurring add-ons (unit 'mo') → monthly price. One-time add-ons (unit 'piece') → one-time price.
//
// USAGE (founder runs once, with their OWN key — nothing is hard-coded):
//   cd tamazia-website
//   STRIPE_SECRET_KEY=sk_test_xxx  node scripts/stripe-setup.mjs        # test mode first
//   STRIPE_SECRET_KEY=sk_live_xxx  node scripts/stripe-setup.mjs        # then live
// Output: paste the printed block into Cloudflare Pages → Settings → Env vars (Production),
// or run:  node scripts/cf-set-commerce-env.mjs scripts/.stripe-prices.json
//
// Safe: only CREATES products/prices in the account behind the key you supply. No charges,
// no customers, no deletion. Test-mode keys create test-mode objects only.

import { ADDON_CATALOGUE } from '../functions/audit/_commerce.js';
import { writeFileSync } from 'fs';

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY || !/^sk_(test|live)_/.test(KEY)) {
  console.error('\n  ✗ Set STRIPE_SECRET_KEY (sk_test_… or sk_live_…) and re-run.');
  console.error('    Get it from https://dashboard.stripe.com/apikeys (use the SECRET key).\n');
  process.exit(1);
}
const MODE = KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST';

async function stripe(path, params, idemKey) {
  const body = new URLSearchParams(params).toString();
  const headers = {
    Authorization: 'Bearer ' + KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (idemKey) headers['Idempotency-Key'] = idemKey;
  const r = await fetch('https://api.stripe.com/v1/' + path, { method: 'POST', headers, body });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
  return j;
}

console.log(`\n  Stripe setup · ${MODE} mode · creating ${Object.keys(ADDON_CATALOGUE).length} add-ons\n`);
const envVars = {};   // STRIPE_PRICE_GEO -> price_…
const priceMap = {};  // addonKey -> price_…

for (const [key, a] of Object.entries(ADDON_CATALOGUE)) {
  const oneTime = a.unit === 'piece';
  const idem = `tamazia_${key}_v1`;
  try {
    // product (idempotent per add-on)
    const product = await stripe('products', {
      name: `Tamazia · ${a.name}`,
      'metadata[addon_key]': key,
      'metadata[managed_by]': 'tamazia-stripe-setup',
    }, idem + '_product');

    // price: GBP, monthly recurring for 'mo' add-ons, one-time for 'piece'
    const priceParams = {
      product: product.id,
      currency: 'gbp',
      unit_amount: String(Math.round(a.gbp * 100)),
      'metadata[addon_key]': key,
      lookup_key: `tamazia_${key}`,
      transfer_lookup_key: 'true',
    };
    if (!oneTime) { priceParams['recurring[interval]'] = 'month'; }
    const price = await stripe('prices', priceParams, idem + '_price');

    envVars[a.envKey] = price.id;
    priceMap[key] = price.id;
    console.log(`  ✓ ${a.name.padEnd(34)} £${a.gbp}/${a.unit.padEnd(5)} → ${price.id}  (${a.envKey})`);
  } catch (e) {
    console.error(`  ✗ ${a.name.padEnd(34)} ${e.message}`);
  }
}

// also emit a single STRIPE_PRICE_MAP (overrides per-key vars; one var to paste if you prefer)
const out = { mode: MODE, generated_for: 'cloudflare-pages-production', env: envVars, STRIPE_PRICE_MAP: priceMap };
writeFileSync(new URL('./.stripe-prices.json', import.meta.url), JSON.stringify(out, null, 2));

console.log('\n  ── Paste into Cloudflare Pages → tamazia-website → Settings → Variables (Production) ──\n');
for (const [k, v] of Object.entries(envVars)) console.log(`  ${k}=${v}`);
console.log(`  STRIPE_PRICE_MAP=${JSON.stringify(priceMap)}`);
console.log('\n  (Still set separately, your secrets:  STRIPE_SECRET_KEY  and  STRIPE_WEBHOOK_SECRET)');
console.log('  Saved → scripts/.stripe-prices.json  (feed it to cf-set-commerce-env.mjs to push automatically)\n');
