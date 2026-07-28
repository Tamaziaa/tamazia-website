// functions/audit/_v11.js
// THE v1.1 RICH-RENDER BRIDGE. The new engine's v1.1 payloads previously routed to the sparse
// lux shell while stored legacy payloads got the full report (rail, severe trio, heatmap, the
// regulatory exhibits with fine/why/how). Same product, two looks - the founder called the lux
// look correctly: wrong. This module maps a v1.1 payload's COMPLIANCE half into the exact input
// contract payloadToD already derives the rich report from (pointers / framework_meta / binding /
// review_candidates / scan), lets the battle-tested adapter do every derivation it already does
// (fines, severity bars, exhibits, exposure, dims), then overlays the v1.1 probe sections
// (seo/geo/competitors), which the mint's probe lane already emits in the render contract's own
// shapes. No law fact is invented anywhere: every name, citation, penalty and quote below is
// carried verbatim from the engine payload.
import { payloadToD } from './_adapter.js';

// The engine emits severities implicitly (mint/composer deriveCounts): a violation on a record
// with a monetary band is critical, a violation without one is high. Mirror that exact rule so
// the rich report's counts equal the minted counts.
function sevOfViolation(fw) {
  const pen = (fw && fw.penalty) || {};
  const banded = pen.typical_low != null || pen.typical_high != null || pen.statutory_max != null;
  return banded ? 'P0' : 'P1';
}

// artifact.snippet is raw crawled HTML; the report quotes TEXT. Strip tags/comments, squash
// whitespace. Never fabricates - output is a substring view of what the crawler captured.
function quoteFromArtifact(f) {
  const raw = String((f.artifact && f.artifact.snippet) || '');
  const text = raw.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length >= 12) return text.slice(0, 220);
  // an empty element (e.g. a nameless link) HAS no text; quote the markup itself, tags intact
  return raw.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function factOf(f) {
  const d = String(f.description || '').trim();
  const sc = f.artifact && f.artifact.wcag_sc ? ' (WCAG ' + f.artifact.wcag_sc + ')' : '';
  return d ? d + sc : ('Rule check failed' + sc);
}

const numOrNull = (v) => (v == null ? null : v);
// The legal identity of one violation: finding fields first, its framework card as fallback -
// every value verbatim from the engine payload.
function legalIdentityOf(f, fw) {
  return {
    display_name: f.framework || fw.name || null,
    regulator: f.regulator || fw.regulator || null,
    provision: f.statutory_citation || fw.citation || null,
    citation_url: fw.citation_url || null,
  };
}
// The catalogue's penalty numbers for one violation, in the adapter's field names.
function penaltyFieldsOf(pen) {
  return {
    enforce_typical_low_gbp: numOrNull(pen.typical_low),
    enforce_typical_high_gbp: numOrNull(pen.typical_high),
    fine_high_gbp: numOrNull(pen.statutory_max),
    enforce_context: pen.basis || null,
  };
}
function evidenceFieldsOf(f) {
  return {
    fact: factOf(f),
    evidence_quote: quoteFromArtifact(f),
    page: f.page_url || null,
    checked_urls: f.page_url ? [f.page_url] : [],
  };
}
function pointerFromViolation(f, fwByCode) {
  const fw = fwByCode[f.record_id] || {};
  const pen = f.penalty || fw.penalty || {};
  return Object.assign(
    { framework_short: f.record_id, bucket: 'compliance', state: 'CONFIRMED', severity: sevOfViolation({ penalty: pen }) },
    legalIdentityOf(f, fw),
    penaltyFieldsOf(pen),
    evidenceFieldsOf(f)
  );
}

// The catalogue's own words decide whether a regime is a voluntary/self-regulatory code (the
// FIX-R1 guard then shows "non-statutory" instead of a fine) - never a hardcoded law list here.
const VOLUNTARY_RX = /self-regulat|voluntary|non-monetary|no monetary|code of (?:practice|conduct)/i;
function bindingLabelFor(fw) {
  const basisText = ((fw.penalty && fw.penalty.basis) || '') + ' ' + (fw.citation || '');
  return VOLUNTARY_RX.test(basisText) ? 'Voluntary code' : 'Binding';
}

// scan.signals from the probe lane's MEASURED facts only (state:"measured" families). security.*
// booleans are real header observations (false = genuinely absent, a true claim); tech/a11y carry
// canonical/json_ld/h1/lang/viewport. Families the v1.1 probes do NOT measure (title, meta
// description, Open Graph, page bytes) are deliberately absent - dimsHonesty() below marks those
// dims "not assessed" rather than let a missing input read as a failing site.
function signalsOf(p) {
  const seo = p.seo || {};
  const sig = {};
  const take = (obj, keys, rename) => {
    if (!obj || obj.state !== 'measured') return;
    for (const k of keys) {
      if (obj[k] == null) continue;
      sig[(rename && rename[k]) || k] = obj[k];
    }
  };
  take(seo.security, ['hsts', 'csp', 'xcto', 'xfo', 'refpol', 'permpol']);
  take(seo.tech, ['canonical', 'json_ld', 'favicon']);
  take(seo.a11y, ['h1_count', 'viewport', 'lang_declared'], { lang_declared: 'lang' });
  // Even when every probe family is unprobed, DOM-evidenced findings PROVE the crawler read the
  // site - record that real observation so the adapter's siteScanned gate reflects the truth
  // (without it, a probe outage would hide every clean-but-binding framework row).
  const domNodes = (Array.isArray(p.findings) ? p.findings : [])
    .filter((f) => f.artifact && f.artifact.type === 'dom_node').length;
  if (domNodes > 0) sig.dom_evidence_nodes = domNodes;
  return sig;
}

function usablePsi(p) {
  const psi = p.seo && p.seo.psi;
  if (!psi || typeof psi !== 'object') return null;
  if (psi.state) return null;   // probe_unavailable marker, never data
  return psi;
}
const CURRENCY_BY_COUNTRY = { US: 'USD', USA: 'USD', UK: 'GBP', GB: 'GBP', AE: 'AED', UAE: 'AED' };
function currenciesOf(meta) {
  const c = CURRENCY_BY_COUNTRY[String((meta && meta.country) || '').toUpperCase()];
  return c ? [c] : ['GBP'];
}

function frameworkMetaOf(frameworks) {
  const out = {};
  for (const fw of frameworks) {
    out[fw.code] = {
      name: fw.name || null,
      regulator: fw.regulator || null,
      jurisdiction: fw.jurisdiction || null,
      provision: fw.citation || null,
      penalty: fw.penalty || null,
      penalty_label: (fw.penalty && fw.penalty.basis) || null,
      citation_url: fw.citation_url || null,
      binding_type: bindingLabelFor(fw),
    };
  }
  return out;
}

function enforcementLine(e) {
  if (!e) return null;
  const parts = [e.case, e.date, e.amount].filter(Boolean);
  const head = parts.join(' \u00b7 ');
  if (e.summary && head) return head + ': ' + e.summary;
  return e.summary || head || null;
}
function frameworkIntelOf(frameworks) {
  const out = {};
  for (const fw of frameworks) {
    const entry = {};
    if (Array.isArray(fw.obligations) && fw.obligations.length) entry.obligations = fw.obligations.join('\n');
    if (fw.why) entry.why = fw.why;
    if (fw.focus) entry.focus = fw.focus;
    const enf = enforcementLine(fw.enforcement);
    if (enf) entry.enforcement = enf;
    if (fw.enforcement && fw.enforcement.url) entry.enforcement_url = fw.enforcement.url;
    if (Object.keys(entry).length) out[fw.code] = entry;
  }
  return out;
}
function bindingMapOf(frameworks) {
  const out = {};
  for (const fw of frameworks) out[fw.code] = bindingLabelFor(fw);
  return out;
}

// v11ToLegacy(p) -> the adapter-input payload derived from a v1.1 mint. Compliance only; the
// probe sections ride through overlaySections() untouched.
// One field group per builder: firm identity, the compliance lattice, and the scan facts.
function firmFieldsOf(meta) {
  return {
    company: meta.company || null,
    domain: meta.domain || null,
    country: meta.country || null,
    firm_profile: { name: meta.company || null, hq_country: meta.country || null, primary_sector: meta.sector || null },
  };
}
function complianceFieldsOf(p, frameworks, fwByCode) {
  const findings = Array.isArray(p.findings) ? p.findings : [];
  const violations = findings.filter((f) => f.state === 'violation');
  const review = findings.filter((f) => f.state === 'needs_review');
  return {
    pointers: violations.map((f) => pointerFromViolation(f, fwByCode)),
    // needs_review findings surface as 'applies to you' framework rows, never hard breaches
    review_candidates: [...new Set(review.map((f) => f.record_id))],
    applicable_frameworks: frameworks.map((fw) => fw.code),
    framework_meta: frameworkMetaOf(frameworks),
    binding: bindingMapOf(frameworks),
    framework_intel: frameworkIntelOf(frameworks),
  };
}
function scanFieldsOf(p, meta) {
  return {
    scan: {
      signals: signalsOf(p),
      final_url: meta.domain ? 'https://' + meta.domain : null,
      catalogue_frameworks: p.frameworksAssessed || (Array.isArray(p.frameworks) ? p.frameworks.length : 0),
      catalogue_rules: p.rulesChecked || null,
      markets: { currencies: currenciesOf(meta) },
      psi: usablePsi(p),
    },
    pages_crawled: [],
    compliance_unassessed: false,
    framework_last_reviewed: meta.date || null,
  };
}
// v11ToLegacy(p) -> the adapter-input payload derived from a v1.1 mint. Compliance only; probe
// sections are deliberately not blanket-copied (see below).
export function v11ToLegacy(p) {
  const meta = p.meta || {};
  const frameworks = Array.isArray(p.frameworks) ? p.frameworks : [];
  const fwByCode = {};
  for (const fw of frameworks) fwByCode[fw.code] = fw;
  return Object.assign(
    firmFieldsOf(meta),
    complianceFieldsOf(p, frameworks, fwByCode),
    scanFieldsOf(p, meta)
  );
}

// Probe-section overlays are deliberately NOT blanket-copied: the v1.1 probe shapes carry
// state-markers ({state:"probe_unavailable"}) and family shapes the legacy panes do not consume
// (the first blanket attempt crashed the client on seo.cwv). The adapter's own thin-payload
// defaults are battle-tested and honest ("not assessed", never invented); the measured facts that
// ARE shape-safe ride through scan.signals / scan.psi above. Deep per-shape mapping of keywords /
// share-of-voice / competitor probes is a follow-up, one shape adapter at a time.
// The v1.1 probes never measure titles/meta descriptions/Open Graph/page depth, and the legacy
// dim formulas read a missing input as a failing one ("no title" against a site that has titles).
// Those two dims state the truth instead: not assessed on this scan.
const measuredFamily = (obj) => Boolean(obj && obj.state === 'measured');
function unmeasuredDimKeys(p) {
  const seo = p.seo || {};
  const keys = new Set(['seo', 'content']);   // titles/meta/OG/page depth: never probed on v1.1
  if (!measuredFamily(seo.security)) keys.add('security');
  if (!(measuredFamily(seo.tech) && measuredFamily(seo.a11y))) keys.add('technical_seo');
  return keys;
}
function dimsHonesty(D, p) {
  const unmeasured = unmeasuredDimKeys(p);
  for (const d of (D.dims || [])) {
    if (!unmeasured.has(d.key)) continue;
    d.st = 'na';
    d.v = null;
    d.sub = 'not assessed on this scan';
  }
}

export function overlaySections(D, p) {
  if (p.glossary && typeof p.glossary === 'object' && !p.glossary.state) D.glossary = p.glossary;
  dimsHonesty(D, p);
  return D;
}

// v11ToD(p, ctx) -> the full rich-report D for a v1.1 payload. ctx.verified is forced true on
// this path: a v1.1 payload only exists because the mint's own evidence gates passed (quote-verify
// gate + post-write assertions); the render-side sanitiser exists to police LEGACY rows that never
// went through those gates, and running it here would strip engine-verified evidence.
export function v11ToD(p, ctx) {
  const D = payloadToD(v11ToLegacy(p), Object.assign({}, ctx, { verified: true }));
  return overlaySections(D, p);
}
