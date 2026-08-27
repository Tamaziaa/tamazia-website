// AUDIT_RENDER_V2 — the flag that serves the v2 render layer, and the guarantee that it is OFF by default.
//
// The v2 asset set (public/audit/*-v2.*) ships DARK. Every audit page served today must be byte-identical
// to the one served before the v2 files existed, and it must stay that way until a founder sets the Pages
// env var AUDIT_RENDER_V2 to exactly "1". A flag that is "on unless explicitly off", or that treats "true"
// or "yes" as on, is not a dark launch. These checks pin both directions.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { renderShell, wantsV2 } from '../functions/audit/_shell.js';

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

const D = { meta: { company: 'Test Firm' }, score: 50 };
const shell = (opts) => renderShell(D, Object.assign({ buildId: 'testbuild' }, opts));

/* ---------------- default: v1, untouched ---------------- */

t('DEFAULT: no flag at all serves the v1 asset set', () => {
  const h = shell({});
  assert.match(h, /\/audit\/audit\.css\?v=testbuild/);
  assert.match(h, /\/audit\/audit-charts\.js\?v=testbuild/);
  assert.match(h, /\/audit\/audit-app\.js\?v=testbuild/);
  assert.ok(!/-v2\./.test(h), 'a v2 asset leaked into the default render');
  assert.ok(!/copy-v2/.test(h), 'the v2 copy bundle leaked into the default render');
});

t('DEFAULT: only the exact string "1" turns it on', () => {
  for (const v of ['', '0', 'true', 'TRUE', 'yes', 'on', ' 1', '1 ', 'v2', undefined, null, false]) {
    assert.equal(wantsV2({ renderV2: v }), false, 'renderV2=' + JSON.stringify(v) + ' must NOT serve v2');
    assert.ok(!/-v2\./.test(shell({ renderV2: v })), 'renderV2=' + JSON.stringify(v) + ' served a v2 asset');
  }
  assert.equal(wantsV2({ renderV2: '1' }), true);
});

/* ---------------- flipped: the whole v2 set, in load order ---------------- */

t('FLIPPED: "1" serves the four v2 assets and no v1 asset', () => {
  const h = shell({ renderV2: '1' });
  for (const f of ['audit-v2.css', 'copy-v2.js', 'audit-charts-v2.js', 'audit-app-v2.js']) {
    assert.ok(h.includes('/audit/' + f + '?v=testbuild'), 'missing ' + f);
  }
  assert.ok(!/\/audit\/audit-app\.js/.test(h), 'the v1 app was served alongside v2');
  assert.ok(!/\/audit\/audit-charts\.js/.test(h), 'the v1 charts were served alongside v2');
  assert.ok(!/\/audit\/audit\.css/.test(h), 'the v1 stylesheet was served alongside v2');
});

t('FLIPPED: copy-v2.js is evaluated BEFORE audit-charts-v2.js', () => {
  // audit-charts-v2.js reads CP() from copy-v2.js at call time. Wrong order = a dead render.
  const h = shell({ renderV2: '1' });
  assert.ok(h.indexOf('copy-v2.js') < h.indexOf('audit-charts-v2.js'), 'copy-v2.js must load first');
  assert.ok(h.indexOf('audit-charts-v2.js') < h.indexOf('audit-app-v2.js'), 'charts must load before the app');
  assert.ok(h.indexOf('window.D =') < h.indexOf('copy-v2.js'), 'window.D must exist before any script runs');
});

t('FLIPPED: window.D is injected once, whichever set is served', () => {
  for (const opts of [{}, { renderV2: '1' }]) {
    assert.equal((shell(opts).match(/window\.D = /g) || []).length, 1);
  }
});

/* ---------------- the files the flag points at ---------------- */

t('the four v2 assets exist in public/audit and are non-trivial', () => {
  for (const f of ['audit-v2.css', 'copy-v2.js', 'audit-charts-v2.js', 'audit-app-v2.js']) {
    const p = new URL('../public/audit/' + f, import.meta.url);
    assert.ok(existsSync(p), 'missing public/audit/' + f);
    assert.ok(readFileSync(p, 'utf8').length > 10000, f + ' is suspiciously small');
  }
});

t('every served v2 asset carries a no-cache header rule', () => {
  // Without this the flip serves a 4h-stale bundle and reads as "the flag did nothing".
  const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  for (const f of ['audit-v2.css', 'copy-v2.js', 'audit-charts-v2.js', 'audit-app-v2.js']) {
    const rule = new RegExp('/audit/' + f.replace(/[.]/g, '\\.') + '\\s*\\n\\s*Cache-Control: no-cache');
    assert.match(headers, rule, 'no no-cache rule for /audit/' + f);
  }
});

t('inline mode (the QA harnesses) is unchanged when no copy bundle is passed', () => {
  const h = renderShell(D, { inline: true, assets: { css: 'CSS_X', charts: 'CHARTS_X', app: 'APP_X' } });
  assert.match(h, /CSS_X/); assert.match(h, /CHARTS_X/); assert.match(h, /APP_X/);
  assert.ok(!/<script>\s*<\/script>/.test(h), 'an empty copy <script> was emitted');
});

console.log(bad ? 'AUDIT_RENDER_V2: FAIL' : 'AUDIT_RENDER_V2: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
