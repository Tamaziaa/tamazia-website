// FRAMEWORK_META — the catalogue is the single source of truth; the renderer stops guessing.
// Every E07/E08/E09 defect had the same shape: a hand-maintained map in the renderer DRIFTED from the catalogue,
// and the renderer filled the gap with a GUESS. The catalogue was right every time. A parallel map is a second
// source of truth, and a second source of truth is a bug with a delay on it.
import assert from 'node:assert/strict';
import { payloadToD } from '../functions/audit/_adapter.js';

const P = (extra) => payloadToD({
  domain: 'x.co.uk', company: 'X LLP', firm_profile: { name: 'X LLP' },
  detected_sector: 'law-firms', country: 'UK', engine_version: 't',
  jurisdiction_families: { families: ['UK'], primary: 'UK' },
  verified: true, llm_verify: { status: 'pass' }, ...extra,
}, { verified: true });
const fw1 = (d) => (d.frameworks || [])[0] || {};

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

// A framework code the renderer's maps have NEVER heard of. The catalogue alone supplies the truth.
const UNKNOWN_TO_RENDERER = {
  framework_meta: { UK_MADEUP_2026: { name: 'The Imaginary Widgets Regulations 2026', regulator: 'The Widget Authority', binding_type: 'statutory_instrument' } },
  pointers: [{ severity: 'P1', bucket: 'compliance', framework_short: 'UK_MADEUP_2026', fact: 'gap' }],
  binding: { UK_MADEUP_2026: 'statute' },   // the OLD map says statute; the CATALOGUE says statutory_instrument
};

t('a framework absent from every renderer map still gets its NAME from the catalogue', () => {
  assert.strictEqual(fw1(P(UNKNOWN_TO_RENDERER)).name, 'The Imaginary Widgets Regulations 2026');
});
t('...its REGULATOR from the catalogue (this is the 151-framework E08 hole)', () => {
  assert.strictEqual(fw1(P(UNKNOWN_TO_RENDERER)).regulator, 'The Widget Authority');
});
t('...and its BINDING TYPE from the catalogue, OVERRIDING the stale map (this is E09)', () => {
  assert.strictEqual(fw1(P(UNKNOWN_TO_RENDERER)).binding_label, 'Statutory instrument',
    'the catalogue said statutory_instrument; the old binding map said statute. The catalogue must win.');
});
t('BOTH regulator doors route through fwRegulator (the card had its own path)', () => {
  const d = P(UNKNOWN_TO_RENDERER);
  const s = JSON.stringify(d);
  assert.ok(s.includes('The Widget Authority'), 'the card built its own regulator and bypassed the catalogue');
  assert.ok(!/Sector regulator/.test(s));
});
t('a framework the catalogue CANNOT name still omits, and never fabricates', () => {
  const d = P({ pointers: [{ severity: 'P1', bucket: 'compliance', framework_short: 'EU_FIC_1169_2011', fact: 'gap' }],
                binding: { EU_FIC_1169_2011: 'statute' } });
  assert.ok(!/Sector regulator/.test(JSON.stringify(d)), 'silence is free; a fabricated regulator is not');
});
t('an older payload with NO framework_meta still renders (fail-open, zero regression)', () => {
  const d = P({ pointers: [{ severity: 'P1', bucket: 'compliance', framework_short: 'UK_GDPR', fact: 'gap' }],
                binding: { UK_GDPR: 'statute' } });
  assert.match(String(fw1(d).name), /GDPR/);
  assert.strictEqual(fw1(d).binding_label, 'Statute');
});

console.log(bad ? 'FRAMEWORK_META: FAIL' : 'FRAMEWORK_META SSOT: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
