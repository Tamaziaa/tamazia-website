// Case Studies · 3 alternating panels
// COMPLIANCE FIX (TAMAZIA-FACTS-BIBLE): the three permanently-banned named clients and the
// growth/IPO stats attributed to them were removed and replaced with anonymised/aggregate
// content per bible §"VERIFIED CLIENT METRICS" and §"PERMANENTLY BANNED".
// This file is not currently imported by any component (CaseStudies.astro has its own
// inline CASES array) but is fixed here in case it is wired up in future.
//
// Schema: each case has new full fields (metrics array, body paragraphs, closingVerdict)
// AND legacy aliases (pullQuote, body string, stat, statCaption) consumed by the
// current CaseStudies.astro component until Gate G rewrites the component.

const hospitalityMetrics = [
  { value: 'Page One', label: 'Rankings for key search terms', note: 'GA4 verified.' },
  { value: 'Increased', label: 'Direct bookings via organic search', note: 'OTA dependency reduced.' },
  { value: 'Increased', label: 'Enquiries', note: '' },
];

const multiSectorMetrics = [
  { value: '400+', label: 'Regulatory frameworks applied', note: '' },
  { value: 'Zero', label: 'Compliance incidents', note: '' },
  { value: '47', label: 'UK and US legal clients served', note: '' },
];

const legalSectorMetrics = [
  { value: '47', label: 'UK and US legal clients', note: '' },
  { value: 'Zero', label: 'Compliance incidents', note: '' },
  { value: 'Page One', label: 'Rankings for key search terms', note: '' },
];

export const caseStudiesContent = {
  eyebrow: '',  /* A5 · was 'TAMAZIA · Case Studies' */
  h2: 'Case Studies',
  subline: 'Compliance-first engagements across regulated sectors. Every outcome GA4 verified or independently auditable.',

  cases: [
    {
      id: 'uk-hospitality-group',
      numeral: 'Case I.',
      client: 'A UK Hotel Group',
      meta: 'HOSPITALITY · HOTEL GROUP · UK',

      metrics: hospitalityMetrics,
      bodyParagraphs: [
        'A UK hotel group was paying online travel agencies 15 to 25% of every reservation. The guests were theirs. The revenue was not.',
        'We built direct search visibility across every property. Organic search became a primary booking channel within a single campaign, reviewed against the ASA CAP Code before publication.',
      ],
      closingVerdict: "If you are paying OTA commission, you are funding your competitor's marketing.",

      // Legacy schema (consumed by current component)
      pullQuote: "If you are paying OTA commission, you are funding your competitor's marketing.",
      body: 'A UK hotel group was paying online travel agencies 15 to 25% of every reservation. The guests were theirs. The revenue was not. We built direct search visibility across every property. Organic search became a primary booking channel within a single campaign, reviewed against the ASA CAP Code before publication.',
      stat: 'Page One',
      statCaption: 'ORGANIC RANKINGS ACHIEVED · GA4 VERIFIED',

      verifiedNote: 'GA4 VERIFIED',
      background: 'ivory',
    },
    {
      id: 'multi-sector-compliance',
      numeral: 'Case II.',
      client: 'Multi-Sector Engagements',
      meta: 'REAL ESTATE & REGULATED SECTORS · MULTI-JURISDICTION',

      metrics: multiSectorMetrics,
      bodyParagraphs: [
        'Across real estate and other regulated sectors, Tamazia builds digital content and campaign architecture reviewed against the applicable regulatory framework, including RERA and Trakheesi for UAE real estate, before anything goes live.',
        'Every campaign is checked against the relevant standard for its jurisdiction and sector before publication.',
      ],
      closingVerdict: 'Compliance-first content is not slower content. It is content that survives scrutiny.',

      pullQuote: 'Compliance-first content is not slower content. It is content that survives scrutiny.',
      body: 'Across real estate and other regulated sectors, Tamazia builds digital content and campaign architecture reviewed against the applicable regulatory framework, including RERA and Trakheesi for UAE real estate, before anything goes live. Every campaign is checked against the relevant standard for its jurisdiction and sector before publication.',
      stat: 'Zero',
      statCaption: 'COMPLIANCE INCIDENTS ACROSS ENGAGEMENTS',

      verifiedNote: 'AGGREGATE · GA4 VERIFIED',
      background: 'oxblood',
    },
    {
      id: 'legal-sector-engagements',
      numeral: 'Case III.',
      client: '47 UK and US Legal Clients',
      meta: 'LEGAL SECTOR · SRA & STATE BAR COMPLIANT · UK & USA',

      metrics: legalSectorMetrics,
      bodyParagraphs: [
        'Tamazia works with 47 UK and US legal clients, producing and reviewing content against SRA advertising rules and applicable US State Bar rules before publication.',
        'Rankings improved and enquiries increased across engagements, verified against GA4 data.',
      ],
      closingVerdict: 'Your digital agency is either a compliance asset or a compliance risk. There is no middle position.',

      pullQuote: 'Your digital agency is either a compliance asset or a compliance risk.',
      body: 'Tamazia works with 47 UK and US legal clients, producing and reviewing content against SRA advertising rules and applicable US State Bar rules before publication. Rankings improved and enquiries increased across engagements, verified against GA4 data.',
      stat: '47',
      statCaption: 'UK AND US LEGAL CLIENTS · COMPLIANCE-FIRST CONTENT',

      verifiedNote: 'AGGREGATE · GA4 VERIFIED',
      background: 'ivory',
    },
  ],

  closingPullQuote:
    'Your digital agency is either a compliance asset or a compliance risk. {{There is no middle position.}}',
};
