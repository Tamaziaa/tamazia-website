// RENDERER TRUTH · batch 1 — the defects a JSON check can never see, because the page is CLIENT-RENDERED.
//
// FIX 1  CURRENCY BY REGIME. moneySymbol() knew only '£' and '$', so a Gulf or EU firm was quoted its statutory
//        exposure in POUNDS. The currency of a fine is fixed by the STATUTE THAT SETS IT, not by the firm's home
//        country: EU GDPR is euros for everyone; DIFC/ADGM are US DOLLARS (USD 25k/50k/100k, not dirhams); UAE
//        federal PDPL is dirhams; ICO/SRA/CMA/PECR are pounds. Currencies are never summed and NEVER converted —
//        an exchange rate invented on a legal document is a fabrication.
// FIX 2  THE THREE-NUMBER DOCTRINE. frameworksTotal WAS frameworks.length, so the rail read "15 FRAMEWORKS
//        SCREENED · 15 BIND YOU" — erasing the screening story, which is the whole differentiator. Three distinct
//        numbers now: catalogue screened (read from the payload, never guessed) / binding / rule checks executed.
// FIX 3  "jurisdiction(s)" is a form field, not client-facing legal prose.
// FIX 4  NO TRUNCATION. Nothing is cut. Not mid-word, not with an ellipsis, not by CSS.
// FIX 5  Small copy defects: boardrooms, £ not GBP, one GDPR glossary entry, count-aware breach note, floor note.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { payloadToD, bingoFromPointer, currencyForFramework } from '../functions/audit/_adapter.js';

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

// Source-level assertions run against CODE, not comments — a comment that NAMES a defect is not the defect.
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const APP = strip(readFileSync(new URL('../public/audit/audit-app.js', import.meta.url), 'utf8'));
const ADAPTER = strip(readFileSync(new URL('../functions/audit/_adapter.js', import.meta.url), 'utf8'));
const CSS = strip(readFileSync(new URL('../public/audit/audit.css', import.meta.url), 'utf8'));

const P = (o) => Object.assign({ severity: 'P0', bucket: 'compliance', fact: 'x', state: 'CONFIRMED' }, o);
// a fully-evidenced compliance breach: quote + citation, so it survives the evidence membrane
const breach = (fw, extra) => P(Object.assign({
  framework_short: fw, statutory_citation: fw + ' art. 1', citation_url: 'https://example.org/' + fw,
  evidence_quote: 'We collect your personal data through this website and share it with our partners worldwide.',
  checked_urls: ['https://x.example/privacy'],
  fine_low_gbp: 1e5, fine_high_gbp: 5e6, enforce_typical_low_gbp: 1e5, enforce_typical_high_gbp: 1e6,
}, extra || {}));
const base = (country, families, pointers) => ({
  domain: 'x.example', detected_sector: 'law-firms', country, engine_version: 'test',
  pointers, binding: Object.fromEntries(pointers.map((p) => [p.framework_short, 'statute'])),
  firm_profile: {}, pages_crawled: ['https://x.example/'],
  scan: { site_scan_reachable: true, signals: { title: 'X LLP', h1_count: 1, meta_description: 'x' } },
  jurisdiction_families: { families, primary: families[0] },
  detected_jurisdictions: families.map((f) => ({ UK: 'United Kingdom', EU: 'European Union', AE: 'United Arab Emirates', US: 'United States', SA: 'Saudi Arabia' }[f] || f)),
});

/* ---------------- FIX 1 · currency follows the binding regime, never the passport ---------------- */
t('FIX-1: currencyForFramework maps every verified regime to ITS OWN statutory currency', () => {
  const cases = {
    UK_GDPR_A13: '£', UK_PECR: '£', UK_SRA: '£', UK_CMA: '£', UK_EQUALITY_2010: '£',
    EU_GDPR: '€', EU_AI_ACT: '€', EU_EAA_2025: '€', EU_EPRIVACY: '€', FR_CNIL: '€', DE_BDSG: '€',
    US_FTC: '$', US_CCPA: '$', US_STATE_PRIVACY: '$',
    DIFC_DPL: '$', ADGM_DPR: '$',            // VERIFIED: DIFC/ADGM fines are USD-denominated, NOT dirhams
    UAE_PDPL: 'AED', AE_PDPL: 'AED',         // UAE FEDERAL PDPL is in dirhams
    SAUDI_PDPL: 'SAR', QATAR_PDPPL: 'QAR',
  };
  for (const [code, cur] of Object.entries(cases)) assert.equal(currencyForFramework(code), cur, code + ' must be quoted in ' + cur);
  assert.equal(currencyForFramework('GOOGLE_EEAT'), null, 'a non-statutory signal has no statutory currency');
  assert.equal(currencyForFramework(''), null);
});

t('FIX-1: a EU-bound finding renders € even when the page currency is £', () => {
  const b = bingoFromPointer(breach('EU_GDPR'), 'Regulatory', {}, 0, '£');
  assert.match(b.exp, /€/, 'EU GDPR must be quoted in euros, got: ' + b.exp);
  assert.ok(!/£/.test(b.exp), 'a GDPR fine is NOT set in pounds: ' + b.exp);
});

t('FIX-1: a DIFC finding renders $ (not AED, not £)', () => {
  const b = bingoFromPointer(breach('DIFC_DPL'), 'Regulatory', {}, 0, '£');
  assert.match(b.exp, /\$/, 'DIFC fines are denominated in US dollars, got: ' + b.exp);
  assert.ok(!/AED|£/.test(b.exp), 'DIFC is not a dirham regime: ' + b.exp);
});

t('FIX-1: a UK finding renders £, and a UAE federal finding renders AED', () => {
  assert.match(bingoFromPointer(breach('UK_PECR'), 'Regulatory', {}, 0, '$').exp, /£/);
  const ae = bingoFromPointer(breach('UAE_PDPL'), 'Regulatory', {}, 0, '£').exp;
  assert.match(ae, /AED /, 'a multi-character code needs a space before the number, got: ' + ae);
});

t('FIX-1: NO FX. Two regimes, two currencies, printed side by side and never converted', () => {
  const D = payloadToD(base('UK', ['UK', 'EU'], [
    breach('UK_PECR', { enforce_typical_low_gbp: 4e5, enforce_typical_high_gbp: 6e5 }),   // median 500k
    breach('EU_GDPR', { enforce_typical_low_gbp: 8e5, enforce_typical_high_gbp: 1e6 }),   // median 900k
  ]), { verified: true });
  const byCur = Object.fromEntries(D.exposureByCurrency.map((x) => [x.cur, x.amount]));
  assert.ok(byCur['£'] > 0 && byCur['€'] > 0, 'both binding currencies must be carried: ' + JSON.stringify(D.exposureByCurrency));
  // the aggregate is stated PER CURRENCY ("€900k + £500k"), never fabricated into one converted figure
  assert.match(D.exposureHeadline, /\+/, 'a multi-currency aggregate is printed per currency, got: ' + D.exposureHeadline);
  assert.match(D.exposureHeadline, /€/); assert.match(D.exposureHeadline, /£/);
  // and no exchange rate has been applied: each figure is still its own regime's own median
  assert.equal(byCur['€'], 9e5, 'the euro figure must be the euro median, unconverted');
  assert.equal(byCur['£'], 5e5, 'the pound figure must be the pound median, unconverted');
  assert.match(D.exposureBasis, /no exchange rate is applied/i);
  // the waterfall must add up to the headline currency it sits beside
  assert.equal(D.exposureWaterfall.cur, D.cur);
  assert.equal(D.exposureWaterfall.collapsed, byCur[D.cur]);
});

t('FIX-1: a Gulf firm is never quoted in pounds', () => {
  const D = payloadToD(base('UAE', ['AE'], [breach('DIFC_DPL'), breach('UAE_PDPL')]), { verified: true });
  assert.ok(!/£/.test(D.exposureHeadline), 'a DIFC/UAE firm must not see a pound sign: ' + D.exposureHeadline);
  assert.ok(D.heatRows.every((r) => !/£/.test(r)), 'the exposure ladder must be in the firms own currency: ' + D.heatRows.join(' '));
  assert.ok(!/£/.test(D.frameworks.map((f) => f.exp).join(' ')), 'no framework card may print £ for a Gulf firm');
});

t('FIX-1: no FX rate is ever applied to a fine (the adapter contains no conversion table)', () => {
  // The ONLY rate table in the codebase is the PRICE toggle in audit-app.js, which is explicitly labelled
  // "quoted & invoiced in GBP" and never touches a statutory fine. The adapter must contain no rate at all.
  assert.ok(!/rate\s*:\s*[\d.]+/.test(ADAPTER), 'an FX rate has appeared in _adapter.js');
  assert.ok(/invoiced in GBP/.test(APP), 'the price toggle keeps its GBP-invoicing note');
});

/* ---------------- FIX 2 · the three-number doctrine ---------------- */
t('FIX-2: SCREENED and BIND are different numbers — the rail never says "N screened · N bind you"', () => {
  const D = payloadToD(base('UK', ['UK'], [breach('UK_PECR'), breach('UK_GDPR_A13')]), { verified: true });
  assert.equal(D.frameworksBinding, D.frameworks.length, 'binding = what attaches to THIS firm');
  // the engine emits no catalogue count today -> we print a safe label, we do NOT print the binding count twice
  assert.equal(D.catalogueSize, null, 'catalogueSize is READ from the payload, never guessed');
  assert.equal(D.screenedLabel, 'Full catalogue screened');
  assert.ok(!new RegExp('^' + D.frameworksBinding + ' frameworks screened$').test(D.screenedLabel),
    'the screened figure must never just be the binding figure again');
});

// SUPERSEDED BY THE 400+ DECISION. This test used to assert `screenedLabel === '403 frameworks screened'`, i.e. it
// ENCODED THE DEFECT: the register holds 294 frameworks, so any "400+ frameworks" claim is false, on a document that
// fines other firms for false claims. We screen RULES (671 of them); FRAMEWORKS bind. The payload key is now
// catalogue_rules, and the label says rules.
t('FIX-2: when the engine emits the register count, it is used verbatim and reads as RULES', () => {
  const p = base('UK', ['UK'], [breach('UK_PECR')]);
  p.catalogue_rules = 671;
  const D = payloadToD(p, { verified: true });
  assert.equal(D.catalogueSize, 671);
  assert.equal(D.screenedLabel, '671 compliance rules screened');
  assert.ok(!/frameworks screened/i.test(D.screenedLabel), 'frameworks do not get screened; rules do');
  assert.ok(D.catalogueSize > D.frameworksBinding, 'screened must exceed binding');
});

t('FIX-2: rulesChecked is a RULE count (from payload.rules), not a framework count', () => {
  const p = base('UK', ['UK'], [breach('UK_PECR')]);
  p.rules = [
    { rule_id: '1', framework_short: 'UK_PECR' }, { rule_id: '2', framework_short: 'UK_PECR' },
    { rule_id: '3', framework_short: 'UK_GDPR_A13' }, { rule_id: '4', framework_short: 'US_CCPA' },  // foreign: not checked here
  ];
  const D = payloadToD(p, { verified: true });
  assert.equal(D.rulesChecked, 3, 'only the rules whose regime attaches to this firm are counted');
  assert.notEqual(D.rulesChecked, D.frameworksBinding, 'rules and frameworks are different quantities');
  assert.match(D.scoring.inputs, /rule checks executed/);
});

t('FIX-2 (E32/E33/E34): audit-app.js never prints rulesChecked with the word "frameworks"', () => {
  assert.ok(!/\$\{D\.rulesChecked\}\s*(active\s*)?frameworks/.test(APP), 'rulesChecked is still printed as "frameworks"');
  assert.ok(!/D\.rulesChecked\+' (active )?frameworks/.test(APP), 'rulesChecked is still concatenated with "frameworks"');
  assert.ok(!/prosecution grade/.test(APP), '"prosecution grade" must be hyphenated');
  assert.match(APP, /prosecution-grade re-scan of all \$\{D\.frameworksBinding\} binding/);
  assert.match(APP, /rail-band">\$\{D\.screenedLabel\} · \$\{D\.frameworksBinding\} bind you/);
});

/* ---------------- FIX 3 · jurisdiction singular / plural ---------------- */
t('FIX-3 (E03): "jurisdiction" for one, "jurisdictions" for several — never "jurisdiction(s)"', () => {
  const one = payloadToD(base('UK', ['UK'], [breach('UK_PECR')]), { verified: true }).jurisdiction;
  assert.match(one, /the jurisdiction its own website shows it serves/);
  assert.ok(!/jurisdiction\(s\)/.test(one), 'the literal "(s)" is client-facing copy: ' + one);
  const many = payloadToD(base('UK', ['UK', 'EU'], [breach('UK_PECR'), breach('EU_GDPR')]), { verified: true }).jurisdiction;
  assert.match(many, /the jurisdictions its own website shows it serves/);
});

t('FIX-3: no "(s)" survives anywhere in the adapter client-facing prose', () => {
  assert.ok(!/jurisdiction\(s\)/.test(ADAPTER), '"jurisdiction(s)" is still in _adapter.js');
  assert.ok(!/(breach|framework|finding|page)\(e?s\)/.test(ADAPTER), 'a "(s)" plural is still in client-facing copy');
});

/* ---------------- FIX 4 · nothing is cut ---------------- */
const LONG = "The regulator took into account the firm's cooperation, self-reporting and the remedial steps taken after the incident, together with the absence of any prior enforcement history, and reduced the penalty accordingly before publication of the final notice.";

t('FIX-4 (E13): enfContext is NEVER truncated — no mid-word cut, no ellipsis', () => {
  const b = bingoFromPointer(breach('UK_PECR', { enforce_context: LONG }), 'Regulatory', {}, 0, '£');
  assert.equal(b.enfContext, LONG, 'enfContext must survive the adapter byte-for-byte');
  assert.ok(!/…|\.\.\.$/.test(b.enfContext), 'enfContext ends in an ellipsis');
  assert.ok(/\.$/.test(b.enfContext), 'enfContext must end at a sentence boundary, not mid-word');
});

t('FIX-4: a long evidence quote reaches the page in full (no .slice on the firms own words)', () => {
  const q = 'We may transfer your personal information outside the United Kingdom to our affiliates, professional advisers and service providers, including in jurisdictions that have not been deemed adequate, without further notice to you at any time.';
  const D = payloadToD(base('UK', ['UK'], [breach('UK_GDPR_A13', { evidence_quote: q })]), { verified: true });
  const quotes = D.frameworks.flatMap((f) => (f.articleGroups || []).flatMap((gp) => gp.items.map((i) => i.quote)))
    .concat(D.fixes.map((f) => f.quote)).filter(Boolean);
  assert.ok(quotes.some((x) => x === q), 'the quote was truncated somewhere: ' + JSON.stringify(quotes));
  assert.ok(!quotes.some((x) => /…$/.test(x)), 'a quote ends in an ellipsis');
});

t('FIX-4: the CSS no longer clips client-facing prose (line-clamp / text-overflow)', () => {
  assert.ok(!/-webkit-line-clamp/.test(CSS), 'a -webkit-line-clamp is back in audit.css');
  assert.ok(!/\.meta-row>span:not\(\.mk\)\{[^}]*text-overflow:ellipsis/.test(CSS), 'the Ruling row is still clipped with an ellipsis');
  assert.ok(!/\.inspected\{[^}]*text-overflow:ellipsis/.test(CSS), 'the inspected-pages list is still clipped');
});

/* ---------------- FIX 5 · small copy defects ---------------- */
t('FIX-5 (E42): "boardrooms", not "board-rooms"', () => {
  assert.ok(!/board-rooms/.test(APP));
  assert.match(APP, /Where most boardrooms start/);
});

t('FIX-5 (E10): the page prints £, never "GBP 17.5M"', () => {
  assert.ok(!/GBP\s?17\.5M/.test(ADAPTER), '"GBP 17.5M" is still in the enforcement copy');
  const p = base('UK', ['UK'], [breach('UK_PECR')]);
  p.glossary = { terms: { gdpr: 'The data-protection law for the UK and EU. Fines reach GBP 17.5M or 4% of global turnover.' } };
  const gl = payloadToD(p, { verified: true }).glossary;
  const defs = Object.values(gl).join(' ');
  assert.ok(!/GBP\s?\d/.test(defs), 'a glossary definition still prints "GBP <n>": ' + defs);
  assert.match(defs, /£17\.5M/);
});

t('FIX-5 (E55): ONE GDPR glossary entry — "UK GDPR", with "GDPR" as an alias', () => {
  const p = base('UK', ['UK'], [breach('UK_PECR')]);
  p.glossary = { terms: {
    gdpr: 'The data-protection law for the UK and EU. Fines reach GBP 17.5M or 4% of global turnover.',
    'uk gdpr': 'The UK version of the EU data-protection law, enforced by the ICO with fines up to GBP 17.5M or 4% of global turnover.',
    pecr: 'UK rules on cookies and electronic marketing.',
  } };
  const gl = payloadToD(p, { verified: true }).glossary;
  const keys = Object.keys(gl).map((k) => k.toLowerCase());
  assert.equal(keys.filter((k) => /gdpr/.test(k)).length, 1, 'one law, one entry: ' + keys.join(', '));
  assert.ok(Object.keys(gl).includes('UK GDPR'), 'the entry is displayed as "UK GDPR": ' + Object.keys(gl).join(', '));
  assert.match(gl['UK GDPR'], /GDPR/, 'the alias must be stated so a reader scanning for "GDPR" still finds it');
});

t('FIX-5 (E14): the exposure note counts the breaches it sits beside', () => {
  const one = payloadToD(base('UK', ['UK'], [breach('UK_PECR')]), { verified: true });
  assert.match(one.exposureNote, /across the 1 breach evidenced/, one.exposureNote);
  assert.ok(!/1 breaches/.test(one.exposureNote));
  const two = payloadToD(base('UK', ['UK'], [breach('UK_PECR'), breach('UK_GDPR_A13')]), { verified: true });
  assert.match(two.exposureNote, /across the 2 breaches evidenced/, two.exposureNote);
});

t('FIX-5 (E28): a dimension that scores 0 says WHY', () => {
  const p = base('UK', ['UK'], [breach('UK_PECR'), breach('UK_GDPR_A13'), breach('UK_SRA'), breach('UK_CMA'),
    breach('UK_DMCC_2024'), breach('UK_EQUALITY_2010'), breach('UK_ASA_CAP'), breach('UK_COMPANIES_ACT'),
    breach('UK_FCA'), breach('UK_CRA_2015')]);
  const D = payloadToD(p, { verified: true });
  const zero = D.dims.filter((d) => d.v === 0 && d.st !== 'na');
  assert.ok(zero.length > 0, 'this payload must floor at least one dimension');
  for (const d of zero) assert.match(d.note, /^Scored 0 because /, d.nm + ' has no floor note');
  const comp = D.dims.find((d) => d.nm === 'Regulatory compliance');
  assert.match(comp.note, /Critical findings sit in this dimension; each Critical caps the dimension at zero until closed\./);
});

console.log(bad ? 'RENDERER TRUTH batch 1: FAIL' : 'RENDERER TRUTH batch 1: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
