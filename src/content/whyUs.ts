// Why Us / Proof section — verbatim live tamazia.co.uk (TAMAZIA-13 snapshot §2)
// CRITICAL FIX: stats restored from invented "4× / 200+ / 4" to live-site values.

export const whyUsContent = {
  eyebrow: 'WHY US',

  h2: "Any agency can rank you. {{Not every agency has read your sector's laws.}}",

  paragraphs: [
    'Compliance is the foundation. We know the rules your content has to play by, and we rank you within them. Not a footnote we add at the end.',
    'International business law, AI search engineering, and regulatory content engineering applied to every campaign.',
  ],

  pullQuote: 'The {{lawyer}} reads it before the {{algorithm}} sees it.',

  // Verbatim from live tamazia.co.uk. These are the canonical credibility numbers.
  // The "4× / 200+ / 4" in the prior rebuild was a credibility-damaging error.
  stats: [
    {
      value: '882%',
      caption: 'PEAK CLIENT REVENUE GROWTH · GA4 VERIFIED',
      icon: 'sparkline',
    },
    {
      value: '200+',
      caption: 'LAWS REVIEWED PER CAMPAIGN',
      icon: 'scale',
    },
    {
      value: '$110M+',
      caption: 'REVENUE ACROSS FOUR CONTINENTS',
      icon: 'compass',
    },
  ],

  credentialStripHeading: 'Credentials and Memberships',

  credentials: [
    "LLM · KING'S COLLEGE LONDON",
    'CHARTERED INSTITUTE OF ARBITRATORS',
    'AMERICAN BAR ASSOCIATION',
    'GOOGLE PARTNER',
    'META BUSINESS PARTNER',
  ],

  // Footer line after credentials, matches live site micro-framing (B-46 fix)
  microLine: 'TAMAZIA · Technology Partnership · TAMAZIA',

  // Zero-compliance-incident proof (B-38 fix · SWF allocator persona)
  proofStrip: 'Zero compliance incidents · Nasdaq IPO listing · Dubai Holding standard · Verified per SEC filings + GA4',

  cta: {
    label: 'Request SEO & Compliance Audit',
    href: '#contact',
  },

};
