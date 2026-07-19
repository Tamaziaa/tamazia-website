// _qa/qa_lux.mjs · render gate for the LUX (contract-v1.1) path.
//
// Mirrors _qa/qa_render.mjs's jsdom harness, but exercises the NEW versioned path:
// renderLuxShell(golden) + audit-lux.js executed against jsdom. It asserts the honesty
// contract on the real golden (a v1.1 payload the engine minted live):
//   (a) the B1 band prints P.exposure.value with P.exposure.label, and NEVER a ceiling /
//       statutory-max / with-review figure as the headline (C-094/C-096)
//   (b) the P.notLegalAdvice sentence is present verbatim (C-200)
//   (c) each waterfall step renders with its state class, and needs_review steps carry the
//       hatched class and sit outside the confident subtotal (Rule 10 / C-111)
//   (d) the counts line matches the payload counts
//   (e) ZERO fabrication: every monetary amount and every framework/regulator/family name in
//       the DOM traces to a field in the payload JSON (Rule 2). Array-length-derived counts a
//       coverage_proof card prints (pages_checked/searched_patterns) are declared, not invented.
//   (f) a legacy fixture (no findings[]) routes legacy, i.e. isV11() is false for it, and true
//       for the golden
//   (g) B2: one law card per finding, each with an evidence column and an action column
//   (h) the dom_node violation card shows its selector + clipped snippet and the "captured" lead-in
//   (i) the coverage_proof needs_review card shows the observation lead-in, the pages/patterns
//       counts, and the withheld-figure line
//   (j) ZERO GBP amounts on any needs_review card (C-111: every figure withheld until confirmed)
//   (k) B3: the rail prints the three honest numbers verbatim, screenedLabel, notLegalAdvice, a
//       reading-progress bar, three jump links, and exactly ONE calm mailto CTA
//   (l) NO manufactured scarcity anywhere in the report (DMCCA / C-200)
//
// The golden lives at _qa/fixtures/v11/ deliberately: qa_render.mjs and backtest.mjs scan only
// _qa/fixtures/ and _qa/fixtures/_matrix/ and would force a v1.1 payload through the LEGACY
// renderer (which cannot render its not_probed SEO/GEO scaffold) and go red. The v11/ subdir keeps
// both legacy harnesses green while this harness reads the golden directly (see the PR summary).
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url)); // .../tamazia-website/_qa
const REPO = join(__dirname, '..');
const { renderLuxShell, isV11 } = await import(join(REPO, 'functions/audit/_lux.js'));

const assets = {
  css: readFileSync(join(REPO, 'public/audit/audit-lux.css'), 'utf8'),
  app: readFileSync(join(REPO, 'public/audit/audit-lux.js'), 'utf8'),
};

const GOLDEN_PATH = join(__dirname, 'fixtures', 'v11', 'lomond-realestate-uk-v11.json');
const LEGACY_PATH = join(__dirname, 'fixtures', 'greystar-realestate-uk.json');
const goldenText = readFileSync(GOLDEN_PATH, 'utf8');
const payload = JSON.parse(goldenText);
const legacyPayload = JSON.parse(readFileSync(LEGACY_PATH, 'utf8'));

function renderDom(p) {
  const html = renderLuxShell(p, { inline: true, assets });
  return new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} };
      w.scrollTo = () => {};
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    },
  });
}

// maximal digit-runs (commas stripped) present in a string
function digitRuns(s) {
  const out = new Set();
  const re = /\d[\d,]*/g; let m;
  while ((m = re.exec(String(s))) !== null) out.add(m[0].replace(/,/g, ''));
  return out;
}
const norm = (s) => String(s == null ? '' : s).trim();

// --- CSS media-query evaluator ----------------------------------------------------------------
// jsdom applies no layout and stubs matchMedia to always-false, so the viewport visibility of the
// two not-legal-advice copies (bottom .lux-nla, rail .lux-rail-nla) cannot be read from the DOM. It
// is instead proven directly from the stylesheet: parse the top-level @media blocks, then for a
// given selector + width decide whether a matching block declares display:none for it.
function cssMediaBlocks(css) {
  const blocks = [];
  const n = css.length;
  let i = 0;
  while (i < n) {
    const at = css.indexOf('@media', i);
    if (at === -1) break;
    const open = css.indexOf('{', at);
    if (open === -1) break;
    const cond = css.slice(at + 6, open);
    let depth = 0, j = open;
    for (; j < n; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (depth === 0) { j++; break; } }
    }
    blocks.push({ cond, body: css.slice(open + 1, j - 1) });
    i = j;
  }
  return blocks;
}
function cssMediaMatches(cond, width) {
  const mn = cond.match(/min-width:\s*(\d+)px/);
  const mx = cond.match(/max-width:\s*(\d+)px/);
  if (mn && width < Number(mn[1])) return false;
  if (mx && width > Number(mx[1])) return false;
  return true;
}
// Hidden by a matching @media display:none rule for `sel` at viewport `width`. Neither NLA selector
// carries a base display rule and nothing un-hides them, so a single matching display:none decides.
// The leading (?:^|[},]) anchor stops `.lux-nla` matching inside `.lux-rail-nla`.
function nlaHiddenAt(css, sel, width) {
  const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp('(?:^|[},])\\s*' + escaped + '\\s*\\{([^}]*)\\}');
  for (const b of cssMediaBlocks(css)) {
    if (!cssMediaMatches(b.cond, width)) continue;
    const m = rule.exec(b.body);
    if (m && /display\s*:\s*none/.test(m[1])) return true;
  }
  return false;
}

const issues = [];
const fail = (label, detail) => issues.push(label + (detail ? ' · ' + detail : ''));

const dom = renderDom(payload);
const doc = dom.window.document;
const app = doc.getElementById('app');

if (!app || !app.innerHTML.trim()) {
  fail('#app NOT BUILT (audit-lux.js threw or produced nothing)');
} else {
  const appText = app.textContent || '';
  const q = (s) => app.querySelector(s);
  const qa = (s) => Array.from(app.querySelectorAll(s));

  // ---- (a) B1 verdict band: exposure headline is exposure.value + label, never a ceiling ----
  (function () {
    const v = q('.lux-band .lux-expo .v');
    const l = q('.lux-band .lux-expo .l');
    if (!v) return fail('(a) no exposure headline .lux-band .lux-expo .v');
    const headlineDigits = [...digitRuns(v.textContent)];
    const wantVal = String(payload.exposure && payload.exposure.value);
    if (!headlineDigits.includes(wantVal)) fail('(a) headline does not show exposure.value', `got ${JSON.stringify(v.textContent)}, want ${wantVal}`);
    if (!l || !norm(l.textContent).includes(norm(payload.exposure && payload.exposure.label))) fail('(a) exposure.label not shown beside headline', norm(l && l.textContent));
    // the headline must not be any forbidden figure (ceiling / statutory max / with-review total)
    const forbidden = new Set();
    const wf = payload.exposureWaterfall || {};
    if (wf.ceiling && wf.ceiling.value != null) forbidden.add(String(wf.ceiling.value));
    (wf.steps || []).forEach((s) => { if (s.familyCeiling != null) forbidden.add(String(s.familyCeiling)); });
    (payload.findings || []).forEach((f) => { if (f.penalty && f.penalty.statutory_max != null) forbidden.add(String(f.penalty.statutory_max)); });
    if (payload.exposureFull && payload.exposureFull.value != null) forbidden.add(String(payload.exposureFull.value));
    for (const d of headlineDigits) if (forbidden.has(d)) fail('(a) headline shows a FORBIDDEN figure (ceiling/max/full)', d);
  })();

  // ---- (b) not-legal-advice sentence present verbatim ----
  (function () {
    const nla = norm(payload.notLegalAdvice);
    if (!nla) return fail('(b) payload has no notLegalAdvice string');
    if (!appText.includes(nla)) fail('(b) notLegalAdvice not present verbatim');
    const el = q('.lux-nla');
    if (!el || !norm(el.textContent).includes(nla)) fail('(b) notLegalAdvice not in the pinned .lux-nla element');
  })();

  // ---- (c) waterfall steps carry state class; needs_review carry hatched + are separated ----
  (function () {
    const steps = (payload.exposureWaterfall && payload.exposureWaterfall.steps) || [];
    if (!steps.length) return; // empty-state path is exercised separately below
    const wantViol = steps.filter((s) => s.state === 'violation').length;
    const wantRev = steps.filter((s) => s.state === 'needs_review').length;
    const gotViol = qa('.lux-wf-step--violation').length;
    const gotRev = qa('.lux-wf-step--needs_review').length;
    if (gotViol !== wantViol) fail('(c) violation step count', `dom ${gotViol} vs payload ${wantViol}`);
    if (gotRev !== wantRev) fail('(c) needs_review step count', `dom ${gotRev} vs payload ${wantRev}`);
    // every needs_review step's bar is hatched; no violation step is hatched
    const revHatch = qa('.lux-wf-step--needs_review .lux-wf-hatch').length;
    if (revHatch !== wantRev) fail('(c) needs_review steps missing hatched bar', `${revHatch}/${wantRev}`);
    if (qa('.lux-wf-step--violation .lux-wf-hatch').length !== 0) fail('(c) a violation step is hatched (must be solid)');
    // the under-review zone is a distinct block from the confident zone (outside the confident total)
    if (wantRev > 0 && !q('.lux-wf-zone.z-review')) fail('(c) no under-review zone separating needs_review from the confident subtotal');
    // every step family is direct-labelled
    if (qa('.lux-wf-family').length !== steps.length) fail('(c) family label count', `${qa('.lux-wf-family').length}/${steps.length}`);
  })();

  // ---- (d) counts line matches payload counts ----
  (function () {
    const counts = payload.counts || {};
    const findings = payload.findings || [];
    const nViol = findings.filter((f) => f.state === 'violation').length;
    const nRev = findings.filter((f) => f.state === 'needs_review').length;
    const chip = (sel) => { const e = q(sel + ' b'); return e ? norm(e.textContent) : null; };
    const total = chip('.lux-c-total');
    if (total !== String(counts.total)) fail('(d) total chip', `${total} vs counts.total ${counts.total}`);
    if (chip('.lux-c-confirmed') !== String(nViol)) fail('(d) confirmed chip', `${chip('.lux-c-confirmed')} vs ${nViol}`);
    if (chip('.lux-c-review') !== String(nRev)) fail('(d) review chip', `${chip('.lux-c-review')} vs ${nRev}`);
    if (payload.frameworksAssessed != null && chip('.lux-c-assessed') !== String(payload.frameworksAssessed)) fail('(d) assessed chip', chip('.lux-c-assessed'));
    if (payload.frameworksBinding != null && chip('.lux-c-binding') !== String(payload.frameworksBinding)) fail('(d) binding chip', chip('.lux-c-binding'));
    if (payload.rulesChecked != null && chip('.lux-c-rules') !== String(payload.rulesChecked)) fail('(d) rules chip', chip('.lux-c-rules'));
    // the count line must be consistent with the findings array itself
    if (counts.total !== findings.length) fail('(d) counts.total disagrees with findings.length', `${counts.total} vs ${findings.length}`);
  })();

  // ---- (e) zero fabrication: every DOM amount + name traces to the payload JSON ----
  (function () {
    const payloadDigits = digitRuns(goldenText);
    // Counts we legitimately DERIVE from payload arrays (their .length) are not fabrication: a
    // coverage_proof card prints pages_checked.length and searched_patterns.length. Declare them so
    // the zero-fabrication trace still catches genuinely invented figures (e.g. a made-up fine).
    (payload.findings || []).forEach((f) => {
      const a = f && f.artifact;
      if (a && a.type === 'coverage_proof') {
        payloadDigits.add(String((a.pages_checked || []).length));
        payloadDigits.add(String((a.searched_patterns || []).length));
      }
    });
    const domDigits = digitRuns(appText);
    for (const d of domDigits) {
      if (!payloadDigits.has(d)) fail('(e) DOM number NOT in payload (possible fabricated figure)', d);
    }
    // framework / regulator / family names must be verbatim substrings of the payload
    for (const sel of ['.lux-fw-name', '.lux-reg-name', '.lux-wf-family']) {
      for (const el of qa(sel)) {
        const t = norm(el.textContent);
        if (t && !goldenText.includes(t)) fail('(e) name NOT in payload (' + sel + ')', JSON.stringify(t).slice(0, 80));
      }
    }
  })();

  // ---- (g) B2 · one law card per finding, each with an evidence column and an action column ----
  (function () {
    const findings = payload.findings || [];
    const cards = qa('.lux-card');
    if (cards.length !== findings.length) fail('(g) card count', `${cards.length} vs findings ${findings.length}`);
    const wantViol = findings.filter((f) => f.state === 'violation').length;
    const wantRev = findings.filter((f) => f.state === 'needs_review').length;
    if (qa('.lux-card--violation').length !== wantViol) fail('(g) violation card count', `${qa('.lux-card--violation').length} vs ${wantViol}`);
    if (qa('.lux-card--needs_review').length !== wantRev) fail('(g) needs_review card count', `${qa('.lux-card--needs_review').length} vs ${wantRev}`);
    for (const c of cards) {
      if (!c.querySelector('.lux-card-ev')) fail('(g) a card is missing its evidence column');
      if (!c.querySelector('.lux-card-ac')) fail('(g) a card is missing its action column');
      if (!c.querySelector('.lux-fw-name')) fail('(g) a card is missing its framework name');
    }
  })();

  // ---- (h) the dom_node violation card shows selector + clipped snippet as its evidence ----
  (function () {
    const dn = (payload.findings || []).find((f) => f.state === 'violation' && f.artifact && f.artifact.type === 'dom_node');
    if (!dn) return;
    const card = qa('.lux-card--violation').find((c) => c.querySelector('.lux-ev-selector'));
    if (!card) return fail('(h) no violation card carries a dom_node selector');
    const sel = card.querySelector('.lux-ev-selector');
    if (!sel || norm(sel.textContent) !== norm(dn.artifact.selector)) fail('(h) dom_node selector not shown verbatim', norm(sel && sel.textContent));
    const snip = card.querySelector('.lux-ev-snippet');
    if (!snip || !norm(snip.textContent) || norm(snip.textContent).replace(/…$/, '') !== norm(dn.artifact.snippet).slice(0, 240)) {
      fail('(h) dom_node snippet not shown as evidence', norm(snip && snip.textContent).slice(0, 60));
    }
    if (!/we captured the following:/.test(norm(card.querySelector('.lux-card-ev').textContent))) fail('(h) violation "captured" observation lead-in missing');
  })();

  // ---- (i) the coverage_proof needs_review card shows the observation lead-in + counts + withheld line ----
  (function () {
    const cov = (payload.findings || []).find((f) => f.state === 'needs_review' && f.artifact && f.artifact.type === 'coverage_proof');
    if (!cov) return;
    const card = qa('.lux-card--needs_review').find((c) => c.querySelector('.lux-ev-coverage'));
    if (!card) return fail('(i) no needs_review card carries a coverage_proof');
    const t = norm(card.textContent);
    if (!/From the pages we could read, we detected the following, which needs your confirmation:/.test(t)) fail('(i) needs_review observation lead-in missing');
    if (!/Figure withheld until confirmed/.test(t)) fail('(i) withheld-figure line missing on the needs_review card');
    const covText = norm(card.querySelector('.lux-ev-coverage').textContent);
    const nPages = String((cov.artifact.pages_checked || []).length);
    const nPat = String((cov.artifact.searched_patterns || []).length);
    if (!covText.includes(nPages)) fail('(i) pages-checked count not shown', nPages);
    if (!covText.includes(nPat)) fail('(i) searched-patterns count not shown', nPat);
  })();

  // ---- (j) ZERO GBP amounts on ANY needs_review card (C-111: every figure withheld until confirmed) ----
  (function () {
    const revCards = qa('.lux-card--needs_review');
    if (!revCards.length) return;
    for (const card of revCards) {
      const t = card.textContent || '';
      if (/£/.test(t)) fail('(j) a needs_review card shows a £ amount', norm(t).slice(0, 60));
      if (/\bGBP\b/.test(t)) fail('(j) a needs_review card shows a GBP amount', norm(t).slice(0, 60));
      if (!/Figure withheld until confirmed/.test(t)) fail('(j) a needs_review card is missing the withheld-figure line');
    }
  })();

  // ---- (k) B3 · the left rail: three honest numbers verbatim, screenedLabel, notLegalAdvice, one calm CTA ----
  (function () {
    const rail = doc.querySelector('.lux-rail');
    if (!rail) return fail('(k) no left rail rendered');
    const rt = norm(rail.textContent);
    for (const [field, val] of [['frameworksAssessed', payload.frameworksAssessed], ['frameworksBinding', payload.frameworksBinding], ['rulesChecked', payload.rulesChecked]]) {
      if (val != null && !rt.includes(String(val))) fail('(k) rail missing verbatim count ' + field, String(val));
    }
    if (payload.screenedLabel && !rt.includes(norm(payload.screenedLabel))) fail('(k) rail missing screenedLabel verbatim');
    if (payload.notLegalAdvice && !rt.includes(norm(payload.notLegalAdvice))) fail('(k) rail missing notLegalAdvice verbatim');
    if (!rail.querySelector('.lux-rail-progress[role="progressbar"]')) fail('(k) rail missing the reading-progress bar');
    const ctas = Array.from(rail.querySelectorAll('.lux-rail-cta'));
    if (ctas.length !== 1) return fail('(k) rail must have exactly one CTA', String(ctas.length));
    const href = ctas[0].getAttribute('href') || '';
    if (!/^mailto:hello@tamazia\.co\.uk/.test(href)) fail('(k) CTA is not the calm mailto', href.slice(0, 40));
    if (/£|\bGBP\b|\$|\bfree\b|\d+\s*%/i.test(ctas[0].textContent || '')) fail('(k) CTA text carries a price/discount');
    for (const id of ['#lux-verdict', '#lux-exposure', '#lux-findings']) {
      if (!rail.querySelector('.lux-rail-link[href="' + id + '"]')) fail('(k) rail missing jump link ' + id);
    }
  })();

  // ---- (l) NO manufactured scarcity anywhere in the report (DMCCA / C-200). "Only send electronic
  //          marketing" (a payload obligation) is NOT scarcity: the patterns require a number or a
  //          named scarcity phrase, so a bare "only" does not trip them. ----
  (function () {
    const t = appText;
    const scarcity = [
      /\bspots?\s+left\b/i, /\bonly\s+\d+\s+(?:left|remaining|spots?|places?|seats?)\b/i,
      /\b\d+\s+(?:spots?|places?|seats?)\s+(?:left|remaining)\b/i,
      /\bexpires?\s+(?:in|soon|today|tonight)\b/i, /\bcountdown\b/i, /\bact\s+now\b/i,
      /\blast\s+chance\b/i, /\blimited\s+time\b/i, /\bhurry\b/i, /\bwhile\s+stocks?\s+last\b/i,
      /\bending\s+soon\b/i, /\b\d+\s*(?:hours?|days?|minutes?)\s+(?:left|remaining)\b/i,
    ];
    for (const re of scarcity) if (re.test(t)) fail('(l) manufactured-scarcity pattern present', String(re));
  })();

  // ---- (m) the not-legal-advice standing line is pinned on EVERY screen (C-200) and NEVER duplicated.
  //          Two copies exist in the DOM (bottom .lux-nla, rail .lux-rail-nla); the stylesheet must
  //          leave EXACTLY ONE visible at every viewport width. Proven from the CSS because jsdom
  //          applies no media/layout. This proves both directions: never zero (pinned everywhere),
  //          never two (no duplicate) -- and that each copy is genuinely hidden on its off-viewport. ----
  (function () {
    const nla = norm(payload.notLegalAdvice);
    if (!nla) return fail('(m) payload has no notLegalAdvice string to pin');
    const bottom = q('.lux-nla');
    const railNla = doc.querySelector('.lux-rail-nla');
    if (!bottom || !norm(bottom.textContent).includes(nla)) fail('(m) bottom .lux-nla copy missing or not verbatim');
    if (!railNla || !norm(railNla.textContent).includes(nla)) fail('(m) rail .lux-rail-nla copy missing or not verbatim');
    const widths = [320, 375, 414, 600, 699, 720, 768, 899, 900, 1024, 1200, 1440];
    let everHidBottom = false, everHidRail = false;
    for (const w of widths) {
      const hBottom = nlaHiddenAt(assets.css, '.lux-nla', w);
      const hRail = nlaHiddenAt(assets.css, '.lux-rail-nla', w);
      everHidBottom = everHidBottom || hBottom;
      everHidRail = everHidRail || hRail;
      const visible = (hBottom ? 0 : 1) + (hRail ? 0 : 1);
      if (visible === 0) fail('(m) NLA is INVISIBLE at ' + w + 'px (C-200 pinned-on-every-screen broken)');
      if (visible > 1) fail('(m) NLA is DUPLICATED (' + visible + ' visible) at ' + w + 'px');
    }
    if (!everHidBottom) fail('(m) bottom .lux-nla is never hidden -> it would duplicate the rail copy on desktop');
    if (!everHidRail) fail('(m) rail .lux-rail-nla is never hidden -> it would duplicate the bottom copy on mobile');
  })();
}

// ---- (f) legacy fixture routes legacy; golden routes lux ----
(function () {
  if (isV11(legacyPayload) !== false) fail('(f) isV11 must be false for a legacy fixture (greystar)');
  if (isV11(payload) !== true) fail('(f) isV11 must be true for the v1.1 golden');
})();

// ---- bonus: the empty-steps path renders the compliant state honestly (no invented bars) ----
(function () {
  const clone = JSON.parse(goldenText);
  clone.exposureWaterfall = { steps: [], ceiling: null };
  const d2 = renderDom(clone);
  const a2 = d2.window.document.getElementById('app');
  if (!a2 || !a2.innerHTML.trim()) { fail('(empty) #app not built for empty-steps payload'); d2.window.close(); return; }
  if (a2.querySelectorAll('.lux-wf-bar').length !== 0) fail('(empty) invented waterfall bars for empty steps');
  if (!a2.querySelector('.lux-wf-empty')) fail('(empty) no honest empty-state block for empty steps');
  d2.window.close();
})();

// ---- bonus: a ceiling-present payload draws a labelled plateau, never the headline, never summed ----
// The real golden carries exposureWaterfall.ceiling = null, so the plateau is correctly absent above.
// This clone (a figure already in the payload, so the trace property holds) proves the plateau path.
(function () {
  const clone = JSON.parse(goldenText);
  const withMax = (clone.findings || []).find((f) => f.penalty && f.penalty.statutory_max != null);
  const ceilVal = withMax ? withMax.penalty.statutory_max : 17500000;
  clone.exposureWaterfall = { steps: clone.exposureWaterfall.steps, ceiling: { value: ceilVal, label: 'statutory ceiling', currency: 'GBP' } };
  const d3 = renderDom(clone);
  const a3 = d3.window.document.getElementById('app');
  if (!a3 || !a3.innerHTML.trim()) { fail('(ceiling) #app not built for ceiling-present payload'); d3.window.close(); return; }
  const ce = a3.querySelector('.lux-wf-ceiling');
  if (!ce) fail('(ceiling) no plateau element for a ceiling-present payload');
  else {
    if (!norm(ce.textContent).includes('statutory ceiling')) fail('(ceiling) plateau missing its label');
    if (![...digitRuns(ce.textContent)].includes(String(ceilVal))) fail('(ceiling) plateau missing the ceiling value');
  }
  // the headline must STILL be exposure.value, never the ceiling
  const hv = a3.querySelector('.lux-band .lux-expo .v');
  if (hv && [...digitRuns(hv.textContent)].includes(String(ceilVal))) fail('(ceiling) headline shows the ceiling value (must be exposure.value)');
  d3.window.close();
})();

// ---- bonus (known-bad → good): a pass (compliant) finding must render COMPLIANT copy, never the
//      violation "captured" lead-in nor the needs_review "confirmation" / withheld-figure copy. The
//      golden carries no pass finding, so this synthesises one to exercise the previously untested
//      pass path (CodeRabbit): the card reads compliant, and NO review-needed / £ figure leaks in. ----
(function () {
  const clone = JSON.parse(goldenText);
  const base = (clone.findings && clone.findings[0]) || {};
  clone.findings = [{
    state: 'pass',
    framework: base.framework || 'Test obligation',
    description: base.description || 'This obligation appears satisfied.',
    evidence_quote: 'A clear cookie-consent banner is presented on first visit.',
    statutory_citation: base.statutory_citation || '',
    regulator: base.regulator || '',
    voice_tier: 'confident',
  }];
  clone.counts = { total: 1 };
  const d = renderDom(clone);
  const a = d.window.document.getElementById('app');
  if (!a || !a.innerHTML.trim()) { fail('(pass) #app not built for a pass-state payload'); d.window.close(); return; }
  const card = a.querySelector('.lux-card--pass');
  if (!card) { fail('(pass) no .lux-card--pass rendered for a pass finding'); d.window.close(); return; }
  const t = norm(card.textContent);
  if (!/which meets this obligation:/.test(t)) fail('(pass) pass card missing its compliant evidence lead-in');
  for (const bad of [/needs your confirmation/, /put to you for your review/, /we captured the following/, /Figure withheld until confirmed/]) {
    if (bad.test(t)) fail('(pass) pass card carries non-compliant copy', String(bad));
  }
  if (/£/.test(t) || /\bGBP\b/.test(t)) fail('(pass) pass card shows a monetary figure (a compliant finding carries none)');
  d.window.close();
})();

dom.window.close();

if (issues.length) {
  console.log(`\n### qa_lux · ${issues.length} issue(s) on the v1.1 golden`);
  issues.forEach((i) => console.log('   - ' + i));
  console.log(`\n==== ${issues.length} total issues ====`);
  process.exit(1);
}
console.log('OK  qa_lux · lomond-realestate-uk-v11 renders clean through the lux path (B1 + B4, honesty contract holds)');
console.log('\n==== 0 total issues ====');
process.exit(0);
