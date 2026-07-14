// NAME-01c — Companies House SHOUTS, and the identity guard was rejecting genuinely short firm names.
// Two live defects: the birketts report rendered "BIRKETTS LLP" (a database dump, not a report), and "BDO LLP"
// on bdo.co.uk was REJECTED by sharesTokenWithDomain (no token of 4+ chars once 'llp' is set aside) and fell back
// to the domain stem: "Bdo". A guard that rejects a real name is as wrong as one that admits a fake one.
import assert from 'node:assert/strict';
import { payloadToD } from '../functions/audit/_adapter.js';

const NM = (company, domain) => {
  const d = payloadToD({
    domain, company, firm_profile: { name: company }, detected_sector: 'law-firms', country: 'UK',
    engine_version: 't', pointers: [], binding: {}, jurisdiction_families: { families: ['UK'], primary: 'UK' },
    verified: true, llm_verify: { status: 'pass' },
  }, { verified: true });
  const m = JSON.stringify(d).match(/"company":"([^"]+)"/);
  return m ? m[1] : '';
};

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

t('a SHOUTING Companies House name is title-cased, the legal suffix preserved', () => {
  assert.strictEqual(NM('BIRKETTS LLP', 'birketts.co.uk'), 'Birketts LLP');
  assert.strictEqual(NM('WARD HADAWAY LLP', 'wardhadaway.com'), 'Ward Hadaway LLP');
  assert.strictEqual(NM('MILLS & REEVE LLP', 'mills-reeve.com'), 'Mills & Reeve LLP');
  assert.strictEqual(NM('RUSSELL-COOKE LLP', 'russell-cooke.co.uk'), 'Russell-Cooke LLP');
  assert.strictEqual(NM('FREETHS LLP', 'freeths.co.uk'), 'Freeths LLP');
});
t('a firm that TRADES as an acronym keeps it: BDO, never Bdo', () => {
  assert.strictEqual(NM('BDO LLP', 'bdo.co.uk'), 'BDO LLP');
  assert.strictEqual(NM('DWF LAW LLP', 'dwf.law'), 'DWF Law LLP');
});
t('an ordinary word is never mistaken for an initialism (WARD, LAW)', () => {
  assert.ok(!/\bWARD\b/.test(NM('WARD HADAWAY LLP', 'wardhadaway.com')), 'WARD is a word, not an acronym');
  assert.ok(/\bLaw\b/.test(NM('DWF LAW LLP', 'dwf.law')), 'LAW must be title-cased');
});
t('an initialism is a token that IS the domain, not a token that is merely short', () => {
  assert.strictEqual(NM('BDO LLP', 'bdo.co.uk'), 'BDO LLP');          // bdo === stem
  assert.strictEqual(NM('WARD HADAWAY LLP', 'wardhadaway.com'), 'Ward Hadaway LLP');   // ward !== stem
});
t('a name the firm already writes correctly is left exactly alone', () => {
  assert.strictEqual(NM('Freeths LLP', 'freeths.co.uk'), 'Freeths LLP');
  assert.strictEqual(NM('The Office Group', 'theofficegroup.com'), 'The Office Group');
});
t('the guard STILL rejects a page heading', () => {
  assert.strictEqual(NM('Bristol Office', 'birketts.co.uk'), 'Birketts');
});

console.log(bad ? 'NAME-01c: FAIL' : 'NAME-01c: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
