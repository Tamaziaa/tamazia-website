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
// Decode HTML entities so user-facing text never shows raw "&amp;"/"&#x27;"/"&#8211;". Safe because the client
// inserts these as textContent (the entities currently render LITERALLY), so decoding to the character is correct
// and not an XSS vector. Handles named + decimal + hex numeric references.
// FIX-R4 (XSS): NEVER decode into tag-forming chars. Firm-supplied text (crawled titles/quotes) may contain
// &lt;script&gt; / &#60; / &#x3c; — decoding those to < > would let markup form if any field is innerHTML'd. We
// decode only typographic entities; &lt;/&gt; and numeric 60/62 stay ENCODED, rendering as literal text everywhere.
const _ENT = { amp: '&', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…', copy: '©', reg: '®', trade: '™' };
function decodeEnt(s) {
  if (typeof s !== 'string' || s.indexOf('&') === -1) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) => {
    if (c[0] === '#') { const code = c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10); if (code === 60 || code === 62 || !Number.isFinite(code)) return m; return String.fromCodePoint(code); }   // FIX-R4: never decode < or >
    const k = c.toLowerCase(); return Object.prototype.hasOwnProperty.call(_ENT, k) ? _ENT[k] : m;
  });
}
// A scraped page <title> is NOT a company name. Reject candidates that read like a title/marketing line so the
// render falls back to the clean domain stem (cert: "Conference & Event Venue in Leeds", "14 Independent Brands...",
// "New Construction Homes for Sale in New York by Toll Brothers", "Pricing Plans", "Our Team").
function looksLikeTitle(s) {
  const t = String(s || '').trim();
  if (!t) return true;
  if (t.length > 42) return true;                              // real names are short; titles are long
  if (/[|»·–—]| - | \| /.test(t)) return true;                 // title separators
  if (/\b(reviews?|top \d+|best |guide|how to|pricing|plans?|welcome|home ?page|our team|about us|contact|menu|blog|news|brands?|things to do)\b/i.test(t)) return true;
  if (/^\d/.test(t) || /\b(in|near|for sale in)\b .*\b(london|leeds|bristol|edinburgh|manchester|new york|dubai|miami)\b/i.test(t)) return true;
  if ((t.match(/\s/g) || []).length >= 6) return true;         // >6 words = a sentence, not a name
  return false;
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
function sharesTokenWithDomain(name, domain) {
  const stem = String(domainStem(domain) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!stem) return true;                                   // no domain to compare against: do not block
  const toks = (String(name || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length >= 4);
  if (!toks.length) return false;
  return toks.some((t) => stem.includes(t) || t.includes(stem));
}
function firmName(payload, passed) {
  const fp = g(payload, 'firm_profile', {}) || {};
  const fromProfile = fp.name || fp.legal_name || fp.display_name || fp.trading_name || fp.brand || payload.firm_name || payload.company;
  if (fromProfile && String(fromProfile).trim() && !looksLikeTitle(fromProfile)
      && sharesTokenWithDomain(fromProfile, payload.domain)) return decodeEnt(String(fromProfile).trim());
  // NAME-01b: the SAME guard must sit on THIS door too. The live render passes audit_pages.company in as `passed`,
  // so guarding only the firm_profile branch above fixed nothing on the actual page — the birketts report still
  // said "Bristol Office". A fix applied to one of two doors is not a fix; it just looks like one.
  const p = String(passed == null ? '' : passed).trim();
  if (p && !looksLikeDomain(p) && !looksLikeTitle(p) && sharesTokenWithDomain(p, payload.domain)
      && !/\.(com|co|org|net|io|ai|ae|uk|us|sa|qa|de|fr|it|es)$/i.test(p)) return decodeEnt(p);
  // passed is empty OR is a dirty/title-like string -> rebuild from the clean domain stem
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
  // A symbol glues to its number ('£2.6M'); an ISO-style code needs a space ('AED 2.6M', 'SAR 900k').
  const sep = sym.length > 1 ? ' ' : '';
  n = Math.round(+n || 0);
  if (n >= 1e6) { const m = n / 1e6; return sym + sep + (m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')) + 'M'; }
  if (n >= 1e3) return sym + sep + Math.round(n / 1e3) + 'k';
  return sym + sep + n;
}
// CURRENCY BY BINDING REGIME (never by the firm's home country, and never by FX). The currency of a fine is fixed
// by the STATUTE THAT SETS IT: an EU GDPR maximum is denominated in euros whoever you are; a DIFC Data Protection
// Law fine is denominated in US DOLLARS (USD 25,000 / 50,000 / 100,000 — not dirhams), as is ADGM's; UAE FEDERAL
// PDPL is in dirhams; Saudi in riyals; Qatar in Qatari riyals; every UK regime (ICO/SRA/CMA/PECR/Equality Act)
// sets its maxima in pounds. We therefore quote each finding in its own regime's statutory currency and NEVER
// apply an exchange rate — an invented FX rate on a legal document is a fabrication. Unknown / global codes
// (GOOGLE_EEAT, schema…) carry no statutory currency: they return null and inherit the firm's primary currency.
function currencyForFramework(code) {
  const c = String(code || '').toUpperCase();
  if (!c) return null;
  // Free zones FIRST: DIFC and ADGM sit inside the UAE but denominate their penalties in USD.
  if (c.includes('DIFC') || c.includes('ADGM')) return '$';
  if (c.startsWith('UK_') || c.startsWith('GB_')) return '£';
  if (c.startsWith('EU_')) return '€';
  if (c.startsWith('FR_') || c.includes('CNIL')) return '€';   // CNIL fines are set in euros
  if (c.startsWith('DE_') || c.includes('BDSG')) return '€';
  if (c.startsWith('US_')) return '$';
  if (['HIPAA', 'CCPA', 'CPRA', 'CAN_SPAM', 'COPPA', 'FERPA', 'TCPA', 'GLBA', 'FTC'].some((x) => c.includes(x))) return '$';
  if (c.startsWith('SAUDI_') || c.startsWith('KSA_') || c.startsWith('SA_')) return 'SAR';
  if (c.startsWith('QATAR_') || c.startsWith('QA_')) return 'QAR';
  if (c.startsWith('UAE_') || c.startsWith('AE_')) return 'AED';   // UAE FEDERAL PDPL — dirhams
  return null;
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
  US_TCPA: 'US TCPA', US_TDPSA: 'Texas Data Privacy Act', US_FINRA_2210: 'FINRA Rule 2210', US_SEC_506C: 'SEC Rule 506(c)', US_SEC_REG_FD: 'SEC Regulation FD', US_NYDFS_500: 'NYDFS Part 500', US_GLBA: 'US GLBA', US_HIPAA: 'US HIPAA', US_COPPA: 'US COPPA', US_FERPA: 'US FERPA', US_MEDICAL_BOARD: 'State Medical Board Rules',
  UAE_CONSUMER: 'UAE Consumer Protection Law', UAE_ECOMMERCE: 'UAE E-Commerce Law', UAE_RERA: 'RERA (Dubai)', FR_CNIL_2025: 'France · CNIL',
};
const FW_REGULATOR = {
  // E08 — the real enforcing authority. Previously these rendered the literal placeholder "Sector regulator".
  'UK_ECOMMERCE_2002': 'Trading Standards / CMA',
  'UK_LEGAL_SERVICES_2007': 'Legal Services Board / SRA',
  'UK_CLC': 'Council for Licensed Conveyancers',
  'UK_CRIMINAL_FINANCES_2017': 'HMRC and the Serious Fraud Office',
  'UK_ECCTA_2023': 'Serious Fraud Office / Crown Prosecution Service',
  'UK_LEGAL_OMBUDSMAN': 'Legal Ombudsman',
  'EU_ECD_ART5': 'The competent national authority of the member state',
  'EU_SERVICES_DIRECTIVE': 'The competent national authority of the member state',
  'DE_IMPRESSUM': 'Competitor Abmahnung and the competent Landesmedienanstalt',
  'FR_LCEN': 'DGCCRF',
  'BAHRAIN_PDPL': 'Bahrain Personal Data Protection Authority',
  'EGYPT_PDPL': 'Egyptian Data Protection Centre',
  'ISRAEL_PPL': 'Israeli Privacy Protection Authority',
  'JORDAN_PDPL': 'Jordan Ministry of Digital Economy and Entrepreneurship',
  'OMAN_PDPL': 'Oman Ministry of Transport, Communications and IT',
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
  UK_HSE: 'Health & Safety Executive', US_STATE_PRIVACY: 'US state attorneys general', US_VCDPA: 'Virginia Attorney General', US_ADA: 'US Department of Justice', US_ATTORNEY_ADVERTISING: 'State bar associations',
  // Sector regulators that were rendering as the generic "Sector regulator" placeholder on screened cards (Phase 5.1).
  UK_FCA_CONDUCT: 'Financial Conduct Authority', UK_FCA_CONSUMER_DUTY: 'Financial Conduct Authority', UK_CONSUMER_DUTY: 'Financial Conduct Authority', UK_FCA_HRI_PROMO: 'Financial Conduct Authority', UK_EMR_2011: 'Financial Conduct Authority', UK_ABI: 'Association of British Insurers', UK_MLR_2017: 'HMRC / FCA',
  UK_CRA_2015: 'Trading Standards / CMA', UK_CCR_2013: 'Trading Standards / CMA', UK_NATASHAS_LAW: 'Food Standards Agency',
  UAE_DHA: 'Dubai Health Authority / MOHAP', UAE_MOHAP: 'Ministry of Health & Prevention', UAE_DHCC: 'Dubai Healthcare City Authority', UAE_PDPL: 'UAE Data Office', UAE_HEALTH_DATA_LAW: 'UAE health authorities', UAE_ICT_HEALTH_LAW: 'UAE health authorities', UAE_CONSUMER_PROTECTION: 'UAE Ministry of Economy',
  US_FAIR_HOUSING_ACT: 'HUD / DOJ', US_RESPA: 'Consumer Financial Protection Bureau', US_STATE_PROF_CONDUCT: 'State licensing boards', US_FTC_FAKE_REVIEWS: 'Federal Trade Commission', US_FTC_REVIEWS_RULE: 'Federal Trade Commission',
  // Regulator names for the frameworks surfaced by the 10-company multi-sector/jurisdiction validation (UK accounting/
  // bar, UAE health/finance/real-estate, US health/dental, EU health). (multi-sector-validation-20260629)
  UK_HMRC_AML: 'HMRC', UK_BSB: 'Bar Standards Board', UK_BOTOX_FILLERS_CHILDREN_2021: 'MHRA / local authorities', UK_CMP_2019: 'NTSELAT / approved redress scheme',
  EU_EHDS: 'European Health Data Space authorities', EU_GDPR_ART9: 'EU data-protection authorities', EU_UCPD: 'EU consumer-protection authorities',
  UAE_ART_LAW: 'UAE health authorities (MOHAP/DHA)', UAE_DOH: 'Abu Dhabi Department of Health', UAE_AML_2018: 'Central Bank of the UAE / Ministry of Economy', AE_AML_2018: 'Central Bank of the UAE / Ministry of Economy',
  UAE_ENV_2024: 'UAE Ministry of Climate Change & Environment', UAE_MOHRE: 'UAE Ministry of Human Resources & Emiratisation',
  AE_CBUAE_CONSUMER: 'Central Bank of the UAE', CBUAE_INSURANCE: 'Central Bank of the UAE', CBUAE_RPSCS: 'Central Bank of the UAE', AE_DFSA_COB: 'DFSA (DIFC)', AE_FSRA_COBS: 'ADGM FSRA', AE_SCA: 'UAE Securities & Commodities Authority',
  US_CDC_ART_REPORTING: 'US CDC / FTC', US_FTC_HBNR: 'Federal Trade Commission', US_FTC_HEALTH_BREACH_RULE: 'Federal Trade Commission', US_NV_SB370: 'Nevada Attorney General', US_RYAN_HAIGHT: 'US DEA', US_CDCA: 'US CDC / FTC',
  // Second validation pass (cap raise surfaced more frameworks): US health/medical, UK medical/real-estate, EU device.
  US_FDA: 'US Food & Drug Administration', US_FDA_HCTP: 'US Food & Drug Administration', US_TELEHEALTH_LICENSURE: 'State medical boards (IMLC)', US_WA_MHMDA: 'Washington Attorney General', US_CMS_LTC: 'US Centers for Medicare & Medicaid Services',
  UK_GMC: 'General Medical Council', UK_NMC: 'Nursing & Midwifery Council', UK_HFEA: 'Human Fertilisation & Embryology Authority', UK_MEDICAL_DEVICES: 'MHRA', UK_HMRC_GIFTAID: 'HMRC', EU_IVDR: 'EU notified bodies / MHRA',
  UK_ESTATE_AGENTS_ACT: 'NTSELAT / Trading Standards', UK_NTSELAT_MATERIAL_INFO: 'NTSELAT / Trading Standards', UK_TENANT_FEES_2019: 'NTSELAT / Trading Standards',
};
// Frameworks that overlap so heavily they must render as ONE row, never two near-identical cards under the
// same regulator (Four Seasons showed "CMA · DMCC Act 2024" AND "DMCC DMCC Act 2024", both CMA; and both the
// Food Info Regs and the FSA "Natasha's Law" food card). Collapse the overlapping code into its canonical
// sibling at the grouping step so findings merge into a single framework. (fw-overlap)
// UK_ICO_COOKIES is the ICO's supplementary guidance for PECR compliance — it is not a separate Act
// (same regulator, same enforcement, same cookies regime). Both codes share the PECR card. (F-6)
// US_CAN_SPAM / US_CANSPAM are duplicate encodings of the same statute US_FTC already covers (CAN-SPAM rules
// SPAM01-05); US_CCPA is superseded by US_CPRA (same California privacy regime). Collapse so a US firm never
// sees the same regime twice. (LegalTech dedup §5 — render-side, leaves the rule catalogue untouched.)
const FW_CANON = { UK_DMCC_2024: 'UK_CMA', UK_FOOD_INFO_2014: 'UK_FSA', UK_NATASHAS_LAW: 'UK_FSA', UK_ICO_COOKIES: 'UK_PECR', US_CAN_SPAM: 'US_FTC', US_CANSPAM: 'US_FTC', US_CCPA: 'US_CPRA', UAE_ICT_HEALTH_LAW: 'UAE_HEALTH_DATA_LAW' };
const fwCanon = (fw) => FW_CANON[String(fw || '').toUpperCase()] || fw;
// Phase 4: collapse same-Act article/section siblings into ONE framework box (UK_GDPR_A13 +
// UK_GDPR_A14 -> "UK GDPR", each article kept as a provision inside). SAFE: collapse ONLY for an
// explicit allow-list of Acts known to emit article-level codes — never a fuzzy name-prefix merge,
// so distinct regimes (UK_FCA vs UK_FCA_CONC) are NEVER wrongly merged. The trailing "_" guards
// against prefix-substring false matches (UK_GDPR_ never matches a hypothetical UK_GDPRX).
const ACT_MERGE_PREFIXES = ['UK_GDPR', 'EU_GDPR', 'AE_PDPL', 'DIFC_DPL', 'ADGM_DPR', 'SAUDI_PDPL', 'QATAR_PDPPL', 'US_CCPA', 'US_CPRA', 'DE_BDSG', 'FR_CNIL', 'UK_PECR'];
function actKey(fw) {
  const c = fwCanon(fw);   // FW_CANON resolves aliases (DMCC→CMA, ICO_COOKIES→PECR) before prefix merge
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
function subjectOf(p) {
  // NO TRUNCATION (founder): the subject of a breach is never cut. It renders in full and wraps.
  const s = String((p && (p.short_title || p.title || p.requirement || p.fact)) || '').trim().replace(/\s{2,}/g, ' ');
  if (/^[A-Z0-9_]{2,}$/.test(s)) return '';
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
// FIX-R1 (founder red line): a VOLUNTARY-code framework (trade-body / self-reg / certification) must NEVER render a
// statutory fine. The engine payload carries binding (framework_short -> statute/statutory_code/regulator_code/
// professional_code/voluntary_code); _VOLUNTARY_BINDING is populated per-request from it, plus a hardcoded fallback of
// the clearest voluntary regimes in case an older payload omits binding. noStatutoryFine(fw) is the single guard used
// at every fine/exposure site so a voluntary code shows a non-monetary sanction, never a GBP figure.
const VOLUNTARY_FALLBACK = new Set(['UK_ABI', 'UK_ABPI', 'UK_PMCPA', 'UK_CYBER_ESSENTIALS', 'UK_NCSC_CYBER_ESSENTIALS', 'ARLA_PROPERTYMARK', 'UK_ARLA']);
let _VOLUNTARY_BINDING = new Set(VOLUNTARY_FALLBACK);
function setVoluntaryBinding(binding) {
  const v = new Set(VOLUNTARY_FALLBACK);
  for (const [fw, b] of Object.entries(binding || {})) if (b === 'voluntary_code') v.add(fw);
  _VOLUNTARY_BINDING = v;
}
function noStatutoryFine(fw) { fw = String(fw || '').toUpperCase(); return NO_STATUTORY_FINE.has(fw) || _VOLUNTARY_BINDING.has(fw); }
// E-243 (v22.11) THE ONE CANONICAL NON-STATUTORY TEST. A finding is non-statutory when it is a ranking/visibility
// signal rather than a legal obligation. Previously three different bucket lists existed in this file and drifted,
// which is how a Largest-Contentful-Paint (bucket `performance`) came to be labelled an "enforcement action".
// NOTE what is deliberately NOT here: `accessibility` (Equality Act 2010 is a statute) and `tracking`/`consent`
// (PECR reg.6 + UK GDPR are statutes). Those DO carry real fines and must keep them.
const NON_STATUTORY_BUCKET = /^(seo|technical_seo|technical|tech|tls_dns|performance|core_web_vitals|cwv|speed|ai_visibility|geo|ai|answer_engine|ux|content|eeat|authority|backlinks|schema|structured_data|knowledge_graph|brand|social)$/i;
function isNonStatutory(p) {
  if (!p) return false;
  const fw = String(p.framework_short || '');
  if (noStatutoryFine(fw)) return true;                       // voluntary code / ranking guideline
  // A real statute code (UK_GDPR, DPA2018, PECR, EQA2010...) always wins over the bucket: a statutory breach found
  // while measuring a technical page is still statutory.
  if (/^[A-Z]{2,}_/.test(fw) && !noStatutoryFine(fw)) return false;
  return NON_STATUTORY_BUCKET.test(String(p.bucket || ''));
}
// #17a: expose the engine's per-framework binding STATUS as a human label so a prospect can see whether an
// obligation is a hard statute or voluntary guidance (drives trust + how urgently to act). Seeded per-request.
let _BINDING_MAP = {};
function setBindingMap(binding) { _BINDING_MAP = binding && typeof binding === 'object' ? binding : {}; }
// E09 — THE BINDING-LABEL TAXONOMY. The SRA Transparency Rules, the SRA Code of Conduct and the LeO Scheme Rules
// were all labelled "Statute". They are REGULATORY RULES made under the Legal Services Act 2007. That is exactly
// the distinction a solicitor is trained to notice, and getting it wrong in a column headed "Binding" tells a
// partner we do not know the difference between an Act and a rulebook.
// E09 — THE TAXONOMY MUST MATCH WHAT THE CATALOGUE ACTUALLY STORES.
// The catalogue was RIGHT all along: framework_versions types the SRA Transparency Rules, the SRA Code and the LeO
// Scheme Rules as `statutory_code` (rules made UNDER the Legal Services Act 2007), not `statute`. The bug was here:
// this map had no entry for `statutory_code`, so every one of them fell through to the fallback and rendered as
// "Statute". We were calling a regulator's rulebook an Act of Parliament, which is the single easiest error for a
// solicitor to catch. Every binding_status the database can emit now has a label.
const _BINDING_LABEL = {
  statute: 'Statute',
  statutory_instrument: 'Statutory instrument',
  statutory_code: 'Regulatory rules',          // made under statute: SRA, BSB, GDC, Legal Ombudsman
  regulator_code: 'Regulator code',
  professional_code: 'Professional code',
  statutory_redress: 'Statutory redress scheme',
  regulatory_rules: 'Regulatory rules',
  enforceable_code: 'Regulator code',
  industry_code: 'Industry code',
  voluntary_code: 'Voluntary code',
  guidance: 'Guidance',
};
// E-218 (S-100): when the payload carries NO binding map at all (legacy rows), a guessed 'Statute' label is a
// false legal claim — a voluntary code must never read as a statute. Neutral 'Framework' until a real map exists.
function bindingLabel(fw) {
  const b = _BINDING_MAP[String(fw || '').toUpperCase()] || _BINDING_MAP[fw];
  if (b && _BINDING_LABEL[b]) return _BINDING_LABEL[b];
  if (noStatutoryFine(fw)) return 'Voluntary code';
  // E09: the old fallback was `_BINDING_MAP.length ? 'Statute' : 'Framework'` — i.e. if the map held ANY entry but
  // not THIS one, we guessed "Statute". A guess is not a classification. Calling a regulator's rulebook an Act of
  // Parliament is a false legal claim, and it is the single easiest error for a solicitor to catch. Neutral always.
  return 'Framework';
}
// Non-legal synthetic codes that the engine buckets as "compliance" but are NOT a law/regulator (e.g. SITE_INTEGRITY,
// a technical site-tamper check). They must never appear as a framework in the Regulatory section. (Phase 5.1)
const NON_LEGAL_FW = new Set(['SITE_INTEGRITY', 'SITE_HEALTH', 'TECH_SEO', 'CONTENT_DEPTH',
  // SEO / GEO / AI-visibility signals are PERFORMANCE metrics, not laws. They must never appear in the Regulatory
  // section nor be dressed in legal language (regulator, enforcement, fine, "legally binds you"). They have their own
  // SEO and AI-visibility pillars. (founder: "stop using legal words for seo geo metrics")
  'GOOGLE_EEAT', 'GOOGLE_EAT', 'EEAT', 'GEO', 'SEO', 'SCHEMA', 'WIKIPEDIA', 'WIKIDATA', 'AI_VISIBILITY', 'AI_CITATION',
  'CITATIONS', 'CORE_WEB_VITALS', 'PAGESPEED', 'AUTHORITY', 'BACKLINKS']);
// Framework display names render UNescaped in the framework/finding cards, so a name carrying raw
// markup, e.g. a Lighthouse/axe audit title like "`<frame>` or `<iframe>` elements do not have a
// title", would inject a live, unclosed <iframe> and swallow every section rendered after it. The
// adapter is the render-side safety membrane, so we strip angle brackets at this single name
// chokepoint, killing the tag-injection vector for every consumer (name, law, exposure labels, reg tag).
// Preserve known regulatory acronyms through titleCase ("Uk Gdpr"->"UK GDPR", "Us State"->"US State").
const _ACRONYMS = ['UK', 'US', 'USA', 'EU', 'UAE', 'KSA', 'DIFC', 'ADGM', 'GDPR', 'PDPL', 'PDPPL', 'CCPA', 'CPRA', 'PECR', 'DPA', 'CQC', 'GDC', 'MHRA', 'SRA', 'FCA', 'ASA', 'CMA', 'DMCC', 'RERA', 'RICS', 'ARLA', 'EAA', 'DSA', 'DMA', 'DORA', 'NIS2', 'AML', 'MIFID', 'SFDR', 'GPSR', 'TCPA', 'TDPSA', 'FINRA', 'SEC', 'NYDFS', 'GLBA', 'HIPAA', 'COPPA', 'FERPA', 'FTC', 'ADA', 'VCDPA', 'BDSG', 'CNIL', 'NCSA', 'ICO', 'HSE', 'OSA', 'PRA', 'FRC', 'ACCA', 'SMCR', 'FSCS', 'NCSC', 'IASME', 'DSIT', 'TPO', 'CSRD', 'PSD2', 'EBA', 'ESMA', 'EEAT'];
const _ACR_RX = new RegExp('\\b(' + _ACRONYMS.join('|') + ')\\b', 'gi');
function fixAcronyms(s) { return String(s || '').replace(_ACR_RX, (m) => m.toUpperCase()); }
// FW_NAME_CAT: complete framework display-name map generated from the live catalogue (framework_versions,
// 285 frameworks). The hardcoded FW_NAME only knew the old ~40, so every newer framework rendered as a
// title-cased code ("UAE Dha"). fwName now prefers the real catalogue name. Regenerate when the catalogue grows.
const FW_NAME_CAT = {
  // E07 — THE EXACT LEGAL TITLE. These 14 frameworks were promoted into the catalogue (E-254, "the lost law") but
  // nobody ever gave them a display name, so they rendered as title-cased codes: "Uk Ecommerce 2002",
  // "Eu Ecd Art5". In a lawyer-led report every citation must be the instrument's real name.
  'UK_ECOMMERCE_2002': 'Electronic Commerce (EC Directive) Regulations 2002',
  'UK_LEGAL_SERVICES_2007': 'Legal Services Act 2007',
  'UK_CLC': 'CLC Handbook (Council for Licensed Conveyancers)',
  'EU_ECD_ART5': 'e-Commerce Directive 2000/31/EC, Article 5',
  'EU_SERVICES_DIRECTIVE': 'Services Directive 2006/123/EC',
  // Verified: the Impressum duty moved from TMG s.5 to DDG s.5 on 14 May 2024. Citing the repealed TMG is itself
  // an Abmahnung risk in Germany, so the name carries the CURRENT basis.
  'DE_IMPRESSUM': 'Digitale-Dienste-Gesetz (DDG) s.5 - Impressumspflicht',
  'FR_LCEN': 'Loi pour la confiance dans l\'economie numerique (LCEN), Loi 2004-575',
  'BAHRAIN_PDPL': 'Bahrain Personal Data Protection Law (Law No. 30 of 2018)',
  'EGYPT_PDPL': 'Egypt Personal Data Protection Law (Law No. 151 of 2020)',
  'ISRAEL_PPL': 'Israel Protection of Privacy Law, 5741-1981',
  'JORDAN_PDPL': 'Jordan Personal Data Protection Law (Law No. 24 of 2023)',
  'OMAN_PDPL': 'Oman Personal Data Protection Law (Royal Decree 6/2022)',
  'ADGM_DPR': 'ADGM Data Protection Regulations 2021',
  'AE_AML_2018': 'UAE Federal Decree-Law No. 20 of 2018 on AML/CFT',
  'AE_CBUAE_CONSUMER': 'CBUAE Consumer Protection Regulation & Standards',
  'AE_DFSA_COB': 'DFSA Conduct of Business (DIFC)',
  'AE_FSRA_COBS': 'ADGM FSRA Conduct of Business (COBS)',
  'AE_FUNDRAISING_LICENCE': 'UAE Fundraising Regulation',
  'AE_SCA': 'UAE Securities and Commodities Authority (onshore)',
  'AE_VARA': 'Dubai Virtual Assets Regulatory Authority (VARA)',
  'CBUAE_INSURANCE': 'CBUAE Insurance Regulation (Federal Decree-Law No. 48 of 2023)',
  'CBUAE_RPSCS': 'CBUAE Retail Payment Services and Card Schemes Regulation',
  'DE_BDSG': 'DE Bundesdatenschutzgesetz',
  'DE_HWG': 'Heilmittelwerbegesetz (HWG) — German Act on Advertising in the Field of Healthcare',
  'DIFC_DPL': 'DIFC Data Protection Law No. 5 of 2020',
  'EU_AI_ACT': 'EU AI Act (Regulation (EU) 2024/1689)',
  'EU_AML6': 'EU 6th Anti-Money Laundering Directive',
  'EU_AUDIT_REG': 'EU Statutory Audit Regulation & Directive',
  'EU_BAR_CONDUCT': 'CCBE Code of Conduct for European Lawyers & National Bar Rules',
  'EU_CE_MARKING': 'EU CE Marking — Machinery Regulation, LVD, EMC',
  'EU_CLP': 'EU CLP — Classification, Labelling and Packaging (Reg (EC) 1272/2008)',
  'EU_CONSTRUCTION_SITES_DIRECTIVE': 'Temporary or Mobile Construction Sites Directive 92/57/EEC',
  'EU_CPR_305_2011': 'Construction Products Regulation (EU) 305/2011',
  'EU_CRD': 'EU Consumer Rights Directive (2011/83/EU)',
  'EU_CROSSBORDER_HEALTHCARE': 'Cross-Border Healthcare Directive & Professional Qualifications Recognition',
  'EU_CSRD': 'EU Corporate Sustainability Reporting Directive (CSRD)',
  'EU_DIR_2001_83': 'EU Community Code on Medicinal Products (Directive 2001/83/EC)',
  'EU_DMA': 'EU Digital Markets Act',
  'EU_DORA': 'EU Digital Operational Resilience Act',
  'EU_DSA': 'EU Digital Services Act',
  'EU_EAA_2025': 'EU European Accessibility Act',
  'EU_EDU_MEMBERSTATE': 'EU Education (Member-State Competence) + GDPR Art 8 Child Consent',
  'EU_EHDS': 'European Health Data Space (Regulation (EU) 2025/327)',
  'EU_EMD2': 'E-Money Directive 2 (2009/110/EC)',
  'EU_EPBD_EPC': 'EU Energy Performance of Buildings Directive (EPC in adverts)',
  'EU_EPRIVACY': 'ePrivacy Regulation',
  'EU_ESPR': 'EU Ecodesign for Sustainable Products Regulation (Reg (EU) 2024/1781)',
  'EU_FIC_1169_2011': 'EU Food Information to Consumers Regulation',
  'EU_FMD_2011_62': 'EU Falsified Medicines Directive (Directive 2011/62/EU)',
  'EU_GDPR': 'EU GDPR (Regulation 2016/679)',
  'EU_GDPR_ART9': 'GDPR Article 9 — Special Category (Health) Data',
  'EU_GPSR': 'EU General Product Safety Regulation 2023/988',
  'EU_IDD': 'EU Insurance Distribution Directive (Directive 2016/97)',
  'EU_IED': 'EU Industrial Emissions Directive (Directive 2010/75/EU)',
  'EU_INSTANT_PAYMENTS': 'Instant Payments Regulation (EU) 2024/886',
  'EU_IVDR': 'In Vitro Diagnostic Medical Devices Regulation (EU) 2017/746',
  'EU_MDR': 'EU Medical Device Regulation',
  'EU_MEMBER_STATE_SOCIAL_CARE': 'EU Member-State Long-Term / Social Care Licensing & Inspection Regimes',
  'EU_MICA': 'Markets in Crypto-Assets Regulation',
  'EU_MIFID_II': 'EU Markets in Financial Instruments Directive II',
  'EU_NIS2': 'EU NIS2 Directive',
  'EU_OMNIBUS': 'EU Omnibus Directive 2019/2161 (Modernising Consumer Protection)',
  'EU_PACKAGE_TRAVEL': 'EU Package Travel Directive',
  'EU_PRIIPS': 'PRIIPs Regulation — Packaged Retail and Insurance-based Investment Products (Key Information Document)',
  'EU_PSD2': 'EU Payment Services Directive 2',
  'EU_REACH': 'EU REACH — Registration, Evaluation, Authorisation of Chemicals (Reg (EC) 1907/2006)',
  'EU_ROHS': 'EU RoHS — Restriction of Hazardous Substances (Directive 2011/65/EU)',
  'EU_SFDR': 'EU Sustainable Finance Disclosure Regulation',
  'EU_SOHO': 'EU Substances of Human Origin (SoHO) Regulation & Tissues and Cells Directive regime',
  'EU_SOLVENCY_II': 'EU Solvency II (Directive 2009/138/EC)',
  'EU_STR_2024_1028': 'EU Short-Term Rental Data Regulation',
  'EU_UCPD': 'Unfair Commercial Practices Directive 2005/29/EC',
  'EU_WHISTLEBLOWER': 'EU Whistleblower Protection Directive',
  'FR_CNIL_2025': 'FR CNIL Privacy Sweep 2025',
  'GOOGLE_EEAT': 'Google E-E-A-T Quality Rater Guidelines',
  'QATAR_PDPPL': 'Qatar Personal Data Privacy Protection Law (Law 13 of 2016)',
  'SAUDI_PDPL': 'Saudi Personal Data Protection Law (SDAIA)',
  'UAE_ADEK': 'Abu Dhabi Department of Education and Knowledge',
  'UAE_ALCOHOL_LICENSING': 'UAE Emirate Alcohol Licensing Regime',
  'UAE_AML_2018': 'UAE AML/CFT (Federal Decree-Law No. 20 of 2018)',
  'UAE_ART_LAW': 'UAE Medically Assisted Reproduction Law (Federal Decree-Law No. 7 of 2019)',
  'UAE_CAA': 'Commission for Academic Accreditation (UAE Higher Education)',
  'UAE_CONSTRUCTION_SAFETY': 'UAE Construction Safety & Contractor Classification (OSHAD-SF / Dubai Municipality / Trakhees)',
  'UAE_CONSUMER': 'UAE Consumer Protection Law (Federal Law 15 of 2020)',
  'UAE_DET': 'UAE Tourism & Hospitality Licensing / Hotel Classification (Dubai DET / Abu Dhabi DCT)',
  'UAE_DHA': 'UAE Health Advertising (MOHAP / DHA / DOH)',
  'UAE_DHCC': 'Dubai Healthcare City Authority (DHCA/DHCR) Free Zone Clinical Governance',
  'UAE_DOH': 'Abu Dhabi Department of Health (DOH) / JAWDA Healthcare Standards',
  'UAE_ECOMMERCE': 'UAE E-Commerce & Electronic Transactions (Federal Decree-Law 46 of 2021)',
  'UAE_ELDERLY_RIGHTS': 'UAE Federal Law on the Rights of the Elderly (Federal Law No. 9 of 2019)',
  'UAE_ENV_2024': 'UAE Environment Law (Federal Decree-Law No. 11 of 2024)',
  'UAE_FOOD_SAFETY': 'UAE Food Safety (Federal Law No. 10 of 2015 + Dubai Municipality Food Code / ADAFSA)',
  'UAE_HALAL_FOOD': 'UAE Halal & Food Labelling (ESMA/MOIAT, GSO Standards)',
  'UAE_HEALTH_ADVERTISING': 'UAE Health Advertising Permit Regime (DHA / DOH)',
  'UAE_HEALTH_AD_PERMIT': 'UAE Health Advertising Permit (DHA / DOH / MOHAP advertising controls)',
  'UAE_HEALTH_DATA_LAW': 'UAE Federal Law No. 2 of 2019 on the Use of ICT in Health Fields',
  'UAE_ICT_HEALTH_LAW': 'UAE Use of ICT in Health Fields Law (Federal Law No. 2 of 2019)',
  'UAE_KHDA': 'Knowledge and Human Development Authority (Dubai)',
  'UAE_LEGAL_PRACTICE': 'UAE Legal Profession Licensing & Advertising (MoJ / Emirate / DLAD)',
  'UAE_MOE': 'UAE Ministry of Education (Federal)',
  'UAE_MOHAP': 'UAE Ministry of Health and Prevention (MOHAP) - Federal/Northern Emirates',
  'UAE_MOHRE': 'UAE Labour Law / MoHRE (Federal Decree-Law No. 33 of 2021)',
  'UAE_MOHRE_RECRUITMENT': 'UAE MOHRE Recruitment Agency Regulation (Onshore Labour Recruitment)',
  'UAE_MOIAT_ESMA': 'UAE MoIAT/ESMA Emirates Conformity Assessment Scheme (ECAS)',
  'UAE_MOJ_PROFESSION': 'UAE Professional Licensing — Ministry of Justice (Legal) & Ministry of Economy (Audit)',
  'UAE_PDPL': 'UAE Personal Data Protection Law (Federal Decree-Law 45/2021)',
  'UAE_RERA': 'RERA Law No. 7 of 2013 · Trakheesi',
  'UK_ABI': 'Association of British Insurers',
  'UK_ABPI': 'ABPI Code of Practice',
  'UK_ACCA': 'ACCA Code of Ethics and Conduct',
  'UK_AI_ICO': 'UK AI Governance Overlay (ICO AI & Data Protection Guidance)',
  'UK_ARLA': 'ARLA Propertymark Conduct',
  'UK_ASA_CAP': 'ASA / CAP Code',
  'UK_AWR_2010': 'Agency Workers Regulations 2010',
  'UK_BOTOX_FILLERS_CHILDREN_2021': 'Botulinum Toxin and Cosmetic Fillers (Children) Act 2021',
  'UK_BRIBERY_2010': 'UK Bribery Act 2010',
  'UK_BSB': 'Bar Standards Board Handbook',
  'UK_BUILDING_SAFETY_ACT_2022': 'Building Safety Act 2022',
  'UK_CAA': 'Civil Aviation Authority',
  'UK_CCR_2013': 'Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013',
  'UK_CDM_2015': 'Construction (Design and Management) Regulations 2015',
  'UK_CE_PLUS': 'UK Cyber Essentials Plus',
  'UK_CFA_2017': 'Criminal Finances Act 2017 (Failure to Prevent Facilitation of Tax Evasion)',
  'UK_CHARITY_COMMISSION': 'Charity Commission for England and Wales',
  'UK_CITB': 'CITB Construction Training Levy',
  'UK_CMA': 'Competition and Markets Authority',
  'UK_CMP_2019': 'Client Money Protection Schemes for Property Agents Regulations 2019',
  'UK_COMPANIES_ACT': 'UK Companies Act 2006 — Website Disclosure (s.1064/s.82)',
  'UK_CONSTRUCTION_PRODUCTS': 'UK Construction Products Regulations 2013 (UKCA/CE, DoP)',
  'UK_CONSUMER_DUTY': 'FCA Consumer Duty (PRIN 2A)',
  'UK_COSMETIC_LICENSING': 'UK Non-Surgical Cosmetic Procedures Licensing (HCA 2022 s.180)',
  'UK_CQC': 'Care Quality Commission Marketing Standards',
  'UK_CQC_FUNDAMENTAL_STANDARDS': 'CQC Fundamental Standards (Health & Social Care Act 2008 (Regulated Activities) Regulations 2014)',
  'UK_CRA_2015': 'UK Consumer Rights Act 2015',
  'UK_DFE': 'Department for Education Guidance',
  'UK_DMCC_2024': 'UK Digital Markets, Competition & Consumers Act 2024',
  'UK_DPA_2018': 'Data Protection Act 2018',
  'UK_DSIT_NIS2': 'DSIT NIS Regulations',
  'UK_DVSA': 'Driver and Vehicle Standards Agency',
  'UK_EAA_1973': 'Employment Agencies Act 1973 / Conduct Regulations 2003 (EAS Inspectorate / Fair Work Agency)',
  'UK_ECCTA_2023': 'Economic Crime and Corporate Transparency Act 2023 (Failure to Prevent Fraud)',
  'UK_ECOMM_REGS_2002': 'Electronic Commerce (EC Directive) Regulations 2002',
  'UK_EMR_2011': 'UK Electronic Money Regulations 2011',
  'UK_ENV_AGENCY': 'Environment Agency Permits',
  'UK_EQUALITY_2010': 'UK Equality Act 2010 (Digital Accessibility)',
  'UK_ESTATE_AGENTS_ACT': 'Estate Agents Act 1979',
  'UK_FCA_CONC25': 'FCA CONC 2.5 Financial Promotions',
  'UK_FCA_CONDUCT': 'FCA Conduct of Business Sourcebook (COBS) + Consumer Duty 2023',
  'UK_FCA_CONSUMER_DUTY': 'FCA Consumer Duty (PRIN 2A / Principle 12)',
  'UK_FCA_HRI_PROMO': 'FCA — High-Risk Investments & Cryptoasset Financial Promotions',
  'UK_FCA_MAR': 'FCA MAR',
  'UK_FOIA_2000': 'Freedom of Information Act 2000',
  'UK_FOOD_INFO_2014': 'Food Information Regulations 2014',
  'UK_FOS_FSCS': 'FOS + FSCS Disclosure',
  'UK_FRC': 'Financial Reporting Council UK Audit Framework',
  'UK_FSA': 'Food Standards Agency',
  'UK_FSMA_S21': 'UK Financial Services & Markets Act s.21 (Financial Promotions)',
  'UK_FUNDRAISING_REG': 'Fundraising Regulator Code',
  'UK_GAS_SAFE': 'UK Gas Safe Registration (Gas Safety Regulations 1998)',
  'UK_GDC': 'General Dental Council Standards',
  'UK_GDPR_A13': 'UK GDPR Article 13 Disclosure Requirements',
  'UK_GMC': 'GMC Good Medical Practice 2024',
  'UK_GPHC': 'General Pharmaceutical Council Standards',
  'UK_HCPC': 'Health and Care Professions Council — Standards of Conduct, Performance and Ethics',
  'UK_HFEA': 'Human Fertilisation and Embryology Authority (HFEA)',
  'UK_HMRC_AML': 'HMRC Money Laundering Supervision',
  'UK_HMRC_GIFTAID': 'HMRC Gift Aid Rules',
  'UK_HMR_2012': 'Human Medicines Regulations 2012',
  'UK_HRA_1998': 'Human Rights Act 1998',
  'UK_HSE': 'HSE Health and Safety',
  'UK_HSE_ENERGY': 'HSE Energy Sector Guidance',
  'UK_ICAEW': 'ICAEW Code of Ethics',
  'UK_ICOBS': 'FCA Insurance: Conduct of Business Sourcebook (ICOBS)',
  'UK_ICO_COOKIES': 'ICO Cookie and Similar Technologies Guidance',
  'UK_INSURANCE_ACT_2015': 'Insurance Act 2015 & Consumer Insurance (Disclosure and Representations) Act 2012',
  'UK_IPSO': 'IPSO Editors Code of Practice',
  'UK_IR35_OFFPAYROLL': 'Off-Payroll Working Rules (IR35) — Chapter 10, Part 2 ITEPA 2003',
  'UK_KCSIE_SAFEGUARDING': 'Keeping Children Safe in Education — Statutory Safeguarding (s.175 Education Act 2002)',
  'UK_LEGAL_OMBUDSMAN': 'Legal Ombudsman Complaints Signposting (Scheme Rules)',
  'UK_LICENSING_ACT': 'Licensing Act 2003',
  'UK_MCA_DOLS': 'Mental Capacity Act 2005 / Deprivation of Liberty Safeguards',
  'UK_MDA_1971': 'Misuse of Drugs Act 1971 / Misuse of Drugs Regulations 2001 (Controlled Drugs)',
  'UK_MEDICAL_DEVICES': 'UK Medical Devices Regulations 2002 (as amended)',
  'UK_MHRA': 'Medicines and Healthcare products Regulatory Agency',
  'UK_MLR_2017': 'UK Money Laundering Regulations 2017 & Proceeds of Crime Act 2002',
  'UK_MODERN_SLAVERY': 'UK Modern Slavery Act 2015 — Transparency in Supply Chains',
  'UK_NATASHAS_LAW': 'Natasha’s Law — Food Information (Amendment) (England) Regulations 2019 (PPDS labelling)',
  'UK_NCSC_CYBER_ESSENTIALS': 'NCSC Cyber Essentials',
  'UK_NMC': 'Nursing and Midwifery Council — The Code',
  'UK_NTSELAT_MATERIAL_INFO': 'NTSELAT Material Information in Property Listings',
  'UK_OFCOM': 'Ofcom Broadcasting Code',
  'UK_OFGEM': 'Ofgem Standards of Conduct',
  'UK_OFS': 'Office for Students',
  'UK_OFSTED': 'Ofsted School Inspection Framework',
  'UK_ORR': 'Office of Rail and Road',
  'UK_OSA_2023': 'UK Online Safety Act 2023',
  'UK_PECR': 'Privacy and Electronic Communications Regulations',
  'UK_PRA': 'PRA Rulebook',
  'UK_PREVENT': 'Prevent Duty — Counter-Terrorism and Security Act 2015',
  'UK_PSBAR_2018': 'Public Sector Bodies Accessibility Regulations 2018',
  'UK_PSR': 'Payment Systems Regulator',
  'UK_PSRS_2017': 'UK Payment Services Regulations 2017',
  'UK_REACH': 'UK REACH (Registration, Evaluation, Authorisation and Restriction of Chemicals)',
  'UK_RICS': 'RICS Rules of Conduct',
  'UK_SMCR': 'UK Senior Managers & Certification Regime',
  'UK_SRA_COC': 'Solicitors Regulation Authority Code of Conduct',
  'UK_SRA_TRANSPARENCY': 'SRA Transparency Rules 2018',
  'UK_TENANT_FEES_2019': 'Tenant Fees Act 2019',
  'UK_TPO': 'The Property Ombudsman Code',
  'UK_TRADING_STANDARDS': 'CTSI Trading Standards',
  'UK_UKCA': 'UKCA Conformity Marking',
  'UK_UKGC': 'UK Gambling Commission (LCCP + advertising)',
  'US_ABA_TRUST_ACCOUNTING': 'ABA Model Rule 1.15 / IOLTA Client Trust Accounting',
  'US_ADA': 'ADA Title III Digital Accessibility',
  'US_ADA_WEB': 'ADA Title III Website Accessibility & DOJ Hotel Reservation Rule',
  'US_ADEA': 'US Age Discrimination in Employment Act (ADEA)',
  'US_ATTORNEY_ADVERTISING': 'US Attorney Advertising (ABA Model Rules 7.1-7.3 + State Bars)',
  'US_BAR_ADVERTISING': 'US Lawyer Advertising — ABA Model Rules 7.1–7.5 / State Bar Rules',
  'US_BIPA': 'US Illinois Biometric Information Privacy Act',
  'US_BSA_FINCEN': 'Bank Secrecy Act / FinCEN MSB Regime',
  'US_CANSPAM': 'US CAN-SPAM Act',
  'US_CAN_SPAM': 'CAN-SPAM Act',
  'US_CA_ARL': 'California Automatic Renewal Law',
  'US_CA_UNRUH': 'California Unruh Civil Rights Act (Accessibility Damages)',
  'US_CCPA': 'CCPA / CPRA',
  'US_CDC_ART_REPORTING': 'US CDC ART Mandatory Success-Rate Reporting (FCSRCA 1992)',
  'US_CFPB_UDAAP': 'US CFPB - UDAAP (Dodd-Frank)',
  'US_CHARITY_SOLICITATION': 'US State Charitable Solicitation Registration',
  'US_CMS_LTC': 'CMS Long-Term Care Requirements of Participation (Nursing Home Reform Act)',
  'US_COLORADO_AI_ACT': 'Colorado Artificial Intelligence Act (SB24-205)',
  'US_CONTRACTOR_LICENSING': 'US State Contractor Licensing Boards (e.g. California CSLB)',
  'US_COPPA': 'US Children’s Online Privacy Protection Act',
  'US_CO_AI_ACT': 'Colorado Artificial Intelligence Act (SB24-205)',
  'US_CPRA': 'US California Privacy Rights Act (CPRA expansion of CCPA)',
  'US_CPSC': 'US Consumer Product Safety Commission (CPSA)',
  'US_DEA_CSA': 'US DEA / Controlled Substances Act',
  'US_DENTAL_BOARD': 'State Dental Board Practice Acts and Advertising Rules',
  'US_DSCSA': 'Drug Supply Chain Security Act',
  'US_EPA': 'US Environmental Protection Agency (CAA/CWA/RCRA/TSCA)',
  'US_EPA_RRP': 'EPA Lead Renovation, Repair and Painting (RRP) Rule',
  'US_FAIR_HOUSING_ACT': 'Fair Housing Act',
  'US_FCRA': 'US Fair Credit Reporting Act',
  'US_FDA': 'US Food, Drug & Cosmetic Act (FDA) — Drug/Device Approval & Promotion',
  'US_FDA_FDCA': 'Federal Food, Drug, and Cosmetic Act - Prescription Drug Advertising & Labeling',
  'US_FDA_HCTP': 'US FDA Human Cells, Tissues and Cellular/Tissue-Based Products (HCT/P) Rules',
  'US_FERPA': 'US Family Educational Rights and Privacy Act',
  'US_FINRA_2210': 'FINRA Rule 2210',
  'US_FSMA_MANUFACTURING': 'US Manufacturing - Cross-Border Data Framework Gating & Sector Regulator Baseline',
  'US_FTC': 'US FTC CAN-SPAM Act',
  'US_FTC_AI_CLAIMS': 'FTC Section 5 — Deceptive AI Claims',
  'US_FTC_ENDORSE': 'US Section 5 FTC Endorsement Guides 2024',
  'US_FTC_FAKE_REVIEWS': 'FTC Rule on the Use of Consumer Reviews and Testimonials',
  'US_FTC_HBNR': 'FTC Health Breach Notification Rule',
  'US_FTC_HEALTH_BREACH_RULE': 'FTC Health Breach Notification Rule',
  'US_FTC_JUNK_FEES': 'FTC Rule on Unfair or Deceptive Fees',
  'US_FTC_NEGATIVE_OPTION': 'FTC Negative Option / Click-to-Cancel Rule',
  'US_FTC_REVIEWS_RULE': 'FTC Rule on Use of Consumer Reviews and Testimonials (16 CFR Part 465)',
  'US_FTC_SAFEGUARDS': 'FTC Safeguards Rule (GLBA) for Accountants & Tax Preparers',
  'US_GLBA': 'US Gramm-Leach-Bliley Act',
  'US_HIPAA': 'HIPAA Privacy Rule · 45 CFR 164',
  'US_IA_MARKETING_RULE': 'SEC Investment Advisers Act Marketing Rule (Rule 206(4)-1)',
  'US_IL_AIVIA': 'Illinois Artificial Intelligence Video Interview Act',
  'US_IRS_501C3': 'US IRS 501(c)(3) Public Disclosure & Donation Substantiation',
  'US_MEDICAL_BOARD': 'US Medical/Dental Board Advertising + FTC',
  'US_NAIC_DOI': 'US State Insurance Regulation (NAIC / State Departments of Insurance)',
  'US_NAIC_UCSPA': 'NAIC Unfair Claims Settlement Practices Act & Unfair Trade Practices Act (state adoptions)',
  'US_NV_SB370': 'Nevada Consumer Health Data Privacy Law (SB 370)',
  'US_NYC_LL144': 'NYC Local Law 144 (Automated Employment Decision Tools)',
  'US_NYDFS_500': 'US NYDFS Cybersecurity Regulation Part 500',
  'US_OSHA': 'US Occupational Safety and Health Administration (OSH Act)',
  'US_OSHA_CONSTRUCTION': 'OSHA Construction Safety Standards (29 CFR Part 1926)',
  'US_PAY_TRANSPARENCY': 'US State Pay Transparency Laws',
  'US_PCAOB_SOX': 'Sarbanes-Oxley Act / PCAOB & AICPA Auditor Independence',
  'US_PPRA': 'Protection of Pupil Rights Amendment (PPRA)',
  'US_REG_E_EFTA': 'US Electronic Fund Transfer Act / Regulation E',
  'US_RESPA': 'Real Estate Settlement Procedures Act (RESPA / TILA-RESPA)',
  'US_RYAN_HAIGHT': 'Ryan Haight Online Pharmacy Consumer Protection Act / DEA remote-prescribing rules',
  'US_SALES_TAX_NEXUS': 'US State Sales-Tax Economic Nexus (post-Wayfair)',
  'US_SECTION_504_IDEA': 'Section 504 of the Rehabilitation Act & IDEA (Disability / Special Education)',
  'US_SEC_506C': 'US Securities Act Rule 506(c)',
  'US_SEC_MARKETING': 'US SEC Investment Adviser Marketing Rule',
  'US_SEC_REG_BI': 'SEC Regulation Best Interest (Reg BI)',
  'US_SEC_REG_FD': 'SEC Regulation FD',
  'US_STATE_BREACH_NOTIF': 'US State Data Breach Notification Laws',
  'US_STATE_MTL': 'State Money Transmitter Licensing',
  'US_STATE_PHARMACY_BOARD': 'US State Boards of Pharmacy (State Pharmacy Practice Acts / NABP)',
  'US_STATE_PRIVACY': 'US State Consumer Privacy Laws (20 states)',
  'US_STATE_PROF_CONDUCT': 'US State Professional Conduct & Licensing',
  'US_TCPA': 'US Telephone Consumer Protection Act',
  'US_TDPSA': 'US Texas Data Privacy & Security Act',
  'US_TELEHEALTH_LICENSURE': 'US Telehealth Cross-State Licensure (state medical practice acts / IMLC)',
  'US_TILA_REG_Z': 'US Truth in Lending Act / Regulation Z',
  'US_TITLE_IX': 'Title IX of the Education Amendments of 1972 (Sex Discrimination)',
  'US_TITLE_VI': 'Title VI of the Civil Rights Act 1964 (Race / National Origin)',
  'US_TITLE_VII': 'US Title VII / EEOC — Employment Discrimination in Hiring (incl. AI/algorithmic hiring)',
  'US_VCDPA': 'US Virginia Consumer Data Protection Act',
  'US_WA_MHMDA': 'Washington My Health My Data Act',
};
function fwName(fw) {
  const base = titleCase(String(fw || '').replace(/_/g, ' ').toLowerCase());
  let n = fixAcronyms(FW_NAME[fw] || FW_NAME_CAT[fw] || base || 'Framework');
  if (/^[A-Z]{2,}$/.test(n)) n = base || 'Framework';   // never a bare all-caps token (raw-code QA guard)
  return String(n).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').trim() || 'Framework';
}
// Clean, short tag for the finding badge, NEVER a raw underscore code ("US_STATE_PRIVACY"); derived from the
// friendly name with the "· Art.13" suffix and trailing year stripped. (no-raw-framework-code) (G-regtag)
function regTag(fw) { const n = fwName(fw); return n.replace(/\s*·.*$/, '').replace(/\s+\d{4}[A-Z0-9]*\b.*$/, '').trim() || 'Framework'; }
// E08 — WE WERE PRINTING THE WORDS "Sector regulator" AS IF THEY WERE THE ENFORCING AUTHORITY.
// 151 of the 294 active frameworks are absent from FW_REGULATOR, so on more than half the catalogue this
// placeholder shipped to a law firm in the column headed "Regulator". A reader takes that as our answer. It is not
// an answer, it is a gap wearing the costume of one. A regulator we cannot name must be OMITTED, never invented:
// the renderer drops the regulator line rather than assert a body that does not exist.
function fwRegulator(fw) { return FW_REGULATOR[fw] || null; }
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
  // Categorise unmapped Lighthouse audits by prefix/known-set so accessibility audits
  // (aria-*, *-name, role/label/focus checks) are never mislabelled as Performance. (visual-QA fix)
  const A11Y = new Set(['presentation-role-conflict','duplicate-id-aria','duplicate-id-active','select-name','form-field-multiple-labels','list','listitem','definition-list','dlitem','td-headers-attr','th-has-data-cells','valid-lang','accesskeys','bypass','object-alt','input-image-alt','video-caption','focusable-controls','interactive-element-affordance','logical-tab-order','managed-focus','use-landmarks','visual-order-follows-dom','focus-traps','table-fake-caption','identical-links-same-purpose']);
  const isA11y = /^aria-/.test(base) || /(^|-)(name|label|role|focus|landmark|contrast|alt|lang|heading|tabindex)(-|$)/.test(base) || A11Y.has(base);
  if (isA11y) return [titleCase(base.replace(/-/g, ' ')) || 'Accessibility issue', 'a11y', 'Tamazia resolves and verifies this accessibility issue on your live site.'];
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
  const generic = !cur || /(?:implements and verifies|resolves and verifies|closes this gap as part of the engagement)|(?:on your live site\.?$)/i.test(cur) || new RegExp('verifies ["‘’\'"]', 'i').test(cur);
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
// Element-checklist breach line (Phase 3a): names the required elements the firm DOES show (with a verbatim example)
// and the specific ones it does NOT — the granular "you show price and VAT but not timescales, key stages or who does
// the work" finding a real lawyer raises. Returns '' when there is no element breakdown.
function elementLine(p) {
  const present = Array.isArray(p.present_elements) ? p.present_elements : [];
  const missing = Array.isArray(p.missing_elements) ? p.missing_elements : [];
  if (!missing.length) return '';
  const page = humanUrl(p.evidence_url) || 'your site';
  const q = (Array.isArray(p.elements) ? (p.elements.find((e) => e.present && e.quote) || {}).quote : '') || '';
  if (present.length) {
    // NO TRUNCATION: the quote is the firm's own words, quoted back to it. Cutting it mid-word ("…cooperation, se")
    // destroys the evidence. It renders in full and the CSS wraps it.
    return `On ${page} you show ${present.join('; ')}${q ? `, for example “${String(q).replace(/\s{2,}/g, ' ').trim()}”` : ''}. The scan did not find: ${missing.join('; ')}.`;
  }
  return `The scan did not find the required elements on ${page}: ${missing.join('; ')}.`;
}

// absence breach shows WHAT we read on the page that should carry the disclosure vs the SPECIFIC missing element —
// never the bare "we inspected your homepage". Falls back to '' when there is no structured absence evidence.
function absenceLine(ae) {
  if (!ae || typeof ae !== 'object') return '';
  const page = ae.target_url ? humanUrl(ae.target_url) : '';
  if (ae.state === 'related_present_requirement_absent' && ae.nearest_quote) {
    return `On ${page || 'your site'} the scan read “${String(ae.nearest_quote).replace(/\s{2,}/g, ' ').trim()}”, but ${ae.requirement || 'the required disclosure'} is not present.`;
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
  // The fine is printed in the currency of the regime that SETS it, not the firm's home currency. `sym` (the
  // page's primary currency) is only the fallback for codes with no statutory currency of their own. No FX.
  sym = currencyForFramework(p.framework_short || p.citation) || sym || '£';
  const lowF = +p.fine_low_gbp || 0, hiF = +p.fine_high_gbp || 0;
  const enfLo = +p.enforce_typical_low_gbp || 0, enfHi = +p.enforce_typical_high_gbp || 0;
  // E-243 (v22.11) — "AN SEO METRIC CANNOT CARRY AN ENFORCEMENT ACTION."
  // This guard used to test ONLY `ai_visibility` and `seo`, while the `law` line below tested a WIDER bucket list
  // (performance, technical, tls_dns...). A Largest-Contentful-Paint finding has bucket `performance`: it escaped
  // this guard, carried no fine and no penalty_note, and fell through to the literal string 'enforcement action'
  // on line ~765. The live page therefore branded a Core Web Vital as a regulatory enforcement action. The two
  // lists are now ONE canonical predicate (NON_STATUTORY_BUCKET), so they can never drift apart again.
  const noFine = isNonStatutory(p);   // FIX-R1 + E-243
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
    // Precise controlling provision (instrument + section/article) when known, e.g. "Companies Act 2006 s.82",
    // "UK GDPR Art. 13(2)(f)", "SRA Transparency Rules 2018 r.1.1-1.5" — legally-defensible specificity. (legal-QA citation)
    statute: p.statutory_citation || null,
    // Penalty display: a fixed £ range when the law sets one; else the penalty_basis note (e.g. "up to 10% of
    // global annual turnover", "unlimited fine", "per-violation penalty", "non-monetary sanctions") so turnover-%
    // / unlimited / per-violation regimes are stated accurately instead of a misleading £0 or "ranking impact".
    // Only genuine SEO/AI signals fall through to "ranking impact". (legal-QA penalty-basis fix)
    // FIX-R1: when the framework carries NO statutory fine (SEO/AI signal OR voluntary code), NEVER emit a GBP
    // figure even if the payload attached one — show the non-monetary sanction note or 'ranking impact'.
    // E-243: the final fallback used to be the literal string 'enforcement action', which is (a) meaningless as a
    // penalty and (b) a REGULATORY claim stamped onto findings that carry no law at all. A finding with no fine and
    // no penalty basis states exactly that, and nothing more. We never invent a sanction.
    exp: noFine ? (p.penalty_note || 'non-statutory (ranking and AI-visibility impact)')
      : (enfLo || enfHi) ? (gbp(enfLo, sym) + ' to ' + gbp(enfHi, sym) + ' typical')
        : (lowF || hiF) ? (gbp(lowF, sym) + ' to ' + gbp(hiF, sym))
          : (p.penalty_note ? p.penalty_note : 'no published penalty figure'),
    expMax: (!noFine && hiF) ? gbp(hiF, sym) : (p.penalty_note || null),   // FIX-R1
    maxRare: !!p.enforce_max_rare,
    enfMethod: p.enforce_methodology || null,
    enfContext: p.enforce_context || null,
    title: p.fact || g(p, 'bingo.problem', 'Finding'),
    plain: p.layman_explanation || g(p, 'bingo.problem', ''),
    prec: p.enforcement_example || g(news, p.framework_short, ''),
    // Prefer a verbatim on-site quote; else the engine's real nearest-miss absence line; else the bingo problem.
    quote: _q25(p.evidence_quote) || absenceLine(p.absence_evidence) || g(p, 'bingo.problem', ''),
    fix: craftFix(p),
    // E12/E40: "Severity P0" is internal engineering vocabulary; the buyer asked, correctly, what a P0 was.
    // The severity word is now the client-facing one, defined inline in the report (Critical / High / Standard),
    // and the closing window is stated in the language of the products that close it.
    sevWord: SEV_WORD[p.severity] || 'Standard',
    plan: (SEV_WORD[p.severity] || 'Standard') + ' · closed in ' + (i === 0 ? 'week 1' : 'weeks 1 to 4') + ' of any Sprint or mandate',
  };
}
// E12 · Global severity language. P0/P1/P2/P3 are internal engine tokens and never reach a client.
// The three definitions are printed inline on first use and carried on the severity dots as hover tips.
const SEV_WORD = { P0: 'Critical', P1: 'High', P2: 'Standard', P3: 'Standard' };
const SEV_DEFS = [
  ['Critical', 'A live breach of binding law on your site today, the item a regulator\'s first letter cites.'],
  ['High', 'Regulator-visible on inspection, one step from a breach citation.'],
  ['Standard', 'A best-practice gap costing rankings and AI visibility, not enforcement.'],
];

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
    const subj = String(f.title || f.law || '').replace(/\s+/g, ' ').trim().replace(/["“”]/g, '').replace(/[,\s:.\-]+$/, '');
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
  // Prefix checks FIRST (the catalogue's real codes: UAE_*, SAUDI_*, QATAR_*, SG_*), so a UAE/Saudi/Qatar/Singapore
  // law is badged to its OWN country and jurisdiction-gated correctly — never mis-mapped to "Global" (which would show
  // it on every firm) or to the wrong country. Bare-substring fallbacks run only when no prefix matched. (multi-jur)
  if (c.startsWith('UK_') || c.startsWith('GB_')) return 'UK';
  if (c.startsWith('EU_')) return 'EU';
  if (c.startsWith('US_')) return 'US';
  if (c.startsWith('UAE_') || c.startsWith('AE_') || c.startsWith('DIFC_') || c.startsWith('ADGM_')) return 'AE';
  if (c.startsWith('SAUDI_') || c.startsWith('SA_') || c.startsWith('KSA_')) return 'SA';
  if (c.startsWith('QATAR_') || c.startsWith('QA_')) return 'QA';
  if (c.startsWith('SG_') || c.startsWith('SINGAPORE_')) return 'SG';
  if (c.startsWith('FR_')) return 'FR';
  if (c.startsWith('DE_')) return 'DE';
  if (c.startsWith('IN_')) return 'IN';
  // Fallbacks for codes that carry no jurisdiction prefix.
  if (['HIPAA', 'CCPA', 'CPRA', 'CAN_SPAM', 'COPPA', 'FERPA', 'TCPA', 'GLBA'].some((x) => c.includes(x))) return 'US';
  if (c.includes('RERA') || c.includes('DIFC') || c.includes('ADGM')) return 'AE';
  if (c.includes('CNIL')) return 'FR';
  if (c.includes('BDSG')) return 'DE';
  return 'GLOBAL'; // GOOGLE_EEAT, schema, etc., universal
};
// Authoritative allow-list = country + TLD (the trustworthy spine), + EU only with corroborating
// evidence. We deliberately do NOT union the engine's other jurisdiction codes: markets.js can
// over-attach US/foreign law on weak signals (the Al Tamimi leak). country+TLD is authoritative. (G2/S-001)
// E-218: render-side sanitiser for verified!==true rows. Mirrors the engine's evidence gates (E-041/E-044,
// V05 absence-proof, V09 fine discipline, P-011 template-accusation threshold) over the STORED payload, so the
// public page can never assert more than the evidence carries. Pure; never throws (any error returns the input).
function sanitiseUnverified(p) {
  try {
    p = p || {};
    const out = Object.assign({}, p);
    const dropped = { absence_no_proof: 0, short_evidence: 0, template_accusation: 0, malformed: 0, foreign_family: 0 };
    // V02/P-003 render-side: on an UNVERIFIED row the payload's own jurisdiction claims (engine_jurisdictions,
    // office_countries) cannot be trusted — they are exactly what the kitchen-sink era inflated. Only the
    // REGISTERED country's family (+ EU when the country is a member state) and GLOBAL law render; a verified
    // fresh mint restores a genuine international firm's full set.
    const CMAP = { USA: 'US', UAE: 'AE', KSA: 'SA', GBR: 'UK', GB: 'UK' };
    const EU_M = ['FR', 'DE', 'IT', 'ES', 'NL', 'IE', 'BE', 'PT', 'AT', 'SE', 'DK', 'FI', 'PL', 'LU', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT'];
    const cc0 = String(p.country || '').toUpperCase();
    const cc = CMAP[cc0] || cc0;
    const allowNarrow = new Set(['GLOBAL']);
    if (cc) allowNarrow.add(cc);
    if (EU_M.includes(cc)) allowNarrow.add('EU');
    const KEEP = [];
    for (const x of arr(p.pointers)) {
      if (!x || typeof x !== 'object') { dropped.malformed++; continue; }
      const fw = String(x.framework_short || x.framework || x.citation || '');
      const fact = String(x.fact || x.description || '');
      if (!fw && !fact) { dropped.malformed++; continue; }
      if (fw) { const j = FW_JUR(fw); if (!(j === 'GLOBAL' || allowNarrow.has(j))) { dropped.foreign_family++; continue; } }
      const q = String(x.evidence_quote || x.evidence_snippet || '').trim();
      const isAbsence = x.kind === 'absence' || x.status === 'miss';
      // P-011: a P0 "site compromised / injected spam" accusation must quote the injected URLs verbatim, or it
      // is boilerplate that must never blind-render against a named firm.
      if (/SITE_INTEGRITY|SUSPECTED_COMPROMISE/i.test(fw + ' ' + String(x.code || '')) && !/https?:\/\//i.test(q)) { dropped.template_accusation++; continue; }
      if (isAbsence) {
        // V05/P-004: an absence claim is valid only with a proving page (the page that SHOULD have carried it).
        const ae = x.absence_evidence;
        const proof = (ae && (ae.target_url || ae.pages_checked)) || arr(x.checked_urls).length || x.proof_url || x.page;
        if (!proof) { dropped.absence_no_proof++; continue; }
      } else if (q && q.length < 25 && !arr(x.checked_urls).length) {
        // E-041: a presence claim anchored only on a sub-25-char fragment is not evidence.
        dropped.short_evidence++; continue;
      }
      // P-008: on an unverified row, statutory-maximum fine ceilings are withheld unless the engine supplied a
      // calibrated typical-enforcement band. The finding itself still renders; the scare number does not.
      const y = Object.assign({}, x);
      if (!(+y.enforce_typical_low_gbp || +y.enforce_typical_high_gbp)) y.fine_withheld = true;
      KEEP.push(y);
    }
    out.pointers = KEEP;
    // The screened/'applies to you' layer makes applicability CLAIMS, so it takes the same family filter:
    // a US firm's unverified page must not list UK statutes even as screened rows.
    const _famOK = (code) => { const j = FW_JUR(String(code || '')); return j === 'GLOBAL' || allowNarrow.has(j); };
    if (Array.isArray(p.applicable_frameworks)) out.applicable_frameworks = p.applicable_frameworks.filter((f) => _famOK((f && (f.framework_short || f.code)) || f));
    if (Array.isArray(p.frameworks)) out.frameworks = p.frameworks.filter((f) => _famOK((f && (f.framework_short || f.code)) || f));
    if (Array.isArray(p.rules)) out.rules = p.rules.filter((r) => _famOK((r && (r.framework_short || r.framework)) || ''));
    if (p.binding && typeof p.binding === 'object') { const b = {}; for (const [k, v] of Object.entries(p.binding)) if (_famOK(k)) b[k] = v; out.binding = b; }
    if (Array.isArray(p.needs_review)) out.needs_review = p.needs_review.filter((r) => _famOK((r && (r.framework_short || r.citation)) || ''));
    // S-183: a legacy row with zero pages and zero surviving findings was never assessed — say so, never imply
    // a clean live-site read.
    if (!arr(p.pages_crawled).length && !KEEP.length && out.compliance_unassessed !== true) out.compliance_unassessed = true;
    out._sanitised = Object.assign({ applied: true }, dropped);
    // authJurisdictions honours this narrow set, so the screened-injection floor, the jurisdiction selector and
    // the membrane all agree on scope for an unverified row (no UK baseline injected onto a US firm's page).
    out._allow_narrow = [...allowNarrow];
    return out;
  } catch (_e) { return p; }
}
function authJurisdictions(payload) {
  // E-218: a sanitised (unverified) payload carries its own narrow scope — registered family + GLOBAL — and every
  // consumer (membrane, screened injection, selector) must honour it rather than re-deriving from payload claims.
  if (payload && Array.isArray(payload._allow_narrow) && payload._allow_narrow.length) return new Set(payload._allow_narrow);
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
  // Founder requirement: a firm that FUNCTIONS in multiple jurisdictions must see EVERY country's laws it operates in.
  // detected_jurisdictions is the considered set connect() used to ATTACH the frameworks now in the payload, so
  // unioning it aligns the render gate with the engine (a UK+UAE firm shows its UAE laws too, not just UK). Frameworks
  // are still individually jurisdiction- and sector-gated by connect()/the resolver, so this never invents a wrong law.
  const _JNAME = { 'UNITED KINGDOM': 'UK', 'GREAT BRITAIN': 'UK', 'ENGLAND': 'UK', 'SCOTLAND': 'UK', 'WALES': 'UK', 'UNITED STATES': 'US', 'USA': 'US', 'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE', 'DUBAI': 'AE', 'ABU DHABI': 'AE', 'SAUDI ARABIA': 'SA', 'KSA': 'SA', 'QATAR': 'QA', 'SINGAPORE': 'SG', 'EUROPEAN UNION': 'EU', 'FRANCE': 'FR', 'GERMANY': 'DE', 'ITALY': 'IT', 'SPAIN': 'ES', 'NETHERLANDS': 'NL', 'IRELAND': 'IE', 'INDIA': 'IN', 'CANADA': 'CA', 'AUSTRALIA': 'AU' };
  for (const d of det) { const code = _JNAME[String(d || '').toUpperCase().trim()]; if (code) { set.add(code); if (EU_MEMBERS.includes(code)) set.add('EU'); } }
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
    // E-234 (v22.8) NUMERIC CONSISTENCY: the headline exposure read ONLY fine_high_gbp, while the breach cards
    // render the CALIBRATED TYPICAL band (enforce_typical_*). On a payload carrying typical bands but no statutory
    // ceiling, the left panel therefore said "Ranking & AI · no statutory fine confirmed" while the card beside it
    // said "£100k to £5M typical" — the same audit contradicting itself. The exposure now falls back to the typical
    // band, which is also the honest number to headline (P-008: statutory maxima are scare tactics, not forecasts).
    const hi = (+p.fine_high_gbp || 0) || (+p.enforce_typical_high_gbp || 0);
    if (!fw || !hi || noStatutoryFine(fw)) continue;   // ranking guidelines + voluntary codes carry no statutory fine (C-018 / FIX-R1)
    m[fw] = Math.max(m[fw] || 0, hi);
  }
  return m;
}
function canonicalExposure(perFw) {
  let dp = 0, sum = 0;
  for (const [fw, v] of Object.entries(perFw)) { if (DP_FAMILY.has(fw)) dp = Math.max(dp, v); else sum += v; }
  return sum + dp;
}
// E-244 (v22.11) THE MEDIAN FINE, RESTORED.
// The left rail headlined the SUM OF STATUTORY CEILINGS ("£5M · MAXIMUM STATUTORY PENALTY"). Two problems:
//   1. CREDIBILITY. A statutory maximum is what the regulator COULD levy in the worst case in history. No law firm
//      believes it will be fined £5M for a missing reviews policy, so the number reads as a scare tactic and the
//      whole report loses authority — the opposite of what it is for. (P-008)
//   2. TRACEABILITY. £5M appeared NOWHERE else on the page. The cards said "£100k to £5M typical"; the rail said
//      "£5M maximum". Same audit, two different framings, and the headline figure was unfindable in the body.
// The headline is now the MEDIAN of the TYPICAL ENFORCEMENT BAND — the midpoint of what this regulator actually
// levies for this breach — which IS the band printed on every card, so the reader can add it up themselves.
// The statutory ceiling is retained as the top step of the waterfall, where it belongs: as context, not a headline.
function perFrameworkMedianFine(pointers) {
  const m = {};
  for (const p of pointers) {
    if (p.fine_withheld) continue;
    const fw = p.framework_short || p.citation;
    if (!fw || noStatutoryFine(fw) || isNonStatutory(p)) continue;
    const tLo = +p.enforce_typical_low_gbp || 0, tHi = +p.enforce_typical_high_gbp || 0;
    const sLo = +p.fine_low_gbp || 0, sHi = +p.fine_high_gbp || 0;
    // Prefer the observed enforcement band (what regulators DO). Fall back to the statutory band (what they MAY).
    let mid = (tLo || tHi) ? Math.round(((tLo || tHi) + (tHi || tLo)) / 2)
      : (sLo || sHi) ? Math.round(((sLo || sHi) + (sHi || sLo)) / 2) : 0;
    // E-244b: the turnover rescale has already cut this firm's statutory ceiling down to 4% of ITS OWN turnover
    // (a 12-partner firm cannot be fined the £17.5M global cap). The typical enforcement band, however, is the
    // regulator's population-wide band and is NOT rescaled — so an un-capped median could sit ABOVE this firm's
    // own ceiling and the audit would contradict itself again, in the other direction. The median is therefore
    // capped at the rescaled ceiling: median <= ceiling is now an invariant of the page.
    if (sHi > 0 && mid > sHi) mid = sHi;
    if (!mid) continue;
    m[fw] = Math.max(m[fw] || 0, mid);
  }
  return m;
}
// Scrub any £/GBP figure out of LLM prose and replace with the canonical figure (no LLM number leaks).
// The unit space is grouped WITH the unit so a trailing word (e.g. "fine") keeps its space. (P2)
// E04 / E27 — THE CONSISTENCY-FIXER WAS THE FABRICATOR.
// scrubMoney used to replace EVERY money figure in the executive summary with the canonical AGGREGATE exposure, so
// that the numbers "agreed". But when the model correctly wrote "an SRA penalty of up to £25,000", the scrubber
// rewrote it to £2.6M — producing the exact sentence a managing partner reads first:
//     "failure to comply with SRA regulations could result in a statutory penalty of up to £2.6M"
// The SRA's internal limit is £25,000. The £2.6M is the MEDIAN AGGREGATE across every framework in the report. That
// is not a rounding error, it is a fabricated legal claim, and it was manufactured by our own tidy-up pass.
// Same defect produced E04 ("the potential £2.8M penalty for non-compliance with data protection regulations").
//
// THE RULE: an aggregate belongs to the REPORT, never to a single regulator or statute.
//  - A figure in a clause that names NO specific body is the aggregate: normalise it to the canonical figure.
//  - A figure in a clause that DOES name a body (SRA, ICO, the CMA, GDPR, PECR...) is a SPECIFIC statutory claim we
//    cannot verify from here. We do not rewrite it to the aggregate and we do not assert it: the figure is removed
//    and the qualitative statement survives. Saying less is always available; saying something false is not.
const _NAMED_BODY = /\b(SRA|ICO|CMA|FCA|CQC|ASA|Ofcom|SDT|Legal Ombudsman|Trading Standards|DGCCRF|GDPR|PECR|DPA\s?2018|Equality Act|Companies Act|Transparency Rules|Code of Conduct)\b/i;
const _MONEY_RX = /(?:GBP|USD|AED|SAR|£|\$|EUR|€)\s?[\d,]+(?:\.\d+)?(?:\s?(?:million|bn|billion|k|m)\b)?/gi;

function scrubMoney(text, canonical, sym) {
  if (!text) return '';
  // Work clause by clause so the decision is made where the attribution actually sits.
  const parts = String(text).split(/(?<=[.;])\s+/);
  const out = parts.map((clause) => {
    if (!_MONEY_RX.test(clause)) { _MONEY_RX.lastIndex = 0; return clause; }
    _MONEY_RX.lastIndex = 0;
    if (_NAMED_BODY.test(clause)) {
      // A number attributed to a NAMED body. We cannot stand behind it, so we do not print it.
      return clause.replace(_MONEY_RX, '').replace(/\s+of up to\s+(?=[.,;]|$)/i, '')
                   .replace(/\s+up to\s+(?=[.,;]|$)/i, '').replace(/\s{2,}/g, ' ')
                   .replace(/\s+([.,;])/g, '$1').trim();
    }
    return clause.replace(_MONEY_RX, gbp(canonical, sym));
  });
  return out.join(' ').replace(/\s{2,}/g, ' ').trim();
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
  // D-6: displayed regulatory registration numbers/badges (ICO, SRA, FCA FRN, CQC, CH) ARE verified signals —
  // when present, the compliance dimension is NOT 'na' even with zero breach findings. This prevents a registered,
  // compliant firm from being penalised solely because the engine found no statutory breach to evidence.
  const compP = pointers.filter((p) => p.bucket !== 'ai_visibility');
  const cc0 = compP.filter((p) => p.severity === 'P0').length;
  const ch0 = compP.filter((p) => p.severity === 'P1').length;
  const cs0 = compP.length - cc0 - ch0;
  const compHealth = Math.max(0, 1 - (cc0 * 0.10 + ch0 * 0.04 + cs0 * 0.015));
  const posComp = g(payload, 'comp.positive_compliance', {}) || {};
  // compNA: truly 'not assessed' only when no findings AND no positive registration signals
  const compNA = compP.length === 0 && !posComp.any;
  const tvScore = (good) => good ? 88 : 30;
  const has = (k) => !!sig[k];
  const perf = isNum(psi.perf) ? Math.round(psi.perf * 100) : null;
  const dims = [
    // Verdict: criticals↗fail, highs↗warn, standard-only↗warn (NOT a confident green "PASS", which read as
    // "Regulatory compliance PASS" under an F grade); only a genuinely clean sheet (no findings at all) passes. (zero-critical-honest)
    // D-6: when positive_compliance signals are present and cc0=0, compliance is assessed (not na) at a
    // moderate 'pass' — not a perfect score (we still found minor issues potentially) but no longer 'na'.
    { nm: 'Regulatory compliance', key: 'compliance', _na: compNA, _cc: cc0, _ch: ch0,
      st: compNA ? 'na' : (cc0 > 0 ? 'fail' : ch0 > 0 ? 'warn' : cs0 > 0 ? 'warn' : 'pass'),
      v: compNA ? 0 : (cc0 === 0 && posComp.any ? Math.max(72, Math.round(compHealth * 100)) : Math.round(compHealth * 100)),
      sub: compNA ? 'not assessed, limited read of the live site' : (cc0 === 0 && posComp.any ? `registered · ${ch0} high · ${cs0} standard` : `${cc0} critical · ${ch0} high · ${cs0} standard`),
      w: 2 },
    // On-page / technical / content / security / a11y / tracking dims INFER from the signal bag; with no readable
    // scan that bag is empty and every value would read 0 (a fabricated F that also tanks the score). Pass null so
    // they become "not assessed" (excluded from scoring) instead of confirmed-failing. (scan-fabrication)
    { nm: 'On-page SEO', key: 'seo', v: siteScanned ? Math.round(((has('title') && sig.title) ? 1 : 0) * 33 + (has('meta_description') ? 33 : 0) + (sig.h1_count > 0 ? 34 : 0)) : null, sub: siteScanned ? (`${(sig.title ? '' : 'no title · ')}${sig.meta_description ? '' : 'no meta description · '}${sig.h1_count > 0 ? '' : 'no H1'}`.replace(/ · $/, '') || 'present') : 'not assessed', w: 1 },
    { nm: 'Technical SEO', key: 'technical_seo', v: siteScanned ? Math.round((has('canonical') ? 34 : 0) + (has('viewport') ? 33 : 0) + (has('lang') ? 33 : 0)) : null, sub: siteScanned ? (`${sig.canonical ? '' : 'no canonical · '}${sig.viewport ? '' : 'no viewport · '}${sig.lang ? '' : 'no lang attribute'}`.replace(/ · $/, '') || 'ok') : 'not assessed', w: 1 },
    { nm: 'Content & E-E-A-T', key: 'content', v: siteScanned ? Math.round((has('json_ld') ? 40 : 0) + (has('open_graph') ? 20 : 0) + (sig.html_bytes > 4000 ? 40 : 15)) : null, sub: siteScanned ? `${sig.json_ld ? 'schema · ' : 'no schema · '}${sig.open_graph ? 'OG · ' : 'no OG · '}${sig.html_bytes > 4000 ? 'depth ok' : 'thin content'}` : 'not assessed', w: 1 },
    { nm: 'Core Web Vitals', key: 'cwv', v: perf == null ? null : perf, sub: perf == null ? 'not assessed' : `perf ${perf} · CLS ${(+psi.cls || 0).toFixed(2)}`, w: 1 },
    { nm: 'Security headers', key: 'security', v: siteScanned ? Math.round([sig.hsts, sig.csp, sig.xfo, sig.xcto, sig.refpol, sig.permpol].filter(Boolean).length / 6 * 100) : null, sub: siteScanned ? (`${sig.hsts ? '' : 'no HSTS · '}${sig.csp ? '' : 'no CSP · '}${sig.xfo ? '' : 'no X-Frame'}`.replace(/ · $/, '') || 'ok') : 'not assessed', w: 1 },
    { nm: 'Accessibility (WCAG)', key: 'a11y', v: siteScanned ? Math.round((sig.lang ? 30 : 0) + (sig.viewport ? 30 : 0) + 40 * pointerHealth) : null, sub: siteScanned ? `${sig.lang ? '' : 'no lang · '}contrast/labels` : 'not assessed', w: 1 },
    // E11 — THE SCORE CONTRADICTED THE EVIDENCE PRINTED BESIDE IT.
    // The dimension rendered 80/100 while its own sub-line said "share of voice 0". That is because the score WAS
    // entity readiness alone: being machine-readable was counted, being cited was not. But the dimension is called
    // AI VISIBILITY, and a firm no engine ever names is not visible, however clean its schema. A reader who sees 80
    // beside a zero stops trusting every other number on the page.
    // The dimension is now the weighted pair it always claimed to be: entity readiness and share of voice, evenly.
    // A firm with zero share of voice cannot exceed 40 here, and the card says why.
    (() => {
      const _sov = +sovClamp(g(payload, 'geo_probe.share_of_voice'), g(payload, 'geo_probe.samples'), g(payload, 'geo_probe.ai_knows')) || 0;
      const _ent = +(aiR.score || 0);
      let _v = Math.round((_ent * 0.5) + (_sov * 0.5));
      const _capped = _sov === 0;          // no engine names you: the ceiling applies whether or not it bites
      if (_capped && _v > 40) _v = 40;
      return {
        nm: 'AI / GEO visibility', key: 'ai_visibility',
        st: _v < 40 ? 'fail' : _v < 70 ? 'warn' : 'pass',
        v: _v,
        sub: `share of voice ${_sov} · entity ${_ent}`
           + (_capped ? ' · capped at 40: you are machine-readable but no engine names you' : ''),
        w: 1,
      };
    })(),
    { nm: 'Authority & backlinks', key: 'authority', v: g(authority, 'you.da_100', null), sub: `DA ${g(authority, 'you.da_100', 'n/a')} · vs ${arr(authority.ranked).length} rivals`, w: 1 },
    (function () { const nT = arr(sig.trackers).length, ads = !!g(sig, 'ad_tech.runs_ads', false), has = nT > 0 || ads; return { nm: 'Tracking & consent', key: 'tracking', _na: !siteScanned, st: !siteScanned ? 'na' : (has ? 'warn' : 'pass'), v: !siteScanned ? null : (has ? 45 : 85), sub: !siteScanned ? 'not assessed' : (has ? `${nT} tracker${nT === 1 ? '' : 's'}${ads ? ' + ad pixels' : ''}, each one needs prior consent under PECR/GDPR` : 'No third-party trackers firing before consent'), w: 1 }; })(),
  ];
  // E-28: a dimension that reads a bare "0" is unexplained and reads as a bug. Say WHY it is zero, in the card
  // itself. When Critical findings sit in the dimension, that is the reason: each Critical floors it until closed.
  const DIM_BUCKETS = {
    compliance: ['compliance', 'public_records'], seo: ['seo'], technical_seo: ['technical_seo', 'technical', 'tls_dns'],
    content: ['eeat', 'content'], cwv: ['performance', 'core_web_vitals'], security: ['tls_dns', 'security'],
    a11y: ['accessibility'], ai_visibility: ['ai_visibility', 'geo'], authority: ['authority', 'backlinks'], tracking: ['tracking', 'cookies'],
  };
  const critsIn = (key) => {
    const bs = DIM_BUCKETS[key] || [];
    return pointers.filter((p) => p.severity === 'P0' && bs.includes(String(p.bucket || ''))).length;
  };
  return dims.map((d) => {
    if (d.v == null) { d.st = 'na'; d.v = 0; d._na = true; }
    else if (!d.st) d.st = d.v >= 75 ? 'pass' : d.v >= 45 ? 'warn' : 'fail';
    if (d.v === 0 && !d._na) {
      const n = critsIn(d.key);
      d.note = n > 0
        ? `Scored 0 because ${n} Critical ${n === 1 ? 'finding sits' : 'findings sit'} in this dimension; each Critical caps the dimension at zero until closed.`
        : 'Scored 0 because none of the checks in this dimension passed on your live site.';
    }
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
 london: 'UK', manchester: 'UK', birmingham: 'UK', edinburgh: 'UK', glasgow: 'UK', leeds: 'UK', bristol: 'UK', liverpool: 'UK', sheffield: 'UK', newcastle: 'UK', nottingham: 'UK', leicester: 'UK', coventry: 'UK', cardiff: 'UK', belfast: 'UK', aberdeen: 'UK', brighton: 'UK', oxford: 'UK', cambridge: 'UK', reading: 'UK', southampton: 'UK', norwich: 'UK', exeter: 'UK', derby: 'UK', plymouth: 'UK', wolverhampton: 'UK',
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
export { isRealCompetitor, FW_JUR, COMPETITOR_DENYLIST, JUNK_PATTERNS, noStatutoryFine, setVoluntaryBinding, bingoFromPointer, currencyForFramework, gbp };
export function payloadToD(payload, ctx = {}) {
  payload = payload || {};
  // E-218 TRUTH FILTER (audit-of-the-audits P-002/P-004/P-008/P-011/P-064, S-183): any row the verifier did not
  // pass (verified !== true — 9,700+ legacy rows plus every quarantined mint) renders ONLY what survives the
  // engine's own evidence standards, applied render-side to the stored payload. What survives renders exactly as
  // before (real breaches stay line-by-line); what fails the standards is removed, and its fine with it. This is
  // the render-side sanitiser the 11 Jul catalogue prescribed instead of a mass re-mint.
  if (ctx.verified !== true) payload = sanitiseUnverified(payload);
  setVoluntaryBinding(payload && payload.binding);   // FIX-R1: seed voluntary-code guard from the engine payload
  setBindingMap(payload && payload.binding);            // #17a: seed the binding-status label map
  // FIX-R2/R3: consume the evidence-ledger contract. review_candidates = low-confidence attachments (below the
  // conformal band) that must NOT render as hard breaches; they still appear in the 'applies to you' framework list.
  const reviewSet = new Set(arr(payload.review_candidates).map((x) => String(x).toUpperCase()));
  const bindingMap = payload.binding || {};
  const now = ctx.now ? new Date(ctx.now) : new Date(g(payload, 'framework_last_reviewed', '2026-06-04'));
  const allow = authJurisdictions(payload);
  const company = firmName(payload, ctx.company);
  const market = String(payload.country || '').toUpperCase();
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
    // FIX-R3: a hard compliance breach that carries a monetary exposure MUST cite a law. A P0/P1 compliance finding
    // with a fine but no statutory_citation AND no citation_url is unverifiable noise -> never render it as a breach.
    if ((p.severity === 'P0' || p.severity === 'P1') && (+p.fine_high_gbp || 0) > 0 &&
        p.bucket === 'compliance' && !String(p.statutory_citation || p.citation_url || '').trim()) return false;
    return true;
  };
  const pointers = rawPointers.filter((p) => {
    const j = FW_JUR(p.framework_short || p.citation);
    if (!(j === 'GLOBAL' || allow.has(j))) return false;
    if (sectorInapplicable(p.framework_short || p.citation, payload)) return false; // sector-mismatch frameworks (Ofsted/DfE/OSA on a university)
    // FIX-R2/R3: a low-confidence (review-band) attachment is NOT a hard breach — it renders in 'applies to you', not
    // as a breach card with a fine. This consumes the engine's conformal review_candidates contract.
    if (reviewSet.has(String(p.framework_short || p.citation || '').toUpperCase())) return false;
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
    if (noStatutoryFine(fw)) continue;                                  // ranking signals + voluntary codes carry no statutory fine (FIX-R1)
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
  // E05 / E29 — TWO CONTRADICTORY TALLIES SHIPPED ON ONE PAGE. The rail said "1 critical / 15 high / 34 standard"
  // while the Regulatory dimension said "1 critical / 11 high / 28 standard", with no stated relationship. A reader
  // cannot tell which is true, so they trust neither. They were never in conflict: one counts EVERY dimension, the
  // other counts REGULATORY findings only. The numbers were fine; the missing word was the scope. Both tallies now
  // carry it explicitly, and the renderer prints the scope beside each.
  const counts = { critical: 0, high: 0, standard: 0, total: pointers.length, scope: 'across all ten dimensions' };
  for (const p of pointers) counts[SEV_BAND[p.severity] || 'standard']++;
  const _regPtrs = pointers.filter((p) => !isNonStatutory(p));
  const countsRegulatory = { critical: 0, high: 0, standard: 0, total: _regPtrs.length, scope: 'regulatory findings only' };
  for (const p of _regPtrs) countsRegulatory[SEV_BAND[p.severity] || 'standard']++;
  const perFw = perFrameworkMaxFine(pointers);
  const perFwMed = perFrameworkMedianFine(pointers);
  // CURRENCY BY REGIME. Every fine is grouped by the currency of the statute that sets it (currencyForFramework):
  // a GDPR fine is euros, a DIFC fine is US dollars, an ICO fine is pounds. Currencies are NEVER summed together
  // and NEVER converted — an exchange rate invented on a legal document is a fabrication. The headline is printed
  // in the firm's PRIMARY binding currency (the regime carrying the largest exposure) and any other binding
  // currency is stated ALONGSIDE it in its own units ("£2.6M + €900k").
  const _fallbackSym = moneySymbol(payload);   // only for codes with no statutory currency of their own
  const byCur = (m) => { const o = {}; for (const [fw, v] of Object.entries(m)) { const c = currencyForFramework(fw) || _fallbackSym; (o[c] = o[c] || {})[fw] = v; } return o; };
  const _medGroups = byCur(perFwMed), _maxGroups = byCur(perFw);
  const medTotals = {}; for (const [c, m] of Object.entries(_medGroups)) medTotals[c] = canonicalExposure(m);
  const ceilTotals = {}; for (const [c, m] of Object.entries(_maxGroups)) ceilTotals[c] = canonicalExposure(m);
  const _ranked = Object.entries(medTotals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const curSym = (_ranked[0] && _ranked[0][0]) || _fallbackSym;     // PRIMARY binding currency (no FX, ever)
  const ceilingN = ceilTotals[curSym] || 0;                         // statutory ceiling, primary currency (context only, E-244)
  const exposureN = medTotals[curSym] || 0;                         // headline = MEDIAN, never the ceiling
  const otherCurs = _ranked.slice(1);                               // other binding regimes, each in its own currency
  const exposureByCurrency = _ranked.map(([c, v]) => ({ cur: c, amount: v, display: gbp(v, c) }));
  const exposureAggregate = _ranked.length ? _ranked.map(([c, v]) => gbp(v, c)).join(' + ') : gbp(0, curSym);
  const exposureBasis = otherCurs.length
    ? `Stated per binding regime in its own statutory currency (${_ranked.map(([c]) => c).join(', ')}). Regulators set these maxima in their own currency, so the figures are shown side by side and no exchange rate is applied.`
    : `Stated in ${curSym}, the statutory currency of the regimes that bind you. No exchange rate is applied.`;
  // Exposure waterfall, show HOW the honest number is reached (we DON'T just sum ceilings). (§4.3 + E-244)
  // It is built on the PRIMARY-currency group only, so every step adds up to the headline figure beside it.
  const rawSum = Object.values(_maxGroups[curSym] || {}).reduce((a, b) => a + b, 0);
  const exposureWaterfall = {
    raw: rawSum, collapsed: exposureN, ceiling: ceilingN, median: exposureN, cur: curSym,
    frameworks: Object.keys(_medGroups[curSym] || {}).length,
    savedPct: rawSum > 0 ? Math.round((1 - exposureN / rawSum) * 100) : 0,
    steps: [
      { l: 'Statutory ceilings, summed (what the law permits)', v: rawSum, cls: 'amber' },
      { l: 'Overlapping data-protection fines collapsed (max, not sum)', v: ceilingN, cls: 'gold' },
      { l: 'Median of the typical enforcement band, what regulators actually levy', v: exposureN, cls: 'red', final: true },
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
  const compCriticalPointers = pointers.filter((p) => (p.bucket === 'compliance' || p.bucket === 'public_records') && p.severity === 'P0');
  const compCriticals = compCriticalPointers.length;
  // D-3: count distinct breached frameworks (not raw pointer count) for the headline — avoids "4 breached" when
  // 4 pointers belong to 1 framework. "Breached" = at least one P0 confirmed finding in that framework.
  const breachedFwCount = new Set(compCriticalPointers.map((p) => p.framework_short || p.framework).filter(Boolean)).size || compCriticals;
  const compHighs = pointers.filter((p) => (p.bucket === 'compliance' || p.bucket === 'public_records') && p.severity === 'P1').length;
  // D-1: replace hardcoded '400+' with honest language. The catalogue is screened; binding count is `frameworks.length`.
  // D-3: use breachedFwCount (distinct frameworks) not compCriticals (raw pointer count) in the breach assertion.
  // C-5: use the correct scan-type label — "your live site" only when scan was live; "the archived version"
  //      when Wayback was used, so we never assert a live breach on evidence from a historical snapshot.
  // FIX(render-crash): `frameworks` is a const declared ~70 lines BELOW (line ~1056), so referencing it here threw
  // a TDZ ReferenceError ("Cannot access 'frameworks' before initialization") on EVERY payload — crashing payloadToD
  // unconditionally (all fixtures + all live audits). This blocked every render-engine improvement since the bug
  // landed from reaching production. bindingN is just the distinct binding-framework count, which equals
  // frameworks.length (frameworks = Object.entries(byFw), no outer filter); compute it here from the same source
  // (compliance/public_records pointers grouped by actKey) using only symbols already in scope (pointers, actKey).
  const bindingN = new Set((pointers || []).filter((p) => p.bucket === 'compliance' || p.bucket === 'public_records').map((p) => actKey(p.framework_short || p.citation || 'OTHER')).filter(Boolean)).size;
  const _viaArchive = !!payload.via_archive;
  const _scanLabel = _viaArchive ? 'the archived version of your site' : 'your live site';
  // The headline's "legally bind you" count must reflect the frameworks actually shown (breached + the laws that bind
  // you with no breach), not just the breached count — so it is computed BELOW, once `frameworks` is finalised. Per
  // founder: this section never says "we scanned your site and found no breach"; a non-breached law is presented as a
  // framework that binds you with obligations, not as a clean bill of health.
  let regulatoryHeadline = '';
  const regulatoryCriticalsZero = compCriticals === 0;

  // --- frameworks (group pointers; jurisdiction-gated already) ---
// Curated recent-enforcement context per framework (real 2024-2026 regulator actions), used when the payload
  // carries no live news_map — so the per-law card shows an actual recent action, not just the statutory regime.
  const PORTED_NEWS = {
    'UK_GDPR_A13': 'ICO issued GBP 19.6M across 7 cases in 2025 (Capita GBP 14M, Advanced Computer Software GBP 3.07M, 23andMe GBP 2.31M, LastPass GBP 1.23M); two-thirds were UK GDPR breaches.',
    'UK_DPA_2018': 'ICO 2025 enforcement hit GBP 19.6M from 7 cases (vs GBP 2.7M in 2024); the DUAA came into force 5 Feb 2026 with new compulsion powers.',
    'UK_PECR': 'The DUAA came into force 5 Feb 2026, raising the maximum PECR fine to £17.5M (from £500k); the ICO is reviewing the UK top 1,000 websites cookie banners.',
    'UK_ICO_COOKIES': 'DUAA (in force 5 Feb 2026) lifts PECR fines to £17.5M; the ICO is actively reviewing the top 1,000 UK sites and warned non-compliant cookie banners.',
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
  // Curated regulatory-intelligence (Phase 4): per-framework obligations + regulator focus + verified recent
  // enforcement + recent guidance, keyed by framework_short. Attached to every framework card so a screened (no-
  // breach) framework still renders a substantive intelligence block, and a verified enforcement action (with a real
  // penalty) replaces the generic "the regulator enforces this" prose. Look-up tolerant of synthesised codes.
  const intel = g(payload, 'framework_intel', {}) || {};
  const intelOf = (fw, fwShort) => intel[fw] || (fwShort && intel[fwShort]) || intel[String(fw).replace(/_A?\d+.*$/, '')] || null;
  const obligationsOf = (it) => (it && it.obligations ? String(it.obligations).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 7) : []);
  // Regulatory frameworks list = COMPLIANCE-bucket findings only (ai_visibility/seo belong in their
  // own panes; grouping them here produced bogus "GEO"/"SEO" frameworks). (C/S-020)
  // ALLOWLIST (not denylist): only genuinely-regulatory buckets become "frameworks". A denylist let
  // accessibility/tls_dns/tech pointers through, whose framework_short is an axe-rule description (e.g.
  // "<frame> or <iframe> elements do not have a title"), which rendered as a bogus framework AND, unescaped,
  // its literal <iframe> corrupted the DOM and swallowed every pillar after Regulatory. (C/S-021)
  const compForFw = pointers.filter((p) => (p.bucket === 'compliance' || p.bucket === 'public_records')
    && !NON_LEGAL_FW.has(String(p.framework_short || p.citation || '').toUpperCase()));
  const byFw = {};
  // Canonicalise overlapping codes (DMCC↗CMA, Food Info↗FSA) so their findings merge into one framework row.
  for (const p of compForFw) { const fw = actKey(p.framework_short || p.citation || 'OTHER'); (byFw[fw] = byFw[fw] || []).push(p); }
  const frameworks = Object.entries(byFw).map(([fw, ps]) => {
    // Fine from the merged group's own pointers (perFw is keyed by raw code; a collapsed group must read max of both).
    const maxFine = noStatutoryFine(fw) ? 0 : Math.max(perFw[fw] || 0, ...ps.map((p) => noStatutoryFine(p.framework_short || p.citation || '') ? 0 : (+p.fine_high_gbp || 0)));
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
      const items = aps.map((p) => {
        // Element-checklist findings carry a present/missing breakdown — render that as the (analysis) line, which is
        // more specific and evidence-grounded than the generic nearest-miss. Otherwise keep the verbatim quote, then
        // the nearest-miss absence line.
        const _elLine = elementLine(p);
        return {
          subject: subjectOf(p, 84) || 'Required disclosure',
          quote: _elLine ? '' : _q25(String(p.evidence_quote || '').trim().replace(/\s{2,}/g, ' ')),   // NO TRUNCATION: the firm's own words in full
          // the engine's REAL nearest-miss line (what IS on the page that should carry the disclosure vs the specific
          // missing element) — rendered as our ANALYSIS, not a verbatim site quote, and only when there's no quote.
          absence: _elLine || (String(p.evidence_quote || '').trim() ? '' : absenceLine(p.absence_evidence)),
          fix: craftFix(p), sev: p.severity,
        };
      }).filter((it, i, a2) => a2.findIndex((x) => x.subject.toLowerCase() === it.subject.toLowerCase()) === i).slice(0, 12);
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
    const _reg = FW_REGULATOR[fw] || FW_REGULATOR[top.framework_short] || FW_REGULATOR[String(fw).replace(/_A?\d+.*$/, '')] || _regP || null;   // E08: null, never a fabricated authority
    // citation_url + section_ref so the actual law is CITED (a clickable source), per the engine payload.
    const _cite = top.citation_url || top.citation || '';
    const _intel = intelOf(fw, top.framework_short);
    return {
      code: fwCode(fw), name: fwName(fw), regulator: _reg, binding: (_BINDING_MAP[String(fw).toUpperCase()] || null), binding_label: bindingLabel(fw),
      citation_url: /^https?:\/\//.test(_cite) ? _cite : '',
      jur: ({ UK: 'UK', EU: 'EU', US: 'US', AE: 'UAE', SA: 'KSA', QA: 'Qatar', SG: 'Singapore', IN: 'India', FR: 'France', DE: 'Germany', GLOBAL: 'Global' }[FW_JUR(fw)] || FW_JUR(fw) || 'Global'),
      findings, c, h, s, exp: maxFine ? gbp(maxFine, curSym) : 'ranking', expN: maxFine / 1e6,
      // E-233: verified curated enforcement (real penalty, real source) leads; then live news_map; then a ported
      // example. NO PROSE FALLBACK — an unsourced "the regulator actively enforces this" is an invented claim and
      // is exactly what made the section read as filler. Empty is honest; the obligations still carry the card.
      action: (_intel && _intel.enforcement) || g(news, fw, '') || PORTED_NEWS[fw] || PORTED_NEWS[top.framework_short] || top.enforcement_example || '',
      enforcement_url: (_intel && _intel.enforcement_url) || '',
      obligations: obligationsOf(_intel), reg_focus: (_intel && _intel.focus) || '', guidance: (_intel && _intel.guidance) || '',
      why: top.layman_explanation || top.fact || ('A confirmed gap against ' + fwName(fw) + ' on your live site, the regulator can act on it as it stands today.'),
      provisions, articleGroups,
    };
  }).sort((a, b) => (b.c - a.c) || (b.expN - a.expN)).slice(0, 12);
  // E-251 — NO HOLLOW CARDS. A screened framework whose card carries NEITHER obligations NOR a cited enforcement
  // action is an empty box with a regulator's name on it. It is exactly the "this section provides no value"
  // complaint: the reader opens it and finds nothing. kingsleynapley shipped three (FRC, HMRC, ICAEW) — which were
  // also a sector leak, fixed at source in E-250, but the render must be defensive regardless: we do not know every
  // framework we will ever attach, and any one of them can lack curated intel.
  // A card must EARN its place: it renders only if it can say something true and useful. A BREACHED framework
  // always earns it (the breach itself is the content). A SCREENED one must bring obligations or a real enforcement
  // action. Silence is better than a hollow box.
  const _hollow = (f) => f.screened && !(f.obligations || []).length && !String(f.action || '').trim();

  // (The empty-state SCAN fallback used to sit here, but it asserted "no statutory breach evidenced" even when binding
  // laws were about to be injected below — contradictory. It now runs AFTER the screened injection, so it only appears
  // when genuinely nothing binds/was readable.)
  // FLOOR: a readable site shows >=5 regulatory brackets (founder standing rule). We top up HONESTLY, never with a
  // fabricated breach/fine and never with a law outside the firm's jurisdiction: (1) the firm's own BINDING
  // frameworks that screened clean this scan, then (2) the baseline laws that apply to ANY commercial site in the
  // firm's jurisdiction (data protection, e-privacy/cookies, accessibility, consumer/e-commerce, company
  // disclosure). Each renders as "screened, controls to confirm" with the real regulator. (>=5 per pillar)
  // The regulatory section must ALWAYS show the firm's own sector regulator (SRA for a law firm, FCA for finance,
  // DHA/GDC for a clinic), breached or screened. The old logic capped the section at 5 and only injected screened
  // frameworks when <5 already showed — so when 5 GENERIC frameworks (DPA/CMA/ASA/Equality/Companies) breached, the
  // sector regulator was crowded out entirely (root cause of "SRA missing for law firms"). Fix: always inject, raise
  // the cap, and push SECTOR-SPECIFIC applicable frameworks FIRST so they can never be displaced by generic rows.
  // Cap scales with the number of jurisdictions the firm operates in, so a multi-jurisdiction firm gets enough slots to
  // show EVERY country's laws (founder requirement) instead of the first country's filling all 10. Single-jurisdiction
  // stays at 10. (multi-jur-cap)
  const _jurCount = [...allow].filter((j) => j !== 'GLOBAL').length || 1;
  // E-247 — A LAW THAT BINDS THE FIRM CAN NEVER BE CROWDED OUT BY A DISPLAY CAP.
  // The engine's `binding` map IS the audit's own assertion of which laws bind this firm. On russell-cooke it held
  // 14 frameworks INCLUDING UK_PECR and UK_ICO_COOKIES. But the framework list was built ONLY from findings, and the
  // screened-injection that back-fills the clean-but-binding laws opened with `if (frameworks.length >= REG_CAP)`.
  // With 10 breached frameworks and REG_CAP = 10, that guard fired on its FIRST line and every clean binding law was
  // dropped: the cookie law and the e-privacy law simply vanished, and the page then told the reader
  // "10 frameworks bind you" when its own payload said 14. Under-reporting the law is as much a defect as
  // over-reporting it, and it hid exactly the laws (cookies, privacy, data protection) that bind EVERY website.
  // The cap now governs only DISCRETIONARY extras. Everything in `binding` is mandatory and renders unconditionally.
  const _bound = new Set(Object.keys(g(payload, 'binding', {}) || {}).map((c) => fwCanon(c)));
  const _isBound = (fw) => _bound.has(fwCanon(fw));
  const REG_CAP = Math.max(_bound.size, Math.min(20, 10 + 4 * Math.max(0, _jurCount - 1)));
  const BASELINE = {
    UK: ['UK_GDPR_A13', 'UK_PECR', 'UK_EQUALITY_2010', 'UK_CRA_2015', 'UK_COMPANIES_ACT'],
    EU: ['EU_GDPR', 'EU_EPRIVACY', 'EU_EAA_2025', 'EU_DSA'],
    US: ['US_CCPA', 'US_ADA', 'US_FTC'],
    AE: ['AE_PDPL', 'DIFC_DPL', 'ADGM_DPR', 'UAE_CONSUMER', 'UAE_ECOMMERCE'],
    SA: ['SAUDI_PDPL'], QA: ['QATAR_PDPPL'], FR: ['FR_CNIL'], DE: ['DE_BDSG'],
  };
  if (siteScanned) {
    const _shownFw = new Set(frameworks.map((f) => f.name));
    const _jurName = (fw) => ({ UK: 'UK', EU: 'EU', US: 'US', AE: 'UAE', SA: 'KSA', QA: 'Qatar', SG: 'Singapore', IN: 'India', FR: 'France', DE: 'Germany', GLOBAL: 'Global' }[FW_JUR(fw)] || 'Global');
    const _baselineSet = new Set(Object.values(BASELINE).flat().map(fwCanon));
    const _pushScreened = (fw) => {
      // E-247: the cap governs DISCRETIONARY rows only. A law the engine says BINDS this firm always renders.
      if (frameworks.length >= REG_CAP && !_isBound(fw)) return;
      if (noStatutoryFine(fw) || sectorInapplicable(fw, payload)) return;
      const j = FW_JUR(fw); if (!(j === 'GLOBAL' || allow.has(j))) return;
      const nm = fwName(fw);
      const _it = intelOf(fw, fw);
      // Same display name already shown (alias codes like UK_CONSUMER_DUTY vs UK_FCA_CONSUMER_DUTY collapse to one
      // card): if THIS code carries curated intel and the shown row lacks it, upgrade that row in place rather than
      // dropping the intel. Otherwise skip the duplicate.
      if (_shownFw.has(nm)) {
        if (_it && (_it.obligations || _it.enforcement)) {
          const _ex = frameworks.find((f) => f.name === nm);
          if (_ex && !(_ex.obligations || []).length) {
            _ex.obligations = obligationsOf(_it); _ex.reg_focus = (_it.focus) || ''; _ex.guidance = (_it.guidance) || '';
            if (_it.enforcement) { _ex.action = _it.enforcement; _ex.enforcement_url = (_it.enforcement_url) || ''; }
          }
        }
        return;
      }
      _shownFw.add(nm);
      const _focus = (_it && _it.focus) || '';
      frameworks.push({
        code: fwCode(fw), name: nm, regulator: fwRegulator(fw), jur: _jurName(fw),
        findings: 0, c: 0, h: 0, s: 0, exp: 'applies to you', expN: 0, screened: true, assessed_label: 'APPLIES · ASSESSED', inspected_pages: ((payload.inspected_by_framework || {})[fw] || (payload.inspected_by_framework || {})[fwCanon(fw)] || payload.pages_crawled || []).slice(0, 6), binding: (_BINDING_MAP[String(fw).toUpperCase()] || null), binding_label: bindingLabel(fw),
        // E-233: NO INVENTED ENFORCEMENT. The old fallback asserted "<regulator> actively enforces this regime"
        // for any framework we had no intel on — an unsourced claim that read as filler and gave the section its
        // "no value" feel. Enforcement now renders ONLY when a real, curated, cited action exists; otherwise the
        // field is empty and the card leads with the regulator's obligations, which are always true.
        action: (_it && _it.enforcement) || g(news, fw, '') || PORTED_NEWS[fw] || '',
        enforcement_url: (_it && _it.enforcement_url) || '',
        obligations: obligationsOf(_it), reg_focus: _focus, guidance: (_it && _it.guidance) || '',
        // Per founder: present a non-breached law as one that BINDS the firm, with its obligations — never as "we
        // scanned your site and found no breach". Lead with the curated regulator-focus line when we have it.
        why: _focus
          ? (_focus + ' This framework legally binds you, and the obligations below are the controls you must be able to demonstrate.')
          : ('This framework legally binds you in your jurisdiction. The obligations below are the controls '
              + (fwRegulator(fw) ? fwRegulator(fw) + ' expects' : 'its regulator expects')
              + ' you to be able to demonstrate, and the gap most firms in your sector carry here.'),   // E08: reads correctly when the authority is unknown
      });
    };
    // 1) the firm's SECTOR-SPECIFIC applicable frameworks first (never crowded out), 2) the rest of applicable,
    // 3) jurisdiction baseline laws — each up to REG_CAP.
    const _applic = arr(payload.applicable_frameworks).map(fwCanon).filter((fw, i, a) => a.indexOf(fw) === i);
    // HOME-jurisdiction first: a US firm's US laws must inject before its secondary UK/EU laws, or the cap fills with
    // the alphabetically-first jurisdiction (EU/UK) and the home country's own laws never render. Order: home-sector,
    // home-baseline, then other jurisdictions (sector before baseline). (home-jur-first)
    const _CC = { USA: 'US', UAE: 'AE', KSA: 'SA', GBR: 'UK', GB: 'UK', UK: 'UK', US: 'US' };
    const _home = _CC[String(payload.country || '').toUpperCase()] || String(payload.country || '').toUpperCase() || 'UK';
    const _rank = (fw) => (FW_JUR(fw) === _home ? 0 : 2) + (_baselineSet.has(fw) ? 1 : 0);
    [..._applic].sort((a, b) => _rank(a) - _rank(b)).forEach(_pushScreened);
    for (const j of ['UK', 'EU', 'US', 'AE', 'SA', 'QA', 'FR', 'DE']) { if (!allow.has(j)) continue; for (const fw of BASELINE[j]) _pushScreened(fwCanon(fw)); }
    // E-247: FINALLY, and unconditionally, EVERY law in the engine's own binding map. `applicable_frameworks` and the
    // hardcoded BASELINE table are both incomplete views; `binding` is the engine's actual verdict on what governs
    // this firm, and it is what the sidebar counts. Anything in it that has not yet rendered renders now, screened.
    // Without this the audit under-reports the law and contradicts its own payload.
    [..._bound].sort((a, b) => _rank(a) - _rank(b)).forEach(_pushScreened);
  }

  // Collapse near-duplicate framework rows (a few overlapping catalogue codes render almost identically — e.g. two
  // "FCA Consumer Duty" rows, "UAE Health Ad Permit" vs "...Permit Regime"). Keep the more-breached row; one per
  // name-stem (18-char normalised prefix is distinct enough that genuinely different frameworks are not merged).
  {
    const _stem = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18);
    const _best = new Map();
    for (const f of frameworks) { const k = _stem(f.name); const e = _best.get(k); if (!e || (f.findings || 0) > (e.findings || 0)) _best.set(k, f); }
    // Graft curated intel onto the surviving row from any same-stem sibling it is about to absorb (alias codes like
    // UK_CONSUMER_DUTY vs UK_FCA_CONSUMER_DUTY: keep the more-breached row but never lose its sibling's obligations).
    for (const f of frameworks) {
      const e = _best.get(_stem(f.name)); if (!e || e === f) continue;
      if (!(e.obligations || []).length && (f.obligations || []).length) { e.obligations = f.obligations; e.reg_focus = f.reg_focus; e.guidance = f.guidance; }
      if (!e.action || /actively enforces this regime/.test(e.action)) { if (f.action && !/actively enforces this regime/.test(f.action)) { e.action = f.action; e.enforcement_url = f.enforcement_url || e.enforcement_url; } }
    }
    const _seen = new Set(); const _out = [];
    for (const f of frameworks) { const k = _stem(f.name); if (_seen.has(k)) continue; _seen.add(k); _out.push(_best.get(k)); }
    frameworks.length = 0; frameworks.push(..._out);
  }
  // E-251: drop hollow cards LAST, after every intel-grafting pass has had its chance to fill them.
  { const _kept = frameworks.filter((f) => !_hollow(f)); frameworks.length = 0; frameworks.push(..._kept); }

  // Empty-state fallback — ONLY when nothing binds/was readable after breached + screened injection (rare: an
  // unreadable site). Reframed per founder: no "no statutory breach evidenced" language.
  if (!frameworks.length) {
    const _read = g(payload, 'scan.reachable', true) !== false;
    frameworks.push(_read
      ? { code: 'SCAN', name: 'Full catalogue screened', regulator: 'All applicable regulators', findings: 0, c: 0, h: 0, s: 0, exp: 'applies to you', expN: 0, action: 'The full regulatory catalogue was screened against your jurisdiction. Your material gaps this scan sit in the technical, AI-visibility and authority signals in the pillars below.', why: 'Your priority is the ranking, AI-visibility and trust work in the other pillars.' }
      : { code: 'SCAN', name: 'Full catalogue screened', regulator: 'All applicable regulators', findings: 0, c: 0, h: 0, s: 0, exp: 'applies to you', expN: 0, action: 'Your live site blocked a deep read this scan (bot-challenge or JS-only render), so only what could be proven is shown. A re-scan completes it.', why: 'A re-scan with archive and rendered-DOM fallback completes the assessment.' });
  }

  // Headline (computed now that `frameworks` is final). "legally bind you" = every framework shown that genuinely
  // binds the firm (breached + the laws that bind with no breach), excluding the SCAN placeholder — never just the
  // breached count. No em-dashes, and no "we scanned and found no breach" framing. (founder copy fixes 2026-06-29)
  {
    const _boundN = frameworks.filter((f) => f.code !== 'SCAN').length;
    const _b = (n) => `${n} framework${n !== 1 ? 's' : ''} legally bind${n === 1 ? 's' : ''} you`;
    regulatoryHeadline = _boundN === 0
      ? 'The full regulatory catalogue was screened against your jurisdiction. Your material gaps this scan sit in the ranking, authority and AI-visibility signals in the pillars below.'
      : (compCriticals > 0
        ? `The full regulatory catalogue was screened against your jurisdiction. ${breachedFwCount} ${breachedFwCount === 1 ? 'obligation is' : 'obligations are'} verified as breached on ${_scanLabel}${_viaArchive ? ' (re-scan confirms live state)' : ' right now'}. ${(_boundN - breachedFwCount) > 0 ? (_boundN - breachedFwCount) + ' further ' + ((_boundN - breachedFwCount) === 1 ? 'framework binds' : 'frameworks bind') + ' you and were assessed at page level.' : ''}`
        : (compHighs > 0
          ? `The full regulatory catalogue was screened against your jurisdiction. ${_b(_boundN)}, with ${compHighs} high-severity compliance ${compHighs === 1 ? 'gap' : 'gaps'} to close. Your ranking and AI-visibility gaps in the pillars below are where buyers are being lost today.`
          : `Your live pages passed the checks a regulator's first sweep would run. What binds you, what was inspected, and what a full engagement verifies beyond the page is set out below.`));
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
    .map((a) => { const [title, lane, fix] = lhInfo(a.id); return { id: a.id, title, lane: LH_LANE[lane] || 'Performance', laneKey: lane, disp: a.displayValue || '', nodes: a.node_count || 0, sel: String(a.node_selector || '').replace(/\s+/g, ' ').trim(), fix, wcag: lane === 'a11y' ? (wcagFor(a.id) || 'WCAG 2.1 AA · ADA Title III') : null, _w: lhImpact(a) }; })
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
    if (blocked.length) { branch = 'crawler-block'; reason = `You block the ${blocked.length} named AI crawlers (${blocked.map(nameOf).filter(Boolean).join(', ')}) that feed ChatGPT, Claude, Perplexity and Google AI. They literally cannot read you, so even with schema present, your share of voice is 0 while AI ${namesRival} every run.`; }
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
    // E-218 (S-099): the page carries the SCAN date, not the render date — a months-old audit must never
    // present itself as generated today.
    date: fmtDate(ctx.generated_at ? new Date(ctx.generated_at) : now), catalogue: 'v' + (payload.framework_version || '7'), snapshot,
  };

  // THE THREE NUMBERS (E31-E35). catalogueSize is READ, never invented: the engine currently emits no catalogue
  // count at all (no catalogue_size / rules_total key on any payload), so it stays null and the rail prints the
  // honest fallback label. The moment the generator emits it, the true number appears everywhere automatically.
  // THE 400+ CLAIM. The register holds 671 ACTIVE RULES across 294 FRAMEWORKS. Those are different units and the
  // report must never confuse them: "400+ frameworks" would be a FALSE CLAIM on a document that fines other firms
  // for false claims (CAP 3.7 binds us too). We screen RULES; FRAMEWORKS bind. The engine now emits both, measured
  // from the live register (catalogue_rules / catalogue_frameworks), and neither is ever invented here.
  const catalogueRules = (+payload.catalogue_rules || +g(payload, 'scan.catalogue_rules', 0)) || null;
  const catalogueFrameworks = (+payload.catalogue_frameworks || +g(payload, 'scan.catalogue_frameworks', 0)) || null;
  const catalogueSize = catalogueRules;   // "size" has always meant the screened register; that register is RULES
  const screenedLabel = catalogueRules
    ? (catalogueRules.toLocaleString('en-GB') + ' compliance rules screened')
    : 'Full catalogue screened';
  // rulesChecked = the page-level RULE checks executed on the laws that attach to this firm's jurisdictions.
  const ruleChecks = arr(payload.rules).filter((r) => { const j = FW_JUR(r && (r.framework_short || r.framework || r.citation)); return j === 'GLOBAL' || allow.has(j); }).length
    || arr(payload.applicable_frameworks).length || frameworks.length;

  const D = {
    meta, score, grade, scoreBand: bandOf(score),
    // Freemium unlock flag (set by [[path]].js from the audit_pages.unlocked column, flipped true by the
    // Stripe webhook on a successful Route 3 payment). When true the render shows every Tamazia-fix in full
    // for everyone who opens the link; when false each fix is locked behind the green-gradient veil. (founder)
    unlocked: !!ctx.unlocked,
    // FOUNDER-BLOCKED links + contact, threaded from env by [[path]].js. The client renders each element ONLY
    // when its value is a non-empty string (no placeholder when unset). Pure pass-through; never affects scoring.
    links: {
      booking: bookingHref(ctx, ''),
      cta_findings: { text: 'Walk through these findings in 20 minutes. The exact fixes, and what a regulator would ask first: book the review.', href: bookingHref(ctx, 'findings') },
      cta_assessed: { text: 'Everything marked APPLIES · ASSESSED is verified at page level. Records, processes and filings are the full engagement: book the scoping call.', href: bookingHref(ctx, 'scoping') },
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
    cur: curSym, // PRIMARY binding currency, set by the REGIME that fines you (not your home country). Charts read this.
    exposureByCurrency, exposureBasis,   // every other binding regime, each in its own statutory currency. No FX.
    exposure: exposureAggregate, exposureFull: +(exposureN / 1e6).toFixed(1), exposureWaterfall,
    // When no fineable framework is confirmed, "£0 / across 0 binding frameworks" reads as broken next to
    // the (ranking-only) frameworks shown. Present the exposure tile honestly instead. (£0-leak / consistency)
    exposureHeadline: exposureN > 0 ? exposureAggregate : 'Ranking & AI',
    // E-14: count-aware. One verified breach is "the breach", not "the breaches".
    exposureNote: exposureN > 0
      ? `Median enforcement exposure across the ${counts.total} ${counts.total === 1 ? 'breach' : 'breaches'} evidenced on your live site. ${exposureBasis}`
      : 'No statutory fine confirmed, the exposure here is lost rankings, buyers and AI visibility',
    // E-244: the ceiling is kept, but as secondary context under the median, never as the headline.
    exposureCeiling: ceilingN > 0 ? gbp(ceilingN, curSym) : null,
    // E-253d (v23.1) — SHOW THE ADJUDICATION. This is the strongest credibility line in the whole report.
    // Until v23.0 every breach we sent was a regex match no model had ever read. Now each one is ruled on against
    // the actual text of the statute, and the false positives are removed BEFORE the client sees them. A managing
    // partner does not care that we ran a scan; they care that someone checked it. Say so, precisely, or not at all.
    adjudication: (() => {
      const a = g(payload, 'adjudication', null);
      if (!a || a.ran !== true || !(a.total > 0)) return null;   // never claim a review that did not happen
      return {
        reviewed: Number(a.total) || 0,
        upheld: Number(a.breach) || 0,
        dropped: Number(a.dropped) || 0,          // false positives removed before you saw them
        needs_review: Number(a.insufficient) || 0,
        line: 'Every finding on this page was re-examined against the text of the statute it cites, and '
          + ((Number(a.dropped) || 0) > 0
            ? ((Number(a.dropped) || 0) + ' candidate ' + ((Number(a.dropped) || 0) === 1 ? 'finding was' : 'findings were') + ' discarded as unproven before this report reached you.')
            : 'each one was upheld on the evidence quoted.'),
      };
    })(),
    counts, countsRegulatory,   // E05/E29: two tallies, each carrying its own explicit scope
    confirmed: pointers.length,
    // Honest regulatory headline + flag for the 0-critical-but-low-grade case (Al Tamimi / Emaar): the
    // consumer should use these instead of asserting "N breached / PASS". (zero-critical-honest)
    regulatoryHeadline, regulatoryCriticalsZero,
    // #48: pass compliance-unassessed through so the render never implies a clean bill when the scan could not read the site.
    compliance_unassessed: !!g(payload, 'compliance_unassessed', false),
    render_mode: g(payload, 'render_mode', null),
    // E-218: verifier verdict + row lifecycle drive the truth-filtered presentation. point_in_time renders the
    // banner on unverified rows; superseded marks a row replaced by a newer mint (old links keep working).
    verified: ctx.verified === true,
    superseded: String(ctx.row_status || 'live') === 'superseded',
    point_in_time: ctx.generated_at ? fmtDate(new Date(ctx.generated_at)) : '',
    sanitised: g(payload, '_sanitised', null),
    // E-213 REGISTERED REALITY: government-register rows minted by the engine (Companies House / CQC / FCA live
    // API checks + ICO/SRA/DHA/RERA link-outs). Every row links to the official source; renders on any payload
    // that carries it, independent of crawl success.
    registers: g(payload, 'registers', null),
    sub_sector: g(payload, 'sub_sector', null),
    // THE THREE-NUMBER DOCTRINE (E31-E35). Three DISTINCT numbers, printed once each, never conflated:
    //   catalogueSize     the FULL register the engine screens against. It is NOT guessed: it is read from the
    //                     payload if (and only if) the engine emits it. When it does not, `catalogueSize` is null
    //                     and the render prints the safe screened-label ("Full catalogue screened") instead of a
    //                     number we cannot prove.
    //   frameworksBinding what attaches to THIS firm (frameworks.length — the rows actually shown).
    //   rulesChecked      the page-level rule checks executed against the binding set (payload.rules, gated to
    //                     the firm's jurisdictions). This is a RULE count and must never be printed with the word
    //                     "frameworks" — that is what made the body say "all 18 frameworks" beside "400+".
    // Setting frameworksTotal = frameworks.length (the old line) rendered "15 FRAMEWORKS SCREENED · 15 BIND YOU",
    // erasing the screening story entirely.
    catalogueSize, screenedLabel, frameworksAssessed: frameworks.length, frameworksBinding: frameworks.length,
    rulesChecked: ruleChecks, frameworksTotal: catalogueSize,
    scoring: {
      formula: 'Weighted mean of the assessed dimensions, scaled 0 to 100. Regulatory compliance is weighted ×2, for a regulated firm a legal breach outranks a slow page.',
      bands: SCORING_BANDS,
      why: counts.critical > 0
        ? `Your ${score} is held down by the failing dimensions a regulator and an AI engine can both see on your live site today. Fix the ${counts.critical} critical ${counts.critical === 1 ? 'finding' : 'findings'} and the heaviest-weighted dimension lifts first, which is why ${wk12} by week 12 is realistic once those gaps close.`
        : `Your ${score} is held down by the ranking, authority and AI-visibility dimensions an AI engine and a buyer can both see today, not by a confirmed fine. Close the highest-weighted gaps below and the score lifts fast, which is why ${wk12} by week 12 is realistic once those gaps close.`,
      inputs: `${screenedLabel} · ${frameworks.length} ${frameworks.length === 1 ? 'framework binds' : 'frameworks bind'} you · ${ruleChecks} rule ${ruleChecks === 1 ? 'check' : 'checks'} executed · ${pointers.length} ${pointers.length === 1 ? 'finding' : 'findings'} confirmed against live evidence · ${g(payload, 'trust_summary.confirmed', 0)} evidence checks passed`,
    },
    exec: exec || execFallback(exposureN, Object.keys(perFw).length, counts.critical, curSym),
    jurisdiction,
    frameworks, exposureBars, heat,
    heatRows: [gbp(1e7, curSym) + '+', gbp(1e6, curSym) + '+', gbp(1e5, curSym) + '+', gbp(1e4, curSym) + '+', '<' + gbp(1e4, curSym)], heatCols: ['Rare', 'Low', 'Possible', 'High', 'Near-certain'],
    dims: dims.map((d) => ({ nm: d.nm, st: d.st, v: d.v, sub: d.sub, note: d.note || '' })),   // E-28 floor note
    seo, geo, competitors,
    trajectory: [{ x: 'Today', v: score, g: grade }, { x: 'Week 12', v: wk12, g: gradeOf(wk12) }, { x: 'Week 24', v: wk24, g: gradeOf(wk24) }],
    fixes: fixes.length ? fixes : [{ n: 1, reg: 'Re-scan', pillar: 'Regulatory', law: 'Limited assessment', exp: 'ranking impact', title: 'The live site could not be fully read this scan', plain: 'Few findings are shown because the site was not fully readable (bot-challenge, JS-only render or thin content). This is honest suppression, not a clean bill of health.', prec: '', quote: 'site not fully readable', fix: 'Tamazia re-runs the full rule catalogue with archive + rendered-DOM fallback to produce a complete assessment.', plan: 'Re-scan · Week 1 · every mandate' }],
    glossary: buildGlossary(payload, allow),
    // C-A: ONE commerce source. The render (audit-app.js) owns ALL displayed prices/copy from the single PRICES
    // block (mirrored from src/content/pricing.ts); the server-side Stripe/Cal mapping lives in _commerce.js.
    // The adapter therefore injects ONLY the per-firm tier recommendation flags the render consumes
    // (D.pricing[].rec / .popular, keyed by .tier) + the two notes. The old injected `addons`/`addonsMore`
    // catalogues were NEVER read by the render (it builds ADDONS from PRICES.independent) — removed as dead.
    pricing: COMMERCE.pricing, pricingNotes: COMMERCE.pricingNotes, upsellProof: COMMERCE.upsellProof,
    // E12 · the three severity words, defined inline on first use and carried as the dot hover tips.
    severityDefs: SEV_DEFS.map(([word, def]) => ({ word, def })),
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
  // R2 class-fix: decode HTML entities across ALL user-facing strings in D so raw "&amp;"/"&#x27;"/"&#8211;" from
  // crawled evidence quotes or double-encoded labels never reach the report. Safe (client renders via textContent).
  (function decodeDeep(o) {
    if (o == null) return;
    if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) { if (typeof o[i] === 'string') o[i] = decodeEnt(o[i]); else decodeDeep(o[i]); } return; }
    if (typeof o === 'object') { for (const k of Object.keys(o)) { if (typeof o[k] === 'string') o[k] = decodeEnt(o[k]); else decodeDeep(o[k]); } }
  })(D);
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
    .map((a) => { const [title, lane, fixFb] = lhInfo(a.id); const _dd = (s) => String(s || '').replace(/\s*[—–]\s*/g, ', ').trim(); return { id: a.id, title: _dd(title), lane: LH_LANE[lane] || 'Performance', laneKey: lane, disp: a.displayValue || '', nodes: a.node_count || 0, sel: String(a.node_selector || '').replace(/\s+/g, ' ').trim(), fix: _dd(a.fix || fixFb || ''), wcag: lane === 'a11y' ? (wcagFor(a.id) || 'WCAG 2.1 AA · ADA Title III') : null, _w: lhImpact(a) }; })
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
// E-10 / E-55. Two defects live in the glossary the ENGINE ships on the payload, so they are fixed render-side:
//   E-10  the only place on the page that printed "GBP 17.5M" instead of "£17.5M".
//   E-55  two entries for one law — "gdpr" ("The data-protection law for the UK and EU…") AND "uk gdpr"
//         ("The UK version of the EU data-protection law…"). One law, one entry, keyed to the firm's own regime,
//         with the bare term kept as an alias so the reader who scans for "GDPR" still finds it.
function normaliseGlossary(out, allowSet) {
  const fixed = {};
  const money = (v) => String(v || '')
    .replace(/\bGBP\s?(?=[\d£])/g, '£').replace(/\bUSD\s?(?=[\d$])/g, '$').replace(/\bEUR\s?(?=[\d€])/g, '€');
  for (const [k, v] of Object.entries(out)) fixed[k] = money(v);
  const keys = Object.keys(fixed);
  const kOf = (want) => keys.find((k) => String(k).toLowerCase().trim() === want);
  const gk = kOf('gdpr'), uk = kOf('uk gdpr'), eu = kOf('eu gdpr');
  if (gk && (uk || eu)) {                       // a jurisdictional entry exists: the bare duplicate is dropped
    const keep = uk || eu; const def = fixed[keep]; const label = uk ? 'UK GDPR' : 'EU GDPR';
    delete fixed[gk]; delete fixed[keep];
    fixed[label] = def + ' Also referred to on this page simply as “GDPR”.';
  } else if (gk && !uk && !eu) {                 // only the bare term: name it for the regime that binds this firm
    const label = allowSet.has('UK') ? 'UK GDPR' : allowSet.has('EU') ? 'EU GDPR' : 'GDPR';
    const def = fixed[gk]; delete fixed[gk];
    fixed[label] = def + (label === 'GDPR' ? '' : ' Also referred to on this page simply as “GDPR”.');
  }
  return fixed;
}
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
    if (Object.keys(out).length) return normaliseGlossary(out, allowSet);
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
  // E-03: count-aware. "jurisdiction(s)" is a form field, not client-facing legal prose.
  const jw = parts.length > 1 ? 'the jurisdictions' : 'the jurisdiction';
  return `${company} is assessed under the law of ${where}, ${jw} its own website shows it serves. Frameworks from every other region are screened but do not attach here, so only the law that genuinely binds this firm is shown.`;
}
function execFallback(exp, nfw, crit, sym) {
  // £0 statutory exposure: never claim a fine. The value at stake is ranking, qualified buyers and AI-assistant
  // visibility, frame it as that, so the exec never contradicts a "no statutory fine confirmed" headline.
  if (!(+exp > 0)) return 'No statutory fine surfaced on the live site this scan, but you are losing rankings, qualified buyers and AI-assistant visibility to named competitors every day. That is the exposure that matters here, and it compounds while the gaps below stay open.';
  const lead = `Right now you are carrying ${gbp(exp, sym)} of avoidable statutory exposure across ${nfw} binding framework${nfw === 1 ? '' : 's'}.`;
  return crit > 0 ? `${lead} Close the ${crit} critical finding${crit === 1 ? '' : 's'} first, they are the ones a regulator can act on today.` : `${lead} The high-severity gaps below are the priority.`;
}
// E16 / E54 · THE defect that cost the most: every commercial link on both live reports was an empty
// string, and the renderer removes dead buttons, so the buyer at peak intent had nothing to press.
// The booking href now ALWAYS resolves. The env var wins when set; otherwise the public calendar is used,
// with the report slug and the intent carried as query params so the booked call arrives with context.
const CAL_BOOKING_BASE = 'https://cal.com/tamazia/strategy-call';
function bookingHref(ctx, intent) {
  const base = String((ctx && ctx.links && ctx.links.booking) || '').trim() || CAL_BOOKING_BASE;
  const slug = String((ctx && ctx.slug) || '').trim();
  const q = [];
  if (slug) q.push('report=' + encodeURIComponent(slug));
  if (intent) q.push('intent=' + encodeURIComponent(intent));
  if (!q.length) return base;
  return base + (base.indexOf('?') > -1 ? '&' : '?') + q.join('&');
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
  pricingNotes: '90-day rolling · no long-term contract · the work is owned outright once paid · every onboarding is legally reviewed before work begins.',
  upsellProof: 'Each add-on layers onto your core programme as it proves out. Start with the audit\'s top priority, then add the next lever once it is working.',
  // tier = the key the render matches on (audit-app.js byName); rec/popular = the only fields consumed.
  pricing: [
    { tier: 'Foundation', rec: false, popular: false },
    { tier: 'Authority', rec: false, popular: true },
    { tier: 'Enterprise', rec: true, popular: false },
  ],
};

// E-091 (blind-send): render-side twin of the engine evidence gate. A sub-25-char quote renders the
// absence sentence instead of a fragment that cannot be defended in front of the firm's own lawyer.
function _q25(q) { q = String(q || '').trim(); return q.length >= 25 ? q : ''; }
