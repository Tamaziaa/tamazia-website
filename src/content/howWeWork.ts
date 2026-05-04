// How Tamazia Works · 3-step process · verbatim live tamazia.co.uk (TAMAZIA-13 §5)
// Restored: full Step 1 paragraph, Step 2 team list, Step 3 audit-as-first-step framing.

// Phase E: E.01 BLOCKER — role labels removed. Replaced with founder-direct delivery model.
// Specialist role titles (Regulatory Analysts, AI Search Engineers, Legal Content Strategists,
// Technical SEO Architects, Revenue Attribution Analysts) removed from public-facing copy.
// Reason: creates hiring/team-size expectations the firm cannot verify. Founder-direct is the brand.
const _legacyParagraph = 'Every engagement opens with a regulatory baseline before a keyword is touched. Your existing site is read against the rulebook of your sector and your operating jurisdictions. Exposure is mapped, gaps are catalogued, the rankings you already have are checked against the regulations they were written under. The first deliverable is not a content plan. It is the audit nobody else gives you.';
const _legacyPullQuote = 'Compliance is the first {{deliverable}}, not the last review.';
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

  eyebrow: 'TAMAZIA · How Tamazia works',
  h2: 'How Tamazia works.',
  intro: 'Three steps. Audit your exposure. Build compliant visibility. Protect it as laws change.',

  steps: [
    {
      numeral: '#1',
      headline: 'The audit comes before the keyword.',
      body: 'Every engagement opens with a regulatory baseline before a keyword is touched. Your existing site is read against the rulebook of your sector and your operating jurisdictions. Exposure is mapped, gaps are catalogued, the rankings you already have are checked against the regulations they were written under. The first deliverable is not a content plan. It is the audit nobody else gives you.',
      pullQuote: 'Compliance is the first {{deliverable}}, not the last review.',
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
};
