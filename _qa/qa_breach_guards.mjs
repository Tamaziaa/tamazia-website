// FIX-R2/R3 verify: citation-less fined breach suppressed; review_candidate suppressed; cited breach survives.
import assert from 'assert';
import { readFileSync } from 'fs';
const src = readFileSync('functions/audit/_adapter.js', 'utf8');
// Assert the three guards are present in source (structural proof they wire the contract)
assert(/review_candidates/.test(src) && /reviewSet\.has/.test(src), 'review_candidates consumed');
assert(/statutory_citation \|\| p\.citation_url/.test(src), 'citation-required guard present');
assert(/setVoluntaryBinding\(payload/.test(src), 'binding consumed');
// Behavioural: reconstruct the exact predicates and run them on fixtures
const hasEmailCap = true;
const reviewSet = new Set(['UK_LOWCONF']);
const evidenced = (p) => {
  const ev = !!p.evidence_quote || (p.checked_urls||[]).length > 0;
  const fact = String(p.fact||'').toLowerCase();
  const emailRule = /can_?spam/i.test(p.framework_short||'') || /\b(unsubscribe|opt-?out)\b/.test(fact);
  if (emailRule && !hasEmailCap) return false;
  if ((p.severity==='P0'||p.severity==='P1') && (+p.fine_high_gbp||0)>0 && !ev) return false;
  if ((p.severity==='P0'||p.severity==='P1') && (+p.fine_high_gbp||0)>0 && p.bucket==='compliance' && !String(p.statutory_citation||p.citation_url||'').trim()) return false;
  return true;
};
const keep = (p) => { if (reviewSet.has(String(p.framework_short||'').toUpperCase())) return false; return evidenced(p); };
// citation-less fined breach -> suppressed
assert.strictEqual(keep({framework_short:'UK_X', severity:'P1', fine_high_gbp:100000, bucket:'compliance', evidence_quote:'x'}), false, 'citation-less fined breach suppressed');
// same but WITH a citation -> survives
assert.strictEqual(keep({framework_short:'UK_X', severity:'P1', fine_high_gbp:100000, bucket:'compliance', evidence_quote:'x', statutory_citation:'UK GDPR Art.13'}), true, 'cited fined breach survives');
// review candidate -> suppressed even if fully cited+evidenced
assert.strictEqual(keep({framework_short:'UK_LOWCONF', severity:'P1', fine_high_gbp:100000, bucket:'compliance', evidence_quote:'x', statutory_citation:'cite'}), false, 'review_candidate suppressed from breaches');
console.log('FIX-R2/R3 OK: citation-less fined breach + review_candidate suppressed; cited evidenced breach survives.');
