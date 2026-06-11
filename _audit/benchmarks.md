# Benchmark research · remodel 2026-06 (target ≥100 sources)

Format per row: SOURCE | CATEGORY | TECHNIQUE | APPLICABILITY (direct / adapt / reject).
Sections land as research agents complete. Load-bearing findings marked ⭐ in syntheses.

---

## 1 · B2B SaaS design systems (18 sources)

SOURCE: https://stripe.com | b2b-saas | Ornament quarantined to hero — gradient lives only behind hero; every content section flat white/#F6F9FC with all-caps colored eyebrows; hard stats ("US$1.9tn processed", "99.999% uptime") get a dedicated band ~4 sections down, not crammed into the hero. | adapt — quarantine gold-foil treatment to the Tamazia hero; flat ivory content sections with gold caps eyebrows.

SOURCE: https://stripe.com (logo carousel + case tiers) | b2b-saas | Trust layered, not dumped — 15-logo carousel right after hero, then case studies embedded inside each audience tier, so proof recurs at every scroll depth. | adapt — keep "proof at every depth" (credential strip after hero, one named engagement stat per section); static row, no auto-carousel.

SOURCE: https://www.designmd.run/blog/stripe-design-system-breakdown | b2b-saas | One variable typeface; near-black avoided (dark navy #0A2540 on white); strict 4/8pt spacing; tracking tightened only on massive hero headlines, body line-height generous. | adapt — use deep oxblood (never #000) for body on ivory; 8pt base; reject single-typeface monism (Playfair/Inter is the brand).

SOURCE: https://linear.app | b2b-saas | Numbered editorial sections "1.0/2.0/3.0" down a strictly linear scroll; hero carries zero social proof; testimonials + "33,000 teams" held back until just before footer. | direct — numbered caps markers ("01 — Mandate") map onto one-page anchor nav as editorial folios.

SOURCE: https://linear.app/now/behind-the-latest-design-refresh | b2b-saas | "Don't compete for attention you haven't earned"; "structure should be felt not seen" — nav de-emphasized, separators softened, near-monochrome. | adapt — felt-not-seen for anchor nav + hairline gold rules; reject monochrome dark palette.

SOURCE: https://blog.logrocket.com/ux-design/linear-design/ | b2b-saas | One-dimensional sequential scroll: no zig-zag, one subject per section, minimal decision points; dark backgrounds from brand color at 1-10% lightness, never pure black; gradients as faux detail. | direct — sequential one-subject-per-section is the Tamazia spine; dark bands derive from oxblood.

SOURCE: https://vercel.com | b2b-saas | Quantified proof inside hero — under the CTAs sit named-customer metrics ("Runway: 7m → 40s builds"); motion functional only. | direct — one/two named numeric outcomes directly under the hero CTA; never animate headlines decoratively.

SOURCE: https://seedflip.co/blog/vercel-design-system | b2b-saas | Geist tokens: scale 12/14/16/18/24/32/48/64; display 48-64px at -0.04em, lh 1.15; 8px grid (4→128); section padding 96-128px vertical; no gradients on core UI, no shadows on marketing. | adapt ⭐ — take 96-128px section rhythm + 8px grid + 1.1-1.2 display line-height; REJECT -0.04em for Playfair (serif keeps ~0 to -0.01em; tight tracking is grotesk-specific).

SOURCE: https://www.notion.com | b2b-saas | Prestige logo wall as section #2 right after dual-CTA hero; superlative stats ("100M users", "#1 on G2 3 years") saved for a closing band near footer; all-caps eyebrows gate sections. | direct ⭐ — the bracket structure: credibility right after hero, hard numbers as the closing argument.

SOURCE: https://www.intercom.com | b2b-saas | Centered minimal hero; explicit "Trusted by:" label introducing exactly five logos directly under the CTAs; only ~7 sections total. | direct ⭐ — labeled five-mark trust line under the CTA; low section count.

SOURCE: https://www.intercom.com/blog/how-and-why-we-refreshed-our-brand/ | b2b-saas | Custom serif display ("warm but opinionated") reserved for headlines over a workhorse sans; illustration demoted; motion only to tell how the product works. | direct ⭐ — strongest validation of Playfair-display/Inter-everything-else; serif never in UI, labels, body.

SOURCE: https://www.loom.com | b2b-saas | Single-CTA hero with a specificity stat ("Millions across 400,000 companies") directly above the logo carousel. | adapt — one primary CTA + one specific scale claim under it; reject in-hero auto-carousel.

SOURCE: https://www.rippling.com | b2b-saas | Conversion-maximalist hero: email-capture as primary CTA + three rating badges (Software Advice 4.9★, PC Mag, Capterra) under it. | reject ⭐ — hero email field + star-badge clutter reads transactional/down-market for compliance luxury.

SOURCE: https://www.brex.com + the-brandidentity.com Studio Freight rebrand | b2b-saas | Defined color-blocking ratios of accent to neutrals; "seriously optimistic" tone — money "isn't a joke" but not humorless. | adapt — write the ratio rule: gold ≤10% of any viewport, oxblood ≤30%, ivory dominant.

SOURCE: https://clerk.com | b2b-saas | Spartan hero, one CTA; "Trusted by fast-growing companies" logo row as the literal next block; NAMED-principal testimonials (Vercel/Stripe/Supabase execs) two-thirds down. | adapt ⭐ — named-principal quotes (GCs, founders, full names/titles) outweigh star ratings for this audience.

SOURCE: https://resend.com | b2b-saas | Near-black developer minimalism, monospace accents, almost no marketing furniture. | reject — polar opposite of ivory editorial luxury; keep only the restraint lesson.

SOURCE: https://www.alfdesigngroup.com/post/saas-hero-section-best-practices | b2b-saas | Hero numerics: H1 5-10 words at 48-72px; exactly one primary CTA above fold; social proof adjacent to/below CTA "where it reduces hesitation"; mobile CTA ≥44px, near-full-width. | direct ⭐ — numeric guardrails for the Tamazia hero.

SOURCE: https://www.klientboost.com/landing-pages/saas-landing-page/ + launchwall.online | b2b-saas | 2025-26 audit: every top page has named logos/counts/attributed quote visible without scrolling; 6-8 grayscale logos in a uniform trust bar; single-focus CTA. | direct ⭐ — specificity-over-vagueness; monochrome (gold/oxblood-tinted) badge strip.

**Synthesis 1 (B2B SaaS) — adopt:** (1) ⭐ 96-128px desktop section rhythm on 8px grid; (2) ⭐ serif-display-only typographic contract; (3) ⭐ ornament quarantined to hero, flat ivory sections; (4) numbered sequential sections as anchor folios; (5) ⭐ labeled monochrome trust line directly under hero CTA + superlatives reserved for a closing band. **Reject:** hero email-capture/star-clutter (Rippling), dark dev-minimalism, negative tracking on serif display, auto-carousels, 10+ section depth.

---

## 5 · Scroll density + viewport + CWV + typography (25 sources)

SOURCE: stripe.com | scroll-density | 12 sections over ~9-10 viewports ≈1.2-1.3 blocks/100vh; logo carousel = section 2; 4-stat block at section 4. | direct.
SOURCE: linear.app | scroll-density | 13 sections; 1 CTA; testimonials deferred to section 11; ~1 message/100vh, proof via product visuals. | adapt — substitute case-evidence per scroll.
SOURCE: mercury.com | scroll-density | Testimonials with portraits at ~25% depth; 3-4 feature cards per section → 3-4 messages/100vh in feature zones; 4-stat trust block at section 8. | direct ⭐ — 3-4-cards-per-section rhythm tightens density without page length.
SOURCE: webflow.com | scroll-density | Trust baked into hero subhead ("Trusted by over 300k teams"); logo bar section 2; metric-led quotes section 5. | direct ⭐ — number-bearing proof line in hero subhead.
SOURCE: figma.com | scroll-density | 12-logo wall = section 2; quotes interleaved at sections 4 + 11. | adapt.
SOURCE: ramp.com + nuoptima + abmatic | scroll-density | Logos + 4 stats land by section 3; decision-critical content in first 20-40% scroll. | adapt ⭐ — homepage ~5-7 viewports; everything decision-critical in first 2.
SOURCE: elementary#1515 + savvy.co.il dvh | scroll-density | 100vh heroes break scroll affordance; 80-90svh shows next section's edge; svh on mobile (URL bar). | direct ⭐ — cap hero ~85-90svh.
SOURCE: tailwindcss.com/docs/responsive-design | viewport | sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536, mobile-first. | direct ⭐ — canonical ladder.
SOURCE: Polaris tokens | viewport | xs 0 / sm 490 / md 768 / lg 1040 / xl 1440; 490 = large-phone tier. | adapt.
SOURCE: IBM Carbon 2x grid | viewport | Columns halve down-tier (16→8→4); hard content max-width. | adapt.
SOURCE: USWDS layout grid | viewport | Stack-first by default; unstack at 640-880. | direct ⭐ — 2-col→1-col policy ~640-768.
SOURCE: BrowserStack/Framer/LogRocket surveys | viewport | Real-site set 480/768/1024/1280; collapse at 768; containers 1200-1440 at 65-75ch. | direct.
SOURCE: web.dev quintoandar-inp | cwv | INP 1006→216ms via yield points + removing third-party pixels; +36% conversions. | adapt — keep islands tiny, no third-party on critical path.
SOURCE: web.dev fotocasa-cwv | cwv | INP 440→64ms via state colocation; defer analytics with idlefy; +27% leads. | adapt ⭐ — defer analytics to idle.
SOURCE: web.dev economic-times | cwv | TBT 3260→120ms via PartyTown/requestIdleCallback; bounce -50%. | adapt.
SOURCE: addyosmani fetch-priority | cwv | fetchpriority="high" on LCP image: Etsy +4% LCP site-wide, Google Flights -700ms. | direct ⭐ — one-line hero win.
SOURCE: Shopify Early Hints + Cloudflare | cwv | Preload exactly 2-4 critical resources; over-hinting degraded mobile. | adapt ⭐.
SOURCE: debugbear font preload | cwv | Preload above-fold WOFF2: LCP -32%; Latin subsetting 400→140KB. | direct.
SOURCE: Telegraph CLS case | cwv | Reserved slots for late content: CLS ~250% better; unsized images = ~60% of CLS. | direct ⭐ — width/height or aspect-ratio everywhere.
SOURCE: utopia.fyi fluid scales | typography | Dual-ratio scale: 1.2 @320 → 1.333 @1500; fixed step index per heading. | direct ⭐.
SOURCE: smashingmag + adrianroselli zoom | typography | clamp() fails WCAG 1.4.4 when vw term dominates — text must reach 200% under zoom; keep rem dominant. | direct ⭐ — audit every clamp.
SOURCE: web.dev font-best-practices | typography | WOFF2 only; preload bypasses unicode-range (preload critical subset only); swap w/ preload. | direct.
SOURCE: Chrome font-fallbacks + fontaine/capsize | typography | size-adjust + ascent/descent/line-gap overrides → metric-matched fallback, ~0 CLS swap (Georgia↔Playfair, Arial↔Inter). | direct ⭐.
SOURCE: css-tricks + pimpmytype + WCAG 1.4.12 | typography | Caps labels +0.05-0.1em (never negative small); body lh ≥1.5; display 1.1-1.2. | direct.
SOURCE: typewolf playfair + pairing guides | typography | Playfair is a Didone — hairlines degrade below ~24px; Inter carries small sizes. | direct ⭐ — hard floor: Playfair only ≥24-28px.

**Synthesis 5:** density target 1.5-2 blocks/100vh over 5-7 viewports; hero ≤85-90svh with a trust number in the subhead; credential band in viewport 1-1.5; canonical breakpoints 640/768/1024/1280 (collapse at 768, container 1200-1280); CWV moves = fetchpriority hero asset + preload 2 font subsets + zero-CLS dimensions; type = dual-ratio clamp scale (zoom-safe, rem-dominant), Playfair ≥24px floor, caps +0.06em, metric-matched fallbacks via size-adjust.

---

## 2 · Legal / compliance / professional services (16 sources)

SOURCE: https://www.mishcon.com/ | legal-compliance | Emotive ownable tagline over film hero; trust via one scale sentence (no badges); didone serif reserved for rare editorial moments; only 3 uppercase rules sitewide, labels tracked ~2px; ~8 airy sections. | adapt — restraint formula maps to Playfair+Inter; Tamazia inverts ratio, serif leads.
SOURCE: https://www.mishcon.com/services/reputation-protection | legal-compliance | 12+ Chambers/Legal 500 quotes ("…— Legal 500, 2026") italic, placed ~60% down AFTER services explained; single named Key Contact card w/ direct email; 11-item services list. | direct ⭐ — quote-with-source-and-year + one named lawyer contact card = authority anatomy for a lawyer-led agency.
SOURCE: https://www.linklaters.com/ | legal-compliance | Unattributed "#1 global legal team" tagline; 19-sector mega-menu. | reject ⭐ — sourceless superlatives read inflated; thin mega-menus advertise smallness at boutique scale.
SOURCE: https://www.linklaters.com/en/services/antitrust… | legal-compliance | Rankings as terse badge strip, zero prose ("Band 1 Competition Law — Chambers and Partners 2024"); exactly 3 expert photo cards. | direct ⭐ — "Award — Body, Year" no-prose badge format; capped 3-person expert row.
SOURCE: underconsideration.com + axios.com Freshfields 2024 rebrand | legal-compliance | Dropped heritage crest for geometric all-caps sans — press called it "blanding"; homepage carries no rankings, no client names. | reject ⭐ — strip-everything sans-minimalism is the documented anti-pattern for Tamazia.
SOURCE: https://www.freshfields.com/en/capabilities | legal-compliance | Searchable practice index, 31 practices + 16 industries as plain link lists. | adapt — two-tab Services/Sectors toggle (6-8 items); practice-vs-industry split is the right buyer mental model.
SOURCE: https://www.kroll.com/ | legal-compliance | Trust entirely via ratio + longevity stats ("6 out of 10 Fortune 500", "nearly 100-year history") + definitive-authority line ("the first firm called when…"); no badges, no client names. | adapt ⭐ — "X of top Y" ratio construction + "first firm called" cadence with Tamazia's own denominators.
SOURCE: https://www.controlrisks.com/our-services/crisis-response | legal-compliance | Tenure stat fused into first paragraph ("over 40 years… 5,500 clients… 150 countries") as the only credential; otherwise proof-silent. | adapt — years×clients×jurisdictions one-liner in opening prose; reject total absence of named contacts.
SOURCE: https://www.fticonsulting.com/ | legal-compliance | Mid-page stat band of client-ratio metrics ("Advisor to 99 of the top 100 law firms", "48 of the FTSE100") followed by named-outcome case strip. | direct ⭐ — the two-layer trust block (ratio band → named outcomes) is the strongest portable conversion pattern found.
SOURCE: https://www.fticonsulting.com/uk/services/dispute-advisory… | legal-compliance | 9-card expert grid + contact form pushed to top BEFORE any proof. | adapt — keep 3-4 expert cards; form goes after proof (top-form reads lead-gen, not luxury).
SOURCE: https://quickpro.co/project/fti-consulting-website-redesign/ | legal-compliance | Redesign case: modular blocks + recurring named-expert CTAs + filterable insights → +50% insight engagement, +40% contact visits, +35% organic. | direct — measured proof the modular/expert-CTA pattern converts.
SOURCE: https://ankura.com/solutions/disputes | legal-compliance | Anonymized outcome-headline case ("Global Telecommunications Company — Securing $63.8 Million…"); 16 concise service cards. | direct ⭐ — anonymized-client + hard-number-headline = the answer for confidentiality-bound regulated clients; reject 7-slide carousels.
SOURCE: https://www.schillingspartners.com/ | legal-compliance | "High stakes, *handled.*" rhetorical-minimal pattern repeated per section; zero proof anywhere; static build, no carousels; 24/7 phone banner as sole CTA. | adapt — steal the italic-serif rhetorical cadence + static no-motion confidence; reject zero-proof posture (an SEO agency must show outcomes).
SOURCE: https://www.schillingspartners.com/expertise | legal-compliance | Services framed in outcome verbs ("dismantle smear campaigns", "trace assets"); exclusivity copy ("only business in the world to have assembled this combination"). | adapt — outcome-verb framing layered over crawlable service pages.
SOURCE: https://www.cliffordchance.com/expertise/services/antitrust.html + 2025 brand refresh | legal-compliance | "Directory listings and client comments" section pairing verbatim Chambers/Legal 500 2025 quotes with stacked awards + capability stats; refresh philosophy "We're not changing the legacy… premium quality" — evolution not revolution. | adapt ⭐ — "what the directories say" + awards stack; the simplify-never-startle remodel posture verbatim.
SOURCE: https://www.slaughterandmay.com/services/practices/corporate-and-m-a/ + homepage | legal-compliance | THE master template: "Our credentials" bullet block stacking tiers + league tables + quantified deals (£64.8B 1H 2024); two serif-italic directory quotes as mid-page rhythm breaks; exactly 2 key-contact cards; display-serif/sans-body pairing; single uppercase rule sitewide; motion confined to hero, body static, hover-only. | direct ⭐⭐ — credential-stack + value-quantified work + italic quotes as punctuation + "hero may move, body never does" all transfer one-to-one.

**Synthesis 2 (legal-compliance) — adopt:** (1) ⭐ quote-as-punctuation: italic Playfair third-party/client quotes with "Source, Year" as section rhythm breaks; (2) ⭐ credential stack: one aggregated bullet block, "Award — Body, Year" format, never scattered; (3) ⭐ ratio+tenure trust band mid-homepage followed by quantified outcomes; (4) ⭐ anonymized hard-number case headlines; (5) named-human key contact (the lawyer IS the differentiator). **Reject:** sourceless superlatives; discretion-as-total-silence; enterprise IA theatre (mega-menus, 30-person grids, hero carousels). **Norms confirmed:** caps almost never (1-3 uppercase rules/site, ~2px tracking); 8-12 sections, one idea per viewport; motion = hero only, body static.

---

## 3 · Agencies + trust-signal placement + audit sales pages (19 sources)

SOURCE: https://www.siegemedia.com/ | agency | Proof ladder broad→specific: logo wall → one aggregate dollar claim ("$148,646,000 yearly client traffic value") → metric-first case cards; single repeated CTA. | adapt.
SOURCE: https://beomniscient.com/ | agency | Floor-price disclosed in CLOSING CTA after results ("engagements start at $10,000/mo"); "Those numbers aren't typos" pre-frame. | direct ⭐ — price stated after proof, no form before the number.
SOURCE: https://nogood.io/ | agency | Price anchored inside FAQ ("average retainer above $20,000/month… premium growth partner, not a vendor"); qualification-as-flattery ("We don't take on industries we haven't mastered"). | direct ⭐ — confidence framing for pricing.
SOURCE: https://www.singlegrain.com/ | agency | Founder empathy line ("I know what it feels like to be accountable to revenue numbers") + 24h named-human response promise under CTA. | adapt ⭐ — empathy + response-time promise; drop budget gate.
SOURCE: https://graphite.io/ | agency | Provocative diagnosis replaces case studies ("95% of SEO work is waste. 5% drives all the impact"); sparse recognition-only logos. | adapt ⭐ — diagnosis-before-price makes visitors feel understood.
SOURCE: https://klientboost.com/pricing/ | agency | Zero prices shown; everything gated behind a "free marketing plan" form. | reject ⭐ — the audit-gating anti-pattern; price-on-page beats plan-gated quoting.
SOURCE: https://cxl.com/research-study/trust-seals/ | trust-placement | Eye-tracking: FAMILIARITY beats authenticity; >3-4 badge types reads desperate (−5-8%). | direct ⭐ — only recognized marks (Trustpilot/Google), cap 3 per view.
SOURCE: https://baymard.com/blog/perceived-security-of-payment-form | trust-placement | Perceived security is LOCAL: encapsulate the sensitive module (border/bg) with 1-2 seals inside it; layout bugs erode all trust. | direct ⭐ — wrap the audit-request block in a distinct card; polish is load-bearing.
SOURCE: https://baymard.com/blog/site-seal-trust | trust-placement | Known brands beat real-but-obscure vendors in every survey wave. | adapt — recognition is the mechanism; obscure accreditations → footer.
SOURCE: https://goodui.org/patterns/4/ | trust-placement | 21 A/B tests: repeat testimonials through the WHOLE funnel, visible not tabbed. | direct — thread one quote per scroll-stage incl. beside the request step.
SOURCE: https://www.nngroup.com/articles/trustworthy-design/ | trust-placement | Up-front disclosure of all line items; external-site testimonials trusted more than on-site ones. | direct ⭐ — disclose full £1,500 scope on-page.
SOURCE: trustpilot business case study (Protect Line) | trust-placement | TrustBox widgets: ~14% CTR / 16% conversion lift in A/B. | adapt — founder chose static no-count marks; note for future activation.
SOURCE: subscriptioninsider + exceptionalfrontend grey-logo rationale | trust-placement | Greyscale logo walls: endorsement without competing with CTA salience; proof should LOWER cognitive load. | direct ⭐⭐ — validates the founder's grey/watermark badge treatment exactly.
SOURCE: https://www.getastra.com/pricing | audit-page | Public per-unit pricing ("pentests start at $5,999 per target"), delivery promise, deliverables mapped to named frameworks, sample report in funnel. | adapt ⭐ — publish £1,500 with explicit scope unit; UNGATE the sample.
SOURCE: Centurica sample due-diligence reports (public PDFs) | audit-page | Fully ungated two-tier specimen showing real report anatomy (score, findings summary, 200+ checklist); turnaround framed against buyer's own deadline. | direct ⭐⭐ — the open-redacted-specimen model for the Monzo showcase.
SOURCE: https://accessible.org/sample-accessibility-audit-report/ | audit-page | Redacted real audit with exact column schema published (Issue/Location/WCAG/Risk/Recommendation/Screenshot); interactive prioritized view as the premium layer over flat PDF. | direct ⭐⭐ — show the schema; the LIVE interactive sample is the differentiator a PDF can't match.
SOURCE: https://accessible.org/pricing/ | audit-page | Transparent per-page audit pricing ($1,250-$2,750 typical) justified by NAMED methodology, not fear; paid expedite as separate SKU. | direct ⭐ — same price point as £1,500; justify via methodology + checkpoint count.
SOURCE: https://agencyanalytics.com/blog/how-much-to-charge-seo-audit | audit-page | Hybrid model: flat-fee first audit → retainer to work through issues. | adapt ⭐ — formalize as explicit credit mechanic ("credited against the retainer if you proceed").
SOURCE: https://sitechecker.pro/interview-marie-haynes/ | audit-page | Scarcity-priced expert audit ($4,000, waiting list); deliverable framed vs quality-rater guidelines. | adapt — "we take N audits per month" capacity line is credible; price stays fixed.

**Synthesis 3 — five pricing-copy patterns:** (1) ⭐ price after proof, never behind a form; (2) ⭐ confidence framing ("partner, not a vendor"); (3) ⭐ diagnosis-before-price empathy line; (4) footprint-matching scope language; (5) ⭐ risk-reversal triplet (named human + response promise + credit mechanic). **Badge scheme:** ⭐ greyscale watermark strip (Trustpilot+Google+Clutch, single ink) directly under hero CTA; ambient grey proof in body; cap 3 trust elements/viewport; obscure marks → footer. **Specimen pattern:** ⭐ open redacted specimen — framed first-page preview inline → "Read the full sample audit" opens the LIVE interactive Monzo audit; 2-3 annotated callouts; deliverables checklist + turnaround + credit line directly beneath.

---

## 4 · Award-winning design + animated icon systems + whitespace (38 sources)

SOURCE: Buttermax — CSSDA Website of the Year 2024 (9.06) | awards | Won top honor on art direction, copy voice, typographic confidence — beat all WebGL entries. | adapt — editorial confidence wins at the highest level; transplant type-led hero + voice.
SOURCE: Cartier Watches & Wonders 2024 — CSSDA Best UI, WOTY runner-up | awards | Jewel-box pacing: slow cinematic reveals, gold-on-dark accents, hairline-framed vignettes. | adapt ⭐ — hairline-framed vignettes + unhurried reveal pacing for oxblood/gold.
SOURCE: Longines Spirit Flyback — CSSDA WOTY top-10 2024 | awards | Heritage storytelling: serif numerals, instrument-precise micro-motion, large voids isolating the product. | adapt — instrument-precision motion suits gold line icons.
SOURCE: ATMOS Lamp (Obys) — CSSDA Best UX 2024 | awards | Swiss grid + expressive type + micro-animation on every state change, zero decorative motion. | direct ⭐ — the Playfair+Inter target register.
SOURCE: Obys "Typography Principles" — Awwwards SOTD; Studio of the Year 2023 | awards | Won on typography alone: display serif at massive scale, baseline-grid rhythm, type IS the imagery. | direct ⭐ — validates type-as-hero.
SOURCE: SavoirFaire© — Awwwards SOTD Mar 2024 | awards | Business-services firm won via editorial layout: oversized serif heads, eyebrow labels, asymmetric column offsets. | direct ⭐ — closest analogue: professional services SOTD via editorial typography.
SOURCE: Cubitts (By Association Only) — Awwwards SOTD + Mobile Excellence | awards | Luxury commerce won with minimal typographic UI, hairline rules, restrained motion. | direct — restraint + transactional UX can win.
SOURCE: Truekind Skincare — Awwwards SOTD 7.47 + CSSDA + GSAP SOTD (Codrops case study) | awards | Serif-editorial + DrawSVG micro-motion; motion "enhances content flow without overpowering". | direct ⭐ — the blueprint to surpass the current gold icons.
SOURCE: Gucci Ancora — Webby 2024 Best Mobile UI | awards | Single signature accent over neutral field; ruthless palette discipline. | adapt — gold appears only at interaction moments.
SOURCE: Sculpting Harmony — Webby 2024 Best Visual Aesthetic | awards | Lush parallax + multi-layer scroll animation. | reject — immersive spectacle is the wrong trust register.
SOURCE: Google Fonts redesign — Webby 2024 Best UI | awards | Huge live type specimens inside a calm utility frame. | adapt — present sector expertise like specimens.
SOURCE: Apple Vision Pro site — Webby 2024 | awards | ONE subtle motion moment per viewport; vast whitespace makes sparse motion read premium. | adapt ⭐ — the one-motion-moment-per-viewport budget.
SOURCE: Raw Materials — Webby 2024 Professional Services | awards | B2B winner: bold type blocks, persistent sidebar nav, color-blocked sections. | adapt.
SOURCE: Shopify Winter '24 Edition — Webby 2024 Business | awards | Changelog reframed as art-directed "edition". | adapt — quarterly regulatory outlook as designed artifact.
SOURCE: The Catch — Webby 2024 Editorial Feature | awards | Scrollytelling with subtle in-view animation that never hijacks scroll. | adapt ⭐ — no-scroll-jacking reveal grammar = motion ceiling.
SOURCE: Dropbox Brand — Webby 2025 Best UX | awards | Guidelines hub demonstrates identity live via interactive specimens. | adapt — frameworks as live specimens, not static lists.
SOURCE: Pinterest Predicts 2025 — Webby winner | awards | Annual report as chaptered editorial artifact. | adapt.
SOURCE: AW Portfolio — Webby 2025 Best Home Page | awards | Ever-changing 3D scroll-depth home. | reject — exceeds compliance trust budget.
SOURCE: Amanda Braga (Cappen) — Awwwards editorial pick | awards | Hero-scale type + negative space as the whole composition; rhythm from scale shifts, not boxes. | direct ⭐ — template for section openers.
SOURCE: ComPsych Brand Hub — CSSDA WOTY 2025 nominee | awards | Regulated, unglamorous B2B reached WOTY shortlist via system discipline alone. | direct ⭐ — nearest-industry proof.
SOURCE: Exat Typeface — CSSDA WOTY 2025 nominee | awards | Specimen-site scale gymnastics: one face at every size, grid flips. | adapt — specimen treatment for Playfair stats/pull-quotes/numerals.
SOURCE: Lacoste Members — CSSDA nominee | awards | Polished micro-transitions on tiered cards. | adapt.
SOURCE: Stripe Connect blog + B. De Cock + Lokesh Dhakar teardowns | icon-systems | Cloned-SVG stroke draw: duplicate path stacked on base, stroke-dasharray = path length, animate dashoffset→0 on hover; animate ONLY transform/opacity; <500ms; cubic-bezier(.2,1,.2,1). | direct ⭐⭐ — THE upgrade for the gold line icons: muted-gold base, brighter-gold clone draws over on hover.
SOURCE: Lordicon (43,900+ icons) | icon-systems | Trigger taxonomy: in-view, hover, click, loop, loop-on-hover, morph, sequence. | adapt ⭐ — steal the taxonomy (in-view draw once, hover replay); reject Lottie weight + stock look.
SOURCE: useAnimations | icon-systems | Micro state-transition icons: animation encodes a STATE CHANGE, never decoration. | adapt — menu, chevrons, form ticks.
SOURCE: CSS-Tricks "How SVG Line Animation Works" | icon-systems | Canonical dasharray/dashoffset recipe; pathLength normalization makes durations uniform. | direct ⭐ — normalize pathLength="1" so every icon shares one timing spec.
SOURCE: SVGenius + Effect.Labs guides | icon-systems | IntersectionObserver once-trigger; staggered multi-path draws with incremental delays. | direct ⭐ — staggered stroke-by-stroke draw on first viewport entry = the premium signature.
SOURCE: SVG Animation Encyclopedia 2025 benchmarks | icon-systems | transform/opacity: 60fps @ ~5% CPU; animating fill/stroke COLOR: 32fps @ 60% CPU mobile; morph: 28fps; SMIL deprecated. | direct ⭐⭐ — hard constraints: draw via dashoffset, never animate fill, static under reduced motion.
SOURCE: Linear "A calmer interface" | icon-systems | Polish-by-subtraction: fewer icons, smaller, removed colored backgrounds. | adapt ⭐ — premium-vs-gimmicky calibration.
SOURCE: NN/g durations + web.dev easing + Val Head | icon-systems | Hover 100-200ms; transitions 200-500ms; ease-out entrances, ease-in exits, never linear. | direct ⭐ — numeric guardrails wholesale.
SOURCE: Pracejus/Olsen/O'Guinn, J. Consumer Research v33 "How Nothing Became Something" | whitespace | EMPIRICAL: greater whitespace around an object raises perceived quality, prestige, trust. | direct ⭐⭐ — the license: the void itself is the trust signal.
SOURCE: NN/g Anatomy of Good Design pt.2 (Aesop/MoMA) | whitespace | Asymmetric placement inside a strict modular grid creates energy; key element 30-50% larger than peers. | adapt ⭐ — asymmetry inside strict grid + scale jumps = composed, not empty.
SOURCE: TYPZA 10 minimalist luxury sites (The Row, Hermès, Totème…) | whitespace | Gallery-hang spaciousness; editorial whitespace + ONE bold color block; print-magazine grid with measured scroll rhythm. | adapt ⭐ — hang each block like a gallery piece; oxblood plays Hermès' color-block role.
SOURCE: Vox Illustration dead-space-vs-whitespace + IxDF | whitespace | ACTIVE space is asymmetric and aligned to an anchor (edge/baseline/rule); DEAD space is symmetric leftover anchored to nothing. | direct ⭐⭐ — the audit test for every void.
SOURCE: CFPB/VA design systems eyebrow pattern | whitespace | Uppercase letterspaced mini-label above the headline anchors large voids; visual only, never a semantic heading. | direct — gold eyebrow + hairline = the tether that makes a half-empty viewport deliberate.
SOURCE: Aesop case studies (work.co) | whitespace | Whitespace as router: curated editorial doorways instead of dense menus; ~300% perceived-value lift (directional). | adapt.

**Synthesis 4 — icon spec to build (M6):** static gold base + cloned path, pathLength=1, dashoffset 1→0; triggers: in-view once (staggered 90-120ms/path, 600-900ms total), hover redraw 300-400ms brighter gold, state toggles 150-200ms; easing cubic-bezier(.2,1,.2,1) entrances; max 3 icons concurrent, ~120ms sibling cascade; NEVER animate fill/morph; reduced-motion = fully drawn + 150ms opacity crossfade; no Lottie/GSAP runtime; animation must encode meaning (drawing = craftsmanship, transition = state), one motion moment per viewport. **Whitespace rules (M4):** (1) anchor every void with exactly one anchor (hairline/eyebrow/figure edge); (2) asymmetry inside a strict grid, dominant element +30-50% scale; (3) budget ~50-60% ivory in hero viewports, ~40% in index sections; (4) whitespace as router + alternate dense/statement sections so pacing reads as luxury.

---
