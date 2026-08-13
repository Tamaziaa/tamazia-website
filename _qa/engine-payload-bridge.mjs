// _qa/engine-payload-bridge.mjs
// Bridges tamazia-audit-engine's new "supervised mint" run manifest (JSONL, minimal evidence-gated findings +
// firm identity + applicability list — NO quote text, NO SEO/GEO probes, NO firm_profile object) into the
// legacy payload shape the website's payloadToD adapter (functions/audit/_adapter.js) already knows how to
// render (see _qa/fixtures/*.json for the reference shape).
//
// HARD RULE: every law citation / penalty figure comes ONLY from the engine's own catalogue
// (catalogue/dist/catalogue.v1.json in the engine repo). Anything with no real source is set to the literal
// sentinel string "PLACEHOLDER_NO_SOURCE" (or an object/array carrying that marker) and logged to the gap list
// returned alongside the payload — never invented.
import { readFileSync } from 'node:fs';

const SENTINEL = 'PLACEHOLDER_NO_SOURCE';

function loadJsonl(path) {
  return readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function loadCatalogue(catalogueDistPath) {
  const j = JSON.parse(readFileSync(catalogueDistPath, 'utf8'));
  const recs = Array.isArray(j) ? j : (j.records || []);
  const byId = new Map();
  for (const r of recs) byId.set(r.id, r);
  return byId;
}

// scaffoldFixturePath: an existing _qa/fixtures/*.json used ONLY to supply the nested shape/keys the adapter
// expects for sections the new engine has no producer for yet (psi insight-audit rows, geo probes, keyword
// map, authority ranking, news_map, ai_citation, etc). Every value copied from the scaffold is scrubbed to the
// SENTINEL (or a neutral zero) rather than left as the donor site's real numbers — reusing another company's
// real PSI/GEO numbers under this site's name would be worse than a placeholder, it would be a fabrication.
function scrubToPlaceholder(value) {
  if (Array.isArray(value)) return value.map(scrubToPlaceholder);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrubToPlaceholder(v);
    return out;
  }
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (value === null) return null;
  return SENTINEL;
}

export function buildBridgePayload({ manifestPath, catalogueDistPath, scaffoldFixturePath, site, psiResultPath }) {
  const gaps = [];
  const realFields = [];
  const lines = loadJsonl(manifestPath);
  const catalogue = loadCatalogue(catalogueDistPath);
  const scaffold = JSON.parse(readFileSync(scaffoldFixturePath, 'utf8'));

  const runStart = lines.find((l) => l.stage === 'run_start');
  const capture = lines.find((l) => l.stage === 'capture');
  const facts = lines.find((l) => l.stage === 'facts');
  const applicability = lines.find((l) => l.stage === 'applicability');
  const findingsStage = lines.find((l) => l.findings);

  const identity = facts && facts.identity;
  const jurisdiction = facts && facts.jurisdiction;
  const sector = facts && facts.sector;
  const displayName = (identity && identity.display_name && identity.display_name.value) || null;
  const boundJur = (jurisdiction && jurisdiction.bound && jurisdiction.bound[0]) || null;
  const jurCode = boundJur ? boundJur.jurisdiction : null; // 'UK'
  const sectorVal = (sector && sector.value) || {};
  const domain = String(site || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

  if (displayName) realFields.push('firm name (engine identity.display_name, corroborated)');
  else gaps.push({ field: 'firm name', reason: 'engine identity.display_name.value was null/abstain for this run' });

  if (jurCode) realFields.push('jurisdiction (engine facts.jurisdiction.bound, tier-B/C evidence)');
  else gaps.push({ field: 'jurisdiction', reason: 'no bound jurisdiction in facts stage' });

  if (sectorVal.sector) realFields.push('sector/sub_sector (engine facts.sector)');
  else gaps.push({ field: 'sector', reason: 'no sector value in facts stage' });

  // --- pointers: one per real finding, resolved against the REAL catalogue -------------------------------
  const findings = (findingsStage && findingsStage.findings) || [];
  const uniqueRuleIds = [...new Set(findings.map((f) => f.rule_id))];
  const pointers = uniqueRuleIds.map((ruleId) => {
    const rec = catalogue.get(ruleId);
    const findingsForRule = findings.filter((f) => f.rule_id === ruleId);
    if (!rec) {
      gaps.push({ field: `pointer.${ruleId}`, reason: 'rule_id has no catalogue record in catalogue.v1.json' });
      return {
        fact: ruleId, kind: 'needs_human', state: 'NEEDS_REVIEW', bucket: 'compliance',
        citation: ruleId, citation_url: SENTINEL, fine_low_gbp: null, fine_high_gbp: null,
        evidence_quote: SENTINEL, recommendation: SENTINEL, framework_short: ruleId,
        severity: SENTINEL, layman_explanation: SENTINEL, enforcement_example: SENTINEL,
        checked_urls: [site], engine_finding_ids: findingsForRule.map((f) => f.finding_id),
      };
    }
    realFields.push(`pointer.${ruleId} citation/penalty/regulator (engine catalogue record, id=${ruleId})`);
    const penalty = rec.penalty || {};
    const enforcementEx = (rec.enforcement && rec.enforcement[0])
      ? `${rec.enforcement[0].case} (${rec.enforcement[0].date}): ${rec.enforcement[0].amount}`
      : SENTINEL;
    if (!(rec.enforcement && rec.enforcement[0])) gaps.push({ field: `pointer.${ruleId}.enforcement_example`, reason: 'catalogue record has no enforcement[] entries' });
    return {
      fact: rec.name,
      kind: 'needs_human',                 // engine class is "needs_human" — a supervisor has not signed this finding off yet
      state: 'NEEDS_REVIEW',                // honest: these are unsigned mint-gate candidates, NOT confirmed breaches
      bucket: 'compliance',
      citation: ruleId,
      citation_url: (rec.citation && rec.citation.url) || SENTINEL,
      fine_low_gbp: isFinite(penalty.typical_low) ? penalty.typical_low : null,
      fine_high_gbp: isFinite(penalty.typical_high) ? penalty.typical_high : null,
      evidence_quote: SENTINEL,             // GAP: v0 manifest stores byte_start/byte_end + sha256 span hashes
                                             // only — supervised/replay.js documents that raw bytes are NOT
                                             // persisted into the JSONL manifest, so quote TEXT cannot be
                                             // recovered from this manifest alone (would need `engine packet`
                                             // or `engine replay` against a LIVE ArtifactStore for the same site).
      recommendation: rec.website_obligations && rec.website_obligations[0] ? rec.website_obligations[0].duty : SENTINEL,
      framework_short: ruleId,
      tamazia_fix_short: rec.website_obligations && rec.website_obligations[0] ? rec.website_obligations[0].duty : SENTINEL,
      severity: 'NEEDS_HUMAN',
      layman_explanation: (rec.intel && rec.intel.why_matters) || SENTINEL,
      enforcement_example: enforcementEx,
      confidence: null,
      regulator: (rec.regulator && rec.regulator.name) || SENTINEL,
      checked_urls: [site],
      engine_finding_ids: findingsForRule.map((f) => f.finding_id),
    };
  });
  if (!catalogue.get(uniqueRuleIds[0])) {
    // already logged per-id above
  }
  gaps.push({ field: 'pointers[*].evidence_quote', reason: 'engine v0 manifest persists byte offsets + sha256 span hashes only, not raw quote text (see supervised/replay.js rehydrateArtifactStore doc) — every pointer above carries this same gap' });

  const applicableList = (applicability && applicability.applicable) || [];
  if (applicableList.length) realFields.push('applicable_frameworks (engine applicability stage, rule ids the engine judged binding for this site)');

  const pageCount = capture && capture.stageManifest && capture.stageManifest.find((s) => s.stage === 'crawl');
  if (pageCount) realFields.push('crawl coverage (pages crawled, from engine capture stage)');

  // --- scaffold everything the engine has no producer for yet, scrubbed to explicit placeholders ----------
  const scrubbedSections = [
    'scan', 'geo_probe', 'authority', 'competitive_benchmark', 'keyword_map', 'content_gap', 'ai_citation',
    'ai_readiness', 'news_map', 'geo_visuals', 'screenshots', 'via_archive', 'archive_date', 'trust_summary',
    'exec_summary', 'needs_review', 'glossary', 'rules',
  ];
  const bridged = { ...scaffold };
  for (const key of scrubbedSections) {
    if (key in scaffold) {
      bridged[key] = scrubToPlaceholder(scaffold[key]);
      gaps.push({ field: key, reason: 'no engine producer ported yet for this section — scrubbed from scaffold fixture to placeholder (never real dental-site data)' });
    }
  }

  // real PageSpeed Insights data (Google API, PAGESPEED_API_KEY from COWORK-OS-EXECUTION/.env) — the one
  // SEO/GEO-adjacent block in this bridge that IS live, real, dental-site-specific data, not a placeholder.
  if (psiResultPath) {
    try {
      const psi = JSON.parse(readFileSync(psiResultPath, 'utf8'));
      if (!psi.error) {
        const cats = psi.lighthouseResult.categories;
        const audits = psi.lighthouseResult.audits;
        bridged.scan.psi = {
          perf: cats.performance ? cats.performance.score : null,
          seo: cats.seo ? cats.seo.score : null,
          a11y: cats.accessibility ? cats.accessibility.score : null,
          best_practices: cats['best-practices'] ? cats['best-practices'].score : null,
          cls: audits['cumulative-layout-shift'] ? audits['cumulative-layout-shift'].numericValue : null,
          lcp_ms: audits['largest-contentful-paint'] ? audits['largest-contentful-paint'].numericValue : null,
          fcp_ms: audits['first-contentful-paint'] ? audits['first-contentful-paint'].numericValue : null,
          tbt_ms: audits['total-blocking-time'] ? audits['total-blocking-time'].numericValue : null,
          audits: [], // GAP: adapter expects a PSI-insight-row array shape (id/score/title/description/node_selector…);
                      // the live PSI v5 API audit objects are a DIFFERENT shape, mapping every row 1:1 was out of
                      // scope for this bridge pass — left empty rather than guessing a mapping.
          source: 'live PageSpeed Insights API v5, mobile strategy, fetched for this bridge run',
        };
        gaps.splice(gaps.findIndex((g) => g.field === 'scan'), 1); // scan.psi is now real; un-mark the blanket scrub note
        realFields.push('scan.psi core scores + CWV (perf/seo/a11y/best-practices, CLS/LCP/FCP/TBT) — LIVE PageSpeed Insights API call for thedentalpracticeuk.com');
        gaps.push({ field: 'scan.psi.audits', reason: 'PSI v5 audit-row shape differs from the fixture scaffold shape the adapter expects; left as empty array rather than guessing a field mapping' });
        gaps.push({ field: 'scan.counts / scan.markets / scan.signals / scan.reachable / scan.final_url', reason: 'still placeholder — only scan.psi was replaced with live data in this pass' });
      } else {
        gaps.push({ field: 'scan.psi', reason: `PSI API returned an error: ${JSON.stringify(psi.error)}` });
      }
    } catch (e) {
      gaps.push({ field: 'scan.psi', reason: `failed to read/parse PSI result file: ${e.message}` });
    }
  }

  bridged.domain = domain;
  bridged.country = jurCode || SENTINEL;
  bridged.sector = sectorVal.sector || SENTINEL;
  bridged.lead_id = null;
  bridged.detected_jurisdictions = jurCode === 'UK' ? ['United Kingdom'] : (jurCode ? [jurCode] : []);
  bridged.applicable_frameworks = applicableList;
  bridged.pointers = pointers;
  bridged.firm_name = displayName || SENTINEL;
  bridged.company = displayName || SENTINEL;
  bridged.engine_run = {
    engine_version: (runStart && runStart.engine_version) || SENTINEL,
    catalogue_hash: (runStart && runStart.catalogue_hash) || SENTINEL,
    pages_crawled: pageCount ? pageCount.pages : null,
    findings_count: findings.length,
    finding_kinds: (findingsStage && findingsStage.kinds) || {},
  };
  realFields.push('engine_run metadata (engine_version, catalogue_hash, pages_crawled, finding kinds — verbatim from manifest)');

  return { payload: bridged, gaps, realFields };
}
