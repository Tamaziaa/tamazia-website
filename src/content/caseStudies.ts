// Case Studies · 3 alternating panels
// Phase D: CGON exchange confirmed Nasdaq (SEC EDGAR). NYSE references corrected throughout.
// Phase D: Case I body from Aman-approved copy (2026-04-30).
// Phase D: Case II body from Aman-approved copy (2026-04-30).
// Phase D: Case III body from Aman-approved copy (2026-04-30).
//
// Schema: each case has new full fields (metrics array, body paragraphs, closingVerdict)
// AND legacy aliases (pullQuote, body string, stat, statCaption) consumed by the
// current CaseStudies.astro component until Gate G rewrites the component.

const orchidMetrics = [
  { value: '840%', label: 'Organic user growth',       note: 'Six-month campaign. GA4 verified.' },
  { value: '113%', label: 'Revenue growth, year on year', note: 'GA4 verified.' },
  { value: '83%',  label: 'More direct bookings',      note: 'OTA dependency reduced.' },
];

const meraasMetrics = [
  { value: 'Dubai Holding Group', label: 'Sheikh Mohammed directive', note: '' },
  { value: 'Zero',                label: 'Compliance incidents',      note: '' },
];

const cgoncMetrics = [
  { value: '96%',    label: 'Share price increase at IPO', note: "Tamazia's digital content and marketing strategy was one of the factors contributing to that outcome." },
  { value: 'Nasdaq', label: 'Listed: CGON',                note: '' },
  { value: 'Zero',   label: 'Compliance incidents',        note: '' },
];

export const caseStudiesContent = {
  eyebrow: 'TAMAZIA · Case Studies',
  h2: 'Case Studies',
  subline: 'Three clients. Three regulators. Every number below is verified.',

  cases: [
    {
      id: 'orchid-hotels',
      numeral: 'Case I.',
      client: 'Orchid Hotels',
      meta: 'HOSPITALITY · HOTEL GROUP · ASIA PACIFIC',

      metrics: orchidMetrics,
      bodyParagraphs: [
        'A nationally recognised hotel group was paying Booking.com and Expedia 15 to 25% of every reservation. The guests were theirs. The revenue was not.',
        'We built direct search visibility across every property simultaneously. Organic search became the primary booking channel within a single six-month campaign.',
      ],
      closingVerdict: "If you are paying OTA commission, you are funding your competitor's marketing.",

      // Legacy schema (consumed by current component)
      pullQuote: "If you are paying OTA commission, you are funding your competitor's marketing.",
      body: 'A nationally recognised hotel group was paying Booking.com and Expedia 15 to 25% of every reservation. The guests were theirs. The revenue was not. We built direct search visibility across every property simultaneously. Organic search became the primary booking channel within a single six-month campaign.',
      stat: '840%',
      statCaption: 'ORGANIC USER GROWTH · SIX-MONTH CAMPAIGN · GA4 VERIFIED',

      verifiedNote: 'GA4 VERIFIED · INTERNAL BOOKING SYSTEM CROSS-REFERENCED',
      background: 'ivory',
    },
    {
      id: 'meraas',
      numeral: 'Case II.',
      client: 'Meraas',
      meta: 'REAL ESTATE AND LIFESTYLE · DUBAI HOLDING SUBSIDIARY · UAE',

      metrics: meraasMetrics,
      bodyParagraphs: [
        'Meraas is a subsidiary of Dubai Holding, operating under a strategic directive from His Highness Sheikh Mohammed bin Rashid Al Maktoum, Ruler of Dubai. Every piece of content represents a brand answerable to the principal of the emirate.',
        'We built the digital presence and content architecture for Meraas properties. Every word written to Dubai Holding standard. Every piece published without incident.',
      ],
      closingVerdict: 'If this standard was adequate here, it is adequate for your brand.',

      pullQuote: 'If this standard was adequate here, it is adequate for your brand.',
      body: 'Meraas is a subsidiary of Dubai Holding, operating under a strategic directive from His Highness Sheikh Mohammed bin Rashid Al Maktoum, Ruler of Dubai. Every piece of content represents a brand answerable to the principal of the emirate. We built the digital presence and content architecture for Meraas properties. Every word written to Dubai Holding standard. Every piece published without incident.',
      stat: 'Zero',
      statCaption: 'COMPLIANCE INCIDENTS · DUBAI HOLDING STANDARD',

      verifiedNote: 'DUBAI HOLDING STANDARD · RERA · TRAKHEESI VERIFIED',
      background: 'oxblood',
    },
    {
      id: 'cg-oncology',
      numeral: 'Case III.',
      client: 'CG Oncology',
      meta: 'HEALTHCARE · NASDAQ IPO · USA',

      metrics: cgoncMetrics,
      bodyParagraphs: [
        'A piece of digital content published at the wrong moment, with the wrong framing, is not an SEO mistake. It is an SEC Regulation FD violation. CG Oncology was preparing for its Nasdaq listing. Every piece of content had to be accurate on the science, correct on the financials, and clean under SEC disclosure rules simultaneously.',
        'CG Oncology is listed on the Nasdaq as CGON. Shares nearly doubled, a 96% increase at IPO. Every piece of content Tamazia produced was published without a single compliance incident.',
      ],
      closingVerdict: 'Your digital agency is either a compliance asset or a compliance risk. There is no middle position.',

      pullQuote: 'Your digital agency is either a compliance asset or a compliance risk.',
      body: 'A piece of digital content published at the wrong moment, with the wrong framing, is not an SEO mistake. It is an SEC Regulation FD violation. CG Oncology was preparing for its Nasdaq listing. Every piece of content had to be accurate on the science, correct on the financials, and clean under SEC disclosure rules simultaneously. CG Oncology is listed on the Nasdaq as CGON. Shares nearly doubled, a 96% increase at IPO. Every piece of content Tamazia produced was published without a single compliance incident.',
      stat: '+96%',
      statCaption: 'NASDAQ IPO SHARE PRICE MOVEMENT · CG ONCOLOGY (CGON)',

      verifiedNote: 'VERIFIED PER SEC FILINGS · PUBLIC RECORD',
      background: 'ivory',
    },
  ],

  closingPullQuote:
    'Your digital agency is either a compliance asset or a compliance risk. {{There is no middle position.}}',
};
