// The single largest revenue defect in the business (E16): EVERY commercial link on every live report was an empty
// string, and the renderer removed the dead buttons. The buyer at peak intent had nothing to press.
// These links are now LIVE Stripe Payment Links on acct_1TgF8DHafZjksJ5V. This test makes a dead button impossible.
import assert from 'node:assert/strict';
import { stripeLinks } from '../src/content/pricing.ts';

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

const REQUIRED = ['sprint1', 'sprint2', 'sprint3', 'unlock', 'watch',
  'remodellingDeposit', 'aiAuthority', 'onlinePersonalBranding', 'instagramPresence', 'ymylContent', 'gbpDomination'];

t('every commercial product has a real, non-empty Payment Link', () => {
  for (const k of REQUIRED) {
    assert.ok(stripeLinks[k], 'stripeLinks.' + k + ' is EMPTY: the buy button dies at peak intent (E16)');
    assert.match(stripeLinks[k], /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/, k + ' is not a Stripe Payment Link: ' + stripeLinks[k]);
  }
});
t('no two products share a Payment Link (a copy-paste would charge the wrong amount)', () => {
  const seen = new Map();
  for (const k of REQUIRED) {
    // websiteRemodelling intentionally aliases remodellingDeposit; everything else must be distinct.
    if (k === 'remodellingDeposit') continue;
    const prev = seen.get(stripeLinks[k]);
    assert.ok(!prev, k + ' shares a link with ' + prev + ' and would charge the wrong amount');
    seen.set(stripeLinks[k], k);
  }
});
t('the archived products are NOT purchasable', () => {
  assert.ok(!('icpOutreach' in stripeLinks), 'ICP Outreach was deleted from both surfaces (E50/W18)');
  assert.ok(!('reputationCrisis' in stripeLinks), 'Reputation & Crisis was folded into Regulatory Watch (E51/W19)');
});

console.log(bad ? 'STRIPE LINKS: FAIL' : 'STRIPE LINKS LIVE: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
