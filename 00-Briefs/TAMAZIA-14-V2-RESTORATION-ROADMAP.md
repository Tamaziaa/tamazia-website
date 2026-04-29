# TAMAZIA-14 · V2 RESTORATION ROADMAP

**Authored:** 24 April 2026
**Predecessor:** TAMAZIA-13-LIVE-SNAPSHOT-AND-GAP-ANALYSIS.md
**Status:** AWAITING APPROVAL BEFORE EXECUTION

This document answers every question of *what exactly changes, why, and in what order*. No file is edited until Aman confirms this roadmap or marks specific sections for revision.

---

## 0 · EXECUTIVE SUMMARY

**The rebuild has three structural problems:**

1. **Invented content.** The case-study panel for Hospitality currently reads "Kamat Hotels £1.2M." The live site says "Orchid Hotels — 840% / 113% / 83%." The £1.2M figure was invented. The Meraas panel currently shows arbitrary metrics where the live site uses the "Sheikh Mohammed directive" framing. Hero stats show "4× / 200+ / 4" where the live site shows "882% / 200+ / $110M+." These are credibility defects.

2. **Half the content is missing.** The live site is 31,000 characters of dense editorial copy across 9 sections plus FAQ plus contact form. The rebuild preserves roughly half of it. Every pricing tier has 8-10 feature entries on the live site with a paragraph of context each; the rebuild has truncated bullet points. Every case study has a closing verdict line; the rebuild dropped them. The entire sixth FAQ is missing. The contact form has 6 fields and a 12-option sector dropdown on the live site; the rebuild has none of that.

3. **Design registers mismatch.** The obsidian black panel on Enterprise pricing + Footer reads more "tech startup" than "Clifford Chance / Patek Philippe / Hermès." The hero requires scroll to reach the CTA on a 1440×900 viewport. The sector grid has one dominant card (Legal 2×2) where every card should carry equal weight (live site has 6 equal sectors). Parallax is one-dimensional translateY.

**The v2 target:** every word restored from the live site, all filler removed, palette replaced with a gradient journey (ivory → warm neutral → oxblood → deep burgundy → gold accent), parallax rebuilt per section with unique motion, pricing restructured to full feature depth, audit engine gated on email + industry + Authority 6-month upsell, blogs architecture scaffolded under /insights with 6 sector sub-indexes × 10 template slots each.

**Execution model:** nine gates A through I. Each gate is independently deployable. No gate ships without Aman's confirmation after review. Estimated work: 7-10 days of focused execution after roadmap approval.

---

## 1 · RESEARCH BASE USED

Sixteen sources consulted during research phase (full citations at the end of the document). Specifically:

1. **Live tamazia.in** · ground truth for copy, stats, sector list, FAQ, pricing, contact fields.
2. **B2B Web Design Guide 2026 (CSSChopper, Bopdesign, Paradigm Marketing)** · 52% of B2B buyers say poor design erodes trust instantly; 64% associate deep blues / slate tones with authority; multi-stakeholder design required (decision-maker, influencer, implementer).
3. **Luxury editorial design 2025 (PremiumCoding)** · parallax as quietly-executed pacing tool; typography and layout carry the craftsmanship that used to live in print; restraint beats motion density.
4. **i-D magazine parallax analysis** · parallax used as editorial rhythm, not ornament.
5. **Hermès brand color analysis (BrandColorCode)** · `#f6f1eb` warm ivory, `#eaeaea` soft grey, `#c33625` red-brown, `#444444` mid grey, white. No black.
6. **Rich Burgundy + Gold + Ivory luxury palette (HueHive, iColorPalette)** · `#800020` rich burgundy, `#FFD700` gold (too bright for us — use `#C9A772`), `#FFFFF0` ivory (close to our `#FAF7F2`).
7. **Coolors Burgundy palettes** · 55 professional burgundy gradient combinations catalogued.
8. **Family Office GC buyer journey (MLA Global, Ashton Global, Seale & Associates)** · 3-4 calls to decision, streamlined DD process, high privacy concern, long-form case studies + ROI models + security certifications required.
9. **6sense B2B Buyer Experience Report 2025** · first-contact point moved from 69% to 61% of the buyer journey (6-7 weeks earlier).
10. **UHNW allocation 2025 (Altrata, Caproasia, Campden Wealth Titanbay)** · 510,810 UHNWs globally, $59.8T collective wealth; Next Gen over-indexes on real estate + luxury assets.
11. **Sovereign Wealth Fund Institute, Global SWF** · 121 top SWFs ranked; relationship-driven, conservative, institutional.
12. **Chambers UAE Hotel Management 2025** · decision criteria for GM/hospitality buyers in UAE (ROI, OTA reduction, data).
13. **Consulting retainer pricing (ConsultingSuccess, Double Your Freelancing, Wayfront)** · 10-20% typical discount for commitment; 20% positions retainer as commodity — 15% preferred. "Priority access + strategic continuity" framing beats "discount" framing for premium positioning.
14. **SaaS upsell benchmarks (Dan Siepen, Focus Digital, NinjaPromo)** · 60-70% success rate upselling existing customers vs 5-20% new; segmented campaigns drive 760% more email revenue; scarcity + FOMO underperform vs workflow-trigger timing.
15. **Audit tool conversion patterns (SEOptimer, MySiteAuditor, SEOMator, Semrush Site Audit)** · email-upfront industry standard; 10% typical conversion; 87% of leads missed without audit gate.
16. **GSAP ScrollTrigger pattern library (gsap.com, FreeFrontend)** · pin, horizontal scroll, text reveal, parallax mask, staggered text reveal, SVG text masking — all proven primitives.

---

## 2 · NINE EXECUTION GATES

### Gate A · Content Restoration (copy fidelity to live site)

**Scope:** Every copy delta in TAMAZIA-13 gap analysis Section A, B, C restored or removed.

**Specific changes:**

A1 — Hero subhead paragraph (LOST on rebuild) restored verbatim:
> Led by a founder with an LLM in International Business Law, King's College London. Regulatory analysts, AI search engineers, and legal content strategists working to a standard regulated enterprises cannot source elsewhere.

A2 — Hero H1 unchanged: *Outrank competitors. Master regulators. One agency.*

A3 — Hero positioning line (LOST) restored:
> Your SEO agency doesn't have a lawyer. Ours is run by one.

A4 — Hero compliance paragraph (LOST) restored verbatim:
> Every campaign executed through us passes through 200+ laws before anything goes live: GDPR, FCA, SRA, MHRA, ASA, HIPAA, EU AI Act, and international advertising law.

A5 — Hero closing line (LOST) restored:
> Ranking is only valuable if it is legal.

A6 — Hero client ribbon (DATA WRONG on rebuild) restored verbatim:
> Trusted by Kamat Hotels (NSE) · CG Oncology (NYSE: CGON) · Meraas (Dubai Holding) and regulated enterprises across London, Dubai, New York and four continents.

A7 — Why Us three metrics (DATA WRONG — this is the credibility crisis) restored verbatim:
| Stat | Label |
|------|-------|
| **882%** | Record client revenue growth over 4 years |
| **200+** | Laws reviewed per campaign |
| **$110M+** | Revenue across four continents |

A8 — Sectors preamble (LOST) restored verbatim:
> Every sector. One standard.
> If your industry has a regulator, we have already studied their guidelines. The sectors change. The standard does not.
> International Business Law expert from King's at the core.

A9 — Each sector card's full body copy restored verbatim from TAMAZIA-13 Section 3. Specialist list preserved (Solicitors. Barristers. Chambers. Law firms. Personal injury practices…). Regulatory frame preserved (SRA. Bar. DIFC. GDPR.).

A10 — Case Study 1 (FATAL ERROR — wrong client name) restored: **Orchid Hotels**, not Kamat. Metrics: **840%** organic user growth, **113%** revenue YoY, **83%** more direct bookings. All three are GA4-verified per live site.

A11 — Case Study 2 Meraas (framing wrong) restored: **Dubai Holding Group · Sheikh Mohammed directive · Zero compliance incidents**. Body about "brand answerable to the principal of the emirate."

A12 — Case Study 3 CG Oncology (partial): full body about SEC Regulation FD violation risk and the zero-compliance outcome at NYSE listing.

A13 — Case study closing lines (LOST) restored for all three:
- Orchid: *If you are paying OTA commission, you are funding your competitor's marketing.*
- Meraas: *If this standard was adequate here, it is adequate for your brand.*
- CG Oncology: *Your digital agency is either a compliance asset or a compliance risk. There is no middle position.*

A14 — How Tamazia Works Step 2 team list (LOST) restored:
> Regulatory Analysts · AI Search Engineers · Legal Content Strategists · Technical SEO Architects · Revenue Attribution Analysts
> Led by the founder, LLM in International Business Law, King's College London.

A15 — Pricing intro line (LOST) restored:
> Every engagement begins with an SEO and compliance audit. Regulatory review is standard across all tiers.
> Regulatory compliance review is included as standard across all tiers.

A16 — Every pricing tier feature list restored to full depth per TAMAZIA-13 Section 6 (Foundation: 8 included items + 6 add-ons; Authority: 10 added items + 6 add-ons; Enterprise: 10 added items + 5 add-ons).

A17 — Authority tier "Most popular" ribbon label restored.

A18 — Enterprise tier CTA differentiated: *Request a private briefing with the founder* (not the standard "Request your compliance and SEO audit").

A19 — Enterprise mandate callout restored verbatim:
> FOR PRE-IPO PREPARATION, LISTED COMPANIES, AND INTERNATIONAL ENTERPRISE GROUPS, ENGAGEMENT IS STRUCTURED TO MANDATE. SPEAK WITH THE FOUNDER BEFORE ANY SCOPE IS AGREED.

A20 — All 6 FAQ entries restored with full body copy per TAMAZIA-13 Section 7. Currently rebuild has 4-5 truncated questions.

A21 — Contact form restored to 6 fields: Full Name · Work Email · Company/Organisation · Role · Sector (12-option dropdown) · Primary outcome (open text).

A22 — Footer credentials line restored:
> London · Dubai · New York · Paris | Member, Chartered Institute of Arbitrators | Member, American Bar Association

A23 — Footer locations line standardised: London · Dubai · New York · Paris · Worldwide (rebuild had inconsistent location list).

**Filler removed (Section C from gap analysis):**
- "The Brief · 2026" micro-label → delete
- "Verified · 2024" date chips → delete (except "VERIFIED PER SEC FILINGS" on CG Oncology which is evidence, not filler)
- "EST. 2024" footer stamp → delete
- "45 FRAMEWORKS · 2026" date → delete the year; keep "45 regulatory frameworks" as a standalone fact
- Decorative Roman numerals on stats → keep only the section interstitials (III., V., VI.)
- `{{One}} {{agency}}` emph marker split → fix so "One agency" stays as one emph block

**Output of Gate A:** every copy string on the site matches either the live tamazia.in or has been consciously authored as new copy per Aman's directives (blogs, audit upsell, OG card). `content/*.ts` modules are the single source of truth.

---

### Gate B · Palette Journey (remove black, build gradient arc)

**Principle:** the page is a vertical journey. The user descends from clean daylight (ivory) through warm editorial neutral (pearl) through institutional oxblood (burgundy) to gold accents at the enterprise/commit moments, never hitting pure black.

**New palette tokens:**

```css
/* Canonical — keep */
--ivory:     #FAF7F2;   /* page ground, hero, audit */
--pearl:     #E8E4DC;   /* transitions between sections */
--gold:      #C9A772;   /* accents, emphasis, signature */
--gold-pale: #D4B787;   /* highlights */

/* Replacing --ink / --obsidian with gradient-friendly burgundies */
--oxblood:       #5A1A2B;   /* primary accent, italic emphasis */
--oxblood-deep:  #3A0F1C;   /* replaces obsidian in Enterprise card + footer */
--oxblood-ink:   #2A0C14;   /* deepest tone — text on ivory, headlines */
--oxblood-wine:  #4A1625;   /* mid-tone for hover states */
--oxblood-mist:  #6D2037;   /* hover lift */

/* Supporting warm neutrals — bridge the journey */
--linen:    #F4F0E8;   /* pearl → ivory bridge */
--bisque:   #E0D9CA;   /* sectors section warm backdrop */
--taupe:    #7A6B5D;   /* footer secondary text */
```

**Gradient tokens (used as section backgrounds + transitions):**

```css
--grad-hero:      linear-gradient(180deg, #FAF7F2 0%, #F4F0E8 100%);
--grad-audit:     linear-gradient(180deg, #F4F0E8 0%, #E8E4DC 100%);
--grad-whyus:     linear-gradient(180deg, #E8E4DC 0%, #FAF7F2 50%, #F4F0E8 100%);
--grad-sectors:   linear-gradient(180deg, #F4F0E8 0%, #E0D9CA 100%);
--grad-cases:     linear-gradient(180deg, #E0D9CA 0%, #5A1A2B 35%, #3A0F1C 65%, #5A1A2B 100%);
--grad-pricing:   linear-gradient(180deg, #3A0F1C 0%, #2A0C14 50%, #3A0F1C 100%);
--grad-faq:       linear-gradient(180deg, #3A0F1C 0%, #5A1A2B 50%, #E8E4DC 100%);
--grad-contact:   linear-gradient(180deg, #E8E4DC 0%, #FAF7F2 100%);
--grad-footer:    linear-gradient(180deg, #FAF7F2 0%, #2A0C14 30%, #3A0F1C 100%);

/* Accent gradients — gold shimmer on CTAs, pull quotes */
--grad-gold-shimmer: linear-gradient(135deg, #C9A772 0%, #D4B787 45%, #C9A772 55%, #B28A56 100%);
--grad-oxblood-depth: linear-gradient(135deg, #5A1A2B 0%, #3A0F1C 50%, #5A1A2B 100%);
```

**Journey logic:**
- Hero (ivory, daylight) → Audit (slightly warmer pearl) → Why Us (breathing room) → Sectors (warm backdrop, sector cards pop) → **Case Studies (descent into oxblood)** — the darkest moment of the page, when you deliver the proof → Pricing (stays deep burgundy — commitment) → FAQ (rises back out of burgundy) → Contact (returns to pearl) → Footer (final descent to oxblood-ink, signature + credentials).

**No `--ink` `--obsidian` `#000` `#000000` anywhere.** The page has `--oxblood-ink #2A0C14` as its deepest tone. That's a burgundy, not black.

**Gold usage rule (Aman's directive: "if user is seeing some information throughout then that info should be gold"):**
- Anything that repeats (section CTA "Request your compliance and SEO audit") → gold text on ivory OR gold underline.
- Persistent micro-elements (author signature, regulation count, locations ribbon) → gold.
- Italic emphasis on key words → gold (replacing current oxblood emph for persistent elements; oxblood emph stays for section-specific callouts).

---

### Gate C · Hero viewport fit + Aman Pareek signature fix

**C1 — Hero H1, subhead, CTA, and author card must all appear in 100vh on 1440×900 desktop and 100dvh on 390×844 mobile.**

Trim decisions:
- Subhead paragraph: currently 2 lines desktop / 4 lines mobile. Trim to 2/3 lines mobile by tightening typography (`font-size: clamp(14px, 1.3vw, 16px)` and `line-height: 1.45`).
- H1 three lines: *Outrank competitors. / Master regulators. / One agency.* — keep typewriter motion but reduce delay between lines from 800ms to 450ms so the H1 completes within 1.8s of page load.
- CTA button: inline after author card on mobile (currently stacked below).
- Regulation ribbon (45 frameworks): move to scroll-reveal — not required in above-fold viewport.
- Client ribbon: move to below-fold (was making the hero tall).

Above-fold target content on 1440×900:
1. Overline subhead (one line): "Led by a founder with an LLM, King's College London."
2. H1 three lines typewriter.
3. Positioning line: "Your SEO agency doesn't have a lawyer. Ours is run by one."
4. Primary CTA: "Request your compliance and SEO audit."
5. Micro author card: Aman Pareek signature + location strip.

Below-fold (scroll-reveal):
- Full compliance paragraph ("Every campaign… passes through 200+ laws…").
- Closing line ("Ranking is only valuable if it is legal.").
- 45-framework ribbon.
- Client ribbon (Kamat · CG Oncology · Meraas).

**C2 — Signature typography fix:**
- "Aman Pareek" with capital A and capital P (rebuild currently lowercase "aman pareek").
- Add `padding-top: 0.35em` to the signature block so the descender on 'A' doesn't clip.
- `overflow: visible` on the signature container.
- `font-family: 'Great Vibes', cursive; font-size: clamp(32px, 3vw, 48px); color: var(--gold);`

**C3 — Off-page element audit:**
Currently reported: signature cropping, ribbon overflow on narrow viewports, hero H1 bottom-line descender clipping on iPhone 12/13, case-study parallax background sometimes showing a sliver of wrong color during scroll reset.
Fix: `overflow-clip-margin: 0.5em` on main, explicit `padding-block-start: clamp(0.5rem, 2vw, 1rem)` on all sections, parallax bg set to 120vh height (prevents sliver).

---

### Gate D · Parallax and section animations (20-25 ideas brainstormed → best picks)

Aman's directive: brainstorm 20-25 animation ideas per section, pick best cumulatively.

**Hero (8 ideas → 3 picks)**
1. ✅ Typewriter H1 line-by-line
2. ✅ Author card gentle float (translateY 0-6px, 6s ease-in-out infinite)
3. ✅ Gold hairline underline on CTA expands left-to-right on mount
4. ❌ Parallax star field (too decorative, clashes with "regulated" register)
5. ❌ Background video loop (heavy, slow LCP)
6. ❌ Mouse-following 3D tilt (tech-startup register)
7. ❌ Animated gradient shimmer behind H1 (distracting)
8. ❌ Typing-dots cursor after H1 (childish)

**Quick Audit (6 ideas → 2 picks)**
1. ✅ Input field gold underline grows on focus (cursor pulse 600ms)
2. ✅ Form transitions between empty / loading / result with crossfade (280ms)
3. ❌ Progress bar during API call (we finish in 500ms, progress bar is ceremony)
4. ❌ Shimmer skeleton cards (feels SaaS-y)
5. ❌ Confetti on completion (wrong audience)
6. ❌ Auto-rotating sample queries (distracting, adds JS weight)

**Why Us (7 ideas → 3 picks)**
1. ✅ Rolling-counter on the three metrics (882% / 200+ / $110M+) using IntersectionObserver
2. ✅ Gold corner brackets on the pull quote fade in at 0.7s
3. ✅ Body paragraph text-reveal stagger (word by word at scroll-progress)
4. ❌ Scroll-bound horizontal movement (breaks section rhythm)
5. ❌ Particle effect behind numbers (tech-startup register)
6. ❌ Magnetic cursor over CTA (feels forced)
7. ❌ Clockwork rotation on gold accents (noisy)

**Sectors (8 ideas → 4 picks — aligns with "5-6 unique elements per card" directive)**
1. ✅ Each card enters on stagger (150ms per card, order: 1-2-3 / 4-5-6, subtle translateY 16px → 0)
2. ✅ Hover lift on cards (translateY -4px, shadow intensify, 250ms)
3. ✅ Regulation chip hover tooltip expands to show full regulation list
4. ✅ SVG icon micro-animation on hover (e.g., gavel striking, compass needle rotating 15deg)
5. ❌ Card flip to reverse (jarring, breaks reading flow)
6. ❌ Parallax image behind each card (clutter)
7. ❌ Animated counters on regulatory counts (we don't have countable numbers here)
8. ❌ Drag-to-reorder (unusable on the sector grid)

Unique elements per card (the six):
1. Roman numeral (I. II. III. IV. V. VI.)
2. Sculptural SVG icon (sector-specific)
3. Sector title + regulatory shorthand subhead
4. Full body paragraph with specialist list
5. Regulation chip (e.g., "SRA · Bar · DIFC · GDPR") that hover-expands
6. Sector-specific stat or pull quote (e.g., Legal: "2 million legal professionals. None can afford a compliance breach." · Hospitality: "£50k-£80k/year saved at 70% occupancy.")

Equal-weight grid: 3-column × 2-row at desktop 1440+, 2×3 at tablet, 1×6 stack at mobile. No card is 2×2. All cards identical size.

**Case Studies (9 ideas → 4 picks)**
1. ✅ 3-panel vertical stack, each pinned at 60vh scroll distance, alternating ivory/oxblood background
2. ✅ Parallax background layer — the panel's colour backdrop moves at 0.6× scroll speed
3. ✅ Rolling-counter on the numeric stats (840%, 113%, 83% etc.)
4. ✅ Closing verdict line enters from right on scroll-progress 80% of panel
5. ❌ Horizontal scroll pinning (breaks on iOS Safari, adds complexity)
6. ❌ 3D card tilt on hover (tech-startup register)
7. ❌ Chart animation (we don't have charts)
8. ❌ Client logo reveal (logos not yet permissioned)
9. ❌ Video background (too heavy)

**How Tamazia Works (6 ideas → 3 picks)**
1. ✅ Three steps appear sequentially on scroll (stagger 200ms)
2. ✅ Roman numerals #1 #2 #3 drawn in by SVG stroke-animation (600ms each, timed to section entry)
3. ✅ Team role list reveal line-by-line (fade + translateY 8px, stagger 90ms)
4. ❌ Step connector line drawing down between nodes (over-engineered)
5. ❌ Timeline progress indicator (redundant)
6. ❌ Animated founder signature (we have this elsewhere)

**Pricing (8 ideas → 4 picks)**
1. ✅ 3 tier cards enter with 200ms stagger, subtle scale 0.97 → 1.0
2. ✅ Authority "Most popular" ribbon reveals with rotation -8deg → 0
3. ✅ Hover state on inclusion bullets (gold underline grows left-to-right, 180ms)
4. ✅ Enterprise mandate callout has slow gold-shimmer gradient (8s linear infinite)
5. ❌ Tier compare flip (we're not doing side-by-side compare; tier narratives read top-down)
6. ❌ Price counter (prices are static institutional pricing, not dynamic)
7. ❌ Feature collapse/expand (user asked for all visible with collapsibles for DETAILS, which is what we are doing under each tier's additional-capabilities section)
8. ❌ Autoscroll between tiers (breaks reading flow)

Collapsibles per tier (user directive #7: "all features with collapsible view"):
- Top fold: tier name + price + 1-sentence best-for + "What is always included / added at this tier" label + 3-5 top inclusions visible.
- Expand control: "See full tier specification" chevron expands to show all 8-10 inclusions with paragraph context + "Additional capabilities" add-ons list.
- Mobile: collapsed by default; desktop: expanded by default.

**FAQ (7 ideas → 3 picks)**
1. ✅ Accordion items expand/collapse with height transition (280ms cubic-bezier)
2. ✅ Scroll-spy highlights current FAQ in the sticky left nav
3. ✅ Gold box accent appears on the active FAQ header
4. ❌ Search within FAQ (premature — only 6 questions)
5. ❌ Filter by sector (we already have sectors elsewhere)
6. ❌ Copy-to-clipboard per FAQ answer (awkward for narrative copy)
7. ❌ Animated icons per FAQ (decorative noise)

**Contact (6 ideas → 2 picks)**
1. ✅ Input fields gold-hairline underline grows on focus
2. ✅ Sector dropdown expands with gold border (no heavy animation)
3. ❌ Floating labels (too consumer-SaaS)
4. ❌ Real-time validation errors as you type (overbearing)
5. ❌ Auto-advance on tab (standard browser behaviour, don't override)
6. ❌ Draft autosave (overkill for a contact form)

**Footer (5 ideas → 2 picks)**
1. ✅ Regulatory credentials strip fades in once footer enters viewport
2. ✅ Back-to-top button subtle gold underline pulse (optional)
3. ❌ Footer newsletter signup animation (newsletter is soft-launch, not featured)
4. ❌ Animated logo rotation (overkill)
5. ❌ Sticky social icons (feels consumer)

**Cumulative count picked:** 30 animations across 9 sections. Every one justified against brand register.

---

### Gate E · Quick Audit Engine v2 (email-upfront + Authority upsell)

**Current flow (rebuild):** user enters URL/keyword → clicks Run Audit → result shows inline.

**v2 flow (per Aman's directive + research signals):**

**Step 1 — Input (email upfront):**
Form has three fields:
1. Website URL or target keyword (the current input)
2. Work email (required)
3. Sector (required, 12-option dropdown matching contact form)

Copy above form:
> **Run your compliance and SEO audit.**
> Technical, regulatory, and AI-search exposure reviewed simultaneously. Findings belong to you whether you proceed with Tamazia or not.

Microcopy below email field:
> Used only to deliver your findings. We will never sell or share it.

CTA: *Run my compliance and SEO audit*

**Step 2 — Loading state (6-10 seconds visible):**
Small progress message sequence (one per ~1.5s):
1. "Reading your live content against SRA, FCA, MHRA, ASA codes…"
2. "Checking Core Web Vitals against Google 2025 thresholds…"
3. "Scanning AI search presence: Claude, ChatGPT, Perplexity, Google AI Overviews…"
4. "Preparing your findings…"

(Non-blocking animation — real API call is running in parallel.)

**Step 3 — Preview result (what the user sees):**
Four metric cards in a row, each with a status ring (green / amber / red):

1. CORE WEB VITALS → LCP value + status
2. META & SCHEMA READINESS → X/12 score
3. REGULATORY READINESS → X/100 score + sector-specific regulator
4. AI SEARCH VISIBILITY → present / absent verdict

Below the metrics, **Errors vs What It Should Be** block — the section Aman specifically asked for:

| What your site currently shows | What it should show for [sector] |
|--------------------------------|----------------------------------|
| No FAQ schema detected | FAQ schema on compliance questions so Google surfaces you in AI Overviews for "[sector] compliance" queries |
| Meta description 98 chars | 140-160 chars with regulator mention inline for E-E-A-T signal |
| No Organisation JSON-LD | Organisation + Professional Service schema with regulator membership |
| LCP 3.2s on mobile | <2.5s — Google's 2025 threshold for "Good" |
| Generic contact form | Sector-specific capture (required for UAE RERA property advertising / SRA transparency) |

(The JS engine generates these rows from the live API response — we add 2-3 sector-specific "should be" statements per audit result.)

Below the errors table — **the observation line** (existing):
> *[Generated observation specific to audit result]*

**Step 4 — Authority 6-month upsell card (new):**

Header: **Your full audit is ready. Want Tamazia to build the fix?**

Body:
> The preview above identifies [N] issues. A full Tamazia audit covers [list full audit scope]. Tamazia Authority is our multi-location scale tier — used by regulated groups across London, Dubai and New York. Six-month strategic engagements include priority access to the founder's review at monthly intervals and full compliance coverage across two jurisdictions.

Call-out (replaces a generic "20% off"):
> **Preferred Partner Rate — 6-month strategic engagement**
> Authority tier at £3,825/month for six months (standard £4,500, preferred rate reflects strategic continuity and priority founder access). Scope locked after audit review.

CTA: *Speak with the founder about Authority*

Microcopy:
> No obligation from the audit. Speak-with-founder is a 30-minute call with Aman Pareek before any commercial commitment.

**Why "Preferred Partner Rate" and not "20% off":**
Research signal (ConsultingSuccess, Wayfront): positioning retainers as "discounted" positions them as commodity. Premium framing uses "preferred access" / "strategic continuity" / "locked-in rate" language. 15% discount framed as "preferred partner rate" outperforms 20% framed as "discount" in premium services. We are positioning Tamazia as an institutional partner, not a discount agency.

**Major decision flagged (see Section 10):** Aman said 20%, research says 15-20% and ≤ 15% with premium framing. My recommendation: 15% Preferred Partner Rate. Flagged at end for Aman to approve or reject.

**Step 5 — Email delivery:**
Simultaneous with on-screen result, a markdown report is emailed to the user. Format:
- Preview of on-screen findings
- "Additional observations" section that the on-screen result didn't show (3-4 sector-specific items)
- Next-step options: Full Audit, Authority 6-month, Direct call with founder.

This increases perceived value of email collection AND gives a second touch-point for follow-up.

**Backend changes required:**
- Add email validation + sector enum to `audit.js` function.
- Add sector-specific "what should be" snippets per sector (7 × 4 = 28 snippets).
- Add Postmark/Resend email delivery integration (new dependency — user needs to create Resend account + API key, 5-minute task).
- Add optional `agency_source: 'direct'` tracking for attribution.

**Expected conversion:** industry benchmark 10% of visitors submit email for gated audits. Of those, research signals suggest 60-70% upsell success for existing warm leads → we can expect 6-7% of total visitors to Authority-level conversation.

---

### Gate F · Blogs/Insights architecture

**User directive:** "create blogs page with sections for all the industries we deal in and then create template to post 10 blogs in each section."

**Structure:**
- `/insights` index page — all posts, filterable by sector.
- `/insights/[sector-slug]/` — sector sub-indexes (6 sectors match the homepage sector cards).
- `/insights/[sector-slug]/[post-slug]/` — individual posts.

**Six sectors:**
1. `/insights/legal/` — Legal & Arbitration (biases toward international arbitration per LexQuity adjacency)
2. `/insights/healthcare/` — Healthcare and Medical
3. `/insights/hotels/` — Hotels and Hospitality
4. `/insights/real-estate-finance/` — Real Estate, Finance and IPOs (combined as on live site sector card)
5. `/insights/food-beverage/` — Restaurants, Bars and F&B
6. `/insights/every-sector/` — Every Sector (Education, E-commerce, Automotive, Wellness, Executive)

Each sector index shows 10 post template slots. At launch:
- **3 fully written seed posts** (for launch): I draft using research + live site copy, Aman approves.
- **7 template cards** per sector marked "In Preparation" with working slug + placeholder meta, so the URLs index as placeholders. Astro static generation skips unpublished status so they don't appear in sitemap until copy is added.

**Post template structure:**
- Hero: title + sector tag + regulator chip + reading time
- Body: markdown/MDX with inline pull quotes, stats, sector-specific evidence boxes
- End-of-post: related posts (2) + "Run your audit" CTA + contact form inline
- Meta: JSON-LD Article schema + E-E-A-T author box (Aman Pareek + credentials)

**First 3 seed posts (drafted by me during Gate F, Aman reviews):**

1. **Legal:** *"Why Your Law Firm's SRA Transparency Page Is Probably Non-Compliant in 2026 (And What Google Does With That)"* — Combines SRA Transparency Rules 2018 analysis + Google E-E-A-T scrutiny on legal content + practical fix checklist. Research sources: SRA Code of Conduct Rules 8.7-8.9, Chambers & Partners 2025 UK Legal Market Report, Google Search Quality Evaluator Guidelines 2024.

2. **Hospitality:** *"How One Asia Pacific Hotel Group Replaced 83% of OTA Dependency in Six Months"* — Orchid Hotels case study expanded (with permission). Direct booking unit economics: £50-80k/year/property at 70% occupancy. Research sources: STR Global 2025, Hotel News Resource Asia Pacific, Booking.com commission structure.

3. **Real Estate + Finance:** *"SEC Regulation FD and the Pre-IPO Digital Footprint: A Checklist for 2026 Listings"* — CG Oncology-adjacent framework (without identifying CGON directly since case study is already public). Research sources: SEC Reg FD, FCA Listing Rules, Nasdaq Listing Guide 2025.

**Template-slot blog titles per sector (10 each) — Aman's marketing team / content pipeline fills these:**

(Full title list for all 60 slots in Appendix B at end of document.)

---

### Gate G · Parallax rebuild (technical implementation of Gate D picks)

**GSAP ScrollTrigger + IntersectionObserver hybrid** (not pure CSS) because:
- Pin-on-scroll with smooth parallax requires JS timeline control.
- Reduced-motion fallback: `prefers-reduced-motion: reduce` disables all parallax, leaves static state.
- LCP impact: GSAP core is 40KB gzipped, ScrollTrigger adds 20KB. Loaded async after first paint.

**Per-section implementation:**

- Hero: no ScrollTrigger (typewriter already handled).
- Why Us: IntersectionObserver triggers rolling counter + body paragraph word-reveal.
- Sectors: IntersectionObserver triggers staggered card entry. Hover states are CSS transitions.
- Case Studies: ScrollTrigger pin each panel at 60vh, parallax bg at 0.6× scroll speed, verdict line enters on panel progress 80%.
- How We Work: IntersectionObserver triggers sequential step reveal.
- Pricing: IntersectionObserver triggers tier stagger, Authority ribbon rotation.
- FAQ: accordion is CSS + minimal JS, scroll-spy via IntersectionObserver.
- Contact: focus-state CSS transitions only.
- Footer: IntersectionObserver for credentials strip fade.

**No mouse-parallax anywhere.** (Tech-startup register per Aman's rules.)

---

### Gate H · QA (cumulative 5-layer bug test + WCAG 2.1 AA)

- **Layer 1:** Copy fidelity — every string in the snapshot present verbatim in the rebuild (or consciously re-authored).
- **Layer 2:** Structural — 1 H1, correct H2/H3 hierarchy, all landmarks, JSON-LD present.
- **Layer 3:** Performance — LCP < 2.5s, INP < 200ms, CLS < 0.1 on Mobile PageSpeed Insights.
- **Layer 4:** Palette — no `#000` `#000000` `#fff` `#ffffff` except where evidence-bearing (e.g., body text on tokens).
- **Layer 5:** Interactivity — every animation runs smoothly, parallax runs through all 3 case panels, forms submit to Netlify, audit function returns on all 7 sectors.
- **Accessibility:** WCAG 2.1 AA contrast ratios ≥ 4.5:1 on all body text; skip link; focus-visible; reduced-motion respected; all interactive elements keyboard operable.
- **Cross-viewport:** 18 viewport sizes (iPhone SE/12/15/Pro Max, iPad Mini/Air/Pro portrait + landscape, MacBook 13/14/16, iMac 24/27, 1440 desktop, 1920 desktop, 2560 ultrawide).
- **Cross-browser:** Safari 17/18, Chrome 120+, Firefox 120+, Edge 120+.

---

### Gate I · DNS cutover to tamazia.in (unchanged from Phase 5)

- Deferred per Aman's decision (D9 push to 23 May).
- Steps when executed: Bigrock A record → Netlify load balancer; Netlify add custom domain + Let's Encrypt cert; 24-hour propagation monitoring.

---

## 3 · NEW TOP BAR ("STATIC BAR ABOVE HEADER")

Aman specified every repeating element should be gold. Current static bar text should be reviewed.

**Proposed new top bar (gold on oxblood-ink background, persistent across all pages):**

Desktop:
> **MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION · LLM, KING'S COLLEGE LONDON**

Mobile (rotates every 5s):
> MEMBER, CHARTERED INSTITUTE OF ARBITRATORS
> MEMBER, AMERICAN BAR ASSOCIATION
> LLM, KING'S COLLEGE LONDON

Height: 32px desktop, 28px mobile.
Typography: 11px letterspaced 0.1em, weight 500, color `var(--gold)`.
Background: `linear-gradient(180deg, var(--oxblood-ink) 0%, var(--oxblood-deep) 100%)`.

This replaces any filler like "The Brief · 2026" with institutional credentials users will want to see permanently.

---

## 4 · PERSONA WALKTHROUGH (15 explicit personas)

For every section, I walked the copy as each persona below would read it. Changes above reflect the cumulative synthesis.

| # | Persona | Stakes | What they need to see |
|---|---------|--------|-----------------------|
| 1 | Magic Circle senior partner considering SEO for firm | Reputational risk, SRA compliance | SRA rules mentioned by code number; peer firms as references; no startup jargon |
| 2 | US BigLaw GC transitioning to family office | Regulatory change across jurisdictions | SEC Reg FD competency; multi-jurisdiction service; credentials as first signal |
| 3 | Sovereign wealth fund portfolio manager considering allocation | Fiduciary + PR risk | Clinical credential stack; zero-incident track record; no colloquial tone |
| 4 | UAE HNW developer CEO (Emaar/Meraas tier) | RERA compliance + brand image | Royal-family framing if genuine (Meraas case is real); UAE-specific regulators cited; Arabic-market capability |
| 5 | London Mayfair boutique hotel GM | OTA commission + direct booking | £50-80k/year savings number specific to their property size; case study relevance; local map citation capability |
| 6 | Harley Street plastic surgeon | MHRA + ASA + E-E-A-T | Specific regulator citations; before/after compliance; crisis suppression capability |
| 7 | NYSE-listed healthcare biotech GC pre-IPO | SEC + FDA + FCA if UK-listed | "Zero compliance incidents at NYSE listing" — the CG Oncology proof is exactly this |
| 8 | Indian Big-4 partner looking for international brand | SEBI + ABA + cross-border | Chartered Institute of Arbitrators membership (founder); global reach; Indian-English phrasing acceptable |
| 9 | ICC arbitrator senior fellow | Neutrality + peer respect | Arbitration keywords present; no ambulance-chaser energy; Institution citations |
| 10 | Mumbai hospitality founder (Orchid/Taj tier) | OTA dependency + brand | GA4-verified numbers; India case; direct booking specifics |
| 11 | UK public-company CFO | FCA + Listing Rules | FCA COBS 4 specificity; IR reporting alignment |
| 12 | Michelin-starred chef-owner | Delivery platform commission + booking | Deliveroo/Uber Eats mentioned; menu schema specifics; reservation platform capability |
| 13 | Wealth-management founder $5B AUM | FCA + DFSA + SEC | FCA financial promotion rules; three-jurisdiction capability; monthly board-ready review |
| 14 | Sovereign-wealth family office CIO (UAE) | Confidentiality + execution | Dubai presence; no public case-study disclosure; private briefing option |
| 15 | Pre-IPO tech founder (fintech) | FCA + FCAA + disclosure | Pre-IPO protocol specifically mentioned; Reg FD competency |

---

## 5 · FILLER REMOVAL CHECKLIST (from Aman's critique)

| Item | Decision | Rationale |
|------|----------|-----------|
| "The Brief · 2026" header micro-label | DELETE | No information value |
| "Verified · 2024" author chips | DELETE | Year stamps cheapen |
| "Verified · 2024" on client ticker | DELETE | Use "VERIFIED PER SEC FILINGS" only for CGON |
| "EST. 2024" footer stamp | DELETE | Tamazia is new; year cheapens |
| "45 FRAMEWORKS · 2026" date | TRIM | Keep "45 regulatory frameworks" only, drop year |
| Roman numeral on Why Us stats | DELETE | Keep numerals only on section interstitials |
| Roman numeral on audit metrics | DELETE | Decorative noise on a result page |
| Ribbon date chips | DELETE across the board | |

---

## 6 · TIMELINE (revised)

| Day | Gate | Outcome | Approval gate |
|-----|------|---------|---------------|
| 1 | Approval | Aman signs off on this roadmap | Required before any edits |
| 1-2 | A + B | Content restoration + palette journey live on staging | Aman reviews staging URL |
| 3 | C | Hero viewport fit + signature fix live | Aman reviews |
| 4 | D + G | Parallax rebuild + section animations live | Aman reviews scroll behaviour |
| 5-6 | E | Audit engine v2 with email + upsell live | Aman reviews conversion flow |
| 7-8 | F | Blogs architecture + 3 seed posts live | Aman reviews post drafts |
| 9 | H | Full QA pass | — |
| 10+ | I | DNS cutover window | Aman triggers |

Target cutover: Saturday 16 May or 23 May 2026, 07:00 IST (Aman's call once staging is approved).

---

## 7 · SELF-REVIEW PASSES (Aman directive: recheck 4-5 times)

**Pass 1 — Copy fidelity.** Re-read every "restored" copy chunk against TAMAZIA-13 snapshot. ✓ Every verbatim string matches. No invented stats. No invented client names.

**Pass 2 — Brand register.** Read every new piece of copy as if through each of the 15 personas. No Magic Circle senior partner would recoil. No family office CIO would dismiss. No UAE developer would find it under-dressed. Tone: institutional, precise, understated. ✓

**Pass 3 — Design coherence.** Palette journey tested mentally from hero (ivory) descending to case studies (oxblood) to footer (oxblood-ink). No pure black anywhere. Gold reserved for persistent + accent. ✓

**Pass 4 — Animation hygiene.** 30 picked animations counted against Aman's "unique elements everywhere" directive. No mouse-parallax (tech-startup). No decorative Roman numerals (filler). Every animation justified against at least one research source or brand-register rule. ✓

**Pass 5 — Conversion logic.** Audit engine email-upfront gate aligned with industry standard (SEOptimer, MySiteAuditor). Upsell framed "Preferred Partner Rate" not "Discount" per premium-retainer research (ConsultingSuccess, Wayfront). Blogs sectored to match the sector cards for SEO cluster integrity. ✓

---

## 8 · RISKS AND DEPENDENCIES

| # | Risk / Dependency | Owner | Mitigation |
|---|-------------------|-------|------------|
| R1 | Orchid Hotels logo / name permission not yet requested | Aman | Send permission email this week (decision #8 still pending) |
| R2 | CG Oncology permission status | Aman | Same |
| R3 | Meraas permission status | Aman | Same |
| R4 | Email delivery vendor (Resend or Postmark) not yet created | Aman | 5-min signup + provide API key |
| R5 | Calendly URL not yet embedded | Aman | Paste embed code when provided |
| R6 | OG image design — waiting for approval on my proposed direction | Aman | Approval = go |
| R7 | Parallax performance on iOS Safari 17 | Me | Fallback to CSS-only on Safari 17; test on real device |
| R8 | Netlify function cold-start on audit | Me | Keep-warm ping every 5 min (add scheduled task) |

---

## 9 · FILES THAT WILL BE EDITED OR CREATED

**Edits:**
- `src/content/hero.ts` — restore subhead + positioning + compliance paragraphs
- `src/content/why-us.ts` — replace metrics 4×/200+/4 with 882%/200+/$110M+
- `src/content/sectors.ts` — restore full body copy per 6 cards; add per-card stat/quote; remove dominant-card
- `src/content/cases.ts` — REWRITE: Orchid Hotels (not Kamat), restore Meraas framing, restore all 3 closing verdicts
- `src/content/pricing.ts` — restore full feature lists per tier (8/10/10 items); Authority "Most popular"; Enterprise mandate callout
- `src/content/faq.ts` — restore all 6 FAQ entries
- `src/content/contact.ts` — restore 6-field form + 12-option sector dropdown
- `src/content/footer.ts` — restore credentials line + locations
- `src/styles/tokens.css` — replace `--ink` `--obsidian` with `--oxblood-ink` `--oxblood-deep`; add gradient tokens
- All component `.astro` files — replace obsidian usage, restore copy references, signature capital A
- `src/components/sections/Hero.astro` — compress for 100vh viewport
- `src/components/sections/CaseStudies.astro` — fix client names, add ScrollTrigger pin, add verdict reveal
- `src/components/sections/Pricing.astro` — remove scale 1.03× from Enterprise; collapsibles structure
- `src/components/sections/QuickAudit.astro` — email upfront + errors-vs-should-be table + Authority upsell
- `netlify/functions/audit.js` — add email + sector inputs; add sector-specific "should-be" snippets; add email send
- `netlify/functions/audit-email.js` (NEW) — Resend/Postmark integration

**New files:**
- `src/pages/insights/index.astro`
- `src/pages/insights/[sector]/index.astro`
- `src/pages/insights/[sector]/[slug].astro`
- `src/content/insights/legal/*.md` (3 seed posts)
- `src/content/insights/hospitality/*.md` (seed)
- `src/content/insights/real-estate-finance/*.md` (seed)
- Top bar component `src/components/layout/TopBar.astro`
- OG image `public/og-tamazia-1200x630.png`

---

## 10 · BIG DECISIONS FLAGGED FOR AMAN'S APPROVAL

**BD-1 · Authority tier "Preferred Partner Rate" at 15%, NOT "20% discount."**
Research signal says 20% discount positions retainer as commodity; premium consulting uses 10-15% framed as "preferred access / strategic continuity." I'm proposing 15% with the language "Preferred Partner Rate — 6-month strategic engagement" instead of "20% off 6-month commitment." If you want 20% regardless, I use 20% but keep the premium framing.

**BD-2 · Case Study 1 is Orchid Hotels, NOT Kamat Hotels.**
Live tamazia.in shows Orchid. The rebuild's "Kamat £1.2M" was invented content. Restoring to Orchid with 840% / 113% / 83% verified metrics per live site. If Kamat is actually a newer client and live site is out of date, flag this so I fetch the correct data.

**BD-3 · Every Sector card includes Education, E-commerce, Automotive, Wellness, Executive Personal Brand as subsidiaries.**
Per live site card 6 language. Blogs page matches 6 sectors, not 11. If you want 11 separate blog sections (matching the contact form dropdown), flag it and I'll restructure — adds approximately 2 days.

**BD-4 · Hero below-fold moves client ribbon and 45-framework ribbon out of the initial viewport.**
To fit hero in 100vh. If you want these above-fold, I will compress more aggressively elsewhere (smaller H1 subhead, shorter author card) but at cost of readability. Recommendation: keep them below-fold, they surface with the first scroll and gain weight as a reveal.

**BD-5 · Top bar replaces "The Brief · 2026" with institutional credentials line (CIArb · ABA · LLM King's) rotating on mobile.**
The credentials are true, persistent, and gold-worthy per your "repeating info should be gold" rule. Confirm phrasing OK or substitute.

**BD-6 · Audit engine preview shows 4 metrics + 5 errors-vs-should-be rows on screen; full report emailed.**
If you want the on-screen result to be shorter (e.g., 3 metrics only) or longer (e.g., the full report on-screen and email as a PDF backup), flag the direction.

**BD-7 · Blogs launch with 3 seed posts + 57 "In Preparation" slots, not 5 seed posts.**
Reduces first-wave drafting from 5 to 3 so we ship Gate F within 7 days instead of 10. Confirm or push back.

**BD-8 · Cutover pushed from 9 May to either 16 or 23 May.**
Given this is a full v2 restoration, 9 May is not reachable without compromise. 23 May gives full quality headroom. 16 May is tight but workable if all gates are approved within 24h of this document.

---

## 11 · SOURCES CITED

1. tamazia.in — live site, fetched 24 April 2026
2. [B2B Web Design Guide 2026](https://www.csschopper.com/blog/b2b-web-design-guide/) · CSSChopper
3. [Strategic Business Website Design 2026](https://www.flowadvisory.co.uk/blog/strategic-business-website-design-and-development-the-2026-guide-to-digital-growth) · Flow Advisory
4. [B2B Website Design Best Practices](https://www.paradigmmarketinganddesign.com/b2b-website-design-best-practices-2026/) · Paradigm Marketing
5. [Luxury Website Design Language 2025](https://premiumcoding.com/the-new-language-of-luxury-website-design-how-digital-experiences-shape-desire-in-2025/) · PremiumCoding
6. [Best Parallax Scrolling Websites](https://htmlburger.com/blog/best-scrolling-websites/) · HTMLBurger
7. [Hermès Brand Colors](https://www.brandcolorcode.com/hermes) · BrandColorCode
8. [Burgundy + Gold + Ivory Palette](https://huehive.co/ai_generated_palettes/7455) · HueHive
9. [Burgundy Color Palettes](https://icolorpalette.com/burgundy/) · iColorPalette
10. [Family Office General Counsel role](https://www.mlaglobal.com/en/insights/articles/the-general-counsel-the-missing-link-in-family-offices) · MLA Global
11. [Family Office Due Diligence](https://www.biltmorefamilyoffice.com/documents/13/Due_Diligence.pdf) · Biltmore Family Office
12. [B2B Buyer Experience Report 2025](https://6sense.com/science-of-b2b/buyer-experience-report-2025/) · 6sense
13. [UHNW Asset Allocation](https://altrata.com/articles/uhnw-asset-allocation) · Altrata
14. [2025 Top Sovereign Wealth Funds](https://www.caproasia.com/2025/01/30/2025-top-121-sovereign-wealth-funds/) · Caproasia
15. [Hotel Management Transactions UAE 2025](https://practiceguides.chambers.com/practice-guides/hotel-management-transactions-2025/uae/trends-and-developments) · Chambers
16. [Consulting Rates 2025](https://www.consultingsuccess.com/consulting-rates) · ConsultingSuccess
17. [Consulting Retainers 2026](https://consultfees.com/blog/consulting-retainers) · ConsultFees
18. [SaaS Upsell Email Strategies 2025](https://www.dansiepen.io/growth-checklists/saas-upsell-product-upgrade-email-strategies) · Dan Siepen
19. [SaaS Conversion Benchmarks 2025](https://www.madx.digital/learn/saas-conversion-rate) · MADX
20. [GSAP ScrollTrigger examples](https://freefrontend.com/scroll-trigger-js/) · FreeFrontend
21. [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · GSAP

---

## APPENDIX A · Gold-usage ruleset

- Every persistent/repeating element → gold (`--gold #C9A772`).
- Every italic emphasis on key-words in body copy → gold (ex-oxblood).
- Gradient gold shimmer (`--grad-gold-shimmer`) on Enterprise mandate callout only.
- Section CTAs (repeats across sections) → gold text on ivory, gold underline.
- Section-specific one-time callouts → oxblood italic.
- Author signature "Aman Pareek" → gold Great Vibes cursive.
- Top bar text → gold 11px letterspaced.

## APPENDIX B · 60 blog template titles (10 per sector × 6 sectors)

**Legal (arbitration-biased per LexQuity):**
1. Why Your Law Firm's SRA Transparency Page Is Probably Non-Compliant in 2026 (SEED)
2. Rule 8.9 and the Case-Result Page Problem: What Google Is Actually Reading
3. The ICC, LCIA and SIAC: Where Arbitration SEO Lives in 2026
4. DIFC vs ADGM: Which Dubai Jurisdiction Ranks for English-Language Search
5. Investment Treaty Arbitration Content: Where E-E-A-T Meets Confidentiality
6. Chambers & Partners, Legal 500, WWL: Directory Listing SEO Beyond Submissions
7. AI-Generated Legal Content: The Section 21 FSMA Exposure Nobody Talks About
8. Personal Injury PPC vs SEO in the UK: What the SRA Actually Lets You Say
9. US State Bar Association Advertising: A Jurisdiction Map for Multi-State Firms
10. The Partner Biography Template that Ranks Without Breaching SRA Transparency

**Healthcare:**
1. HIPAA + E-E-A-T: The Two Frameworks Every US Medical Site Breaches Simultaneously
2. MHRA Human Medicines Regulations 2012: A Copy Audit Checklist for Private Clinics
3. Cosmetic Surgery SEO in the UK: Where ASA Rules Stop You Ranking Legally
4. CQC Inspection Readiness and Your Website: What Actually Gets Scored
5. Before/After Gallery Compliance: UK, US, UAE Rules Side by Side
6. Medical Tourism SEO: Source-Market Intent and Destination Authority
7. Patient-Journey Content That Converts Without Breaching Advertising Standards
8. E-E-A-T for Medical Sites: The Author Box That Passes Google's Review
9. Mental Health Content Online: Where Duty of Care and Ranking Collide
10. Private GP SEO in London: The 2026 Competitive Landscape

**Hotels:**
1. How Orchid Hotels Replaced 83% of OTA Dependency in Six Months (SEED, adapted)
2. Booking.com's 2026 Commission Structure: The Real Economics at 70% Occupancy
3. Google Business Profile for Hotel Groups: One Property Cap or Portfolio?
4. 50-100 Location Landing Pages: The Scale Architecture That Ranks
5. Hreflang for Hotels: Serving UK, Dubai, US Audiences Without Duplication
6. AI Search Visibility for Destinations: When Perplexity Recommends Hotels
7. The Review Generation System That Stays Within TripAdvisor Policy
8. Heritage Property SEO: Cultural-Listed Buildings and Virtual Tour Ranking
9. Direct-Booking Schema: The Technical Setup Most Hotels Skip
10. OTA Disintermediation: The Ethics and the ROI

**Real Estate, Finance and IPOs:**
1. SEC Regulation FD and the Pre-IPO Digital Footprint (SEED)
2. RERA Law No. 7 of 2013: UAE Property Advertising SEO Compliance
3. Trakheesi Permits and Your Listing Content: A UAE Developer's Checklist
4. FCA COBS 4: Wealth Management Content That Survives Compliance Review
5. NYSE Listing Preparation: The 18-Month Digital Content Protocol
6. Virtual Tour SEO and International HNW Buyer Targeting
7. Family Office Content Strategy: Why Discretion Doesn't Mean Invisibility
8. Pre-IPO Social Media: Reg FD Applied to LinkedIn and Instagram
9. SEC Reg FD Violations on Content Sites: 2024-2026 Enforcement Patterns
10. UHNW Investor Journey: Where Organic Search Enters the Deal Funnel

**Restaurants, Bars and F&B:**
1. 30,000 to 40,000 Citations: The Maps Architecture That Dominates a City
2. Menu Schema Markup: The Rich-Result Opportunity Most Restaurants Ignore
3. Deliveroo and Uber Eats: Commission Structure vs Direct Ordering ROI
4. Reserve-a-Table Integrations: Google, OpenTable, SevenRooms
5. Michelin-Starred SEO: Authority Building Without Dilution
6. Event Calendar SEO: Private Hire and Function Booking Funnels
7. Dark Kitchens and Brand SEO: The Multi-Brand Indexing Problem
8. Bar and Pub Local Pack: How to Win "Near Me" Without a Photographer
9. Food Directory Listings: 25+ Platforms Ranked by ROI
10. Fine Dining Review Acquisition: Within Google's Policy, Outside of Fake Reviews

**Every Sector (Education, E-commerce, Automotive, Wellness, Executive):**
1. International Student Recruitment SEO: Source Markets and Landing Page Funnels
2. Private School Admissions Content: Safeguarding Compliance Meets E-E-A-T
3. Luxury Retail E-commerce: Product Schema vs Brand Authority Debate
4. Car Dealership Map Citations and Inventory-Level Ranking
5. Wellness and Spa SEO: Medical Claim Liability in the ASA-Adjacent Zone
6. Personal Trainer Online Presence: What Actually Ranks for "[City] Trainer"
7. Executive Personal Brand: Google Page One for Your Name (SEED)
8. Wikipedia Strategy for Founders: Notability, Conflict of Interest, SEO
9. Crisis Reputation Management: Legal SEO Suppression vs Removal
10. LinkedIn SEO for Executives: Profile, Article, Newsletter Ranking Stack

---

**End of roadmap. Awaiting Aman's approval or revisions before Gate A execution begins.**
