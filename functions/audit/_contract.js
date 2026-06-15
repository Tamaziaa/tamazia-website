// _contract.js — D_CONTRACT manifest: every window.D field the render consumes. validateD(D) returns the
// contract paths that are missing (null/undefined) or empty-where-content-is-required, so the pipe is
// provably TOTAL — 100%, no engine output silently dropped, no rendered field undefined. Used by the
// backtest + CI (it is NOT imported by the render route, so it never ships to the client).
const get = (o, p) => { try { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); } catch { return undefined; } };

// Required (must be present, non-null):
const REQUIRED = [
  'meta.company', 'meta.domain', 'meta.sector', 'meta.country', 'meta.date',
  'score', 'grade', 'scoreBand', 'exposure', 'exposureFull', 'exposureNote', 'exposureWaterfall',
  'counts.critical', 'counts.high', 'counts.standard', 'counts.total', 'confirmed',
  'frameworksAssessed', 'rulesChecked', 'frameworksTotal',
  'scoring.formula', 'scoring.why', 'scoring.inputs', 'exec', 'jurisdiction',
  'heat', 'heatRows', 'heatCols', 'projected.wk12', 'projected.wk24', 'glossary',
  'seo.psi', 'seo.cwv', 'seo.onpage', 'seo.security', 'seo.a11y', 'seo.tech', 'seo.keywordSummary', 'seo.psiAudits',
  'geo.entityReadiness', 'geo.shareOfVoice', 'geo.radar', 'geo.schema', 'geo.citations', 'geo.sourceGap', 'geo.rootCause', 'geo.fix',
  'competitors.bestKeyword', 'competitors.youDr', 'competitors.cols', 'competitors.rows', 'competitors.drBars',
  'pricingNotes', 'upsellProof',
];
// Must be a non-empty array (the render iterates these and would show nothing if empty):
// C-A: `addons` removed — the adapter no longer injects D.addons (the render builds its add-on grid from
// the PRICES block, mirrored from pricing.ts), so requiring it here would fail the contract on a valid page.
const NONEMPTY = [
  'scoring.bands', 'frameworks', 'dims', 'fixes', 'trajectory', 'seo.keywords',
  'geo.engines', 'competitors.rows', 'pricing',
];

function validateD(D) {
  const missing = [];
  for (const p of REQUIRED) { if (get(D, p) == null) missing.push(p); }
  for (const p of NONEMPTY) { const v = get(D, p); if (!Array.isArray(v) || v.length === 0) missing.push(p + ' (empty)'); }
  // exact-count invariants the render depends on:
  if ((get(D, 'dims') || []).length !== 10) missing.push('dims!=10');
  if ((get(D, 'geo.engines') || []).length !== 8) missing.push('geo.engines!=8');
  if ((get(D, 'geo.rootCause.chain') || []).length !== 4) missing.push('rootCause.chain!=4');
  return missing;
}
export { REQUIRED, NONEMPTY, validateD };
