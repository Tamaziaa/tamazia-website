// E04 / E05 / E06 / E11 / E27 + the "400+" claim.
import assert from 'node:assert/strict';
import { payloadToD } from '../functions/audit/_adapter.js';

const base = {
  domain: 'x.co.uk', company: 'X LLP', firm_profile: { name: 'X LLP' },
  detected_sector: 'law-firms', country: 'UK', engine_version: 't',
  catalogue_rules: 671, catalogue_frameworks: 294,
  jurisdiction_families: { families: ['UK'], primary: 'UK' },
  verified: true, llm_verify: { status: 'pass' },
};
const D = (o) => payloadToD({ ...base, ...o }, { verified: true });
const aiDim = (d) => (d.dims || []).find((x) => /AI \/ GEO/.test(x.nm)) || {};

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

const P1 = [{ severity: 'P0', bucket: 'compliance', framework_short: 'UK_GDPR', fact: 'a', enforce_typical_low_gbp: 1e5, enforce_typical_high_gbp: 5e6 }];

// ---------- E27 / E04: our own consistency-fixer was fabricating the claim ----------
t('E27: a figure attributed to a NAMED regulator is never rewritten to the report aggregate', () => {
  const d = D({ pointers: P1, binding: { UK_GDPR: 'statute' },
    exec_summary: 'Failure to comply with SRA regulations could result in a statutory penalty of up to £25,000.' });
  const exec = String(d.exec || d.execSummary || '');
  assert.ok(!/SRA[^.]*[£$€]\s?[\d,]/.test(exec), 'a monetary figure is still asserted against the SRA: ' + exec);
  assert.match(exec, /SRA/, 'the qualitative statement must survive');
});
t('E27: the SRA can never be made to carry a multi-million figure', () => {
  const d = D({ pointers: P1, binding: { UK_GDPR: 'statute' },
    exec_summary: 'Non-compliance with SRA regulations could result in a penalty of up to £2,600,000.' });
  assert.ok(!/[£$€]\s?2[.,]?6/.test(String(d.exec || d.execSummary || '')), 'the aggregate was attributed to the SRA');
});
t('E04: an aggregate with NO named body is still normalised to the canonical figure', () => {
  const d = D({ pointers: P1, binding: { UK_GDPR: 'statute' },
    exec_summary: 'The median enforcement exposure evidenced across this report is £2,300,000.' });
  assert.match(String(d.exec || d.execSummary || ''), /[£$€]/, 'a genuine aggregate must still print');
});

// ---------- E05 / E29: two tallies, no stated scope ----------
t('E05/E29: both tallies exist and each carries an EXPLICIT scope', () => {
  const d = D({ pointers: [...P1,
    { severity: 'P1', bucket: 'performance', fact: 'LCP' },
    { severity: 'P2', bucket: 'seo', fact: 'schema' }], binding: { UK_GDPR: 'statute' } });
  assert.ok(d.counts && d.countsRegulatory, 'both tallies must be emitted');
  assert.match(String(d.counts.scope), /all ten dimensions/i);
  assert.match(String(d.countsRegulatory.scope), /regulatory findings only/i);
  assert.strictEqual(d.counts.total, 3, 'the all-dimension tally counts every finding');
  assert.strictEqual(d.countsRegulatory.total, 1, 'the regulatory tally counts only regulatory findings');
  assert.ok(d.countsRegulatory.total <= d.counts.total, 'the scoped tally can never exceed the whole');
});

// ---------- E06: one statute counted twice ----------
t('E06: a framework and its own article collapse to ONE framework', () => {
  const d = D({ pointers: [
    { severity: 'P1', bucket: 'compliance', framework_short: 'UK_GDPR', fact: 'a' },
    { severity: 'P1', bucket: 'compliance', framework_short: 'UK_GDPR_A13', fact: 'b' }],
    binding: { UK_GDPR: 'statute', UK_GDPR_A13: 'statute' } });
  assert.strictEqual(d.frameworksBinding, 1, 'UK GDPR was counted twice, inflating the binding count');
  const names = (d.frameworks || []).map((f) => f.name);
  assert.strictEqual(new Set(names).size, names.length, 'a framework double-printed in the table');
});

// ---------- E11: the score contradicted the evidence beside it ----------
t('E11: entity 80 with share of voice 0 can NOT score 80', () => {
  const d = D({ pointers: P1, binding: { UK_GDPR: 'statute' },
    ai_readiness: { score: 80 }, geo_probe: { share_of_voice: 0, samples: 2, ai_knows: true } });
  const dim = aiDim(d);
  assert.ok(dim.v <= 40, 'AI visibility scored ' + dim.v + ' while no engine names the firm');
  assert.match(String(dim.sub), /capped at 40/, 'the reader must be told WHY');
});
t('E11: a firm that IS cited still scores well (the fix is not a blanket penalty)', () => {
  const dim = aiDim(D({ pointers: P1, binding: { UK_GDPR: 'statute' },
    ai_readiness: { score: 90 }, geo_probe: { share_of_voice: 90, samples: 2, ai_knows: true } }));
  assert.ok(dim.v >= 85, 'a genuinely visible firm must still score highly, got ' + dim.v);
});

// ---------- the 400+ claim ----------
t('THE CLAIM: we screen RULES. We must never claim 400+ FRAMEWORKS (we hold 294)', () => {
  const d = D({ pointers: P1, binding: { UK_GDPR: 'statute' } });
  const s = JSON.stringify(d);
  assert.ok(!/400\+?\s*frameworks/i.test(s), 'a false framework count would render: CAP 3.7 binds us too');
  assert.ok(!/frameworks screened/i.test(s), 'frameworks do not get "screened"; rules do');
  assert.match(String(d.screenedLabel), /compliance rules screened/i);
});
t('THE CLAIM: the screened figure is READ from the register, never invented', () => {
  assert.match(String(D({ pointers: P1, binding: { UK_GDPR: 'statute' } }).screenedLabel), /671/);
  const none = D({ pointers: P1, binding: { UK_GDPR: 'statute' }, catalogue_rules: undefined });
  assert.ok(!/\d/.test(String(none.screenedLabel)), 'with no register count we must claim no number: ' + none.screenedLabel);
});

console.log(bad ? 'E04-E11: FAIL' : 'E04/E05/E06/E11/E27 + 400+ CLAIM: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
