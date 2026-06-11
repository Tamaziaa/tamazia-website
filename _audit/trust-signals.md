# Trust-signal audit + integration spec · P4 (2026-06-11)

## Current state (from recon + P2)
- **No third-party review platform presence anywhere** (Trustpilot/Google/Clutch/G2: zero references; confirmed by grep).
- Internal proof: 100 static ★★★★★ testimonial cards (role + city attribution, quotes truncate at ~200ch with "…" — M3 rebuilds); 3 case studies with verified metrics (Orchid 840% GA4, Meraas zero incidents, CG Oncology +96% per SEC filings); stat band 882% / 400+ / £110M+; founder credentials (LLM King's College London, CIArb); Google Partner + Meta Business Partner badge images (footer + WhyUs; code comment says "until verification confirmed" — founder to confirm at end review); client names text-only (Kamat NSE, CG Oncology Nasdaq: CGON, Meraas Dubai Holding) in hero ribbon/ticker/cases.
- JSON-LD today: LegalService (rich founder/memberOf graph), WebSite, BreadcrumbList. Missing: FAQPage, Service/OfferCatalog. Correctly absent: Review/AggregateRating (no platform data shown).
- Footer legal line: "Tamazia Ltd · Registered in England and Wales · Data Controller… · DPO…" (cin placeholder removed in M1).

## Founder decisions in force
Greyscale/watermarked **5-star marks for Trustpilot, Google, Clutch** — stars + platform marks only, **no review counts, UNLINKED** (founder attests 5★ on all three; "place it at the best place on the website as it's always placed on other websites").

## Benchmark-derived placement spec (sources: benchmarks.md §1 §2 §3)
Evidence: Intercom's labeled trust line directly under hero CTAs (§1⭐); social proof "adjacent to/below the CTA where it reduces hesitation" (Alf §1⭐); greyscale logo walls lower cognitive load and don't compete with CTA salience (subscriptioninsider + exceptionalfrontend §3⭐⭐); cap 3 trust elements per viewport, familiarity beats authenticity (CXL §3⭐); GoodUI: repeat proof through the funnel; Slaughter and May: proof as punctuation, never clutter (§2⭐⭐).

### Component: `src/components/ui/RatingStrip.astro`
- Inline SVG wordmarks: Trustpilot star + "Trustpilot", Google "G" + "Google Reviews", Clutch mark + "Clutch", each followed by five solid stars.
- Single-ink rendering: `--tz-gold` at ~55% opacity on light sections, `--pearl` at ~45% on dark — watermark register, no platform brand colors (founder: grey/watermarked; benchmarks: monochrome ambient proof).
- No counts, no links (founder decision). `aria-label="Rated five stars on Trustpilot, Google and Clutch"`. Height ≤22px desktop / 18px mobile; separators: interpuncts. Static — no animation beyond the section's own reveal.
- Variant prop `tone: 'light' | 'dark'`.

### Placements (exactly three, one per funnel stage)
1. **Hero, directly under the CTA row** (FinalHero, M4 integrates into the founder-box dead-space rebalance): the Intercom/Alf decision-point position. Label-less strip, one hairline above.
2. **Testimonials header** (M3 rebuild): strip sits right of/under the section heading — frames the 100 reviews with platform credibility (GoodUI repeat-through-funnel).
3. **/instrument/ request block** (M2): inside the visually encapsulated audit-request card (Baymard: perceived security is local — 1-2 seals INSIDE the sensitive module), beside the submit button.
Footer keeps the existing Google/Meta partner badges only — a fourth stars placement there would breach the ≤3-per-viewport/desperation threshold (CXL).

## Schema additions (REAL-only, M2)
- **FAQPage** JSON-LD: the 6 homepage FAQ questions/answers (GEO/AI-citation value). New `src/components/schema/FAQSchema.astro`, injected via BaseLayout `extraSchema` on the homepage.
- **Service + OfferCatalog**: three mandates as Offers (Foundation £2,500/mo, Authority £4,500/mo, Enterprise £9,500/mo, GBP, url /#pricing) extending the existing LegalService graph.
- **NO AggregateRating/Review markup** — no counts displayed, badges unlinked; fabricating structured ratings against unverifiable data would be an ASA/CMA + Google-spam exposure for a compliance brand. Revisit only when platform profiles are linked publicly.

## Deferred (activate when founder provides)
- Platform profile URLs → badges become links (NN/g: external verifiability is the trust mechanism).
- Live TrustBox/Clutch widgets with counts (Trustpilot case: ~16% conversion lift) — replaces placement 3's static strip first.
- CRN in footer ("Registered in England and Wales No. XXXXXXXX") when registration completes.
- Google/Meta partner badge verification status — if not verifiable at end review, remove (a compliance brand cannot carry unverifiable badges).
