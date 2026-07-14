// E07 / E08 / E09 — the three ways the report was making up law.
import assert from 'node:assert/strict';
import { payloadToD } from '../functions/audit/_adapter.js';
import { readFileSync } from 'node:fs';

const P = (fw, bs = 'statute', fam = 'UK', cc = 'UK') => payloadToD({
  domain: 'x.co.uk', company: 'X LLP', firm_profile: { name: 'X LLP' },
  detected_sector: 'law-firms', country: cc, engine_version: 't',
  pointers: [{ severity: 'P1', bucket: 'compliance', framework_short: fw, fact: 'gap' }],
  binding: { [fw]: bs }, jurisdiction_families: { families: [fam], primary: fam },
  verified: true, llm_verify: { status: 'pass' },
}, { verified: true });
const fw1 = (D) => (D.frameworks || [])[0] || {};

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

// ---------- E08: we printed the words "Sector regulator" as if they were the enforcing authority ----------
t('E08: the literal string "Sector regulator" cannot appear in the source at all', () => {
  const src = readFileSync(new URL('../functions/audit/_adapter.js', import.meta.url), 'utf8');
  assert.ok(!/'Sector regulator'/.test(src), 'the placeholder authority is back in _adapter.js');
});
t('E08: an unmapped framework OMITS the regulator, it never invents one', () => {
  const f = fw1(P('EU_FIC_1169_2011'));
  assert.ok(!/Sector regulator/i.test(JSON.stringify(f)), 'a fabricated authority rendered');
  assert.ok(f.regulator === null || f.regulator === undefined || typeof f.regulator === 'string');
});
t('E08: the prose reads correctly when the authority is unknown (never "null expects")', () => {
  assert.ok(!/null expects/.test(JSON.stringify(P('EU_FIC_1169_2011'))));
});
t('E08: a known framework still names its real regulator', () => {
  assert.match(String(fw1(P('UK_ECOMMERCE_2002')).regulator || ''), /Trading Standards|CMA/);
  assert.match(String(fw1(P('FR_LCEN', 'statute', 'EU', 'FR')).regulator || ''), /DGCCRF/);
});

// ---------- E09: a regulator's rulebook was being called an Act of Parliament ----------
t('E09: the SRA rulebooks are "Regulatory rules", NOT "Statute"', () => {
  for (const fw of ['UK_SRA_TRANSPARENCY', 'UK_SRA_COC', 'UK_LEGAL_OMBUDSMAN']) {
    const label = fw1(P(fw, 'statutory_code')).binding_label;
    assert.strictEqual(label, 'Regulatory rules', fw + ' rendered as "' + label + '"');
    assert.notStrictEqual(label, 'Statute', fw + ' must never read as an Act of Parliament');
  }
});
t('E09: a real statute still reads "Statute"; an SI reads "Statutory instrument"', () => {
  assert.strictEqual(fw1(P('UK_GDPR', 'statute')).binding_label, 'Statute');
  assert.strictEqual(fw1(P('UK_PECR', 'statutory_instrument')).binding_label, 'Statutory instrument');
});
t('E09: every binding_status the database can emit has a label (no fallback guessing)', () => {
  const src = readFileSync(new URL('../functions/audit/_adapter.js', import.meta.url), 'utf8');
  for (const bs of ['statute', 'statutory_instrument', 'statutory_code', 'regulator_code',
                    'professional_code', 'statutory_redress', 'industry_code', 'voluntary_code', 'guidance']) {
    assert.ok(new RegExp('\\b' + bs + ':').test(src), 'binding_status "' + bs + '" has no label and will be guessed');
  }
  assert.ok(!/Object\.keys\(_BINDING_MAP\)\.length \? 'Statute'/.test(src), 'the "guess Statute" fallback is back');
});

// ---------- E07: the instrument's real name ----------
t('E07: the promoted laws carry their exact legal title, not a title-cased code', () => {
  assert.strictEqual(fw1(P('UK_ECOMMERCE_2002')).name, 'Electronic Commerce (EC Directive) Regulations 2002');
  assert.strictEqual(fw1(P('UK_LEGAL_SERVICES_2007')).name, 'Legal Services Act 2007');
  assert.match(String(fw1(P('DE_IMPRESSUM', 'statute', 'EU', 'DE')).name), /Digitale-Dienste-Gesetz/);
});
t('E07: Germany cites the CURRENT basis (DDG s.5), never the repealed TMG', () => {
  const name = String(fw1(P('DE_IMPRESSUM', 'statute', 'EU', 'DE')).name);
  assert.ok(!/\bTMG\b/.test(name), 'TMG s.5 was repealed on 14 May 2024; citing it is an Abmahnung risk');
  assert.match(name, /DDG/);
});
t('E07: no framework renders as a raw or title-cased underscore code', () => {
  for (const fw of ['UK_ECOMMERCE_2002', 'EU_ECD_ART5', 'UK_LEGAL_SERVICES_2007', 'FR_LCEN']) {
    const nm = String(fw1(P(fw, 'statute', fw.startsWith('UK') ? 'UK' : 'EU', fw.startsWith('UK') ? 'UK' : 'FR')).name || '');
    assert.ok(!/_/.test(nm), fw + ' rendered a raw code: ' + nm);
    assert.ok(!/^(Uk|Eu|Us|De|Fr)\s/.test(nm), fw + ' rendered a title-cased code: ' + nm);
  }
});

console.log(bad ? 'E07/E08/E09: FAIL' : 'E07/E08/E09 CATALOGUE TRUTH: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
