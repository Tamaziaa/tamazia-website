// functions/audit/_lux.js
// VERSIONED (contract-v1.1) audit shell. Additive and isolated: the legacy shell in _shell.js is
// byte-untouched and still serves every v1.0 payload. This shell serves ONLY payloads the engine
// composed against the v1.1 contract (findings[] + notLegalAdvice). It injects window.P = the RAW
// payload (NOT window.D): the engine composed the payload render-ready, so the lux page reads it
// directly and re-derives nothing (Rule 1). It mounts /audit/audit-lux.{css,js}.
//
// Conventions mirrored from _shell.js (kept in step, not imported, so _shell.js stays byte-identical):
//  · self-hosted @font-face (same 11 woff2 the production CSP `font-src 'self' data:` allows)
//  · noindex,nofollow head (these are per-recipient minted reports, never indexed)
//  · _av-suffixed asset links (?v=<buildId>) so the edge cache can never serve a stale bundle
//  · safe JSON injection for the inline <script> (prevents </script> breakouts + LS/PS edge cases)

// Safe JSON for inline <script> injection (identical rules to _shell.js injectJSON).
function injectJSON(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
}

const MIDDOT = String.fromCharCode(0xB7);
const TITLE = 'The Exposure Report ' + MIDDOT + ' Tamazia';
const SUBTITLE = 'Compliance, Search and AI Visibility';

// Self-hosted fonts. Same latin-subset woff2 set the legacy shell references (see _shell.js), so the
// production CSP (`font-src 'self' data:`, no Google Fonts origin allowlisted) can load them and the
// families/weights match the token system in audit-lux.css. Emitted inline (allowed by style-src
// 'unsafe-inline'). Duplicated rather than imported so _shell.js can remain byte-untouched.
const UR = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const ff = (fam, style, weight, file) =>
  "@font-face{font-family:'" + fam + "';font-style:" + style + ";font-weight:" + weight
  + ";font-display:swap;src:url('/audit/fonts/" + file + "') format('woff2');unicode-range:" + UR + ";}";
const FONT_CSS = [
  ff('Fraunces', 'italic', 400, 'fraunces-400-italic.woff2'),
  ff('Fraunces', 'normal', 300, 'fraunces-300.woff2'),
  ff('Fraunces', 'normal', 400, 'fraunces-400.woff2'),
  ff('Fraunces', 'normal', 500, 'fraunces-500.woff2'),
  ff('Fraunces', 'normal', 600, 'fraunces-600.woff2'),
  ff('Newsreader', 'italic', 400, 'newsreader-400-italic.woff2'),
  ff('Newsreader', 'normal', 300, 'newsreader-300.woff2'),
  ff('Newsreader', 'normal', 400, 'newsreader-400.woff2'),
  ff('Newsreader', 'normal', 500, 'newsreader-500.woff2'),
  ff('JetBrains Mono', 'normal', 400, 'jetbrains-mono-400.woff2'),
  ff('JetBrains Mono', 'normal', 500, 'jetbrains-mono-500.woff2'),
].join('');

// HTML-escape for text injected into <title>/<meta content="..."> (a hostile company name must not
// break the tag or inject markup into the head). Same rule as _shell.js escAttr.
function escAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildHead(company) {
  const c = String(company || '').trim();
  const title = c ? (c + ' ' + MIDDOT + ' ' + TITLE) : TITLE;
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
    + '<meta charset="UTF-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
    + '<meta name="robots" content="noindex, nofollow">\n'
    + '<title>' + escAttr(title) + '</title>\n'
    + '<meta property="og:title" content="' + escAttr(title) + '">\n'
    + '<meta property="og:description" content="' + escAttr(SUBTITLE) + '">\n'
    + '<meta property="og:type" content="website">\n'
    + '<style id="tz-fonts">' + FONT_CSS + '</style>';
}

// isV11 · THE DISPATCH KEY. No payload.schema_version field exists today; a v1.1 payload is identified
// structurally: a top-level findings array AND a non-empty notLegalAdvice string. Everything else
// (every v1.0 fixture) returns false and routes the legacy renderShell path unchanged. Verified against
// all repo fixtures: no legacy payload carries both fields.
export function isV11(p) {
  return !!p
    && Array.isArray(p.findings)
    && typeof p.notLegalAdvice === 'string'
    && p.notLegalAdvice.trim().length > 0;
}

// renderLuxShell(payload, ctx) · server-rendered shell for a v1.1 payload.
//   ctx.company   preferred display company for <title>/OG when payload.meta.company is absent
//   ctx.buildId   deploy-unique asset version (?v=), sliced to 12 chars, same source as the legacy shell
//   ctx.inline    local-test mode: inline the css+js instead of linking (mirrors renderShell)
//   ctx.assets    { css, app } strings used when ctx.inline is true
// The RAW payload is injected as window.P; the client (audit-lux.js) reads it directly.
export function renderLuxShell(payload, ctx) {
  ctx = ctx || {};
  const inline = !!ctx.inline;
  const a = ctx.assets || {};
  const _av = (ctx.buildId || (typeof globalThis !== 'undefined' && globalThis.__CF_BUILD__) || 'r38').toString().slice(0, 12);
  // Company for the <title>/OG comes from the payload the engine composed (Rule 1), with ctx.company
  // as a fallback only when meta has none. The page stays noindex regardless.
  const metaCompany = payload && payload.meta && payload.meta.company;
  const company = metaCompany || ctx.company || '';
  const styleBlock = inline ? ('<style>\n' + (a.css || '') + '\n</style>') : ('<link rel="stylesheet" href="/audit/audit-lux.css?v=' + _av + '">');
  const appBlock = inline ? ('<script>\n' + (a.app || '') + '\n</script>') : ('<script src="/audit/audit-lux.js?v=' + _av + '"></script>');
  const head = buildHead(company);
  return head + '\n' + styleBlock + '\n</head>\n<body>\n'
    + '<div class="lux" id="app"></div>\n'
    + '<script>window.P = ' + injectJSON(payload) + ';</script>\n'
    + appBlock + '\n'
    + '</body>\n</html>';
}
