// Sectors section · 6 bento cards · verbatim live tamazia.in (TAMAZIA-13 §3)
// All cards equal weight (BD · Aman directive "no dominant card").
// Each card has 6 unique elements: numeral, icon, title+shorthand, body, regulation chips, sector-specific stat/quote.

export const sectorsContent = {
  // Backward-compatible aliases for current Sectors.astro component
  eyebrow: 'TAMAZIA · Sectors',
  h2: 'Every sector. {{One standard.}}',
  subline:
    'If your industry has a regulator, we have already studied their guidelines. The sectors change. The standard does not.',
  closingLine: "International Business Law expert from King's at the core.",

  // New structured fields (used after component upgrade in Gate B)
  preambleH2: 'Every sector. {{One standard.}}',
  preambleBody:
    'If your industry has a regulator, we have already studied their guidelines. The sectors change. The standard does not.',
  preambleSignature: "International Business Law expert from King's at the core.",

  // All 6 cards equal size (size: 'standard'). No dominant cell.
  sectors: [
    {
      id: 'legal',
      numeral: 'I.',
      index: '01',
      size: 'standard',
      headline: 'Law Firms and the Legal Sector',
      regulatoryShorthand: 'SRA. Bar. DIFC. GDPR. ICC. LCIA. SIAC. Every rule, every jurisdiction.',
      body: 'Solicitors. Barristers. Chambers. Law firms. Personal injury practices. Criminal defence. Family law. Corporate and M&A. Immigration. Employment. Estate planning. We rank every area of legal practice while staying within SRA advertising rules, Bar Association guidelines across all 50 US states, DIFC regulations, EU AI Act, your country-specific laws and GDPR. Practice area pages, legal directory listings, partner biographies, and crisis reputation management.',
      // Per-card pull-quote · the 6th unique element
      pullQuote: '2 million legal professionals. None can afford a compliance breach.',
      cta: 'Legal audit enquiry →',
      tooltip: [
        'SRA Code of Conduct Rules 8.7 & 8.9',
        'SRA Transparency Rules 2018',
        'Bar Standards Board handbook',
        'ABA Model Rules 7.1-7.3',
        'DIFC Courts framework',
        'GDPR Art. 6 lawful basis',
        'EU AI Act · Art. 6 high-risk',
      ],
      icon: 'gavel',
    },
    {
      id: 'healthcare',
      numeral: 'II.',
      index: '02',
      size: 'standard',
      headline: 'Healthcare and Medical',
      regulatoryShorthand: 'E-E-A-T. HIPAA. MHRA. ASA. CQC. GMC. ADA. Medical content under the hardest scrutiny.',
      body: 'Private GPs. Dermatologists. Dental practices. Cosmetic clinics. Mental health providers. Plastic surgeons. Medical tourism. Google scrutinises medical content harder than any other sector. We build E-E-A-T-compliant authority, HIPAA-safe contact forms, MHRA-cleared health claims, ADA- and AMA-guideline adherence, patient-journey content, and before-and-after gallery optimisation.',
      pullQuote: 'More private patients from search. No regulatory exposure in any direction.',
      cta: 'Healthcare audit enquiry →',
      tooltip: [
        'HIPAA Privacy Rule 45 CFR 164.508 and 164.502',
        'MHRA Human Medicines Regs 2012',
        'ASA CAP Code Section 12',
        'AMA Ethics Opinion 5.027',
        'CQC Inspection Framework',
        'Google E-E-A-T Guidelines',
        'ADA Digital Accessibility',
      ],
      icon: 'caduceus',
    },
    {
      id: 'hospitality',
      numeral: 'III.',
      index: '03',
      size: 'standard',
      headline: 'Hotels and Hospitality',
      regulatoryShorthand: 'OTA dependency eliminated. Direct bookings built. Revenue followed.',
      body: 'Boutique hotels. Luxury resorts. Hotel groups. Heritage properties. Independent properties are losing 15 to 25% of every booking to Booking.com and Expedia. We build direct booking visibility through Google Maps dominance, 50 to 100 location-specific landing pages, international traffic targeting, and AI search indexing so guests book direct.',
      pullQuote: '£50,000 to £80,000 saved annually on a 100-room property at 70% occupancy.',
      cta: 'Hospitality audit enquiry →',
      tooltip: [
        'Schema.org Hotel structured data',
        'Google Business Profile policy',
        'Booking.com commission structure',
        'UK ASA hospitality advertising',
        'Hreflang international targeting',
        'Trakheesi UAE tourism permit',
      ],
      icon: 'bell',
    },
    {
      id: 'real-estate',
      numeral: 'IV.',
      index: '04',
      size: 'standard',
      headline: 'Real Estate, Finance and IPOs',
      regulatoryShorthand: 'SEC Reg FD. FCA Listing Rules. RERA. Trakheesi. Nasdaq IPO. SEC disclosure on every word.',
      body: 'Property developers. Luxury estate agents. Wealth managers. Fintech startups. Accountants. Investment firms and companies preparing for public markets. We managed digital coverage for exchange-listed IPOs, resulting in shares nearly doubling, and SEC disclosure rules applied to every word published. Virtual tour SEO, international buyer targeting, FCA financial promotion compliance, and pre-IPO digital presence built to institutional standards.',
      pullQuote: 'High transaction values demand high content standards.',
      cta: 'Real estate audit enquiry →',
      tooltip: [
        'SEC Regulation FD',
        'FCA COBS 4 financial promotion',
        'RERA Law No. 7 of 2013 (UAE)',
        'Trakheesi permit system',
        'DFSA Conduct of Business',
        'NYSE Listed Company Manual',
        'FINRA Rule 2210',
      ],
      icon: 'opening-bell',
    },
    {
      id: 'fb',
      numeral: 'V.',
      index: '05',
      size: 'standard',
      headline: 'Restaurants, Bars and Food & Beverage',
      regulatoryShorthand: '30,000 to 40,000 map citations. Google Maps dominance. Deliveroo dependency cut.',
      body: 'Restaurants. Pubs. Bars. Cafes. Fine dining. Nightclubs. Dark kitchens. We dominate Google Maps through 30,000 to 40,000 map citations per property, menu schema markup for rich snippets, Reserve a Table integration, review generation with incentive systems, food directory listings across 25+ platforms, and event calendar SEO.',
      pullQuote: 'Reduce Deliveroo and Uber Eats dependency the same way we reduce OTA dependency for hotels.',
      cta: 'F&B audit enquiry →',
      tooltip: [
        'Schema.org Restaurant markup',
        'Google Maps citation architecture',
        "OpenTable & Resy integration",
        'Menu schema Rich Results',
        'Review platform policies',
        'ASA food advertising rules',
      ],
      icon: 'cloche',
    },
    {
      id: 'every-sector',
      numeral: 'VI.',
      index: '06',
      size: 'standard',
      headline: 'Every Sector. One Standard.',
      regulatoryShorthand: 'Schools. E-commerce. Automotive. Gyms. Executives. If it needs to rank, we build it.',
      body: 'Private schools. Universities. E-commerce brands. Luxury retailers. Car dealerships. Gyms. Spas. Wellness studios. Personal trainers. Executives and founders who need to control what Google says about them. Automotive groups. Fashion brands. If your business needs search visibility, we build it. If your industry has a rulebook, we have read it. If it does not, we make you rank faster than anyone else.',
      pullQuote: 'If your industry has a regulator, we have already studied their guidelines.',
      cta: 'Brand audit enquiry →',
      tooltip: [
        'ASA CAP Code (UK)',
        'FTC Act Section 5 (US)',
        'Safeguarding content standards',
        'GDPR Art. 17 right to erasure',
        'CCPA California Privacy Rights',
        'Wikipedia Notability Guidelines',
      ],
      icon: 'compass',
    },
  ],

  // CTA strip under the grid
  ctaStrip: {
    line: 'Have any questions?',
    link: 'Continue to case studies →',
    href: '#cases',
  },
};
