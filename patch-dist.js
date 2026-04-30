#!/usr/bin/env node
/**
 * patch-dist.js  —  Tamazia dist/ post-build patcher
 * ─────────────────────────────────────────────────────────────────
 * Runs AFTER `npm run build` and BEFORE Wrangler deploy.
 * Reads tgcs-master.css and injects it as the inline <style id="_tgcs">
 * block in dist/index.html, replacing whatever Astro generated.
 *
 * Usage (called automatically by deploy script):
 *   node patch-dist.js
 *
 * To add new persistent CSS patches, edit tgcs-master.css only.
 * Never edit dist/ directly — this script overwrites it on every deploy.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = __dirname;
const MASTER_CSS = join(ROOT, 'tgcs-master.css');
const INDEX_HTML = join(ROOT, 'dist', 'index.html');

// ── Verify files exist ──────────────────────────────────────────────
if (!existsSync(MASTER_CSS)) {
  console.error('[patch-dist] ERROR: tgcs-master.css not found at', MASTER_CSS);
  process.exit(1);
}
if (!existsSync(INDEX_HTML)) {
  console.error('[patch-dist] ERROR: dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}

// ── Read and minify master CSS ──────────────────────────────────────
const rawCSS = readFileSync(MASTER_CSS, 'utf8');

// Strip comments, collapse whitespace to single line
const minified = rawCSS
  .replace(/\/\*[\s\S]*?\*\//g, '')        // remove block comments
  .replace(/\s*\n\s*/g, '')                // collapse newlines
  .replace(/\s{2,}/g, ' ')                 // collapse spaces
  .replace(/\s*([{}:;,>~+])\s*/g, '$1')   // tighten around syntax chars
  .trim();

// ── Read dist/index.html ────────────────────────────────────────────
let html = readFileSync(INDEX_HTML, 'utf8');

// ── Strategy A: replace existing _tgcs block ────────────────────────
const TGCS_RE = /(<style[^>]*id="_tgcs"[^>]*>)[^<]*(<\/style>)/;

if (TGCS_RE.test(html)) {
  html = html.replace(TGCS_RE, `$1${minified}$2`);
  console.log('[patch-dist] ✓ Replaced existing _tgcs block');
} else {
  // ── Strategy B: inject before </head> ──────────────────────────────
  const INJECT = `<style id="_tgcs">${minified}</style>`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${INJECT}\n</head>`);
    console.log('[patch-dist] ✓ Injected new _tgcs block before </head>');
  } else {
    console.error('[patch-dist] ERROR: Could not find _tgcs block or </head> — index.html structure unexpected.');
    process.exit(1);
  }
}

// ── Write back ──────────────────────────────────────────────────────
writeFileSync(INDEX_HTML, html, 'utf8');

// ── Verification ────────────────────────────────────────────────────
const verify = readFileSync(INDEX_HTML, 'utf8');
const checks = [
  ['_tgcs block present',   verify.includes('id="_tgcs"')],
  ['upsell-framing gold',   verify.includes('#upsell-framing{color:#C9A772')],
  ['ribbon keyframe',       verify.includes('@keyframes ribbon-vertical')],
  ['errors-table hidden',   verify.includes('.errors-table{display:none')],
  ['gauge-card present',    verify.includes('.gauge-card{')],
  // Strip em dashes that are: (a) lone JS placeholders >—<, (b) inside HTML comments.
  // These are valid — runtime UI placeholders and dev comments are not copy violations.
  ['no em dashes (dist)',   (() => {
    const stripped = verify
      .replace(/>—</g, '><')              // lone JS placeholder values
      .replace(/<!--[\s\S]*?-->/g, '');   // HTML comments
    return !stripped.includes('\u2014') && !stripped.includes('—');
  })()],
];

let allOk = true;
for (const [label, ok] of checks) {
  console.log(`[patch-dist]   ${ok ? '✓' : '✗'} ${label}`);
  if (!ok) allOk = false;
}

if (!allOk) {
  console.error('[patch-dist] PATCH VERIFICATION FAILED — check tgcs-master.css');
  process.exit(1);
}

console.log('[patch-dist] ✓ All checks passed. dist/index.html is patched and ready.');
