// W-series regression guards (change map 2026-07-13, defects W01, W02, W40).
// These three are the ones that cost money if they regress:
//   W01 · the case-study counters must ship the REAL figure in the HTML. They used
//         to ship "0" and count up in JS, so every crawler and AI engine read a GEO
//         agency whose flagship results were zero.
//   W02 · Companies (Trading Disclosures) Regulations 2008, under Companies Act 2006
//         s.82: registered name, number, place of registration and registered office
//         must appear on the site. We audit other firms for exactly this.
//   W40 · no named, non-consented live exposure report may be linked from the site.
//
// Run after a build:  npm run build && node --test tests/
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

const DIST = new URL('../dist/index.html', import.meta.url);
const built = existsSync(DIST) ? readFileSync(DIST, 'utf8') : null;
const needsBuild = () => { if (!built) throw new Error('dist/index.html missing — run `npm run build` first'); };

test('W01 · every case-study counter renders its real figure in the HTML', () => {
  needsBuild();
  const counters = [...built.matchAll(/data-count="(\d+)"[^>]*>([^<]*)</g)];
  assert.ok(counters.length >= 4, `expected at least 4 counters, found ${counters.length}`);
  for (const [, n, text] of counters) {
    assert.ok(text.includes(n), `counter ${n} shipped "${text}" — the DOM must carry the true number`);
    assert.notEqual(text.trim(), '0');
  }
  // The exact flagship figures, so a silent data change is caught too.
  for (const fig of ['840%', '113%', '83%', '96%']) {
    assert.ok(built.includes(`>${fig}<`), `flagship figure ${fig} is not in the served HTML`);
  }
});

test('W02 · the footer carries the s.82 trading disclosures', () => {
  needsBuild();
  assert.match(built, /Company No\. 17295579/, 'registered company number missing');
  assert.match(built, /Registered in England and Wales/, 'place of registration missing');
  assert.match(built, /Registered office: 124 City Road, London, EC1V 2NX/, 'registered office missing');
  assert.match(built, /Data Controller: Tamazia Ltd/, 'data controller missing');
  assert.match(built, /DPO: dpo@tamazia\.co\.uk/, 'DPO contact missing');
});

test('W40 · no named live exposure report is linked from the site', () => {
  needsBuild();
  assert.ok(!/monzo/i.test(built), 'a named, non-consented audit URL is back on the homepage');
});
