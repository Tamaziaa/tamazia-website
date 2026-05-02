// Hero section content — verbatim live tamazia.co.uk (TAMAZIA-13 snapshot)
// Edit this file to change hero copy. Rebuild takes 30 seconds.
// Use {{...}} markers around words you want in italic gold emphasis.

export const heroContent = {
  // Top bar · institutional credentials (BD-5). Replaces "The Brief · 2026" filler.
  // Desktop: all shown in one line. Mobile: rotates every 5s.
  dateline: [
    'MEMBER, CHARTERED INSTITUTE OF ARBITRATORS',
    'MEMBER, AMERICAN BAR ASSOCIATION',
    "LLM, KING'S COLLEGE LONDON",
  ],

  navItems: ['Why Us', 'Services', 'Cases', 'Process', 'Pricing', 'FAQ', 'Resources', 'Contact'],

  // G.1/G.2/G.5 · Full nav with absolute paths for new deep pages
  // NOTE: "About" removed from header — one-page site, About lives in footer only.
  // "Insights" renamed to "Resources" sitewide.
  headerNav: [
    { label: 'Why Us',    href: '/#why-us' },
    { label: 'Process',   href: '/#process' },
    { label: 'Pricing',   href: '/#pricing' },
    { label: 'FAQ',       href: '/#faq' },
    {
      label: 'Resources',
      href: '/resources/',
      children: [
        { label: 'Services',    href: '/services/' },
        { label: 'Cases',       href: '/case-studies/' },
        { label: 'Resources',   href: '/resources/' },
      ],
    },
    { label: 'Contact',   href: '/#contact' },
  ],

  navCta: 'Request a Briefing',
  navCtaUrl: '/#contact',

  // Subhead (above H1). Verbatim live site. Restored — was missing from prior rebuild.
  subHeadline:
    "Led by a founder with an {{LLM in International Business Law}}, King's College London. Compliance-engineered content, AI search placement, and regulatory reading across every jurisdiction. Working to a standard regulated enterprises cannot source elsewhere.",

  // Positioning line — restored verbatim.
  positioningLine: "Your SEO agency doesn't have a {{lawyer}}. Ours is run by {{one}}.",

  // Pull quote (closing line above client ribbon). Verbatim.
  pullQuote: 'Ranking is only valuable if it is {{legal}}.',

  // H1 — three lines verbatim from live site. Numerals dropped (B-04).
  // Each line gets a subtext line — small italic gold typography.
  h1: [
    { text: 'Outrank {{competitors.}}',  subtext: 'Search dominance, every market.' },
    { text: 'Master {{regulators.}}',    subtext: '200+ frameworks reviewed, every word.' },
    { text: '{{One agency.}}',            subtext: 'Lawyer-led. Compliance-engineered.' },
  ],

  // Compliance paragraph · regulator names wrapped as styled chips (B-18)
  complianceParagraph:
    'Every campaign executed through us passes through {{200+ laws}} before anything goes live: [[GDPR]], [[FCA]], [[SRA]], [[MHRA]], [[ASA]], [[HIPAA]], [[EU AI Act]], and international advertising law.',

  // Legacy eyebrow for current Hero.astro (Gate B will replace with top-bar credentials).
  eyebrow: 'TAMAZIA · The Practice',

  authorFrame: {
    numeral: 'IV.',
    label: 'The Practice',
    title: 'Led by a founder. Run to a standard.',
    body: "An {{LLM in International Business Law}}, King's College London, at the head of a practice delivering compliance-engineered content, AI search placement, and regulatory reading across every jurisdiction {{working to a standard regulated enterprises cannot source elsewhere}}.",
    credentials: [
      "KING'S COLLEGE LONDON · LLM INTERNATIONAL BUSINESS LAW",
      'CHARTERED INSTITUTE OF ARBITRATORS',
      'AMERICAN BAR ASSOCIATION',
    ],
  },

  cta: {
    label: 'Request your compliance and SEO audit',
    href: '#contact',
  },

  // Regulation strip · Round-11 · 200 frameworks across UK / EU / US / GCC / Singapore / HK / Switzerland / Australia / Canada / Japan / Korea
  // Indian-jurisdiction laws explicitly excluded (Tamazia does not serve the Indian market — see TAMAZIA-22-PROJECT-HANDOFF §3).
  // Single source of truth for both the vertical right ribbon (Hero) and the horizontal LawsStrip (below QuickAudit).
  regulationFrameworks: [
    'GDPR', 'UK GDPR', 'DPA 2018', 'PECR', 'ePrivacy', 'EHDS',
    'EU AI Act', 'AI Liability Dir.', 'DSA', 'DMA', 'Data Act', 'Cyber Resilience Act',
    'NIS2', 'DORA', 'CCPA', 'CPRA', 'VCDPA', 'CDPA',
    'CTDPA', 'UCPA', 'BIPA', 'COPPA', 'FERPA', 'GLBA',
    'HIPAA', 'HITECH', 'FTC HBNR', 'CAN-SPAM', 'TCPA', 'Lanham',
    'FTC §5', 'FTC Endorsement', 'NIST CSF', 'NIST AI RMF', 'NIST Privacy FW', 'FedRAMP',
    'CMMC', 'NYDFS Part 500', 'CTA 2021', 'FinCEN GTOs', 'OFAC', 'BSA',
    'PATRIOT Act', 'ADA Title III', '§504', '§508', 'ACAA', 'FCRA',
    'RESPA', 'TILA', 'FHA', 'JOBS Act', 'Securities Act 1933', 'Exchange Act 1934',
    'SOX', 'SEC Reg FD', 'Reg G', 'Reg S-K', 'NYSE Listed Manual', 'Nasdaq Rule 5000',
    'FINRA 2210', 'CFTC', 'IFRS', 'EO 14110', 'CA AB-2273', 'NY Local Law 144',
    'Colorado AI Act', 'TDPSA', 'Florida Digital Rights', 'NACHA Rules', 'SAMHSA 42 CFR Part 2', 'FDA 21 CFR 202',
    'FDA 21 CFR 801', 'DEA', 'Stark Law', 'Anti-Kickback', 'EMTALA', 'ACA §1557',
    'CMS rules', 'FDA Title 21', 'ABA Model Rules', 'NY Bar Rules', 'CA Bar Rules', 'TX Bar Rules',
    'FL Bar Rules', 'IL Bar Rules', 'FCA COBS', 'FCA MAR', 'FCA SYSC', 'Listing Rules UK',
    'DTRs', 'AIM Rules', 'PRA Rulebook', 'FSMA 2000', 'MAR (EU)', 'MiFID II',
    'MiFIR', 'Prospectus Reg', 'AIFMD', 'UCITS', 'EMIR', 'CSRD',
    'SFDR', 'ESMA GLs', 'IOSCO Principles', 'BCBS Standards', 'JMLSG GLs', 'MLR 2017',
    'MLR 2022', 'POCA 2002', 'OFSI Sanctions', 'Bribery Act 2010', 'Companies Act 2006', 'Modern Slavery Act',
    'Eq Act 2010', 'PSBAR 2018', 'EAA 2025', 'Web Accessibility Dir.', 'Online Safety Act', 'DMCC Act 2024',
    'ASA CAP', 'BCAP', 'UCPD', 'e-Commerce Dir.', 'Omnibus Dir.', 'CRD',
    'PTD', 'Geo-blocking', 'CRA 2015', 'EU Whistleblowing Dir.', 'EU Pay Transparency', 'SRA Standards',
    'SRA Transparency', 'BSB Handbook', 'CILEx Code', 'CCBE Code', 'GMC GMP', 'GDC Standards',
    'NMC Code', 'CQC', 'MHRA', 'EMA', 'MDR', 'IVDR',
    'CTR 536', 'NHS Constitution', 'HTA 2004', 'MCA 2005', 'GMP Annex 11', 'EU FMD',
    'ASA Health Code', 'ICC Rules', 'LCIA Rules', 'SIAC Rules', 'HKIAC Rules', 'ICDR Rules',
    'UNCITRAL Model Law', 'NY Convention 1958', 'ICSID Convention', 'DIFC Court Rules', 'ADGM Court Procedure', 'ADGM AML',
    'DIFC Data Protection', 'DIFC Insurance Module', 'DFSA', 'FSRA ADGM', 'SCA UAE', 'CMA Saudi',
    'SAMA Banking', 'SFDA', 'MOHAP UAE', 'DHA Standards', 'DOH-AD', 'RERA Dubai',
    'Trakheesi', 'DTCM', 'SCTA Saudi', 'REGA Saudi', 'MoPH Qatar', 'QFC DP',
    'Bahrain PDPL', 'UAE PDPL 2021', 'Saudi PDPL 2022', 'Saudi Publications Law', 'NESA UAE', 'NCA ECC',
    'UAE Fed. Law 20/2018', 'UAE Consumer Prot.', 'MAS SFA', 'MAS PSN AML/CFT', 'PDPA SG', 'CPFTA SG',
    'SGX MRules', 'EAA HK', 'SFO', 'HKEX MRules', 'PDPO HK', 'CSA SG Cyber Act',
    'APPI', 'PIPA Korea', 'Swiss FADP', 'AUSTRAC', 'ASIC RG 234', 'CASL',
    'Quebec Law 25', 'FATF Recommendations', 'ISO 27001', 'ISO 27701', 'ISO 42001', 'PCI DSS',
    'SOC 2', 'OECD AI Principles', 'LGPD', 'POPIA', 'PIPEDA', 'PIPL',
  ],

  // 14 gold-italic highlighted picks · clients' daily-vocabulary names (most recognisable per Tamazia's primary buyer personas)
  // C.13: expanded from 12 → 14 per Aman directive 2026-04-30
  goldHighlightedFrameworks: [
    'EU AI Act', 'GDPR', 'HIPAA', 'SEC Reg FD', 'SOX', 'MiFID II',
    'SRA Standards', 'ICC Rules', 'LCIA Rules', 'FDA Title 21', 'NYSE Listed Manual', 'CCPA',
    'FCA COBS', 'ASA CAP',
  ],

  ribbonLabel: '200+ regulatory frameworks reviewed per campaign',

  // Client ribbon — verbatim live site. Kamat stays here (live site confirms).
  // Case-study panel is Orchid (not Kamat) — handled separately in caseStudies.ts.
  clientRibbonPrefix: 'Trusted by',
  clientRibbonClients: [
    'KAMAT HOTELS (NSE)',
    'CG ONCOLOGY (Nasdaq: CGON)',
    'MERAAS (DUBAI HOLDING)',
  ],
  clientRibbonSuffix:
    'and regulated enterprises across London, Dubai, New York and four continents.',

  // Legacy ticker — kept as below-fold strip for scrolling marquee.
  // Dates removed per filler-removal rule.
  tickerItems: [
    'KAMAT HOTELS GROUP · NSE-LISTED HOSPITALITY · DIRECT-BOOKING SHIFT',
    'CG ONCOLOGY · Nasdaq: CGON · +96% AT IPO · VERIFIED PER SEC FILINGS',
    'MERAAS · DUBAI HOLDING SUBSIDIARY · SHEIKH MOHAMMED DIRECTIVE',
    '200+ LAWS REVIEWED PER CAMPAIGN',
    'FOUR CONTINENTS · LONDON · DUBAI · NEW YORK · PARIS',
  ],

  // Signature · capital A per BD-4 fix (was lowercase "aman pareek").
  // Fonts: Great Vibes cursive, gold.
  signature: {
    vettedBy: 'Vetted by',
    name: 'Aman Pareek',
    caption: ['Founder', "LLM, King's College London"],
  },
};

// Helper: parse {{emph}} markers into emph spans + [[regulator]] markers into chip spans.
export function parseEmph(text: string): string {
  return text
    .replace(/\{\{([^}]+)\}\}/g, '<span class="emph">$1</span>')
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="reg-chip">$1</span>');
}
