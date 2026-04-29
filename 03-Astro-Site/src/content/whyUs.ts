// Why Us / Proof section — verbatim live tamazia.in (TAMAZIA-13 snapshot §2)
// CRITICAL FIX: stats restored from invented "4× / 200+ / 4" to live-site values.

export const whyUsContent = {
  eyebrow: 'WHY US',

  h2: "Any agency can rank you. {{Not every agency has read your sector's laws.}}",

  paragraphs: [
    'Compliance is the foundation. We know the rules your content has to play by, and we rank you within them. Not a footnote we add at the end.',
    'International business law expertise at the core. Traditional SEO, AI search, and Generative Engine Optimisation for law firms, healthcare, hotels, financial services, real estate, and every regulated sector.',
  ],

  pullQuote: '{{International business law expertise at the core.}}',

  // Verbatim from live tamazia.in. These are the canonical credibility numbers.
  // The "4× / 200+ / 4" in the prior rebuild was a credibility-damaging error.
  stats: [
    {
      value: '882%',
      caption: 'RECORD CLIENT REVENUE GROWTH OVER 4 YEARS',
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
  proofStrip: 'Zero compliance incidents · NYSE IPO listing · Dubai Holding standard · Verified per SEC filings + GA4',

  cta: {
    label: 'Request SEO & Compliance Audit',
    href: '#contact',
  },

  scrollPrompt: 'Continue to sectors →',
};
