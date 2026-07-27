// functions/audit/_sanitise.js
// E-218: the render-side sanitiser for verified!==true rows, extracted whole from _adapter.js.
// Mirrors the engine's evidence gates (E-041/E-044, V05 absence-proof, V09 fine discipline,
// P-011 template-accusation threshold) over the STORED payload, so the public page can never
// assert more than the evidence carries. Pure; never throws (any error returns the input).
import { narrowAllowSet, familyAllowed } from './_lawmaps.js';
import { keepUnverifiedPointer } from './_sanitise-rules.js';

const arr = (x) => (Array.isArray(x) ? x : []);

// E-218 sanitiser helpers - each membrane rule is a single-purpose pass so the whole
// pipeline stays flat and auditable. Behaviour is identical to the previous inline version.
// The screened/'applies to you' layer makes applicability CLAIMS, so it takes the same family
// filter: a US firm's unverified page must not list UK statutes even as screened rows.
const fwKeyOf = (f) => (f && (f.framework_short || f.code)) || f;
const ruleKeyOf = (r) => (r && (r.framework_short || r.framework)) || '';
const reviewKeyOf = (r) => (r && (r.framework_short || r.citation)) || '';
const FAMILY_LISTS = [
  ['applicable_frameworks', fwKeyOf],
  ['frameworks', fwKeyOf],
  ['rules', ruleKeyOf],
  ['needs_review', reviewKeyOf],
];
function filterBindingMap(out, p, famOK) {
  if (!p.binding || typeof p.binding !== 'object') return;
  const b = {};
  for (const [k, v] of Object.entries(p.binding)) if (famOK(k)) b[k] = v;
  out.binding = b;
}
function applyFamilyFilters(out, p, allowNarrow) {
  const famOK = (code) => familyAllowed(String(code || ''), allowNarrow);
  for (const [key, keyOf] of FAMILY_LISTS) {
    if (Array.isArray(p[key])) out[key] = p[key].filter((item) => famOK(keyOf(item)));
  }
  filterBindingMap(out, p, famOK);
}
// S-183 predicate: a legacy row with zero pages and zero surviving findings was never assessed.
function neverAssessed(p, kept, out) {
  if (arr(p.pages_crawled).length) return false;
  if (kept.length) return false;
  return out.compliance_unassessed !== true;
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
    if (neverAssessed(p, KEEP, out)) out.compliance_unassessed = true;
    out._sanitised = Object.assign({ applied: true }, dropped);
    // authJurisdictions honours this narrow set, so the screened-injection floor, the jurisdiction
    // selector and the membrane all agree on scope for an unverified row.
    out._allow_narrow = [...allowNarrow];
    return out;
  } catch (_e) { return p; }
}
