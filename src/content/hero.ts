// Hero section content — verbatim live tamazia.co.uk (TAMAZIA-13 snapshot)
// Edit this file to change hero copy. Rebuild takes 30 seconds.
// Use {{...}} markers around words you want in italic gold emphasis.

export const heroContent = {
  // Top bar · institutional credentials (BD-5). Replaces "The Brief · 2026" filler.
  // Desktop: all shown in one line. Mobile: rotates every 5s.
  dateline: [
    'MEMBER, CHARTERED INSTITUTE OF ARBITRATORS',
    // 'AMERICAN BAR ASSOCIATION' line removed Phase 10 pending verification
    "LLM, KING'S COLLEGE LONDON",
  ],

  navItems: ['Why Us', 'Sectors', 'Cases', 'Process', 'Pricing', 'FAQ', 'Resources'],

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
    { label: 'Resources', href: '/resources/' },
  ],

  navCta: 'Book a Strategy Call',
  navCtaUrl: '/book/',

  // Subhead (above H1). Verbatim live site. Restored — was missing from prior rebuild.
  // F2 · founder credential trimmed — name + credential moved to founder pill
  subHeadline:
    "Compliance reviewed before publication, every engagement.",

  // Positioning line — restored verbatim.
  positioningLine: "Your SEO agency doesn’t have a {{lawyer}}. Ours is run by {{one}}.",

  // Pull quote (closing line above client ribbon). Verbatim.
  pullQuote: 'Ranking is only valuable if it is {{legal}}.',

  // H1 — three lines verbatim from live site. Numerals dropped (B-04).
  // Each line gets a subtext line — small italic gold typography.
  h1: [
    { text: 'Outrank {{competitors.}}',  subtext: 'Search dominance, every market.' },
    { text: 'Master {{regulators.}}',    subtext: '400+ frameworks reviewed, every word.' },
    { text: '{{One agency.}}',            subtext: 'Counsel-led, every campaign.' },
  ],

  // Compliance paragraph · regulator names wrapped as styled chips (B-18)
  complianceParagraph:
    'Every campaign executed through us passes through {{400+ laws}} before anything goes live: [[GDPR]], [[FCA]], [[SRA]], [[MHRA]], [[ASA]], [[HIPAA]], [[EU AI Act]], and international advertising law.',

  // Legacy eyebrow for current Hero.astro (Gate B will replace with top-bar credentials).
  eyebrow: 'TAMAZIA · The Practice',

  authorFrame: {
    numeral: 'IV.',
    label: 'The Practice',
    title: 'Led by a founder. Run to a standard.',
    body: "An {{LLM in International Business Law}}, King’s College London, at the head of a practice delivering compliance-engineered content, AI search placement, and regulatory reading across every jurisdiction.",
    credentials: [
      "KING'S COLLEGE LONDON · LLM INTERNATIONAL BUSINESS LAW",
      'CHARTERED INSTITUTE OF ARBITRATORS',
    // 'AMERICAN BAR ASSOCIATION' line removed Phase 10 pending verification
    ],
  },

  cta: {
    label: 'Run my free audit',
    href: '#contact',
  },

  // Regulation strip · Round-11 · 200 frameworks across UK / EU / US / GCC / Singapore / HK / Switzerland / Australia / Canada / Japan / Korea
  // Indian-jurisdiction laws explicitly excluded (Tamazia does not serve the Indian market — see TAMAZIA-22-PROJECT-HANDOFF §3).
  // Single source of truth for both the vertical right ribbon (Hero) and the horizontal LawsStrip (below QuickAudit).
  // S2 · curated 30 frameworks (Implementation Doc v1.0 Section 2)
  // Spans target sectors: legal (SRA, BSB, ABA, DIFC, ADGM), healthcare (MHRA, HIPAA, ASA, CQC),
  // hospitality (ASA, FIR, GDPR), real estate (RERA, Trakheesi, CPRs, Tenant Fees),
  // F&B (FIR, ASA), finance (FCA, SEC, Nasdaq, DFSA), universal (GDPR, EU AI Act, E-E-A-T).
  regulationFrameworks: [
    'GDPR', 'UK GDPR', 'DPA 2018', 'ePrivacy Regulation', 'PECR',
    'EU AI Act', 'CCPA', 'CPRA', 'SRA Standards 2019', 'SRA Transparency Rules',
    'BSB Handbook', 'ABA Model Rules 7.1-7.3', 'DIFC Arbitration Law', 'ADGM Regulations',
    'MHRA Human Medicines Regs', 'HIPAA Privacy Rule', 'ASA CAP Code', 'ASA Health Code',
    'CQC Standards', 'FCA COBS 4', 'FCA MAR', 'SEC Reg FD', 'Nasdaq Listed Manual',
    'RERA Law No. 7 of 2013', 'Trakheesi', 'DFSA Conduct of Business', 'CPRs 2008',
    'Tenant Fees Act 2019', 'Food Information Regulations 2014', 'Google E-E-A-T Guidelines',
  ],

  // 14 gold-italic highlighted picks · clients' daily-vocabulary names (most recognisable per Tamazia's primary buyer personas)
  // C.13: expanded from 12 → 14 per Aman directive 2026-04-30
  // S2 · 14 gold picks must match labels in the new regulationFrameworks list above
  goldHighlightedFrameworks: [
    'GDPR', 'UK GDPR', 'EU AI Act', 'SRA Standards 2019', 'ABA Model Rules 7.1-7.3',
    'MHRA Human Medicines Regs', 'HIPAA Privacy Rule', 'ASA CAP Code', 'FCA COBS 4',
    'SEC Reg FD', 'Nasdaq Listed Manual', 'RERA Law No. 7 of 2013', 'Trakheesi',
    'Google E-E-A-T Guidelines',
  ],

  ribbonLabel: 'Live regulatory register · 30 frameworks shown · selected from 400+ applied to client work',

  // Client ribbon — verbatim live site. Kamat stays here (live site confirms).
  // Case-study panel is Orchid (not Kamat) — handled separately in caseStudies.ts.
  clientRibbonPrefix: 'Trusted by',
  clientRibbonClients: [
    'KAMAT HOTELS (NSE)',
    'CG ONCOLOGY (Nasdaq: CGON)',
    'MERAAS (DUBAI HOLDING)',
  ],
  clientRibbonSuffix:
    'Engagements delivered across UK, UAE, USA, and EU.',

  // Legacy ticker — kept as below-fold strip for scrolling marquee.
  // Dates removed per filler-removal rule.
  tickerItems: [
    'KAMAT HOTELS GROUP · NSE-LISTED HOSPITALITY · DIRECT-BOOKING SHIFT',
    'CG ONCOLOGY · Nasdaq: CGON · +96% AT IPO · VERIFIED PER SEC FILINGS',
    'MERAAS · DUBAI HOLDING SUBSIDIARY · SHEIKH MOHAMMED DIRECTIVE',
    '400+ LAWS REVIEWED PER CAMPAIGN',
    'FOUR CONTINENTS · LONDON · DUBAI · NEW YORK · PARIS',
  ],

  // Signature · capital A per BD-4 fix (was lowercase "aman pareek").
  // Fonts: Great Vibes cursive, gold.
  signature: {
    vettedBy: 'Signed by',  /* A3 · was 'Vetted by' which read backwards */
    name: 'Aman Pareek',
    caption: ['Founder', "LLM, King’s College London"],
  },
};

// Helper: parse {{emph}} markers into emph spans + [[regulator]] markers into chip spans.
export function parseEmph(text: string): string {
  return text
    .replace(/\{\{([^}]+)\}\}/g, '<span class="emph">$1</span>')
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="reg-chip">$1</span>');
}
