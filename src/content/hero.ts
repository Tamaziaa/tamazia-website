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

  navItems: ['Why Us', 'Sectors', 'Cases', 'Process', 'Pricing', 'FAQ', 'Contact', 'Resources'],

  // G.1/G.2/G.5 · Full nav with absolute paths for new deep pages
  // NOTE: "About" removed from header — one-page site, About lives in footer only.
  // "Insights" renamed to "Resources" sitewide.
  headerNav: [
    { label: 'Why Us',    href: '/#why-us' },
    { label: 'Sectors',   href: '/#sectors' },
    { label: 'Cases',     href: '/#cases' },
    { label: 'Process',   href: '/#process' },
    { label: 'Pricing',   href: '/#pricing' },
    { label: 'FAQ',       href: '/#faq' },
    { label: 'Contact',   href: '/#contact' },
    { label: 'Resources', href: '/resources/' },
  ],

  navCta: 'Request a Briefing',
  navCtaUrl: '/#contact',

  // Subhead (above H1). Verbatim live site. Restored — was missing from prior rebuild.
  subHeadline:
    "Led by a founder with an {{LLM in International Business Law}}, King's College London. Compliance-engineered content, AI search placement, and regulatory reading across every jurisdiction.",

  // Positioning line — restored verbatim.
  positioningLine: "Your SEO agency doesn't have a {{lawyer}}. Ours is run by {{one}}.",

  // Pull quote (closing line above client ribbon). Verbatim.
  pullQuote: 'Ranking is only valuable if it is {{legal}}.',

  // H1 — three lines verbatim from live site. Numerals dropped (B-04).
  // Each line gets a subtext line — small italic gold typography.
  h1: [
    { text: 'Outrank {{competitors.}}',  subtext: 'Search dominance, every market.' },
    { text: 'Master {{regulators.}}',    subtext: '200+ frameworks reviewed, every word.' },
    { text: '{{One agency.}}',            subtext: 'Counsel-led, every campaign.' },
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
    body: "An {{LLM in International Business Law}}, King's College London, at the head of a practice delivering compliance-engineered content, AI search placement, and regulatory reading across every jurisdiction.",
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
    'GDPR', 'SRA Standards', 'HIPAA', 'ICC Rules', 'SEC Reg FD', 'RERA',
    'FCA COBS 4', 'ASA CAP', 'EU AI Act', 'UK GDPR', 'ABA Model Rules', 'Trakheesi',
    'NYSE Listed Manual', 'MHRA', 'DIFC Court Rules', 'PECR', 'DSA', 'CQC',
    'Nasdaq Rule 5000', 'CCPA', 'Schema.org Hotel', 'Bribery Act 2010', 'SIAC Rules', 'E-E-A-T',
    'SOX', 'DFSA', 'BSB Handbook', 'LCIA Rules', 'NIS2', 'UAE PDPL 2021',
    'MAR', 'Modern Slavery Act', 'ADGM', 'DTCM', 'Equality Act 2010', 'ASA Health Code',
    'FINRA 2210', 'Schema.org Restaurant', 'Defamation Act', 'Saudi PDPL 2022',
    'CPRA', 'Consumer Rights Act 2015', 'DMA', 'DORA', 'DPA 2018', 'CSRD',
    'e-Commerce Directive', 'Online Safety Act', 'FTC §5', 'ePrivacy',
  ],

  // 14 gold-italic highlighted picks · clients' daily-vocabulary names (most recognisable per Tamazia's primary buyer personas)
  // C.13: expanded from 12 → 14 per Aman directive 2026-04-30
  goldHighlightedFrameworks: [
    'GDPR', 'HIPAA', 'SRA Standards', 'ASA CAP', 'SEC Reg FD', 'FCA COBS 4',
    'EU AI Act', 'ICC Rules', 'RERA', 'E-E-A-T', 'NYSE Listed Manual', 'CCPA',
    'MHRA', 'ABA Model Rules',
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
