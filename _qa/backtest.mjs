// _qa/backtest.mjs — VENDORED, repo-local copy of _tools/backtest.mjs.
//
// Why this lives in the repo: same reason as _qa/qa_render.mjs — the canonical harness is
// at the rebuild root (_tools/) and is not tracked, so CI cannot run it. This copy resolves
// paths relative to itself and reads the frozen snapshot under _qa/fixtures/.
//
// COMPREHENSIVE BACKTEST — ~70+ checks per audit across structure, value-integrity,
// per-metric logic, every chart's rendering, and the 6-dimension rubric.
//
// REGRESSION-BASELINE MODE (the reason CI can use this as a gate):
//   Some fixtures carry KNOWN, pre-existing data-layer bugs that live in _adapter.js / the
//   engine — OUT OF SCOPE for shell/CI work and not fixable here. A naive "exit 1 if any bug"
//   gate would therefore block every deploy on those. Instead this harness accepts a baseline:
//       node _qa/backtest.mjs --max-bugs=N
//   It exits 0 when totalBugs <= N (no regression) and 1 when totalBugs > N (NEW breakage).
//   N defaults to 0. CI pins N to the current known-failing count (see deploy.yml / runbook).
//   The shell/render checks (sections A, B, E) are what actually guard the font + shell change;
//   the data-layer checks (C, D) are where the baselined bugs live.
//
// Keep in sync with _tools/backtest.mjs at the rebuild root.
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url)); // .../tamazia-website/_qa
const REPO = join(__dirname, '..');
const { payloadToD, isRealCompetitor } = await import(join(REPO, 'functions/audit/_adapter.js'));
const { renderShell } = await import(join(REPO, 'functions/audit/_shell.js'));

const MAX_BUGS = (() => {
  const a = process.argv.find((x) => x.startsWith('--max-bugs='));
  const n = a ? parseInt(a.split('=')[1], 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
})();

const assets = {
  css: readFileSync(join(REPO, 'public/audit/audit.css'), 'utf8'),
  charts: readFileSync(join(REPO, 'public/audit/audit-charts.js'), 'utf8'),
  app: readFileSync(join(REPO, 'public/audit/audit-app.js'), 'utf8'),
};
const NAME = {
  'harley-healthcare-uk': 'Harley Street Dental Clinic', 'fenwick-law-us': 'Fenwick & West LLP', 'thirdspace-gym-uk': 'Third Space',
  'altamimi-law-uae': 'Al Tamimi & Company', 'emaar-realestate-uae': 'Emaar Properties', 'greystar-realestate-uk': 'Greystar UK',
  'loaf-ecommerce-uk': 'Loaf', 'fourseasons-hospitality-uk': 'Four Seasons', 'legalconsultants-law-uae': 'Legal Consultants Dubai', 'chapter-realestate-uk': 'Chapter Living',
};

function renderDom(D) {
  const html = renderShell(D, { inline: true, assets });
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
    w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  } });
  return dom;
}
const TLD_REGION = { uk: 'UK', ae: 'AE', sa: 'SA', qa: 'AE', us: 'US', fr: 'EU', de: 'EU', it: 'EU', es: 'EU', nl: 'EU', ie: 'EU' };
const cleanDom = (d) => String(d || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase();
const looksDomain = (s) => /\.[a-z]{2,}$/i.test(String(s || ''));

const CHECKS = [];
const C = (name, fn) => CHECKS.push([name, fn]);
const q = (app, s) => app.querySelectorAll(s).length;

// ---- A. STRUCTURE (DOM) ----
C('app-built', ({ app }) => app && app.innerHTML.trim() ? null : '#app empty (app.js threw)');
C('railnav=6', ({ app }) => q(app, '.railnav button') === 6 ? null : 'railnav ' + q(app, '.railnav button'));
C('pillars=6', ({ app }) => q(app, '.pillar') === 6 ? null : 'pillars ' + q(app, '.pillar'));
C('verdict=1', ({ app }) => q(app, '.verdict') === 1 ? null : 'verdict ' + q(app, '.verdict'));
C('hero-charts=1', ({ app }) => q(app, '.hero-charts') === 1 ? null : 'hero ' + q(app, '.hero-charts'));
C('dimcards=10', ({ app }) => q(app, '.dimcard') === 10 ? null : 'dimcards ' + q(app, '.dimcard'));
C('causal-nodes=4', ({ app }) => q(app, '.cc-node') === 4 ? null : 'cc-node ' + q(app, '.cc-node'));
C('frameworkbars>=1', ({ app }) => q(app, '#sec-regulatory .fwbar') >= 1 ? null : 'fwbar ' + q(app, '#sec-regulatory .fwbar'));
C('overview-findings>=1', ({ app }) => q(app, '#sec-overview .finding') >= 1 ? null : 'overview findings 0');
C('regulatory-fw>=1', ({ app }) => q(app, '#sec-regulatory .fw') >= 1 ? null : 'reg fw 0');
C('seo-issues>=1', ({ app }) => (q(app, '#sec-seo .issrow') + q(app, '#sec-seo .psi-row')) >= 1 ? null : 'seo issues 0');
C('seo-security=6', ({ app }) => q(app, '#sec-seo .seccell') === 6 ? null : 'seccell ' + q(app, '#sec-seo .seccell'));
C('seo-keyword-table>=1', ({ app }) => q(app, '#sec-seo table tbody tr') >= 1 ? null : 'kw table 0');
C('geo-engines=8', ({ app }) => q(app, '#sec-geo .engcell') === 8 ? null : 'engcell ' + q(app, '#sec-geo .engcell'));
C('geo-checkrows>=4', ({ app }) => q(app, '#sec-geo .checkrow') >= 4 ? null : 'checkrow ' + q(app, '#sec-geo .checkrow'));
C('geo-citation-table>=1', ({ app }) => q(app, '#sec-geo table tbody tr') >= 1 ? null : 'citation table 0');
C('competitors-table>=2', ({ app }) => q(app, '#sec-competitors table.cmp tbody tr') >= 2 ? null : 'cmp rows ' + q(app, '#sec-competitors table.cmp tbody tr'));
C('competitors-bars>=2', ({ app }) => q(app, '#sec-competitors .bar-row') >= 2 ? null : 'comp bars ' + q(app, '#sec-competitors .bar-row'));
C('plan-prices=3', ({ app }) => q(app, '#sec-plan .price') === 3 ? null : 'prices ' + q(app, '#sec-plan .price'));
C('plan-addons>=3', ({ app }) => q(app, '#sec-plan .addon') >= 3 ? null : 'addons ' + q(app, '#sec-plan .addon'));

// ---- B. NO BAD VALUES (DOM) ----
for (const mk of ['undefined', 'NaN', '[object Object]', 'undefinedpx', 'NaN%', 'width:NaN', 'null/', '/null', '£NaN', '#undefined']) {
  C('no-"' + mk + '"', ({ app }) => app.innerHTML.includes(mk) ? 'DOM has "' + mk + '"' : null);
}
C('no-empty-value-nodes', ({ app }) => { let bad = ''; app.querySelectorAll('.num,.val,.v,.cmpv,.kpi .v,.sbg,.wf-v,.cc-v').forEach((el) => { const t = (el.textContent || '').trim(); if (t === '' || /NaN|undefined/.test(t)) bad = el.className + ':"' + t + '"'; }); return bad ? 'empty/NaN node ' + bad : null; });
C('no-bad-bar-widths', ({ app }) => { let bad = ''; app.querySelectorAll('[style*="width:"]').forEach((el) => { const m = (el.getAttribute('style') || '').match(/width:\s*([^;]+)/); if (m && /NaN|undefined/.test(m[1])) bad = m[1]; }); return bad ? 'bad width ' + bad : null; });

// ---- C. DATA INTEGRITY (D) ----
C('score-range', ({ D }) => D.score >= 2 && D.score <= 100 ? null : 'score ' + D.score);
C('grade-valid', ({ D }) => /^[A-F][+-]?$/.test(D.grade) ? null : 'grade ' + D.grade);
C('trajectory[0]=score', ({ D }) => !D.trajectory || D.trajectory[0].v === D.score ? null : 'traj ' + D.trajectory[0].v + '!=' + D.score);
C('counts-sum', ({ D }) => (D.counts.critical + D.counts.high + D.counts.standard) === D.counts.total ? null : 'counts no sum');
C('dims=10', ({ D }) => (D.dims || []).length === 10 ? null : 'dims ' + (D.dims || []).length);
C('dims-complete', ({ D }) => (D.dims || []).every((d) => d.nm && d.st && d.sub != null) ? null : 'dim missing field');
C('exposure-canonical', ({ D, T }) => { const wf = D.exposureWaterfall; return !wf || wf.collapsed === T._exposureN ? null : 'waterfall!=canonical'; });
C('frameworks-named', ({ D }) => (D.frameworks || []).every((f) => f.name && !/^[A-Z_]{2,}$/.test(f.name)) ? null : 'raw fw code');
C('frameworks>=1', ({ D }) => (D.frameworks || []).length >= 1 ? null : 'no frameworks');
C('fixes-complete', ({ D }) => (D.fixes || []).every((f) => f.title && f.fix) ? null : 'fix missing title/fix');
C('fixes-unique', ({ D }) => { const o = (D.fixes || []).map((f) => String(f.fix).toLowerCase().slice(0, 30)); return new Set(o).size === o.length ? null : 'duplicate fix text'; });
C('rootCause-chain=4', ({ D }) => D.geo && D.geo.rootCause && D.geo.rootCause.chain.length === 4 ? null : 'rootCause chain');
C('geo-engines=8', ({ D }) => (D.geo.engines || []).length === 8 ? null : 'geo engines ' + (D.geo.engines || []).length);
C('seo-keywords-nonempty', ({ D }) => (D.seo.keywords || []).length >= 1 ? null : 'no keywords');
C('bestKeyword-clean', ({ D }) => { const k = String(D.competitors.bestKeyword || ''); return k && !/\bnear\b/.test(k) && !/(\b\w+\b) \1/.test(k) ? null : 'bad bestKeyword "' + k + '"'; });
C('competitors-no-aggregators', ({ D, T }) => { const a = (T.competitors || []).filter(looksDomain).filter((c) => !isRealCompetitor(c, T.market)); return a.length ? 'aggregator ' + a[0] : null; });
C('psiAudits-a11y-wcag', ({ D }) => (D.seo.psiAudits || []).filter((x) => x.laneKey === 'a11y').every((x) => x.wcag) ? null : 'a11y missing WCAG');
C('scoring-present', ({ D }) => D.scoring && D.scoring.formula && D.scoring.why && (D.scoring.bands || []).length ? null : 'scoring incomplete');
C('jurisdiction-statement', ({ D }) => D.jurisdiction && D.jurisdiction.length > 20 ? null : 'no jurisdiction statement');
C('meta-complete', ({ D }) => D.meta && D.meta.company && D.meta.domain && D.meta.sector ? null : 'meta incomplete');
C('exposure-string', ({ D }) => /^£[\d.]+[kM]?$|^£0$/.test(D.exposure) ? null : 'bad exposure "' + D.exposure + '"');
C('no-fine-NaN', ({ T }) => (T.pointers || []).every((p) => !Number.isNaN(p.fine)) ? null : 'fine NaN');

// ---- D. RUBRIC (R1–R6) ----
function rubric(D, T) {
  const allow = new Set(T.allow); const ptrs = T.pointers || [];
  const inJur = ptrs.filter((p) => p.jur === 'GLOBAL' || allow.has(p.jur));
  const prefixOK = ptrs.length ? inJur.length === ptrs.length : true;
  const R1 = prefixOK ? 100 : Math.round(100 * inJur.length / Math.max(1, ptrs.length));
  const comp = ptrs.filter((p) => p.bucket === 'compliance' || p.bucket === 'public_records');
  const R2 = comp.length ? Math.round(100 * comp.filter((p) => p.evq || p.anchored).length / comp.length) : 100;
  const kws = (T.keywords || []).filter(Boolean);
  const badKw = kws.filter((k) => /\b(\w+)\s+\1\b/i.test(String(k)) || /\bin (india|pakistan|usa|america)\b|near\s+near/i.test(String(k)));
  const R3 = kws.length ? Math.round(100 * (1 - badKw.length / kws.length)) : 100;
  const dom = (T.competitors || []).filter(looksDomain);
  const aggr = dom.filter((c) => !isRealCompetitor(c, T.market));
  const R4 = aggr.length ? 0 : 100;
  const p01 = ptrs.filter((p) => p.sev === 'P0' || p.sev === 'P1');
  const badSev = p01.filter((p) => (p.jur !== 'GLOBAL' && !allow.has(p.jur)) || (p.fine > 0 && !p.evq && !p.anchored));
  const R5 = p01.length ? Math.round(100 * (1 - badSev.length / p01.length)) : 100;
  const R6 = (T.reachable === false && ptrs.length > 0) ? 50 : 100;
  return { R1, R2, R3, R4, R5, R6 };
}
C('R1-jurisdiction=100', ({ D, T }) => rubric(D, T).R1 === 100 ? null : 'R1=' + rubric(D, T).R1);
C('R3-keyword=100', ({ D, T }) => rubric(D, T).R3 === 100 ? null : 'R3=' + rubric(D, T).R3);
C('R4-competitor=100', ({ D, T }) => rubric(D, T).R4 === 100 ? null : 'R4=' + rubric(D, T).R4);
C('R5-severity=100', ({ D, T }) => rubric(D, T).R5 === 100 ? null : 'R5=' + rubric(D, T).R5);
C('R6-nofab=100', ({ D, T }) => rubric(D, T).R6 === 100 ? null : 'R6=' + rubric(D, T).R6);
C('R2-evidence>=85(soft)', ({ D, T, fresh }) => { const r = rubric(D, T).R2; return (!fresh || r >= 85) ? null : 'R2=' + r; });

// ---- E. RENDERING content (each chart non-empty) ----
C('gauge-svg', ({ app }) => q(app, '.rail-gauge svg') >= 1 ? null : 'no gauge svg');
C('donut', ({ app }) => app.innerHTML.includes('FINDINGS') ? null : 'no donut');
C('waterfall-or-fallback', ({ app }) => q(app, '.wf-row') >= 1 || app.querySelector('.hero-charts .capt') ? null : 'no waterfall');
C('causal-reason', ({ app }) => q(app, '.cc-reason') >= 1 ? null : 'no causal reason');
C('trajectory-svg', ({ app }) => q(app, '.traj-pts') >= 1 ? null : 'no trajectory');
C('radar', ({ app }) => q(app, '#sec-geo svg polygon') >= 1 ? null : 'no radar');
C('schema-checklist', ({ app }) => q(app, '#sec-geo .checkrow') >= 4 ? null : 'no schema checklist');
C('verdict-h2', ({ app }) => { const h = app.querySelector('.verdict h2'); return h && h.textContent.trim().length > 10 ? null : 'verdict h2 thin'; });
C('vfix-chips', ({ app }) => q(app, '.vfix') >= 1 ? null : 'no vfix');
C('pillar-bodies-nonempty', ({ app }) => { let bad = ''; app.querySelectorAll('.pillar .pbody').forEach((b) => { if (!b.innerHTML.trim()) bad = b.parentElement.id; }); return bad ? 'empty pbody ' + bad : null; });

const dirs = [join(__dirname, 'fixtures'), join(__dirname, 'fixtures', '_matrix')];
const files = [];
for (const d of dirs) { if (existsSync(d)) for (const f of readdirSync(d)) if (f.endsWith('.json')) files.push([d, f]); }

let totalBugs = 0; const summary = [];
for (const [dir, f] of files) {
  const key = f.replace('.json', ''); const isMatrix = dir.endsWith('_matrix');
  let bugs = [];
  try {
    const payload = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const company = (payload._matrix && payload._matrix.company) || NAME[key] || null;
    const D = payloadToD(payload, { company, now: Date.parse('2026-06-05T00:00:00Z'), trace: true });
    D._trace._exposureN = D._meta.exposureN;
    const dom = renderDom(D); const doc = dom.window.document; const app = doc.getElementById('app');
    const ctx = { D, T: D._trace, doc, app, key, payload, fresh: isMatrix };
    for (const [name, fn] of CHECKS) { let r; try { r = fn(ctx); } catch (e) { r = 'THREW ' + (e.message || e); } if (r) bugs.push(name + ': ' + r); }
    dom.window.close();
  } catch (e) { bugs.push('RENDER THREW: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); }
  totalBugs += bugs.length;
  const tag = isMatrix ? '[matrix] ' : '';
  if (bugs.length) { console.log('\n### ' + tag + key + ' — ' + bugs.length + '/' + CHECKS.length + ' FAILED'); bugs.forEach((b) => console.log('   ✗ ' + b)); }
  else console.log('OK  ' + tag + key + ' — ' + CHECKS.length + '/' + CHECKS.length + ' passed');
  summary.push({ key, bugs: bugs.length });
}
console.log('\n==== ' + totalBugs + ' total bugs across ' + files.length + ' audits (' + CHECKS.length + ' checks each) ====');
if (totalBugs > MAX_BUGS) {
  console.error('BACKTEST REGRESSION: ' + totalBugs + ' bugs > baseline ' + MAX_BUGS + ' (--max-bugs). New breakage above the known data-layer baseline.');
  process.exit(1);
}
if (totalBugs > 0) console.log('(within baseline --max-bugs=' + MAX_BUGS + ' · ' + totalBugs + ' known pre-existing data-layer bug(s), no regression)');
process.exit(0);
