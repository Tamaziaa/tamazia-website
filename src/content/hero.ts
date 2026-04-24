// Hero section content.
// Edit this file to change hero copy. Rebuild takes 30 seconds.
// Use {{...}} markers around words you want in italic oxblood emphasis.

export const heroContent = {
  dateline: [
    'LONDON',
    'DUBAI',
    'NEW YORK',
    'PARIS',
    'MEMBER, CHARTERED INSTITUTE OF ARBITRATORS',
    'MEMBER, AMERICAN BAR ASSOCIATION',
  ],

  navItems: ['Why Us', 'Sectors', 'Cases', 'Process', 'Pricing', 'FAQ', 'Contact'],
  navCta: 'Request a Briefing',
  navCtaUrl: 'https://calendly.com/tamazia',

  eyebrow: 'The Brief · 2026',

  subHeadline: "Your SEO agency doesn't have a {{lawyer}}. Ours is run by {{one}}.",

  pullQuote: 'Ranking is only valuable if it is {{legal}}.',

  h1: [
    { numeral: 'I.', text: 'Outrank {{competitors.}}', marginNote: 'Verified · 2024' },
    { numeral: 'II.', text: 'Master {{regulators.}}', marginNote: '200+ Frameworks' },
    { numeral: 'III.', text: '{{One}} agency.', marginNote: 'Four Continents' },
  ],

  authorFrame: {
    numeral: 'IV.',
    label: 'The Practice',
    title: 'Led by a founder. Run to a standard.',
    body: "An {{LLM in International Business Law}}, King's College London, at the head of a team of regulatory analysts, AI search engineers, and legal content strategists {{working to a standard regulated enterprises cannot source elsewhere}}.",
    credentials: [
      "KING'S COLLEGE LONDON",
      'CHARTERED INSTITUTE OF ARBITRATORS',
      'AMERICAN BAR ASSOCIATION',
    ],
  },

  cta: {
    label: 'Request your compliance and SEO audit',
    href: '#contact',
  },

  regulationFrameworks: [
    'SRA', 'Bar Standards', 'DIFC', 'GDPR', 'FCA COBS', 'EU AI Act',
    'MHRA', 'HIPAA', 'CQC', 'GMC', 'ADA', 'SEC Reg FD',
    'DFSA', 'NYSE', 'FINRA', 'PRA', 'ICO', 'CNIL',
    'BaFin', 'AMF', 'MAS', 'HKMA', 'SFC', 'SEBI',
    'RBI', 'IRDAI', 'DPDP', 'RERA', 'Trakheesi', 'CMA',
    'ASA UK', 'NAD US', 'CCPA', 'CAN-SPAM', 'CASL', 'POPIA',
    'LGPD', 'PDPA SG', 'DSA', 'DMA', 'NIS2', 'FDA',
    'FTC', 'CFTC', 'SFO',
  ],

  goldHighlightedFrameworks: ['EU AI Act', 'NYSE', 'AMF', 'RERA', 'CCPA', 'DSA'],

  ribbonLabel: 'Frameworks reviewed per campaign',

  tickerItems: [
    'KAMAT HOTELS GROUP · NSE-LISTED HOSPITALITY · DIRECT-BOOKING SHIFT · VERIFIED 2024',
    'CG ONCOLOGY · NYSE: CGON · +96% AT IPO · VERIFIED PER SEC FILINGS',
    'MERAAS · DUBAI HOLDING SUBSIDIARY · RERA COMPLIANT · 2024',
    '200+ LAWS REVIEWED PER CAMPAIGN',
    'FOUR CONTINENTS',
  ],

  signature: {
    vettedBy: 'Vetted by',
    name: 'Aman Pareek',
    caption: ['Founder', "LLM, King's College London"],
  },
};

// Helper: parse {{emph}} markers into HTML spans
export function parseEmph(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, '<span class="emph">$1</span>');
}
