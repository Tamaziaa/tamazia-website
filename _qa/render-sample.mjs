// _qa/render-sample.mjs — baseline proof: sample payload -> payloadToD -> renderShell -> /tmp/render-sample.html
import { readFileSync, writeFileSync } from 'node:fs';
import { payloadToD } from '../functions/audit/_adapter.js';
import { renderShell } from '../functions/audit/_shell.js';
import { validateD } from '../functions/audit/_contract.js';

// NOTE: _audit/raw/remodel-audit.json is NOT an audit payload — it is a visual-regression overflow/screenshot
// manifest (keys like "/@320", "/@1920"). payloadToD is defensive enough that it doesn't throw on it, but the
// resulting D is built almost entirely from fallbacks, not real payload content, so it is a WEAK baseline.
// The real known-good reference is _qa/fixtures/harley-healthcare-uk.json — an existing UK dental/healthcare
// fixture already in the repo's own QA fixture set, with real pointers/frameworks/geo/seo content.
const payload = JSON.parse(readFileSync(new URL('../_qa/fixtures/harley-healthcare-uk.json', import.meta.url)));
const now = Date.now();
let D, err;
try {
  D = payloadToD(payload, { now });
} catch (e) {
  err = e;
}
if (err) {
  console.error('payloadToD THREW:', err.stack || err);
  process.exit(1);
}
const missing = validateD(D);
console.log('validateD missing fields:', JSON.stringify(missing));
const html = renderShell(D, {});
writeFileSync('/tmp/render-sample.html', html);
console.log('wrote /tmp/render-sample.html', html.length, 'bytes');
