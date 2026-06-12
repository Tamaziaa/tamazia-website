// functions/audit/_shell.js
// Emits the EXACT 'Tamazia Audit.html' shell. Only window.D changes (hardcoded -> injected).
// Production: links assets from /audit/. Local test: pass {inline:true, assets:{css,charts,app}}.

// Safe JSON for inline <script> injection (prevents </script> breakouts + line-separator edge cases).
function injectJSON(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
}

const MIDDOT = String.fromCharCode(0xB7);
const TITLE = 'The Exposure Report ' + MIDDOT + ' Tamazia';
const SUBTITLE = 'Compliance, Search and AI Visibility';

// Self-hosted fonts. The production CSP (see public/_headers) is `font-src 'self' data:`
// and does NOT allowlist fonts.googleapis.com / fonts.gstatic.com — so the Google Fonts
// <link> could never load on the live page. These @font-face rules point at the woff2
// files vendored under public/audit/fonts/ (latin subset). Families/weights/styles are
// byte-for-byte the same set the old <link> requested; font-display:swap is preserved so
// the render stays pixel-identical. Emitted inline (allowed by `style-src 'unsafe-inline'`).
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

const HEAD = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
  + '<meta charset="UTF-8">\n'
  + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
  + '<meta name="robots" content="noindex, nofollow">\n'
  + '<title>' + TITLE + '</title>\n'
  + '<meta property="og:title" content="' + TITLE + '">\n'
  + '<meta property="og:description" content="' + SUBTITLE + '">\n'
  + '<meta property="og:type" content="website">\n'
  + '<style id="tz-fonts">' + FONT_CSS + '</style>';

const NOTES_BTN = '<button id="notesToggle" style="position:fixed;bottom:16px;right:16px;z-index:80;font-family:\'JetBrains Mono\',monospace;font-size:10px;color:#2A5DA8;background:rgba(248,244,238,.94);border:1px solid rgba(42,93,168,.3);border-radius:8px;padding:6px 11px;cursor:pointer;backdrop-filter:blur(6px)">Notes on</button>';

export function renderShell(D, opts) {
  opts = opts || {};
  const inline = !!opts.inline;
  const a = opts.assets || {};
  const _av = 'r26';  // asset version — bump on every deploy so the 4h-cached audit JS/CSS busts immediately
  const styleBlock = inline ? ('<style>\n' + (a.css || '') + '\n</style>') : ('<link rel="stylesheet" href="/audit/audit.css?v=' + _av + '">');
  const chartsBlock = inline ? ('<script>\n' + (a.charts || '') + '\n</script>') : ('<script src="/audit/audit-charts.js?v=' + _av + '"></script>');
  const appBlock = inline ? ('<script>\n' + (a.app || '') + '\n</script>') : ('<script src="/audit/audit-app.js?v=' + _av + '"></script>');
  return HEAD + '\n' + styleBlock + '\n</head>\n<body>\n'
    + '<div class="tz-shell" id="app"></div>\n'
    + NOTES_BTN + '\n'
    + '<script>window.D = ' + injectJSON(D) + ';</script>\n'
    + chartsBlock + '\n'
    + appBlock + '\n'
    + '</body>\n</html>';
}

export function errorShell(title, message) {
  return HEAD + '\n'
    + '<style>body{background:#F8F4EE;color:#2A0C14;font-family:\'Newsreader\',Georgia,serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}h1{font-family:\'Fraunces\',serif;font-weight:400}.m{font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#6E625F;letter-spacing:.05em}</style>\n'
    + '</head><body><div><h1>' + title + '</h1><p class="m">' + message + '</p></div></body></html>';
}
