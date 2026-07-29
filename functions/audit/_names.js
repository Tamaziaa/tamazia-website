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
const REFUSED_CODEPOINTS = new Set([60, 62]);   // '<' and '>': markup must never form (FIX-R4)
function refusedNumericCode(code) {
  if (!Number.isFinite(code)) return true;
  return REFUSED_CODEPOINTS.has(code);
}
function parseNumericRef(ref) {
  if (ref[1] === 'x' || ref[1] === 'X') return parseInt(ref.slice(2), 16);
  return parseInt(ref.slice(1), 10);
}
function decodeNumericEnt(ref, raw) {
  const code = parseNumericRef(ref);
  if (refusedNumericCode(code)) return raw;
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
// The comparable form of a domain stem: lowercase alphanumerics only. Declared HERE, above its first use, and not
// half-way down the file: `looksLikeTitle` now consults the stem, and a `const` referenced before its declaration
// is a TDZ crash at module scope — the exact failure that once froze the deployed render layer at an old build.
const normStem = (domain) => String(domainStem(domain) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Legal suffixes are never evidence of identity; compare the remaining words only. (Hoisted with normStem, same reason.)
const SUFFIX_WORD = /^(llp|ltd|limited|plc|lp|llc|inc|pc|the|and|group|solicitors|law|legal)$/;
const nameWords = (name) => (String(name || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => !SUFFIX_WORD.test(t));

// A scraped page <title> is NOT a company name. Reject candidates that read like a title/marketing line so the
// render falls back to the clean domain stem (cert: "Conference & Event Venue in Leeds", "14 Independent Brands...",
// "New Construction Homes for Sale in New York by Toll Brothers", "Pricing Plans", "Our Team").
const MARKETING_RX = /\b(reviews?|top \d+|best |guide|how to|pricing|plans?|welcome|home ?page|our team|about us|contact|menu|blog|news|brands?|things to do)\b/i;
// EXP-3 — A SURNAME IS NOT AN ADJECTIVE. The marketing-word sign fired on "Bhatia Best Solicitors", every door into
// the name shut, and the client's audit was headed "Bhatiabest" (bhatiabest.co.uk). The firm is named after Bhatia
// and Best. Same shape as "a star is an adjective" (B1-c) and "a surname is not a country" (G1b, Stephen Ireland).
// The corroborant is the file's own doctrine (NAME-01): THE FIRM'S OWN DOMAIN. A marketing word that is written
// into the domain stem is part of the identity, not a pitch — but only when the candidate ALSO carries an
// identifying token of its own that is not itself a marketing word, so a bare "News" or "Best Solicitors" or
// "Best Legal Reviews" is still rejected on any domain.
function firmOwnsKeyword(t, hit, stem) {
  const word = String(hit || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!word || !stem || !stem.includes(word)) return false;
  const rest = nameWords(t).filter((w) => w !== word);
  return rest.length > 0 && !rest.some((w) => MARKETING_RX.test(w + ' '));
}
// Each sign that a candidate string is a page TITLE rather than a firm name, one rule per entry.
const TITLE_SIGNS = [
  (t) => t.length > 42,                                                 // real names are short; titles are long
  (t) => /[|»·–—]| - | \| /.test(t),                                    // title separators
  (t, stem) => { const m = t.match(MARKETING_RX); return Boolean(m) && !firmOwnsKeyword(t, m[1], stem); },
  (t) => /^\d/.test(t),
  (t) => /\b(in|near|for sale in)\b .*\b(london|leeds|bristol|edinburgh|manchester|new york|dubai|miami)\b/i.test(t),
  (t) => (t.match(/\s/g) || []).length >= 6,                            // >6 words = a sentence, not a name
];
// `domain` is optional: an older caller that omits it gets exactly the previous behaviour, because a candidate
// can never be corroborated by a stem that was not supplied.
export function looksLikeTitle(s, domain) {
  const t = String(s || '').trim();
  if (!t) return true;
  const stem = normStem(domain);
  return TITLE_SIGNS.some((sign) => sign(t, stem));
}

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
// (SUFFIX_WORD + nameWords are declared above looksLikeTitle, which also needs them.)
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
// Vowel-bearing initialisms cannot be recognised by shape (USA looks exactly like a word), so the unambiguous ones
// are named. These are place/state/qualification/regulator initialisms that appear inside real firm names.
const _KEEP_CAPS = new Set(['LLP', 'LTD', 'PLC', 'LP', 'LLC', 'INC', 'PC', 'UK', 'GB', 'AG', 'SA', 'NV', 'BV', 'GMBH', 'SARL', 'PTE', 'FZE', 'DMCC', 'DIFC', 'ADGM',
// 'LA' is deliberately NOT here: it is the particle in "De la Cruz", and _KEEP_CAPS is checked first, so listing it
// would shout at every Spanish and French surname on the register.
  'NYC', 'USA', 'US', 'DC', 'UAE', 'EU', 'NHS', 'SRA', 'CQC', 'GDC', 'GMC', 'GPHC', 'FCA', 'ICO', 'OISC', 'DDS', 'DMD', 'MD']);
// One token of a SHOUTING name: keep legal suffixes/initialisms upper (an initialism owns its
// domain stem - BDO is bdo.co.uk), title-case everything else. Separators pass through.
const SEPARATOR_TOKENS = new Set(['-', '&']);
const isSeparatorToken = (tok) => SEPARATOR_TOKENS.has(tok) || /^\s+$/.test(tok);
// A GENUINE WORD IS NEVER AN INITIALISM, however short it is and however hard it is to pronounce. Every English
// two-letter word, the particles that carry a surname, the titles, and the stop words a firm bolts onto the front
// of its own domain. Without this list the rules below would shout "ST JOHN'S", "MC KENZIE" and "MY Clinic" at a
// managing partner. _SHORT_WORDS is consulted too, so 'law', 'and', 'co', 'son' need no second entry.
const _NOT_INITIALISM = new Set([
  'ST', 'MC', 'MAC', 'DR', 'MS', 'MR', 'MRS', 'SR', 'JR', 'VAN', 'DEN', 'DER', 'DE', 'DU', 'LA', 'LE', 'DA', 'DI', 'EL',
  'AN', 'AS', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IS', 'IT', 'ME', 'MY', 'NO', 'OR', 'OUR', 'SO', 'UP', 'WE', 'AM', 'BY',
]);
// The reliable shape test. A token with no vowel cannot be read aloud, so it is not a word: JF, DDS, RMWBH, GP.
// 'y' COUNTS as a vowel here on purpose — drop it and the rule shouts at Lynch, Rhys, Smyth, Fry and Gwyn, which
// are surnames on law-firm letterheads, not acronyms. NYC and USA are named in _KEEP_CAPS instead.
const isUnpronounceable = (low) => !/[aeiouy]/.test(low);
// The stop words a firm bolts onto the front of its own domain: theips.co.uk is "the" + "ips", and the identity
// after the prefix is IPS. Stripping the prefix turns rule (c) into rule (a) on the remainder.
const stemAfterStopPrefix = (stem) => stem.replace(/^(the|my|we|our|get|go)/, '');
// The stem is this token followed by the next word of the name: "jf" + "law" === "jflaw".
function continuesStem(low, next, stem) {
  if (!stem || !next || !stem.startsWith(low)) return false;
  return stem.slice(low.length).startsWith(String(next).toLowerCase());
}
// A firm that trades as an acronym OWNS that acronym in its own domain. Four kinds of proof, any one enough:
//   (a) the token IS the stem                              BDO -> bdo.co.uk, DWF -> dwf.law
//   (b) the stem is a stop word + the token                IPS -> theips.co.uk
//   (c) the token cannot be pronounced, so it is not a word  JF, DDS, RMWBH, GP
//   (d) a TWO-letter token that the stem continues into the next word of the name   EJ + Law -> ejlaw.co.uk
// (d) is capped at two letters and (c) is the only shape rule, because LENGTH CANNOT TELL "WARD" (wardhadaway.com,
// a surname) FROM "JF" (jflaw.co.uk, two initials), and it cannot tell "IAN" (iansmith.co.uk) from "ABC". The file
// learned that twice; the NAME-01c gate still asserts "WARD HADAWAY LLP" -> "Ward Hadaway LLP".
function isOwnInitialism(bare, stem, next) {
  if (bare.length <= 1 || bare.length > 5) return false;
  const low = bare.toLowerCase();
  if (_NOT_INITIALISM.has(bare.toUpperCase()) || _SHORT_WORDS.has(low)) return false;   // a genuine word
  if (low === stem) return true;                                                        // (a)
  const afterPrefix = stemAfterStopPrefix(stem);
  if (afterPrefix !== stem && low === afterPrefix) return true;                         // (b)
  if (isUnpronounceable(low)) return true;                                              // (c)
  return bare.length === 2 && (continuesStem(low, next, stem) || continuesStem(low, next, afterPrefix));  // (d)
}
function humaniseToken(tok, stem, next) {
  if (isSeparatorToken(tok)) return tok;
  const bare = tok.replace(/[^A-Za-z]/g, '');
  if (_KEEP_CAPS.has(bare.toUpperCase())) return tok.toUpperCase();
  if (isOwnInitialism(bare, stem, next)) return tok.toUpperCase();
  return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
}
const isShouting = (raw) => {
  const letters = raw.replace(/[^A-Za-z]/g, '');
  return Boolean(letters) && letters === letters.toUpperCase();
};
export function humaniseName(n, domain) {
  const raw = String(n || '').trim();
  if (!raw) return raw;
  // MIXED CASE IS THE FIRM'S OWN STYLING AND PASSES THROUGH BYTE-EXACT. "iPS", "JF Law LTD", "Elk & Elk Co., Ltd"
  // and "DiMichaelangelo Family Dentistry" are how those firms write themselves on their own footers; re-casing
  // them would be this file inventing a name. Only a SHOUTING name is a database dump worth intervening on.
  if (!isShouting(raw)) return raw;
  // AN INITIALISM IS NOT MERELY A SHORT TOKEN. Length cannot tell "DWF" from "LAW", or "BDO" from "WARD" - both
  // guesses were wrong ("DWF LAW LLP" -> "DWF LAW LLP", "WARD HADAWAY" -> "WARD Hadaway"). Nor is it ONLY the
  // whole domain stem: that read shipped "Jf Law Limited" to jflaw.co.uk and would ship "The Private Gp Group",
  // because a firm whose acronym is followed by a trade word owns the acronym just as plainly as BDO owns bdo.co.uk.
  // isOwnInitialism now proves identity four ways (stem, stem-after-stop-word, unpronounceability, stem continuation).
  const stem = normStem(domain);
  const parts = raw.split(/(\s+|-|&)/);
  // The bare letters of each part, so a token can see the word that follows it (rule d). Separators contribute ''.
  const bares = parts.map((t) => (isSeparatorToken(t) ? '' : t.replace(/[^A-Za-z]/g, '').toLowerCase()));
  const nextBare = (i) => { for (let j = i + 1; j < bares.length; j++) { if (bares[j]) return bares[j]; } return ''; };
  return parts.map((tok, i) => humaniseToken(tok, stem, nextBare(i))).join('');
}

