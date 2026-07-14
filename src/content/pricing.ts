// Pricing · 3 tiers · verbatim live tamazia.co.uk (TAMAZIA-13 §6)
// Full feature lists restored. Authority "Most popular" ribbon. Enterprise mandate callout.

export const pricingContent = {
  eyebrow: '',  /* A5 · was 'TAMAZIA · Pricing'; Interstitial supplies numeral + theme */
  h2: 'Pricing',
  // Founder directive 2026-06-11: the pricing section sells the mandates on their own
  // terms. No audit mention, no audit layering (the audit narrative lives on /instrument/).
  // Chosen from 5 drafted candidates (alternates logged in _audit/copy-errors.md appendix).
  intro: 'You are not buying hours. You are retaining a practice. Each mandate is scoped to your footprint: how many locations you operate, how many jurisdictions you sell into, and how closely your regulator reads what you publish. The standard never changes. Nothing leaves the building until it has been reviewed against the frameworks that govern you.',
  microNote: 'Pricing is indicative. Every mandate is scoped to your footprint and jurisdictions before anything is signed.',

  // W14 · one commitment statement, printed under every tier.
  commitmentLine: 'Mandates run on 90-day rolling terms; electing a six-month term unlocks the pilot rate shown. No long-term lock-in.',

  // W35 · one citation schedule, printed once and referenced from each tier.
  citationSchedule: 'Map citations by scope: 5,000 (single location) · 10,000 to 20,000 (multi-location) · 30,000+ (per property, enterprise and GBP Domination).',

  tiers: [
    {
      numeral: 'I.',
      name: 'Foundation',
      price: 'From £2,500',
      priceUnit: '/month',
      priceGbp: 2500,
      priceGbpStandard: 3300,
      savesGbp6: 4800,
      tagline: 'Single-location businesses and small groups building local search authority and compliance defence.',
      idealClients:
        'Single-clinic cosmetic, dermatology, dental practices. Boutique single-property hotels. Independent restaurants and bars. Small estate agencies. Sole solicitors and 2-partner law firms. Financial advisers and executives building professional visibility.',
      description: 'Single-clinic cosmetic, dermatology, dental practices. Boutique single-property hotels. Independent restaurants and bars. Small estate agencies. Sole solicitors and 2-partner law firms. Financial advisers and executives building professional visibility.',
      featuresHeading: 'WHAT IS ALWAYS INCLUDED',
      features: [
        {
          headline: 'The searches your buyers run when ready to act, targeted with commercial precision',
          body: "Keyword strategy built around transactional search behaviour across your sector. The searches a guest runs before booking, a patient before calling, a client before instructing, mapped against your competitors' current positions before a word is written.",
        },
        {
          headline: "Every word your brand publishes reviewed against your sector's legal framework before it goes live",
          body: 'One compliance-reviewed content piece per month. UK: SRA Standards and Regulations (2019) Standards 8.7 and 8.9 (Code of Conduct for Solicitors, RELs and RFLs), MHRA Human Medicines Regulations 2012, FCA COBS 4. US: ABA Model Rules 7.1 to 7.3, HIPAA Privacy Rule 45 CFR 164.508 and 164.502, FTC Act Section 5. UAE: Federal Decree-Law No. 55 of 2023, MOHAP requirements, RERA Law No. 7 of 2013. Reviewed before Google sees it, before a regulator does.',
        },
        {
          headline: 'A complete technical audit with a prioritised fix document delivered to your development team',
          body: 'Core Web Vitals benchmarked: LCP under 2.5s, INP under 200ms, CLS under 0.1. Redirect chains, crawl errors, broken links, robots.txt conflicts, and schema gaps identified and ranked by impact. Delivered as developer instructions, not observations. Updated quarterly.',
        },
        {
          headline: 'Your single most visible local asset optimised to outrank competitors',
          body: 'Full Google Business Profile optimisation for one location: categories, attributes, posting schedule, Q&A, photo strategy, and review response system.',
        },
        {
          headline: "Your business information verified across every directory your sector's buyers trust",
          body: 'Directory citation building with consistent NAP across sector-relevant platforms, legal directories, healthcare registries, hospitality aggregators, food platforms, and property portals.',
        },
        {
          headline: 'Baseline AI search audit: where your brand appears across the platforms reshaping how buyers search',
          body: 'Current presence across Claude, ChatGPT, Perplexity, and Google AI Overviews for your most commercially valuable queries. Documented at engagement start, reviewed quarterly.',
        },
        {
          headline: 'Monthly reporting that attributes organic search to revenue, not keyword positions',
          body: 'GA4 report showing which searches converted to bookings, appointments, or enquiries, attributed to organic search at channel level.',
        },
        {
          headline: 'Your primary operating jurisdiction covered',
          body: 'The exact legal framework of your market applied to every piece of content. Regulatory notification within one week (Regulatory Watch, 72-hour tier, available as an add-on at £1,500 a month).',
        },
      ],
      additionalCapabilitiesHeading: 'Additional capabilities commonly added at this tier',
      additionalCapabilities: [
        'Schema markup for booking systems and product catalogues',
        "Review acquisition programme within your sector's guidelines",
        'Google Maps citation programme (see the citation schedule below)',
        'Competitor keyword gap analysis',
        'Social signals campaign',
        'On-page optimisation extended across additional pages',
      ],
      microFooter: [
        'All work produced belongs to you once paid in full. No rights retained.',
      ],
      cta: 'Book the scoping call',
      ctaHref: 'https://cal.com/tamazia/strategy-call?tier=foundation',
      tier: 'standard',
      mostPopular: false,
    },
    {
      numeral: 'II.',
      name: 'Authority',
      price: 'From £4,500',
      priceUnit: '/month',
      priceGbp: 4500,
      priceGbpStandard: 6000,
      savesGbp6: 9000,
      tagline: 'Multi-location and multi-property brands scaling organic growth across regions and jurisdictions.',
      idealClients:
        'Boutique hotel groups. Law firms with 3 to 10 partners and multiple practice areas. Healthcare and cosmetic groups across 2 to 8 locations. PBSA operators. BTR operators launching new schemes. Mixed-use residential developers selling off-plan to international buyers. Restaurant groups across multiple venues. Estate agencies across multiple branches.',
      description: 'Boutique hotel groups. Law firms with 3 to 10 partners and multiple practice areas. Healthcare and cosmetic groups across 2 to 8 locations. PBSA operators. BTR operators launching new schemes. Mixed-use residential developers selling off-plan to international buyers. Restaurant groups across multiple venues. Estate agencies across multiple branches.',
      includesAllOfPrior: 'Everything in Foundation, included.',
      featuresHeading: 'WHAT IS ADDED AT THIS TIER',
      features: [
        {
          headline: 'Every location, practice area, and service line ranked simultaneously',
          body: '30 keywords targeted across your full commercial footprint. A personal injury practice in Manchester and a corporate team in London both surface for different searches on the same day. A hotel in Mayfair and a property in Dubai Marina visible to guests searching from different countries simultaneously.',
        },
        {
          headline: 'Your Instagram authority grown alongside your rankings',
          body: "Managed audience development for your brand's Instagram presence. Follower growth engineered through sector-aligned engagement, building the social proof that enterprise buyers check before they ever reach your website.",
        },
        {
          headline: 'The strategy that removes dependency on platforms extracting revenue between you and your buyer',
          body: 'Booking.com and Expedia charge 15 to 25% per reservation. Tamazia builds the direct search visibility that intercepts buyers before the platform does, the same approach behind 480% peak client revenue growth over a two-year engagement (verified). Every sector.',
        },
        {
          headline: 'Your brand inside AI-generated answers across the platforms where buyers now make decisions',
          body: 'GEO (Generative Engine Optimisation) included as standard. Content restructured for AI citation eligibility across Claude, ChatGPT, Perplexity, and Google AI Overviews. AI-referred visitors convert at up to nine times organic search (15.9% against 1.76%, Seer Interactive, 2025), and the average AI search visitor is worth 4.4 times an organic one (Semrush, 2025). GEO is included as standard so those visitors arrive at your pages, compliance-reviewed.',
        },
        {
          headline: 'Two jurisdictions reviewed on every piece of content simultaneously',
          body: 'UK and UAE, UK and USA, or UAE and USA. One agency holding both regulatory environments, not two agencies who do not speak to each other.',
        },
        {
          headline: 'Four compliance-reviewed content pieces monthly',
          body: 'Practice areas, property types, service lines, destinations, and clinical procedures covered in a single monthly programme.',
        },
        {
          headline: 'Editorial placements in sector-relevant publications',
          body: 'Two media outreach contacts per month to sector-relevant publications. Placement is earned on editorial merit, not guaranteed. Hospitality: The Caterer. Financial: City A.M., Financial Times.',
        },
        {
          headline: 'Up to three locations fully managed on Google Business Profile',
          body: 'Each profiled separately with its own category strategy, posting schedule, and review management.',
        },
        {
          headline: 'Regulatory monitoring across both jurisdictions: 72-hour notification',
          body: 'Regulatory Watch included: 72-hour alerts with the exact page, rule, impact and change required. Content in the affected market updated within one week.',
        },
        {
          headline: 'Bi-weekly reporting with revenue attribution across all locations',
          body: 'GA4 backed reporting. Delivered monthly with a senior strategy call. Quarterly board-ready executive review.',
        },
      ],
      additionalCapabilitiesHeading: 'Additional capabilities commonly added at this tier',
      additionalCapabilities: [
        'International traffic programme: UK, UAE, USA, and EU audiences',
        'Review removal and reputation recovery',
        'Legal directory listings: Chambers, Legal 500, Avvo',
        'Multi-location map citation programme (see the citation schedule below)',
        'LinkedIn SEO for partners and executives',
        'OTA dependency reduction programme',
      ],
      microFooter: [
        'The team that works on your account does not rotate. Nothing leaves the firm without legal review.',
      ],
      cta: 'Book the scoping call',
      ctaHref: 'https://cal.com/tamazia/strategy-call?tier=authority',
      tier: 'elevated',
      mostPopular: true,
    },
    {
      numeral: 'III.',
      name: 'Enterprise',
      price: 'From £9,500',
      priceUnit: '/month',
      priceGbp: 9500,
      priceGbpStandard: 12700,
      savesGbp6: 19200,
      tagline: 'Enterprise and regulated brands requiring full-stack SEO dominance across multiple jurisdictions.',
      idealClients:
        'International hotel groups. Multi-jurisdiction law firms. Listed companies and pre-IPO businesses. Healthcare groups with cross-border operations. Real estate developers targeting international buyers. Financial services enterprises regulated under FCA, DFSA, and SEC simultaneously.',
      description: 'International hotel groups. Multi-jurisdiction law firms. Listed companies and pre-IPO businesses. Healthcare groups with cross-border operations. Real estate developers targeting international buyers. Financial services enterprises regulated under FCA, DFSA, and SEC simultaneously.',
      includesAllOfPrior: 'Everything in Authority, included.',
      featuresHeading: 'WHAT IS ADDED AT THIS TIER',
      features: [
        {
          headline: 'Every market, territory, practice area, and commercial keyword covered simultaneously',
          body: '50 or more keywords targeted across every geography your buyers search from: London, Dubai, New York, and beyond. No location unranked. No practice area generating traffic for a competitor because it was excluded from scope.',
        },
        {
          headline: 'LinkedIn and Instagram authority grown alongside your rankings',
          body: 'Managed audience development across both platforms for your brand and senior team. Follower growth engineered through sector-aligned engagement, building the professional visibility that enterprise buyers and referral partners evaluate before any conversation begins.',
        },
        {
          headline: 'The compliance standard applied to a Nasdaq-listed company, across every jurisdiction',
          body: 'UK GDPR, FCA COBS 4, SRA Rules, HIPAA, MHRA, ASA, ABA Model Rules across all 50 US states, RERA, MOHAP, DFSA, UAE PDPL, and more. This is what produced zero compliance incidents on the largest regulatory stage.',
        },
        {
          headline: 'Your brand established as the source AI systems cite across all major engines',
          body: 'Full AI search dominance campaign. Structured data, entity optimisation, knowledge panel management, Wikipedia strategy, AI results dominance across Claude, ChatGPT, Perplexity, Google AI Overviews, Gemini, and Copilot.',
        },
        {
          headline: 'International SEO across up to five markets with full technical implementation',
          body: 'Hreflang, geo-targeted content, bilingual content where required. Market-specific keyword strategies in each territory.',
        },
        {
          headline: 'Ten compliance-reviewed content pieces monthly',
          body: 'Volume calibrated to your full operational scope. Every piece reviewed across all covered jurisdictions.',
        },
        {
          headline: 'Every location in your portfolio managed on Google Business Profile',
          body: 'No location cap. Hotel groups across three countries. Law firms across four cities. Each managed with its own local strategy.',
        },
        {
          headline: 'Crisis reputation management built before it is needed',
          body: 'Monitoring infrastructure, suppression strategy, and response architecture in place before any incident. Structural protection, not reactive PR.',
        },
        {
          headline: 'Dedicated regulatory monitoring with 24-hour notification',
          body: 'Regulatory Watch included at the 24-hour tier. Law changes tracked across UK, UAE, USA and every country you operate in simultaneously. Content updated within one week.',
        },
        {
          headline: 'Transaction-level revenue attribution across every market',
          body: 'GA4 at transaction level. Monthly senior strategy call. Monthly board-ready executive review.',
        },
      ],
      additionalCapabilitiesHeading: 'Additional capabilities commonly added at this tier',
      additionalCapabilities: [
        'Pre-IPO digital presence protocol: SEC Regulation FD and FCA compliance',
        '50 to 100 location pages built and compliance-reviewed',
        'Per-property map citation programme (see the citation schedule below)',
        'Multilingual SEO in Arabic, French, German, Spanish',
        'Executive personal brand management: Wikipedia, knowledge panel, AI search, LinkedIn',
      ],
      microFooter: [],
      cta: 'Book the scoping call',
      ctaHref: 'https://cal.com/tamazia/strategy-call?tier=enterprise',
      tier: 'enterprise',
      mostPopular: false,
    },
  ],

  // Mandate callout (after Enterprise tier)
  mandateCallout:
    'FOR PRE-IPO PREPARATION, LISTED COMPANIES, AND INTERNATIONAL ENTERPRISE GROUPS, ENGAGEMENT IS STRUCTURED TO MANDATE. SPEAK WITH THE FOUNDER DIRECTLY BEFORE ANY SCOPE IS AGREED.',
  mandateCta: 'Request a private briefing',
  // Founder directive r3: signature removed from the pre-IPO mandate box.
  mandateSignature: '',
};

// Backward-compat shim: current Pricing.astro reads `tier.features` as a string array
// matching the icon map ['Audit','Team','Deliverables','Review']. Until Gate D rewrites
// the component, rename the rich features to `featuresDetailed` and provide simple labels.
pricingContent.tiers.forEach((t: any) => {
  t.featuresDetailed = t.features;
  t.features = ['Audit', 'Team', 'Deliverables', 'Review'];
});

// ---------------------------------------------------------------------------
// Dormant price config (A1d). Single source of truth for every price not yet
// rendered. Mission C/D will read these later. All GBP integers, British
// English. Adding only: nothing above is renamed, removed, or changed.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// COMMERCIAL CONFIG · CANONICAL. This block is the ONE source of truth for every
// commercial figure and every payment/booking destination in the product.
// public/audit/audit-app.js mirrors it (PRICES + STRIPE_LINKS + CAL); the two MUST
// change in the same commit, and tests/commercial-rebuild.test.mjs fails the build
// if they drift. Retainer/mandate prices above (2,500 / 4,500 / 9,500) are NOT
// touched by anything below. British English. GBP integers.
// ---------------------------------------------------------------------------

// Fix Sprints (Route 1) · one-time · severity-based, not count-based.
// FIRST-ENGAGEMENT PRICING: `standard` is the published fee. `offer` is the rate this
// report unlocks, because it is a first engagement with the client. offer = standard / 2,
// exactly, so the struck price is arithmetic rather than decoration.
export interface FixSprintTier {
  standard: number;
  offer: number;
  days: number;
}
export const fixSprintsGbp: Record<'sprint1' | 'sprint2' | 'sprint3', FixSprintTier> = {
  sprint1: { standard: 9800, offer: 4900, days: 14 },
  sprint2: { standard: 17800, offer: 8900, days: 30 },
  sprint3: { standard: 25000, offer: 12500, days: 42 },
};
// Half of the Sprint fee is redeemable against the first retainer/mandate. Stated as arithmetic.
export const fixSprintCreditPct = 50;
export const fixSprintCreditDays = 60;
export const fixPacksLane = 'One fixed price. One fixed timeline. No retainer. The work is owned outright.';

// SCCO Guideline Hourly Rates (Senior Courts Costs Office), England and Wales, in force
// 1 January 2026. Source: HMCTS, gov.uk. Verified 14 July 2026.
// This replaces the invented "a consultancy quotes £25,000+" anchors (E36). We fine other
// firms for unsubstantiated claims under CAP 3.7; every anchor we print is now sourced
// arithmetic, and the source is printed inline beside it.
export const sccoGuidelineRates = {
  band: 'London 1',
  inForce: '1 January 2026',
  source: 'SCCO Guideline Hourly Rates, London 1, in force 1 January 2026',
  sourceUrl: 'https://www.gov.uk/guidance/solicitors-guideline-hourly-rates',
  gradeA: 579,   // Solicitors and legal executives with over 8 years' experience
  gradeC: 305,   // Other solicitors, legal executives and fee earners of equivalent experience
};

// Route 3 · the merged product: £495 unlocks the full report AND includes the first month
// of Regulatory Watch; from month two it is £1,500 a month. The £495 is credited in full
// against any Sprint or mandate within 90 days. realValue = the report's published
// standalone price (entryAuditGbp), which is why the struck anchor is honest.
export interface ExposureReportPricing {
  unlock: number;
  monthlyCover: number;
  realValue: number;
  creditDays: number;
}
export const exposureReportGbp: ExposureReportPricing = {
  unlock: 495,
  monthlyCover: 1500,
  realValue: 1500,
  creditDays: 90,
};

// Entry audit · reference price · the report's published standalone price.
export const entryAuditGbp = 1500;  // Founder r4: audit is £1,500, redeemable into the first package.

// Independent solutions · first-engagement pricing, same doctrine as the Sprints:
// `anchor` is the standard fee, `offer` is what this report unlocks, and anchor = 2 x offer.
// ICP Outreach (E50) and Reputation & Crisis (E51, folded into Regulatory Watch) are DELETED.
export interface IndependentSolutionPricing {
  anchor?: number;
  offer?: number;
  price?: number;
  typical?: number;
}
export const independentSolutionsGbp: Record<string, IndependentSolutionPricing> = {
  websiteRemodelling:     { anchor: 17000, offer: 8500, typical: 12000 },
  aiAuthority:            { anchor: 3800,  offer: 1900 },
  onlinePersonalBranding: { anchor: 5000,  offer: 2500 },
  instagramPresence:      { anchor: 3000,  offer: 1500 },
  ymylContent:            { anchor: 2900,  offer: 1450 },
  gbpDomination:          { anchor: 3000,  offer: 1500 },
};

// ---------------------------------------------------------------------------
// STRIPE · THE ONLY PLACE THE FOUNDER PASTES A PAYMENT LINK.
// No Stripe secret key is held in this repo, so the Payment Links cannot be minted
// from code. Create each product in the Stripe dashboard at the `offer` price above,
// copy its Payment Link URL, and paste it here. Nothing else needs editing on the
// website: audit-app.js and Pricing.astro both read from this map.
//
// An EMPTY string is safe and expected. It never hides a button (that was defect E39,
// which left Route 1 unpurchasable on every live report). An empty URL makes the button
// fall back to the intake modal / booking link, so a payment path ALWAYS exists.
//
// The six core links, per the change map:
//   sprint1  · Fix Sprint I  · Enforcement Clearance          · £4,900 one-time
//   sprint2  · Fix Sprint II · Full Remediation               · £8,900 one-time
//   sprint3  · Fix Sprint III· Remediation + Verified Re-score· £12,500 one-time
//   unlock   · Exposure Report unlock (includes Watch month 1)· £495 one-time
//   watch    · Regulatory Watch                               · £1,500/month subscription
//   remodellingDeposit · Website Remodelling reserve slot     · £1,500 deposit, credited in full
// The six Independent Solution links follow. The previous links were minted at the OLD
// prices and would now charge the wrong amount, so they are cleared, not carried over.
// ---------------------------------------------------------------------------
// LIVE Stripe Payment Links, created 14 July 2026 on acct_1TgF8DHafZjksJ5V (Tamazia), livemode.
// Every commercial CTA on both surfaces resolves here. An EMPTY value never hides a button (that was defect E39):
// the renderer falls back to the intake modal / booking link, so a payment path always exists.
//
// Each one-time price carries its STANDARD price in Stripe metadata (standard_price_gbp) and the discount is
// recorded as discount_reason=first_engagement, so the strikethrough on the page is backed by a real figure in the
// payment processor rather than being decoration.
// ARCHIVED, deliberately: ICP Outreach (E50/W18) and Reputation & Crisis (E51/W19, folded into Regulatory Watch).
export const stripeLinks: Record<string, string> = {
  // Fix Sprints. Standard 9,800 / 17,800 / 25,000 -> first-engagement 4,900 / 8,900 / 12,500.
  // 50% of the fee is redeemable against the first mandate within 60 days.
  sprint1: 'https://buy.stripe.com/8x2eVd7coaSEdHa4oif7i0m',
  sprint2: 'https://buy.stripe.com/cNieVd8gsf8U7iM7Auf7i0n',
  sprint3: 'https://buy.stripe.com/fZu14n68k4uggTm7Auf7i0o',
  // Unlock GBP 495 (standalone GBP 1,500) and it INCLUDES month one of Regulatory Watch.
  // Credited in full against any Sprint or mandate within 90 days, so the buyer's downside is zero.
  unlock: 'https://buy.stripe.com/aFa9AT54gf8UauYcUOf7i0p',
  watch: 'https://buy.stripe.com/fZueVdbsE3qc0UobQKf7i0q',
  // Independent Solutions.
  remodellingDeposit: 'https://buy.stripe.com/00w00j7co8Kw5aEg70f7i0r',
  websiteRemodelling: 'https://buy.stripe.com/00w00j7co8Kw5aEg70f7i0r',   // scoped: the deposit is credited to the build
  aiAuthority: 'https://buy.stripe.com/9B614n40ce4Q46AbQKf7i0s',
  onlinePersonalBranding: 'https://buy.stripe.com/bJe28rfIU4ug6eI5smf7i0t',
  instagramPresence: 'https://buy.stripe.com/eVqdR9eEQ7Gs8mQf2Wf7i0u',
  ymylContent: 'https://buy.stripe.com/8x2dR9dAM3qc9qU8Eyf7i0v',
  gbpDomination: 'https://buy.stripe.com/28EbJ17co1i432wcUOf7i0w',
};

// ---------------------------------------------------------------------------
// BOOKING · every commercial CTA resolves to a real destination (E16 / E54).
// Context params are carried into the call so the booked slot knows which report and
// which intent produced it: ?report={slug}&intent={findings|scoping|sprint|package}
// ---------------------------------------------------------------------------
export const CAL_BOOKING_BASE = 'https://cal.com/tamazia/strategy-call';
export function bookingUrl(report = '', intent = 'findings'): string {
  const q = new URLSearchParams();
  if (report) q.set('report', report);
  q.set('intent', intent);
  return `${CAL_BOOKING_BASE}?${q.toString()}`;
}
