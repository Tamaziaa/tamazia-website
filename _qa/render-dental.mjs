// _qa/render-dental.mjs — bridge (engine manifest -> payload) -> payloadToD -> renderShell -> /tmp/render-dental.html
import { writeFileSync } from 'node:fs';
import { payloadToD } from '../functions/audit/_adapter.js';
import { renderShell } from '../functions/audit/_shell.js';
import { validateD } from '../functions/audit/_contract.js';
import { buildBridgePayload } from './engine-payload-bridge.mjs';

const SITE = 'https://www.thedentalpracticeuk.com';
const { payload, gaps, realFields } = buildBridgePayload({
  manifestPath: '/tmp/render-dental/render-dental.jsonl',
  catalogueDistPath: '/Users/amanigga/Desktop/TAMAZIA-REBUILD/tamazia-audit-engine/catalogue/dist/catalogue.v1.json',
  scaffoldFixturePath: new URL('./fixtures/harley-healthcare-uk.json', import.meta.url).pathname,
  site: SITE,
  psiResultPath: '/tmp/psi-dental.json',
});

writeFileSync('/tmp/render-dental-payload.json', JSON.stringify(payload, null, 2));

let D, err;
try {
  D = payloadToD(payload, { now: Date.now() });
} catch (e) {
  err = e;
}
if (err) {
  console.error('payloadToD THREW:', err.stack || err);
  writeFileSync('/tmp/render-dental-gaps.md', `# render-dental FAILED at payloadToD\n\n\`\`\`\n${err.stack || err}\n\`\`\`\n`);
  process.exit(1);
}

const missing = validateD(D);
const html = renderShell(D, {});
writeFileSync('/tmp/render-dental.html', html);

const gapMd = [
  '# Dental audit bridge — gap report (thedentalpracticeuk.com)',
  '',
  `Engine run: engine-v2.11.0-nq, run-id render-dental, site ${SITE}`,
  `Rendered: /tmp/render-dental.html (${html.length} bytes)`,
  `validateD() missing/invalid contract fields: ${JSON.stringify(missing)}`,
  '',
  '## Contract fields filled with REAL engine/live data',
  ...realFields.map((f) => `- ${f}`),
  '',
  '## Placeholders / gaps (never fabricated — see reason for each)',
  ...gaps.map((g) => `- **${g.field}**: ${g.reason}`),
  '',
  '## Adapter membrane notes (THE central finding of this exercise)',
  '- `_adapter.js` line 1270: `const rawPointers = arr(payload.pointers).filter((p) => (p.state || \'CONFIRMED\') === \'CONFIRMED\')`.',
  '  Only pointers whose `state` is exactly `"CONFIRMED"` survive into `fixes`/`frameworks`/the exposure waterfall.',
  '  There is a SECOND gate right after it (`evidenced()`, ~line 1275): P0/P1 findings with a non-zero fine also need',
  '  `evidence_quote` or a `checked_urls` entry, or they are dropped even if CONFIRMED.',
  '  The new engine (engine-v2.11.0-nq, supervised mode) classes every finding it produces as `"needs_human"` — by',
  '  design, v0 never self-confirms a breach; a human must sign each finding off (`engine sign`) before it is a',
  '  confirmed result. This bridge mapped that honestly to `state: "NEEDS_REVIEW"`, NOT `"CONFIRMED"`.',
  '  Net effect: with 7 real, catalogue-backed dental findings piped through honestly, ALL 7 are stripped by the',
  '  CONFIRMED gate before they reach `fixes`/`frameworks`, and the render falls back to the adapter\'s built-in',
  '  "The live site could not be fully read this scan / honest suppression" placeholder (see line 2042).',
  '  D.fixes.length = 1 (the fallback card, not a real finding), D.frameworks.length = 1, D.score = 14, D.grade = "F-".',
  '  This is the adapter working AS DESIGNED (it will not show an unconfirmed finding as if it were a confirmed',
  '  breach) — but it means the current engine <-> website pipe has NO path today for a supervised-mint "needs_human"',
  '  finding to reach the visible report content, until either (a) a human runs `engine sign` to flip a finding to a',
  '  confirmed state the bridge can then map to `state: "CONFIRMED"`, or (b) the bridge is told to treat un-signed',
  '  findings as CONFIRMED for demonstration purposes only (which this run deliberately did NOT do, per the "never',
  '  invent/never misrepresent" constraint in this task).',
  '- Separately, `_adapter.js` is defensive/total (every `g(obj, path, def)` lookup falls back to a default rather',
  '  than throwing), so it silently accepts and renders a payload even when the source data is structurally wrong —',
  '  proven by the first baseline attempt: feeding it `_audit/raw/remodel-audit.json` (a Playwright visual-regression',
  '  overflow/screenshot manifest, NOT an audit payload) still produced a full HTML document with `validateD` only',
  '  flagging `meta.domain`. This is not a "gate" so much as an unconditional fallback path.',
  '  The company-name heuristics (`looksLikeTitle`, `looksLikeDomain`) at the top of the file are a legitimate,',
  '  intentional filter (rejecting scraped page-title strings as company names), not a bug.',
  '',
  '## What a CONFIRMED-state dry run looks like (diagnostic only, NOT part of the honest render, NOT written to',
  '  /tmp/render-dental.html)',
  '- Re-running payloadToD with every pointer\'s `state` forced to `CONFIRMED` (a throwaway local check, discarded',
  '  after inspection) shows all 7 dental findings DO carry a `checked_urls: [site]` entry each, so all 7 pass the',
  '  `evidenced()` gate once CONFIRMED: `D.frameworks.length` goes from 1 (fallback) to 7 (all real), `D.fixes.length`',
  '  goes from 1 (fallback card) to 3 (the display cap — PECR cookies, MHRA POM ad ban, Equality Act accessibility),',
  '  `D.score` goes from 14/F- to 44/D-. This means the ONLY thing blocking the 7 real findings from the visible',
  '  report today is the missing human sign-off step (`engine sign`), not a data-shape problem in the bridge or a',
  '  bug in the adapter — the pipe genuinely works once a finding is confirmed.',
  '',
  '## Render errors encountered and resolution',
  err ? `- payloadToD threw: ${err.message}` : '- None: payloadToD did not throw for the bridged dental payload.',
].join('\n');

writeFileSync('/tmp/render-dental-gaps.md', gapMd);

console.log('validateD missing fields:', JSON.stringify(missing));
console.log('wrote /tmp/render-dental.html', html.length, 'bytes');
console.log('wrote /tmp/render-dental-gaps.md');
console.log('real fields:', realFields.length, 'gap entries:', gaps.length);
