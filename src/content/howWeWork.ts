// How Tamazia Works · 3-step process · verbatim live tamazia.in (TAMAZIA-13 §5)
// Restored: full Step 1 paragraph, Step 2 team list, Step 3 audit-as-first-step framing.

// Phase E: E.01 BLOCKER — role labels removed. Replaced with founder-direct delivery model.
// Specialist role titles (Regulatory Analysts, AI Search Engineers, Legal Content Strategists,
// Technical SEO Architects, Revenue Attribution Analysts) removed from public-facing copy.
// Reason: creates hiring/team-size expectations the firm cannot verify. Founder-direct is the brand.
const _legacyParagraph = 'SRA advertising rules. FCA financial promotion codes. MHRA health claim standards. GDPR. ASA. These govern every word your brand publishes. Most SEO agencies have never read them. Every unreviewed piece of content is exposure. It compounds. When a regulator notices, your agency does not share the liability. You do.';
const _legacyPullQuote = 'A footnote at the end is not a {{defence}} at the {{start}}.';
// E.01: Role cards now describe engagement capabilities, not internal job titles
const _legacyRoles = [
  { id: 'regulatory',     title: 'Regulatory reading across every jurisdiction',  description: 'Law changes tracked across every market you operate in. Content reviewed before publication, not after.', icon: 'book' },
  { id: 'ai-search',      title: 'AI search placement',                           description: 'Your brand positioned inside ChatGPT, Perplexity, and Google AI Overviews for commercially valuable queries.', icon: 'signal' },
  { id: 'legal-content',  title: 'Compliance-engineered content',                 description: 'Every word written to the regulatory standard of your sector. From sentence one.', icon: 'quill' },
  { id: 'technical',      title: 'Technical infrastructure',                      description: 'Site architecture engineered against Core Web Vitals and sector-specific compliance requirements.', icon: 'wrench' },
  { id: 'revenue',        title: 'Revenue attribution',                           description: 'Organic search attributed to actual bookings, appointments, and instructions. Not keyword positions.', icon: 'chart' },
];

export const howWeWorkContent = {
  // Legacy fields used by current HowWeWork.astro
  paragraph: _legacyParagraph,
  pullQuote: _legacyPullQuote,
  roles: _legacyRoles,
  cta: 'Request your compliance and SEO audit →',

  eyebrow: 'TAMAZIA · How Tamazia works',
  h2: 'How Tamazia works.',
  intro: 'Three steps. Audit your exposure. Build compliant visibility. Protect it as laws change.',

  steps: [
    {
      numeral: '#1',
      headline: 'Your agency ranks you. Nobody checks if it is legal.',
      body: 'SRA advertising rules. FCA financial promotion codes. MHRA health claim standards. GDPR. ASA. These govern every word your brand publishes. Most SEO agencies have never read them. Every unreviewed piece of content is exposure. It compounds. When a regulator notices, your agency does not share the liability. You do.',
      pullQuote: 'Every unreviewed piece of content is {{exposure}}. It compounds.',
    },
    {
      numeral: '#2',
      headline: 'Built differently from the ground up.',
      body: 'A team configured against the way regulators read content, not the way agencies write it.',
      teamRoles: [
        {
          id: 'regulatory',
          title: 'Regulatory reading across every jurisdiction',
          description: 'Law changes tracked across every market you operate in. Content reviewed before publication, not after.',
          icon: 'book',
        },
        {
          id: 'ai-search',
          title: 'AI search placement',
          description: 'Your brand positioned inside ChatGPT, Perplexity and Google AI Overviews for commercially valuable queries.',
          icon: 'signal',
        },
        {
          id: 'legal-content',
          title: 'Compliance-engineered content',
          description: 'Every word written to the regulatory standard of your sector. From sentence one.',
          icon: 'quill',
        },
        {
          id: 'technical',
          title: 'Technical infrastructure',
          description: 'Site architecture engineered against Core Web Vitals and sector-specific compliance requirements.',
          icon: 'wrench',
        },
        {
          id: 'revenue',
          title: 'Revenue attribution',
          description: 'Organic search attributed to actual bookings, appointments, and instructions. Not keyword positions.',
          icon: 'chart',
        },
      ],
      founderLine: "Led by the founder, {{LLM in International Business Law}}, King's College London.",
    },
    {
      numeral: '#3',
      headline: 'The first step costs nothing and commits you to nothing.',
      body: "A full audit of your website, your sector's regulatory exposure, and the keyword gaps your competitors are filling ahead of you. Delivered before any commercial conversation.",
      cta: 'Request your compliance and SEO audit →',
      ctaHref: '#contact',
    },
  ],

  founderSignoff: {
    line: 'Led by the founder.',
    credentials: [
      "LLM · KING'S COLLEGE LONDON",
      'CHARTERED INSTITUTE OF ARBITRATORS',
      'AMERICAN BAR ASSOCIATION',
    ],
    signature: 'Aman Pareek',
  },
};
