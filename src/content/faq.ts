// FAQ · 6 questions verbatim from live tamazia.in (TAMAZIA-13 §7)
// Structure: 6 top-level Q&As. Sub-content (sector breakdowns) handled within Q2 answer.

export const faqContent = {
  eyebrow: 'TAMAZIA · FAQ',
  h2: 'FAQ',
  intro: 'Questions we hear from managing partners, hotel group CMOs, and general counsel before every engagement.',

  // 4-week audit timeline (B-16 fix · hover popover with detailed week tasks)
  timeline: [
    {
      week: 'I',
      label: 'WEEK 01 · TECHNICAL',
      detail: 'Every crawlable page reviewed against Core Web Vitals · LCP / INP / CLS benchmarked. Redirect chains, crawl errors, broken links, robots.txt conflicts, heading hierarchy, title tags, meta descriptions identified. Prioritised fix document delivered to your dev team as implementation-ready instructions.',
    },
    {
      week: 'II',
      label: 'WEEK 02 · ON-PAGE & COMPLIANCE',
      detail: 'Every page reviewed simultaneously against search-engine requirements and the regulatory advertising standards governing your sector. SRA · MHRA · FCA · ASA · HIPAA · RERA. A page that ranks but breaches Transparency Rules is worse than a page that does not rank.',
    },
    {
      week: 'III',
      label: 'WEEK 03 · OFF-PAGE',
      detail: 'Backlink profile reviewed for toxic links suppressing rankings and quality authority signals to amplify. Competitor domain authority benchmarked. Gap quantified. Link-building plan via editorial placements, not purchased links.',
    },
    {
      week: 'IV',
      label: 'WEEK 04 · GBP & CONTENT',
      detail: 'Google Business Profile optimised, social signals locked, content calendar compliance-reviewed before commissioning. For hospitality, healthcare and restaurants, GBP is the highest-leverage ranking asset on the entire digital presence.',
    },
  ],

  // Six top-level FAQ entries from live site
  questions: [
    {
      id: 'q1-process',
      question: 'What actually happens when Tamazia starts working on our account?',
      answerParagraphs: [
        "Week one: technical audit. Every crawlable page reviewed against Google's Core Web Vitals: LCP, INP, and CLS benchmarked against Google's thresholds. Redirect chains, crawl errors, broken links, robots.txt conflicts, heading hierarchy, title tags, and meta descriptions identified. A prioritised fix document delivered to your development team as implementation-ready instructions. Not observations. Instructions.",
        "Week two: on-page and compliance audit. Every page reviewed simultaneously against search engine requirements and the regulatory advertising standards governing your sector. A page that ranks but breaches SRA Transparency Rules or MHRA health claim standards is worse than a page that does not rank at all. Both problems are identified and fixed.",
        "Week three: off-page audit. Backlink profile reviewed for toxic links suppressing rankings and quality authority signals that can be amplified. Competitor domain authority benchmarked. The gap quantified. A link building and Digital PR plan designed to close it through editorial placements, not purchased links.",
        "Week four: Google Business Profile optimisation, social signals, and content calendar locked. For hospitality, healthcare, and restaurants, GBP is the single highest-leverage ranking asset on the entire digital presence. Most businesses manage it poorly. The content calendar is compliance-reviewed before a single piece is commissioned.",
        "From month two: content published, backlink campaign live, rankings tracked. From month three: revenue attributed to organic search in GA4. Rankings typically begin to move at months two to three. Revenue impact typically arrives between months four and six. Any agency promising revenue in thirty days is not being honest with you.",
      ],
      chips: ['Core Web Vitals', 'SRA', 'MHRA', 'GBP', 'GA4'],
    },
    {
      id: 'q2-sectors',
      question: 'Which sectors does Tamazia work with and what is different about each?',
      answerParagraphs: [
        'These sectors share one characteristic: in all of them, an SEO mistake costs the client more than the agency ever charged.',
      ],
      sectorBreakdown: [
        {
          name: 'Hotels and Hospitality',
          body: 'The commercial problem is OTA commission. Booking.com and Expedia charge 15 to 25% per reservation. Tamazia builds direct search visibility so guests find the property before the OTA does. Multi-property location pages across 50 to 100 cities, Google Maps citation architecture, schema markup, AI search visibility for destination queries, and review management across every platform. For a 100-room property at 70% occupancy, a 10% shift from OTA to direct saves £50,000 to £80,000 annually.',
        },
        {
          name: 'Law Firms and Legal',
          body: 'SRA Transparency Rules 2018, SRA Standards and Regulations (2019) Standards 8.7 and 8.9 (Code of Conduct for Solicitors, RELs and RFLs), FCA financial promotion codes where financial elements are present, and Bar Association advertising rules across all 50 US states. Every practice area page, partner biography, case result page, and legal directory listing reviewed against the specific provision that applies.',
        },
        {
          name: 'Healthcare and Medical',
          body: 'Google applies higher scrutiny to health content under E-E-A-T. Tamazia combines that with HIPAA Privacy Rule 45 CFR 164.514 for US clients, MHRA Human Medicines Regulations 2012 and ASA CAP codes for UK clients, CQC inspection-readiness reviews, patient testimonial consent documentation, and ADA accessibility compliance.',
        },
        {
          name: 'Restaurants, Bars and F&B',
          body: '30,000 to 40,000 Google Maps citations per property for local map dominance. Menu schema markup for rich search results. Listings across 25 food and delivery directories.',
        },
        {
          name: 'Real Estate and Property',
          body: 'Property listing SEO, virtual tour optimisation, international buyer targeting, and location-specific landing pages for every city and price bracket a developer targets. RERA Law No. 7 of 2013 and Trakheesi permit compliance for UAE property advertising.',
        },
        {
          name: 'Financial Services',
          body: 'Wealth management firms, accounting practices, FinTech companies, and financial advisers. FCA COBS 4 financial promotion rules require content to be fair, clear, and not misleading. DFSA Conduct of Business Module for UAE. SEC Regulation FD for US-listed companies.',
        },
        {
          name: 'Education',
          body: 'Private schools, universities, online course providers, and EdTech platforms. International student recruitment SEO targeting high-intent searches from source markets.',
        },
        {
          name: 'Luxury Retail, E-Commerce, Automotive, Wellness and Fitness, Technology, Events, and Manufacturing',
          body: 'All served. Scope confirmed after the SEO and compliance audit.',
        },
      ],
      chips: ['SRA', 'MHRA', 'FCA', 'HIPAA', 'RERA', 'Trakheesi', 'CQC'],
    },
    {
      id: 'q3-individual',
      question: 'I am not a company. I am an individual looking to build my presence online. Can Tamazia help?',
      answerParagraphs: [
        'Most agencies are built for businesses. The individuals who need the most help are often the last to be served well.',
        'Tamazia works with executives, founders, lawyers, consultants, doctors, and public figures on building a search and AI presence that reflects professional reality. The problem is almost always the same: the wrong version of you surfaces when someone searches your name, or nothing surfaces at all.',
        "What Tamazia builds: Google page one for your name returning your own website, your LinkedIn profile, your published work, your speaking record, and your editorial mentions. Wikipedia presence where appropriate, positioned and monitored so it does not become a liability. AI search visibility: when a decision-maker asks ChatGPT who the leading practitioners in your sector are, your name appears.",
        'LinkedIn profile optimisation and content strategy. A LinkedIn article written correctly ranks on Google within days and surfaces in platform search simultaneously.',
        'Crisis reputation management. If negative coverage exists, Tamazia suppresses it through legitimate SEO: authoritative content built to earn the top positions for your name and displace what should not be there.',
        'The engagement is scoped individually after the SEO and compliance audit. No corporate minimum.',
      ],
      chips: ['LinkedIn', 'Wikipedia', 'AI Search', 'Crisis suppression'],
    },
    {
      id: 'q4-audit-coverage',
      question: 'What does the SEO and compliance audit cover, is there any obligation, and what happens after?',
      answerParagraphs: [
        'Think about what you know about your website right now. You know it exists. You may know your monthly visitor number. You almost certainly do not know which pages Google cannot crawl because of a robots.txt error, which keywords your direct competitors rank for that you are not targeting, which pieces of existing content breach the advertising code governing your sector, or what your Core Web Vitals scores are costing you in rankings every day. The audit answers all of it.',
      ],
      auditScope: [
        {
          name: 'Technical',
          body: 'Core Web Vitals benchmarked. Redirect chains, crawl errors, broken links, robots.txt conflicts, and schema gaps. Google Business Profile audited: for hospitality, healthcare, and restaurants, GBP is often the single highest-leverage ranking asset on the entire digital presence and most businesses manage it poorly.',
        },
        {
          name: 'Compliance',
          body: 'Existing content scanned against the specific regulatory framework governing your sector. SRA rules for law firms. MHRA and ASA for healthcare. FCA financial promotion standards for financial services. RERA requirements for UAE real estate. If any content already on your site creates regulatory exposure, you will know before a regulator does.',
        },
        {
          name: 'Competitive',
          body: 'Keyword gap analysis showing exactly which searches your competitors rank for that you do not. Presented as a revenue opportunity: estimated search volume, conversion probability, and the content investment required to capture it.',
        },
        {
          name: 'AI search',
          body: 'Where your brand currently appears in ChatGPT, Perplexity, and Google AI Overviews for your most commercially important queries. Where your competitors appear instead.',
        },
      ],
      closing:
        'You receive the complete findings before any commercial conversation begins. No sales call until you have seen the data and decided you want one. The findings belong to you whether you proceed with Tamazia or not.',
      chips: ['Technical', 'Compliance', 'Competitive', 'AI search'],
    },
    {
      id: 'q5-llm-and-ai',
      question: 'What does the LLM in International Business Law actually contribute to the work, and is any content produced by AI?',
      answerParagraphs: [
        "The credential is not a line on a pitch deck. It is the reason the team is structured the way it is and the reason the compliance review is substantive rather than cosmetic. An LLM in International Business Law from King's means the person overseeing every content strategy has read the SRA advertising code, the FCA financial promotion rules, the MHRA health claim guidance, and the cross-border advertising law governing content published across multiple jurisdictions simultaneously. That training is applied to every engagement.",
        'On AI content: AI tools are used in research, keyword analysis, and competitive intelligence. Content published under your brand is written by specialists and reviewed by the compliance team before it reaches any search engine or AI system. In regulated sectors, AI-generated content that has not been reviewed by someone with legal training is a liability. Healthcare content written without expert review can contain medically inaccurate claims. Legal content can breach SRA advertising rules. Financial content can constitute an unauthorised financial promotion under Section 21 of the Financial Services and Markets Act 2000. Tamazia does not create any of these liabilities for clients.',
      ],
      chips: ['LLM · KCL', 'SRA Code', 'FCA COBS 4', 'MHRA', 'FSMA s.21'],
    },
    {
      id: 'q6-switch',
      question: 'We already work with an SEO agency. Why would we switch?',
      answerParagraphs: [
        "Most agencies have not read your sector's regulations. Your current agency is either unaware of the compliance risks in your published content, or is aware and not equipped to address them. The compliance audit identifies exactly where those risks are. It costs nothing and the findings are yours whether you proceed or not.",
      ],
      chips: ['Audit · No-cost', 'Findings yours either way'],
    },
  ],

  closingLine:
    'Still have a question not answered here? The SEO and compliance audit is where every conversation starts. Reach out and we will answer anything specific to your sector and scale before any commercial discussion begins.',

  cta: {
    label: 'Request your compliance and SEO audit',
    href: '#contact',
  },

  // Legacy categories field (current FAQ.astro requires it for the sticky nav)
  categories: [
    { id: 'q1-process',         label: '01 Process',          count: 1 },
    { id: 'q2-sectors',         label: '02 Sectors',          count: 1 },
    { id: 'q3-individual',      label: '03 Individuals',      count: 1 },
    { id: 'q4-audit-coverage',  label: '04 Audit Coverage',   count: 1 },
    { id: 'q5-llm-and-ai',      label: '05 LLM & AI',         count: 1 },
    { id: 'q6-switch',          label: '06 Switching',        count: 1 },
  ],
  intro:
    'Questions we hear from managing partners, hotel group CMOs, and general counsel before every engagement.',
};

// Backward-compat: ensure each question has `answer` (string) + `category` fields the current component reads.
faqContent.questions.forEach((q: any) => {
  // category aliasing — current component groups by `q.category`. Use the question id as category.
  q.category = q.id;
  // answer aliasing — concatenate paragraph array into a single string with double-space breaks.
  if (Array.isArray(q.answerParagraphs)) {
    q.answer = q.answerParagraphs.join('  ');
  }
});
