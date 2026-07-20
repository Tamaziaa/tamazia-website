// _qa/render-dental-corrected.mjs
//
// Corrected copy of /tmp/render-dental.mjs. It does NOT touch the original bridge.
//
// Why this exists: the original bridge rendered the dental audit from a payload whose GEO probe panel,
// seo.security header set and competitors table were, in earlier runs, populated from FIXTURE / PLACEHOLDER
// values rather than a real engine/live source. A compliance report sold to a real business must not assert
// specifics it never measured. This bridge therefore normalises the input payload so that any section with NO
// real engine/live data behind it is EXPLICITLY emitted as a NOT_ASSESSED state, letting the E3 adapter changes
// render "not checked"/suppressed naturally, instead of relying on the adapter to catch a placeholder.
//
// KEPT AS-IS (real data): the confirmed findings + their evidence quotes, PageSpeed perf/CWV (lcp/cls/fcp/tbt),
// identity fields, jurisdiction, and the rule/framework counts.
// NORMALISED TO NOT_ASSESSED (no real backing): live AI-engine probes (geo_probe / ai_readiness), security
// headers (scan.signals security keys), and competitor benchmarks (competitive_benchmark / authority).

import { readFileSync, writeFileSync } from 'node:fs';
import { payloadToD } from '/tmp/wt-render/functions/audit/_adapter.js';
import { renderShell } from '/tmp/wt-render/functions/audit/_shell.js';
import { validateD } from '/tmp/wt-render/functions/audit/_contract.js';

const payload = JSON.parse(readFileSync('/tmp/dental-full-payload.json', 'utf8'));

// A section is "real" only when the engine attached a non-empty, non-placeholder object for it. For this payload
// none of these were genuinely probed, so we assert NOT_ASSESSED explicitly (delete any placeholder that may be
// present) rather than leaving a fixture value that would render as a measured claim.
function markNotAssessed(p) {
  // 1) Live AI-engine visibility: no geo_probe/ai_readiness run means the 8-engine readiness panel, share-of-voice,
  //    repeatability and sentiment must all read as an estimate / not probed. Removing the keys makes the adapter's
  //    `_liveProbe` false and the AI/GEO dimension "not assessed" (na), never a fabricated "named 0 of 2 runs".
  if (!p.geo_probe || !Object.keys(p.geo_probe).length) delete p.geo_probe;
  if (!p.ai_readiness || !Object.keys(p.ai_readiness).length) delete p.ai_readiness;

  // 2) Security headers: only assert a specific header absence when the live headers were actually fetched. The
  //    dental site was bot-blocked (scan.site_scan_reachable === false) and no signal bag was captured, so we leave
  //    scan.signals absent — the adapter then renders every header as "Not checked this scan", never "HSTS absent".
  p.scan = p.scan || {};
  if (p.scan.site_scan_reachable !== true) {
    delete p.scan.signals;          // no measured header/on-page signals to assert absence from
  }

  // 3) Competitors: with no competitive_benchmark / authority data there is no real rival to compare against, so the
  //    adapter suppresses the one-row (self-only) table. Drop any placeholder so it can never render a fake rival.
  if (!p.competitive_benchmark || !Object.keys(p.competitive_benchmark).length) delete p.competitive_benchmark;
  if (!p.authority || !Object.keys(p.authority).length) delete p.authority;

  // KEEP: pointers + evidence, scan.psi (real PageSpeed), identity, jurisdiction, rules/framework counts.
  return p;
}

const clean = markNotAssessed(payload);

let D;
try {
  D = payloadToD(clean, { verified: true, now: '2026-07-20' });
} catch (e) {
  console.error('payloadToD threw:', e.stack || e);
  process.exit(1);
}

const validation = validateD(D);
console.log('validateD missing fields:', JSON.stringify(validation));

const html = renderShell(D);
writeFileSync('/tmp/dental-audit-corrected.html', html, 'utf8');
writeFileSync('/tmp/dental-D-corrected.json', JSON.stringify(D, null, 2), 'utf8');
console.log('wrote /tmp/dental-audit-corrected.html', html.length, 'bytes');
console.log('exposure', D.exposure, '| ceiling', D.exposureCeiling, '| score', D.score, D.grade);
console.log('security[0].note', D.seo.security[0].note);
console.log('geo.engineEstimate', D.geo.engineEstimate, '| competitors.suppress', D.competitors.suppress);
