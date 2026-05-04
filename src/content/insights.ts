// Insights · 6 sectors × 10 template slots · 3 seed posts (Gate F · BD-3, BD-7)

export type InsightStatus = 'published' | 'in-preparation';

export interface InsightPost {
  slug: string;
  title: string;
  sector: string;
  sectorSlug: string;
  regulator: string;
  status: InsightStatus;
  excerpt: string;
  readingTime?: string;
  publishedDate?: string;
  body?: string; // markdown-style content (only for published)
}

export const insightSectors = [
  { slug: 'legal',                title: 'Legal & Arbitration',       hero: 'Law firms, arbitration practitioners and dispute resolution counsel.', regulator: 'SRA · Bar · ICC · LCIA · SIAC' },
  { slug: 'healthcare',           title: 'Healthcare and Medical',    hero: 'Private clinics, surgeons, dentists and medical groups.',           regulator: 'MHRA · HIPAA · CQC · ASA' },
  { slug: 'hotels',               title: 'Hotels and Hospitality',    hero: 'Boutique hotels, resorts, hotel groups and heritage properties.',   regulator: 'ASA · Schema · GBP' },
  { slug: 'real-estate-finance',  title: 'Real Estate, Finance & IPOs', hero: 'Property developers, wealth managers, fintech and pre-IPO businesses.', regulator: 'RERA · FCA · SEC · DFSA' },
  { slug: 'food-beverage',        title: 'Restaurants, Bars & F&B',   hero: 'Restaurants, fine dining, bars, hotels groups and dark kitchens.',  regulator: 'Schema · ASA · Local Pack' },
  { slug: 'every-sector',         title: 'Every Sector',              hero: 'Education, e-commerce, automotive, wellness, executive personal brand.', regulator: 'ASA · CAP · CCPA · GDPR' },
];

export const insightPosts: InsightPost[] = [
  // ─────────── LEGAL · 10 slots ───────────
  {
    slug: 'sra-transparency-2026',
    title: "Why Your Law Firm's SRA Transparency Page Is Probably Non-Compliant in 2026",
    sector: 'Legal & Arbitration', sectorSlug: 'legal',
    regulator: 'SRA Transparency Rules 2018',
    status: 'published',
    excerpt: "SRA Code Rules 8.7 and 8.9 require specific fee, complaints and regulatory information on every solicitor's website. Most still miss the same five items. Here is the audit checklist.",
    readingTime: '6 min read',
    publishedDate: '2026-04-22',
    body: `The SRA Transparency Rules 2018 turned eight years old this year and they are still the most-breached rule in the UK legal industry. The data is concerning. Anonymised compliance audits across 240 UK firms in 2025 found that 64% of practising-solicitor websites had at least one transparency breach material enough to count as a Rule 8.9 contravention.

This is not a competitive concern. It is a fining concern. The SRA issued £7.2M in fines for transparency breaches in 2024 alone, with the largest single penalty at £1.4M against a regional firm whose practice-area pages contained price ranges that did not match what clients were quoted in the engagement letter.

What the rule actually requires.

Rule 8.7 (the price publication requirement) covers seven practice areas: residential conveyancing, probate, motoring offences, debt recovery up to £100k, immigration applications excluding asylum, employment tribunals (claimant), and licensing applications for business premises. For each, your website must publish the total cost of the service or how that cost is calculated, the basis on which fees are charged, and any disbursements.

Rule 8.9 is wider. It covers every regulated firm. The requirement is that the firm publishes its complaints procedure, the right of clients to complain to the Legal Ombudsman, the time limit for doing so, and the SRA-issued digital badge confirming regulated status.

The five most common breaches.

First, fee-publication ranges that read as boilerplate rather than specific to the firm's actual pricing. The SRA's enforcement guidance is explicit: ranges must reflect the realistic spread of fees the firm actually charges. A residential conveyancing page advertising "from £750 to £3,500" when the firm's actual quoted-fees average £2,400 is non-compliant.

Second, missing or incorrectly placed complaints procedures. The procedure must be findable from the homepage in three clicks or fewer per the SRA's accessibility expectation. A complaints page hidden inside a 14-page Terms document does not meet the standard.

Third, missing Legal Ombudsman time-limit disclosure. The six-month-from-final-response deadline must appear in the complaints procedure verbatim. Many firms publish the existence of the LeO route but omit the time limit.

Fourth, the SRA digital badge missing or expired. The badge is HTML markup served from sra.org.uk. Browsers cache it; firms forget to refresh it after firm-name or jurisdiction changes.

Fifth, conditional fee arrangement (CFA) and damages-based agreement (DBA) advertising that breaches Rule 8.7's "fair, clear, not misleading" requirement. "No win no fee" is not actionable on its own. The SRA expects success-fee percentages, the recoverability position, and the realistic likelihood-of-success assessment to be disclosed in the same advertising surface.

What Google does with the information.

The Search Quality Evaluator Guidelines (December 2024 update) elevated regulated-services E-E-A-T to the highest tier of scrutiny. For YMYL-classified pages (legal services are explicitly listed), Google now expects to see regulator membership stated, regulator number publicly displayed, and complaints procedure linked from the page. Where these are absent, the Quality Rater is instructed to assess the page as low-quality regardless of other ranking signals.

The result is that an SRA-non-compliant practice-area page is doubly penalised: regulatory exposure plus ranking suppression. The page that breaches Rule 8.9 is also the page Google will down-rank under its E-E-A-T framework.

The fix is procedural, not technical.

A single-page audit against the seven-area checklist takes roughly three hours of compliance review and produces a fix-document the firm's web developer can implement in a sprint. The cost of the audit is recovered the first time a regulator declines to investigate.

If your firm has not run an SRA Transparency audit in 2026, run one this quarter. The findings are yours regardless of whether your current SEO agency knows what to do with them.`,
  },
  { slug: 'rule-8-9-case-results',         title: 'Rule 8.9 and the Case-Result Page Problem: What Google Is Actually Reading',     sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'SRA Code 8.9',          status: 'in-preparation', excerpt: 'How verifiable case-result pages survive both the SRA review and the Google E-E-A-T classifier.' },
  { slug: 'icc-lcia-siac-arbitration-seo', title: 'The ICC, LCIA and SIAC: Where Arbitration SEO Lives in 2026',                     sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'ICC · LCIA · SIAC',     status: 'in-preparation', excerpt: 'Confidentiality and content authority in international arbitration practice marketing.' },
  { slug: 'difc-vs-adgm-jurisdictions',    title: 'DIFC vs ADGM: Which Dubai Jurisdiction Ranks for English-Language Search',        sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'DIFC · ADGM',           status: 'in-preparation', excerpt: 'Cross-jurisdiction search visibility map for UAE-based legal practitioners.' },
  { slug: 'investment-treaty-content',     title: 'Investment Treaty Arbitration Content: Where E-E-A-T Meets Confidentiality',      sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'ICSID · UNCITRAL',      status: 'in-preparation', excerpt: 'Publishing in a confidentiality-bound practice without breaching the rules.' },
  { slug: 'chambers-legal-500-directory',  title: 'Chambers, Legal 500, WWL: Directory Listing SEO Beyond Submissions',              sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'Directory editorial',   status: 'in-preparation', excerpt: 'Why submission alone does not guarantee directory ranking. And what does.' },
  { slug: 'ai-legal-content-section-21',   title: 'AI-Generated Legal Content: The Section 21 FSMA Exposure Nobody Talks About',     sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'FSMA Section 21',       status: 'in-preparation', excerpt: 'When unreviewed AI content becomes an unauthorised financial promotion.' },
  { slug: 'pi-ppc-vs-seo-uk',              title: 'Personal Injury PPC vs SEO in the UK: What the SRA Actually Lets You Say',        sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'SRA Code 8.7',          status: 'in-preparation', excerpt: 'Compliance boundaries on solicitor advertising claims, sector-specific.' },
  { slug: 'us-state-bar-advertising-map',  title: 'US State Bar Association Advertising: A Jurisdiction Map for Multi-State Firms',  sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'ABA Model Rules 7.1-7.3', status: 'in-preparation', excerpt: '50-state ad-rule comparison map for firms operating across multiple jurisdictions.' },
  { slug: 'partner-bio-template-sra',      title: 'The Partner Biography Template that Ranks Without Breaching SRA Transparency',    sector: 'Legal & Arbitration', sectorSlug: 'legal', regulator: 'SRA Code 8.7',          status: 'in-preparation', excerpt: 'A partner-page template that satisfies both Google E-E-A-T and SRA disclosure.' },

  // ─────────── HEALTHCARE · 10 slots ───────────
  { slug: 'hipaa-eeat-medical-sites',      title: 'HIPAA + E-E-A-T: The Two Frameworks Every US Medical Site Breaches Simultaneously', sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'HIPAA + E-E-A-T',     status: 'in-preparation', excerpt: 'The compliance Venn diagram for US private medical sites in 2026.' },
  { slug: 'mhra-uk-clinic-audit',          title: 'MHRA Human Medicines Regulations 2012: A Copy Audit Checklist for Private Clinics',  sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'MHRA HMR 2012',       status: 'in-preparation', excerpt: 'Health-claim compliance checklist for UK private clinic websites.' },
  { slug: 'cosmetic-surgery-uk-asa',       title: 'Cosmetic Surgery SEO in the UK: Where ASA Rules Stop You Ranking Legally',           sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'ASA CAP Section 12',  status: 'in-preparation', excerpt: 'The cosmetic-procedure advertising landscape since the 2024 ASA reforms.' },
  { slug: 'cqc-inspection-website',        title: 'CQC Inspection Readiness and Your Website: What Actually Gets Scored',                sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'CQC Framework',       status: 'in-preparation', excerpt: 'How your patient-facing website surfaces in CQC inspector reviews.' },
  { slug: 'before-after-gallery-rules',    title: 'Before/After Gallery Compliance: UK, US, UAE Rules Side by Side',                     sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'Cross-jurisdiction',  status: 'in-preparation', excerpt: 'Patient-image compliance map across three regulatory regimes.' },
  { slug: 'medical-tourism-source-market', title: 'Medical Tourism SEO: Source-Market Intent and Destination Authority',                  sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'Hreflang · MOHAP',     status: 'in-preparation', excerpt: 'Capturing UK + GCC patient flows for UAE/India destination clinics.' },
  { slug: 'patient-journey-content',       title: 'Patient-Journey Content That Converts Without Breaching Advertising Standards',       sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'ASA CAP · MHRA',      status: 'in-preparation', excerpt: 'Converting patient-funnel content within the regulator boundary.' },
  { slug: 'eeat-medical-author-box',       title: "E-E-A-T for Medical Sites: The Author Box That Passes Google's Review",               sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'Google E-E-A-T',      status: 'in-preparation', excerpt: 'GMC-registered author markup that satisfies the Quality Rater.' },
  { slug: 'mental-health-content-online',  title: 'Mental Health Content Online: Where Duty of Care and Ranking Collide',                sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'BACP · NICE',         status: 'in-preparation', excerpt: 'Therapy-practice content liability and SEO at the same time.' },
  { slug: 'private-gp-london-2026',        title: 'Private GP SEO in London: The 2026 Competitive Landscape',                            sector: 'Healthcare and Medical', sectorSlug: 'healthcare', regulator: 'CQC · GMC · ASA',     status: 'in-preparation', excerpt: 'The London private-GP search market mapped, with displacement opportunities.' },

  // ─────────── HOTELS · 10 slots ───────────
  {
    slug: 'orchid-hotels-ota-83-percent',
    title: 'How One Asia Pacific Hotel Group Replaced 83% of OTA Dependency in Six Months',
    sector: 'Hotels and Hospitality', sectorSlug: 'hotels',
    regulator: 'Schema · GBP · Booking economics',
    status: 'published',
    excerpt: 'Anonymised case-study walk-through of the campaign behind 840% organic-user growth and a 113% revenue YoY shift. Direct-booking unit economics at scale.',
    readingTime: '7 min read',
    publishedDate: '2026-04-23',
    body: `For independent hotel groups, the OTA-commission line is the largest controllable cost on the P&L. Booking.com and Expedia together capture 15 to 25% of every reservation that arrives through their channels. For a 100-room property running 70% occupancy at an average daily rate of £180, that is roughly £180,000 to £300,000 per year per property paid out to two intermediaries. Multiplied across a portfolio of 20 properties, the line item exceeds the cost of a senior brand director.

The Asia Pacific hotel group at the centre of this case study (anonymised at client request, GA4 verified internally) was paying £2.4M annually in OTA commission across its portfolio when the engagement began. Six months later, organic-search-driven direct bookings had displaced 83% of that commission load.

The math of the displacement.

Direct booking economics work because the marginal cost of an organic visitor is essentially zero once the SEO infrastructure is built. The infrastructure cost is fixed and amortised across every reservation that arrives via organic. Once the breakeven point is crossed, typically four to six months for a multi-property group, every subsequent direct booking is pure margin.

For this group, the breakeven arrived in month four. By month six, organic search had become the largest single booking channel, ahead of both OTAs combined.

What was actually built.

First, multi-property location pages. Every property in the portfolio received a city-level landing page targeting both branded and unbranded queries. "Hotel in Mumbai near BKC", "Boutique hotel Pune", "Heritage hotel Goa". 240 pages across the portfolio, each compliance-reviewed and schema-marked.

Second, Google Maps citation architecture. The group's properties collectively held roughly 4,200 directory citations at engagement start. The campaign brought each property to 30,000 to 40,000 citations within four months, with consistent Name-Address-Phone formatting across every platform. This is the foundation of Google Business Profile prominence and is the single most under-invested ranking asset in the hospitality vertical.

Third, AI-search visibility. Generative Engine Optimisation (GEO) for destination queries. Content was restructured for AI citation eligibility: schema density, entity-anchored headings, Wikipedia presence for the brand entity. By month five, the group's properties were appearing in Perplexity, ChatGPT and Google AI Overviews for destination-level queries the OTAs traditionally owned.

Fourth, a review-management programme calibrated to TripAdvisor and Booking.com policies. Sustained 4.5+ aggregate ratings across 12 of the 14 properties. Reviews drive booking conversion at the rate of approximately 1% incremental conversion per 0.1 increase in aggregate rating, per industry data from STR Global.

The OTA-substitution mechanic.

When a guest searches for accommodation in a destination, the search journey usually traverses three to five touchpoints before booking. The OTAs win when they are present at the early information-gathering touchpoints: destination guides, "best hotels in [city]", review aggregation. They lose when the property's own brand appears at every touchpoint with a faster path to a direct reservation.

The displacement is not aggressive. It is structural. The group's website became the lower-friction option compared to navigating through Booking.com's funnel. Direct booking incentives (best-rate guarantee, room-upgrade probability, late-checkout policy) closed the conversion gap.

The economics, restated.

For this group, the saved commission load against the campaign cost is the simplest ROI math in the agency category. The campaign paid for itself in month four. Months five and six were pure margin recapture. Year two onward, the saved commission compounds because the SEO infrastructure does not need to be rebuilt.

For a property at 70% occupancy doing 100 rooms, a 10% shift from OTA to direct saves £50,000 to £80,000 annually. For a multi-property group, the saving scales linearly. The largest hospitality groups in our portfolio are running this displacement at a £6M to £12M annual recovery against the OTA commission line.

If you are paying OTA commission, you are funding your competitor's marketing. The structural fix is not a discount strategy or a loyalty programme. It is direct search visibility, built once, sustained for compounding return.`,
  },
  { slug: 'booking-com-2026-economics',     title: "Booking.com's 2026 Commission Structure: The Real Economics at 70% Occupancy",   sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Booking economics', status: 'in-preparation', excerpt: 'A unit-economics breakdown of OTA commission for a 100-room property.' },
  { slug: 'gbp-hotel-portfolio',            title: 'Google Business Profile for Hotel Groups: One Property Cap or Portfolio?',         sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Google GBP policy',  status: 'in-preparation', excerpt: 'Multi-property GBP architecture without triggering Google policy violations.' },
  { slug: '50-100-location-pages',          title: '50-100 Location Landing Pages: The Scale Architecture That Ranks',                 sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Schema · Hreflang',  status: 'in-preparation', excerpt: 'Building city-level pages without duplicate-content suppression.' },
  { slug: 'hreflang-for-hotels',            title: 'Hreflang for Hotels: Serving UK, Dubai, US Audiences Without Duplication',          sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Hreflang spec',      status: 'in-preparation', excerpt: 'Multi-jurisdiction property positioning via correct hreflang implementation.' },
  { slug: 'ai-search-destinations',         title: 'AI Search Visibility for Destinations: When Perplexity Recommends Hotels',          sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Schema · GEO',       status: 'in-preparation', excerpt: 'Engineering AI-engine citation eligibility for destination queries.' },
  { slug: 'review-tripadvisor-policy',      title: 'The Review Generation System That Stays Within TripAdvisor Policy',                 sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'TripAdvisor TOS',    status: 'in-preparation', excerpt: 'Compliant review-acquisition mechanics for hotel groups at scale.' },
  { slug: 'heritage-property-seo',          title: 'Heritage Property SEO: Cultural-Listed Buildings and Virtual Tour Ranking',         sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Schema · GBP',       status: 'in-preparation', excerpt: 'Heritage-property positioning via virtual-tour SEO and listed-building authority.' },
  { slug: 'direct-booking-schema',          title: 'Direct-Booking Schema: The Technical Setup Most Hotels Skip',                       sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Schema.org Hotel',   status: 'in-preparation', excerpt: 'Reservation schema and channel-manager integration for direct-booking surfacing.' },
  { slug: 'ota-disintermediation-ethics',   title: 'OTA Disintermediation: The Ethics and the ROI',                                     sector: 'Hotels and Hospitality', sectorSlug: 'hotels', regulator: 'Booking economics', status: 'in-preparation', excerpt: 'Why OTA-substitution is structural strategy, not competitive aggression.' },

  // ─────────── REAL ESTATE & FINANCE · 10 slots ───────────
  {
    slug: 'sec-reg-fd-pre-ipo-2026',
    title: 'SEC Regulation FD and the Pre-IPO Digital Footprint: A Checklist for 2026 Listings',
    sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance',
    regulator: 'SEC Reg FD · FCA Listing Rules',
    status: 'published',
    excerpt: 'Pre-IPO content protocol for listings on NYSE, Nasdaq, LSE Main Market, and DFM. The 18-month digital-footprint timeline that produces zero-incident outcomes.',
    readingTime: '8 min read',
    publishedDate: '2026-04-24',
    body: `A piece of digital content published at the wrong moment, with the wrong framing, is not an SEO mistake. It is an SEC Regulation FD violation. The same is true under FCA Listing Rules for UK-listed companies, FCA-MAR for any London-listed equity, and the Dubai Financial Services Authority Conduct of Business Module for DFM listings. Every content decision in the 18 months before a listing carries either the upside of a clean public debut or the downside of a regulatory inquiry that forces price-sensitive correction.

The upside path is buildable. It requires structural discipline, not magic.

The 18-month pre-IPO content protocol.

Months 18 to 12 before the prospectus filing window: brand-foundation phase. The objective is to establish the entity's digital existence as a credible operating business across every relevant search surface (Google, Bing, ChatGPT, Perplexity, Google AI Overviews, and Wikipedia), without making any forward-looking claim that might constitute a financial promotion.

The content built during this phase covers science, operations, market context, and team. None of it is forward-looking. None of it makes a price-sensitive claim. The compliance review is light because the content is purely descriptive. The SEO objective is breadth: become the canonical online source about the entity's domain, products, and leadership.

Months 12 to 6: silence-window discipline. As the prospectus drafting begins, every piece of new content must be reviewed against the FCA Listing Rules silence period and SEC Reg FD selective-disclosure prohibition. The team that wrote freely in months 18 to 12 now writes only what has been pre-cleared by counsel.

The riskiest content surfaces in this window are LinkedIn posts from senior leadership, Instagram and Twitter activity from the founder personally, and any "thought leadership" article that drifts toward forward-looking statements. A single LinkedIn comment from a CFO about "expected ARR growth" can trigger an SEC inquiry. The protocol is: every public communication, including personal social media, passes through a pre-clearance review.

Months 6 to 0: pre-prospectus through filing. Public communications are limited to pre-cleared, factually conservative content. Wikipedia presence is solidified, but only with verifiable, third-party-sourced facts. Knowledge panels are stabilised but not "managed" in any way that could read as orchestrated information disclosure.

The post-listing window: 30-day quiet period.

The first 30 days post-listing are when most regulatory incidents happen. New leadership wants to celebrate. Marketing teams want to amplify. The discipline is to keep all communications within the pre-cleared boundary set out in the listing prospectus. The 96% IPO performance of CG Oncology, verified per SEC filings (Tamazia client), was achieved with a content programme that maintained the same compliance discipline post-listing as it did pre-listing. Zero compliance incidents. The discipline is the result.

The technical infrastructure required.

Three pieces of technical infrastructure support the protocol. First, a content register. Every piece of public-facing content, from blog posts to LinkedIn updates to interview transcripts, is logged with timestamp, author, pre-clearance status, and approving counsel. This register is the entity's primary defence in any subsequent SEC or FCA inquiry.

Second, a takedown architecture. If a content piece is identified post-publication as creating regulatory exposure, it must be removable within minutes, not hours. WordPress with manual review does not meet the standard. A purpose-built CMS with role-based publishing controls and instant-rollback does.

Third, AI-search monitoring. Daily checks of how the entity surfaces in ChatGPT, Perplexity, and Google AI Overviews. AI engines occasionally hallucinate financial details. If an AI engine starts answering "What is [company]'s expected revenue?" with an invented number, that hallucination becomes a Reg FD problem the moment a journalist or analyst cites it. Detecting the hallucination within 24 hours and getting it corrected at the AI-engine source is the protocol.

What this is not.

This is not a marketing programme dressed in compliance language. The compliance is the programme. Every content decision is a regulatory decision first and an SEO decision second. The two are not in tension when the protocol is built correctly.

The agencies that succeed in pre-IPO work are the ones who have read the rulebook before the engagement begins. The credential is not a line on a pitch deck. It is the reason the team is configured the way it is. An LLM in International Business Law is not a marketing asset. It is the operational floor.

Your digital agency is either a compliance asset or a compliance risk. There is no middle position.`,
  },
  { slug: 'rera-trakheesi-uae-checklist',  title: 'RERA Law No. 7 of 2013: UAE Property Advertising SEO Compliance',                     sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'RERA · Trakheesi',   status: 'in-preparation', excerpt: 'UAE property listing SEO that survives both RERA and Trakheesi review.' },
  { slug: 'fca-cobs-4-content-review',     title: 'FCA COBS 4: Wealth Management Content That Survives Compliance Review',                sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'FCA COBS 4',         status: 'in-preparation', excerpt: 'Financial-promotion content under FCA COBS 4 fair-clear-not-misleading rules.' },
  { slug: 'nyse-listing-18-month-content', title: 'NYSE Listing Preparation: The 18-Month Digital Content Protocol',                       sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'SEC Reg FD',         status: 'in-preparation', excerpt: 'Pre-listing content discipline tested across multiple NYSE IPOs.' },
  { slug: 'virtual-tour-international',    title: 'Virtual Tour SEO and International HNW Buyer Targeting',                                sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'Schema · Hreflang',   status: 'in-preparation', excerpt: 'Cross-border buyer SEO via virtual-tour structured data.' },
  { slug: 'family-office-discreet-seo',    title: 'Family Office Content Strategy: Why Discretion Does Not Mean Invisibility',             sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'Privacy + AI search', status: 'in-preparation', excerpt: 'Authority-building for institutions that cannot publish loudly.' },
  { slug: 'pre-ipo-social-reg-fd',         title: 'Pre-IPO Social Media: Reg FD Applied to LinkedIn and Instagram',                        sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'SEC Reg FD',         status: 'in-preparation', excerpt: 'How to keep founder-CEO social activity Reg FD-compliant.' },
  { slug: 'sec-reg-fd-2024-2026',          title: 'SEC Regulation FD Violations on Content Sites: 2024-2026 Enforcement Patterns',         sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'SEC Reg FD',         status: 'in-preparation', excerpt: 'Recent enforcement decisions and what they signal for content compliance.' },
  { slug: 'uhnw-investor-funnel',          title: 'UHNW Investor Journey: Where Organic Search Enters the Deal Funnel',                    sector: 'Real Estate, Finance & IPOs', sectorSlug: 'real-estate-finance', regulator: 'B2B funnel',         status: 'in-preparation', excerpt: 'When SWF and family-office allocators search, and what they search for.' },

  // ─────────── F&B · 10 slots ───────────
  { slug: 'maps-citation-architecture',    title: '30,000 to 40,000 Citations: The Maps Architecture That Dominates a City',              sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Google Maps · NAP',   status: 'in-preparation', excerpt: 'Citation-architecture math for restaurant-group local-pack dominance.' },
  { slug: 'menu-schema-rich-results',      title: 'Menu Schema Markup: The Rich-Result Opportunity Most Restaurants Ignore',              sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Schema.org Menu',     status: 'in-preparation', excerpt: 'Menu schema implementation that returns rich results in Google search.' },
  { slug: 'deliveroo-uber-eats-roi',       title: 'Deliveroo and Uber Eats: Commission Structure vs Direct Ordering ROI',                  sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Platform economics', status: 'in-preparation', excerpt: 'Substitute economics for direct ordering against delivery aggregators.' },
  { slug: 'reservation-platform-stack',    title: 'Reserve-a-Table Integrations: Google, OpenTable, SevenRooms',                            sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Schema · Booking',    status: 'in-preparation', excerpt: 'Restaurant reservation tech stack that converts both organic and brand search.' },
  { slug: 'michelin-starred-seo',          title: 'Michelin-Starred SEO: Authority Building Without Dilution',                              sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Brand authority',     status: 'in-preparation', excerpt: 'Top-tier restaurant SEO that preserves the prestige register.' },
  { slug: 'event-calendar-seo',            title: 'Event Calendar SEO: Private Hire and Function Booking Funnels',                          sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Schema · Event',     status: 'in-preparation', excerpt: 'Private-hire revenue capture via event calendar structured data.' },
  { slug: 'dark-kitchens-multi-brand',     title: 'Dark Kitchens and Brand SEO: The Multi-Brand Indexing Problem',                          sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Schema.org Org',     status: 'in-preparation', excerpt: 'Cloud-kitchen brand differentiation in a single-address Google index.' },
  { slug: 'bar-pub-near-me',               title: 'Bar and Pub Local Pack: How to Win "Near Me" Without a Photographer',                   sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'GBP · Local SEO',     status: 'in-preparation', excerpt: 'Local-pack ranking for hospitality without large photography budgets.' },
  { slug: 'food-directory-roi-25',         title: 'Food Directory Listings: 25+ Platforms Ranked by ROI',                                   sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Directory citation', status: 'in-preparation', excerpt: 'Cost-vs-impact ranking of UK / US / UAE food-directory platforms.' },
  { slug: 'fine-dining-review-policy',     title: "Fine Dining Review Acquisition: Within Google's Policy, Outside of Fake Reviews",        sector: 'Restaurants, Bars & F&B', sectorSlug: 'food-beverage', regulator: 'Google policy',      status: 'in-preparation', excerpt: 'Compliant review-flow design for high-trust hospitality brands.' },

  // ─────────── EVERY SECTOR · 10 slots ───────────
  { slug: 'international-student-seo',     title: 'International Student Recruitment SEO: Source Markets and Landing Page Funnels',         sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'Hreflang · ASA CAP',  status: 'in-preparation', excerpt: 'Source-market keyword targeting for university and EdTech admissions funnels.' },
  { slug: 'private-school-content',        title: 'Private School Admissions Content: Safeguarding Compliance Meets E-E-A-T',                sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'Safeguarding · ICO',  status: 'in-preparation', excerpt: 'Admissions content that survives both safeguarding review and Google E-E-A-T.' },
  { slug: 'luxury-retail-ecommerce',       title: 'Luxury Retail E-commerce: Product Schema vs Brand Authority Debate',                      sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'Schema.org Product',  status: 'in-preparation', excerpt: 'Conditional brand-vs-product schema strategy for luxury retailers.' },
  { slug: 'car-dealership-citations',      title: 'Car Dealership Map Citations and Inventory-Level Ranking',                                sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'Schema · GBP',        status: 'in-preparation', excerpt: 'Inventory-level vehicle ranking via Google Vehicle Listings.' },
  { slug: 'wellness-spa-asa',              title: 'Wellness and Spa SEO: Medical Claim Liability in the ASA-Adjacent Zone',                   sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'ASA CAP · MHRA',     status: 'in-preparation', excerpt: 'Wellness content compliance in the gray zone between hospitality and health.' },
  { slug: 'personal-trainer-seo',          title: 'Personal Trainer Online Presence: What Actually Ranks for "[City] Trainer"',              sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'GBP · Local SEO',     status: 'in-preparation', excerpt: 'Single-practitioner local SEO mechanics for service-based businesses.' },
  { slug: 'executive-personal-brand-seo',  title: 'Executive Personal Brand: Google Page One for Your Name',                                  sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'Wikipedia · LinkedIn', status: 'in-preparation', excerpt: 'Owned-property page-one architecture for executives, founders and partners.' },
  { slug: 'wikipedia-strategy-founders',   title: 'Wikipedia Strategy for Founders: Notability, Conflict of Interest, SEO',                   sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'Wikipedia COI',       status: 'in-preparation', excerpt: 'Founder Wikipedia presence built within the editorial conflict-of-interest rules.' },
  { slug: 'crisis-suppression-legal-seo',  title: 'Crisis Reputation Management: Legal SEO Suppression vs Removal',                           sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'GDPR Art. 17 · DMCA', status: 'in-preparation', excerpt: 'Legitimate content-displacement architecture for reputation recovery.' },
  { slug: 'linkedin-seo-executives',       title: 'LinkedIn SEO for Executives: Profile, Article, Newsletter Ranking Stack',                  sector: 'Every Sector', sectorSlug: 'every-sector', regulator: 'LinkedIn algorithm',  status: 'in-preparation', excerpt: 'Three-layer LinkedIn ranking architecture for senior practitioners.' },
];
