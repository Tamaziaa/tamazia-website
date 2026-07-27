// functions/audit/_sanitise.js
// E-218: the render-side sanitiser for verified!==true rows, extracted whole from _adapter.js.
// Mirrors the engine's evidence gates (E-041/E-044, V05 absence-proof, V09 fine discipline,
// P-011 template-accusation threshold) over the STORED payload, so the public page can never
// assert more than the evidence carries. Pure; never throws (any error returns the input).
import { FW_JUR } from './_lawmaps.js';

const arr = (x) => (Array.isArray(x) ? x : []);

// E-218 sanitiser helpers - each membrane rule is a single-purpose pass so the whole
// pipeline stays flat and auditable. Behaviour is identical to the previous inline version.
const _SAN_CMAP = { USA: 'US', UAE: 'AE', KSA: 'SA', GBR: 'UK', GB: 'UK' };
const _SAN_EU = ['FR', 'DE', 'IT', 'ES', 'NL', 'IE', 'BE', 'PT', 'AT', 'SE', 'DK', 'FI', 'PL', 'LU', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT'];
// V02/P-003 render-side: on an UNVERIFIED row only the REGISTERED country's family (+ EU when a
// member state) and GLOBAL law render; a verified fresh mint restores the full set.
function narrowAllowSet(p) {
  const cc0 = String(p.country || '').toUpperCase();
  const cc = _SAN_CMAP[cc0] || cc0;
  const allow = new Set(['GLOBAL']);
  if (cc) allow.add(cc);
  if (_SAN_EU.includes(cc)) allow.add('EU');
  return allow;
}
function familyAllowed(code, allowNarrow) {
  if (!code) return true;
  const j = FW_JUR(code);
  return j === 'GLOBAL' || allowNarrow.has(j);
}
// V05/P-004: an absence claim is valid only with a proving page (the page that SHOULD have carried it).
function absenceHasProof(x) {
  const ae = x.absence_evidence;
  return Boolean((ae && (ae.target_url || ae.pages_checked)) || arr(x.checked_urls).length || x.proof_url || x.page);
}
// Per-pointer field accessors + single-purpose predicates - one membrane rule each.
const fwOf = (x) => String(x.framework_short || x.framework || x.citation || '');
const factOf = (x) => String(x.fact || x.description || '');
const quoteOf = (x) => String(x.evidence_quote || x.evidence_snippet || '').trim();
const isAbsence = (x) => x.kind === 'absence' || x.status === 'miss';
// P-011: a "site compromised / injected spam" accusation must quote the injected URLs verbatim,
// or it is boilerplate that must never blind-render against a named firm.
function isTemplateAccusation(x) {
  if (!/SITE_INTEGRITY|SUSPECTED_COMPROMISE/i.test(fwOf(x) + ' ' + String(x.code || ''))) return false;
  return !/https?:\/\//i.test(quoteOf(x));
}
// E-041: a presence claim anchored only on a sub-25-char fragment is not evidence.
function shortEvidence(x) {
  const q = quoteOf(x);
  if (!q || q.length >= 25) return false;
  return !arr(x.checked_urls).length;
}
const hasTypicalBand = (x) => Boolean(+x.enforce_typical_low_gbp || +x.enforce_typical_high_gbp);
// The membrane, as an ordered rule list: first drop-reason that fires wins.
const DROP_RULES = [
  ['malformed', (x) => !fwOf(x) && !factOf(x)],
  ['foreign_family', (x, allowNarrow) => !familyAllowed(fwOf(x), allowNarrow)],
  ['template_accusation', (x) => isTemplateAccusation(x)],
  ['absence_no_proof', (x) => isAbsence(x) && !absenceHasProof(x)],
  ['short_evidence', (x) => !isAbsence(x) && shortEvidence(x)],
];
// One pointer through every membrane rule; returns the sanitised pointer or null (and counts the drop).
function keepUnverifiedPointer(x, allowNarrow, dropped) {
  if (!x || typeof x !== 'object') { dropped.malformed++; return null; }
  for (const [reason, fires] of DROP_RULES) {
    if (fires(x, allowNarrow)) { dropped[reason]++; return null; }
  }
  // P-008: on an unverified row, statutory-maximum ceilings are withheld unless the engine supplied
  // a calibrated typical-enforcement band. The finding still renders; the scare number does not.
  const y = Object.assign({}, x);
  if (!hasTypicalBand(y)) y.fine_withheld = true;
  return y;
}
// The screened/'applies to you' layer makes applicability CLAIMS, so it takes the same family
// filter: a US firm's unverified page must not list UK statutes even as screened rows.
function applyFamilyFilters(out, p, allowNarrow) {
  const famOK = (code) => familyAllowed(String(code || ''), allowNarrow);
  const fwOf = (f) => (f && (f.framework_short || f.code)) || f;
  if (Array.isArray(p.applicable_frameworks)) out.applicable_frameworks = p.applicable_frameworks.filter((f) => famOK(fwOf(f)));
  if (Array.isArray(p.frameworks)) out.frameworks = p.frameworks.filter((f) => famOK(fwOf(f)));
  if (Array.isArray(p.rules)) out.rules = p.rules.filter((r) => famOK((r && (r.framework_short || r.framework)) || ''));
  if (p.binding && typeof p.binding === 'object') {
    const b = {};
    for (const [k, v] of Object.entries(p.binding)) if (famOK(k)) b[k] = v;
    out.binding = b;
  }
  if (Array.isArray(p.needs_review)) out.needs_review = p.needs_review.filter((r) => famOK((r && (r.framework_short || r.citation)) || ''));
}
// E-218: render-side sanitiser for verified!==true rows. Mirrors the engine's evidence gates
// (E-041/E-044, V05 absence-proof, V09 fine discipline, P-011 template-accusation threshold) over
// the STORED payload, so the public page can never assert more than the evidence carries.
// Pure; never throws (any error returns the input).
export function sanitiseUnverified(p) {
  try {
    p = p || {};
    const out = Object.assign({}, p);
    const dropped = { absence_no_proof: 0, short_evidence: 0, template_accusation: 0, malformed: 0, foreign_family: 0 };
    const allowNarrow = narrowAllowSet(p);
    const KEEP = [];
    for (const x of arr(p.pointers)) {
      const y = keepUnverifiedPointer(x, allowNarrow, dropped);
      if (y) KEEP.push(y);
    }
    out.pointers = KEEP;
    applyFamilyFilters(out, p, allowNarrow);
    // S-183: a legacy row with zero pages and zero surviving findings was never assessed - say so.
    if (!arr(p.pages_crawled).length && !KEEP.length && out.compliance_unassessed !== true) out.compliance_unassessed = true;
    out._sanitised = Object.assign({ applied: true }, dropped);
    // authJurisdictions honours this narrow set, so the screened-injection floor, the jurisdiction
    // selector and the membrane all agree on scope for an unverified row.
    out._allow_narrow = [...allowNarrow];
    return out;
  } catch (_e) { return p; }
}
