// NAME-01d / EXP-3 — ACRONYM DESTRUCTION IN FIRM NAMES.
//
// Receipt: the wave-1 jflaw fixture was headed "Jf Law Limited" on jflaw.co.uk. `isOwnInitialism` recognised an
// initialism ONLY when the token equalled the WHOLE domain stem, so "BDO" on bdo.co.uk survived and "JF" in
// jflaw.co.uk did not — humaniseToken then title-cased it to "Jf". The same read would ship "The Private Gp Group",
// "Dds Group Nyc" and "Immigration Lawyers Usa".
//
// Second receipt, same field: EXP-3. `looksLikeTitle` treated the bare word "best" as a marketing sign, so
// "Bhatia Best Solicitors" was rejected at every door and bhatiabest.co.uk's audit was headed "Bhatiabest".
//
// The two regressions this file exists to prevent, both real past defects:
//   · WARD HADAWAY LLP on wardhadaway.com must stay "Ward Hadaway LLP" — a surname is not an acronym.
//   · a name the firm already writes in mixed case must pass through BYTE-EXACT — it is the firm's own styling.
import assert from 'node:assert/strict';
import { humaniseName, looksLikeTitle } from '../functions/audit/_names.js';
import { payloadToD } from '../functions/audit/_adapter.js';

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };
const H = (name, domain) => humaniseName(name, domain);
// The whole pipe, not just the helper: the name a report is actually headed with.
const NM = (company, domain) => {
  const d = payloadToD({
    domain, company, firm_profile: { name: company }, detected_sector: 'law-firms', country: 'UK',
    engine_version: 't', pointers: [], binding: {}, jurisdiction_families: { families: ['UK'], primary: 'UK' },
    verified: true, llm_verify: { status: 'pass' },
  }, { verified: true });
  return (d.meta && d.meta.company) || '';
};

/* ── the reported defect ─────────────────────────────────────────────────────────────────────── */
t('JF Law: an acronym the stem STARTS with is not title-cased to "Jf"', () => {
  assert.strictEqual(H('JF LAW LIMITED', 'jflaw.co.uk'), 'JF Law Limited');
  assert.strictEqual(H('JF LAW LTD', 'jflaw.co.uk'), 'JF Law LTD');
  assert.strictEqual(NM('JF LAW LIMITED', 'jflaw.co.uk'), 'JF Law Limited');
});
t('DDS Group NYC: acronym at the front, place initialism at the back', () => {
  assert.strictEqual(H('DDS GROUP NYC', 'ddsgroupnyc.com'), 'DDS Group NYC');
  assert.strictEqual(NM('DDS GROUP NYC', 'ddsgroupnyc.com'), 'DDS Group NYC');
});
t('IPS: the stem is a stop word + the acronym (theips.co.uk)', () => {
  assert.strictEqual(H('IPS LIMITED', 'theips.co.uk'), 'IPS Limited');
  assert.strictEqual(H('THE IPS', 'theips.co.uk'), 'The IPS');
});
t('RMWBH: five letters, no vowel, therefore not a word', () => {
  assert.strictEqual(H('RMWBH LAW', 'rmwbh.com'), 'RMWBH Law');
  assert.strictEqual(H('RMWBH', 'rmwbhlaw.com'), 'RMWBH');
});
t('GP / USA: two more that used to read "Gp" and "Usa"', () => {
  assert.strictEqual(H('THE PRIVATE GP GROUP', 'theprivategpgroup.co.uk'), 'The Private GP Group');
  assert.strictEqual(H('IMMIGRATION LAWYERS USA', 'immigrationlawyersusa.com'), 'Immigration Lawyers USA');
});
t('EJ: a TWO-letter token the stem continues into the next word', () => {
  assert.strictEqual(H('EJ LAW LIMITED', 'ejlaw.co.uk'), 'EJ Law Limited');
});

/* ── EXP-3 · a surname is not an adjective ───────────────────────────────────────────────────── */
t('EXP-3: "Bhatia Best Solicitors" is a firm name, not a marketing title', () => {
  assert.strictEqual(looksLikeTitle('Bhatia Best Solicitors', 'bhatiabest.co.uk'), false);
  assert.strictEqual(looksLikeTitle('Bhatia Best Limited', 'bhatiabest.co.uk'), false);
  assert.strictEqual(NM('Bhatia Best Solicitors', 'bhatiabest.co.uk'), 'Bhatia Best Solicitors');
  assert.strictEqual(H('BHATIA BEST LIMITED', 'bhatiabest.co.uk'), 'Bhatia Best Limited');
});
t('EXP-3: a real marketing title is STILL rejected, on that very domain', () => {
  assert.strictEqual(looksLikeTitle('Best Solicitors in Leeds', 'bhatiabest.co.uk'), true);
  assert.strictEqual(looksLikeTitle('Best Solicitors', 'bhatiabest.co.uk'), true);
  assert.strictEqual(looksLikeTitle('Best Legal Reviews', 'bestlegal.co.uk'), true);
  assert.strictEqual(looksLikeTitle('News', 'newslaw.co.uk'), true);
  assert.strictEqual(looksLikeTitle('Pricing Plans', 'bhatiabest.co.uk'), true);
  assert.strictEqual(looksLikeTitle('Our Team', 'bhatiabest.co.uk'), true);
  assert.strictEqual(NM('Best Solicitors in Leeds', 'bhatiabest.co.uk'), 'Bhatiabest');
});
t('EXP-3: with no domain supplied, looksLikeTitle behaves exactly as before', () => {
  assert.strictEqual(looksLikeTitle('Bhatia Best Solicitors'), true);   // uncorroborated: unchanged
  assert.strictEqual(looksLikeTitle('Slee Blackwell Solicitors'), false);
});

/* ── the regressions ─────────────────────────────────────────────────────────────────────────── */
t('REGRESSION: BDO still owns its acronym, and WARD is still a surname', () => {
  assert.strictEqual(H('BDO LLP', 'bdo.co.uk'), 'BDO LLP');
  assert.strictEqual(H('DWF LAW LLP', 'dwf.law'), 'DWF Law LLP');
  assert.strictEqual(H('WARD HADAWAY LLP', 'wardhadaway.com'), 'Ward Hadaway LLP');
  assert.strictEqual(H('IAN SMITH SOLICITORS', 'iansmith.co.uk'), 'Ian Smith Solicitors');
  assert.strictEqual(H('LYNCH LAW LLP', 'lynchlaw.co.uk'), 'Lynch Law LLP');
  assert.strictEqual(H('FRY LAW', 'frylaw.co.uk'), 'Fry Law');
  assert.strictEqual(H('RHYS JONES', 'rhysjones.co.uk'), 'Rhys Jones');
});
t('REGRESSION: a guarded word is never shouted — St, Mc, Dr, My', () => {
  assert.strictEqual(H("ST JOHN'S CHAMBERS", 'stjohnschambers.co.uk'), "St John's Chambers");
  assert.strictEqual(H('MC KENZIE LAW', 'mckenzielaw.co.uk'), 'Mc Kenzie Law');
  assert.strictEqual(H('DR PATEL DENTAL', 'drpateldental.co.uk'), 'Dr Patel Dental');
  assert.strictEqual(H('MY CLINIC LIMITED', 'myclinic.co.uk'), 'My Clinic Limited');
  // the surname particles: _KEEP_CAPS is consulted FIRST, so a particle listed there would be shouted at every
  // Spanish and French name on the register.
  assert.strictEqual(H('DE LA CRUZ LAW', 'delacruzlaw.com'), 'De La Cruz Law');
  assert.strictEqual(H('VAN DER BERG SOLICITORS', 'vanderberg.co.uk'), 'Van Der Berg Solicitors');
});
t('REGRESSION: NAME-01c SHOUTING names are unchanged', () => {
  assert.strictEqual(H('BIRKETTS LLP', 'birketts.co.uk'), 'Birketts LLP');
  assert.strictEqual(H('MILLS & REEVE LLP', 'mills-reeve.com'), 'Mills & Reeve LLP');
  assert.strictEqual(H('RUSSELL-COOKE LLP', 'russell-cooke.co.uk'), 'Russell-Cooke LLP');
  assert.strictEqual(H('ESTE MEDICAL GROUP LTD', 'estemedicalgroup.uk'), 'Este Medical Group LTD');
  assert.strictEqual(H('BUCKLAND CARE LIMITED', 'bucklandcare.co.uk'), 'Buckland Care Limited');
  assert.strictEqual(H('HARROWELLS LIMITED', 'harrowells.co.uk'), 'Harrowells Limited');
  assert.strictEqual(H('SLEE BLACKWELL SOLICITORS', 'sleeblackwell.co.uk'), 'Slee Blackwell Solicitors');
  assert.strictEqual(H('BARRETT & FARAHANY', 'barrettandfarahany.com'), 'Barrett & Farahany');
});

/* ── mixed case is the firm's own styling ────────────────────────────────────────────────────── */
t('MIXED CASE: passes through byte-exact, never re-cased', () => {
  for (const [name, domain] of [
    ['iPS', 'theips.co.uk'],
    ['JF Law LTD', 'jflaw.co.uk'],
    ['Elk & Elk Co., Ltd', 'elkandelk.com'],
    ['DiMichaelangelo Family Dentistry', 'healthysmiles.com'],
    ['Barrett & Farahany', 'barrettandfarahany.com'],
    ['The Private GP Group', 'theprivategpgroup.co.uk'],
    ['deVere Group', 'devere-group.com'],
    ['Freeths LLP', 'freeths.co.uk'],
  ]) assert.strictEqual(H(name, domain), name, name + ' must be byte-exact');
});
t('MIXED CASE: no "Ltd"->"Limited" expansion is invented anywhere in the render path', () => {
  assert.strictEqual(H('Kingsley Ltd', 'kingsleylaw.co.uk'), 'Kingsley Ltd');
  assert.strictEqual(H('KINGSLEY LAW LTD', 'kingsleylaw.co.uk'), 'Kingsley Law LTD');   // SHOUTING: suffix as written
  assert.ok(!/Limited/.test(NM('Kingsley Ltd', 'kingsleylaw.co.uk')));
  assert.ok(!/Limited/.test(NM('JF Law LTD', 'jflaw.co.uk')));
});

console.log(bad ? 'NAME-01d/EXP-3: FAIL' : 'NAME-01d/EXP-3: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
