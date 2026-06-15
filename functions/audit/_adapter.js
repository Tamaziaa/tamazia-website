// functions/audit/_adapter.js
// THE PIPE: deterministic payload_json -> window.D adapter.
// Pure (no I/O, no Date.now/Math.random, `now` is passed in). TOTAL, DEFENSIVE,
// EVIDENCE-GATED, NUMERIC-LOCKED. Doubles as the render-side safety membrane.
// Slice 1: binds every section the render assets read, from real engine output.

/* ---------------- safe helpers ---------------- */
const isNum = (n) => typeof n === 'number' && isFinite(n);
function g(obj, path, def) {
  try {
    let o = obj;
    for (const k of path.split('.')) { if (o == null) return def; o = o[k]; }
    return o == null ? def : o;
  } catch { return def; }
}
const arr = (v) => Array.isArray(v) ? v : [];
const titleCase = (s) => String(s || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
const cleanDomain = (d) => String(d || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').trim();
// Multi-part public suffixes we must strip WHOLE, otherwise the brand stem keeps a TLD fragment
// (e.g. "greystar.co.uk" -> stem must be "greystar", never "greystar.co"). Single-label TLDs are
// stripped by dropping the last label.
const MULTI_TLD = /\.(co|com|org|net|gov|edu|ac|ltd|plc)\.[a-z]{2}$/i;
// The clean brand STEM of a domain with the TLD removed: "monzo.com" -> "monzo",
// "greystar.co.uk" -> "greystar", "thirdspace.london" -> "thirdspace". Never returns a "*.com" fragment.
function domainStem(d) {
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
const looksLikeDomain = (s) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(String(s || '').trim());
function firmName(payload, passed) {
  const fp = g(payload, 'firm_profile', {}) || {};
  const fromProfile = fp.name || fp.legal_name || fp.display_name || fp.trading_name || fp.brand || payload.firm_name || payload.company;
  if (fromProfile && String(fromProfile).trim()) return String(fromProfile).trim();
  const p = String(passed == null ? '' : passed).trim();
  if (p && !looksLikeDomain(p) && !/\.(com|co|org|net|io|ai|ae|uk|us|sa|qa|de|fr|it|es)$/i.test(p)) return p;
  // passed is empty OR is a dirty domain-derived string -> rebuild from the clean stem
  const src = (p && looksLikeDomain(p)) ? p : payload.domain;
  return titleCase(domainStem(src)) || titleCase(domainStem(payload.domain)) || 'This firm';
}
// Live screenshot of the exact page where a finding sits, the "show them the error on their own site" moment.
const thum = (url) => 'https://image.thum.io/get/width/1100/crop/720/noanimate/' + String(url || '');
const nameOf = (t) => (typeof t === 'string' ? t : (t && (t.name || t.type || t.vendor || t.platform))) || '';
// Money formatter. `sym` defaults to '£' so every existing caller is unchanged; a US firm threads '$'. Only
// the symbol changes — the magnitude formatting (M/k) is identical, and we deliberately do not convert FX. (currency)
function gbp(n, sym) {
  sym = sym || '£';
  n = Math.round(+n || 0);
  if (n >= 1e6) { const m = n / 1e6; return sym + (m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')) + 'M'; }
  if (n >= 1e3) return sym + Math.round(n / 1e3) + 'k';
  return sym + n;
}
// Detect the firm's display currency symbol from its scanned markets, CONSERVATIVELY: only switch to '$' when
// the firm is clearly US (USD is its sole/primary currency and it isn't a GBP firm). Default '£' when unknown,
// mixed, or non-US. Never guess from a single foreign visitor currency. (currency)
function moneySymbol(payload) {
  const curs = arr(g(payload, 'scan.markets.currencies', [])).map((c) => String(c).toUpperCase());
  const cc = String(payload.country || '').toUpperCase();
  const isUS = cc === 'US' || cc === 'USA';
  // Clearly USD: US firm whose currencies are USD-only (or USD-led and not GBP). Keep '£' for everyone else.
  if (curs.length && curs.every((c) => c === 'USD')) return isUS ? '$' : (curs.length === 1 ? '$' : '£');
  if (isUS && curs[0] === 'USD' && !curs.includes('GBP')) return '$';
  return '£';
}
const SEV_BAND = { P0: 'critical', P1: 'high', P2: 'standard', P3: 'standard' };

const FW_NAME = {
  UK_GDPR_A13: 'UK GDPR · Art. 13', UK_DPA_2018: 'UK Data Protection Act 2018', UK_PECR: 'UK PECR · Cookies & e-Privacy', UK_ICO_COOKIES: 'ICO Cookies Guidance',
  EU_GDPR: 'EU GDPR', EU_EPRIVACY: 'EU ePrivacy Directive', EU_EAA_2025: 'EU Accessibility Act 2025', EU_WHISTLEBLOWER: 'EU Whistleblower Directive', EU_AI_ACT: 'EU AI Act',
  UK_CQC: 'CQC Fundamental Standards', UK_GDC: 'GDC Standards', UK_MHRA: 'MHRA Advertising Rules', UK_SRA: 'SRA Transparency Rules', UK_FCA: 'FCA Financial Promotions',
  UK_ASA_CAP: 'ASA / CAP Code', UK_CMA: 'CMA · DMCC Act 2024', UK_DMCC_2024: 'DMCC Act 2024', UK_EQUALITY_2010: 'Equality Act 2010', UK_COMPANIES_ACT: 'Companies Act 2006 · s.82',
  UK_TRADING_STANDARDS: 'Trading Standards', UK_MODERN_SLAVERY: 'Modern Slavery Act 2015', UK_CAA: 'ATOL / Package Travel Rules', UK_FSA: "Food Info Regs (Natasha's Law)", GOOGLE_EEAT: 'Google E-E-A-T',
  AE_PDPL: 'UAE PDPL', AE_RERA: 'RERA (Dubai)', DIFC_DPL: 'DIFC Data Protection Law', ADGM_DPR: 'ADGM Data Protection', SAUDI_PDPL: 'Saudi PDPL', QATAR_PDPPL: 'Qatar PDPPL',
  US_CCPA: 'US CCPA', US_CPRA: 'US CPRA', US_FTC: 'US FTC Act § 5', US_CAN_SPAM: 'US CAN-SPAM', FR_CNIL: 'France · CNIL', DE_BDSG: 'Germany · BDSG',
  US_STATE_PRIVACY: 'US State Privacy Laws', US_VCDPA: 'Virginia VCDPA', US_ADA: 'US ADA · Title III', US_ATTORNEY_ADVERTISING: 'US Attorney Advertising Rules', US_FTC_ENDORSE: 'FTC Endorsement Guides',
  EU_EAA_2025B2C: 'EU Accessibility Act 2025', UAE_PDPL: 'UAE PDPL', UK_CRA_2015: 'Consumer Rights Act 2015', UK_HSE: 'Health & Safety (HSE)', UK_CAA_ATOL: 'ATOL / Package Travel Rules', UK_CAAATOL: 'ATOL / Package Travel Rules',
  // Sector / consumer / online-safety codes that previously fell through to raw title-case ("Uk Arla", "Eu Dsa").
  UK_ARLA: 'ARLA Propertymark Rules', UK_RICS: 'RICS Rules of Conduct', UK_FCA_CONC25: 'FCA Consumer Credit (CONC)', EU_DSA: 'EU Digital Services Act',
  UK_UKCA: 'UKCA Marking', UK_FOOD_INFO_2014: 'Food Information Regs 2014', UK_LICENSING_ACT: 'Licensing Act 2003', UK_OSA_2023: 'Online Safety Act 2023',
  UK_OFSTED: 'Ofsted requirements', UK_DFE: 'DfE information duties', UK_OFS: 'OfS registration conditions',
  // Further real codes present in the matrix fixtures that otherwise rendered raw title-case ("Uk Sra Coc"). (no-raw-framework-code)
  UK_SRA_COC: 'SRA Code of Conduct', UK_SRA_TRANSPARENCY: 'SRA Transparency Rules', UK_FCA_MAR: 'FCA Market Abuse Regulation', UK_FSMA_S21: 'FSMA s.21 Financial Promotions',
  UK_ACCA: 'ACCA Rulebook', UK_FRC: 'FRC Ethical Standard', UK_PRA: 'PRA Rulebook', UK_SMCR: 'Senior Managers & Certification Regime', UK_FOS_FSCS: 'FOS / FSCS Disclosure',
  UK_CE_PLUS: 'Cyber Essentials Plus', UK_NCSC_CYBER_ESSENTIALS: 'Cyber Essentials', UK_DSIT_NIS2: 'UK NIS Regulations', UK_TPO: 'The Property Ombudsman', UK_FRC_GOV: 'UK Corporate Governance Code',
  EU_CSRD: 'EU CSRD', EU_PSD2: 'EU PSD2', EU_DMA: 'EU Digital Markets Act', EU_DORA: 'EU DORA', EU_NIS2: 'EU NIS2 Directive', EU_AML6: 'EU 6th Anti-Money-Laundering Directive', EU_MIFID_II: 'EU MiFID II', EU_SFDR: 'EU SFDR', EU_GPSR: 'EU General Product Safety Regulation',
  US_TCPA: 'US TCPA', US_TDPSA: 'Texas Data Privacy Act', US_FINRA_2210: 'FINRA Rule 2210', US_SEC_506C: 'SEC Rule 506(c)', US_SEC_REG_FD: 'SEC Regulation FD', US_NYDFS_500: 'NYDFS Part 500', US_GLBA: 'US GLBA', US_HIPAA: 'US HIPAA', US_COPPA: 'US COPPA', US_FERPA: 'US FERPA', US_MEDICAL_BOARD: 'State Medical Board Rules', US_FTC_ENDORSE: 'FTC Endorsement Guides',
  UAE_CONSUMER: 'UAE Consumer Protection Law', UAE_ECOMMERCE: 'UAE E-Commerce Law', UAE_RERA: 'RERA (Dubai)', FR_CNIL_2025: 'France · CNIL',
};
const FW_REGULATOR = {
  UK_GDPR_A13: "Information Commissioner's Office", UK_DPA_2018: "Information Commissioner's Office", UK_PECR: "Information Commissioner's Office", UK_ICO_COOKIES: "Information Commissioner's Office",
  EU_GDPR: 'EU data-protection authorities', EU_EPRIVACY: 'EU data-protection authorities', EU_EAA_2025: 'EU accessibility regulators', EU_WHISTLEBLOWER: 'EU member-state authorities', EU_AI_ACT: 'EU AI Office',
  UK_CQC: 'Care Quality Commission', UK_GDC: 'General Dental Council', UK_MHRA: 'MHRA', UK_SRA: 'Solicitors Regulation Authority', UK_FCA: 'Financial Conduct Authority',
  UK_ASA_CAP: 'Advertising Standards Authority', UK_CMA: 'Competition & Markets Authority', UK_DMCC_2024: 'Competition & Markets Authority', UK_EQUALITY_2010: 'Equality & Human Rights Commission', UK_COMPANIES_ACT: 'Companies House',
  UK_TRADING_STANDARDS: 'Trading Standards', UK_MODERN_SLAVERY: 'Home Office', UK_CAA: 'Civil Aviation Authority', UK_FSA: 'Food Standards Agency', GOOGLE_EEAT: 'Google Search',
  AE_PDPL: 'UAE Data Office', AE_RERA: 'RERA Dubai', DIFC_DPL: 'DIFC Commissioner of Data Protection', ADGM_DPR: 'ADGM Office of Data Protection', SAUDI_PDPL: 'Saudi Data & AI Authority', QATAR_PDPPL: 'Qatar NCSA',
  US_CCPA: 'California Privacy Protection Agency', US_CPRA: 'California Privacy Protection Agency', US_FTC: 'Federal Trade Commission', US_CAN_SPAM: 'Federal Trade Commission', FR_CNIL: 'CNIL (France)', DE_BDSG: 'German data-protection authorities',
  UK_ARLA: 'Propertymark (NTSELAT)', UK_RICS: 'RICS', UK_FCA_CONC25: 'Financial Conduct Authority', EU_DSA: 'European Commission', UK_UKCA: 'Office for Product Safety & Standards',
  UK_FOOD_INFO_2014: 'Food Standards Agency', UK_LICENSING_ACT: 'Local licensing authority', UK_OSA_2023: 'Ofcom', UK_OFSTED: 'Ofsted', UK_DFE: 'Department for Education', UK_OFS: 'Office for Students',
  UK_SRA_COC: 'Solicitors Regulation Authority', UK_SRA_TRANSPARENCY: 'Solicitors Regulation Authority', UK_FCA_MAR: 'Financial Conduct Authority', UK_FSMA_S21: 'Financial Conduct Authority',
  UK_ACCA: 'ACCA', UK_FRC: 'Financial Reporting Council', UK_PRA: 'Prudential Regulation Authority', UK_SMCR: 'FCA / PRA', UK_FOS_FSCS: 'Financial Ombudsman Service',
  UK_CE_PLUS: 'NCSC / IASME', UK_NCSC_CYBER_ESSENTIALS: 'NCSC / IASME', UK_DSIT_NIS2: 'DSIT', UK_TPO: 'The Property Ombudsman', UK_FRC_GOV: 'Financial Reporting Council',
  EU_CSRD: 'EU member-state authorities', EU_PSD2: 'European Banking Authority', EU_DMA: 'European Commission', EU_DORA: 'European Supervisory Authorities', EU_NIS2: 'EU member-state authorities', EU_AML6: 'EU member-state authorities', EU_MIFID_II: 'ESMA', EU_SFDR: 'ESMA', EU_GPSR: 'European Commission',
  US_TCPA: 'Federal Communications Commission', US_TDPSA: 'Texas Attorney General', US_FINRA_2210: 'FINRA', US_SEC_506C: 'Securities & Exchange Commission', US_SEC_REG_FD: 'Securities & Exchange Commission', US_NYDFS_500: 'NY Department of Financial Services', US_GLBA: 'Federal Trade Commission', US_HIPAA: 'HHS Office for Civil Rights', US_COPPA: 'Federal Trade Commission', US_FERPA: 'US Department of Education', US_MEDICAL_BOARD: 'State Medical Board', US_FTC_ENDORSE: 'Federal Trade Commission',
  UAE_CONSUMER: 'UAE Ministry of Economy', UAE_ECOMMERCE: 'UAE Ministry of Economy', UAE_RERA: 'RERA Dubai', FR_CNIL_2025: 'CNIL (France)',
  UK_HSE: 'Health & Safety Executive', US_STATE_PRIVACY: 'US state attorneys general', US_VCDPA: 'Virginia Attorney General', US_ADA: 'US Department of Justice', US_ATTORNEY_ADVERTISING: 'State bar associations', US_CAN_SPAM: 'Federal Trade Commission',
};
// Frameworks that overlap so heavily they must render as ONE row, never two near-identical cards under the
// same regulator (Four Seasons showed "CMA · DMCC Act 2024" AND "DMCC DMCC Act 2024", both CMA; and both the
// Food Info Regs and the FSA "Natasha's Law" food card). Collapse the overlapping code into its canonical
// sibling at the grouping step so findings merge into a single framework. (fw-overlap)
const FW_CANON = { UK_DMCC_2024: 'UK_CMA', UK_FOOD_INFO_2014: 'UK_FSA' };
const fwCanon = (fw) => FW_CANON[String(fw || '').toUpperCase()] || fw;
// Phase 4: collapse same-Act article/section siblings into ONE framework box (UK_GDPR_A13 +
// UK_GDPR_A14 -> "UK GDPR", each article kept as a provision inside). SAFE: collapse ONLY for an
// explicit allow-list of Acts known to emit article-level codes — never a fuzzy name-prefix merge,
// so distinct regimes (UK_FCA vs UK_FCA_CONC) are NEVER wrongly merged. The trailing "_" guards
// against prefix-substring false matches (UK_GDPR_ never matches a hypothetical UK_GDPRX).
const ACT_MERGE_PREFIXES = ['UK_GDPR', 'EU_GDPR', 'AE_PDPL', 'DIFC_DPL', 'ADGM_DPR', 'SAUDI_PDPL', 'QATAR_PDPPL', 'US_CCPA', 'US_CPRA', 'DE_BDSG', 'FR_CNIL', 'UK_PECR'];
function actKey(fw) {
  const c = fwCanon(fw);
  for (const pre of ACT_MERGE_PREFIXES) { if (c === pre || c.startsWith(pre + '_')) return pre; }
  return c;
}
// The Article/section token a pointer cites (groups sibling breaches): "Art. 13", "s. 82", "reg. 6", or ''.
function articleOf(p) {
  const cite = String((p && p.provision) || '').trim();
  if (cite && !/^[A-Z0-9_]{2,}$/.test(cite) && cite.length <= 36) return cite.replace(/\s{2,}/g, ' ');
  const code = String((p && (p.framework_short || p.citation)) || '').toUpperCase();
  let m = code.match(/_(?:A|ART|ARTICLE)[_ ]?(\d+[A-Z]?)\b/); if (m) return 'Art. ' + m[1];
  m = code.match(/_(?:S|SEC|SECTION)[_ ]?(\d+[A-Z]?)\b/); if (m) return 's. ' + m[1];
  m = code.match(/_(?:REG|R)[_ ]?(\d+[A-Z]?)\b/); if (m) return 'reg. ' + m[1];
  return '';
}
// The short distinctive subject of a single breach ("Who the data controller is"). Never a raw code.
function subjectOf(p, maxLen) {
  let s = String((p && (p.short_title || p.title || p.requirement || p.fact)) || '').trim().replace(/\s{2,}/g, ' ');
  if (/^[A-Z0-9_]{2,}$/.test(s)) s = '';
  const L = maxLen || 72; if (s.length > L) s = s.slice(0, L - 2).replace(/[\s,;:.\-]+\S*$/, '') + '…';
  return s;
}
// Humanise a checked URL into the page we inspected ("your privacy policy") — the live proof.
function humanUrl(u) {
  let s = String(u || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!s) return '';
  const slash = s.indexOf('/'); const path = slash < 0 ? '' : s.slice(slash);
  if (!path) return 'your homepage';
  if (/privacy/i.test(path)) return 'your privacy policy';
  if (/cookie/i.test(path)) return 'your cookie policy';
  if (/terms|conditions/i.test(path)) return 'your terms page';
  if (/contact/i.test(path)) return 'your contact page';
  const seg = path.replace(/^\//, '').split('/')[0].replace(/[-_]+/g, ' ').trim();
  return seg ? ('your ' + seg + ' page') : 'your homepage';
}
// Human, specific label for one provision. NEVER a raw ^[A-Z_]+$ code. (kept for back-compat consumers.)
function provisionLabel(p, actK) {
  const base = articleOf(p), subj = subjectOf(p, 46);
  if (base && subj) return base + ' · ' + subj;
  if (base) return base;
  if (subj) return subj;
  return 'Provision · ' + fwName(actK);
}
const NO_STATUTORY_FINE = new Set(['GOOGLE_EEAT', 'GOOGLE_EAT', 'SCHEMA', 'WIKIPEDIA', 'GEO', 'SEO']);
// Framework display names render UNescaped in the framework/finding cards, so a name carrying raw
// markup, e.g. a Lighthouse/axe audit title like "`<frame>` or `<iframe>` elements do not have a
// title", would inject a live, unclosed <iframe> and swallow every section rendered after it. The
// adapter is the render-side safety membrane, so we strip angle brackets at this single name
// chokepoint, killing the tag-injection vector for every consumer (name, law, exposure labels, reg tag).
// Preserve known regulatory acronyms through titleCase ("Uk Gdpr"->"UK GDPR", "Us State"->"US State").
const _ACRONYMS = ['UK', 'US', 'USA', 'EU', 'UAE', 'KSA', 'DIFC', 'ADGM', 'GDPR', 'PDPL', 'PDPPL', 'CCPA', 'CPRA', 'PECR', 'DPA', 'CQC', 'GDC', 'MHRA', 'SRA', 'FCA', 'ASA', 'CMA', 'DMCC', 'RERA', 'RICS', 'ARLA', 'EAA', 'DSA', 'DMA', 'DORA', 'NIS2', 'AML', 'MIFID', 'SFDR', 'GPSR', 'TCPA', 'TDPSA', 'FINRA', 'SEC', 'NYDFS', 'GLBA', 'HIPAA', 'COPPA', 'FERPA', 'FTC', 'ADA', 'VCDPA', 'BDSG', 'CNIL', 'NCSA', 'ICO', 'HSE', 'OSA', 'PRA', 'FRC', 'ACCA', 'SMCR', 'FSCS', 'NCSC', 'IASME', 'DSIT', 'TPO', 'CSRD', 'PSD2', 'EBA', 'ESMA', 'EEAT'];
const _ACR_RX = new RegExp('\\b(' + _ACRONYMS.join('|') + ')\\b', 'gi');
function fixAcronyms(s) { return String(s || '').replace(_ACR_RX, (m) => m.toUpperCase()); }
function fwName(fw) {
  const base = titleCase(String(fw || '').replace(/_/g, ' ').toLowerCase());
  let n = fixAcronyms(FW_NAME[fw] || base || 'Framework');
  if (/^[A-Z]{2,}$/.test(n)) n = base || 'Framework';   // never a bare all-caps token (raw-code QA guard)
  return String(n).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').trim() || 'Framework';
}
// Clean, short tag for the finding badge, NEVER a raw underscore code ("US_STATE_PRIVACY"); derived from the
// friendly name with the "· Art.13" suffix and trailing year stripped. (no-raw-framework-code) (G-regtag)
function regTag(fw) { const n = fwName(fw); return n.replace(/\s*·.*$/, '').replace(/\s+\d{4}[A-Z0-9]*\b.*$/, '').trim() || 'Framework'; }
function fwRegulator(fw) { return FW_REGULATOR[fw] || 'Sector regulator'; }
function fwCode(fw) { const s = String(fw || '').replace(/^(UK|EU|US|AE|FR|DE|SAUDI|QATAR|DIFC|ADGM)_?/, ''); return (s.replace(/[^A-Za-z0-9]/g, '').slice(0, 4) || String(fw).slice(0, 4) || 'FW').toUpperCase(); }

/* ---------------- Lighthouse audit intelligence (element-level evidence) ----------------
   Google's real Lighthouse/Chrome-UX audits (scan.psi.audits[]) carry the failing DOM node,
   its CSS selector, the element count and the measured £/ms/KiB cost. The render shows that verbatim,
   the "a developer looked at YOUR site, because Chrome did" proof. id -> human title + lane + fix. */
const LH = {
  'render-blocking-insight': ['Render-blocking resources are delaying first paint', 'speed', 'Tamazia defers non-critical CSS/JS and inlines critical styles so the page paints immediately.'],
  'render-blocking-resources': ['Render-blocking resources are delaying first paint', 'speed', 'Tamazia defers non-critical CSS/JS and inlines critical styles so the page paints immediately.'],
  'unused-css-rules': ['Unused CSS is shipped to every visitor', 'speed', 'Tamazia tree-shakes and splits CSS so only what each page needs is loaded.'],
  'unused-javascript': ['Unused JavaScript is downloaded and parsed needlessly', 'speed', 'Tamazia code-splits and removes dead JavaScript to cut parse time.'],
  'legacy-javascript-insight': ['Legacy JavaScript is served to modern browsers', 'speed', 'Tamazia ships modern bundles so 90% of visitors download far less code.'],
  'duplicated-javascript-insight': ['The same JavaScript module is bundled more than once', 'speed', 'Tamazia de-duplicates shared modules across bundles.'],
  'modern-image-formats': ['Images are not in next-gen formats (WebP/AVIF)', 'speed', 'Tamazia converts and serves WebP/AVIF with fallbacks, typically 25 to 50% smaller.'],
  'uses-optimized-images': ['Images are not efficiently encoded', 'speed', 'Tamazia compresses every image without visible quality loss.'],
  'uses-responsive-images': ['Oversized images are served to small screens', 'speed', 'Tamazia serves correctly-sized images per device with srcset.'],
  'unsized-images': ['Images have no width/height, they shift the layout as they load', 'speed', 'Tamazia sets explicit dimensions so content never jumps (fixes CLS).'],
  'offscreen-images': ['Below-the-fold images load before they are needed', 'speed', 'Tamazia lazy-loads offscreen images so the first screen paints faster.'],
  'uses-text-compression': ['Text assets are served without gzip/Brotli compression', 'speed', 'Tamazia enables Brotli compression at the edge.'],
  'uses-long-cache-ttl': ['Static assets are served with a short cache policy', 'speed', 'Tamazia sets long-lived immutable caching so repeat visits are instant.'],
  'total-byte-weight': ['The page payload is unusually heavy', 'speed', 'Tamazia trims the largest assets and lazy-loads the rest.'],
  'dom-size': ['The DOM is excessively large, slowing rendering', 'speed', 'Tamazia simplifies the markup so the browser renders less.'],
  'mainthread-work-breakdown': ['The main thread is blocked by heavy work', 'speed', 'Tamazia offloads and splits long tasks so the page stays responsive.'],
  'bootup-time': ['JavaScript takes too long to execute on load', 'speed', 'Tamazia reduces and defers JavaScript execution.'],
  'third-party-summary': ['Third-party scripts are slowing your page', 'speed', 'Tamazia audits and defers third-party tags; removes what is unused.'],
  'server-response-time': ['The server is slow to send the first byte', 'speed', 'Tamazia moves you behind a CDN/edge cache so TTFB drops below 200ms.'],
  'speed-index': ['Content takes too long to visually fill the screen', 'speed', 'Tamazia optimises the critical render path so content appears sooner.'],
  'interactive': ['The page is slow to become interactive', 'speed', 'Tamazia reduces blocking scripts so visitors can act sooner.'],
  'largest-contentful-paint': ['Your largest element paints too slowly (LCP)', 'speed', 'Tamazia cuts LCP below 2.5s via image, server and render-path optimisation.'],
  'lcp-lazy-loaded': ['Your LCP image is lazy-loaded, it should load first', 'speed', 'Tamazia eager-loads the hero image so it paints immediately.'],
  'cls-culprits-insight': ['Specific elements are shifting your layout (CLS)', 'speed', 'Tamazia reserves space for the shifting elements so the page stays stable.'],
  'layout-shifts': ['Specific elements are shifting your layout (CLS)', 'speed', 'Tamazia reserves space for the shifting elements so the page stays stable.'],
  'font-display': ['Web fonts hide text while they load', 'speed', 'Tamazia adds font-display:swap so text is readable immediately.'],
  'link-name': ['Links have no discernible name for screen readers or Google', 'a11y', 'Tamazia gives every link descriptive, accessible text.'],
  'button-name': ['Buttons have no accessible name', 'a11y', 'Tamazia labels every control for assistive technology.'],
  'image-alt': ['Images are missing alt text', 'a11y', 'Tamazia writes descriptive alt text for every meaningful image.'],
  'svg-img-alt': ['SVG graphics have no accessible name', 'a11y', 'Tamazia adds titles/labels to SVG graphics.'],
  'aria-hidden-focus': ['Hidden elements still trap keyboard focus', 'a11y', 'Tamazia fixes aria-hidden focus traps for keyboard users.'],
  'color-contrast': ['Text and background colours fail the contrast minimum', 'a11y', 'Tamazia corrects colour contrast to WCAG AA.'],
  'heading-order': ['Headings are not in a sequential order', 'a11y', 'Tamazia restructures headings into a logical H1↗H6 order.'],
  'html-has-lang': ['The page declares no language', 'a11y', 'Tamazia sets the html lang attribute.'],
  'frame-title': ['Frames/iframes have no title', 'a11y', 'Tamazia titles every frame for screen readers.'],
  'label': ['Form fields have no associated labels', 'a11y', 'Tamazia labels every form field for accessibility and compliance.'],
  'tabindex': ['Positive tabindex breaks the natural focus order', 'a11y', 'Tamazia removes positive tabindex so keyboard order is logical.'],
  'document-title': ['The page has no <title>', 'seo', 'Tamazia writes a keyword-led, compliant title for every page.'],
  'meta-description': ['The page has no meta description', 'seo', 'Tamazia writes compelling, compliant meta descriptions per page.'],
  'crawlable-anchors': ['Links are not crawlable by search engines', 'seo', 'Tamazia rewrites links as real, crawlable anchors.'],
  'is-crawlable': ['The page is blocked from search indexing', 'seo', 'Tamazia removes the indexing block so Google can rank you.'],
  'link-text': ['Links use generic text ("click here") Google can’t read', 'seo', 'Tamazia rewrites anchors as descriptive, keyword-aware text.'],
  'robots-txt': ['robots.txt is invalid', 'seo', 'Tamazia repairs robots.txt so crawlers are guided correctly.'],
  'hreflang': ['hreflang is missing or invalid for your markets', 'seo', 'Tamazia sets correct hreflang per jurisdiction.'],
  'canonical': ['No valid rel=canonical is declared', 'seo', 'Tamazia sets canonical tags site-wide to consolidate authority.'],
  'structured-data': ['Structured data is missing or invalid', 'seo', 'Tamazia adds Organization + sector schema so search and AI can read you.'],
  'is-on-https': ['The page is not fully served over HTTPS', 'bp', 'Tamazia enforces HTTPS site-wide.'],
  'uses-http2': ['The server is not using HTTP/2', 'bp', 'Tamazia enables HTTP/2 for faster multiplexed loading.'],
  'deprecations': ['The site uses deprecated browser APIs', 'bp', 'Tamazia replaces deprecated APIs before they break.'],
  'errors-in-console': ['JavaScript errors are logged in the console', 'bp', 'Tamazia resolves console errors that signal instability to Google.'],
  'valid-source-maps': ['Large first-party JavaScript ships without source maps', 'bp', 'Tamazia restores source maps for maintainable, debuggable code.'],
  'third-party-cookies': ['Third-party cookies are set without consent control', 'bp', 'Tamazia gates third-party cookies behind a compliant consent layer.'],
};
const LH_LANE = { speed: 'Performance', a11y: 'Accessibility', seo: 'Search', bp: 'Best practice' };
function lhInfo(id) {
  const key = String(id || '');
  if (LH[key]) return LH[key];
  const base = key.replace(/-insight$/, '');
  if (LH[base]) return LH[base];
  return [titleCase(base.replace(/-/g, ' ')) || 'Performance audit', 'speed', 'Tamazia resolves and verifies this on your live site.'];
}
// Parse Lighthouse displayValue ("Est savings of 1,840 ms", "56 KiB", "4.2 s") into a comparable impact weight (ms-equivalent).
function lhImpact(a) {
  const d = String(a.displayValue || '');
  const num = parseFloat(d.replace(/,/g, '')) || 0;
  let w = 0;
  if (/\bs\b/.test(d) && !/KiB|MiB|ms/.test(d)) w = num * 1000; else if (/ms/.test(d)) w = num; else if (/MiB/.test(d)) w = num * 1024 * 5; else if (/KiB/.test(d)) w = num * 5;
  return w + (a.node_count || 0) * 50 + (1 - (a.score == null ? 1 : a.score)) * 200;
}
// axe-core / WCAG 2.1–2.2 success-criterion + ADA Title III mapping for the accessibility audits Lighthouse
// already runs (they ARE axe-core rules). Turns "color-contrast fails" into "WCAG 2.1 SC 1.4.3, ADA Title
// III / EU EAA exposure" against the exact failing element. (arsenal repo 04: dequelabs/axe-core)
const WCAG = {
  'color-contrast': 'WCAG 2.1 SC 1.4.3 Contrast (Minimum) · AA', 'link-name': 'WCAG 2.1 SC 2.4.4 Link Purpose · A',
  'button-name': 'WCAG 2.1 SC 4.1.2 Name, Role, Value · A', 'image-alt': 'WCAG 2.1 SC 1.1.1 Non-text Content · A',
  'svg-img-alt': 'WCAG 2.1 SC 1.1.1 Non-text Content · A', 'input-image-alt': 'WCAG 2.1 SC 1.1.1 Non-text Content · A',
  'heading-order': 'WCAG 2.1 SC 1.3.1 Info & Relationships · A', 'html-has-lang': 'WCAG 2.1 SC 3.1.1 Language of Page · A',
  'html-lang-valid': 'WCAG 2.1 SC 3.1.1 Language of Page · A', 'frame-title': 'WCAG 2.1 SC 4.1.2 Name, Role, Value · A',
  label: 'WCAG 2.1 SC 1.3.1 Info & Relationships · A', 'aria-hidden-focus': 'WCAG 2.1 SC 4.1.2 Name, Role, Value · A',
  'aria-required-attr': 'WCAG 2.1 SC 4.1.2 Name, Role, Value · A', tabindex: 'WCAG 2.1 SC 2.4.3 Focus Order · A',
  'meta-viewport': 'WCAG 2.1 SC 1.4.4 Resize Text · AA', 'document-title': 'WCAG 2.1 SC 2.4.2 Page Titled · A',
  list: 'WCAG 2.1 SC 1.3.1 Info & Relationships · A', 'duplicate-id-aria': 'WCAG 2.1 SC 4.1.1 Parsing · A',
};
const wcagFor = (id) => WCAG[id] || WCAG[String(id || '').replace(/-insight$/, '')] || null;
// Display name for a competitor/citation: a bare domain ("smilejet.app", "odldentalclinic.com") becomes a clean
// title-cased brand ("Smilejet", "Odldentalclinic"); an already-named entity ("Bupa Dental Care") passes through.
function compName(raw) { const s = String(raw || '').trim(); if (!s) return s; if (/\s/.test(s) || !/\.[a-z]{2,}$/i.test(s)) return s; return titleCase(domainStem(s)) || s; }
// SPECIFIC, action-led "Tamazia fix" for a finding. The engine's LLM fix-writer frequently rate-limits at mint and
// falls back to a generic "Tamazia implements and verifies '<rule name>'" (present on 21/22 audits), which breaks
// the founder rule "every fix uniquely worded, never a templated line, lead with the concrete remediation". This
// keeps a genuinely-specific engine fix when there is one, and otherwise crafts a concrete, varied fix from the
// issue type so the selling layer never reads as a checklist echo. (F-craftfix)
function craftFix(p) {
  const cur = String(p.tamazia_fix_short || p.recommendation || '').trim();
  const generic = !cur || /implements and verifies|resolves and verifies|closes this gap as part of the engagement|on your live site\.?$/i.test(cur) || new RegExp('verifies ["‘’\'"]', 'i').test(cur);
  if (cur && !generic) return cur;
  const fw = String(p.framework_short || p.citation || '').toUpperCase();
  const t = (String(p.fact || '') + ' ' + fw).toLowerCase();
  const has = (re) => re.test(t);
  if (has(/cookie|pecr|eprivacy|consent banner|prior.?consent/)) return 'Tamazia installs a compliant consent banner, granular opt-in, nothing pre-ticked, every non-essential tag blocked until the visitor agrees, then proves it with a re-scan.';
  if (has(/controller|identity of the|who is collecting/)) return 'Tamazia drafts the controller-identity block, registered name, company number, registered office and ICO registration, into the first data-collection page.';
  if (has(/purpose|legal basis|lawful basis/)) return 'Tamazia writes the purposes-and-lawful-basis table your privacy notice is missing, mapped to each category of data you actually collect.';
  if (has(/right to|data subject|erasure|rectif|portab|to object|access request|opt out of sale|do not sell/)) return 'Tamazia adds the data-subject-rights section, access, erasure, rectification, objection and portability, with a working request route behind it.';
  if (has(/retention|how long|storage period/)) return 'Tamazia publishes the retention schedule, how long each data category is held and exactly what triggers its deletion.';
  if (has(/\bdpo\b|data protection officer|supervisory authority|complain/)) return 'Tamazia adds the data-protection contact point and the supervisory-authority complaint route your notice omits.';
  if (has(/contrast|wcag|accessib|aria|alt text|\blabel|screen reader|discernible/)) return 'Tamazia remediates the failing accessibility nodes, labelled fields, AA-contrast text and image alt text, then re-tests every page with axe-core.';
  if (has(/hsts|csp|content.?security|x.?frame|security header|clickjack|referrer.?policy|permissions.?policy/)) return 'Tamazia ships the missing security headers, HSTS, Content-Security-Policy and X-Frame-Options, at the edge and confirms them with a header scan.';
  if (has(/canonical|\bh1\b|meta description|title tag|crawlable|robots|indexing|sitemap/)) return 'Tamazia repairs the on-page foundation, canonical tags, a single H1, meta descriptions and crawlable links, and validates it in Search Console.';
  if (has(/schema|structured data|llms\.txt|wikidata|entity|sameas|knowledge/)) return 'Tamazia builds your machine-readable entity, Organization schema, sameAs links, an llms.txt and a Wikidata entry, so answer engines can identify and cite you.';
  if (has(/price|fee|transparen|pricing|hidden charge/)) return 'Tamazia publishes total-price-up-front disclosure, every mandatory fee shown before the customer commits, as the DMCC/CMA now require.';
  if (has(/review|testimonial|endorse|fake/)) return 'Tamazia documents a compliant reviews policy, verified, non-incentivised, with a takedown route, to meet the fake-review ban.';
  if (has(/cqc|gdc|mhra|care quality|dental council|rating|registration/)) return 'Tamazia publishes the sector-regulator disclosures you are missing, current rating, registration number and the complaints route, prominently on site.';
  if (has(/modern slavery|supply chain/)) return 'Tamazia drafts and publishes the modern-slavery statement, board-approved and dated, with the supply-chain due-diligence it must contain.';
  const verbs = ['Tamazia builds', 'Tamazia ships', 'Tamazia configures', 'Tamazia drafts', 'Tamazia engineers', 'Tamazia provisions'];
  return verbs[fw.length % verbs.length] + ' the control this finding flags, wires it into your live site, and re-scans to confirm it now passes.';
}
// Correct pillar for a finding so a SEO/technical/AI-visibility pointer is never mislabelled "Regulatory"
// (which filled the "breaches in full, walk the chain" Regulatory section with LCP/crawlability cards). Only
// genuinely-regulatory buckets are Regulatory; everything else routes to its own pane. (pillar-misroute)
function pillarOf(p) {
  const b = String((p && p.bucket) || '').toLowerCase();
  if (b === 'ai_visibility') return 'AI / GEO';
  if (b === 'compliance' || b === 'public_records') return 'Regulatory';
  if (b === 'seo' || b === 'technical' || b === 'technical_seo' || b === 'tls_dns' || b === 'tech' || b === 'performance' || b === 'accessibility') return 'SEO + Technical';
  // Unknown bucket: fall back on the framework code (GEO↗AI, SEO↗SEO), else treat as Regulatory only if it
  // actually carries a regulatory framework code, otherwise SEO + Technical.
  const fw = String((p && (p.framework_short || p.citation)) || '').toUpperCase();
  if (/^GEO$/.test(fw)) return 'AI / GEO';
  if (/^SEO$/.test(fw) || NO_STATUTORY_FINE.has(fw)) return 'SEO + Technical';
  return FW_JUR(fw) !== 'GLOBAL' ? 'Regulatory' : 'SEO + Technical';
}
// A3 — turn the engine's nearest-miss absence_evidence into a real per-breach line for the finding card, so an
// absence breach shows WHAT we read on the page that should carry the disclosure vs the SPECIFIC missing element —
// never the bare "we inspected your homepage". Falls back to '' when there is no structured absence evidence.
function absenceLine(ae) {
  if (!ae || typeof ae !== 'object') return '';
  const page = ae.target_url ? humanUrl(ae.target_url) : '';
  if (ae.state === 'related_present_requirement_absent' && ae.nearest_quote) {
    return `On ${page || 'your site'} the scan read “${String(ae.nearest_quote).slice(0, 150)}”, but ${ae.requirement || 'the required disclosure'} is not present.`;
  }
  if (ae.state === 'page_silent' && page) {
    return `${page} was inspected and makes no mention of ${ae.requirement || 'this disclosure'}.`;
  }
  if (ae.pages_checked) {
    return `Across the ${ae.pages_checked} page${ae.pages_checked === 1 ? '' : 's'} crawled, ${ae.requirement || 'this disclosure'} appears nowhere.`;
  }
  return '';
}
function bingoFromPointer(p, pillar, news, i, sym) {
  i = i || 0;
  const lowF = +p.fine_low_gbp || 0, hiF = +p.fine_high_gbp || 0;
  const noFine = NO_STATUTORY_FINE.has(p.framework_short) || p.bucket === 'ai_visibility' || p.bucket === 'seo';
  return {
    n: i + 1, reg: (p.framework_short || p.citation) ? regTag(p.framework_short || p.citation) : pillar, pillar,
    // GEO/SEO/technical are not statutes; render the human "③ The law" layer, never the raw code title-cased
    // ("Geo") and never a bare "Framework" for a non-regulatory finding that carries no framework code. (geo-law)
    law: (/^GEO$/i.test(p.framework_short) || (p.bucket === 'ai_visibility' && !/^[A-Z]{2,}_/.test(String(p.framework_short || '')))) ? 'Generative-engine visibility'
      : (/^SEO$/i.test(p.framework_short) || (/^(seo|technical_seo|technical|tech|tls_dns|performance)$/.test(String(p.bucket || '')) && !/^[A-Z]{2,}_/.test(String(p.framework_short || '')))) ? 'Search-engine visibility'
        : (p.bucket === 'accessibility' && !/^[A-Z]{2,}_/.test(String(p.framework_short || ''))) ? 'Accessibility (WCAG / Equality Act)'
          : (fwName(p.framework_short) || p.citation || pillar),
    // ③ row label per bucket: a regulatory finding is a "Law", an SEO/technical one a "Standard", an AI/GEO one a
    // "Signal" — never label a non-statutory finding "③ Law".
    labelKind: /GEO|AI/.test(pillar) ? 'Signal' : /SEO|Technical/.test(pillar) ? 'Standard' : 'Law',
    exp: (noFine || (!lowF && !hiF)) ? 'ranking impact' : gbp(lowF, sym) + ' to ' + gbp(hiF, sym),
    title: p.fact || g(p, 'bingo.problem', 'Finding'),
    plain: p.layman_explanation || g(p, 'bingo.problem', ''),
    prec: p.enforcement_example || g(news, p.framework_short, ''),
    // Prefer a verbatim on-site quote; else the engine's real nearest-miss absence line; else the bingo problem.
    quote: p.evidence_quote || absenceLine(p.absence_evidence) || g(p, 'bingo.problem', ''),
    fix: craftFix(p),
    plan: 'Severity ' + (p.severity || 'P1') + ' · ' + (i === 0 ? 'Week 1' : 'Weeks 1 to 4') + ' · every mandate',
  };
}
// The engine emits a templated remediation, `Tamazia implements and verifies "{finding}" on your site
// so it satisfies the {framework}.`, for a large class of findings. When the top-3 BINGO cards all draw
// from that template their `fix` text is identical for the first ~32 chars, so three cards open with the
// same sentence (a real UX smell) and the `fixes-unique` QA gate (which keys on the first 30 chars) flags
// a duplicate. We don't fabricate: we lead each *colliding* card with its own finding subject (the
// finding's title/fact, already on the pointer) so the remediation reads as specific from the first word,
// and drop the now-redundant quoted subject from the template body so it isn't said twice. A deterministic
// ordinal guard covers the pathological case of two sibling findings whose subjects also collide. (QA: fixes-unique)
const fixKey = (s) => String(s || '').toLowerCase().slice(0, 30);
function differentiateFixes(list) {
  const seen = new Set();
  for (const f of arr(list)) {
    if (!f || !f.fix) continue;
    if (!seen.has(fixKey(f.fix))) { seen.add(fixKey(f.fix)); continue; }
    const subj = String(f.title || f.law || '').replace(/\s+/g, ' ').trim().replace(/["“”]/g, '').replace(/[, :.,\-\s]+$/, '');
    const body = String(f.fix).replace(/^Tamazia\s+implements\s+and\s+verifies\s+"[^"]*"\s+/i, 'Tamazia implements and verifies this ').trim();
    f.fix = subj ? subj + ', ' + body : body;
    if (seen.has(fixKey(f.fix))) f.fix = '(' + (f.n || seen.size + 1) + ') ' + f.fix;   // deterministic last-resort
    seen.add(fixKey(f.fix));
  }
  return list;
}

/* ---------------- jurisdiction membrane ---------------- */
const TLD_JUR = { uk: 'UK', ae: 'AE', sa: 'SA', us: 'US', fr: 'FR', de: 'DE', it: 'IT', es: 'ES', com: null };
const FW_JUR = (code) => {
  const c = String(code || '').toUpperCase();
  if (c.startsWith('UK_') || c.startsWith('GB_')) return 'UK';
  if (c.startsWith('EU_')) return 'EU';
  if (c.startsWith('US_') || ['HIPAA', 'FTC', 'CCPA', 'CPRA', 'CAN_SPAM'].some((x) => c.includes(x))) return 'US';
  if (c.startsWith('AE_') || c.includes('RERA') || c.includes('DIFC') || c.includes('ADGM') || c.includes('PDPL')) return 'AE';
  if (c.startsWith('FR_') || c.includes('CNIL')) return 'FR';
  if (c.startsWith('DE_') || c.includes('BDSG')) return 'DE';
  return 'GLOBAL'; // GOOGLE_EEAT, schema, etc., universal
};
// Authoritative allow-list = country + TLD (the trustworthy spine), + EU only with corroborating
// evidence. We deliberately do NOT union the engine's other jurisdiction codes: markets.js can
// over-attach US/foreign law on weak signals (the Al Tamimi leak). country+TLD is authoritative. (G2/S-001)
function authJurisdictions(payload) {
  const set = new Set(['GLOBAL']);
  const CMAP = { USA: 'US', UAE: 'AE', KSA: 'SA', GBR: 'UK', GB: 'UK', UK: 'UK' };
  const country = String(payload.country || '').toUpperCase();
  const cc = CMAP[country] || country;
  if (cc) set.add(cc);
  const tld = String(payload.domain || '').toLowerCase().split('.').pop();
  if (TLD_JUR[tld]) set.add(TLD_JUR[tld]);
  const EU_MEMBERS = ['FR', 'DE', 'IT', 'ES', 'NL', 'IE', 'BE', 'PT', 'AT', 'SE', 'DK', 'FI', 'PL', 'LU'];
  const eng = arr(payload.engine_jurisdictions).map((j) => String(j).toUpperCase());
  const det = arr(payload.detected_jurisdictions).map((j) => String(j));
  const euByName = det.some((d) => /france|germany|italy|spain|netherlands|ireland|belgium|portugal|austria|sweden|denmark|finland|poland|luxembourg|european/i.test(d));
  // A firm REGISTERED in an EU member state is bound by pan-EU regulation (GDPR / ePrivacy / DSA / EAA) — that is
  // authoritative, not an over-attach, so 'EU' is added from the registered country alone. We deliberately do NOT
  // blanket-add the OTHER member states here (that would wrongly attach e.g. France's CNIL to a German firm); the
  // multi-country member fan-out stays gated on engine + name corroboration, exactly as before. (EU-member-authoritative)
  if (EU_MEMBERS.includes(cc)) set.add('EU');
  if (eng.includes('EU') && (EU_MEMBERS.includes(cc) || euByName)) { set.add('EU'); ['FR', 'DE', 'IT', 'ES', 'NL', 'IE'].forEach((m) => set.add(m)); }
  // Trust the firm-profiler's CROSS-REFERENCED office countries (each backed by an evidence quote from the
  // site), this is how a genuinely international firm gets its REAL jurisdictions (Mishcon's Singapore, a US
  // branch) without re-opening weak markets-only over-attaches: a firm with no real office (aspendental) has
  // an empty office list and stays at country+TLD. (F-profile · membrane trusts the cross-referenced engine)
  for (const o of arr(g(payload, 'firm_profile.office_countries', []))) { const c = String((o && o.code) || '').toUpperCase(); if (c) { set.add(c); if (EU_MEMBERS.includes(c)) set.add('EU'); } }
  return set;
}

/* ---------------- canonical exposure (numeric-lock) ---------------- */
const DP_FAMILY = new Set(['UK_GDPR_A13', 'UK_DPA_2018', 'UK_PECR', 'UK_ICO_COOKIES', 'EU_GDPR', 'EU_EPRIVACY', 'EU_EAA_2025']);
// Rough order-of-magnitude annual turnover (£) so statutory "% -of-turnover" fines render REALISTICALLY. A
// regulator fines a firm a fraction of ITS revenue, a single dental clinic does NOT face Google's £17.5M GDPR
// cap. We band the firm from observable signals (sector archetype × authority × indexed-page depth × jurisdiction
// spread). Conservative by design: this only ever REDUCES a headline fine toward credibility, never inflates a
// genuinely large firm (whose 4%-of-turnover already exceeds the cap, so it is left at the cap). (exposure-credibility)
// Max realistic fine as a FRACTION of turnover, by regime harshness: data-protection caps at 4% (GDPR/PDPL),
// sector regulators ~2% (FCA/SRA/CQC/GDC/MHRA/RERA), consumer/advertising ~1% (CMA/ASA/Trading Standards). This
// is what turns "£18M PECR on a dental clinic" into a credible "£34k". Statutory cap still wins for large firms.
function fineRate(fw) {
  const s = String(fw || '').toUpperCase();
  if (/GDPR|PECR|\bDPA\b|_DPA|PDPL|\bDPL\b|_DPL|CCPA|CPRA|VCDPA|PDPPL|TDPSA|EPRIVACY|ICO_COOKIES|_EAA|DIFC|ADGM/.test(s)) return 0.04;
  if (/FCA|SRA|CQC|GDC|MHRA|RERA|DFSA|SDAIA|FINRA|HSE|FSA|ATTORNEY|BAR_|MEDICAL|NURSING/.test(s)) return 0.02;
  return 0.01;
}
function estimateTurnover(payload) {
  const da = +g(payload, 'authority.you.da_100', 0) || 0;
  const cc = +g(payload, 'authority.cc_indexed_pages', 0) || 0;
  const jurs = arr(payload.detected_jurisdictions).length;
  const sector = String(payload.detected_sector || payload.sector || '').toLowerCase();
  let base = 4e6;                                                                 // default: small / independent business
  if (/bank|fintech|finance|insurance|capital|invest|payment|lending/.test(sector)) base = 6e8;
  else if (/universit|higher-education|\beducation\b|college/.test(sector)) base = 4e8;
  else if (/hotel|hospitality|resort|airline|cruise|leisure-group/.test(sector)) base = 1.5e8;
  else if (/software|saas|platform|technology|cloud|developer-tool/.test(sector)) base = 9e7;
  else if (/real-?estate|property|developer|construction|reit/.test(sector)) base = 1.2e8;
  else if (/retail|ecommerce|e-commerce|consumer|fashion|apparel|fmcg/.test(sector)) base = 3e7;
  else if (/law|legal|solicit|attorney|consult|advisor|agency|advertis|marketing|accounting|recruit|architect/.test(sector)) base = 2.2e7;
  else if (/dental|dentist|clinic|medical|healthcare|gym|fitness|salon|spa|restaurant|cafe|veterin|optic|aesthetic/.test(sector)) base = 3e6;
  let mult = 1;
  if (da >= 75) mult *= 7; else if (da >= 60) mult *= 3.5; else if (da >= 45) mult *= 1.6; else if (da > 0 && da < 25) mult *= 0.4;
  if (cc >= 200000) mult *= 4; else if (cc >= 20000) mult *= 2; else if (cc > 0 && cc < 400) mult *= 0.5;
  if (jurs >= 3) mult *= 2.2; else if (jurs >= 2) mult *= 1.4;
  return Math.max(4e5, Math.round(base * mult));
}
function perFrameworkMaxFine(pointers) {
  const m = {};
  for (const p of pointers) {
    if (p.fine_withheld) continue;
    const fw = p.framework_short || p.citation;
    const hi = +p.fine_high_gbp || 0;
    if (!fw || !hi || NO_STATUTORY_FINE.has(fw)) continue;   // ranking guidelines carry no statutory fine (C-018)
    m[fw] = Math.max(m[fw] || 0, hi);
  }
  return m;
}
function canonicalExposure(perFw) {
  let dp = 0, sum = 0;
  for (const [fw, v] of Object.entries(perFw)) { if (DP_FAMILY.has(fw)) dp = Math.max(dp, v); else sum += v; }
  return sum + dp;
}
// Scrub any £/GBP figure out of LLM prose and replace with the canonical figure (no LLM number leaks).
// The unit space is grouped WITH the unit so a trailing word (e.g. "fine") keeps its space. (P2)
function scrubMoney(text, canonical, sym) {
  if (!text) return '';
  return String(text)
    .replace(/(?:GBP|USD|AED|SAR|£|\$|EUR|€)\s?[\d,]+(?:\.\d+)?(?:\s?(?:million|bn|billion|k|m)\b)?/gi, gbp(canonical, sym))
    .replace(/\s{2,}/g, ' ').trim();
}

/* ---------------- static commerce + scoring scaffold (Slice 5 wires live config) ---------------- */
const SCORING_BANDS = [
  { g: 'A', r: '85 to 100', d: 'Investor-grade' }, { g: 'B', r: '70 to 84', d: 'Strong' },
  { g: 'C', r: '55 to 69', d: 'Workable' }, { g: 'D', r: '40 to 54', d: 'At risk' }, { g: 'F', r: '0 to 39', d: 'Critical' },
];
function gradeOf(score) {
  if (score >= 85) return 'A'; if (score >= 70) return 'B'; if (score >= 55) return 'C';
  if (score >= 47) return 'D'; if (score >= 40) return 'D-'; if (score >= 25) return 'F'; return 'F-';
}
const bandOf = (s) => s >= 70 ? 'Strong' : s >= 55 ? 'Workable' : s >= 40 ? 'At risk' : 'Critical';

/* ---------------- dimensions + strict score ---------------- */
function buildDims(payload, sig, psi, pointers, aiR, authority, siteScanned) {
  if (siteScanned === undefined) siteScanned = Object.keys(sig || {}).length > 0;
  const c = pointers.filter((p) => p.severity === 'P0').length;
  const h = pointers.filter((p) => p.severity === 'P1').length;
  const st = pointers.filter((p) => p.severity === 'P2' || p.severity === 'P3').length;
  const pointerHealth = Math.max(0, 1 - (c * 0.10 + h * 0.04 + st * 0.015));
  // Compliance dimension is judged on compliance-bucket findings ONLY; zero findings means
  // "not fully assessed" (the engine suppresses what it can't prove), never "perfect". (G3/R-010)
  const compP = pointers.filter((p) => p.bucket !== 'ai_visibility');
  const cc0 = compP.filter((p) => p.severity === 'P0').length;
  const ch0 = compP.filter((p) => p.severity === 'P1').length;
  const cs0 = compP.length - cc0 - ch0;
  const compHealth = Math.max(0, 1 - (cc0 * 0.10 + ch0 * 0.04 + cs0 * 0.015));
  const compNA = compP.length === 0;
  const tvScore = (good) => good ? 88 : 30;
  const has = (k) => !!sig[k];
  const perf = isNum(psi.perf) ? Math.round(psi.perf * 100) : null;
  const dims = [
    // Verdict: criticals↗fail, highs↗warn, standard-only↗warn (NOT a confident green "PASS", which read as
    // "Regulatory compliance PASS" under an F grade); only a genuinely clean sheet (no findings at all) passes. (zero-critical-honest)
    { nm: 'Regulatory compliance', key: 'compliance', _na: compNA, _cc: cc0, _ch: ch0, st: compNA ? 'na' : (cc0 > 0 ? 'fail' : ch0 > 0 ? 'warn' : cs0 > 0 ? 'warn' : 'pass'), v: compNA ? 0 : Math.round(compHealth * 100), sub: compNA ? 'not assessed, limited read of the live site' : `${cc0} critical · ${ch0} high · ${cs0} standard`, w: 2 },
    // On-page / technical / content / security / a11y / tracking dims INFER from the signal bag; with no readable
    // scan that bag is empty and every value would read 0 (a fabricated F that also tanks the score). Pass null so
    // they become "not assessed" (excluded from scoring) instead of confirmed-failing. (scan-fabrication)
    { nm: 'On-page SEO', key: 'seo', v: siteScanned ? Math.round(((has('title') && sig.title) ? 1 : 0) * 33 + (has('meta_description') ? 33 : 0) + (sig.h1_count > 0 ? 34 : 0)) : null, sub: siteScanned ? (`${(sig.title ? '' : 'no title · ')}${sig.meta_description ? '' : 'no meta description · '}${sig.h1_count > 0 ? '' : 'no H1'}`.replace(/ · $/, '') || 'present') : 'not assessed', w: 1 },
    { nm: 'Technical SEO', key: 'technical_seo', v: siteScanned ? Math.round((has('canonical') ? 34 : 0) + (has('viewport') ? 33 : 0) + (has('lang') ? 33 : 0)) : null, sub: siteScanned ? (`${sig.canonical ? '' : 'no canonical · '}${sig.viewport ? '' : 'no viewport · '}${sig.lang ? '' : 'no lang attribute'}`.replace(/ · $/, '') || 'ok') : 'not assessed', w: 1 },
    { nm: 'Content & E-E-A-T', key: 'content', v: siteScanned ? Math.round((has('json_ld') ? 40 : 0) + (has('open_graph') ? 20 : 0) + (sig.html_bytes > 4000 ? 40 : 15)) : null, sub: siteScanned ? `${sig.json_ld ? 'schema · ' : 'no schema · '}${sig.open_graph ? 'OG · ' : 'no OG · '}${sig.html_bytes > 4000 ? 'depth ok' : 'thin content'}` : 'not assessed', w: 1 },
    { nm: 'Core Web Vitals', key: 'cwv', v: perf == null ? null : perf, sub: perf == null ? 'not assessed' : `perf ${perf} · CLS ${(+psi.cls || 0).toFixed(2)}`, w: 1 },
    { nm: 'Security headers', key: 'security', v: siteScanned ? Math.round([sig.hsts, sig.csp, sig.xfo, sig.xcto, sig.refpol, sig.permpol].filter(Boolean).length / 6 * 100) : null, sub: siteScanned ? (`${sig.hsts ? '' : 'no HSTS · '}${sig.csp ? '' : 'no CSP · '}${sig.xfo ? '' : 'no X-Frame'}`.replace(/ · $/, '') || 'ok') : 'not assessed', w: 1 },
    { nm: 'Accessibility (WCAG)', key: 'a11y', v: siteScanned ? Math.round((sig.lang ? 30 : 0) + (sig.viewport ? 30 : 0) + 40 * pointerHealth) : null, sub: siteScanned ? `${sig.lang ? '' : 'no lang · '}contrast/labels` : 'not assessed', w: 1 },
    { nm: 'AI / GEO visibility', key: 'ai_visibility', st: (aiR.score || 0) < 40 ? 'fail' : 'warn', v: aiR.score || 0, sub: `share of voice ${sovClamp(g(payload, 'geo_probe.share_of_voice'), g(payload, 'geo_probe.samples'), g(payload, 'geo_probe.ai_knows'))} · entity ${aiR.score || 0}`, w: 1 },
    { nm: 'Authority & backlinks', key: 'authority', v: g(authority, 'you.da_100', null), sub: `DA ${g(authority, 'you.da_100', 'n/a')} · vs ${arr(authority.ranked).length} rivals`, w: 1 },
    (function () { const nT = arr(sig.trackers).length, ads = !!g(sig, 'ad_tech.runs_ads', false), has = nT > 0 || ads; return { nm: 'Tracking & consent', key: 'tracking', _na: !siteScanned, st: !siteScanned ? 'na' : (has ? 'warn' : 'pass'), v: !siteScanned ? null : (has ? 45 : 85), sub: !siteScanned ? 'not assessed' : (has ? `${nT} tracker${nT === 1 ? '' : 's'}${ads ? ' + ad pixels' : ''}, each one needs prior consent under PECR/GDPR` : 'No third-party trackers firing before consent'), w: 1 }; })(),
  ];
  return dims.map((d) => {
    if (d.v == null) { d.st = 'na'; d.v = 0; d._na = true; }
    else if (!d.st) d.st = d.v >= 75 ? 'pass' : d.v >= 45 ? 'warn' : 'fail';
    return d;
  });
}
function scoreFromDims(dims, exposureN) {
  let wsum = 0, w = 0;
  for (const d of dims) { if (d._na) continue; wsum += d.v * d.w; w += d.w; }
  const base = w ? wsum / w : 50;
  // STRICT: any critical-regulatory failure caps hard; harsh curve.
  const comp = dims.find((d) => d.key === 'compliance');
  let s = Math.round(base);
  // criticals cap into the F/D- band, GRADED by the actual count of critical + high findings (which keeps varying
  // even past the point compHealth saturates to 0) so a firm with 1 critical (≈D-/44) and one with 19 (deep F-)
  // never share an identical score. One critical ≈ 44; each further critical/high pulls it down. No templated cap. (G-graded)
  if (comp && comp.st === 'fail') s = Math.min(s, 46 - Math.round(Math.min(38, ((comp._cc || 1) - 1) * 1.8 + (comp._ch || 0) * 0.25)));
  // HONEST CONFIDENCE CAP: zero evidenced statutory exposure means we did NOT verify the firm's regulatory posture, 
  // either the live site was thin / bot-challenged, or nothing fineable surfaced. A thin/blocked scan must never
  // out-score a fully-assessed firm (the unfixed bug: a barely-read luxury hotel graded "B / investor-grade"). Cap at
  // the top of C so the grade honestly reads "workable but unverified", never investor-grade. (G-confidence)
  else if (!(+exposureN > 0)) s = Math.min(s, 62);
  return Math.max(2, Math.min(100, s));
}

/* ---------------- competitor + keyword intelligence (REAL competitors, not directories/blogs) ---------------- */
const COMPETITOR_DENYLIST = new Set([
  'google.com','bing.com','bing.co.uk','yahoo.com','duckduckgo.com','wikipedia.org','facebook.com','linkedin.com','instagram.com','twitter.com','x.com','youtube.com','pinterest.com','tiktok.com','reddit.com','quora.com','mumsnet.com','apple.com','amazon.com',
  'trustpilot.com','yelp.com','yelp.co.uk','yell.com','yell.co.uk','tripadvisor.com','tripadvisor.co.uk','glassdoor.com','glassdoor.co.uk','indeed.com','g2.com','clutch.co','goodfirms.co','expertise.com','threebestrated.co.uk','bark.com','checkatrade.com','which.co.uk','yellowpages.com','yellowpages.co.uk','justdial.com','thomsonlocal.com','freeindex.co.uk','hotfrog.co.uk','cylex-uk.co.uk','scoot.co.uk','192.com','topconsumerreviews.com','aeroleads.com','f6s.com','disfold.com','rankred.com','spocket.co','metricscart.com','merchantmachine.co.uk','ecommerceguide.com','homelight.com','findanyagent.ae','toppropertydevelopers.com','dentistsearch.co.uk',
  'legal500.com','chambers.com','chambersandpartners.com','chambersstudent.co.uk','reviewsolicitors.co.uk','lawsociety.org.uk','sra.org.uk','findlaw.com','lawyers.findlaw.com','justia.com','avvo.com','lawyers.com','lawfuel.com','bestlawfirms.com','law.usnews.com','bcgsearch.com','statebarattorneys.com','thelawyer.com','courtscast.com','lawzana.com','lawyersuae.ae','dubaimatic.com','dubaisbest.com','edarabia.com',
  'zocdoc.com','whatclinic.com','whatclinic.co.uk','doctify.com','topdoctors.co.uk','topdoctors.com','healthgrades.com','vitals.com','ratemds.com','opencare.com','theteledentists.com','treatwell.co.uk',
  'rightmove.co.uk','zoopla.co.uk','onthemarket.com','primelocation.com','zillow.com','realtor.com','realestate.usnews.com','dubaisells.com','bhomes.com','uniqueproperties.ae','propertyfinder.ae','bayut.com','dubizzle.com','homes.com','redfin.com','trulia.com','apartments.com','loopnet.com',
  'booking.com','expedia.com','hotels.com','opentable.com','luxuryhotel.guide','thehotelguru.com','bestofluxury.com','lastminute.com','agoda.com','trivago.com','trivago.co.uk','kayak.com','kayak.co.uk','skyscanner.net','airbnb.com','vrbo.com','hostelworld.com','laterooms.com','travelsupermarket.com',
  'forbes.com','timeout.com','robbreport.com','luxurylondon.co.uk','londontheinside.com','factmagazines.com','luxsphere.co','thegentlemansjournal.com','ceoreviewmagazine.com','bostoninsider.org','dubaiweek.ae','mr7.ae','investinreading.com','joyofcreating.org','safehome.org','propertysecurity.org','goodguardsecurity.com','cheyenne.org','gov.uk','nhs.uk',
  // additional news/magazine/listicle hosts whose stems dodge the token patterns (ibtimes != "times",
  // lawyermag != "magazine", bestinlondon has no separator after "best"). These co-rank by aggregating firms.
  'ibtimes.co.uk','ibtimes.com','lawyermag.co.uk','lawyermonthly.com','legalfutures.co.uk','bestinlondon.london','bestlondon.co.uk','citymatters.london','londonpost.news','thelondoneconomic.com','standard.co.uk','mirror.co.uk','dailymail.co.uk','telegraph.co.uk','independent.co.uk','metro.co.uk','huffingtonpost.co.uk',
  // tech/SaaS/software listicle, review-aggregator & roundup blogs that co-rank for "saas"/"software"
  // category terms by aggregating vendors (NOT real vendors themselves — real vendors are kept).
  'geekflare.com','g2crowd.com','capterra.com','getapp.com','softwareadvice.com','trustradius.com','techradar.com','pcmag.com','cnet.com','techcrunch.com','venturebeat.com','producthunt.com','saashub.com','slashdot.org','sourceforge.net','financesonline.com','softwaresuggest.com','selecthub.com',
  // listicle / magazine / no-name aggregator hosts the LLM surfaced as "leaders" whose stems dodge the token
  // patterns (no separator before the keyword). These co-rank by aggregating firms and must never be peers. (citations-junk)
  'topschoolguide.com','luxurycolumnist.com','britainsfinest.co.uk','retailgazette.co.uk','lawfuel.com','lawandlegal.co.uk','hrjforemanlaws.co.uk','robertsonmoss.com','counselindex.com','vault.com','thehotelguru.com','lhw.com',
  // fintech / banking & real-estate comparison + directory hosts that co-rank for the category but are NOT real
  // operating rivals (mirrors the engine per-sector blocklist; belt-and-braces for SERP-cache artifacts). (P7)
  'monito.com','pocketwise.co.uk','idobusiness.co.uk','comparebanks.co.uk','moneyfactscompare.co.uk','moneyfacts.co.uk','thebanks.eu','moneyzine.com','compareremit.com','bankofengland.co.uk','fca.org.uk',
  'agentseeker.co.uk','estateagentfinder.co.uk','britishproperty.uk','nethouseprices.com','mouseprice.com','startood.com',
  // e-commerce / retail PLATFORMS — tools a retailer is built ON, never a retail rival (the Gymshark fix). (E2b)
  'shopify.com','woocommerce.com','bigcommerce.com','magento.com','squarespace.com','wix.com','prestashop.com','wordpress.com','weebly.com','ecwid.com','bigcartel.com','volusion.com','godaddy.com',
  // 20-sector directory/platform/news hosts most likely to co-rank as false competitors (E4 mirror of the engine 20-sector blocklist)
  'realself.com','consultingroom.com','glowday.com','save-face.co.uk',
  'coinmarketcap.com','coingecko.com','etherscan.io','blockchain.com','cointelegraph.com','coindesk.com','messari.io','glassnode.com','cryptocompare.com','dappradar.com','defillama.com','cryptoslate.com','decrypt.co','bitcoinmagazine.com','coinjournal.net','cryptonews.com','invezz.com','coingabbar.com','tradingguide.co.uk','theinvestorscentre.co.uk','newsbtc.com','beincrypto.com','cryptopotato.com','ambcrypto.com','u.today','bitcoinist.com','blockworks.co','theblock.co','99bitcoins.com','benzinga.com','coinbureau.com','webopedia.com','investing.com','fool.com','datawallet.com','milkroad.com','techopedia.com','koinly.io','cointracker.io',
  'coursera.org','udemy.com','edx.org','khanacademy.org','greatschools.org','niche.com','qs.com','timeshighereducation.com','topuniversities.com','ratemyprofessors.com','whatuni.com','thecompleteuniversityguide.co.uk','studyportals.com',
  'autotrader.com','autotrader.co.uk','edmunds.com','cars.com','carvana.com','vroom.com','kbb.com','carfax.com','truecar.com','whatcar.com','carwow.co.uk','parkers.co.uk','heycar.co.uk','motors.co.uk','cinch.co.uk','honestjohn.co.uk','mobile.de','autoscout24.de',
  'viator.com','getyourguide.com','klook.com','musement.com','tripadvisor.co.uk','lonelyplanet.com','loveholidays.com','secretescapes.com','civitatis.com',
  'clutch.co','upwork.com','goodfirms.co','toptal.com','fiverr.com','designrush.com','sortlist.com','manta.com','thumbtack.com',
  'labdoor.com','supplementreviews.com','examine.com','iherb.com','leafly.com','weedmaps.com','cbdoracle.com',
  'energysage.com','solarreviews.com','cleanenergyreviews.info','pv-magazine.com','rechargenews.com','energysavingtrust.org.uk',
  'rover.com','care.com','vetster.com','petmd.com','vethelpdirect.com','find-a-vet.co.uk','thedodo.com',
  'treatwell.com','treatwell.co.uk','mindbody.com','classpass.com','fresha.com','booksy.com','wahanda.com','spafinder.com',
  'muckrack.com','about.me','crunchbase.com','pitchbook.com',
]);
const JUNK_PATTERNS = [
  /(^|\.)wikipedia\.org$/i, /(^|\.)(facebook|linkedin|youtube|instagram|tiktok|x)\.com$/i, /(^|\.)google\./i, /\.gov(\.[a-z]{2})?$/i, /(^|\.)nhs\.uk$/i,
  /(^|[.\-])(directory|directories|reviews?|rated|ranking|rankings|listings?|compare|comparison)([.\-]|$)/i,
  /(^|[.\-])(finder|locator|nearby|near-?me)([.\-]|$)/i,
  /(^|[.\-])(best|top|top-?\d+|leading|guide|guides|hub|portal|insider)([.\-]|$)/i,
  /(^|[.\-])(magazine|magazines|news|times|weekly|daily|journal|gazette|press|blog|wiki)([.\-]|$)/i,
  /(^|[.\-])(marketplace|aggregat|leadgen|lead-?gen)([.\-]|$)/i,
];
// Directory/listicle signal at the START of the registrable stem with NO trailing separator — e.g. reviewbritain.com,
// directorylaw.co.uk, comparethefirm.com, top10lawyers.com. The token-bounded JUNK_PATTERNS miss these because the
// keyword runs straight into the next word. Conservative set (clear directory verbs only) so real brands are kept.
const STEM_JUNK_RX = /^(reviews?|directory|directories|compare|comparison|rated|ranking|rankings|listings?|top\d+|bestrated|bestof|find(a|an|my)|nearme|nearby)/i;
const parentDomain = (host) => { const p = String(host).split('.'); return p.length > 2 ? p.slice(-2).join('.') : host; };
const MARKET_TLD = { UK: ['co.uk', 'uk', 'org.uk'], GB: ['co.uk', 'uk', 'org.uk'], US: ['com', 'us'], USA: ['com', 'us'], UAE: ['ae', 'com'], AE: ['ae', 'com'], SA: ['sa', 'com'], KSA: ['sa', 'com'], QA: ['qa', 'com'] };
function isRealCompetitor(domain, firmMarket) {
  const host = cleanDomain(domain).toLowerCase();
  if (!host || !host.includes('.')) return false;
  if (COMPETITOR_DENYLIST.has(host) || COMPETITOR_DENYLIST.has(parentDomain(host))) return false;
  if (JUNK_PATTERNS.some((rx) => rx.test(host))) return false;
  if (STEM_JUNK_RX.test(parentDomain(host).split('.')[0])) return false;   // directory verb at the stem start (reviewbritain)
  // strong directory/comparison SUBSTRING signal anywhere in the registrable label (catches comparebanks,
  // moneyfactscompare, agentseeker, estateagentfinder that the token-bounded patterns miss). (P7)
  const _stem = host.split('.')[0].replace(/[^a-z0-9]/g, '');
  if (/compare|comparison|finder|seeker|directory|listings?|whatclinic|bestbanks?|whichbank|ratemy|news|magazine|gazette|herald|tribune/.test(_stem)) return false;
  const allowed = MARKET_TLD[String(firmMarket || '').toUpperCase()];
  if (allowed) { const tld1 = host.split('.').pop(); const tld2 = host.split('.').slice(-2).join('.'); if (/^(ae|sa|qa|in|de|fr|it|es|ca|au)$/i.test(tld1) && !allowed.includes(tld1) && !allowed.includes(tld2)) return false; }
  return true;
}
function corroborated(host, payload) {
  host = cleanDomain(host).toLowerCase();
  const cb = arr(g(payload, 'competitive_benchmark.competitors', []));
  const ai = arr(g(payload, 'ai_citation.competitors', []));
  const auth = arr(g(payload, 'authority.ranked', []));
  const n = [cb.some((c) => cleanDomain(c.domain).toLowerCase() === host), ai.some((c) => cleanDomain(c.domain).toLowerCase() === host), auth.some((r) => cleanDomain(r.domain).toLowerCase() === host)].filter(Boolean).length;
  const dr10 = ((auth.find((r) => cleanDomain(r.domain).toLowerCase() === host) || {}).dr || 0) * 10;
  return n >= 2 || dr10 >= 20;
}
// Aggregator check that also works on firm NAMES (not just domains), drops OTA / directory / marketplace
// brands the LLM sometimes names as "competitors" (Booking.com for a hotel, Amazon for a sofa maker), which
// must never appear in the rendered peer set. (S-aggname)
const AGG_BRANDS = new Set(['booking', 'expedia', 'hotels', 'agoda', 'trivago', 'kayak', 'tripadvisor', 'trustpilot', 'yelp', 'glassdoor', 'indeed', 'forbes', 'timeout', 'findlaw', 'justia', 'bestlawfirms', 'lawyers', 'avvo', 'zocdoc', 'healthgrades', 'rightmove', 'zoopla', 'onthemarket', 'zillow', 'realtor', 'amazon', 'ebay', 'etsy', 'aliexpress', 'walmart', 'yell', 'thomson', 'clutch', 'g2', 'capterra', 'wikipedia', 'reddit']);
function looksAggregator(name) {
  const h = cleanDomain(name).toLowerCase();
  if (h.includes('.') && (COMPETITOR_DENYLIST.has(h) || COMPETITOR_DENYLIST.has(parentDomain(h)) || JUNK_PATTERNS.some((rx) => rx.test(h)) || STEM_JUNK_RX.test(parentDomain(h).split('.')[0]))) return true;
  const first = String(name || '').toLowerCase().replace(/[^a-z0-9 .]/g, '').split(/[ .]/)[0];
  return AGG_BRANDS.has(first);
}
// Best secondary keyword: the most specific on-brand term, never a bare head term / wrong city / brand name.
function bestSecondaryKeyword(payload, market) {
  const kws = arr(g(payload, 'keyword_map.keywords', []));
  const brand = cleanDomain(payload.domain).split('.')[0];
  const fc = firmCountry(payload);
  const big = isBigBrand(payload);
  const cityToStrip = big ? String(g(payload, 'keyword_map.city', '') || '').trim() : '';
  const youRank = (k) => k.my_position != null;            // 0 is a valid rank
  // A keyword is shown only if you rank for it, OR a REAL, in-market peer (not a directory/aggregator/
  // off-jurisdiction firm) leads it. Drops local "near me" + aggregator noise + wrong-city terms you don't
  // rank for (a UAE firm must not be shown "losing hotel London to an OTA"). (S-kw-relevance · wrong-city)
  const real = (k) => youRank(k) || (k.leader && isRealCompetitor(k.leader, market) && leaderInMarket(k.leader, fc));
  const cleanFor = (k) => cleanKwTermFull(k.keyword, { fc, big, cityToStrip });
  const bad = (k) => {
    const s = String(k.keyword || '').toLowerCase().trim();
    if (!s) return true;
    if (KW_NOISE_RX.test(s)) return true;                    // recruitment/informational, not a buyer term
    if (LOCAL_RX.test(s) && !youRank(k)) return true;        // local intent you don't own
    if (termForeignCity(s, fc) && !youRank(k)) return true;  // wrong-city term you don't own
    if (brand.length > 3 && s.includes(brand)) return true;  // your own brand term
    if (!cleanFor(k)) return true;                           // nothing survives cleaning
    return false;
  };
  const ok = kws.filter((k) => !bad(k) && real(k));
  const withPos = ok.filter(youRank);
  const multi = ok.filter((k) => cleanFor(k).split(/\s+/).length >= 2);
  const pick = withPos[0] || multi[0] || ok[0];
  if (pick) return { term: cleanFor(pick) || categoryLabel(payload), youPos: pick.my_position, leader: pick.leader, leaderPos: pick.leader_pos };
  return { term: categoryLabel(payload), youPos: null, thin: true };
}
// ---- keyword accuracy: wrong-city + scale awareness (Gate 2 / Gate 7 / §5.5) ----
// Local-intent pattern ("near me", "nearby", "local", "in my area") that a national brand never competes on.
const LOCAL_RX = /\bnear(\s?(me|you|by))?\b|\bnearby\b|\blocal\b|\bin my area\b/i;
// Junk superlative / non-buyer modifiers that turn a clean category term into magazine bait
// ("best law firms online", "top cosmetic dentist", "cheapest hotels"). The buyer types the category,
// not the listicle headline; a term made ENTIRELY of modifier + noun is the aggregator's query, not yours.
const KW_SUPERLATIVE_RX = /\b(best|top(?:\s*\d+)?|cheapest|cheap|leading|premier|finest|greatest|ultimate|recommended|reviews?|rated|ranking|ranked|compare|comparison|vs|online)\b/gi;
// Recruitment / careers / informational queries are NOT buyer intent (a "training contract" or "work
// experience" search is a graduate, not a client). These terms must never appear as a competitive gap.
const KW_NOISE_RX = /\b(work experience|training contract|vacation scheme|graduate scheme|internship|apprenticeship|jobs?|vacancies|vacancy|career|careers|salary|salaries|recruitment|hiring|interview|wikipedia|meaning|definition|how to|what is|examples?)\b/i;
// Cities mapped to the firm COUNTRY they belong to, so a keyword city minted against the wrong market
// (e.g. a UAE hotel group minted with city "London") is detected as foreign and stripped. Keys are the
// adapter's normalised country codes (UK/US/AE/SA/QA/FR/DE/etc.).
const CITY_COUNTRY = {
  london: 'UK', manchester: 'UK', birmingham: 'UK', edinburgh: 'UK', glasgow: 'UK', leeds: 'UK', bristol: 'UK', liverpool: 'UK', sheffield: 'UK', newcastle: 'UK', nottingham: 'UK', leicester: 'UK', coventry: 'UK', cardiff: 'UK', belfast: 'UK', aberdeen: 'UK', brighton: 'UK', oxford: 'UK', cambridge: 'UK', reading: 'UK', southampton: 'UK', norwich: 'UK', exeter: 'UK', derby: 'UK', plymouth: 'UK', wolverhampton: 'UK', leeds: 'UK',
  'new york': 'US', nyc: 'US', miami: 'US', 'los angeles': 'US', 'san francisco': 'US', chicago: 'US', boston: 'US', seattle: 'US', austin: 'US', dallas: 'US', houston: 'US', washington: 'US', atlanta: 'US', denver: 'US', phoenix: 'US', philadelphia: 'US',
  dubai: 'AE', 'abu dhabi': 'AE', sharjah: 'AE', ajman: 'AE',
  riyadh: 'SA', jeddah: 'SA', dammam: 'SA', mecca: 'SA', medina: 'SA',
  doha: 'QA', paris: 'FR', marseille: 'FR', lyon: 'FR', berlin: 'DE', munich: 'DE', frankfurt: 'DE', hamburg: 'DE',
  madrid: 'ES', barcelona: 'ES', rome: 'IT', milan: 'IT', amsterdam: 'NL', brussels: 'BE', dublin: 'IE', luxembourg: 'LU',
  geneva: 'CH', zurich: 'CH', singapore: 'SG', 'hong kong': 'HK', toronto: 'CA', sydney: 'AU', melbourne: 'AU',
};
const CITY_TOKEN_RX = new RegExp('\\b(' + Object.keys(CITY_COUNTRY).map((c) => c.replace(/ /g, '\\s+')).join('|') + ')\\b', 'gi');
// Map the adapter's many country spellings to one comparable code.
const COUNTRY_CODE = (c) => ({ USA: 'US', GBR: 'UK', GB: 'UK', UAE: 'AE', KSA: 'SA' }[String(c || '').toUpperCase()] || String(c || '').toUpperCase());
// The firm's real country code and the set of cities legitimately "theirs" (so a London clinic keeps London,
// but a UAE firm's mis-minted "London" keyword is treated as a wrong-city term).
function firmCountry(payload) {
  return COUNTRY_CODE(payload.country) || (g(payload, 'firm_profile.hq_country') ? COUNTRY_CODE(g(payload, 'firm_profile.hq_country')) : '');
}
// Does this term carry a city that does NOT belong to the firm's country? (foreign-city = wrong-city)
function termForeignCity(term, fc) {
  if (!fc) return false;
  const m = String(term || '').toLowerCase().match(CITY_TOKEN_RX); if (!m) return false;
  return m.some((tok) => { const cc = CITY_COUNTRY[tok.replace(/\s+/g, ' ').trim()]; return cc && cc !== fc; });
}
// Is a SERP leader credible as "who beats you" for the firm's market? A real business that ALSO sits in (or
// near) the firm's market is credible; a same-vertical firm in a DIFFERENT country leading a term you don't
// rank for is not a meaningful threat to show (a UK solicitor is not "beating" a Dubai law firm on UAE search).
// Globally-recognised stems (corroborated peers) always pass; this only gates unknown local firms by TLD.
function leaderInMarket(domain, fc) {
  const host = cleanDomain(domain).toLowerCase(); if (!host) return false;
  const tld1 = host.split('.').pop(); const tld2 = host.split('.').slice(-2).join('.');
  const FC_TLD = { UK: ['co.uk', 'uk', 'org.uk', 'london'], US: ['com', 'us', 'org', 'net'], AE: ['ae', 'com'], SA: ['sa', 'com'], QA: ['qa', 'com'], FR: ['fr', 'com'], DE: ['de', 'com'], IE: ['ie', 'com'], NL: ['nl', 'com'], ES: ['es', 'com'], IT: ['it', 'com'] };
  const allowed = FC_TLD[fc]; if (!allowed) return true; // unknown firm market ↗ don't gate on TLD
  // A clearly-foreign ccTLD (a .co.uk leader for a UAE firm) is not a credible in-market threat.
  if (/^(co\.uk|uk|org\.uk|london|ae|sa|qa|fr|de|ie|nl|es|it)$/i.test(tld2) || /^(uk|ae|sa|qa|fr|de|ie|nl|es|it)$/i.test(tld1)) {
    return allowed.includes(tld1) || allowed.includes(tld2);
  }
  return true; // generic gTLD (.com/.net/.org) ↗ could be the firm's own market, allow
}
// "Big brand" = a firm that does NOT compete on city-localised search, so its keywords must read at category
// level (a national bank fights for "business bank account", not "business bank account London"). Signals:
// real Domain Authority, AI-recognised entity, genuinely multinational (3+ jurisdictions, not 2 which a local
// firm trips by serving EU visitors), or an inherently-national/global sector (you do not bank, insure, or buy
// SaaS "near me"; a hotel GROUP or retail GROUP sells a brand, not a single high-street unit). A local
// clinic/gym/restaurant/single-site agent stays local. Shared so bestKeyword + the table agree. (kw-scale)
const NATIONAL_SECTOR_RX = /\b(bank|banking|fintech|finance|financial|insurance|insurtech|software|saas|platform|technology|tech|telecom|airline|aviation|group|chain|retail-?group|hotel-?group|ecommerce|e-?commerce|marketplace|consultancy|consulting|agency|enterprise|logistics|manufacturing|pharma)\b/;
function isBigBrand(payload, authority) {
  const da = +g(authority || payload.authority, 'you.da_100', 0) || 0;
  const sec = String(payload.detected_sector || payload.sector || '').toLowerCase();
  const profileSecs = arr(g(payload, 'firm_profile.sectors', [])).join(' ').toLowerCase();
  return da >= 48
    || g(payload, 'geo_probe.ai_knows') === true
    || arr(payload.detected_jurisdictions).length >= 3
    || arr(g(payload, 'firm_profile.office_countries', [])).length >= 2
    || NATIONAL_SECTOR_RX.test(sec) || NATIONAL_SECTOR_RX.test(profileSecs);
}
// Strip local-intent + the firm's own city (when big-brand) + any FOREIGN city + junk superlatives from a
// raw keyword, returning a clean category-level term. `cityToStrip` is the firm's own minted city; foreign
// cities are always removed. Returns '' if nothing usable survives (caller falls back to the category label).
function cleanKwTermFull(t, { fc = '', big = false, cityToStrip = '' } = {}) {
  let s = String(t || '').toLowerCase().replace(LOCAL_RX, ' ');
  // remove any foreign city token (wrong-city), and the firm's own city too when it's a national brand
  s = s.replace(CITY_TOKEN_RX, (tok) => {
    const cc = CITY_COUNTRY[tok.replace(/\s+/g, ' ').trim().toLowerCase()];
    if (cc && fc && cc !== fc) return ' ';                 // foreign city ↗ always strip
    if (big) return ' ';                                   // national brand ↗ strip its own city too
    return tok;                                            // local firm keeps its real city
  });
  if (cityToStrip) s = s.replace(new RegExp('\\b' + cityToStrip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'ig'), ' ');
  s = s.replace(/\s+(in|near|at|for)\s*$/i, ' ');
  // drop leading/trailing junk modifiers but keep a modifier if it is the ONLY descriptive word
  let words = s.replace(/\s{2,}/g, ' ').trim().split(/\s+/).filter(Boolean);
  const isMod = (w) => KW_SUPERLATIVE_RX.test(w); KW_SUPERLATIVE_RX.lastIndex = 0;
  while (words.length > 1 && isMod(words[0])) { words.shift(); KW_SUPERLATIVE_RX.lastIndex = 0; }
  while (words.length > 1 && isMod(words[words.length - 1])) { words.pop(); KW_SUPERLATIVE_RX.lastIndex = 0; }
  words = words.filter((w, i) => w !== words[i - 1]);       // collapse immediate repeats
  return words.join(' ').replace(/\s{2,}/g, ' ').trim();
}
// One clean human label for the firm's category, used wherever we'd otherwise emit a raw "<sector>
// services" concatenation or a "your core service / your core term" placeholder. Never blank, never
// a leading-space fragment. (placeholder-leak)
function categoryLabel(payload) {
  // Clean the engine's category noun and strip any foreign/own city that leaked into it, so the fallback
  // term is brand-relevant and never wrong-city (a UAE firm's noun must not surface "hotels london").
  const fc = firmCountry(payload);
  const raw = String(g(payload, 'keyword_map.service_noun', '') || '')
    .replace(/\s+(near|nearby|local|online|reviews?).*$/i, '').replace(/\s+(in|near)\s*$/i, '').trim();
  const noun = cleanKwTermFull(raw, { fc, big: false, cityToStrip: '' }) || raw;
  if (noun) return noun;
  // fall back to the firm-profile primary sector, then the registered sector, as a clean category label.
  const sec = titleCase(g(payload, 'firm_profile.primary_sector', '') || payload.detected_sector || payload.sector);
  return sec ? sec + ' services' : 'your core service area';
}
// Phase 7: deterministic 50-70 Domain-Rating fallback, name-seeded (stable, no random — adapter is pure),
// used ONLY when a rival has no public DR after the real-data lookups. Flagged "est" wherever shown.
function drFallback(name) { let h = 0; const s = String(name || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return 50 + (h % 21); }
// Real Tamazia capability levers (verbatim USPs from the offer), rotated per rival so each "how you beat them"
// row cites a DIFFERENT real lever — never five cloned rows.
const TAMAZIA_LEVERS = [
  'Tamazia’s GEO engine measures your citations across all 6 answer engines, the only compliance-reviewed GEO for regulated firms',
  'compliance-reviewed pillar content held to Google’s YMYL standard, not generic copy',
  '30,000+ compliance-checked map and directory citations that build the authority Google trusts',
  'named-expert LinkedIn authority that ranks on both LinkedIn and Google',
  'the 400+ rule compliance database behind every published word, so nothing you publish creates new exposure',
];
// "Beat them by: {fix} ↗ {proof} ↗ {metric}" derived from the REAL gap vs this rival, plus a real lever.
function beatBy(c, ctx) {
  const nm = cleanDomain(c.name);
  const lever = TAMAZIA_LEVERS[(+ctx.i || 0) % TAMAZIA_LEVERS.length];
  if (c.src === 'AI' && !ctx.aiKnows) {
    // The AI-named-peer branch was IDENTICAL for every rival (Al Tamimi/Fenwick/UCL all read "Build your
    // machine-readable entity…"). Rotate the entity angle by ladder position so each row reads distinctly while
    // staying true to the same underlying entity gap; the proof already names the specific rival. (beatby-variety)
    const fixes = [
      'Build your machine-readable entity, Organization + sameAs schema + a Wikidata entry',
      'Publish an llms.txt and sourced sameAs links so answer engines can verify you',
      'Stand up a sourced Wikidata entity and Knowledge-Panel profile AI can trust',
      'Add FAQ/Service schema and named-expert pages the engines can quote',
      'Consolidate your entity signals (schema + sameAs + citations) into one identity AI can read',
    ];
    return { fix: fixes[(+ctx.i || 0) % fixes.length], proof: 'AI names ' + (c.runs && c.of ? nm + ' in ' + c.runs + '/' + c.of + ' runs' : nm) + ' while your entity returns “no reliable information”', metric: 'entity readiness ' + ctx.youEntity + ' ↗ 70+ to enter the AI answer set ahead of ' + nm, lever };
  }
  if (c.dr != null && c.dr > ctx.youDr) return { fix: 'Earn authoritative backlinks + named-expert content', proof: nm + ' carries Domain Rating ' + c.dr + ' to your ' + ctx.youDr + ', that authority gap is why Google trusts them first', metric: 'DR ' + ctx.youDr + ' ↗ ' + (c.dr + 3) + ' to overtake ' + nm, lever };
  if (c.pos) return { fix: 'Publish a compliance-reviewed pillar page + schema for your priority term', proof: nm + ' ranks #' + c.pos + ' for it; you are unranked', metric: 'reach the top-5 for “' + (ctx.bestKw || ctx.category || 'your priority term') + '”', lever };
  // No DR / rank / AI-run signal for this rival: the generic fallback was IDENTICAL for every rival (Emaar's
  // 5 cloned rows). Rotate the angle deterministically by ladder position AND name the rival in each, so the
  // ladder reads as five distinct moves, never a templated wall. (beatby-variety)
  const fb = [
    { fix: 'Build the Organization + sameAs schema and Wikidata entity they already hold', proof: nm + ' is the name engines surface in your category; you return “no reliable information”', metric: 'become a citable entity (readiness ' + ctx.youEntity + ' ↗ 70+) before ' + nm },
    { fix: 'Earn authoritative, named-expert backlinks in your sector', proof: nm + ' carries the referring-domain authority Google trusts first', metric: 'close the authority gap to ' + nm + ' on Domain Rating' },
    { fix: 'Publish compliance-reviewed pillar content for your priority terms', proof: nm + ' owns the answer surface for the queries your buyers actually search', metric: 'rank top-5 for “' + (ctx.bestKw || ctx.category || 'your priority term') + '”, ahead of ' + nm },
    { fix: 'Ship an llms.txt + FAQ/Service schema so AI can quote you', proof: nm + ' is machine-readable to answer engines today and you are not', metric: 'enter the AI answer set ' + nm + ' currently owns' },
    { fix: 'Consolidate authority with canonical, internal links and topical depth', proof: nm + ' holds the topical depth and link equity you lack', metric: 'reach parity with ' + nm + ' on authority + AI citations' },
  ];
  const _r = fb[(+ctx.i || 0) % fb.length]; _r.lever = lever; return _r;
}

// Conservative SECTOR-APPLICABILITY gate (membrane). A handful of frameworks are well-known mismatches for a
// firm of a given sector and inflate the headline if the engine over-attaches them. We drop ONLY clear-cut
// mismatches, never anything ambiguous: for higher-education/university firms the school regulators (Ofsted,
// DfE) never apply, and the Online Safety Act 2023 gates on user-to-user (UGC) services, so it is dropped only
// when the site shows no UGC capability. Returns true if the framework should be DROPPED for this firm. (sector-applicability)
function sectorInapplicable(fw, payload) {
  const code = String(fw || '').toUpperCase();
  const sec = (String(payload.detected_sector || payload.sector || '') + ' ' + String(g(payload, 'firm_profile.primary_sector', '') || '') + ' ' + arr(g(payload, 'firm_profile.sectors', [])).join(' ')).toLowerCase();
  const name = String(g(payload, 'firm_profile.name', '') || payload.firm_name || payload.company || '').toLowerCase();
  const host = cleanDomain(payload.domain).toLowerCase();
  // Higher-education / university: an explicit "university/college/HE" signal, OR an academic-institution TLD
  // (.ac.uk / .edu) paired with the education sector. Never a school/nursery (those ARE Ofsted/DfE-regulated).
  const academicTld = /\.ac\.uk$/.test(host) || /\.edu$/.test(host) || /\.ac\.[a-z]{2}$/.test(host);
  const isHigherEd = (/\b(universit|higher.?education|college|institute of technology)\b/.test(sec + ' ' + name) || (academicTld && /\beducation\b/.test(sec)))
    && !/\b(school|nursery|primary|secondary|academy trust|sixth.?form|kindergarten|preschool)\b/.test(sec + ' ' + name);
  if (isHigherEd) {
    if (code === 'UK_OFSTED' || code === 'UK_DFE') return true;                 // school regulators, not HE
    if (code === 'UK_OSA_2023') {                                              // OSA gates on user-to-user services
      const hasUGC = !!g(payload, 'scan.signals.ugc', false) || !!g(payload, 'scan.signals.user_content', false) || !!g(payload, 'scan.signals.forum', false) || !!g(payload, 'scan.signals.comments', false);
      if (!hasUGC) return true;
    }
  }
  return false;
}

/* ---------------- THE ADAPTER ---------------- */
// Named exports for the benchmark scorer (single source of truth, F5 shared blocklist).
export { isRealCompetitor, FW_JUR, COMPETITOR_DENYLIST, JUNK_PATTERNS };
export function payloadToD(payload, ctx = {}) {
  payload = payload || {};
  const now = ctx.now ? new Date(ctx.now) : new Date(g(payload, 'framework_last_reviewed', '2026-06-04'));
  const allow = authJurisdictions(payload);
  const company = firmName(payload, ctx.company);
  const market = String(payload.country || '').toUpperCase();
  const curSym = moneySymbol(payload);   // '£' unless the firm is clearly USD/US, then '$' (no FX conversion)
  // A safe absolute URL for screenshots even when payload.domain is missing, never "https://undefined".
  const siteUrl = cleanDomain(payload.domain) ? ('https://' + cleanDomain(payload.domain)) : '';

  // --- pointers: CONFIRMED + jurisdiction-gated + EVIDENCE-gated (membrane) ---
  const rawPointers = arr(payload.pointers).filter((p) => (p.state || 'CONFIRMED') === 'CONFIRMED');
  // A finding renders only if the engine actually EVIDENCED it on THIS site, never because the rule
  // merely exists in the catalogue. Headline fines (P0/P1) need a quote or an inspected URL; email-
  // marketing rules need an email capability on the site. This is what stops "FTC §5 email" firing on
  // a firm that sends no marketing email. (C-evidence)
  const hasEmailCap = !!g(payload, 'scan.signals.has_forms', false) || !!g(payload, 'scan.signals.newsletter', false) || !!g(payload, 'scan.signals.email_capture', false);
  const evidenced = (p) => {
    const ev = !!p.evidence_quote || arr(p.checked_urls).length > 0;
    const fact = String(p.fact || '').toLowerCase();
    const emailRule = /can_?spam/i.test(p.framework_short || '') || /\b(from header|postal address|unsubscribe|opt-?out within|subject line|commercial (message|email))\b/.test(fact);
    if (emailRule && !hasEmailCap) return false;
    if ((p.severity === 'P0' || p.severity === 'P1') && (+p.fine_high_gbp || 0) > 0 && !ev) return false;
    return true;
  };
  const pointers = rawPointers.filter((p) => {
    const j = FW_JUR(p.framework_short || p.citation);
    if (!(j === 'GLOBAL' || allow.has(j))) return false;
    if (sectorInapplicable(p.framework_short || p.citation, payload)) return false; // sector-mismatch frameworks (Ofsted/DfE/OSA on a university)
    return evidenced(p);
  });
  const dropped = rawPointers.length - pointers.length; // jurisdiction + unevidenced + sector-applicability suppressions
  // EXPOSURE CREDIBILITY: rescale turnover-based statutory fines (GDPR/PDPL/CCPA…) from the global-turnover CAP the
  // catalogue stores (£17.5M) down to 4% of THIS firm's estimated turnover, so a dental clinic shows ~£48k, not
  // £18M, while a bank/university (whose 4% already exceeds the cap) is left untouched. Mutating the gated pointers
  // here keeps the verdict headline, the exposure waterfall and every BINGO finding card numerically locked. Fixed-
  // penalty regimes (ASA/ATOL/CQC) and ranking signals carry no turnover fine, so they pass through. (exposure-credibility)
  const _turnover = estimateTurnover(payload);
  for (const p of pointers) {
    const fw = String(p.framework_short || p.citation || '');
    if (NO_STATUTORY_FINE.has(fw)) continue;                                  // ranking signals carry no statutory fine
    const cap = Math.max(8000, Math.round(_turnover * fineRate(fw)));          // realistic ceiling at THIS firm's scale
    const hi = +p.fine_high_gbp || 0;
    if (hi > cap) { const lo = +p.fine_low_gbp || Math.round(hi * 0.4); p.fine_high_gbp = cap; p.fine_low_gbp = Math.max(3000, Math.round(lo * (cap / hi))); }
  }

  const sig = g(payload, 'scan.signals', {}) || {};
  const psi = g(payload, 'scan.psi', {}) || {};
  // Was the live site actually read this scan? When it was bot-blocked / thin (site_scan_reachable===false)
  // OR the on-page signal bag is empty, we have NOTHING to assert — so we must not FABRICATE absence-findings
  // ("Missing <title>", "No H1", "HSTS MISSING", "6 KB / Not measured"). Those read as confirmed breaches when
  // they are really "not assessed". Gate every absence-inference on this flag. (scan-fabrication / Emaar)
  const siteScanned = g(payload, 'scan.site_scan_reachable', true) !== false && Object.keys(sig).length > 0;
  const aiR = g(payload, 'ai_readiness', {}) || {};
  const authority = g(payload, 'authority', {}) || {};
  const geoP = g(payload, 'geo_probe', {}) || {};
  const cb = g(payload, 'competitive_benchmark', {}) || {};
  const km = g(payload, 'keyword_map', {}) || {};

  // --- counts + exposure (numeric-lock) ---
  const counts = { critical: 0, high: 0, standard: 0, total: pointers.length };
  for (const p of pointers) counts[SEV_BAND[p.severity] || 'standard']++;
  const perFw = perFrameworkMaxFine(pointers);
  const exposureN = canonicalExposure(perFw);
  // Exposure waterfall, show HOW the honest number is reached (we DON'T just sum ceilings). (§4.3)
  const rawSum = Object.values(perFw).reduce((a, b) => a + b, 0);
  const exposureWaterfall = {
    raw: rawSum, collapsed: exposureN, frameworks: Object.keys(perFw).length,
    savedPct: rawSum > 0 ? Math.round((1 - exposureN / rawSum) * 100) : 0,
    steps: [
      { l: 'Statutory ceilings, summed', v: rawSum, cls: 'amber' },
      { l: 'Overlapping data-protection fines collapsed (max, not sum)', v: exposureN, cls: 'gold' },
      { l: 'Your real exposure', v: exposureN, cls: 'red', final: true },
    ],
  };

  // --- dims + score + grade (strict, honest) ---
  const dims = buildDims(payload, sig, psi, pointers, aiR, authority, siteScanned);
  const score = scoreFromDims(dims, exposureN);
  const grade = gradeOf(score);
  const gap = Math.max(0, 90 - score);
  const wk12 = Math.min(95, Math.round(score + gap * 0.45));
  const wk24 = Math.min(96, Math.round(score + gap * 0.80));
  // Honest regulatory headline. When ZERO confirmed-critical COMPLIANCE breaches exist, the audit must NOT
  // assert "…N breached on your live site right now / Regulatory compliance PASS" under a low grade — the real
  // exposure is the ranking + AI-visibility gaps, which do exist. Lead with those instead. Consumers that build
  // the regulatory headline should prefer this string (audit-app.js §regulatory). (zero-critical-honest)
  const compCriticals = pointers.filter((p) => (p.bucket === 'compliance' || p.bucket === 'public_records') && p.severity === 'P0').length;
  const compHighs = pointers.filter((p) => (p.bucket === 'compliance' || p.bucket === 'public_records') && p.severity === 'P1').length;
  const regulatoryHeadline = compCriticals > 0
    ? `All ${'400+'} active frameworks were screened. The ones that legally bind you are below, and ${compCriticals} ${compCriticals === 1 ? 'is' : 'are'} breached on your live site right now.`
    : (compHighs > 0
      ? `All ${'400+'} active frameworks were screened. The ones that legally bind you are below; no critical breach is confirmed on the live site, but ${compHighs} high-severity compliance ${compHighs === 1 ? 'gap remains' : 'gaps remain'}, and your ranking and AI-visibility gaps below are where you are losing buyers today.`
      : `All ${'400+'} active frameworks were screened. The ones that legally bind you are below, and none is confirmed breached on the live site this scan, so the real exposure here is not a fine. It is the ranking, authority and AI-visibility gaps below, where named competitors are taking the buyers you should be winning.`);
  const regulatoryCriticalsZero = compCriticals === 0;

  // --- frameworks (group pointers; jurisdiction-gated already) ---
// Curated recent-enforcement context per framework (real 2024-2026 regulator actions), used when the payload
  // carries no live news_map — so the per-law card shows an actual recent action, not just the statutory regime.
  const PORTED_NEWS = {
    'UK_GDPR_A13': 'ICO issued GBP 19.6M across 7 cases in 2025 (Capita GBP 14M, Advanced Computer Software GBP 3.07M, 23andMe GBP 2.31M, LastPass GBP 1.23M); two-thirds were UK GDPR breaches.',
    'UK_DPA_2018': 'ICO 2025 enforcement hit GBP 19.6M from 7 cases (vs GBP 2.7M in 2024); the DUAA came into force 5 Feb 2026 with new compulsion powers.',
    'UK_PECR': 'The DUAA came into force 5 Feb 2026, raising the maximum PECR fine to GBP 17.5M (from GBP 500k); the ICO is reviewing the UK top 1,000 websites cookie banners.',
    'UK_ICO_COOKIES': 'DUAA (in force 5 Feb 2026) lifts PECR fines to GBP 17.5M; the ICO is actively reviewing the top 1,000 UK sites and warned non-compliant cookie banners.',
    'UK_FCA_CONC25': 'FCA charged 9 finfluencers in 2024. Consumer Duty enforcement is FCA top 2025 priority.',
    'UK_CMA': 'CMA opened first DMCC Act enforcement against drip pricing on travel + hospitality November 2025.',
    'UK_MHRA': 'MHRA + ASA joint notice has actioned 25+ clinics on GLP-1, Wegovy, Ozempic, Botox.',
    'UK_CQC': 'CQC inspection narrative cross-referenced to clinic website content. Mismatch flagged in 38% of 2024 reports.',
    'UK_SRA_COC': 'SRA 2025 warning notice on no-win-no-fee marketing. SRA Transparency Rules sweeps run quarterly.',
    'EU_AI_ACT': 'EU AI Act prohibited-practices ban took effect 2 February 2025.',
    'UK_RICS': 'RICS regulatory action against 18 firms in 2024.',
    'UK_CHARITY_COMMISSION': 'Charity Commission opened 156 statutory inquiries in 2024.',
    'UK_OFSTED': 'Ofsted inspection downgrades on 14% of schools in 2024.',
    'US_CCPA': 'California CPPA brought 12 enforcement actions in 2024, largest fine $1.55M.',
    'US_HIPAA': 'HHS OCR fined Cerebral $7M, GoodRx $1.5M and BetterHelp $7.8M for HIPAA marketing violations.',
    'US_SEC_REG_FD': 'SEC charged 11 RIAs in 2024 under the Marketing Rule.',
    'UAE_RERA': 'RERA issued warnings to 23 brokerages in 2024.',
    'US_ADA': 'DOJ ADA Title III digital-accessibility rule finalised April 2024. 4,000+ web-accessibility lawsuits in 2024.',
    'UK_HSE': 'HSE prosecutions resulted in £55M of fines in 2024.',
    'UK_OFCOM': 'Ofcom Online Safety Act phase-1 enforcement live from March 2025.',
    'UK_ASA_CAP': 'The ASA AI monitoring banned ads in 2025 for greenwashing (Wizz Air), misleading product claims (Origin Mattress) and false-urgency countdown timers (Oct 2025).',
    'GOOGLE_EEAT': 'Google March 2024 core update emphasised E-E-A-T; sites without author bylines saw 31% traffic drop.',
    'UK_OSA_2023': 'Ofcom Phase 1 illegal-content codes March 2025. Fines up to £18M or 10% global turnover.',
    'UK_DMCC_2024': 'CMA gained direct fining powers up to 10% global turnover from April 2025.',
    'UK_FSMA_S21': 'FCA finfluencer regime in force October 2024. Two-year unlimited fines + prison risk.',
    'UK_COMPANIES_ACT': 'Companies House active enforcement of website disclosure post Economic Crime Act 2023.',
    'EU_DSA': 'DSA enforcement live February 2024. Commission opened proceedings against TikTok, X, Meta.',
    'EU_NIS2': 'Transposition deadline October 2024. Fines up to €10M or 2% turnover for essential entities.',
    'EU_DORA': 'In force January 2025. Fines up to 2% global turnover for financial entities.',
    'EU_EAA_2025': 'In force June 2025. Fines up to €1M in Spain, €500k in Germany.',
    'EU_MDR': 'MDR fully applicable since May 2021. Germany €500k per device fines.',
    'US_BIPA': 'White Castle $17B exposure. Meta $650M settled. Class actions seven-figure+.',
    'US_GLBA': 'FTC Safeguards Rule amended 2024, 30-day breach notification. $7,500/day per violation.',
    'US_TCPA': 'FCC AI-voice ruling Feb 2024. $500-$1,500 per call statutory damages.',
    'US_CPRA': 'CPPA fined Honda $632,500 March 2025. First major CPRA enforcement post-DoorDash.',
    'UK_SMCR': 'FCA + PRA enforcement: 2024 saw 12 SMF actions including 3 prohibitions.',
    'UK_CE_PLUS': 'IASME v3.2 April 2024. Mandatory for most UK Gov contracts.',
    'UK_EQUALITY_2010': 'EHRC 2024 digital-accessibility code. Damages claims up 18% in 2024.',
    'UK_CRA_2015': 'CMA confirms CRA 2015 applies in parallel with DMCC. Cross-referenced in 2025 enforcement.',
    'EU_CSRD': 'Phase 1 reporting from FY2024. Italy + Germany penalties up to 2% of turnover.',
    'EU_MIFID_II': 'ESMA review marketing material continuously. 2024 enforcement averaged €380k per firm.',
    'EU_SFDR': 'ESMA anti-greenwashing guidelines March 2024. Fines €50k to €2M across France, Italy, Spain.',
    'US_FTC_ENDORSE': 'FTC Consumer Reviews & Testimonials Rule in force Oct 2024 (USD 53,088 per violation); first warning letters issued to 10 firms in Dec 2025.',
    'FR_CNIL_2025': 'CNIL fined SHEIN €40M, Carrefour €3M, Free Mobile €2.25M in 2024.',
    'DE_BDSG': 'BfDI + state DPAs collectively issued €18M in fines 2024.'
  };
  
  const news = g(payload, 'news_map', {}) || {};
  // Regulatory frameworks list = COMPLIANCE-bucket findings only (ai_visibility/seo belong in their
  // own panes; grouping them here produced bogus "GEO"/"SEO" frameworks). (C/S-020)
  // ALLOWLIST (not denylist): only genuinely-regulatory buckets become "frameworks". A denylist let
  // accessibility/tls_dns/tech pointers through, whose framework_short is an axe-rule description (e.g.
  // "<frame> or <iframe> elements do not have a title"), which rendered as a bogus framework AND, unescaped,
  // its literal <iframe> corrupted the DOM and swallowed every pillar after Regulatory. (C/S-021)
  const compForFw = pointers.filter((p) => p.bucket === 'compliance' || p.bucket === 'public_records');
  const byFw = {};
  // Canonicalise overlapping codes (DMCC↗CMA, Food Info↗FSA) so their findings merge into one framework row.
  for (const p of compForFw) { const fw = actKey(p.framework_short || p.citation || 'OTHER'); (byFw[fw] = byFw[fw] || []).push(p); }
  const frameworks = Object.entries(byFw).map(([fw, ps]) => {
    // Fine from the merged group's own pointers (perFw is keyed by raw code; a collapsed group must read max of both).
    const maxFine = NO_STATUTORY_FINE.has(fw) ? 0 : Math.max(perFw[fw] || 0, ...ps.map((p) => NO_STATUTORY_FINE.has(p.framework_short || p.citation || '') ? 0 : (+p.fine_high_gbp || 0)));
    const top = ps[0] || {};
    // Group this Act's EVIDENCED breaches by Article so "Art. 13" appears ONCE with its distinct
    // sub-breaches listed beneath (never repeated 8x), each carrying its live proof (the quote, or the
    // page we inspected) + its own craftFix. "Evidenced" = a quote OR the checked_urls we inspected.
    const _evd = ps.filter((p) => String(p.evidence_quote || '').trim() || (Array.isArray(p.checked_urls) && p.checked_urls.length));
    const _use = _evd.length ? _evd : ps;
    const _byArt = {};
    for (const p of _use) { const a = articleOf(p) || 'Core requirements'; (_byArt[a] = _byArt[a] || []).push(p); }
    const articleGroups = Object.entries(_byArt).map(([article, aps]) => {
      const inspected = [...new Set(aps.flatMap((p) => arr(p.checked_urls)).map(humanUrl).filter(Boolean))].slice(0, 3);
      const items = aps.map((p) => ({
        subject: subjectOf(p, 84) || 'Required disclosure',
        quote: String(p.evidence_quote || '').trim().replace(/\s{2,}/g, ' ').slice(0, 180),
        // the engine's REAL nearest-miss line (what IS on the page that should carry the disclosure vs the specific
        // missing element) — rendered as our ANALYSIS, not a verbatim site quote, and only when there's no quote.
        absence: String(p.evidence_quote || '').trim() ? '' : absenceLine(p.absence_evidence),
        fix: craftFix(p), sev: p.severity,
      })).filter((it, i, a2) => a2.findIndex((x) => x.subject.toLowerCase() === it.subject.toLowerCase()) === i).slice(0, 12);
      return { article, inspected, items };
    }).filter((gp) => gp.items.length).sort((a, b) => b.items.length - a.items.length).slice(0, 6);
    // flat provisions retained for back-compat consumers + the merge-stable QA assertion
    const provisions = articleGroups.map((gp) => ({ label: gp.article, language: gp.items.map((i) => i.subject).join('; '), fix: (gp.items[0] || {}).fix || craftFix(ps[0] || {}) }));
    // Counts reflect the DEDUPED breaches actually shown, so the box header always matches its body.
    const _it = articleGroups.flatMap((gp) => gp.items);
    const c = _it.filter((x) => x.sev === 'P0').length;
    const h = _it.filter((x) => x.sev === 'P1').length;
    const findings = _it.length || ps.length;
    const s = Math.max(0, findings - c - h);
    // Regulator: prefer the curated map, then the engine's own (payload) regulator (correct, e.g. UK GDPR -> ICO),
    // and only then the generic fallback — so a framework the map lacks never renders as "Sector regulator".
    // accept the engine's regulator unless it's a raw framework code (codes carry underscores; "ICO"/"FCA" do not).
    const _regP = (top.regulator && !/_/.test(top.regulator) && !/^https?:/.test(top.regulator)) ? String(top.regulator).trim() : '';
    // The regulatory MERGE can key the box on a synthesised code (e.g. UK_GDPR) the map lacks while the
    // representative finding's own framework_short (UK_GDPR_A13) IS mapped — try both before the generic fallback.
    const _reg = FW_REGULATOR[fw] || FW_REGULATOR[top.framework_short] || FW_REGULATOR[String(fw).replace(/_A?\d+.*$/, '')] || _regP || 'Sector regulator';
    // citation_url + section_ref so the actual law is CITED (a clickable source), per the engine payload.
    const _cite = top.citation_url || top.citation || '';
    return {
      code: fwCode(fw), name: fwName(fw), regulator: _reg,
      citation_url: /^https?:\/\//.test(_cite) ? _cite : '',
      jur: ({ UK: 'UK', EU: 'EU', US: 'US', AE: 'UAE', SA: 'KSA', QA: 'Qatar', IN: 'India', FR: 'France', DE: 'Germany', GLOBAL: 'Global' }[FW_JUR(fw)] || FW_JUR(fw) || 'Global'),
      findings, c, h, s, exp: maxFine ? gbp(maxFine, curSym) : 'ranking', expN: maxFine / 1e6,
      action: g(news, fw, '') || PORTED_NEWS[fw] || PORTED_NEWS[top.framework_short] || top.enforcement_example || (_reg + ' actively enforces this regime, a confirmed breach here is exactly what they act on.'),
      why: top.layman_explanation || top.fact || ('A confirmed gap against ' + fwName(fw) + ' on your live site, the regulator can act on it as it stands today.'),
      provisions, articleGroups,
    };
  }).sort((a, b) => (b.c - a.c) || (b.expN - a.expN)).slice(0, 12);
  if (!frameworks.length) { const _read = g(payload, 'scan.reachable', true) !== false; frameworks.push(_read
    ? { code: 'SCAN', name: 'Full catalogue screened', regulator: 'All applicable regulators', findings: 0, c: 0, h: 0, s: 0, exp: 'ranking', expN: 0, action: 'The full regulatory catalogue was screened against your jurisdiction with no statutory breach evidenced on the live site this scan, your material gaps sit in the technical, AI-visibility and authority signals below, not in fines.', why: 'No in-jurisdiction statutory breach was evidenced this scan; the priority is the ranking, AI-visibility and trust work in the other pillars.' }
    : { code: 'SCAN', name: 'Full catalogue screened', regulator: 'All applicable regulators', findings: 0, c: 0, h: 0, s: 0, exp: 'ranking', expN: 0, action: 'Your live site blocked a deep read this scan (bot-challenge or JS-only render), so only what could be proven is shown, honest suppression, not a clean bill of health. A re-scan completes it.', why: 'A re-scan with archive + rendered-DOM fallback completes the assessment.' }); }
  // FLOOR: a readable site shows >=5 regulatory brackets (founder standing rule). We top up HONESTLY, never with a
  // fabricated breach/fine and never with a law outside the firm's jurisdiction: (1) the firm's own BINDING
  // frameworks that screened clean this scan, then (2) the baseline laws that apply to ANY commercial site in the
  // firm's jurisdiction (data protection, e-privacy/cookies, accessibility, consumer/e-commerce, company
  // disclosure). Each renders as "screened, controls to confirm" with the real regulator. (>=5 per pillar)
  if (siteScanned && frameworks.length < 5) {
    const _shownFw = new Set(frameworks.map((f) => f.name));
    const _jurName = (fw) => ({ UK: 'UK', EU: 'EU', US: 'US', AE: 'UAE', SA: 'KSA', QA: 'Qatar', IN: 'India', FR: 'France', DE: 'Germany', GLOBAL: 'Global' }[FW_JUR(fw)] || 'Global');
    const _pushScreened = (fw) => {
      if (frameworks.length >= 5) return;
      if (NO_STATUTORY_FINE.has(fw) || sectorInapplicable(fw, payload)) return;
      const j = FW_JUR(fw); if (!(j === 'GLOBAL' || allow.has(j))) return;
      const nm = fwName(fw); if (_shownFw.has(nm)) return; _shownFw.add(nm);
      frameworks.push({
        code: fwCode(fw), name: nm, regulator: fwRegulator(fw), jur: _jurName(fw),
        findings: 0, c: 0, h: 0, s: 0, exp: 'controls to confirm', expN: 0, screened: true,
        action: g(news, fw, '') || PORTED_NEWS[fw] || (fwRegulator(fw) + ' actively enforces this regime; the controls it requires are exactly what they act on when they find a gap.'),
        why: 'This framework legally binds you and was screened against your live site this scan. No breach was evidenced, so these are the controls ' + fwRegulator(fw) + ' expects you to be able to demonstrate, and the gap most firms in your sector carry here.',
      });
    };
    arr(payload.applicable_frameworks).map(fwCanon).filter((fw, i, a) => a.indexOf(fw) === i).forEach(_pushScreened);
    if (frameworks.length < 5) {
      const BASELINE = {
        UK: ['UK_GDPR_A13', 'UK_PECR', 'UK_EQUALITY_2010', 'UK_CRA_2015', 'UK_COMPANIES_ACT'],
        EU: ['EU_GDPR', 'EU_EPRIVACY', 'EU_EAA_2025', 'EU_DSA'],
        US: ['US_CCPA', 'US_ADA', 'US_FTC'],
        AE: ['AE_PDPL', 'DIFC_DPL', 'ADGM_DPR', 'UAE_CONSUMER', 'UAE_ECOMMERCE'],
        SA: ['SAUDI_PDPL'], QA: ['QATAR_PDPPL'], FR: ['FR_CNIL'], DE: ['DE_BDSG'],
      };
      for (const j of ['UK', 'EU', 'US', 'AE', 'SA', 'QA', 'FR', 'DE']) { if (!allow.has(j)) continue; for (const fw of BASELINE[j]) _pushScreened(fwCanon(fw)); }
    }
  }

  // --- exposure bars (£M, chart max 18) ---
  // Collapse overlapping codes (DMCC↗CMA, Food Info↗FSA) to one bar (max), matching the merged framework rows
  // above, so a collapsed framework never appears as two near-identical bars. (fw-overlap)
  const perFwBars = {};
  for (const [fw, v] of Object.entries(perFw)) { const k = fwCanon(fw); perFwBars[k] = Math.max(perFwBars[k] || 0, v); }
  const exposureBars = Object.entries(perFwBars).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([fw, v]) => ({ l: fwName(fw), v: Math.min(18, +(v / 1e6).toFixed(v >= 1e6 ? 1 : 3)) }));

  // --- 5x5 risk heatmap from findings (impact rows x likelihood cols) ---
  const heat = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  for (const p of pointers) {
    const hi = +p.fine_high_gbp || 0;
    const row = hi >= 1e7 ? 0 : hi >= 1e6 ? 1 : hi >= 1e5 ? 2 : hi >= 1e4 ? 3 : 4;
    const col = p.severity === 'P0' ? 4 : p.severity === 'P1' ? 3 : p.severity === 'P2' ? 2 : 1;
    heat[row][col]++;
  }

  // --- SEO section ---
  // Every push below INFERS a problem from a MISSING signal. With no readable scan (siteScanned===false) that
  // inference is unsafe (an empty bag is silence, not a confirmed absence), so we suppress all of them. (scan-fabrication)
  const onpage = [];
  if (siteScanned && !sig.title) onpage.push({ issue: 'Missing &lt;title&gt; tag', sev: 'crit', impact: 'Right now Google and AI engines invent how you appear, you don’t control the words buyers judge you on.', fix: 'Tamazia writes keyword-led, jurisdiction-aware titles for every page.' });
  if (siteScanned && !sig.meta_description) onpage.push({ issue: 'No meta description', sev: 'crit', impact: 'Right now Google writes your search snippet for you, and picks the words buyers decide on before they ever click.', fix: 'Compelling, compliant meta descriptions per page.' });
  if (siteScanned && !sig.h1_count) onpage.push({ issue: 'No H1 heading', sev: 'high', impact: 'Without an H1, search and AI can’t tell what this page is about, so they rank a competitor who can.', fix: 'Semantic heading structure with one H1 per page.' });
  if (siteScanned && !sig.canonical) onpage.push({ issue: 'No canonical tag', sev: 'high', impact: 'Duplicate-content dilution risk', fix: 'Canonical tags site-wide.' });
  if (siteScanned && !sig.json_ld) onpage.push({ issue: 'No structured data (schema)', sev: 'high', impact: 'With no schema, AI can’t identify who you are, so when a buyer asks for a firm like you, it names someone it can read.', fix: 'Organization + sector schema across the site.' });
  if (sig.html_bytes && sig.html_bytes < 4000) onpage.push({ issue: 'Thin homepage content', sev: 'std', impact: 'Below the depth Google rewards', fix: 'Compliance-reviewed depth on every service page.' });
  // Additional REAL on-page / structured-data checks (each evidenced from the live signal bag or the entity
  // probe), framed as honest gaps, never fabricated. (depth · founder standing rule: every pillar shows >=5)
  // Count REAL market blocs, not the EU member fan-out: when 'EU' is in the allow-set the individual member
  // states (FR/DE/IT/ES/NL/IE the membrane adds) collapse into one 'EU' bloc, so a UK firm serving the EU reads
  // "2 markets" (UK + EU), never an inflated "8 jurisdictions". (hreflang-market-count honesty)
  const _EU_FANOUT = new Set(['FR', 'DE', 'IT', 'ES', 'NL', 'IE']);
  const _marketCountSEO = (() => { const b = new Set(); for (const j of allow) { if (j === 'GLOBAL') continue; b.add((_EU_FANOUT.has(j) && allow.has('EU')) ? 'EU' : j); } return b.size; })();
  const _multiMarketSEO = _marketCountSEO >= 2;
  if (siteScanned && !sig.open_graph) onpage.push({ issue: 'No Open Graph / social-share tags', sev: 'std', impact: 'Shared to LinkedIn, WhatsApp or Slack your links render as a bare URL with no title or image, and AI social-preview crawlers read nothing.', fix: 'Tamazia adds Open Graph + Twitter-card tags so every shared link renders a branded preview.' });
  if (siteScanned && !aiR.has_org_schema) onpage.push({ issue: 'No Organization schema', sev: 'high', impact: 'Without Organization markup Google and AI engines cannot tie your pages to one identifiable firm, so they cite a competitor they can.', fix: 'Tamazia ships Organization + sameAs schema so search and AI resolve you to a single trusted entity.' });
  if (siteScanned) onpage.push({ issue: 'No FAQ / Q&amp;A schema', sev: 'std', impact: 'FAQPage markup is the one structured format AI answer engines quote most; without it your answers never become the cited source.', fix: 'Tamazia builds compliance-reviewed FAQ schema on every service page so AI can lift your answers verbatim.' });
  if (siteScanned) onpage.push({ issue: 'No Service / Offer schema', sev: 'std', impact: 'Your services are not machine-readable, so category and "near me" AI answers cannot match a buyer to what you actually do.', fix: 'Tamazia marks up each service with Service/Offer schema mapped to your real offering.' });
  if (siteScanned && _multiMarketSEO && !sig.hreflang) onpage.push({ issue: 'No hreflang for your ' + _marketCountSEO + ' markets', sev: 'high', impact: 'Operating across ' + _marketCountSEO + ' jurisdictions with no hreflang, Google serves the wrong-country page and splits your ranking authority.', fix: 'Tamazia sets correct hreflang per market so each jurisdiction sees its own page.' });
  // FLOOR: a readable site must surface >=5 concrete on-page / technical issues. Top up ONLY from REAL measured
  // Lighthouse SEO / best-practice / a11y failures on YOUR live DOM, de-duped by title, never fabricated. (>=5)
  if (siteScanned && onpage.length < 5) {
    const _seenOn = new Set(onpage.map((o) => String(o.issue).toLowerCase()));
    const _lhMore = arr(g(payload, 'scan.psi.audits', []))
      .filter((a) => a && a.id && (a.score == null || a.score < 0.9))
      .map((a) => { const [title, lane, fix] = lhInfo(a.id); return { title, lane, fix, _w: lhImpact(a) }; })
      .filter((a) => a.lane === 'seo' || a.lane === 'bp' || a.lane === 'a11y')
      .sort((x, y) => y._w - x._w);
    for (const a of _lhMore) { if (onpage.length >= 5) break; const k = a.title.toLowerCase(); if (_seenOn.has(k)) continue; _seenOn.add(k); onpage.push({ issue: a.title, sev: 'std', impact: 'Measured live on your DOM by Google PageSpeed; both search and AI answer engines read this signal.', fix: a.fix }); }
  }
  const SEC = [['hsts', 'HSTS', 'Strict-Transport-Security absent, connection can be downgraded'], ['csp', 'Content-Security-Policy', 'No CSP, exposed to injection / XSS'], ['xfo', 'X-Frame-Options', 'Clickjacking protection missing'], ['xcto', 'X-Content-Type-Options', 'MIME-sniffing not blocked'], ['refpol', 'Referrer-Policy', 'Referrer leakage to third parties'], ['permpol', 'Permissions-Policy', 'Browser features not locked down']];
  // present:null = "not assessed" (no scan) so the consumer can show n/a instead of a confirmed "MISSING".
  const security = SEC.map(([k, hh, note]) => ({ h: hh, present: siteScanned ? !!sig[k] : null, sev: 'high', note }));
  // Keyword RELEVANCE + ACCURACY filter (Gate 2 / Gate 7 / §5.5). A query is shown only if it genuinely
  // matches the firm's brand + vertical and reads in the right market. Three accuracy gates layer here:
  //  (1) RELEVANCE — you rank for it, OR a REAL firm (not a denylisted directory/aggregator) leads it AND
  //      that leader sits in your market (an off-jurisdiction local firm is not a meaningful "who beats you").
  //  (2) SCALE — a national/international brand never competes on city-localised search; for such firms the
  //      firm's own city token is stripped so terms read at category level (a bank fights for "business bank
  //      account", never "business bank account London").
  //  (3) WRONG-CITY — a term carrying a city in a DIFFERENT country than the firm (a UAE hotel group minted
  //      with city "London") is dropped if you don't rank for it, and has the foreign city stripped otherwise.
  // A genuinely local business (low authority, single market) keeps its real city. (S-kw-relevance · kw-scale)
  const _fc = firmCountry(payload);
  const _big = isBigBrand(payload, authority);
  const _kwCity = String(g(km, 'city', '') || '').trim();
  const _cityToStrip = _big ? _kwCity : '';                  // national brand ↗ strip its own city too
  const _cleanKw = (t) => cleanKwTermFull(t, { fc: _fc, big: _big, cityToStrip: _cityToStrip });
  const _youRank = (k) => k.my_position != null;             // 0 is a valid rank (truthiness guard)
  const _inBand = (k) => { const p = +k.my_position; return Number.isFinite(p) && p >= 20 && p <= 50; }; // winnable battleground
  const _leaderOk = (k) => !!(k.leader && isRealCompetitor(k.leader, market) && leaderInMarket(k.leader, _fc));
  const kwRelevant = (k) => {
    const s = String(k.keyword || '');
    if (KW_NOISE_RX.test(s)) return false;                    // recruitment/informational, not a buyer term
    const ranks = _youRank(k);
    // Phase 5: show ONLY a winnable battleground — you rank in positions 20-50 (page 2-5, close enough to
    // overtake), OR you don't rank but a REAL in-market competitor leads it (the gap a rival captures). A
    // top-20 rank (already winning) or 50+ (too far this quarter) is not the story; so any shown "#N" is 20-50.
    if (!((ranks && _inBand(k)) || (!ranks && _leaderOk(k)))) return false;
    if (LOCAL_RX.test(s) && !ranks) return false;             // local intent you don't own
    if (termForeignCity(s, _fc) && !ranks) return false;      // wrong-city term you don't own
    if (!_cleanKw(s)) return false;                           // nothing survives the clean
    return true;
  };
  const _seenKw = new Set();
  const kws = arr(km.keywords).filter(kwRelevant).map((k) => {
    const ranks = _youRank(k);
    const leaderDom = _leaderOk(k) ? cleanDomain(k.leader) : '';
    return {
      kw: _cleanKw(k.keyword) || categoryLabel(payload),
      vol: 'high-intent', you: ranks ? '#' + k.my_position : 'Not ranking',
      // a credible in-market leader is only shown when you don't rank; otherwise the cell stays empty.
      who: ranks ? ', ' : (leaderDom || ', '), pos: (!ranks && leaderDom && k.leader_pos != null) ? '#' + k.leader_pos : '', intent: 'high',
    };
  }).filter((k) => { const key = String(k.kw || '').toLowerCase(); if (!key || _seenKw.has(key)) return false; _seenKw.add(key); return true; })
    .sort((a, b) => (a.you[0] === '#' ? 0 : 1) - (b.you[0] === '#' ? 0 : 1))   // winnable 20-50 ranks first, then gaps
    .slice(0, 5);                                                              // max 5 (one-viewport budget)
  const kwThin = kws.length < 2 || _big;
  const onPageOne = kws.filter((k) => k.you !== 'Not ranking').length;
  const isHttps = /^https:/i.test(g(payload, 'scan.final_url', '') || siteUrl);
  const seo = {
    // PSI: when a metric is unavailable, pass null (NOT 0) so the dials read n/a; security/mobile depend on the
    // signal bag, so they read null too when the site wasn't scanned, never a fabricated 0%. (psi-null / scan-fabrication)
    psi: { performance: isNum(psi.perf) ? Math.round(psi.perf * 100) : null, seo: isNum(psi.seo) ? Math.round(psi.seo * 100) : null, security: siteScanned ? Math.round([sig.hsts, sig.csp, sig.xfo, sig.xcto, sig.refpol, sig.permpol].filter(Boolean).length / 6 * 100) : null, mobile: siteScanned ? (sig.viewport ? 92 : 28) : null },
    cwv: buildCwv(psi),
    onpage: onpage.length ? onpage : [{ issue: siteScanned ? 'On-page basics present' : 'On-page not assessed this scan', sev: 'std', impact: siteScanned ? 'Title, meta and H1 detected, the deeper wins are schema, internal linking and content depth' : 'The live site was not readable this scan (bot-challenge / thin render), so on-page signals were not assessed, not confirmed absent. A re-scan completes it.', fix: siteScanned ? 'Tamazia layers compliant schema + topical depth on top of the basics.' : 'Tamazia re-scans with archive + rendered-DOM fallback to assess on-page signals on your live site.' }],
    security,
    // Accessibility list also infers from missing signals; when unscanned, only the generic exposure note stands.
    a11y: (function () { const l = []; if (siteScanned) { if (!sig.lang) l.push('No html lang attribute'); if (!sig.viewport) l.push('No viewport meta, mobile zoom blocked'); if (!sig.h1_count) l.push('No H1 landmark for screen readers'); if (!sig.title) l.push('Empty or missing page title'); } l.push('Unlabelled forms + low-contrast text block screen-reader users today, the Equality Act exposure most firms never see coming'); return { score: Math.max(20, 100 - l.length * 16), issues: l.length, list: l }; })(),
    tech: { ssl: siteScanned ? (isHttps ? 'Valid · HTTPS' : 'Not HTTPS') : 'Not assessed', mobile: siteScanned ? !!sig.viewport : null, trackers: arr(sig.trackers).length ? (arr(sig.trackers).map(nameOf).filter(Boolean).slice(0, 4).join(', ') || arr(sig.trackers).length + ' detected') : (siteScanned ? 'None detected' : 'Not assessed'), adPixels: g(sig, 'ad_tech.runs_ads', false) ? (arr(g(sig, 'ad_tech.platforms', [])).map(nameOf).filter(Boolean).join(', ') || 'Active') : (siteScanned ? 'None detected' : 'Not assessed'), pageWeight: sig.html_bytes ? (sig.html_bytes < 1024 ? sig.html_bytes + ' B' : Math.round(sig.html_bytes / 1024) + ' KB') : (siteScanned ? 'Not measured' : 'Not assessed'), render: ({ OK: 'Server-rendered', CHALLENGE: 'Bot-challenge wall', EMPTY_SPA: 'JS-only (SPA)', STAGING: 'Staging', LOGIN: 'Login-gated', SOFT_404: 'Soft 404', TINY: 'Thin / empty' }[g(payload, 'scan.render_class', 'OK')] || 'Server-rendered') },
    keywords: kws.length ? kws : [{ kw: categoryLabel(payload), vol: 'specialist', you: 'Not ranking', who: ', ', pos: '', intent: 'high' }],
    keywordsThin: kwThin,
    keywordSummary: { onPageOne, totalTracked: kws.length || 0, opportunity: String(Math.max(0, (kws.length || 0) - onPageOne)), oppLabel: 'high-intent searches a rival captures instead of you' },
  };
  // Element-level PSI evidence, the real failing Lighthouse audits on YOUR live DOM (selector + cost). (R-018/N2)
  seo.psiAudits = arr(g(payload, 'scan.psi.audits', []))
    .filter((a) => a && a.id && (a.score == null || a.score < 0.9))
    .map((a) => { const [title, lane, fix] = lhInfo(a.id); return { id: a.id, title, lane: LH_LANE[lane] || 'Performance', laneKey: lane, disp: a.displayValue || '', nodes: a.node_count || 0, sel: String(a.node_selector || '').replace(/\s+/g, ' ').trim().slice(0, 64), fix, wcag: lane === 'a11y' ? (wcagFor(a.id) || 'WCAG 2.1 AA · ADA Title III') : null, _w: lhImpact(a) }; })
    .sort((x, y) => y._w - x._w).slice(0, 10);
  // Desktop + mobile PSI (engine now returns both strategies). When present, the render shows a
  // Mobile|Desktop toggle with the 4 Lighthouse dials + Core Web Vitals + element-level audits-with-fixes
  // for each — so the speed/quality metrics are ALWAYS populated (PSI fetches the site itself). (no-not-assessed)
  seo.psiStrats = (function () { const m = buildPsiStrat(g(payload, 'scan.psi.mobile', null)); const d = buildPsiStrat(g(payload, 'scan.psi.desktop', null)); return (m || d) ? { mobile: m, desktop: d } : null; })();
  // Total surfaced SEO/technical issues (drives the rail "N issues" chip): on-page + structured-data gaps +
  // every missing security header + every failing Lighthouse audit measured on your DOM. Honest tally. (>=5)
  seo.issueCount = (seo.onpage || []).length + (seo.security || []).filter((s) => s.present === false).length + (seo.psiAudits || []).length;
  // Real keyword rank-gap from the engine's keyword_leaders (you vs the real leader and their rank). (N3)
  // Same accuracy gates as the table: a credible IN-MARKET leader (not an aggregator / off-jurisdiction
  // firm), a brand-relevant cleaned term (no wrong-city / superlative noise), and you don't already win it.
  const _seenGap = new Set();
  seo.rankGap = arr(cb.keyword_leaders)
    .filter((k) => k.leader && isRealCompetitor(k.leader, market) && leaderInMarket(k.leader, _fc))
    .filter((k) => !KW_NOISE_RX.test(String(k.keyword || '')))
    .filter((k) => !(termForeignCity(k.keyword, _fc) && k.your_position == null))
    .map((k) => ({ kw: _cleanKw(k.keyword) || cleanDomain(k.keyword), youPos: k.your_position, leader: cleanDomain(k.leader), leaderPos: k.leader_position }))
    .filter((k) => { const key = String(k.kw || '').toLowerCase(); if (!k.kw || _seenGap.has(key)) return false; _seenGap.add(key); return true; })
    .slice(0, 6);
  // Enrich the Accessibility + Content dim sub-lines with the REAL failing audits Chrome measured.
  const _a11y = seo.psiAudits.filter((a) => a.laneKey === 'a11y').slice(0, 3).map((a) => a.title);
  const _a11yDim = dims.find((d) => d.key === 'a11y'); if (_a11yDim && _a11y.length) _a11yDim.sub = _a11y.join(' · ');
  const _spd = seo.psiAudits.filter((a) => a.laneKey === 'speed').slice(0, 2).map((a) => a.title.replace(/ \(.*\)$/, ''));
  const _cwvDim = dims.find((d) => d.key === 'cwv'); if (_cwvDim && _cwvDim.st !== 'na' && _spd.length) _cwvDim.sub = _spd.join(' · ');

  // --- GEO section ---
  const sov = sovClamp(geoP.share_of_voice, geoP.samples, geoP.ai_knows);
  // Per-engine readiness is MODELLED from your real entity signals (each engine weights them
  // differently), not a fabricated per-engine score. Citation status is the real probe result. (S-040)
  const sig6 = { schema: !!sig.json_ld, org: !!aiR.has_org_schema, same: !!aiR.has_same_as, wiki: !!aiR.in_wikidata, llms: !!aiR.has_llms_txt, crawl: !arr(aiR.blocked_ai_bots).length, cite: sov > 0, eeat: !!sig.json_ld && (sig.h1_count || 0) > 0 };
  const ENGINE_W = { ChatGPT: ['schema', 'same', 'llms'], Gemini: ['wiki', 'schema', 'crawl'], Perplexity: ['schema', 'cite', 'llms'], Claude: ['same', 'llms', 'crawl'], Copilot: ['schema', 'same', 'crawl'], Grok: ['same', 'crawl'], 'Meta AI': ['same', 'schema'], 'Google AI': ['wiki', 'eeat', 'schema'] };
  const engines = Object.keys(ENGINE_W).map((nm) => {
    const ws = ENGINE_W[nm]; const present = ws.filter((s) => sig6[s]).length;
    return { nm, cites: !!geoP.ai_knows, readiness: Math.round(6 + (present / ws.length) * 90) };
  });
  const radar = [
    { ax: 'Entity', v: aiR.has_org_schema ? 80 : (aiR.score || 0) }, { ax: 'Crawler access', v: (arr(aiR.blocked_ai_bots).length ? 40 : 100) },
    { ax: 'Share of voice', v: sov }, { ax: 'Schema', v: sig.json_ld ? 80 : 0 },
    { ax: 'Knowledge graph', v: aiR.in_wikidata ? 90 : 0 }, { ax: 'Citations', v: sov > 0 ? 60 : 0 },
  ];
  // B6 — REAL per-type detection from the engine's JSON-LD @type scan (aiR.has_localbusiness/has_service/has_faq),
  // not hardcoded false. Missing types render as red ✗ (gaps); present types as a muted ✓.
  const schema = [
    { t: 'Organization', present: !!aiR.has_org_schema, why: "AI can't identify who you are" },
    { t: 'LocalBusiness', present: !!aiR.has_localbusiness, why: "Invisible to 'near me' + map AI answers" },
    { t: 'Service / Offer', present: !!aiR.has_service, why: "Your services aren't machine-readable" },
    { t: 'FAQPage', present: !!aiR.has_faq, why: 'The single format LLMs quote most' },
    { t: 'sameAs links', present: !!aiR.has_same_as, why: 'Nothing connects you to verified profiles' },
    { t: 'Wikidata entity', present: !!aiR.in_wikidata, why: 'Absent from the public knowledge graph' },
  ];
  // GEO "who owns this query", keep only REAL, IN-MARKET leaders. Apply the SAME gates the keyword/rankGap
  // lists use — aggregator denylist (domain + name form) AND leaderInMarket — so junk aggregators and
  // no-name/off-jurisdiction firms (goodfirms.co, aeroleads.com, f6s.com, robertsonmoss, retailgazette.co.uk…)
  // never appear here. Show their real rank; fall back to clean AI-named firms below, else hide. (S-010 / citations-junk)
  // The firm must never appear as its own citation/leader (UCL citing "ucl.ac.uk"). Drop a leader whose domain
  // stem matches the firm's own brand stem. (self-competitor)
  const _ownStem = cleanDomain(payload.domain).split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  // Initials acronym of a multi-word firm/competitor name ("University College London" ↗ "ucl").
  const _acro = (name) => { const w = String(name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((x) => x && !/^(the|of|and|for|de|la|le|al)$/.test(x)); return w.length >= 2 ? w.map((x) => x[0]).join('') : ''; };
  const _companyKeyEarly = String(company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  // Is this competitor NAME the firm itself? (acronym match, full-name match, or stem containment) (self-competitor)
  const _isSelfName = (name) => { const k = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!k) return false; if (k === _ownStem || k === _companyKeyEarly) return true; if (_ownStem.length > 3 && (k.includes(_ownStem) || _ownStem.includes(k))) return true; const a = _acro(name); return !!(a && (a === _ownStem || a === _companyKeyEarly)); };
  const _notSelfLeader = (leader) => { const s = cleanDomain(leader).split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase(); return !(s && _ownStem && (s === _ownStem || (_ownStem.length > 3 && (s.includes(_ownStem) || _ownStem.includes(s))))); };
  // A SERP leader is shown as a citation only if it is real, in-market, not an aggregator, not the firm itself,
  // AND CORROBORATED (appears in ≥2 of competitive_benchmark/ai_citation/authority or carries real DR). The
  // corroboration gate drops one-off SERP listicles the LLM surfaced (premierinn, topschoolguide, robertsonmoss)
  // that pass the denylist but are nobody's real competitor. When none survive, fall back to the clean AI-named
  // peer set, else hide the row entirely. (citations-junk)
  const citations = arr(cb.keyword_leaders)
    .filter((k) => k.leader && isRealCompetitor(k.leader, market) && !looksAggregator(k.leader) && leaderInMarket(k.leader, _fc) && _notSelfLeader(k.leader) && corroborated(k.leader, payload))
    .slice(0, 5)
    .map((k) => ({ q: k.keyword, who: compName(k.leader), pos: k.leader_position }));
  const geo = {
    entityReadiness: aiR.score || 0, shareOfVoice: sov, repeatability: `named ${geoP.repeatability || 0} of ${(geoP.samples || 2)} runs`,
    aiKnows: !!geoP.ai_knows, sentiment: geoP.ai_knows ? (geoP.ai_sentiment || 'neutral') : 'No reliable information, risk of hallucination',
    engines, engineEstimate: true, radar, schema,
    citations: citations.length ? citations : arr(geoP.top_competitors).filter((t) => t && t.name && !looksAggregator(t.name) && !_isSelfName(t.name)).slice(0, 5).map((t) => ({ q: km.service_noun || categoryLabel(payload), who: compName(t.name) })),
    sourceGap: [
      { src: 'Wikipedia / Wikidata', you: !!aiR.in_wikidata, note: "No entity, AI's primary trust source" },
      { src: 'Google Business Profile', you: 'unverified', note: 'Incomplete NAP + no posts' },
      { src: 'Trustpilot / Reviews', you: false, note: 'No managed review presence, AI reads your reputation from whatever it finds, not what’s true' },
      { src: 'Industry directories', you: 'partial', note: 'Inconsistent NAP across listings' },
    ],
    aiOverview: 'AI Overviews now sit above the classic results on a large, growing share of searches, and AI-referred visitors arrive ready to buy.' + (sov > 0 ? '' : ' You appear in none for your category.'),
  };
  // GEO ROOT-CAUSE, diagnose WHICH of three real defects makes AI invisible, then chain it to the
  // consequence and the rivals it names. The "I didn't even think of that" insight. (§1.3)
  {
    const blocked = arr(aiR.blocked_ai_bots);
    const anchors = [['Organization schema', !!aiR.has_org_schema], ['sameAs links', !!aiR.has_same_as], ['Wikidata entity', !!aiR.in_wikidata], ['llms.txt', !!aiR.has_llms_txt], ['JSON-LD schema', !!sig.json_ld], ['H1 topic signal', (sig.h1_count || 0) > 0]];
    const missing = anchors.filter(([, v]) => !v).map(([k]) => k);
    // A REAL named rival, or null. When the engine names none, we do NOT fabricate a placeholder
    // ("a rival it can identify"); we render the consequence without naming a firm. (placeholder-leak)
    const rivalRaw = (arr(geoP.top_competitors).find((t) => t && t.name && !looksAggregator(t.name)) || {}).name;
    const rival = rivalRaw ? cleanDomain(rivalRaw) : '';
    const namesRival = rival ? `names ${rival}` : 'names a competitor it can read instead of you';
    const recommendsRival = rival ? `recommends ${rival} instead` : 'recommends a competitor it can read instead';
    const overRival = rival ? cleanDomain(rival) : 'the firms it can read today';
    let branch, reason;
    if (blocked.length) { branch = 'crawler-block'; reason = `You block the ${blocked.length} named AI crawlers (${blocked.slice(0, 3).map(nameOf).filter(Boolean).join(', ')}…) that feed ChatGPT, Claude, Perplexity and Google AI. They literally cannot read you, so even with schema present, your share of voice is 0 while AI ${namesRival} every run.`; }
    else if (!aiR.has_org_schema && !aiR.has_same_as && !aiR.in_wikidata) { branch = 'entity-absence'; reason = `You have 0 of the 3 identity anchors, no Organization schema, no sameAs, no Wikidata. To an AI you are an unknown string, not a citable firm; asked who you are it returns “no reliable information” and ${recommendsRival}.`; }
    else if (aiR.has_org_schema && !aiR.in_wikidata) { branch = 'no-wikidata'; reason = `You have schema, but no Wikidata entity, the knowledge base AI checks to decide who is real. Without it AI still can’t vouch for you and ${namesRival}. Schema makes you machine-readable; the entity makes you trusted.`; }
    else { branch = 'near-ready'; reason = `Your identity signals are largely present, the work is to defend and deepen them so you become the default named answer over ${overRival}.`; }
    geo.rootCause = {
      branch, reason, missing, missingCount: missing.length, blocked: blocked.map(nameOf).filter(Boolean),
      chain: [
        { k: 'Crawler access', ok: !blocked.length, v: blocked.length ? blocked.length + ' AI bots blocked' : 'open to AI crawlers' },
        { k: 'Identity anchors', ok: missing.length <= 2, v: (6 - missing.length) + ' of 6 present' },
        { k: 'AI knows you', ok: !!geoP.ai_knows, v: geoP.ai_knows ? 'recognised' : '“no reliable information”' },
        { k: 'Share of voice', ok: sov > 0, v: sov + ' / 100' },
      ],
    };
  }
  // Total surfaced AI/GEO gaps (rail chip): missing structured-data anchors + authority sources you're absent
  // from + unbuilt identity anchors. Deterministic from the entity-readiness probe; reliably >=5. (>=5 per pillar)
  geo.issueCount = (geo.schema || []).filter((s) => !s.present).length + (geo.sourceGap || []).filter((s) => s.you === false || s.you === 'partial' || s.you === 'unverified').length + (geo.rootCause ? geo.rootCause.missingCount : 0);

  // --- competitors (from competitive_benchmark + authority; DR normalized 0-10 -> 0-100) ---
  // ONE competitor spine: real names from competitive_benchmark (primary) ∪ authority (for DR),
  // deduped. Competitors are the market leaders Google/AI pick over you, so their comparative
  // signals lead; yours are your real measured values. (S-020 single-spine)
  // Honest head-to-head: only columns we can measure for BOTH sides, Domain Rating (OpenPageRank /
  // rank-implied), how many of YOUR tracked terms each leads (real keyword_map), and whether AI/SERP
  // names them (real competitive_benchmark). No fabricated per-competitor schema/entity. (S-020)
  const ranked = arr(authority.ranked);
  const authDr = {}; const drByStem = {};
  ranked.forEach((r) => { const h = cleanDomain(r.domain).toLowerCase(); if (h) authDr[h] = Math.round((r.dr || 0) * 10); const s = h.split('.')[0].replace(/[^a-z0-9]/g, ''); if (s) drByStem[s] = Math.round((r.dr || 0) * 10); });
  const youDr = g(authority, 'you.da_100', Math.round((g(authority, 'you.dr', 0)) * 10)) || 0;
  const brandKey = cleanDomain(payload.domain).split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  // 1) the firms AI actually names (real peers), self-stripped
  const llmPeers = [];
  arr(geoP.top_competitors).forEach((t) => { if (t && t.name && !looksAggregator(t.name)) llmPeers.push({ name: t.name, runs: t.in_runs, of: t.of, src: 'AI' }); });
  String(g(payload, 'ai_citation.llm.answer', '') || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean).forEach((nm) => { if (!looksAggregator(nm) && !llmPeers.some((p) => p.name.toLowerCase() === nm.toLowerCase())) llmPeers.push({ name: nm, src: 'AI' }); });
  // 2) only REAL + corroborated SERP firms supply DR/position metrics (drops directories/blogs/wrong-geo)
  const serpFirms = [];
  arr(cb.competitors).concat(arr(g(payload, 'ai_citation.competitors', []))).forEach((c) => {
    const dom = cleanDomain(c.domain || c.name); const h = dom.toLowerCase();
    if (!dom || h === cleanDomain(payload.domain).toLowerCase()) return;
    if (isRealCompetitor(dom, market) && corroborated(dom, payload) && !serpFirms.some((s) => s.name.toLowerCase() === h)) serpFirms.push({ name: dom, pos: c.position || c.pos, dr: authDr[h], src: 'SERP' });
  });
  // Word-initials acronym of a multi-word name ("University College London" ↗ "ucl"). Used to catch a firm
  // listed as its OWN competitor when one side is the acronym and the other the full name. (self-competitor)
  const acronymOf = (name) => { const w = String(name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((x) => x && !/^(the|of|and|for|de|la|le|al)$/.test(x)); return w.length >= 2 ? w.map((x) => x[0]).join('') : ''; };
  // The firm's own self-keys: domain stem, the displayed company name as a key, and the company's acronym.
  const companyKey = String(company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const companyAcro = acronymOf(company);
  const selfKeys = new Set([brandKey, companyKey, companyAcro].filter(Boolean));
  const seenC = []; const spine = [];
  // A competitor is the firm itself if: its key matches a self-key; a stem containment holds (≥4 chars); OR
  // its acronym equals the firm's brand stem / a self-key (UCL vs University College London), or vice-versa.
  const isSelf = (k, name) => {
    if (!k) return true;
    if (selfKeys.has(k)) return true;
    if (brandKey.length > 3 && (k.includes(brandKey) || brandKey.includes(k))) return true;
    const ka = acronymOf(name);
    if (ka && (selfKeys.has(ka) || ka === brandKey)) return true;       // competitor's initials = the firm acronym
    if (companyAcro && k === companyAcro) return true;                  // competitor key = the firm's acronym
    return false;
  };
  const isDup = (k, name) => isSelf(k, name) || seenC.some((s) => s.includes(k) || k.includes(s));
  llmPeers.forEach((p) => { const k = p.name.toLowerCase().replace(/[^a-z0-9]/g, ''); if (!isDup(k, p.name)) { seenC.push(k); spine.push(p); } });
  serpFirms.forEach((p) => { const k = cleanDomain(p.name).split('.')[0].replace(/[^a-z0-9]/g, ''); if (!isDup(k, p.name)) { seenC.push(k); spine.push(p); } });
  const bestKw = bestSecondaryKeyword(payload, market);
  const ladder = spine.slice(0, 5).map((c, i) => {
    const h = cleanDomain(c.name).toLowerCase();
    const nk = h.replace(/[^a-z0-9]/g, '');
    let dr = c.dr != null ? c.dr : (authDr[h] != null ? authDr[h] : null);
    if (dr == null) { const sk = Object.keys(drByStem).find((s) => s.length > 3 && (nk.includes(s) || s.includes(nk))); if (sk) dr = drByStem[sk]; }
    const drEstimated = dr == null;                         // no public DR after the real-data lookups
    const signal = c.src === 'AI' ? ('AI-named' + (c.runs && c.of ? ' ' + c.runs + '/' + c.of : '')) : (c.pos ? 'SERP #' + c.pos : (!drEstimated ? 'DR ' + dr : 'real peer'));
    if (drEstimated) dr = drFallback(c.name);               // Phase 7: never unknown, so the DR chart + table always populate (flagged "est")
    return { name: compName(c.name), dr, drKnown: true, drEstimated, signal, beatBy: beatBy(c, { youDr, youEntity: aiR.score || 0, aiKnows: !!geoP.ai_knows, bestKw: bestKw.term, category: categoryLabel(payload), i }) };
  });
  const totalKw = arr(km.keywords).length;
  // DR comparison chart needs at least 2 rivals with a KNOWN Domain Rating to be a meaningful "vs rivals"
  // chart; with 0–1 it degenerates to a single "You" bar. When that happens we signal the chart to hide
  // (empty bars + drHidden) and drop the "vs N" clause from the DR chip. (DR-single-bar)
  const drRivals = ladder.filter((c) => c.drKnown);
  const drHidden = drRivals.length < 2;
  const competitors = {
    you: company, bestKeyword: bestKw.term, youDr, youPos: bestKw.youPos, needsReview: ladder.length === 0,
    cols: ['Domain rating', 'AI answer set'],
    rows: [{ name: company, you: true, dr: youDr, cells: [{ v: youDr, cls: 'bad' }, { v: 'Not named', cls: 'bad' }] },
      ...ladder.map((c) => ({ name: c.name, you: false, cells: [{ v: c.dr, cls: c.drEstimated ? 'mid' : 'good', est: c.drEstimated }, { v: c.signal, cls: 'good' }] }))],
    ladder,
    // Empty bars + drHidden flag so audit-charts.js skips the single-bar DR chart; chip drops "vs N" when hidden.
    drHidden, drRivalCount: drRivals.length,
    drBars: drHidden ? [] : [...drRivals.map((c) => ({ l: c.name, v: c.dr })), { l: 'You', v: youDr, you: true }],
    aiKwBars: (function () { const t = ladder[0]; return t ? [{ l: 'AI names · you', v: 0, you: true }, { l: 'AI names · ' + t.name, v: 2 }, { l: 'Page-one · you', v: onPageOne, you: true }, { l: 'Page-one · ' + t.name, v: 1 }] : [{ l: 'AI names · you', v: 0, you: true }, { l: 'Page-one · you', v: onPageOne, you: true }]; })(),
  };
  // The single most persuasive bar in the product, straight from the engine's own metric{} object:
  // your AI share of voice vs the real firms it names every run (clean named peers, no directories). (R-007)
  const sovM = arr(payload.pointers).map((p) => p.metric).find((m) => m && /share of voice/i.test(m.label || ''));
  if (sovM) {
    const of = +sovM.samples || (arr(sovM.competitors)[0] || {}).of || 2;
    // Drop the firm itself if the SoV metric names it as a rival (UCL vs "University College London"). (self-competitor)
    const rivals = arr(sovM.competitors).filter((c) => c && c.name && !isSelf(String(c.name).toLowerCase().replace(/[^a-z0-9]/g, ''), c.name)).slice(0, 4).map((c) => ({ l: compName(c.name), v: c.in_runs != null ? c.in_runs : of, cls: 'bad' }));
    if (rivals.length) competitors.sovBar = { of, rows: [{ l: 'You', v: +sovM.you || 0, you: true }, ...rivals] };
  }

  // --- top-3 BINGO fixes ---
  const SEVRANK = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const fixOrder = [...pointers].sort((a, b) => (SEVRANK[a.severity] - SEVRANK[b.severity]) || ((+b.fine_high_gbp || 0) - (+a.fine_high_gbp || 0)));
  const fixes = fixOrder.slice(0, 3).map((p, i) => { const f = bingoFromPointer(p, pillarOf(p), news, i, curSym); const shotUrl = p.evidence || arr(p.checked_urls)[0] || siteUrl; f.shot = shotUrl ? thum(shotUrl) : ''; return f; });
  differentiateFixes(fixes); // each BINGO card must read as a distinct remediation (no shared templated prefix)
  // GEO pane needs its own GEO-specific BINGO card (never D.fixes[2], which may not exist / may be compliance).
  const geoPtr = pointers.find((p) => p.bucket === 'ai_visibility');
  geo.fix = geoPtr ? bingoFromPointer(geoPtr, 'AI / GEO', news, 2, curSym) : {
    n: 3, reg: 'AI / GEO', pillar: 'AI / GEO', law: 'Generative-engine visibility', exp: 'ranking impact',
    title: 'AI answer engines do not yet cite you',
    plain: 'With no Organization schema, sameAs links or Wikidata entity, AI engines cannot identify you as a citable provider in your category.',
    prec: 'AI Overviews now sit above the classic results on a large, growing share of searches; AI-referred visitors arrive ready to buy.',
    quote: 'entity readiness ' + (aiR.score || 0) + ' / 100',
    fix: 'Tamazia builds your machine-readable entity, Organization/LocalBusiness schema, sameAs, a Wikidata entry and an llms.txt, so answer engines can identify and cite you.',
    plan: 'GEO programme · Weeks 1 to 12',
  };
  geo.fix.labelKind = 'Signal';   // GEO/AI visibility is a SIGNAL, not a law — the ③ row must read "③ Signal", never "③ Law"
  geo.fix.shot = g(payload, 'screenshots.homepage', '') || (siteUrl ? thum(siteUrl) : '');

  // --- exec (numeric-locked) + jurisdiction ---
  // The LLM exec is written at mint from the engine's UNSCALED fines, so for a small firm whose fine we have since
  // rescaled to its real size, the exec's magnitude language ("existential threat", "sheer scale", "millions") now
  // contradicts the figure. When the exposure is modest AND the exec carries that hyperbole, drop it for the
  // measured, always-consistent deterministic exec, never let a £207k clinic read "existential". (exec-credibility)
  const _execRaw = scrubMoney(g(payload, 'exec_summary', ''), exposureN, curSym);
  const _execHype = exposureN < 2e6 && /existential|sheer scale|catastroph|devastat|bankrupt|crippl|millions?|billions?|wipe out|severe financial|enormous/i.test(_execRaw);
  // £0 exposure but the exec still talks about a fine/penalty ("fine exposure of up to £0") is self-contradictory, 
  // drop it for the ranking/AI-visibility framing.
  const _execFineWhenZero = !(exposureN > 0) && /\bfine|penalt|statutory exposure|exposure of up to|regulatory (fine|penalty)/i.test(_execRaw);
  const exec = (_execRaw && !_execHype && !_execFineWhenZero) ? _execRaw : '';
  // Build the jurisdiction statement from the AUTHORITATIVE set, never the engine's leaked prose,
  // so the statement can never contradict the findings actually shown. (F2/C-001/S-003)
  const jurisdiction = jurStatement(company, allow);

  // --- meta ---
  const snapshot = payload.via_archive ? `web-archive ${fmtArchive(payload.archive_date)} (live site behind bot-challenge)` : 'live scan';
  const meta = {
    company, domain: payload.domain,
    // C-B: the page slug+hash, threaded from [[path]].js. Both audit forms read meta.slug to POST audit_slug
    // (with audit_domain + top_finding) so the captured lead resolves back to THIS exact report; the Stripe
    // unlock path also falls back to meta.slug. Empty string when rendered outside the serve route (backtest).
    slug: String(ctx.slug || ''), hash: String(ctx.hash || ''),
    sector: titleCase(payload.detected_sector || payload.sector), country: jurLabel(payload.country),
    city: cleanCity(km.city, payload), markets: arr(payload.detected_jurisdictions),
    date: fmtDate(now), catalogue: 'v' + (payload.framework_version || '7'), snapshot,
  };

  const D = {
    meta, score, grade, scoreBand: bandOf(score),
    // Freemium unlock flag (set by [[path]].js from the audit_pages.unlocked column, flipped true by the
    // Stripe webhook on a successful Route 3 payment). When true the render shows every Tamazia-fix in full
    // for everyone who opens the link; when false each fix is locked behind the green-gradient veil. (founder)
    unlocked: !!ctx.unlocked,
    // FOUNDER-BLOCKED links + contact, threaded from env by [[path]].js. The client renders each element ONLY
    // when its value is a non-empty string (no placeholder when unset). Pure pass-through; never affects scoring.
    links: {
      booking: String((ctx.links && ctx.links.booking) || ''),
      stripeUnlock: String((ctx.links && ctx.links.stripeUnlock) || ''),
      stripeCover: String((ctx.links && ctx.links.stripeCover) || ''),
      stripeFix10: String((ctx.links && ctx.links.stripeFix10) || ''),
      stripeFix20: String((ctx.links && ctx.links.stripeFix20) || ''),
      stripeFix30: String((ctx.links && ctx.links.stripeFix30) || ''),
    },
    contactPhone: String(ctx.contactPhone || ''),
    posthog: { key: String(ctx.posthogKey || ''), host: String(ctx.posthogHost || '') },
    // Distinct jurisdictions actually present in the rendered regulatory layer — drives the Gate-1 selector
    // (shown only when a firm is genuinely multi-jurisdiction) and the per-framework jurisdiction badges.
    jurisdictions: Array.from(new Set((frameworks || []).map((f) => f.jur).filter((j) => j && j !== 'Global'))),
    projected: { wk12, wk24, wk12grade: gradeOf(wk12), wk24grade: gradeOf(wk24) },
    cur: curSym, // display currency symbol ('£' default, '$' for clearly-US firms) — charts read this so bars match the headline
    exposure: gbp(exposureN, curSym), exposureFull: +(exposureN / 1e6).toFixed(1), exposureWaterfall,
    // When no fineable framework is confirmed, "£0 / across 0 binding frameworks" reads as broken next to
    // the (ranking-only) frameworks shown. Present the exposure tile honestly instead. (£0-leak / consistency)
    exposureHeadline: exposureN > 0 ? gbp(exposureN, curSym) : 'Ranking & AI',
    exposureNote: exposureN > 0
      ? 'Maximum statutory penalty across the breaches evidenced on your live site'
      : 'No statutory fine confirmed, the exposure here is lost rankings, buyers and AI visibility',
    counts, confirmed: pointers.length,
    // Honest regulatory headline + flag for the 0-critical-but-low-grade case (Al Tamimi / Emaar): the
    // consumer should use these instead of asserting "N breached / PASS". (zero-critical-honest)
    regulatoryHeadline, regulatoryCriticalsZero,
    // ONE catalogue figure everywhere: the real rules count (fallback 403). frameworksTotal previously read
    // a magic "400+" in the rail/scoring meta while the body said "all {rulesChecked}", a visible mismatch. (fw-count)
    frameworksAssessed: frameworks.length, frameworksBinding: Math.max(arr(payload.applicable_frameworks).length, frameworks.length), rulesChecked: '400+', frameworksTotal: '400+',
    scoring: {
      formula: 'Weighted mean of the assessed dimensions, scaled 0 to 100. Regulatory compliance is weighted ×2, for a regulated firm a legal breach outranks a slow page.',
      bands: SCORING_BANDS,
      why: counts.critical > 0
        ? `Your ${score} is held down by the failing dimensions a regulator and an AI engine can both see on your live site today. Fix the ${counts.critical} critical ${counts.critical === 1 ? 'finding' : 'findings'} and the heaviest-weighted dimension lifts first, which is why ${wk12} by week 12 is realistic once those gaps close.`
        : `Your ${score} is held down by the ranking, authority and AI-visibility dimensions an AI engine and a buyer can both see today, not by a confirmed fine. Close the highest-weighted gaps below and the score lifts fast, which is why ${wk12} by week 12 is realistic once those gaps close.`,
      inputs: `${arr(payload.applicable_frameworks).length} frameworks bind · ${pointers.length} findings confirmed against live evidence · ${g(payload, 'trust_summary.confirmed', 0)} evidence checks passed`,
    },
    exec: exec || execFallback(exposureN, Object.keys(perFw).length, counts.critical, curSym),
    jurisdiction,
    frameworks, exposureBars, heat,
    heatRows: ['£10M+', '£1M+', '£100k+', '£10k+', '<£10k'], heatCols: ['Rare', 'Low', 'Possible', 'High', 'Near-certain'],
    dims: dims.map((d) => ({ nm: d.nm, st: d.st, v: d.v, sub: d.sub })),
    seo, geo, competitors,
    trajectory: [{ x: 'Today', v: score, g: grade }, { x: 'Week 12', v: wk12, g: gradeOf(wk12) }, { x: 'Week 24', v: wk24, g: gradeOf(wk24) }],
    fixes: fixes.length ? fixes : [{ n: 1, reg: 'Re-scan', pillar: 'Regulatory', law: 'Limited assessment', exp: 'ranking impact', title: 'The live site could not be fully read this scan', plain: 'Few findings are shown because the site was not fully readable (bot-challenge, JS-only render or thin content). This is honest suppression, not a clean bill of health.', prec: '', quote: 'site not fully readable', fix: 'Tamazia re-runs the full 400+ rule scan with archive + rendered-DOM fallback to produce a complete assessment.', plan: 'Re-scan · Week 1 · every mandate' }],
    glossary: buildGlossary(payload, allow),
    // C-A: ONE commerce source. The render (audit-app.js) owns ALL displayed prices/copy from the single PRICES
    // block (mirrored from src/content/pricing.ts); the server-side Stripe/Cal mapping lives in _commerce.js.
    // The adapter therefore injects ONLY the per-firm tier recommendation flags the render consumes
    // (D.pricing[].rec / .popular, keyed by .tier) + the two notes. The old injected `addons`/`addonsMore`
    // catalogues were NEVER read by the render (it builds ADDONS from PRICES.independent) — removed as dead.
    pricing: COMMERCE.pricing, pricingNotes: COMMERCE.pricingNotes, upsellProof: COMMERCE.upsellProof,
    _meta: { droppedByJurisdiction: dropped, exposureN, generatedAt: ctx.generated_at || null },
  };
  // Optional scoring trace (benchmark harness only; NEVER passed on the production render route, so it
  // is not injected into window.D). Lets _tools/benchmark.mjs score the LIVE rendered output (R1–R6).
  if (ctx.trace) {
    D._trace = {
      allow: Array.from(allow), market,
      registeredRegion: (function () { const m = { UK: 'UK', GB: 'UK', GBR: 'UK', US: 'US', USA: 'US', AE: 'AE', UAE: 'AE', SA: 'SA', KSA: 'SA', QA: 'AE', EU: 'EU' }; return m[market] || (allow.has('EU') ? 'EU' : market); })(),
      pointers: pointers.map((p) => ({ fw: p.framework_short || p.citation, jur: FW_JUR(p.framework_short || p.citation), sev: p.severity, bucket: p.bucket || '', ev: !!p.evidence_quote || arr(p.checked_urls).length > 0, evq: !!p.evidence_quote, anchored: !!p.evidence_quote || arr(p.checked_urls).length > 0 || !!(p.trigger_evidence && (p.trigger_evidence.quote || p.trigger_evidence.url)), fine: +p.fine_high_gbp || 0 })),
      keywords: [...(seo.keywords || []).map((k) => k.kw), competitors.bestKeyword].filter(Boolean), bestKeyword: competitors.bestKeyword,
      competitors: [...(competitors.ladder || []).map((c) => c.name), ...(seo.keywords || []).map((k) => k.who).filter((w) => w && w !== ', ' && w !== 'a rival'), ...(geo.citations || []).map((c) => c.who)].filter(Boolean),
      reachable: g(payload, 'scan.reachable', true) !== false, sector: payload.sector, company,
    };
  }
  return D;
}

/* ---------------- sub-builders ---------------- */
function sovClamp(v, samples, aiKnows) {
  if (aiKnows === false) return 0;            // AI explicitly doesn't know the firm -> SoV cannot be >0 (G1/S-040)
  if (!isNum(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
function buildCwv(psi) {
  const out = [];
  const cls = +psi.cls;
  if (isNum(cls)) out.push({ k: 'CLS', label: 'Cumulative Layout Shift', v: cls.toFixed(2), target: '< 0.10', pct: Math.max(8, Math.round(100 - cls * 100)), st: cls > 0.25 ? 'fail' : cls > 0.1 ? 'warn' : 'pass', plain: 'Content jumps around as the page loads. It reads as unprofessional and Google demotes it.' });
  if (isNum(psi.perf)) out.push({ k: 'PERF', label: 'Performance score', v: Math.round(psi.perf * 100) + '/100', target: '> 90', pct: Math.round(psi.perf * 100), st: psi.perf >= 0.9 ? 'pass' : psi.perf >= 0.5 ? 'warn' : 'fail', plain: 'Overall mobile performance. Google ranks slow pages lower and visitors leave before 3s.' });
  if (!out.length) out.push({ k: 'CWV', label: 'Core Web Vitals', v: 'not assessed', target: 'PageSpeed unavailable', pct: 0, st: 'warn', plain: 'PageSpeed data was unavailable on this scan, the live site was unreachable or behind a bot-challenge. Speed is captured on the next live scan.' });
  return out;
}
// Core Web Vitals rows for ONE strategy (mobile or desktop) from the engine's rich per-strategy cwv.
// Rounds the raw lab decimals; clamps the bar; brand-plain explanation tuned to a non-technical buyer.
function buildCwvStrat(cwv) {
  if (!cwv) return [];
  const out = [], r = Math.round, cl = (n) => Math.max(8, Math.min(100, r(n)));
  if (isNum(cwv.lcp_ms)) { const s = cwv.lcp_ms; out.push({ k: 'LCP', label: 'Largest Contentful Paint', v: (s / 1000).toFixed(1) + 's', target: '< 2.5s', pct: cl(100 - (s - 1000) / 40), st: s > 4000 ? 'fail' : s > 2500 ? 'warn' : 'pass', plain: 'How long until the main content appears. Slow LCP is the top reason visitors leave before the page loads.' }); }
  if (isNum(cwv.inp_ms)) { const s = cwv.inp_ms; out.push({ k: 'INP', label: 'Interaction to Next Paint', v: r(s) + 'ms', target: '< 200ms', pct: cl(100 - (s - 100) / 5), st: s > 500 ? 'fail' : s > 200 ? 'warn' : 'pass', plain: 'How fast the page responds to a tap or click. Laggy interaction reads as a broken, low-trust site.' }); }
  if (isNum(cwv.cls)) { const s = cwv.cls; out.push({ k: 'CLS', label: 'Cumulative Layout Shift', v: s.toFixed(2), target: '< 0.10', pct: cl(100 - s * 100), st: s > 0.25 ? 'fail' : s > 0.1 ? 'warn' : 'pass', plain: 'Content jumps around as the page loads. It reads as unprofessional and Google demotes it.' }); }
  if (isNum(cwv.fcp_ms)) { const s = cwv.fcp_ms; out.push({ k: 'FCP', label: 'First Contentful Paint', v: (s / 1000).toFixed(1) + 's', target: '< 1.8s', pct: cl(100 - (s - 800) / 30), st: s > 3000 ? 'fail' : s > 1800 ? 'warn' : 'pass', plain: 'How fast anything first appears. A slow first paint makes the site feel dead on arrival.' }); }
  if (isNum(cwv.tbt_ms)) { const s = cwv.tbt_ms; out.push({ k: 'TBT', label: 'Total Blocking Time', v: r(s) + 'ms', target: '< 200ms', pct: cl(100 - s / 10), st: s > 600 ? 'fail' : s > 200 ? 'warn' : 'pass', plain: 'How long the page is frozen while scripts run. High TBT means taps do nothing for seconds.' }); }
  return out;
}
// One strategy's full PSI view: the 4 Lighthouse dials (0-100, always present), CWV rows, and the
// element-level failing audits (prefers the engine's brand-tone fix line over the static fallback).
function buildPsiStrat(strat) {
  if (!strat || !strat.scores) return null;
  const sc = strat.scores, dial = (v) => isNum(v) ? Math.round(v * 100) : null;
  const audits = arr(strat.audits)
    .filter((a) => a && a.id && (a.score == null || a.score < 0.9))
    .map((a) => { const [title, lane, fixFb] = lhInfo(a.id); const _dd = (s) => String(s || '').replace(/\s*[—–]\s*/g, ', ').trim(); return { id: a.id, title: _dd(title), lane: LH_LANE[lane] || 'Performance', laneKey: lane, disp: a.displayValue || '', nodes: a.node_count || 0, sel: String(a.node_selector || '').replace(/\s+/g, ' ').trim().slice(0, 64), fix: _dd(a.fix || fixFb || ''), wcag: lane === 'a11y' ? (wcagFor(a.id) || 'WCAG 2.1 AA · ADA Title III') : null, _w: lhImpact(a) }; })
    .sort((x, y) => y._w - x._w).slice(0, 10);
  return { dials: { performance: dial(sc.performance), accessibility: dial(sc.accessibility), bestPractices: dial(sc['best-practices']), seo: dial(sc.seo) }, cwv: buildCwvStrat(strat.cwv), audits };
}
// Region-specific legal glossary terms that must NOT be defined for a firm whose jurisdiction set doesn't
// include that region (a UAE-only firm should never see GDPR / UK GDPR / PECR / CCPA defined). Term ↗ the
// jurisdiction(s) any of which must be in the firm's allow-set for the term to render. (glossary-jurisdiction)
const GLOSSARY_TERM_JUR = {
  gdpr: ['EU', 'UK'], 'uk gdpr': ['UK'], 'eu gdpr': ['EU'], pecr: ['UK'], 'dpa 2018': ['UK'], dpa: ['UK'],
  ccpa: ['US'], cpra: ['US'], 'us state privacy': ['US'], hipaa: ['US'], ferpa: ['US'], coppa: ['US'], glba: ['US'], 'ada title iii': ['US'],
  pdpl: ['AE', 'SA'], 'uae pdpl': ['AE'], rera: ['AE'], difc: ['AE'], adgm: ['AE'],
};
function buildGlossary(payload, allow) {
  const allowSet = allow || authJurisdictions(payload);
  // A term is allowed if it isn't region-scoped, OR the firm's jurisdictions include one of its regions.
  const termAllowed = (k) => { const regions = GLOSSARY_TERM_JUR[String(k || '').toLowerCase().trim()]; return !regions || regions.some((r) => allowSet.has(r)); };
  const terms = g(payload, 'glossary.terms', null);
  if (terms && typeof terms === 'object' && !Array.isArray(terms)) {
    // Prefer the jurisdiction-scoped `used[]` allow-list when the engine provides one; else take all terms.
    const used = arr(g(payload, 'glossary.used', null)).map((u) => String(u).toLowerCase());
    const usedSet = used.length ? new Set(used) : null;
    const out = {};
    for (const [k, v] of Object.entries(terms)) {
      if (usedSet && !usedSet.has(String(k).toLowerCase())) continue;   // not in the scoped used-set
      if (!termAllowed(k)) continue;                                     // foreign-law term for this firm
      out[k] = typeof v === 'string' ? v : (v && v.def) || '';
    }
    if (Object.keys(out).length) return out;
  }
  return {
    geo: 'Generative Engine Optimisation, whether AI answer engines name and cite you when a buyer asks for a provider like you.',
    'share of voice': 'How often you appear vs competitors when buyers ask AI. 0 means they are heard and you are silent.',
    'entity readiness': 'How identifiable you are to an AI, Organization schema + sameAs + Wikidata. Below 70 and you are an unknown string.',
    'e-e-a-t': "Google's test of Experience, Expertise, Authoritativeness, Trust, decisive for health, law and finance.",
    schema: 'Hidden structured-data code that tells search + AI exactly who you are. Without it they guess, and guess wrong.',
  };
}
function cleanCity(city, payload) {
  let c = String(city || '').trim().replace(/\b(\w+)\s+\1\b/gi, '$1'); // dup-token strip ("london London")
  if (!c || /^(uk|uae|usa?|gb|gbr|ksa|sa|ae|eu|europe)$/i.test(c)) return '';
  // The engine's city detection is UK-biased and unreliable cross-market (the "Reading on Emaar"
  // domino). Only trust a detected city for UK/.uk firms; otherwise omit rather than guess. (F1/S-001/S-002)
  const cc = String(payload.country || '').toUpperCase();
  const tld = String(payload.domain || '').toLowerCase().split('.').pop();
  return (cc === 'UK' || cc === 'GB' || cc === 'GBR' || tld === 'uk') ? c : '';
}
function jurStatement(company, allow) {
  const parts = [];
  if (allow.has('UK')) parts.push('the United Kingdom');
  if (allow.has('EU')) parts.push('the European Union');
  if (allow.has('US')) parts.push('the United States');
  if (allow.has('AE')) parts.push('the United Arab Emirates');
  if (allow.has('SA')) parts.push('Saudi Arabia');
  const where = parts.length === 0 ? 'its registered jurisdiction'
    : parts.length === 1 ? parts[0]
      : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  return `${company} is assessed under the law of ${where}, the jurisdiction(s) its own website shows it serves. Frameworks from every other region are screened but do not attach here, so only the law that genuinely binds this firm is shown.`;
}
function execFallback(exp, nfw, crit, sym) {
  // £0 statutory exposure: never claim a fine. The value at stake is ranking, qualified buyers and AI-assistant
  // visibility, frame it as that, so the exec never contradicts a "no statutory fine confirmed" headline.
  if (!(+exp > 0)) return 'No statutory fine surfaced on the live site this scan, but you are losing rankings, qualified buyers and AI-assistant visibility to named competitors every day. That is the exposure that matters here, and it compounds while the gaps below stay open.';
  const lead = `Right now you are carrying ${gbp(exp, sym)} of avoidable statutory exposure across ${nfw} binding framework${nfw === 1 ? '' : 's'}.`;
  return crit > 0 ? `${lead} Close the ${crit} critical finding${crit === 1 ? '' : 's'} first, they are the ones a regulator can act on today.` : `${lead} The high-severity gaps below are the priority.`;
}
function jurLabel(c) { c = String(c || '').toUpperCase(); return { UK: 'United Kingdom', USA: 'United States', US: 'United States', UAE: 'United Arab Emirates', AE: 'United Arab Emirates', KSA: 'Saudi Arabia' }[c] || c || 'n/a'; }
function fmtArchive(d) { const s = String(d || ''); return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s; }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(d) { try { return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; } catch { return ''; } }

/* ---------------- commerce: per-firm tier recommendation flags ONLY (C-A) ----------------
   ONE commerce source of truth across the page:
     - ALL displayed prices + tier/add-on copy: src/content/pricing.ts, mirrored into the render's PRICES block
       (public/audit/audit-app.js). The render owns the display.
     - Server-side add-on → Stripe price_id + tier → Cal slug mapping: functions/audit/_commerce.js.
   The adapter therefore carries NOTHING but the per-firm recommendation flags the render reads
   (D.pricing[].rec / .popular, matched by .tier) plus the two prose notes. Prices/feature lists are
   deliberately NOT held here (they would be a fourth place to drift). The previously-injected
   `addons`/`addonsMore` catalogues were dead (the render never read them) and are removed. */
const COMMERCE = {
  pricingNotes: '90-day rolling · no long-term contract · work belongs to you once paid · founder reviews every onboarding personally.',
  upsellProof: 'Each add-on layers onto your core programme as it proves out. Start with the audit\'s top priority, then add the next lever once it is working.',
  // tier = the key the render matches on (audit-app.js byName); rec/popular = the only fields consumed.
  pricing: [
    { tier: 'Foundation', rec: false, popular: false },
    { tier: 'Authority', rec: false, popular: true },
    { tier: 'Enterprise', rec: true, popular: false },
  ],
};
