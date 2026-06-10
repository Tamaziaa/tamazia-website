// _qa/qa_render.mjs — VENDORED, repo-local copy of _tools/qa_render.mjs.
//
// Why this lives in the repo: the canonical harness sits OUTSIDE this repo at the
// rebuild root (/Users/amanigga/Desktop/TAMAZIA-REBUILD/_tools/) and is not tracked,
// so CI (which checks out only tamazia-website) cannot run it. This copy resolves every
// path relative to itself (repo-root = two levels up) and reads a frozen fixtures snapshot
// vendored under _qa/fixtures/, so the gate is hermetic and deterministic in CI.
//
// Behaviour is identical to the canonical harness: render the FULL DOM for every fixture
// (real audit-app.js + audit-charts.js via jsdom) and flag every error marker, empty/NaN
// value node, missing section, and D inconsistency. Exit 1 if any fixture has issues.
//
// Keep in sync with _tools/qa_render.mjs at the rebuild root.
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url)); // .../tamazia-website/_qa
const REPO = join(__dirname, '..');                        // .../tamazia-website
const { payloadToD } = await import(join(REPO, 'functions/audit/_adapter.js'));
const { renderShell } = await import(join(REPO, 'functions/audit/_shell.js'));

const FIX = join(__dirname, 'fixtures');
const assets = {
  css: readFileSync(join(REPO, 'public/audit/audit.css'), 'utf8'),
  charts: readFileSync(join(REPO, 'public/audit/audit-charts.js'), 'utf8'),
  app: readFileSync(join(REPO, 'public/audit/audit-app.js'), 'utf8'),
};
const NAME = {
  'harley-healthcare-uk': 'Harley Street Dental Clinic', 'fenwick-law-us': 'Fenwick & West LLP',
  'thirdspace-gym-uk': 'Third Space', 'altamimi-law-uae': 'Al Tamimi & Company',
  'emaar-realestate-uae': 'Emaar Properties', 'greystar-realestate-uk': 'Greystar UK',
  'loaf-ecommerce-uk': 'Loaf', 'fourseasons-hospitality-uk': 'Four Seasons',
  'legalconsultants-law-uae': 'Legal Consultants Dubai', 'chapter-realestate-uk': 'Chapter Living',
};

function renderDom(D) {
  const html = renderShell(D, { inline: true, assets });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} };
      w.scrollTo = () => {};
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    },
  });
  return dom;
}

function deepFindStrings(obj, needles, path = '', hits = []) {
  if (obj == null) return hits;
  if (typeof obj === 'string') { for (const n of needles) if (obj.includes(n)) hits.push(`${path} = ${JSON.stringify(obj).slice(0, 60)}`); return hits; }
  if (typeof obj === 'number') { if (!isFinite(obj)) hits.push(`${path} = ${obj}`); return hits; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => deepFindStrings(v, needles, `${path}[${i}]`, hits)); return hits; }
  if (typeof obj === 'object') { for (const k of Object.keys(obj)) deepFindStrings(obj[k], needles, path ? `${path}.${k}` : k, hits); return hits; }
  return hits;
}

function checkD(D) {
  const out = [];
  deepFindStrings(D, ['undefined', 'NaN', '[object Object]'], 'D').forEach((i) => out.push('Dval: ' + i));
  // Company name must NEVER carry a TLD (the "Monzo.Com" regression — domain title-cased with its TLD).
  if (D.meta && /\.(com|co|org|net|io|ai|ae|uk|us|sa|qa|de|fr|it|es|london)\b/i.test(String(D.meta.company || ''))) out.push(`meta.company carries a TLD: "${D.meta.company}"`);
  if (D.trajectory && D.trajectory[0] && D.trajectory[0].v !== D.score) out.push(`traj[0].v ${D.trajectory[0].v} != score ${D.score}`);
  if (D.counts && (D.counts.critical + D.counts.high + D.counts.standard) !== D.counts.total) out.push(`counts don't sum: ${D.counts.critical}+${D.counts.high}+${D.counts.standard} != ${D.counts.total}`);
  if (D.competitors && (!D.competitors.rows || !D.competitors.rows[0] || !D.competitors.rows[0].you)) out.push('competitors.rows[0].you not the firm');
  if (D.geo && (!D.geo.engines || D.geo.engines.length !== 8)) out.push(`geo.engines length ${D.geo && D.geo.engines && D.geo.engines.length}`);
  if (D.seo && (!D.seo.keywords || !D.seo.keywords.length)) out.push('seo.keywords empty');
  (D.frameworks || []).forEach((f, i) => { if (!f.name || /^[A-Z_]+$/.test(f.name)) out.push(`framework[${i}].name raw code "${f.name}"`); if (f.regulator && f.regulator.length > 50) out.push(`framework[${i}].regulator too long`); });
  (D.fixes || []).forEach((f, i) => { if (!f.title) out.push(`fixes[${i}] no title`); if (!f.fix) out.push(`fixes[${i}] no fix`); });
  const dashFields = [];
  (function walk(o, p) {
    if (o == null) return;
    if (typeof o === 'string') { if (/^\s*[—–-]+\s*$/.test(o)) dashFields.push(p); return; }
    if (Array.isArray(o)) { o.forEach((v, i) => walk(v, p + '[' + i + ']')); return; }
    if (typeof o === 'object') { for (const k of Object.keys(o)) walk(o[k], p ? p + '.' + k : k); }
  })(D, '');
  const realDash = dashFields.filter((p) => !/keywords\[\d+\]\.who$/.test(p) && !/competitors\.rows\[\d+\]\.cells/.test(p));
  if (realDash.length) out.push(`dash-only value(s): ${realDash.join(', ')}`);
  return out;
}

function checkDom(doc) {
  const out = [];
  const app = doc.getElementById('app');
  if (!app || !app.innerHTML.trim()) return ['#app NOT BUILT (app.js threw)'];
  const html = app.innerHTML;
  for (const m of ['undefined', 'NaN', '[object Object]', 'undefinedpx', 'NaN%', 'width:NaN', 'null/', '/null']) if (html.includes(m)) out.push(`DOM marker "${m}"`);
  const q = (s) => app.querySelectorAll(s).length;
  const expect = [
    ['.railnav button', 6, '='], ['.pillar', 6, '='], ['.verdict', 1, '='], ['.hero-charts', 1, '='],
    ['.dimcard', 10, '='], ['.cc-node', 4, '='], ['#sec-regulatory .fwbar', 1, '>='],
    ['#sec-overview .finding', 1, '>='], ['#sec-regulatory .fw', 1, '>='],
    ['#sec-seo .issrow', 1, '>='], ['#sec-seo .seccell', 6, '>='], ['#sec-seo table tbody tr', 1, '>='],
    ['#sec-geo .engcell', 8, '='], ['#sec-geo .checkrow', 4, '>='], ['#sec-geo table tbody tr', 1, '>='],
    ['#sec-competitors table.cmp tbody tr', 2, '>='], ['#sec-competitors .bar-row', 2, '>='],
    ['#sec-plan .route1', 1, '>='], ['#sec-plan .addon', 3, '>='],
    // conversion round: Route 1 toggle (3), dual founder calendars (2), summary bullets,
    // rail socials (3), and the freemium lock present when the report is not unlocked.
    ['#sec-plan .r1-tab', 3, '='], ['#sec-plan .booking .bookcard', 2, '='],
    ['.verdict-bullets li', 3, '>='], ['.rail-social a', 3, '='], ['.vfix-dot', 0, '='],
    // r22: burgundy Route-1 anchor restored + scaling-anchor + Most-chosen + founder credential
    ['#sec-plan .r1-fixbox', 1, '>='], ['#sec-plan .fx-rib', 1, '>='], ['#sec-plan .r1-was', 1, '>='],
    ['#sec-plan .tier3.pop', 1, '='], ['.founder-cred', 1, '='],
    // r25: currency-by-region toggle (GBP/USD/EUR/AED), luxury Route-2 tiers (3 priceline + 3 CTA),
    // and every price token is a currency-aware .cmoney carrying its GBP base.
    ['#sec-plan .cur-btn', 4, '='], ['#sec-plan .tiers-lux .tl-priceline', 3, '='],
    ['#sec-plan .tiers-lux .tl-cta', 3, '='], ['#sec-plan .cmoney', 8, '>='],
    // r22 half-visible lock: at least one fix renders free (⌈N/2⌉). The locked/free split invariant is checked below.
  ];
  for (const [sel, n, op] of expect) { const c = q(sel); const ok = op === '=' ? c === n : c >= n; if (!ok) out.push(`${sel} = ${c} (expected ${op}${n})`); }
  // r22 half-visible-lock invariant: with N total Tamazia-fix values, locked = ⌊N/2⌋ and free = ⌈N/2⌉.
  // So locked must be < free always (never all-locked), free >= 1 when any fix renders, and a rich report
  // (N>=2) must lock at least one (drives Route 3). Thin reports (N<2) legitimately lock none.
  const _locked = q('.tz-lock-blur'); const _free = q('.tz-fixv') - _locked;
  if (q('.tz-fixv') > 0 && _free < 1) out.push(`half-lock: no FREE fix rendered (locked ${_locked}/${q('.tz-fixv')})`);
  if (_locked > _free) out.push(`half-lock: more locked (${_locked}) than free (${_free}) — should be ⌊N/2⌋ locked, ⌈N/2⌉ free`);
  if (q('.beatcard .tz-lock') > 0) out.push(`beat-cards must never lock (found ${q('.beatcard .tz-lock')})`);
  app.querySelectorAll('.num, .val, .v, .cmpv, .kpi .v, .sbg').forEach((el) => {
    const t = (el.textContent || '').trim();
    if (t === '' || /NaN|undefined/.test(t)) out.push(`empty/NaN value node <${el.className}>: "${t}"`);
  });
  app.querySelectorAll('[style*="width:"]').forEach((el) => { const m = (el.getAttribute('style') || '').match(/width:\s*([^;]+)/); if (m && /NaN|undefined/.test(m[1])) out.push(`bad width "${m[1]}"`); });
  return out;
}

const files = readdirSync(FIX).filter((f) => f.endsWith('.json'));
let total = 0;
for (const f of files) {
  const key = f.replace('.json', '');
  let issues = [];
  try {
    const payload = JSON.parse(readFileSync(join(FIX, f), 'utf8'));
    const company = (payload._matrix && payload._matrix.company) || NAME[key] || null;
    const D = payloadToD(payload, { company, now: Date.parse('2026-06-05T00:00:00Z') });
    issues = issues.concat(checkD(D).map((i) => 'D: ' + i));
    const dom = renderDom(D);
    issues = issues.concat(checkDom(dom.window.document).map((i) => 'R: ' + i));
    dom.window.close();
  } catch (e) { issues.push('THREW: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); }
  total += issues.length;
  if (issues.length) { console.log(`\n### ${key} — ${issues.length} issue(s)`); issues.forEach((i) => console.log('   - ' + i)); }
  else console.log(`OK  ${key} — clean`);
}
console.log(`\n==== ${total} total issues across ${files.length} fixtures ====`);
process.exit(total ? 1 : 0);
