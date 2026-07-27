// functions/audit/_sanitise-rules.js
// The per-pointer membrane rules for unverified rows (E-041 / V05 / P-008 / P-011), one
// single-purpose predicate per rule, composed as an ordered DROP_RULES list. The orchestrator
// (_sanitise.js) walks the list; nothing else imports these.
import { familyAllowed } from './_lawmaps.js';

const arr = (x) => (Array.isArray(x) ? x : []);

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
export function keepUnverifiedPointer(x, allowNarrow, dropped) {
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
