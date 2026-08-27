// functions/audit/_v12.js
// THE v1.1 RICH-RENDER BRIDGE, second edition. A FULL REPLACEMENT for functions/audit/_v11.js.
//
// _v11.js carried the compliance half of a v1.1 mint faithfully and dropped or mislabelled almost
// everything else. Nine of the twelve diagnosed report defects trace to this one file
// (AUDIT-FINAL/01-forensics/C-defect-diagnosis.md, cross-cutting note). _v12 closes the six bridge
// doctrines in REPORT-SPEC.md §11:
//
//   B1  usablePsi accepts state === 'measured' (strips the marker, returns data) and rejects only
//       probe_unavailable. probes/index.js:56 stamps state on BOTH outcomes, so _v11 threw away every
//       SUCCESSFUL PageSpeed run. This is the single highest-leverage line in the whole report.
//   B2  trackers / ad_tech / html_bytes are carried. Where a family was never measured the bridge emits
//       an explicit not_assessed marker; the adapter must render "Not assessed on this scan" and NEVER
//       "None detected". Absence of a signal is silence, not a finding.
//   B3  one shape adapter per shape: psiToLegacy, techToLegacy, keywordsToLegacy, competitorsToLegacy
//       (share of voice rides inside competitorsToLegacy, which is where the render consumes it).
//       Each is exported and unit-tested against the golden dental fixture AND a thin 28-Jul fixture.
//   B4  count labels tell the truth: catalogue_frameworks / catalogue_rules are REGISTER totals,
//       rules_evaluated is the obligations actually evaluated on this firm. The adapter must never
//       derive rulesChecked from frameworks.length.
//   B5  false-claim suppression: an enumerated deny-list of the five known false claims, each gated on
//       its own signal family having genuinely been measured.
//   B6  meta sector / city / markets pass through from engine classification. An empty sector produces
//       not_assessed downstream, never a template keyword ("Law Firms services").
//
// NO LAW FACT IS INVENTED ANYWHERE. Every name, citation, penalty, quote, rank and rating below is
// carried verbatim from the engine payload or dropped. There is no fallback that manufactures a number:
// in particular no name-hash Domain Rating (the old estate's drFallback), no modelled DR, no invented
// catalogue total. Absent data leaves the bridge as an explicit not_assessed marker.
//
// Drop-in contract: exports v12ToD AND the v11ToD / v11ToLegacy / overlaySections names _v11.js
// exported, so functions/audit/[[path]].js:9 changes only its import specifier.
import { payloadToD } from './_adapter.js';

/* ------------------------------------------------------------------ 0. states + tiny helpers ----- */

export const MEASURED = 'measured';
export const NOT_ASSESSED = 'not_assessed';
export const PROBE_UNAVAILABLE = 'probe_unavailable';

// Every shape adapter returns the SAME envelope, so a caller (and a test) reads one shape:
//   { state:'measured',     data:<legacy-shaped object>, reason:null }
//   { state:'not_assessed', data:null,                   reason:'<why>' }
// The engine's state marker never travels inside `data`: measured data is stripped of it, so nothing
// downstream can mistake a marker for a value.
const measured = (data) => ({ state: MEASURED, data, reason: null });
const notAssessed = (reason) => ({ state: NOT_ASSESSED, data: null, reason: String(reason || 'not_probed') });

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const posInt = (v) => { const n = num(v); return n != null && n > 0 ? Math.round(n) : null; };
const firstOf = (a, b) => a || b || null;
const orNull = (v) => v || null;

// stripState(o) -> a shallow copy of o with the probe state/reason markers removed (B1: "strip the
// marker key, return data"). Never mutates the engine payload.
function stripState(o) {
  if (!isObj(o)) return null;
  const out = {};
  for (const [k, v] of Object.entries(o)) { if (k !== 'state' && k !== 'reason') out[k] = v; }
  return out;
}
// familyState(o) -> MEASURED / NOT_ASSESSED for one probe leaf. A leaf with no state marker at all is
// treated as measured ONLY when it carries content (the legacy path emits bare objects).
function familyState(o) {
  if (!isObj(o)) return NOT_ASSESSED;
  if (o.state === MEASURED) return MEASURED;
  if (o.state) return NOT_ASSESSED;                      // probe_unavailable or any other marker
  return Object.keys(o).length ? MEASURED : NOT_ASSESSED;
}
const isMeasured = (o) => familyState(o) === MEASURED;
const reasonOf = (o) => (isObj(o) && o.reason) || (isObj(o) && o.state) || null;

/* ---------------------------------------------------- 1. compliance half (carried from _v11.js) --- */
// This half worked. It is reproduced unchanged in behaviour so _v12 is a true drop-in replacement:
// the same pointers / framework_meta / binding / review_candidates the adapter already derives the
// rich regulatory exhibits from.

const penaltyBasisOf = (fw) => orNull(fw.penalty && fw.penalty.basis);
const enforcementUrlOf = (fw) => orNull(fw.enforcement && fw.enforcement.url);

// The engine emits severities implicitly (mint/composer deriveCounts): a violation on a record with a
// monetary band is critical, one without is high. Mirror that exact rule so the rich report's counts
// equal the minted counts.
function hasMonetaryBand(pen) {
  return [pen.typical_low, pen.typical_high, pen.statutory_max].some((v) => v != null);
}
function sevOfViolation(fw) {
  const pen = (fw && fw.penalty) || {};
  return hasMonetaryBand(pen) ? 'P0' : 'P1';
}
// artifact.snippet is raw crawled HTML; the report quotes TEXT. Strip tags/comments, squash whitespace.
// Never fabricates: output is a substring view of what the crawler captured.
function quoteFromArtifact(f) {
  const raw = String((f.artifact && f.artifact.snippet) || '');
  const text = raw.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length >= 12) return text.slice(0, 220);
  return raw.replace(/\s+/g, ' ').trim().slice(0, 220);   // an empty element HAS no text; quote the markup
}
function wcagSuffixOf(f) {
  const sc = f.artifact && f.artifact.wcag_sc;
  return sc ? ' (WCAG ' + sc + ')' : '';
}
function factOf(f) {
  return (String(f.description || '').trim() || 'Rule check failed') + wcagSuffixOf(f);
}
function legalIdentityOf(f, fw) {
  return {
    display_name: firstOf(f.framework, fw.name),
    regulator: firstOf(f.regulator, fw.regulator),
    provision: firstOf(f.statutory_citation, fw.citation),
    citation_url: orNull(fw.citation_url),
  };
}
function penaltyFieldsOf(pen) {
  return {
    enforce_typical_low_gbp: pen.typical_low == null ? null : pen.typical_low,
    enforce_typical_high_gbp: pen.typical_high == null ? null : pen.typical_high,
    fine_high_gbp: pen.statutory_max == null ? null : pen.statutory_max,
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
// The catalogue's own words decide whether a regime is a voluntary/self-regulatory code; never a
// hardcoded law list here.
const VOLUNTARY_RX = /self-regulat|voluntary|non-monetary|no monetary|code of (?:practice|conduct)/i;
function bindingLabelFor(fw) {
  const basisText = ((fw.penalty && fw.penalty.basis) || '') + ' ' + (fw.citation || '');
  return VOLUNTARY_RX.test(basisText) ? 'Voluntary code' : 'Binding';
}
function metaEntryOf(fw) {
  return {
    name: orNull(fw.name),
    regulator: orNull(fw.regulator),
    jurisdiction: orNull(fw.jurisdiction),
    provision: orNull(fw.citation),
    penalty: orNull(fw.penalty),
    penalty_label: penaltyBasisOf(fw),
    citation_url: orNull(fw.citation_url),
    binding_type: bindingLabelFor(fw),
  };
}
function frameworkMetaOf(frameworks) {
  const out = {};
  for (const fw of frameworks) out[fw.code] = metaEntryOf(fw);
  return out;
}
function enforcementLine(e) {
  if (!e) return null;
  const head = [e.case, e.date, e.amount].filter(Boolean).join(' · ');
  if (e.summary && head) return head + ': ' + e.summary;
  return e.summary || head || null;
}
function compactEntry(entry) {
  const out = {};
  for (const [k, v] of Object.entries(entry)) { if (v) out[k] = v; }
  return Object.keys(out).length ? out : null;
}
function joinedObligations(fw) {
  if (!Array.isArray(fw.obligations)) return null;
  return fw.obligations.length ? fw.obligations.join('\n') : null;
}
function intelEntryOf(fw) {
  return compactEntry({
    obligations: joinedObligations(fw),
    why: orNull(fw.why),
    focus: orNull(fw.focus),
    enforcement: enforcementLine(fw.enforcement),
    enforcement_url: enforcementUrlOf(fw),
  });
}
function frameworkIntelOf(frameworks) {
  const out = {};
  for (const fw of frameworks) { const e = intelEntryOf(fw); if (e) out[fw.code] = e; }
  return out;
}
function bindingMapOf(frameworks) {
  const out = {};
  for (const fw of frameworks) out[fw.code] = bindingLabelFor(fw);
  return out;
}
function complianceFieldsOf(p, frameworks, fwByCode) {
  const findings = arr(p.findings);
  const violations = findings.filter((f) => f.state === 'violation');
  const review = findings.filter((f) => f.state === 'needs_review');
  return {
    pointers: violations.map((f) => pointerFromViolation(f, fwByCode)),
    // needs_review findings surface as 'applies to you' rows and as ladder slot 2 (AT RISK), never as
    // hard breaches. review_records keeps the full finding so the ladder can name the obligation.
    review_candidates: [...new Set(review.map((f) => f.record_id))],
    review_records: review.map((f) => ({
      record_id: f.record_id,
      fact: factOf(f),
      framework: firstOf(f.framework, (fwByCode[f.record_id] || {}).name),
      page: f.page_url || null,
      penalty: (fwByCode[f.record_id] || {}).penalty || f.penalty || null,
    })),
    applicable_frameworks: frameworks.map((fw) => fw.code),
    framework_meta: frameworkMetaOf(frameworks),
    binding: bindingMapOf(frameworks),
    framework_intel: frameworkIntelOf(frameworks),
  };
}

/* ------------------------------------------------------------- 2. B1 · PageSpeed shape adapter ---- */

// usablePsi(p) -> the psi leaf when it was MEASURED, else null. THE one-line defect: probes/index.js:56
//   seoPsi(ps) { return ps.ok ? { mobile, desktop, state:'measured' } : unavailable(ps.reason); }
// stamps `state` on success too, and _v11.js:134 rejected every truthy state. Reject ONLY the
// unavailable marker.
export function usablePsi(p) {
  const psi = p && p.seo && p.seo.psi;
  if (!isObj(psi)) return null;
  if (psi.state && psi.state !== MEASURED) return null;   // probe_unavailable (or any other marker)
  return psi;
}

// A strategy leaf is real when it carries scores or at least one lab metric. A leaf that is nothing but
// a state marker is not data.
function realStrategy(s) {
  const t = stripState(s);
  if (!t) return null;
  const hasScores = isObj(t.scores) && Object.values(t.scores).some((v) => num(v) != null);
  const hasMetric = ['perf', 'seo', 'lcp_ms', 'cls', 'tbt_ms', 'fcp_ms'].some((k) => num(t[k]) != null);
  return (hasScores || hasMetric) ? t : null;
}
// psiAuditsOf(seo, primary) -> the element-level failing Lighthouse audits. The engine writes them to
// seo.psiAudits.mobile (probes/index.js:58) while the adapter reads scan.psi.audits (_adapter.js:1660);
// _v11 bridged neither. Prefer the dedicated leaf, fall back to the strategy's own audits array.
function psiAuditsOf(seo, primary) {
  const leaf = seo && seo.psiAudits;
  if (isMeasured(leaf)) {
    const t = stripState(leaf);
    const rows = arr(t.mobile).length ? arr(t.mobile) : arr(t.desktop);
    if (rows.length) return rows.map(stripState).filter(Boolean);
  }
  return arr(primary && primary.audits).map(stripState).filter(Boolean);
}
// psiCwvOf(seo) -> the per-strategy Core Web Vitals leaf when measured, else null. The blanket-copy of
// this exact leaf is what crashed the client the first time (B3's cautionary tale), so it is shaped,
// state-stripped and only ever emitted as {mobile,desktop} objects.
function psiCwvOf(seo) {
  const cwv = seo && seo.cwv;
  if (!isMeasured(cwv)) return null;
  const t = stripState(cwv);
  const m = isObj(t.mobile) ? stripState(t.mobile) : null;
  const d = isObj(t.desktop) ? stripState(t.desktop) : null;
  return (m || d) ? { mobile: m, desktop: d } : null;
}

// psiToLegacy(seo) -> envelope carrying the exact `scan.psi` shape the adapter reads:
//   flat keys  perf/seo/lcp_ms/cls/tbt_ms/fcp_ms   (_adapter.js:1152, buildCwv at :2069)
//   per-strategy mobile/desktop                    (_adapter.js:1666, buildPsiStrat at :2091)
//   audits                                         (_adapter.js:1660)
// Restores the Mobile|Desktop toggle, the four Lighthouse dials, CWV rows and the element-level audit
// list on every v1.1 report. Never invents a metric: a strategy with no numbers is dropped.
export function psiToLegacy(seo) {
  const psi = seo && seo.psi;
  if (!isObj(psi)) return notAssessed('no_psi_leaf');
  if (psi.state && psi.state !== MEASURED) return notAssessed(psi.reason || psi.state);
  const m = realStrategy(psi.mobile);
  const d = realStrategy(psi.desktop);
  if (!m && !d) return notAssessed(psi.reason || 'no_strategy_data');
  const primary = m || d;
  return measured({
    mobile: m, desktop: d,
    perf: num(primary.perf), seo: num(primary.seo),
    lcp_ms: num(primary.lcp_ms), cls: num(primary.cls), tbt_ms: num(primary.tbt_ms), fcp_ms: num(primary.fcp_ms),
    audits: psiAuditsOf(seo, primary),
    cwv: psiCwvOf(seo),
  });
}

/* -------------------------------------------- 3. B2 · signals, tracking, page weight, claim guard -- */

// One measured family into the signal bag: only state:'measured' objects contribute, and only their
// non-null facts. `false` IS a fact (a measured absence) and is carried; null is not.
function takeMeasured(sig, obj, keys, rename) {
  if (!isMeasured(obj)) return;
  for (const k of keys) {
    if (obj[k] == null) continue;
    sig[(rename && rename[k]) || k] = obj[k];
  }
}
// DOM-evidenced findings PROVE the crawler read the site even when every probe family is unprobed.
function domEvidenceCount(p) {
  return arr(p.findings).filter((f) => f.artifact && f.artifact.type === 'dom_node').length;
}
// titleSignalOf: the engine's onpage leaf carries title_len (probes/onpage-signals.js:151, from the
// crawler corpus). When the corpus had no page entry title_len is null, so the title was NOT measured
// even though the leaf as a whole was. Carry both the fact and whether it was measurable at all.
function titleSignalOf(sig, onpage) {
  if (!isMeasured(onpage)) return;
  if (onpage.title_len == null) return;                  // measured leaf, unmeasurable field
  sig.title_measured = true;
  sig.title = Number(onpage.title_len) > 0;
  sig.title_len = Number(onpage.title_len);
}

// techToLegacy(seo) -> envelope carrying the tracking family the adapter's Tech & tracking table and
// the "Tracking & consent" scored dimension read. Per-family measurement flags travel WITH the data so
// the adapter can render a measured value, a measured absence, or "Not assessed on this scan", and can
// never turn "not in the bag" into "None detected" (_adapter.js:1653, :835).
//
// Engine state today: probes/index.js shapeSeo() has NO trackers / ad_tech / page-weight leaf, so on
// every 28-Jul payload this correctly returns not_assessed. The classifier exists and is licence-clean
// (evidence/browser/oracle.js); ENGINE-ASKS.md E1/E6 wires it to seo.tracking.
export function techToLegacy(seo) {
  const s = seo || {};
  const tracking = s.tracking || s.tech_tracking || null;
  const trackingOk = isMeasured(tracking);
  const onpage = s.onpage || null;
  const bytesSource = trackingOk && num(tracking.html_bytes) != null ? tracking
    : (isMeasured(onpage) && num(onpage.html_bytes) != null ? onpage : null);

  const data = {
    trackers: trackingOk ? arr(tracking.trackers) : null,
    trackers_measured: trackingOk,
    ad_tech: trackingOk ? adTechOf(tracking) : null,
    ad_tech_measured: trackingOk,
    html_bytes: bytesSource ? num(bytesSource.html_bytes) : null,
    page_weight_measured: !!bytesSource,
    tracking_measured: trackingOk,
  };
  if (!trackingOk && !bytesSource) return notAssessed(reasonOf(tracking) || 'tracking_not_probed');
  return measured(data);
}
// adTechOf: the engine's own ad-platform shape, or the boolean the adapter reads derived from it.
// runs_ads is only ever asserted from a measured platform list; it is never guessed.
function adTechOf(tracking) {
  if (isObj(tracking.ad_tech)) return stripState(tracking.ad_tech);
  const platforms = arr(tracking.ad_platforms);
  return { runs_ads: platforms.length > 0, platforms };
}

// signalsOf(p) -> scan.signals. Adds the onpage family (title/meta/OG/canonical/viewport/lang/h1) that
// _v11 never took, plus the tracking family, plus explicit *_measured flags. Every entry is a MEASURED
// fact; the claim guard below decides which absence claims may be asserted from it.
export function signalsOf(p) {
  const seo = (p && p.seo) || {};
  const sig = {};
  takeMeasured(sig, seo.security, ['hsts', 'csp', 'xcto', 'xfo', 'refpol', 'permpol']);
  takeMeasured(sig, seo.tech, ['canonical', 'json_ld', 'favicon']);
  takeMeasured(sig, seo.a11y, ['h1_count', 'viewport', 'lang_declared'], { lang_declared: 'lang' });
  // B5 root fix: the onpage leaf ALREADY measures meta_description / open_graph / canonical / viewport /
  // lang / h1_count / favicon / json_ld (probes/onpage-signals.js:62-76, :151). _v11 took none of them,
  // which is why three of the five false claims shipped. Carrying them makes those claims TRUE claims.
  takeMeasured(sig, seo.onpage, ['meta_description', 'open_graph', 'twitter_card', 'canonical', 'viewport', 'lang', 'h1_count', 'favicon', 'json_ld', 'has_org_schema', 'word_count'], { lang: 'lang' });
  if (isMeasured(seo.onpage)) sig.onpage_measured = true;
  titleSignalOf(sig, seo.onpage);

  const tech = techToLegacy(seo);
  if (tech.state === MEASURED) {
    const t = tech.data;
    if (t.trackers_measured) { sig.trackers = t.trackers; sig.tracking_measured = true; }
    if (t.ad_tech_measured) { sig.ad_tech = t.ad_tech; sig.ad_tech_measured = true; }
    if (t.page_weight_measured) { sig.html_bytes = t.html_bytes; sig.page_weight_measured = true; }
  }
  const domNodes = domEvidenceCount(p);
  if (domNodes > 0) sig.dom_evidence_nodes = domNodes;
  return sig;
}

/* -------------------------------------------------------- 4. B5 · false-claim suppression list ----- */

// The five false claims shipping on every 28-Jul mint (B-golden-producers.md §5). Each entry names the
// signal family that MUST have been measured before the claim may be asserted. Root cause is identical
// in all five: the adapter's siteScanned gate is true while the specific signal is simply absent from
// the bag, and "absent from the bag" is read as "absent from the site".
export const FALSE_CLAIM_DENYLIST = [
  { id: 'missing_title', claim: 'Missing <title> tag', requires: ['title'], producedAt: '_adapter.js:1564' },
  { id: 'no_meta_description', claim: 'No meta description', requires: ['meta_description'], producedAt: '_adapter.js:1565' },
  { id: 'no_open_graph', claim: 'No Open Graph / social-share tags', requires: ['open_graph'], producedAt: '_adapter.js:1578' },
  { id: 'a11y_empty_title', claim: 'Empty or missing page title', requires: ['title'], producedAt: '_adapter.js:1670' },
  { id: 'trackers_none_detected', claim: 'Trackers / ad pixels: None detected', requires: ['trackers', 'ad_tech'], producedAt: '_adapter.js:1653, :835' },
];

// claimGuard(sig) -> which claim families were genuinely MEASURED on this scan. The adapter may assert
// an absence claim only where the guard is true; everywhere else it must render not-assessed.
export function claimGuard(sig) {
  const s = sig || {};
  return {
    title: s.title_measured === true,
    meta_description: s.onpage_measured === true,
    open_graph: s.onpage_measured === true,
    trackers: s.tracking_measured === true,
    ad_tech: s.ad_tech_measured === true,
    page_weight: s.page_weight_measured === true,
  };
}
// suppressedClaims(sig) -> the ids of deny-listed claims that must NOT render on this scan.
export function suppressedClaims(sig) {
  const guard = claimGuard(sig);
  return FALSE_CLAIM_DENYLIST.filter((e) => e.requires.some((r) => guard[r] !== true)).map((e) => e.id);
}

/* ------------------------------------------------------------------ 5. B3 · keyword shape adapter -- */

// A sector-template keyword is the ADAPTER's own placeholder ("Law Firms services", "Healthcare
// services", produced by categoryLabel at _adapter.js:1002-1012 and injected at :1655). It was never
// probed, so it can never carry a rank. It is banned at the bridge in both directions: by the ranker
// rule below, and belt-and-braces by this pattern.
export const TEMPLATE_KEYWORD_RX = /^[A-Z][\w&'’-]*(?:\s+[A-Z][\w&'’-]*)*\s+(?:services|solutions)$/;
const DOMAINISH_RX = /^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+$/i;
// The broken join the adapter emits when there is no leader (_adapter.js:1637 `who: ', '`).
const BROKEN_JOIN_RX = /^\s*,\s*$/;

// normaliseKeywordRow(row) -> the engine-shaped row, accepting BOTH the engine's own shape
// ({keyword,my_position,leader,leader_pos}) and the post-adapter shape ({kw,you,who,pos}), because the
// golden dental fixture only survives in the latter and the broken `who: ", "` join only exists there.
function normaliseKeywordRow(row) {
  if (!isObj(row)) return null;
  const keyword = str(row.keyword) || str(row.kw);
  const mine = row.my_position != null ? num(row.my_position) : rankFromDisplay(row.you);
  const leaderRaw = str(row.leader) || str(row.who);
  const leader = BROKEN_JOIN_RX.test(leaderRaw) ? '' : leaderRaw;
  const leaderPos = row.leader_pos != null ? num(row.leader_pos)
    : (row.leader_position != null ? num(row.leader_position) : rankFromDisplay(row.pos));
  return {
    keyword, my_position: mine, leader: leader || null, leader_pos: leaderPos,
    band: str(row.band) || null, state: str(row.state) || null,
  };
}
// "#5" -> 5, "Not ranking" -> null. Never coerces a label into a number.
function rankFromDisplay(v) {
  const s = str(v);
  const m = s.match(/^#?(\d{1,3})$/);
  return m ? Number(m[1]) : null;
}
// isRealKeywordRow: S5. A row survives ONLY when it was really probed and really carries a ranker:
// either YOUR position, or a plausible leader domain WITH the leader's position. Everything else is a
// placeholder and is dropped so the pane can state "not assessed" instead of inventing a market.
export function isRealKeywordRow(row) {
  const r = normaliseKeywordRow(row);
  if (!r || !r.keyword) return false;
  if (r.state && r.state !== MEASURED) return false;             // probe_unavailable sentinel row
  if (TEMPLATE_KEYWORD_RX.test(r.keyword)) return false;         // adapter placeholder, never probed
  const mineOk = Number.isFinite(r.my_position);
  const leaderOk = !!r.leader && DOMAINISH_RX.test(r.leader) && Number.isFinite(r.leader_pos);
  return mineOk || leaderOk;
}

// keywordsToLegacy(seo, meta) -> envelope carrying { keyword_map, keyword_leaders } in the adapter's
// input contract (_adapter.js:1628 reads km.keywords, :1690 reads cb.keyword_leaders, categoryLabel
// reads keyword_map.service_noun, meta.city reads km.city). No real probed row means NOT ASSESSED: the
// bridge never hands the adapter a row it would have to invent a market for.
export function keywordsToLegacy(seo, meta) {
  const s = seo || {};
  const summary = s.keywordSummary;
  const summaryOk = isMeasured(summary);
  const raw = arr(s.keywords).filter(isObj);
  // A sentinel row (probes/index.js:64 `{term:null,state:'probe_unavailable',reason}`) is not a query
  // that failed to rank; it is a probe that never ran. Attribute the reason to the probe, not the rows.
  const sentinel = raw.find((r) => r.state && r.state !== MEASURED);
  const probed = raw.filter((r) => (str(r.keyword) || str(r.kw)) && (!r.state || r.state === MEASURED));
  const kept = probed.filter(isRealKeywordRow).map(normaliseKeywordRow);
  if (!kept.length) {
    const why = probed.length ? 'no_real_ranked_keyword' : (reasonOf(summary) || reasonOf(sentinel) || 'keywords_not_probed');
    return notAssessed(why);
  }
  const city = summaryOk ? (str(summary.city) || null) : (str(meta && meta.city) || null);
  const serviceNoun = summaryOk ? (str(summary.service_noun) || null) : null;
  return measured({
    keyword_map: {
      ok: true, city, service_noun: serviceNoun,
      keywords: kept.map((k) => ({ keyword: k.keyword, my_position: k.my_position, leader: k.leader, leader_pos: k.leader_pos, band: k.band })),
    },
    // build.js:249's one-liner: the leader rows folded into competitive_benchmark for the rank gap.
    keyword_leaders: kept.filter((k) => k.leader && Number.isFinite(k.leader_pos))
      .map((k) => ({ keyword: k.keyword, leader: k.leader, leader_position: k.leader_pos, your_position: k.my_position })),
    dropped: probed.length - kept.length,
  });
}

/* -------------------------------------------------------------- 6. B3 · competitor shape adapter --- */

// competitorRowsOf(competitors) -> real named rivals only. The probe's own no-data sentinel
// ({name:null,state:'probe_unavailable'}, probes/index.js:164) is dropped, never rendered as a rival.
// A rival with no public Domain Rating carries dr:null + dr_state:'not_assessed'. THERE IS NO DR
// FALLBACK: the old estate's name-hash drFallback (_adapter.js:1016) fabricated 50-70 ratings and the
// new engine explicitly refuses to port it (probes/index.js:178). The bridge refuses too.
function competitorRowsOf(competitors) {
  return arr(competitors && competitors.rows).map((r) => {
    if (!isObj(r)) return null;
    const domain = str(r.domain) || str(r.name);
    if (!domain) return null;                                   // the probe_unavailable sentinel
    if (r.state === PROBE_UNAVAILABLE) return null;
    const dr = num(r.dr);
    const da100 = num(r.da_100);
    const known = dr != null || da100 != null;
    return {
      domain, name: str(r.name) || domain,
      dr: known ? dr : null,
      da_100: known ? (da100 != null ? da100 : Math.round(dr * 10)) : null,
      dr_state: known ? MEASURED : NOT_ASSESSED,
      position: num(r.position),
      source: r.state === 'named_not_scored' ? 'serp_overlap' : 'authority',
    };
  }).filter(Boolean);
}
// youDrOf: YOUR rating, measured or null. authority-gap returns you:null rather than a fabricated
// figure when OpenPageRank has no row for the domain (probes/authority-gap.js:60); honour that.
function youDrOf(competitors) {
  const y = competitors && competitors.youDr;
  if (!isMeasured(y)) return null;
  const t = stripState(y);
  const dr = num(t.dr);
  const da100 = num(t.da_100);
  if (dr == null && da100 == null) return null;
  return { dr, da_100: da100 != null ? da100 : Math.round(dr * 10), rank: num(t.rank) };
}
// sovPointerOf(p) -> the ONE pointers[] entry carrying the share-of-voice metric object the adapter
// scans for (_adapter.js:1854, /share of voice/i on pointers[].metric). The old estate emitted it from
// geo-probe.js:106; the new engine emits geo.shareOfVoice instead and nothing bridges it, so sovBar is
// absent from all four 28-Jul mints. Six lines restore the single most persuasive bar in the product.
export function sovPointerOf(p) {
  const sov = p && p.geo && p.geo.shareOfVoice;
  if (!isMeasured(sov)) return null;
  const t = stripState(sov);
  const you = num(t.value);
  if (you == null) return null;
  const samples = posInt(t.samples);
  const competitors = arr(t.top_competitors)
    .filter((c) => isObj(c) && str(c.name))
    .map((c) => ({ name: str(c.name), in_runs: num(c.in_runs), of: posInt(c.of) || samples }));
  return {
    framework_short: 'AI_SHARE_OF_VOICE', bucket: 'ai_visibility', state: 'CONFIRMED', severity: 'P3',
    fact: 'AI share of voice measured across ' + (samples || competitors.length || 0) + ' probe runs',
    metric: { label: 'AI share of voice', you, scale: 100, samples, competitors },
  };
}
// geoToLegacy(p) -> the ai_readiness + geo_probe leaves the adapter reads for entity readiness, the
// radar Entity axis, the engine grid and the AI-named competitor spine. Measured leaves only.
export function geoToLegacy(p) {
  const geo = (p && p.geo) || {};
  const er = isMeasured(geo.entityReadiness) ? stripState(geo.entityReadiness) : null;
  const sov = isMeasured(geo.shareOfVoice) ? stripState(geo.shareOfVoice) : null;
  if (!er && !sov) return notAssessed(reasonOf(geo.entityReadiness) || reasonOf(geo.shareOfVoice) || 'geo_not_probed');
  return measured({
    ai_readiness: er ? {
      score: num(er.score), blocked_ai_bots: arr(er.blocked_ai_bots), has_llms_txt: !!er.has_llms_txt,
      has_org_schema: !!er.has_org_schema, has_same_as: !!er.has_same_as, in_wikidata: !!er.in_wikidata,
    } : null,
    geo_probe: sov ? {
      share_of_voice: num(sov.value), samples: posInt(sov.samples),
      ai_knows: num(sov.value) > 0,
      top_competitors: arr(sov.top_competitors).filter((c) => isObj(c) && str(c.name))
        .map((c) => ({ name: str(c.name), in_runs: num(c.in_runs), of: posInt(c.of) })),
    } : null,
  });
}

// competitorsToLegacy(p) -> envelope carrying { authority, competitive_benchmark, pointers, rows } in
// the adapter's input contract (_adapter.js:1787 authority.ranked, :1789 authority.you.da_100, :1795
// cb.competitors, :1854 pointers[].metric). Real rows only. No rows and no share-of-voice means NOT
// ASSESSED, which C2 renders as one honest line instead of an apology and an empty chart.
export function competitorsToLegacy(p) {
  const c = (p && p.competitors) || null;
  const rows = competitorRowsOf(c);
  const you = youDrOf(c);
  const sov = sovPointerOf(p);
  const geo = geoToLegacy(p);
  const named = geo.state === MEASURED && geo.data.geo_probe ? arr(geo.data.geo_probe.top_competitors) : [];
  if (!rows.length && !sov && !named.length) {
    return notAssessed(reasonOf(c && c.rows && c.rows[0]) || reasonOf(c && c.youDr) || 'competitors_not_probed');
  }
  const scored = rows.filter((r) => r.dr_state === MEASURED);
  return measured({
    // authority.ranked is the ONLY DR source and holds measured ratings exclusively.
    authority: { ranked: scored.map((r) => ({ domain: r.domain, dr: r.dr, da_100: r.da_100 })), you },
    competitive_benchmark: {
      competitors: rows.map((r) => ({ domain: r.domain, name: r.name, position: r.position })),
      keyword_leaders: [],                          // filled by keywordsToLegacy at assembly
    },
    pointers: sov ? [sov] : [],
    // rows keeps the honest per-rival view including the unrated ones, so a renderer can show a named
    // rival with "Domain Rating not assessed" rather than a fabricated number or a missing row.
    rows,
    dr_measured: scored.length,
    dr_not_assessed: rows.length - scored.length,
  });
}

/* ------------------------------------------- 6b. N3/T3 · rule identity, counts, breach ladder ----- */

// ruleKey(p) -> the LEGAL identity of one finding, framework + the first 60 chars of its fact. C §1's
// exact key. `pointers` is one entry per failing DOM NODE, so thackraywilliams carries 15 pointers that
// are all Equality Act 2010 / WCAG 4.1.2 image-alt on 15 different <img> elements; slicing the top 3 off
// that list produced three identical cards. Dedupe on this key before any slice, ever.
export function ruleKey(p) {
  return String((p && (p.framework_short || p.citation)) || '') + '|'
    + String((p && (p.fact || p.description)) || '').toLowerCase().slice(0, 60);
}
// dedupeByRule(pointers) -> one pointer per rule, first occurrence wins (input order preserved).
export function dedupeByRule(pointers) {
  const seen = new Set();
  return arr(pointers).filter((p) => { const k = ruleKey(p); if (seen.has(k)) return false; seen.add(k); return true; });
}
const SEV_BAND = { P0: 'critical', P1: 'high', P2: 'standard', P3: 'standard' };
// ruleCountsOf(pointers) -> N3's count contract. `total` is the DEDUPED RULE count (what every headline
// and chip must use); `instances` is the failing-element count (the sub-line, "1 rule · 15 failing
// elements"). No screen may show two contradictory totals, so both are computed once, here.
export function ruleCountsOf(pointers) {
  const rules = dedupeByRule(pointers);
  const counts = { critical: 0, high: 0, standard: 0, total: rules.length, rules: rules.length, instances: arr(pointers).length };
  for (const p of rules) counts[SEV_BAND[p.severity] || 'standard']++;
  const perRule = {};
  for (const p of arr(pointers)) { const k = ruleKey(p); perRule[k] = (perRule[k] || 0) + 1; }
  counts.instancesByRule = perRule;
  return counts;
}

const SEVRANK = { P0: 0, P1: 1, P2: 2, P3: 3 };
const fineOf = (p) => Number((p && p.fine_high_gbp) || 0) || 0;
// breachLadder(legacy) -> T3's 3-slot ladder, built payload-side so any renderer shows the same truth.
//   slot 1 BREACHED              deduped confirmed pointers, severity then statutory maximum
//   slot 2 AT RISK               review_candidates, ordered by their framework's statutory maximum
//   slot 3 BINDING, NOT VERIFIED highest-penalty binding frameworks evaluated with no evidence either way
// Never two entries with one ruleKey. Fewer than 3 candidates yields fewer entries: the header is
// count-aware (T4) and the literal "three" is banned.
export function breachLadder(legacy, limit = 3) {
  const used = new Set();
  const out = [];
  const push = (entry) => {
    if (out.length >= limit || used.has(entry.ruleKey)) return;
    used.add(entry.ruleKey); out.push(entry);
  };
  const meta = (legacy && legacy.framework_meta) || {};
  const maxOf = (code) => Number((meta[code] && meta[code].penalty && meta[code].penalty.statutory_max) || 0) || 0;

  dedupeByRule(arr(legacy && legacy.pointers))
    .slice()
    .sort((a, b) => (SEVRANK[a.severity] - SEVRANK[b.severity]) || (fineOf(b) - fineOf(a)))
    .forEach((p) => push({
      state: 'BREACHED', badge: 'evidenced on your live site', ruleKey: ruleKey(p),
      framework: p.framework_short, name: p.display_name, fact: p.fact,
      page: p.page, quote: p.evidence_quote, severity: p.severity, fine_high: fineOf(p) || null,
    }));

  arr(legacy && legacy.review_records)
    .slice()
    .sort((a, b) => maxOf(b.record_id) - maxOf(a.record_id))
    .forEach((r) => push({
      state: 'AT RISK', badge: 'assessed, not asserted', ruleKey: ruleKey({ framework_short: r.record_id, fact: r.fact }),
      framework: r.record_id, name: r.framework, fact: r.fact, page: r.page,
      quote: null, severity: 'P2', fine_high: maxOf(r.record_id) || null,
    }));

  const evidenced = new Set(arr(legacy && legacy.pointers).map((p) => p.framework_short));
  const atRisk = new Set(arr(legacy && legacy.review_records).map((r) => r.record_id));
  const intel = (legacy && legacy.framework_intel) || {};
  Object.keys(meta)
    .filter((code) => !evidenced.has(code) && !atRisk.has(code))
    .filter((code) => (legacy.binding || {})[code] === 'Binding')
    .sort((a, b) => maxOf(b) - maxOf(a))
    .forEach((code) => {
      const obligation = String((intel[code] && intel[code].obligations) || '').split('\n').map(str).filter(Boolean)[0];
      if (!obligation) return;                       // no obligation text means nothing honest to show
      push({
        state: 'BINDING, NOT VERIFIED', badge: 'binds you, unproven this scan',
        ruleKey: ruleKey({ framework_short: code, fact: obligation }),
        framework: code, name: (meta[code] || {}).name, fact: obligation, page: null,
        quote: null, severity: 'P3', fine_high: maxOf(code) || null,
      });
    });

  return out;
}

/* --------------------------------------------------------------------- 7. B4 · truthful counts ----- */

// countsToLegacy(p) -> the count fields, each labelled with the unit it actually holds. C §3: _v11.js
// wrote p.rulesChecked (OBLIGATIONS EVALUATED ON THIS FIRM) into scan.catalogue_rules (THE REGISTER
// SIZE), and the adapter then printed "39 compliance rules screened" and re-derived rulesChecked from
// applicable_frameworks.length (a FRAMEWORK count printed as "rule checks executed"). Both units are
// now carried under their own names and neither is ever invented.
export function countsToLegacy(p) {
  const s = p || {};
  return {
    // register totals, provable from the compiled catalogue artifact (ENGINE-ASKS.md E2). Null until
    // the engine emits them: applicability/connect.js:20 deliberately emits no catalogueSize (C-118).
    catalogue_records: posInt(s.catalogueRecords),
    catalogue_obligations: posInt(s.catalogueObligations),
    catalogue_frameworks: posInt(s.catalogueFrameworks),
    catalogue_rules: posInt(s.catalogueRules),
    // measured on THIS firm by applicability/connect.js:405-410.
    rules_evaluated: posInt(s.rulesChecked),
    frameworks_assessed: posInt(s.frameworksAssessed),
    frameworks_binding: posInt(s.frameworksBinding),
    // the engine's own honest label (payload/composer/compose.js:388-392), which _v11 discarded.
    screened_label: str(s.screenedLabel) || null,
  };
}
const fmtInt = (n) => Number(n).toLocaleString('en-GB');
// screenedLabelOf(counts) -> R5's three-number doctrine, every number provable, or the engine's own
// numberless fallback. A "~400 rules" round number is never claimable: the v1.1 catalogue screens 129
// records / 200 obligations (renderer-truth-batch1.test.mjs:121-124 already ruled the 400+ claim false).
export function screenedLabelOf(counts) {
  const c = counts || {};
  const obligations = c.catalogue_obligations != null ? c.catalogue_obligations : c.catalogue_rules;
  const binding = c.frameworks_binding;
  const evaluated = c.rules_evaluated;
  if (posInt(obligations) && posInt(binding) && posInt(evaluated)) {
    return fmtInt(obligations) + ' obligations screened · ' + fmtInt(binding) + ' frameworks bind you · ' + fmtInt(evaluated) + ' checked on your pages';
  }
  return c.screened_label || 'Screened the catalogue';
}

/* ---------------------------------------------------------------------- 8. B6 · meta passthrough --- */

// The composer writes the literal 'not classified' when nothing bound (compose.js:279); the 28-Jul
// mints all carry an empty sector. Either way it is NOT a sector, so it must become null and trigger
// not-assessed states downstream. It must NEVER reach categoryLabel, which turns it into the
// "Law Firms services" template keyword.
const UNCLASSIFIED_RX = /^(not classified|unknown|unclassified|n\/?a|none)$/i;
export function realSector(v) {
  const s = str(v);
  if (!s || UNCLASSIFIED_RX.test(s)) return null;
  return s;
}
// cityOf: the operating city, from engine classification (meta.city, ENGINE-ASKS.md E3) or from the
// keyword-map probe's own measured city (probes/keyword-map.js:157), which is a real operating city or
// the probe abstains ('no_operating_city'). Never guessed from a domain or a corpus.
export function cityOf(p) {
  const meta = (p && p.meta) || {};
  const direct = str(meta.city);
  if (direct) return direct;
  const summary = p && p.seo && p.seo.keywordSummary;
  if (isMeasured(summary) && str(summary.city)) return str(summary.city);
  return null;
}
// marketsOf: the jurisdictions the engine actually bound (compose.js:289-291). Never a default.
export function marketsOf(p) {
  const j = (p && p.jurisdiction) || {};
  const bound = arr(j.bound).map(str).filter(Boolean);
  if (bound.length) return bound;
  const country = str((p && p.meta && p.meta.country) || '');
  return country && country !== 'not established' ? [country] : [];
}
export function metaToLegacy(p) {
  const meta = (p && p.meta) || {};
  const sector = realSector(meta.sector);
  return {
    company: orNull(str(meta.company)),
    domain: orNull(str(meta.domain)),
    country: orNull(str(meta.country) && str(meta.country) !== 'not established' ? str(meta.country) : ''),
    sector, detected_sector: sector,
    city: cityOf(p),
    detected_jurisdictions: marketsOf(p),
    firm_profile: { name: orNull(str(meta.company)), hq_country: orNull(str(meta.country)), primary_sector: sector },
  };
}

const CURRENCY_BY_COUNTRY = { US: 'USD', USA: 'USD', 'UNITED STATES': 'USD', UK: 'GBP', GB: 'GBP', 'UNITED KINGDOM': 'GBP', AE: 'AED', UAE: 'AED' };
function currenciesOf(meta) {
  const c = CURRENCY_BY_COUNTRY[String((meta && meta.country) || '').toUpperCase()];
  return c ? [c] : ['GBP'];
}

/* -------------------------------------------------------------------------- 9. assembly ----------- */

// notAssessedMap: the explicit markers the adapter/renderer read to say "Not assessed on this scan".
// A family absent from this map was measured; a family present carries the reason it was not.
function notAssessedMap(parts) {
  const out = {};
  for (const [k, env] of Object.entries(parts)) { if (env && env.state === NOT_ASSESSED) out[k] = env.reason; }
  return out;
}

function scanFieldsOf(p, legacyMeta, parts, counts) {
  const signals = signalsOf(p);
  return {
    scan: Object.assign({
      signals,
      final_url: legacyMeta.domain ? 'https://' + legacyMeta.domain : null,
      markets: { currencies: currenciesOf(legacyMeta) },
      psi: parts.psi.state === MEASURED ? parts.psi.data : null,
      // B2/B5: what was NOT measured, said out loud, so no renderer has to infer it from a gap.
      not_assessed: notAssessedMap(parts),
      claim_guard: claimGuard(signals),
      suppressed_claims: suppressedClaims(signals),
      screened_label: screenedLabelOf(counts),
    }, counts),
    pages_crawled: [],
    compliance_unassessed: false,
    framework_last_reviewed: (p.meta && p.meta.date) || null,
  };
}

// v12ToLegacy(p) -> the adapter-input payload derived from a v1.1 mint. Compliance lattice + every
// probe family that a shape adapter could map, each guarded on a MEASURED state.
export function v12ToLegacy(p) {
  const payload = p || {};
  const frameworks = arr(payload.frameworks);
  const fwByCode = {};
  for (const fw of frameworks) fwByCode[fw.code] = fw;

  const legacyMeta = metaToLegacy(payload);
  const counts = countsToLegacy(payload);
  const parts = {
    psi: psiToLegacy(payload.seo),
    tracking: techToLegacy(payload.seo),
    keywords: keywordsToLegacy(payload.seo, { city: legacyMeta.city }),
    competitors: competitorsToLegacy(payload),
    geo: geoToLegacy(payload),
  };

  const compliance = complianceFieldsOf(payload, frameworks, fwByCode);
  const out = Object.assign(
    {
      company: legacyMeta.company, domain: legacyMeta.domain, country: legacyMeta.country,
      sector: legacyMeta.sector, detected_sector: legacyMeta.detected_sector,
      detected_jurisdictions: legacyMeta.detected_jurisdictions,
      firm_profile: legacyMeta.firm_profile,
    },
    compliance,
    scanFieldsOf(payload, legacyMeta, parts, counts)
  );
  // N3 + T3, computed ONCE payload-side so no renderer can disagree with another.
  out.rule_counts = ruleCountsOf(compliance.pointers);
  out.breach_ladder = breachLadder(Object.assign({}, compliance, { binding: compliance.binding }));
  out.scan.rule_counts = out.rule_counts;

  // Probe overlays, each only when its shape adapter reported MEASURED.
  if (parts.keywords.state === MEASURED) {
    out.keyword_map = parts.keywords.data.keyword_map;
  } else if (legacyMeta.city) {
    out.keyword_map = { ok: false, city: legacyMeta.city, keywords: [], not_assessed: parts.keywords.reason };
  }
  if (parts.competitors.state === MEASURED) {
    const cd = parts.competitors.data;
    out.authority = cd.authority;
    out.competitive_benchmark = Object.assign({}, cd.competitive_benchmark, {
      keyword_leaders: parts.keywords.state === MEASURED ? parts.keywords.data.keyword_leaders : [],
    });
    out.competitor_rows = cd.rows;
    if (cd.pointers.length) out.pointers = out.pointers.concat(cd.pointers);
  } else if (parts.keywords.state === MEASURED && parts.keywords.data.keyword_leaders.length) {
    out.competitive_benchmark = { competitors: [], keyword_leaders: parts.keywords.data.keyword_leaders };
  }
  if (parts.geo.state === MEASURED) {
    if (parts.geo.data.ai_readiness) out.ai_readiness = parts.geo.data.ai_readiness;
    if (parts.geo.data.geo_probe) out.geo_probe = parts.geo.data.geo_probe;
  }
  out._bridge = { version: 'v12', states: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v.state])) };
  return out;
}

/* --------------------------------------------------------------- 10. honest-dims overlay ---------- */

// The v1.1 probes never measure page depth, and the legacy dim formulas read a missing input as a
// failing one. Those dims state the truth instead: not assessed on this scan. _v12 narrows the blanket
// from _v11: `seo` and `content` are only downgraded when the onpage family really was unmeasured,
// because that family now genuinely carries title/meta/OG.
function unmeasuredDimKeys(p) {
  const seo = (p && p.seo) || {};
  const keys = new Set();
  if (!isMeasured(seo.onpage)) { keys.add('seo'); keys.add('content'); }
  if (!isMeasured(seo.security)) keys.add('security');
  if (!isMeasured(seo.tech) || !isMeasured(seo.a11y)) keys.add('technical_seo');
  const tracking = techToLegacy(seo);
  if (tracking.state !== MEASURED || tracking.data.tracking_measured !== true) keys.add('tracking');
  return keys;
}
function dimsHonesty(D, p) {
  const unmeasured = unmeasuredDimKeys(p);
  for (const d of arr(D && D.dims)) {
    if (!unmeasured.has(d.key)) continue;
    d.st = 'na';
    d.v = null;
    d.sub = 'not assessed on this scan';
  }
}
function realGlossaryOf(p) {
  const g = p && p.glossary;
  if (!isObj(g)) return null;
  return g.state ? null : g;
}
export function overlaySections(D, p) {
  const glossary = realGlossaryOf(p);
  if (glossary) D.glossary = glossary;
  dimsHonesty(D, p);
  // Carry the bridge's own truth-state onto D so the renderer never has to infer a gap.
  const legacy = D && D._bridge ? D._bridge : null;
  if (!legacy) D._bridge = { version: 'v12' };
  return D;
}

// v12ToD(p, ctx) -> the full rich-report D for a v1.1 payload. ctx.verified is forced true on this
// path: a v1.1 payload only exists because the mint's own evidence gates passed (quote-verify gate +
// post-write assertions); the render-side sanitiser polices LEGACY rows that never went through those
// gates, and running it here would strip engine-verified evidence.
export function v12ToD(p, ctx) {
  const legacy = v12ToLegacy(p);
  const D = payloadToD(legacy, Object.assign({}, ctx, { verified: true }));
  D._bridge = legacy._bridge;
  return overlaySections(D, p);
}

// Drop-in aliases: functions/audit/[[path]].js:9 imports v11ToD today.
export const v11ToLegacy = v12ToLegacy;
export const v11ToD = v12ToD;
