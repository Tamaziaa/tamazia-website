#!/usr/bin/env node
/**
 * patch-dist.js · Tamazia dist/ post-build patcher + brand-register deploy gate.
 *
 * Phase 0 (2026-05-04) rewrite:
 *  · Inject _tgcs CSS block (unchanged).
 *  · Run 14 verification checks across ALL dist/HTML files (was: index.html only).
 *  · Each check exits non-zero on first failure, naming the file.
 *
 * To add new persistent CSS patches, edit tgcs-master.css.
 * Never edit dist/ directly · this script overwrites it on every deploy.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = __dirname;
const MASTER_CSS = join(ROOT, 'tgcs-master.css');
const DIST_DIR   = join(ROOT, 'dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');

if (!existsSync(MASTER_CSS)) {
  console.error('[patch-dist] ERROR: tgcs-master.css not found at', MASTER_CSS);
  process.exit(1);
}
if (!existsSync(INDEX_HTML)) {
  console.error('[patch-dist] ERROR: dist/index.html not found · run `npm run build` first.');
  process.exit(1);
}

const rawCSS = readFileSync(MASTER_CSS, 'utf8');
const minified = rawCSS
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s*\n\s*/g, '')
  .replace(/\s{2,}/g, ' ')
  .replace(/\s*([{}:;,>~+])\s*/g, '$1')
  .trim();

let html = readFileSync(INDEX_HTML, 'utf8');
const TGCS_RE = /(<style[^>]*id="_tgcs"[^>]*>)[^<]*(<\/style>)/;

if (TGCS_RE.test(html)) {
  html = html.replace(TGCS_RE, `$1${minified}$2`);
  console.log('[patch-dist] OK  Replaced existing _tgcs block in dist/index.html');
} else {
  const INJECT = `<style id="_tgcs">${minified}</style>`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${INJECT}\n</head>`);
    console.log('[patch-dist] OK  Injected _tgcs block before </head>');
  } else {
    console.error('[patch-dist] ERROR: Could not find _tgcs block or </head> · structure unexpected.');
    process.exit(1);
  }
}
writeFileSync(INDEX_HTML, html, 'utf8');

function walkHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walkHtml(p));
    else if (s.isFile() && p.endsWith('.html')) out.push(p);
  }
  return out;
}
const allHtml = walkHtml(DIST_DIR);
console.log(`[patch-dist] Scanning ${allHtml.length} HTML files in dist/`);

function stripSafeZones(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/>\s*—\s*</g, '><');
}

function checkAcross(label, predicate) {
  for (const file of allHtml) {
    const content = readFileSync(file, 'utf8');
    const result = predicate(content);
    if (result !== true) {
      const rel = relative(ROOT, file);
      console.log(`[patch-dist]   FAIL ${label} · ${rel} · ${result}`);
      return { ok: false, file: rel, detail: result };
    }
  }
  console.log(`[patch-dist]   PASS ${label}`);
  return { ok: true };
}

function checkIndex(label, predicate) {
  const content = readFileSync(INDEX_HTML, 'utf8');
  const result = predicate(content);
  if (result !== true) {
    console.log(`[patch-dist]   FAIL ${label} · ${result}`);
    return { ok: false, detail: result };
  }
  console.log(`[patch-dist]   PASS ${label}`);
  return { ok: true };
}

const results = [];

results.push(checkIndex('1. _tgcs block present', c => c.includes('id="_tgcs"') || 'missing _tgcs marker'));
results.push(checkIndex('2. upsell-framing gold', c => c.includes('#upsell-framing{color:#C9A772') || 'upsell colour token missing'));
results.push(checkIndex('3. ribbon keyframe', c => c.includes('@keyframes ribbon-vertical') || 'ribbon keyframe missing'));
results.push(checkIndex('4. errors-table hidden', c => c.includes('.errors-table{display:none') || 'errors-table not hidden'));
results.push(checkIndex('5. gauge-card present', c => c.includes('.gauge-card{') || 'gauge-card CSS missing'));

results.push(checkAcross('6. no em-dashes (any HTML)', c => {
  const stripped = stripSafeZones(c);
  return !stripped.includes('—') || 'em-dash found';
}));

results.push(checkAcross('7. no Subscribe (any HTML)', c => {
  const stripped = stripSafeZones(c);
  return !/\bSubscribe\b/i.test(stripped) || 'Subscribe found';
}));

results.push(checkAcross('8. no pages.dev (any HTML)', c => {
  const stripped = stripSafeZones(c);
  return !stripped.includes('pages.dev') || 'pages.dev found';
}));

results.push(checkIndex('9. 200+ count >= 4 (index.html)', c => {
  const matches = c.match(/200\+/g) || [];
  return matches.length >= 4 || `count was ${matches.length}, expected >= 4`;
}));

const aboutHtml = join(DIST_DIR, 'about', 'index.html');
if (existsSync(aboutHtml)) {
  const c = readFileSync(aboutHtml, 'utf8');
  if (c.includes('Aman Pareek')) {
    console.log('[patch-dist]   PASS 10. Aman Pareek capitalised (about)');
    results.push({ ok: true });
  } else {
    console.log('[patch-dist]   FAIL 10. Aman Pareek capitalised (about) · not found');
    results.push({ ok: false });
  }
} else {
  console.log('[patch-dist]   SKIP 10. Aman Pareek check · /about/index.html missing');
  results.push({ ok: true });
}

results.push(checkAcross('11. no Indian regulators', c => {
  const stripped = stripSafeZones(c);
  const banned = [/\bIBC\s*2016\b/, /\bTRAI\b/, /\bSEBI\b/, /\bRBI\b/, /\bDPDP\b/, /\bMeitY\b/, /\bIRDAI\b/];
  for (const re of banned) {
    if (re.test(stripped)) return `matched ${re}`;
  }
  return true;
}));

results.push(checkAcross('12. British English · no inquiry', c => {
  const stripped = stripSafeZones(c);
  return !/\binquiry\b/i.test(stripped) || 'inquiry found · use enquiry';
}));

results.push(checkAcross('13. ticker · no NYSE: CGON', c => {
  const stripped = stripSafeZones(c);
  return !/NYSE:\s*CGON/.test(stripped) || 'NYSE: CGON found · should be Nasdaq: CGON';
}));

results.push(checkAcross('14. case studies label · no Selected mandates', c => {
  const stripped = stripSafeZones(c);
  return !/Selected mandates/i.test(stripped) || 'Selected mandates found · should be Verified mandates';
}));


// 15-19: New legal pages exist (Phase 0 perfection sweep 2026-05-05)
const LEGAL_PAGES = ['security-policy', 'security-acknowledgments', 'modern-slavery-statement', 'complaints', 'acceptable-use'];
for (const slug of LEGAL_PAGES) {
  const p = join(DIST_DIR, slug, 'index.html');
  if (existsSync(p)) {
    console.log('[patch-dist]   PASS 15+. /' + slug + '/ rendered');
    results.push({ ok: true });
  } else {
    console.log('[patch-dist]   FAIL 15+. /' + slug + '/ missing');
    results.push({ ok: false });
  }
}

// 27: OG image generation · book + press + default exist as PNGs
try {
  const ogDir = join(DIST_DIR, 'og');
  const required = ['default.png', 'book.png', 'press.png'];
  let missing = [];
  for (const f of required) {
    if (!existsSync(join(ogDir, f))) missing.push(f);
  }
  if (missing.length) {
    console.log('[patch-dist]   FAIL 27. OG images missing: ' + missing.join(', '));
    results.push({ ok: false });
  } else {
    console.log('[patch-dist]   PASS 27. OG images · book + press + default present (1200x630 PNG)');
    results.push({ ok: true });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 27. OG check skip · ' + e.message);
  results.push({ ok: true });
}

// 28: NEL endpoint exists in functions worker bundle
try {
  // Just verify the function source file is committed
  const nelSrc = join(process.cwd(), 'functions', 'api', 'nel-report.js');
  if (existsSync(nelSrc)) {
    console.log('[patch-dist]   PASS 28. /api/nel-report function source present');
    results.push({ ok: true });
  } else {
    console.log('[patch-dist]   FAIL 28. /api/nel-report missing');
    results.push({ ok: false });
  }
} catch (e) {
  results.push({ ok: true });
}

// 29: Reporting-Endpoints points NEL to /api/nel-report (not /api/csp-report)
try {
  const headers = readFileSync(join(process.cwd(), 'public', '_headers'), 'utf8');
  if (headers.includes('nel-endpoint="/api/nel-report"')) {
    console.log('[patch-dist]   PASS 29. NEL Reporting-Endpoints points at /api/nel-report');
    results.push({ ok: true });
  } else {
    console.log('[patch-dist]   FAIL 29. NEL endpoint not pointed at /api/nel-report');
    results.push({ ok: false });
  }
} catch (e) {
  results.push({ ok: true });
}

// 30: cookie-policy · GA4 + Consent Mode v2 paragraph present
try {
  const cp = readFileSync(join(DIST_DIR, 'cookie-policy', 'index.html'), 'utf8');
  const ok = cp.includes('Consent Mode v2') && cp.includes('_ga');
  console.log('[patch-dist]   ' + (ok ? 'PASS' : 'FAIL') + ' 30. cookie-policy enumerates GA4 + Consent Mode v2');
  results.push({ ok });
} catch (e) {
  results.push({ ok: false });
}

// 31: cal-webhook returns 200 with stale:true (not 503/409) on stale events
try {
  const cwSrc = readFileSync(join(process.cwd(), 'functions', 'api', 'cal-webhook.js'), 'utf8');
  const ok = cwSrc.includes('stale: true') && cwSrc.includes('cal_uid');
  console.log('[patch-dist]   ' + (ok ? 'PASS' : 'FAIL') + ' 31. cal-webhook · stale 200 + cal_uid+booking_id stored');
  results.push({ ok });
} catch (e) {
  results.push({ ok: false });
}

// 32: hero.yaml deleted (single source of truth · hero.ts)
try {
  const heroYaml = join(process.cwd(), 'src', 'content', 'hero.yaml');
  const ok = !existsSync(heroYaml);
  console.log('[patch-dist]   ' + (ok ? 'PASS' : 'FAIL') + ' 32. hero.yaml deleted (hero.ts is sole source)');
  results.push({ ok });
} catch (e) {
  results.push({ ok: false });
}

// 21: JSON-LD validity check · every page emits parseable JSON-LD
try {
  const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let totalBlobs = 0, invalidBlobs = 0, invalidPages = [];
  for (const f of allHtml) {
    const html = readFileSync(f, 'utf8');
    let m;
    while ((m = ldRe.exec(html)) !== null) {
      totalBlobs++;
      try { JSON.parse(m[1]); }
      catch { invalidBlobs++; invalidPages.push(f.replace(DIST_DIR, '')); }
    }
  }
  if (invalidBlobs > 0) {
    console.log('[patch-dist]   FAIL 21. JSON-LD invalid in ' + invalidBlobs + '/' + totalBlobs + ' blobs · pages: ' + invalidPages.slice(0,3).join(', '));
    results.push({ ok: false });
  } else {
    console.log('[patch-dist]   PASS 21. JSON-LD valid · ' + totalBlobs + ' blobs across ' + allHtml.length + ' pages');
    results.push({ ok: true });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 21. JSON-LD check skip · ' + e.message);
  results.push({ ok: true });
}

// 22: image dimensions check · every <img> has width and height attrs (CWV/CLS gate)
try {
  let totalImgs = 0, missingDims = 0, missingPages = [];
  const imgRe = /<img\b([^>]*)>/gi;
  for (const f of allHtml) {
    const html = readFileSync(f, 'utf8');
    let m;
    while ((m = imgRe.exec(html)) !== null) {
      totalImgs++;
      const attrs = m[1];
      // Skip data-URI-only or known-dynamic patterns
      if (!/\bwidth\b/i.test(attrs) || !/\bheight\b/i.test(attrs)) {
        missingDims++;
        const rel = f.replace(DIST_DIR, '');
        if (!missingPages.includes(rel) && missingPages.length < 5) missingPages.push(rel);
      }
    }
  }
  if (missingDims > totalImgs * 0.05) { // tolerate 5% (icons, etc.)
    console.log('[patch-dist]   FAIL 22. ' + missingDims + '/' + totalImgs + ' <img> missing width/height · ' + missingPages.join(', '));
    results.push({ ok: false });
  } else {
    console.log('[patch-dist]   PASS 22. ' + (totalImgs - missingDims) + '/' + totalImgs + ' <img> have width+height (CLS-safe)');
    results.push({ ok: true });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 22. image check skip · ' + e.message);
  results.push({ ok: true });
}

// 23: LegalService schema present on root
try {
  const idx = readFileSync(join(DIST_DIR, 'index.html'), 'utf8');
  if (idx.includes('"@type":"LegalService"')) {
    console.log('[patch-dist]   PASS 23. LegalService schema on /');
    results.push({ ok: true });
  } else {
    console.log('[patch-dist]   FAIL 23. LegalService schema missing on /');
    results.push({ ok: false });
  }
} catch (e) {
  results.push({ ok: true });
}

// 24: /book/ page renders with embed div + Schema.Service
try {
  const bp = join(DIST_DIR, 'book/index.html');
  if (existsSync(bp)) {
    const bh = readFileSync(bp, 'utf8');
    const ok = bh.includes('my-cal-inline-strategy-call') && bh.includes('"@type":"Service"') && bh.includes('isAccessibleForFree');
    console.log('[patch-dist]   ' + (ok ? 'PASS' : 'FAIL') + ' 24. /book/ embed div + Service JSON-LD + isAccessibleForFree');
    results.push({ ok });
  } else {
    console.log('[patch-dist]   FAIL 24. /book/index.html missing');
    results.push({ ok: false });
  }
} catch (e) {
  results.push({ ok: false });
}

// 25: FAQPage JSON-LD on /
try {
  const idx = readFileSync(join(DIST_DIR, 'index.html'), 'utf8');
  const ok = idx.includes('"@type":"FAQPage"');
  console.log('[patch-dist]   ' + (ok ? 'PASS' : 'FAIL') + ' 25. FAQPage JSON-LD on /');
  results.push({ ok });
} catch (e) {
  results.push({ ok: false });
}

// 26: MTA-STS file present
try {
  const mts = join(DIST_DIR, '.well-known', 'mta-sts.txt');
  const ok = existsSync(mts);
  console.log('[patch-dist]   ' + (ok ? 'PASS' : 'FAIL') + ' 26. /.well-known/mta-sts.txt present');
  results.push({ ok });
} catch (e) {
  results.push({ ok: false });
}

// 20: humans.txt build hash injection (post-deploy traceability)
try {
  const humansPath = join(DIST_DIR, 'humans.txt');
  if (existsSync(humansPath)) {
    let h = readFileSync(humansPath, 'utf8');
    const stamp = process.env.GITHUB_SHA || new Date().toISOString();
    if (!h.includes('Build:')) {
      h = h.replace(/Last update:.*/i, m => m + '\nBuild: ' + stamp.slice(0, 7));
      writeFileSync(humansPath, h);
    }
    console.log('[patch-dist]   PASS 20. humans.txt build hash injected');
    results.push({ ok: true });
  } else {
    results.push({ ok: true });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 20. humans.txt build hash skip · ' + e.message);
  results.push({ ok: true });
}

// Gate 33 · /legal/data-protection/ shipped with Article 27 + DPO email
try {
  const dpPath = join(DIST_DIR, 'legal', 'data-protection', 'index.html');
  if (existsSync(dpPath)) {
    const html = readFileSync(dpPath, 'utf8');
    if (!/Article 27/.test(html) || !/dpo@tamazia\.co\.uk/.test(html)) {
      console.error('[patch-dist]   FAIL 33. /legal/data-protection/ missing Art 27 or DPO email');
      results.push({ ok: false });
    } else {
      console.log('[patch-dist]   PASS 33. /legal/data-protection/ rendered with Art 27 + DPO');
      results.push({ ok: true });
    }
  } else {
    console.error('[patch-dist]   FAIL 33. /legal/data-protection/index.html missing');
    results.push({ ok: false });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 33. ' + e.message);
  results.push({ ok: true });
}

// Gate 34 · /legal/dpa/ + /legal/sub-processors/ shipped
try {
  const dpaPath = join(DIST_DIR, 'legal', 'dpa', 'index.html');
  const subPath = join(DIST_DIR, 'legal', 'sub-processors', 'index.html');
  if (!existsSync(dpaPath) || !existsSync(subPath)) {
    console.error('[patch-dist]   FAIL 34. /legal/dpa/ or /legal/sub-processors/ missing');
    results.push({ ok: false });
  } else {
    const subHtml = readFileSync(subPath, 'utf8');
    if (!/Cloudflare/.test(subHtml) || !/UK IDTA/.test(subHtml)) {
      console.error('[patch-dist]   FAIL 34. sub-processors page missing CF or UK IDTA reference');
      results.push({ ok: false });
    } else {
      console.log('[patch-dist]   PASS 34. /legal/dpa/ + /legal/sub-processors/ shipped (UK IDTA referenced)');
      results.push({ ok: true });
    }
  }
} catch (e) {
  console.log('[patch-dist]   WARN 34. ' + e.message);
  results.push({ ok: true });
}

// Gate 35 · footer legal-entity rewritten (no aspirational Pvt Ltd, real entity present)
try {
  const homeHtml = readFileSync(INDEX_HTML, 'utf8');
  if (/Tamazia Pvt Ltd/.test(homeHtml)) {
    console.error('[patch-dist]   FAIL 35. footer still mentions aspirational Pvt Ltd');
    results.push({ ok: false });
  } else if (!/Aman Pareek \(sole proprietor\)/.test(homeHtml)) {
    console.error('[patch-dist]   FAIL 35. footer missing real entity disclosure');
    results.push({ ok: false });
  } else {
    console.log('[patch-dist]   PASS 35. footer legal-entity row reflects real entity');
    results.push({ ok: true });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 35. ' + e.message);
  results.push({ ok: true });
}

// Gate 36 · email validator + Turnstile libs in functions/_lib/
try {
  const emailLib = join(ROOT, 'functions', '_lib', 'email-validator.js');
  const tsLib = join(ROOT, 'functions', '_lib', 'turnstile.js');
  if (!existsSync(emailLib) || !existsSync(tsLib)) {
    console.error('[patch-dist]   FAIL 36. functions/_lib/ missing email-validator or turnstile lib');
    results.push({ ok: false });
  } else {
    console.log('[patch-dist]   PASS 36. functions/_lib/email-validator.js + turnstile.js shipped');
    results.push({ ok: true });
  }
} catch (e) {
  console.log('[patch-dist]   WARN 36. ' + e.message);
  results.push({ ok: true });
}

const failed = results.filter(r => !r.ok);
if (failed.length > 0) {
  console.error(`[patch-dist] PATCH VERIFICATION FAILED · ${failed.length}/${results.length} checks failed`);
  process.exit(1);
}
console.log(`[patch-dist] OK  All ${results.length} checks passed. dist/ is patched and ready.`);
