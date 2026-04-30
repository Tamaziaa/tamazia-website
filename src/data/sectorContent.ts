// Sector landing page content · Phase G.1
// One object per service sector. Regulators from Phase C.21 mapping.
// Indian jurisdiction explicitly excluded (TAMAZIA-22 §3).

export interface SectorPage {
  slug: string;
  name: string;
  eyebrow: string;
  h1: string;
  regulatoryContext: string;
  regulators: string[];
  proofPoint: string;
  proofStat: string;
  proofCaption: string;
  mandateCta: string;
  metaTitle: string;
  metaDescription: string;
}

export const sectorPages: SectorPage[] = [
  {
    slug: 'law-firm',
    name: 'Legal',
    eyebrow: 'TAMAZIA · LEGAL',
    h1: 'SEO for law firms that pass a regulatory audit, not just a rankings check.',
    regulatoryContext: `Law firm marketing sits at the intersection of two simultaneous regulatory obligations. The SRA Standards and Regulations 2019, specifically Rules 8.7 and 8.9, require every regulated firm's website to publish prescribed pricing information, complaints procedures, the Legal Ombudsman route, and verifiable regulatory credentials. The requirements are mandatory, not aspirational. They are also among the most commonly breached provisions in UK legal practice.

At the same time, Google's Search Quality Evaluator Guidelines now classify legal services as the highest-tier YMYL category. Pages that fail E-E-A-T evaluation, missing regulator references, unpublished fee structures, absent complaints disclosures, are algorithmically suppressed irrespective of their technical SEO quality. The two standards are not in tension. They reinforce each other.

Tamazia writes every piece of content for law firms against SRA Rule 8.7, Rule 8.9, and the ABA Model Rules 7.1 to 7.3 for US-admitted practitioners simultaneously. Practice area pages, partner biographies, and case-result content all pass a compliance review before publication. The same review covers the UK Advertising Standards Authority CAP Code and, where relevant, Bar Standards Board Handbook requirements.

For international arbitration practices, the applicable standards extend to ICC, LCIA, SIAC, HKIAC, and UNCITRAL Model Law confidentiality obligations. Every reference to dispute outcomes or client engagements is reviewed against the applicable institutional rules before it reaches the page.`,
    regulators: ['SRA Standards & Regulations', 'SRA Rules 8.7 & 8.9', 'ABA Model Rules 7.1-7.3', 'BSB Handbook', 'ASA CAP Code', 'Legal Ombudsman Requirements', 'ICC Rules', 'LCIA Rules', 'SIAC Rules', 'HKIAC Rules', 'UNCITRAL Model Law', 'Chambers Directory Editorial', 'Legal 500 Editorial', 'GDPR / UK GDPR'],
    proofPoint: 'SRA transparency audit found 64% of UK firm websites had at least one Rule 8.9 contravention material enough to trigger investigation. Every Tamazia-built page passes that audit before publication.',
    proofStat: '64%',
    proofCaption: 'OF UK LAW FIRM SITES HAVE SRA RULE 8.9 BREACHES · SOURCE: ANONYMISED COMPLIANCE AUDIT 2025',
    mandateCta: 'Begin a Legal audit enquiry →',
    metaTitle: 'SEO for Law Firms · SRA-Compliant Content · Tamazia',
    metaDescription: 'Tamazia builds search visibility for law firms, arbitration practices, and regulated legal businesses. Every page reviewed against SRA Rules 8.7 and 8.9, ABA Model Rules, and ICC/LCIA institutional requirements.',
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    eyebrow: 'TAMAZIA · HEALTHCARE',
    h1: 'Healthcare SEO engineered to pass MHRA, HIPAA, and CQC, before any regulator reads it.',
    regulatoryContext: `Healthcare content operates under some of the most stringent advertising restrictions in any regulated sector. In the United Kingdom, the Medicines and Healthcare products Regulatory Agency prohibits direct-to-consumer prescription medicine advertising under the Human Medicines Regulations 2012. The Care Quality Commission requires registered providers to publish specific quality and regulatory information. The Advertising Standards Authority's Health and Wellbeing Code imposes absolute prohibitions on certain claim types, including before-and-after imagery for cosmetic surgery and efficacy claims unsupported by clinical evidence.

In the United States, the FDA regulates prescription drug advertising under 21 CFR Part 202, with mandatory disclosure of material facts including contraindications and risk information. HIPAA's Privacy Rule at 45 CFR 164.508 restricts the use of patient information in any marketing communication. The FTC has issued enforcement guidance on health claims that applies to both paid media and organic search content.

Tamazia reviews every piece of healthcare content against the applicable standard before publication. Private clinic service pages, surgeon biographies, treatment descriptions, and before-and-after testimonials are reviewed against MHRA, ASA Health Code, CQC presentation requirements, and, for US-facing content, FDA and HIPAA simultaneously. Content that would expose the practice to regulatory scrutiny does not reach Google.`,
    regulators: ['MHRA Human Medicines Regulations 2012', 'ASA CAP Health Code', 'CQC Standards', 'HIPAA Privacy Rule 45 CFR 164.508', 'FDA 21 CFR Part 202', 'FTC Health Claims Guidance', 'GMC GMP', 'GDC Standards', 'NMC Code', 'ACA Section 1557', 'NHS Constitution', 'HTA 2004', 'GDPR / UK GDPR', 'HITECH Act'],
    proofPoint: 'CG Oncology, Nasdaq-listed (CGON): digital content for IPO executed under SEC Regulation FD and FDA disclosure requirements simultaneously. Zero compliance incidents across the listing process.',
    proofStat: 'Zero',
    proofCaption: 'COMPLIANCE INCIDENTS · CG ONCOLOGY IPO · SEC REG FD + FDA REVIEWED',
    mandateCta: 'Begin a Healthcare audit enquiry →',
    metaTitle: 'Healthcare SEO · MHRA, HIPAA & CQC Compliant · Tamazia',
    metaDescription: 'Tamazia builds search visibility for private clinics, medical groups, and healthcare enterprises. Every piece of content reviewed against MHRA, HIPAA, FDA, CQC, and ASA Health Code before publication.',
  },
  {
    slug: 'hospitality',
    name: 'Hospitality',
    eyebrow: 'TAMAZIA · HOSPITALITY',
    h1: 'Hotel SEO that removes OTA dependency and builds direct booking revenue.',
    regulatoryContext: `Hospitality brands occupy an unusual position in search. The commercial intent behind a hotel search is unambiguous, a user searching for a specific property or destination is, in the majority of cases, within 48 hours of a booking decision. The question is not whether they will book. The question is whether they will book direct or through an intermediary extracting 15 to 25 percent commission per reservation.

Google's search results pages for hospitality queries are among the most heavily contested environments in organic search. Hotel properties compete simultaneously with OTA aggregators, review platforms, destination guides, and direct competitor brands. The organic result that intercepts the booking-intent query before the OTA does it is recoverable revenue.

At the same time, hospitality marketing must comply with the ASA CAP Code on pricing transparency, the Package Travel Regulations 2018 on all-in pricing disclosure, and, for properties in regulated tourism markets, jurisdiction-specific licensing and advertising requirements. In the UAE, the Dubai Tourism and Commerce Marketing authority and DTCM licensing obligations apply to every property marketed to international guests. In Saudi Arabia, the Saudi Commission for Tourism and National Heritage imposes equivalent requirements.

Tamazia builds direct booking visibility for hotel groups across UK, UAE, and international markets. Every piece of content reviewed against applicable advertising standards. Schema markup for hotel-category structured data, Google Hotels eligibility, and local pack placement included as standard.`,
    regulators: ['ASA CAP Code', 'Package Travel Regulations 2018', 'DTCM Dubai', 'SCTA Saudi', 'GBP Hotel Schema', 'UK Hospitality Advertising Guidelines', 'GDPR / UK GDPR', 'UAE PDPL 2021', 'Google Hotels Policies', 'Booking Platform Terms'],
    proofPoint: 'Orchid Hotels: 840% organic user growth, 83% direct booking increase, 113% revenue growth year on year. OTA dependency reduced within a single six-month campaign. GA4 verified.',
    proofStat: '840%',
    proofCaption: 'ORGANIC USER GROWTH · ORCHID HOTELS · SIX-MONTH CAMPAIGN · GA4 VERIFIED',
    mandateCta: 'Begin a Hospitality audit enquiry →',
    metaTitle: 'Hotel SEO · Direct Booking Growth · OTA Dependency Reduction · Tamazia',
    metaDescription: 'Tamazia builds direct booking visibility for hotels, resorts, and hospitality groups. 840% organic user growth for Orchid Hotels. Every campaign reviewed against ASA, DTCM, and international advertising standards.',
  },
  {
    slug: 'financial-services',
    name: 'Financial Services',
    eyebrow: 'TAMAZIA · FINANCIAL SERVICES',
    h1: 'Financial services SEO reviewed against FCA, SEC, and MiFID II before any word goes live.',
    regulatoryContext: `Financial services marketing is regulated as a category of financial promotion. In the United Kingdom, Section 21 of the Financial Services and Markets Act 2000 prohibits any communication that constitutes a financial promotion unless it has been approved by an FCA-authorised person or falls within a prescribed exemption. The FCA's Conduct of Business Sourcebook, specifically COBS 4, sets out the fair, clear, and not-misleading standard for financial promotions. The Consumer Duty introduced in 2023 extended that standard to a positive obligation to deliver good consumer outcomes.

In the European Union, MiFID II and its Delegated Regulation impose mandatory disclosure requirements on investment product marketing. The Prospectus Regulation governs communications in advance of and during public offerings. ESMA's Guidelines on marketing communications apply across the single market.

In the United States, SEC Regulation FD prohibits the selective disclosure of material non-public information. For broker-dealers and investment advisers, FINRA Rule 2210 sets standards for communications that include numerical performance claims or projections. The Advisers Act Section 206 prohibits false or misleading advertising.

Tamazia has managed digital content for businesses operating under FCA, SEC, and DFSA supervision simultaneously. Every financial services piece is reviewed against the specific regulatory instruments applicable to the firm's regulated status before publication. Numerical claims, projections, and past-performance references are reviewed against the standards that apply in every distribution jurisdiction.`,
    regulators: ['FCA COBS 4', 'FSMA 2000 Section 21', 'MiFID II', 'MiFIR', 'ESMA Marketing Guidelines', 'SEC Regulation FD', 'FINRA Rule 2210', 'DFSA Dubai', 'FSRA ADGM', 'MAR (EU)', 'Prospectus Regulation', 'Consumer Duty 2023', 'GDPR / UK GDPR', 'SFDR', 'IOSCO Principles'],
    proofPoint: 'CG Oncology IPO content produced under SEC Regulation FD, FDA, and FINRA advertising standards simultaneously. Zero compliance incidents. Shares up 96% at IPO.',
    proofStat: 'Zero',
    proofCaption: 'COMPLIANCE INCIDENTS · CG ONCOLOGY · SEC REG FD + FINRA + FDA REVIEWED',
    mandateCta: 'Begin a Financial services audit enquiry →',
    metaTitle: 'Financial Services SEO · FCA, SEC & MiFID II Compliant · Tamazia',
    metaDescription: 'Tamazia builds search visibility for FCA-regulated firms, wealth managers, fintech, and pre-IPO businesses. Every financial promotion reviewed against FCA COBS 4, MiFID II, SEC Reg FD, and FINRA Rule 2210.',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    eyebrow: 'TAMAZIA · REAL ESTATE',
    h1: 'Real estate SEO for developers and agents operating across international markets and regulators.',
    regulatoryContext: `Real estate marketing operates under a distinct regulatory structure in each jurisdiction. In the United Arab Emirates, the Real Estate Regulatory Authority (RERA) under Law No. 7 of 2013 requires every real estate advertisement to include the property registration number, the developer's licence number, and the agent's RERA registration. The Trakheesi system governs off-plan marketing permissions. Non-compliant advertising, including digital advertising and organic search content, is an enforcement matter, not merely a civil dispute.

In the United Kingdom, the Property Misdescriptions Act and the Consumer Protection from Unfair Trading Regulations 2008 impose strict liability on false or misleading statements about property. The Property Ombudsman Code requires agents to present information fairly and accurately. The Competition and Markets Authority issued guidance in 2024 specifically addressing online property marketing practices.

In Saudi Arabia, the Real Estate General Authority (REGA) regulates property marketing and licensing. In Singapore, the Council for Estate Agencies (CEA) administers equivalent requirements under the Estate Agents Act.

International developers targeting buyers across multiple jurisdictions face simultaneous compliance obligations. A property marketed to UK buyers must comply with UK consumer protection law. The same property marketed to UAE buyers must comply with RERA. The same property marketed to US buyers must comply with applicable state securities laws if marketed with an investment return expectation. Tamazia manages multi-jurisdiction compliance as a single review process, not three separate ones.`,
    regulators: ['RERA UAE Law No. 7 of 2013', 'Trakheesi', 'Property Misdescriptions Act', 'CPR Regulations 2008', 'CMA Property Guidance 2024', 'Property Ombudsman Code', 'REGA Saudi', 'CEA Singapore', 'FCA (investment properties)', 'GDPR / UK GDPR', 'UAE PDPL 2021', 'Google Real Estate Policies'],
    proofPoint: 'Meraas (Dubai Holding subsidiary): digital presence and content architecture built to Dubai Holding standard under RERA, Trakheesi, and a direct Sheikh Mohammed directive. Zero compliance incidents.',
    proofStat: 'Zero',
    proofCaption: 'COMPLIANCE INCIDENTS · MERAAS · RERA + TRAKHEESI + DUBAI HOLDING STANDARD',
    mandateCta: 'Begin a Real estate audit enquiry →',
    metaTitle: 'Real Estate SEO · RERA, REGA & International Compliance · Tamazia',
    metaDescription: 'Tamazia builds search visibility for real estate developers, agents, and international property groups. Meraas and Orchid Hotels clients. Every campaign reviewed against RERA, Trakheesi, UK CPR, and applicable international standards.',
  },
];

export function getSectorBySlug(slug: string): SectorPage | undefined {
  return sectorPages.find((s) => s.slug === slug);
}
