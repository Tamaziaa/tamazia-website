// How Tamazia Works · 3-step process · verbatim live tamazia.in (TAMAZIA-13 §5)
// Restored: full Step 1 paragraph, Step 2 team list, Step 3 audit-as-first-step framing.

// Legacy fields (consumed by current component until Gate D rewrite)
const _legacyParagraph = 'SRA advertising rules. FCA financial promotion codes. MHRA health claim standards. GDPR. ASA. These govern every word your brand publishes. Most SEO agencies have never read them. Every unreviewed piece of content is exposure. It compounds. When a regulator notices, your agency does not share the liability. You do.';
const _legacyPullQuote = 'A footnote at the end is not a {{defence}} at the {{start}}.';
const _legacyRoles = [
  { id: 'regulatory',     title: 'Regulatory Analysts',         description: 'Tracking law changes across every jurisdiction you operate in.', icon: 'book' },
  { id: 'ai-search',      title: 'AI Search Engineers',         description: 'Placing your brand inside ChatGPT, Perplexity, and Google AI Overviews.', icon: 'signal' },
  { id: 'legal-content',  title: 'Legal Content Strategists',   description: 'Writing to compliance from sentence one.', icon: 'quill' },
  { id: 'technical',      title: 'Technical SEO Architects',    description: 'Engineering site infrastructure against Core Web Vitals and compliance standards.', icon: 'wrench' },
  { id: 'revenue',        title: 'Revenue Attribution Analysts',description: 'Attributing organic search revenue back to engagement.', icon: 'chart' },
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
          title: 'Regulatory Analysts',
          description: 'tracking law changes across every jurisdiction you operate in.',
          icon: 'book',
        },
        {
          id: 'ai-search',
          title: 'AI Search Engineers',
          description: 'placing your brand inside ChatGPT, Perplexity and Google AI Overviews.',
          icon: 'signal',
        },
        {
          id: 'legal-content',
          title: 'Legal Content Strategists',
          description: 'writing to compliance from sentence one.',
          icon: 'quill',
        },
        {
          id: 'technical',
          title: 'Technical SEO Architects',
          description: 'engineering site infrastructure against Core Web Vitals and compliance standards.',
          icon: 'wrench',
        },
        {
          id: 'revenue',
          title: 'Revenue Attribution Analysts',
          description: 'attributing organic search revenue back to engagement.',
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
