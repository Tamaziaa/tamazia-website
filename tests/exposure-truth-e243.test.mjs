// E-243 / E-244 — the two defects Aman caught on the LIVE page that a JSON check could never see.
//
// E-243  "how can seo or geo metrics have enforcement action or breaches or laws"
//        A Largest-Contentful-Paint finding (bucket `performance`) was rendered with the penalty label
//        "enforcement action". Root cause: THREE different non-statutory bucket lists existed in _adapter.js and
//        drifted apart. `law` tested {seo, technical, performance, tls_dns...}; `noFine` tested only
//        {seo, ai_visibility}. `performance` slipped through noFine, carried no fine, and hit the literal
//        fallback string 'enforcement action'. One canonical predicate now, or this comes straight back.
//
// E-244  "5 million pound breach is shown on left but nowhere it is there, we had a system of accessing the
//        median fine, bring that back". The rail headlined the SUM OF STATUTORY CEILINGS. It appeared nowhere else
//        on the page and no law firm believes it. The headline is now the MEDIAN of the typical enforcement band,
//        which is the band printed on every breach card, so the number is traceable by the reader.
import assert from 'node:assert/strict';
import { bingoFromPointer, payloadToD } from '../functions/audit/_adapter.js';

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };
const tA = async (name, fn) => { n++; try { await fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

const P = (o) => Object.assign({ severity: 'P1', fact: 'x', framework_short: null }, o);

// ---------- E-243 ----------
t('E-243: a Core Web Vital (bucket=performance) is NEVER labelled "enforcement action"', () => {
  const b = bingoFromPointer(P({ bucket: 'performance', fact: 'Largest Contentful Paint' }), 'SEO', {}, 0, '£');
  assert.ok(!/enforcement action/i.test(b.exp), 'exp was: ' + b.exp);
  assert.match(b.exp, /non-statutory/i);
  assert.equal(b.labelKind, 'Standard', 'a CWV is a Standard, not a Law');
});

t('E-243: every non-statutory bucket is caught, none may print a £ figure', () => {
  for (const bucket of ['seo', 'technical_seo', 'technical', 'tls_dns', 'performance', 'core_web_vitals',
    'ai_visibility', 'geo', 'eeat', 'authority', 'backlinks', 'schema', 'knowledge_graph']) {
    // hostile payload: a fine has been wrongly attached to a ranking signal. It must still never render.
    const b = bingoFromPointer(P({ bucket, fine_high_gbp: 5e6, enforce_typical_high_gbp: 5e6 }), 'SEO', {}, 0, '£');
    assert.ok(!/£/.test(b.exp), bucket + ' printed a fine: ' + b.exp);
    assert.ok(!/enforcement action/i.test(b.exp), bucket + ' printed "enforcement action"');
  }
});

t('E-243: statutory buckets KEEP their fines (accessibility = Equality Act, tracking = PECR)', () => {
  const acc = bingoFromPointer(P({ bucket: 'accessibility', framework_short: 'UK_EQA2010', enforce_typical_low_gbp: 1e4, enforce_typical_high_gbp: 5e4 }), 'Compliance', {}, 0, '£');
  assert.match(acc.exp, /£/, 'Equality Act must keep its fine, got: ' + acc.exp);
  const pecr = bingoFromPointer(P({ bucket: 'tracking', framework_short: 'UK_PECR', enforce_typical_low_gbp: 5e4, enforce_typical_high_gbp: 5e5 }), 'Compliance', {}, 0, '£');
  assert.match(pecr.exp, /£/, 'PECR must keep its fine, got: ' + pecr.exp);
  assert.equal(pecr.labelKind, 'Law');
});

t('E-243: a real statute found on a technical page stays statutory (code beats bucket)', () => {
  const b = bingoFromPointer(P({ bucket: 'technical', framework_short: 'UK_GDPR', enforce_typical_low_gbp: 1e5, enforce_typical_high_gbp: 1e6 }), 'Compliance', {}, 0, '£');
  assert.match(b.exp, /£/, 'UK_GDPR must keep its fine even in a technical bucket, got: ' + b.exp);
});

await tA('E-243: the literal string "enforcement action" is gone from the penalty fallback', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../functions/audit/_adapter.js', import.meta.url), 'utf8');
  assert.ok(!/:\s*'enforcement action'/.test(src), "the 'enforcement action' fallback is back in _adapter.js");
});

// ---------- E-244 ----------
const payload = {
  domain: 'x.co.uk', detected_sector: 'law-firms', country: 'UK', engine_version: 'test',
  pointers: [
    // DMCC: typical band £100k to £5M -> median £2.55M. Statutory ceiling £5M.
    P({ bucket: 'compliance', framework_short: 'UK_DMCC', severity: 'P0', fine_high_gbp: 5e6, enforce_typical_low_gbp: 1e5, enforce_typical_high_gbp: 5e6,
      statutory_citation: 'DMCC Act 2024 s.226',
      evidence_quote: 'Read what our clients say about us on our reviews page, updated monthly.' }),
    // an SEO signal carrying nothing: must contribute ZERO to the exposure
    P({ bucket: 'performance', fact: 'Largest Contentful Paint' }),
  ],
  binding: { UK_DMCC: 'statute' }, firm_profile: {}, jurisdiction_families: { families: ['UK'], primary: 'UK' },
  verified: true, llm_verify: { status: 'pass' },
};

t('E-244: the headline is the MEDIAN of the typical band, not the statutory ceiling', () => {
  const D = payloadToD(payload, { verified: true });
  const w = D.exposureWaterfall;
  assert.ok(w.ceiling > 0, 'ceiling still computed for context, got ' + w.ceiling);
  assert.ok(w.median > 0, 'median must be a real number, got ' + w.median);
  // E-244b THE INVARIANT: the headline can never exceed this firm's own (turnover-rescaled) statutory ceiling.
  assert.ok(w.median <= w.ceiling, 'median (' + w.median + ') must never exceed the ceiling (' + w.ceiling + ')');
  assert.equal(w.collapsed, w.median, 'the headline number MUST be the median');
  assert.match(String(D.exposureNote), /median/i, 'note must say median, got: ' + D.exposureNote);
  assert.ok(!/maximum statutory/i.test(String(D.exposureNote)), 'the scare-tactic label is gone');
});

t('E-244: the headline number is TRACEABLE — it sits inside a band printed on a card', () => {
  const D = payloadToD(payload, { verified: true });
  const med = D.exposureWaterfall.median;
  assert.ok(med >= 1e5 && med <= 5e6, 'the median must lie within the typical band the card prints');
  assert.ok(!/maximum statutory/i.test(String(D.exposureNote)));
});

t('E-244: a ranking-only audit still headlines honestly, never £0', () => {
  const D = payloadToD(Object.assign({}, payload, { pointers: [P({ bucket: 'performance', fact: 'LCP' })] }), { verified: true });
  assert.equal(D.exposureHeadline, 'Ranking & AI');
  assert.ok(!/£0/.test(String(D.exposure)) || D.exposureHeadline === 'Ranking & AI');
});


// ---------- E-247: a law that BINDS can never be crowded out by a display cap ----------
// "are cookie policy, privacy policy, data privacy laws — these common breaches — assessed live on every website,
//  all the normal laws need to be there"
// They were not. The framework list was built ONLY from findings, and the screened-injection that back-fills the
// clean-but-binding laws opened with `if (frameworks.length >= REG_CAP) return`. With 10 breached frameworks and
// REG_CAP=10 that guard fired on its first line, so UK_PECR and UK_ICO_COOKIES — both in the engine's own binding
// map — never rendered, and the page claimed "10 frameworks bind you" while its payload said 14.
t('E-247: every law in the binding map renders, even when breaches already fill the cap', () => {
  const bound = {};
  // 10 breaching frameworks to fill the old REG_CAP of 10 ...
  const ptrs = [];
  for (let i = 0; i < 10; i++) {
    const code = 'UK_FILLER_' + i;
    bound[code] = 'statute';
    ptrs.push(P({ bucket: 'compliance', framework_short: code, severity: 'P1', fact: 'gap ' + i,
      statutory_citation: 'Act s.' + i, fine_high_gbp: 1e5, enforce_typical_low_gbp: 1e4, enforce_typical_high_gbp: 1e5,
      evidence_quote: 'A verbatim sentence from the live site proving finding number ' + i + '.' }));
  }
  // ... plus the cookie / e-privacy laws, which BIND but breached clean this scan.
  bound.UK_PECR = 'statute';
  bound.UK_ICO_COOKIES = 'statute';
  bound.UK_GDPR_A13 = 'statute';
  const D = payloadToD({
    domain: 'x.co.uk', detected_sector: 'law-firms', country: 'UK', engine_version: 'test',
    pointers: ptrs, binding: bound, firm_profile: {}, pages_crawled: ['https://x.co.uk/'],
    scan: { site_scan_reachable: true, signals: { title: 'X LLP', h1_count: 1, meta_description: 'x' } },
    jurisdiction_families: { families: ['UK'], primary: 'UK' },
  }, { verified: true });
  const names = (D.frameworks || []).map((f) => String(f.name));
  assert.ok(names.some((n) => /PECR|cookie|e-?privacy/i.test(n)), 'the cookie law MUST render even when the cap is full. Got: ' + names.join(' | '));
  assert.ok(names.some((n) => /GDPR|data protection/i.test(n)), 'the data-protection law MUST render. Got: ' + names.join(' | '));
});

t('E-247: a clean binding law renders as SCREENED — never as a fabricated breach', () => {
  const D = payloadToD({
    domain: 'x.co.uk', detected_sector: 'law-firms', country: 'UK', engine_version: 'test',
    pointers: [], binding: { UK_PECR: 'statute' }, firm_profile: {}, pages_crawled: ['https://x.co.uk/'],
    scan: { site_scan_reachable: true, signals: { title: 'X LLP', h1_count: 1, meta_description: 'x' } },
    jurisdiction_families: { families: ['UK'], primary: 'UK' },
  }, { verified: true });
  const pecr = (D.frameworks || []).find((f) => /PECR|cookie/i.test(String(f.name)));
  assert.ok(pecr, 'PECR must render');
  assert.equal(pecr.screened, true, 'a clean law is SCREENED');
  assert.equal(pecr.findings, 0, 'a clean law must never invent a finding');
  assert.equal(pecr.c, 0); assert.equal(pecr.h, 0);
  assert.ok(!/£/.test(String(pecr.exp)), 'a clean law must never show a fine, got: ' + pecr.exp);
});

console.log(bad ? 'E243/E244/E247: FAIL' : 'E243/E244/E247 EXPOSURE + BINDING TRUTH: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
