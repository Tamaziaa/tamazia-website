// scripts/build-cockpit.mjs — bundle the React cockpit (admin-v2-src/*.jsx) into
// a single classic-script IIFE for /admin/cockpit-v2/app.js.
//
// The design files use NO import/export — they read React off the global and
// self-register window.TabNow / window.CockpitApp etc. So we concatenate in a
// fixed order (boot defines globals first; app.jsx last reads them), run ONE
// esbuild JSX transform (classic React.createElement against the global React),
// wrap in an IIFE, and write the bundle. Runs in `npm run build` before astro,
// so Astro copies public/admin/cockpit-v2/app.js into dist verbatim.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'admin-v2-src');
const OUT = join(ROOT, 'public', 'admin', 'cockpit-v2', 'app.js');

// Fixed concat order: boot (globals + fetch) → lib (primitives) → drawer → tabs → app (root).
const ORDER = [
  'boot.jsx', 'lib.jsx', 'lead-drawer.jsx',
  'tab-now.jsx', 'tab-pipeline.jsx', 'tab-leads.jsx', 'tab-outbox.jsx', 'tab-inbox.jsx',
  'tab-aliases.jsx', 'tab-audits.jsx', 'tab-bookings.jsx', 'tab-forms.jsx',
  'tab-health.jsx', 'tab-intel.jsx', 'tab-settings.jsx',
  'app.jsx',
];

const missing = ORDER.filter(f => !existsSync(join(SRC, f)));
if (missing.length) { console.error('[build-cockpit] missing source files:', missing); process.exit(1); }

const combined = ORDER.map(f => `\n/* ==== ${f} ==== */\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

const result = await build({
  stdin: { contents: combined, loader: 'jsx', resolveDir: SRC },
  jsx: 'transform',                 // classic React.createElement (NOT automatic — no module imports)
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  bundle: false,                    // single scope, globals shared; nothing to resolve
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
});

writeFileSync(OUT, result.outputFiles[0].text);
console.log(`[build-cockpit] wrote ${OUT} (${(result.outputFiles[0].text.length / 1024).toFixed(1)} KB) from ${ORDER.length} sources`);
