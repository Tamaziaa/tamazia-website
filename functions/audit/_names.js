// functions/audit/_names.js
// Firm-name hygiene, extracted whole from _adapter.js: the domain stem, entity decoding (FIX-R4
// XSS discipline preserved verbatim), the title-vs-name guards (NAME-01 family) and the
// Companies-House SHOUTING-name humaniser. Pure string logic; no payload shaping.
import { cleanDomain } from './_competitors.js';

// Multi-part public suffixes we must strip WHOLE, otherwise the brand stem keeps a TLD fragment
// (e.g. "greystar.co.uk" -> stem must be "greystar", never "greystar.co"). Single-label TLDs are
// stripped by dropping the last label.
const MULTI_TLD = /\.(co|com|org|net|gov|edu|ac|ltd|plc)\.[a-z]{2}$/i;
// The clean brand STEM of a domain with the TLD removed: "monzo.com" -> "monzo",
// "greystar.co.uk" -> "greystar", "thirdspace.london" -> "thirdspace". Never returns a "*.com" fragment.
export function domainStem(d) {
  let h = cleanDomain(d).toLowerCase();
  if (!h) return '';
  h = h.replace(MULTI_TLD, '');           // drop .co.uk / .com.au / .org.uk … as a unit
  const parts = h.split('.').filter(Boolean);
  if (parts.length > 1) parts.pop();      // drop a remaining single-label TLD (.com, .london, .ae)
  return (parts.pop() || h).replace(/[^a-z0-9 &+'-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
// The displayed firm name. A real name from firm_profile wins; a caller-supplied `company` wins next, 
// UNLESS it is itself a bare TLD-bearing domain (the "Monzo.Com" bug, where company fell back to a
// title-cased domain upstream), in which case we clean it. The cleaned, TLD-stripped domain stem is the
// last resort and is ALWAYS clean ("Monzo", never "Monzo.Com"). Single-word stems get title-cased too.
export const looksLikeDomain = (s) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(String(s || '').trim());
// Decode HTML entities so user-facing text never shows raw "&amp;"/"&#x27;"/"&#8211;". Safe because the client
// inserts these as textContent (the entities currently render LITERALLY), so decoding to the character is correct
// and not an XSS vector. Handles named + decimal + hex numeric references.
// FIX-R4 (XSS): NEVER decode into tag-forming chars. Firm-supplied text (crawled titles/quotes) may contain
// &lt;script&gt; / &#60; / &#x3c; — decoding those to < > would let markup form if any field is innerHTML'd. We
// decode only typographic entities; &lt;/&gt; and numeric 60/62 stay ENCODED, rendering as literal text everywhere.
const _ENT = { amp: '&', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…', copy: '©', reg: '®', trade: '™' };
// Numeric character reference -> the character, refusing 60/62 so &#60;/&#x3c; can never form
// markup (FIX-R4). Returns the raw match unchanged when the reference is refused or malformed.
function decodeNumericEnt(ref, raw) {
  const hex = ref[1] === 'x' || ref[1] === 'X';
  const code = hex ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
  if (code === 60 || code === 62 || !Number.isFinite(code)) return raw;
  return String.fromCodePoint(code);
}
function decodeNamedEnt(ref, raw) {
  const k = ref.toLowerCase();
  return Object.prototype.hasOwnProperty.call(_ENT, k) ? _ENT[k] : raw;
}
export function decodeEnt(s) {
  if (typeof s !== 'string' || s.indexOf('&') === -1) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) => {
    if (c[0] === '#') return decodeNumericEnt(c, m);   // FIX-R4: never decode < or >
    return decodeNamedEnt(c, m);
  });
}
// A scraped page <title> is NOT a company name. Reject candidates that read like a title/marketing line so the
// render falls back to the clean domain stem (cert: "Conference & Event Venue in Leeds", "14 Independent Brands...",
// "New Construction Homes for Sale in New York by Toll Brothers", "Pricing Plans", "Our Team").
// Each sign that a candidate string is a page TITLE rather than a firm name, one rule per entry.
const TITLE_SIGNS = [
  (t) => t.length > 42,                                                 // real names are short; titles are long
  (t) => /[|»·–—]| - | \| /.test(t),                                    // title separators
  (t) => /\b(reviews?|top \d+|best |guide|how to|pricing|plans?|welcome|home ?page|our team|about us|contact|menu|blog|news|brands?|things to do)\b/i.test(t),
  (t) => /^\d/.test(t),
  (t) => /\b(in|near|for sale in)\b .*\b(london|leeds|bristol|edinburgh|manchester|new york|dubai|miami)\b/i.test(t),
  (t) => (t.match(/\s/g) || []).length >= 6,                            // >6 words = a sentence, not a name
];
export function looksLikeTitle(s) {
  const t = String(s || '').trim();
  if (!t) return true;
  return TITLE_SIGNS.some((sign) => sign(t));
}
// The comparable form of a domain stem: lowercase alphanumerics only.
const normStem = (domain) => String(domainStem(domain) || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// NAME-01 — A FIRM'S NAME SHARES A TOKEN WITH ITS OWN DOMAIN. A PAGE HEADING DOES NOT.
// Caught on the live birketts audit: the report was addressed to "Bristol Office". The engine had no company name
// on the queue row, derived one from the page, and grabbed an office heading. `looksLikeTitle` did not catch it —
// it is short, has no separators, and is not a listed keyword. Chasing that with a longer blocklist is a losing
// game, because the next one will be "Leeds Team" or "Client Portal".
// The general rule: a real firm name almost always contains a token from its own domain stem
// (Birketts -> birketts.co.uk, Mills & Reeve -> mills-reeve.com, The Office Group -> theofficegroup.com).
// A heading lifted off the page usually shares nothing with it. If the candidate shares no token with the domain,
// we do not trust it and fall back to the clean domain stem, which is always right and never embarrassing.
// Sending a magic-circle firm a compliance report addressed to "Bristol Office" ends the conversation.
const SUFFIX_WORD = /^(llp|ltd|limited|plc|lp|llc|inc|pc|the|and|group|solicitors|law|legal)$/;
// Legal suffixes are never evidence of identity; compare the remaining words only.
const nameWords = (name) => (String(name || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => !SUFFIX_WORD.test(t));
const wholeNameMatchesStem = (words, stem) => {
  const whole = words.join('');
  return stem.includes(whole) || whole.includes(stem);      // one-word firms: BDO -> bdo.co.uk
};
export function sharesTokenWithDomain(name, domain) {
  const stem = normStem(domain);
  if (!stem) return true;                                   // no domain to compare against: do not block
  // NAME-01c: the 4-character floor rejected genuinely SHORT firm names. "BDO LLP" on bdo.co.uk has no token of
  // 4+ letters once 'llp' is set aside, so the guard rejected the firm's own name and fell back to the domain
  // stem: "Bdo". A guard that rejects a real name is as wrong as one that admits a fake one. Legal suffixes are
  // never evidence of identity, so they are stripped; the remaining tokens are compared at 3+ characters, and the
  // whole normalised name is also compared against the stem so a one-word firm (BDO, DWF, DAC) always matches.
  const words = nameWords(name);
  if (!words.length) return false;
  if (wholeNameMatchesStem(words, stem)) return true;
  const tokenMatchesStem = (t) => stem.includes(t) || t.includes(stem);
  return words.filter((t) => t.length >= 3).some(tokenMatchesStem);
}
// Companies House returns names in UPPER CASE ("BIRKETTS LLP"). Shipping that to a managing partner reads as a
// database dump, not a report. Title-case it, but preserve the forms that are genuinely capitalised: the legal
// suffixes (LLP, LTD, PLC), and initialisms the firm actually uses (BDO, DWF, DAC). Never lower-case those.
const _SHORT_WORDS = new Set(['law', 'and', 'the', 'for', 'new', 'old', 'son', 'sons', 'co', 'of', 'at', 'in', 'on', 'to', 'legal', 'firm', 'lex', 'bar']);
const _KEEP_CAPS = new Set(['LLP', 'LTD', 'PLC', 'LP', 'LLC', 'INC', 'PC', 'UK', 'GB', 'AG', 'SA', 'NV', 'BV', 'GMBH', 'SARL', 'PTE', 'FZE', 'DMCC', 'DIFC', 'ADGM']);
// One token of a SHOUTING name: keep legal suffixes/initialisms upper (an initialism owns its
// domain stem - BDO is bdo.co.uk), title-case everything else. Separators pass through.
function humaniseToken(tok, stem) {
  if (/^\s+$/.test(tok) || tok === '-' || tok === '&') return tok;
  const bare = tok.replace(/[^A-Za-z]/g, '');
  if (_KEEP_CAPS.has(bare.toUpperCase())) return tok.toUpperCase();
  if (bare.length > 1 && bare.length <= 5 && bare.toLowerCase() === stem) return tok.toUpperCase();
  return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
}
const isShouting = (raw) => {
  const letters = raw.replace(/[^A-Za-z]/g, '');
  return Boolean(letters) && letters === letters.toUpperCase();
};
export function humaniseName(n, domain) {
  const raw = String(n || '').trim();
  if (!raw) return raw;
  // Only intervene when the name is SHOUTING; a properly-cased name is left exactly as the firm writes it.
  if (!isShouting(raw)) return raw;
  // AN INITIALISM IS NOT MERELY A SHORT TOKEN. Length cannot tell "DWF" from "LAW", or "BDO" from "WARD" - both
  // guesses were wrong ("DWF LAW LLP" -> "DWF LAW LLP", "WARD HADAWAY" -> "WARD Hadaway"). The reliable test is
  // identity: a firm that trades as an acronym OWNS THAT ACRONYM AS ITS DOMAIN. BDO is bdo.co.uk; DWF is dwf.law.
  // "Ward" is not wardhadaway.com. So a token is capitalised only if it IS the domain stem, and never otherwise.
  const stem = normStem(domain);
  return raw.split(/(\s+|-|&)/).map((tok) => humaniseToken(tok, stem)).join('');
}

