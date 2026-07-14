// COMMERCIAL REBUILD — the defects this test exists to stop from ever shipping again.
//
//  E16/E54  every commercial link on both live reports was an empty string. The renderer removes dead
//           buttons, so the buyer at peak intent had nothing to press. No CTA may carry an empty href.
//  E39      when the Stripe Payment Link is unset the buy button VANISHED. Route 1 has therefore never
//           been purchasable on a live report. An empty Stripe URL must still render a working CTA.
//  PRICE    retainer/mandate prices are UNCHANGED at 2,500 / 4,500 / 9,500. No strikethrough on them.
//  PRICE    the struck Sprint price is exactly 2x the discounted price, so the strike is arithmetic.
//  E50/E51  ICP Outreach and Reputation & Crisis are gone from BOTH surfaces.
//  MIRROR   audit-app.js PRICES + STRIPE_LINKS mirror src/content/pricing.ts (the file's own header rule).
//
// The audit report is CLIENT-rendered, so this test renders it: it builds D through the real adapter and
// executes the real audit-app.js in jsdom. A payload check would never prove the page is right.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { payloadToD } from '../functions/audit/_adapter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

const APP = read('public/audit/audit-app.js');
const CHARTS = read('public/audit/audit-charts.js');
const PRICING_TS = read('src/content/pricing.ts');
const PRICING_ASTRO = read('src/components/sections/Pricing.astro');

/* 1 · Render the real report in a real DOM. */
function renderReport(links = {}) {
  const D = payloadToD({
    domain: 'kingsleynapley.co.uk',
    company: 'Kingsley Napley LLP',
    firm_profile: { name: 'Kingsley Napley LLP' },
    detected_sector: 'law-firms',
    country: 'UK',
    engine_version: 'test',
    pointers: [
      { severity: 'P0', framework: 'UK GDPR', framework_short: 'UK GDPR', fact: 'No controller identity published', fine_high_gbp: 17500000, evidence_quote: 'the privacy notice names no data controller anywhere on the page', bingo: { problem: 'controller identity missing' }, page: '/privacy-notice' },
      { severity: 'P1', framework: 'PECR', framework_short: 'PECR', fact: 'Cookies set before consent', fine_high_gbp: 500000, evidence_quote: 'analytics cookies are written on first paint, before any consent is recorded', bingo: { problem: 'cookies before consent' }, page: '/' },
      { severity: 'P2', framework: 'SEO', framework_short: 'SEO', fact: 'No meta description on key pages', bingo: { problem: 'missing meta description' }, page: '/' },
    ],
    binding: {},
    jurisdiction_families: { families: ['UK'], primary: 'UK' },
    verified: true,
    llm_verify: { status: 'pass' },
  }, { verified: true, slug: 'kingsleynapley', links });

  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'https://tamazia.co.uk/audit/kingsleynapley/gjvqGcxa',
    pretendToBeVisual: true,
    runScripts: 'dangerously',
  });
  const w = dom.window;
  w.D = D;
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  w.eval(CHARTS);
  w.eval(APP);
  const plan = w.document.querySelector('#sec-plan');
  if (plan) plan.open = true;
  return { doc: w.document, win: w, D };
}

const { doc } = renderReport();

/* 2 · E16 / E54 — no commercial CTA may have an empty (or dead) href. */
t('E16/E54 · every rendered anchor has a real destination (no empty href, no bare "#")', () => {
  const dead = [...doc.querySelectorAll('a')]
    .filter((a) => a.hasAttribute('href'))
    .filter((a) => { const h = (a.getAttribute('href') || '').trim(); return h === '' || h === '#'; })
    .map((a) => a.className + ' :: ' + a.textContent.trim().slice(0, 60));
  assert.deepEqual(dead, [], 'anchors with a dead href: ' + JSON.stringify(dead, null, 2));
});

t('E16/E54 · the two mid-report CTA bands render, and carry report + intent into the call', () => {
  const bands = [...doc.querySelectorAll('.cta-blindsend a')];
  assert.equal(bands.length, 2, 'both CTA bands must render (they were hidden on every live report)');
  const findings = bands[0].getAttribute('href');
  const scoping = bands[1].getAttribute('href');
  assert.match(findings, /cal\.com/);
  assert.match(findings, /report=kingsleynapley/);
  assert.match(findings, /intent=findings/);
  assert.match(scoping, /intent=scoping/);
});

t('E16 · every Sprint, mandate and solution CTA has a destination', () => {
  for (const sel of ['.r1-buy', '.fx-cta', '.tl-cta', '.addon-cta']) {
    const els = [...doc.querySelectorAll(sel)];
    assert.ok(els.length > 0, 'no ' + sel + ' rendered at all');
    for (const el of els) {
      const h = (el.getAttribute('href') || '').trim();
      assert.ok(h && h !== '#', sel + ' rendered without a destination');
    }
  }
});

/* 3 · E39 — an empty Stripe URL must NOT hide the buy button. */
t('E39 · with NO Stripe link set, the Sprint card still renders a visible, working CTA', () => {
  const buy = doc.querySelector('.r1-buy');
  assert.ok(buy, 'the Sprint buy CTA vanished — this is exactly defect E39');
  assert.ok(!buy.hasAttribute('hidden'), 'the Sprint buy CTA must never be hidden');
  assert.ok((buy.getAttribute('href') || '').trim(), 'the fallback CTA must still carry a real href');
  assert.equal(buy.dataset.book, 'one_time_fix', 'the fallback must open the intake path');
  assert.match(buy.getAttribute('href'), /cal\.com/);
});

t('E39 · with a Stripe link set, the same CTA becomes the Payment Link', () => {
  const { doc: d2 } = renderReport({ stripeFix20: 'https://buy.stripe.com/test_sprint2' });
  const buy = d2.querySelector('.r1-buy');
  assert.ok(buy, 'buy CTA missing');
  assert.equal(buy.getAttribute('href'), 'https://buy.stripe.com/test_sprint2');
});

t('E39 · the source no longer hides a button when a link is unset', () => {
  assert.ok(!/buy\.hidden\s*=\s*true/.test(APP), 'audit-app.js still hides a buy button (E39)');
});

/* 4 · Prices, as shipped. */
const num = (re, src) => { const m = src.match(re); assert.ok(m, 'not found: ' + re); return +m[1]; };

t('RETAINERS ARE UNTOUCHED · 2,500 / 4,500 / 9,500 in pricing.ts and in the audit mirror', () => {
  assert.equal(num(/priceGbp:\s*(\d+),[\s\S]{0,80}?priceGbpStandard:\s*3300/, PRICING_TS), 2500);
  assert.equal(num(/priceGbp:\s*(\d+),[\s\S]{0,80}?priceGbpStandard:\s*6000/, PRICING_TS), 4500);
  assert.equal(num(/priceGbp:\s*(\d+),[\s\S]{0,80}?priceGbpStandard:\s*12700/, PRICING_TS), 9500);
  assert.equal(num(/foundation:\s*\{\s*from:(\d+)/, APP), 2500);
  assert.equal(num(/authority:\s*\{\s*from:(\d+)/, APP), 4500);
  assert.equal(num(/enterprise:\s*\{\s*from:(\d+)/, APP), 9500);
});

t('RETAINERS ARE UNTOUCHED · the rendered mandate cards show 2,500 / 4,500 / 9,500 and carry no strikethrough', () => {
  const shown = [...doc.querySelectorAll('.tier3 .tl-priceline b')].map((b) => +b.dataset.gbp);
  assert.deepEqual(shown, [2500, 4500, 9500]);
  for (const card of doc.querySelectorAll('.tier3')) {
    assert.equal(card.querySelector('s'), null, 'a mandate card must never show a struck price');
    assert.equal(card.querySelector('.apwas'), null, 'a mandate card must never show a struck price');
  }
});

t('SPRINTS · the struck price is EXACTLY 2x the discounted price', () => {
  const cfg = { sprint1: [9800, 4900], sprint2: [17800, 8900], sprint3: [25000, 12500] };
  for (const [k, v] of Object.entries(cfg)) {
    const [standard, offer] = v;
    assert.equal(standard, offer * 2, k + ': struck price must be exactly 2x the offer');
    assert.match(PRICING_TS, new RegExp(k + ':\\s*\\{\\s*standard:\\s*' + standard + ',\\s*offer:\\s*' + offer));
    assert.match(APP, new RegExp(k + ':\\s*\\{\\s*standard:' + standard + ',\\s*offer:' + offer));
  }
});

t('SPRINTS · the rendered card strikes 2x and charges the first-engagement rate', () => {
  const was = +doc.querySelector('.r1-was').dataset.gbp;
  const now = +doc.querySelector('.r1-price').dataset.gbp;
  assert.equal(now, 8900, 'Sprint II is the default tab');
  assert.equal(was, now * 2);
  const line = doc.querySelector('.fx-firstline').textContent;
  assert.match(line, /First-engagement rate/, 'the strikethrough must be explained, not decoration');
  assert.match(line, /first engagement/i);
});

t('SPRINTS · the 50% mandate credit is stated as arithmetic', () => {
  const credit = doc.querySelector('.fx-credit').textContent;
  assert.match(credit, /£4,450/, 'half of £8,900 must be printed, not implied');
  assert.match(credit, /60 days/);
  assert.match(credit, /£2,500/, 'the credit is measured against the Foundation mandate');
});

t('ROUTE 3 · £495 unlock includes month one of Watch, then £1,500/month, credited within 90 days', () => {
  assert.match(PRICING_TS, /unlock:\s*495/);
  assert.match(PRICING_TS, /monthlyCover:\s*1500/);
  assert.match(APP, /exposureReport:\s*\{\s*unlock:495,\s*monthlyCover:1500,\s*realValue:1500,\s*creditDays:90\s*\}/);
  const terms = doc.querySelector('.r3-terms').textContent;
  assert.match(terms, /£495/);
  assert.match(terms, /£1,500/);
  assert.match(terms, /90 days/);
  assert.match(terms, /never edits a page/, 'the anti-collision line must be printed on the card');
});

t('SOLUTIONS · six cards, first-engagement prices, anchor = 2x offer', () => {
  const cfg = { websiteRemodelling: [17000, 8500], aiAuthority: [3800, 1900], onlinePersonalBranding: [5000, 2500], instagramPresence: [3000, 1500], ymylContent: [2900, 1450], gbpDomination: [3000, 1500] };
  assert.equal(Object.keys(cfg).length, 6);
  for (const [k, v] of Object.entries(cfg)) {
    const [anchor, offer] = v;
    assert.equal(anchor, offer * 2, k + ': anchor must be exactly 2x the offer');
    assert.match(PRICING_TS, new RegExp(k + ':\\s*\\{\\s*anchor:\\s*' + anchor + ',\\s*offer:\\s*' + offer));
  }
});

/* 5 · E50 / E51 — the two deleted cards, gone from BOTH surfaces. */
t('E50/E51 · ICP Outreach and Reputation & Crisis are gone from the audit AND the website', () => {
  // Scan CODE, not the comments that record why the cards were deleted.
  const strip = (src) => src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const surfaces = [['audit-app.js', strip(APP)], ['pricing.ts', strip(PRICING_TS)], ['Pricing.astro', strip(PRICING_ASTRO)]];
  for (const [label, src] of surfaces) {
    assert.ok(!/ICP Outreach/i.test(src), label + ' still ships the ICP Outreach card (E50)');
    assert.ok(!/icpOutreach/.test(src), label + ' still ships the icpOutreach price key (E50)');
    assert.ok(!/reputationCrisis/.test(src), label + ' still ships the reputationCrisis price key (E51)');
    assert.ok(!/Reputation (&(amp;)?|and) Crisis/i.test(src), label + ' still ships the Reputation & Crisis card (E51)');
  }
  const names = [...doc.querySelectorAll('.addon .an')].map((e) => e.textContent);
  assert.ok(!names.some((x) => /ICP|Reputation/i.test(x)), 'a deleted card still renders: ' + names.join(' | '));
});

t('E51 · the reputation capability re-appears inside Regulatory Watch', () => {
  assert.match(doc.querySelector('.r3-specs').textContent, /Review, mention and press monitoring/);
});

/* 6 · E36 — no invented anchors. Sourced arithmetic only. */
t('E36 · the invented "a consultancy quotes £25,000+" anchor is gone', () => {
  assert.ok(!/A consultancy quotes/i.test(APP), 'the unsubstantiated consultancy anchor is still shipping (CAP 3.7)');
  assert.ok(!/anchor:25000|anchor:41000|anchor:65000/.test(APP));
});

t('E36 · the Sprint anchor is the SCCO guideline rate, printed with its source', () => {
  const line = doc.querySelector('.fx-line').textContent;
  assert.match(line, /£579 an hour/, 'the current Grade A London 1 guideline rate must be printed');
  assert.match(line, /SCCO Guideline Hourly Rates, London 1, in force 1 January 2026/);
  assert.equal(doc.querySelector('.fx-line a').getAttribute('href'), 'https://www.gov.uk/guidance/solicitors-guideline-hourly-rates');
  assert.match(line, /£20,265/, '35 hours x £579 must be printed as arithmetic, not asserted');
});

/* 7 · E12 / E40 · severity language. E42 / E56 · copy. */
t('E12 · severity is defined inline, and "P0" never reaches a client', () => {
  const key = doc.querySelector('.sev-key');
  assert.ok(key, 'the severity key must be printed on first use');
  for (const word of ['Critical', 'High', 'Standard']) assert.match(key.textContent, new RegExp(word));
  assert.ok(!/Severity P0|Severity P1/.test(doc.body.textContent), 'internal severity tokens leaked to the client');
});

t('E40 · the Sprint headline does not call every finding "critical"', () => {
  assert.ok(!/critical issues solved/i.test(doc.querySelector('.r1-head').textContent));
});

t('E42 · "board-rooms" is spelled boardrooms', () => {
  assert.ok(!/board-rooms/i.test(APP));
  assert.match(doc.querySelector('.r3-rib').textContent, /Where most boardrooms start/);
});

t('E56 · the trajectory is captioned as a model, not a promise', () => {
  const cap = doc.querySelector('.ptj-caption');
  assert.ok(cap, 'the projection is still uncaptioned');
  assert.match(cap.textContent, /not a promise/);
});

t('E43-E47 · founder references are reduced to the rail CTA', () => {
  const text = doc.body.textContent.replace(/founder@tamazia\.co\.uk/g, '');
  const hits = (text.match(/\bfounder\b/gi) || []).length;
  assert.ok(hits <= 1, 'expected at most one founder reference, found ' + hits);
});

/* 8 · MIRROR · audit-app.js must not drift from pricing.ts. */
t('MIRROR · the Stripe config has the same keys in pricing.ts and audit-app.js (one paste place)', () => {
  const keysOf = (src, marker) => {
    const block = src.slice(src.indexOf(marker));
    const body = block.slice(block.indexOf('{') + 1, block.indexOf('};'));
    return [...body.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map((m) => m[1]);
  };
  const ts = keysOf(PRICING_TS, 'export const stripeLinks');
  const app = keysOf(APP, 'const STRIPE_LINKS = {');
  assert.deepEqual(app, ts, 'the audit mirror of stripeLinks has drifted from pricing.ts');
  assert.ok(ts.includes('sprint1') && ts.includes('sprint2') && ts.includes('sprint3'));
  assert.ok(ts.includes('unlock') && ts.includes('watch'));
});

t('MIRROR · Pricing.astro reads its Stripe links from pricing.ts, not from its own literal', () => {
  assert.ok(!/buy\.stripe\.com/.test(PRICING_ASTRO), 'Pricing.astro still hardcodes Payment Links');
  assert.match(PRICING_ASTRO, /const STRIPE_LINKS: Record<string, string> = stripeLinks;/);
});

t('COPY · no em dashes anywhere in the rendered commercial section', () => {
  const plan = doc.querySelector('.plan2');
  assert.ok(plan, 'plan pane missing');
  assert.ok(!/[—–]/.test(plan.textContent), 'an em/en dash reached the client');
});

console.log('\n' + (n - bad) + '/' + n + ' passed');
process.exit(bad ? 1 : 0);
