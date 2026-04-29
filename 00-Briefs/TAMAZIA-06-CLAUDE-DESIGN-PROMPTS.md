# TAMAZIA · CLAUDE DESIGN · EXACT PROMPTS GATE BY GATE
**Ready to copy-paste directly into Claude Design (claude.ai → Design tab).**
**Each gate is an independent session. Approve output before moving to next gate.**

---

## PRE-FLIGHT · WHAT TO UPLOAD TO CLAUDE DESIGN FIRST

Upload to the Claude Design session **once at the start**:

**Documents (attach as files):**
1. `TAMAZIA-01-BUILD-BIBLE.md` — the single source of truth.
2. `TAMAZIA-02-AESTHETIC-REFERENCES.md` — 17 reference sites with analysis.
3. `TAMAZIA-03-CLIENT-TARGETS.md` — top 100 target clients.
4. `TAMAZIA-04-ELEMENTS-LIBRARY.md` — 100 unique elements catalogue.
5. `TAMAZIA-05-AUDIT-ENGINE.md` — Quick Audit Engine full spec (for Gate 1 visual states).

**Images (attach):**
1. Tamazia wordmark logo (PNG you supplied).
2. `screenshots/00-tamazia-current.png` — current site.
3. `screenshots/04-clifford-chance.png` — legal gravitas reference.
4. `screenshots/05-brunello-cucinelli.png` — heritage luxury palette reference.
5. `screenshots/02-patek-philippe-v2.png` — timepiece craft reference.
6. `screenshots/07-perella-weinberg.png` — boutique advisory tier 1 reference.
7. `screenshots/09-slaughter-may.png` — monochrome discipline reference.
8. `screenshots/03-aman-resorts.png` — luxury hospitality reference.
9. `screenshots/06-ft.png` — editorial information design reference.
10. (optional) `screenshots/11-rothschild.png` · `screenshots/16-stonehage-fleming.png` · `screenshots/17-christies.png` · `screenshots/18-assouline.png` — additional tonal anchors.

That's the complete reference load. Don't re-upload these per gate; Claude Design carries them forward in the session.

---

## GATE 1 · HEADER + HERO + QUICK AUDIT ENGINE

### PROMPT TO PASTE (verbatim)

```
You are designing the new homepage for Tamazia, a lawyer-led SEO and regulatory compliance firm.

Audience: Managing Partners at Magic Circle law firms (Clifford Chance, Kirkland & Ellis, Slaughter and May), Group CMOs at Aman Resorts and Mandarin Oriental, General Counsel at NYSE-listed companies, Principals at Julius Baer and Rothschild & Co. Age 42 to 65. They read the FT. They respond to Hermès, Patek Philippe, and Clifford Chance aesthetics. They reject Linear, Vercel, OpenAI, and any startup tech aesthetic on sight.

Aesthetic formula: institutional luxury editorial (80%) + Swiss-watchmaker precision craft (15%) + AI-era technology signal (5%). Technology is shown through craftsmanship detail, never through tropes like gradient meshes, hexagon patterns, neural network illustrations, or dark-mode neon.

Compass sentence: "This site looks as if Hermès, Clifford Chance, and a Swiss watchmaker collaborated on an SEO firm."

Read the attached Build Bible section 01-04, the Aesthetic References document, and the Audit Engine spec. Reference the attached screenshots for calibration: Clifford Chance and Slaughter and May for legal gravitas, Brunello Cucinelli for heritage palette, Patek Philippe for single-object hero treatment, Perella Weinberg for boutique advisory tone, Aman Resorts for luxury hospitality composition, FT for editorial rhythm.

Brand system:
- Typography: Playfair Display for display (H1, H2, key numerals, pull quotes), Inter for body and UI, Freight Big Pro for oversized numerals 80-220px.
- Colour: ivory #FAF7F2, obsidian #1A1A1D, oxblood #5A1A2B, gold #C9A772 (matches logo), pearl #E8E4DC. No more than two colours per section. Gold is signal, never fill.
- Motion: GSAP ScrollTrigger language, 600-900ms easing cubic-bezier(0.2, 0.8, 0.2, 1). No bounce, no elastic.
- 3D object in hero is "The Scales of Law and Search": gold apothecary scale balancing a marble Lex monogram against a pearl-crystal search cursor, rotating 360° over 60 seconds, on obsidian backdrop with radial gold glow.

For this gate design three sections only:

SECTION 01 HEADER: Two-level sticky header. Top strip 32px ivory with centred Inter 11px caps "LONDON · DUBAI · NEW YORK · PARIS · MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION." Bottom strip 72px ivory with Playfair wordmark "Tamazia" 28px left, Inter 13px caps nav right, oxblood CTA "REQUEST A BRIEFING" far right. Scroll-shrink behaviour. 1px gold progress bar below header.

SECTION 02 HERO: Full-bleed obsidian 100vh. Split 60/40. Left: pre-headline Inter 15px italic pearl, H1 Playfair 96px ivory three-line kinetic stagger "Outrank competitors. Master regulators. One agency.", sub-headline Playfair italic 24px gold, paragraph Inter 16px pearl with 200+ laws list, pull quote Playfair 28px gold "Ranking is only valuable if it is legal." in gold corner brackets, primary CTA oxblood. Right: 3D centrepiece rotating slowly. Bottom band 56px with scrolling trusted-by marquee. Scroll cue gold hairline.

SECTION 03 QUICK AUDIT ENGINE: Full-width ivory below hero, 96px padding, monogram watermark 3%. Eyebrow Inter 11px caps oxblood "LIVE INSTRUMENT." Playfair italic 28px oxblood headline "Benchmark your current presence in 2 seconds." Inter 15px ink-muted subline. Gold hairline underline input 56px × 480px, placeholder "yourdomain.com  ·  or  ·  primary keyword." Oxblood filled button "RUN AUDIT" 56px × 140px. Link "View a sample audit →" below. Design the empty state, the loading state (gold hairline Fabergé progress bar filling left to right), and the result state (ivory card 960px max with 1px gold hairline, Freight Big Pro three-metric grid, Playfair italic editorial observation in gold corner brackets, sector compliance snippet pill, primary CTA, PDF opt-in checkbox).

Preserve every word of copy verbatim from the Build Bible. Do not design subsequent sections. Output clean HTML/CSS/JS without a framework. CSS must use custom properties and clamp() for fluid typography. Container-type: inline-size on all cards. No fixed pixel heights. Magnetic CTA pull on primary buttons only. Respect prefers-reduced-motion.

Show me the three states of the Quick Audit Engine, and the Header + Hero at desktop 1440px width. I will approve before moving on.
```

### APPROVAL CRITERIA (for Aman to check before saying "approved")

- Typography matches Playfair + Inter + Freight Big Pro, no sans-serif H1.
- Colours match exactly: ivory, obsidian, oxblood, gold `#C9A772`, pearl.
- Hero is full-bleed obsidian, 60/40 split.
- H1 reads the verbatim three-line copy.
- Pull quote "Ranking is only valuable if it is legal." in gold corner brackets.
- Trusted-by marquee includes all three clients: Kamat, CGON, Meraas.
- Quick Audit Engine has three states clearly designed.
- CTA language is exactly "REQUEST A BRIEFING" (header) and "Request your compliance and SEO audit" (hero) and "RUN AUDIT" / "REQUEST YOUR FULL COMPLIANCE AND SEO AUDIT" (audit engine).
- Zero startup aesthetic cues: no hexagons, no gradients, no neural networks, no emoji.
- Accessibility: visible focus states, readable contrast, semantic HTML.

---

## GATE 2 · WHY US + SECTORS + INTERSTITIAL

### PROMPT TO PASTE

```
Gate 1 approved. Continue with sections 04, 05, and 06 per Build Bible. Same brand system, same aesthetic compass.

SECTION 04 WHY US: Full-width pearl background, 160px vertical padding, monogram watermark 3%. Centred H2 Playfair 48px oxblood verbatim "Any agency can rank you. Not every agency has read your sector's laws." 2px gold hairline 80px wide drawing in from centre on scroll-into-view. Verbatim two paragraphs below. Pull quote "International business law expertise at the core." Playfair italic 22px gold with corner brackets. Three-column stat grid with Freight Big Pro 128px gold numerals: "4×" + "RECORD CLIENT REVENUE GROWTH OVER 4 YEARS" with sparkline; "200+" + "LAWS REVIEWED PER CAMPAIGN" with scale-of-justice icon; "4" + "REVENUE ACROSS FOUR CONTINENTS" with compass icon. Numerals roll from 0 on scroll. Credential strip: Google Partner, Meta Business Partner, Marketing Partner, Chartered Institute of Arbitrators, American Bar Association — greyscale to colour on hover. Scroll prompt italic "Continue to sectors →"

SECTION 05 SECTORS: Full-bleed obsidian, 160px padding, monogram 3%. H2 "Every sector. One standard." Playfair 48px ivory left-aligned. Asymmetric bento grid (12-column): Legal card is 2×2 (cols 1-6, rows 1-2), other 5 cards are 1×1. Each card: obsidian, 1px gold hairline, 24px radius, 24px padding. Top-left Roman numeral in Playfair italic gold. Top-right 3D sculptural object (describe each in section 05 of Build Bible). Middle: Inter caps "SECTOR 0X / VI." Playfair 28px ivory headline. Gold monospace-caps regulatory shorthand strip (e.g. "SRA. BAR. DIFC. GDPR."). Inter 14px pearl body with 3-line clamp on standard cards. Per-card gold underline CTA. Hover: card lifts 8px, border intensifies, 3D rotates 5°, regulation tooltip spawns.

SECTION 06 INTERSTITIAL: Full-width ivory strip 96px tall, monogram 2%. Centred 2px gold hairline 80px drawing in. Above: Playfair italic 18px "III." Below: Inter 11px caps 0.2em "CASE STUDIES." No interactivity.

Use verbatim sector copy from Build Bible section 04. Six sector cards: Legal (2×2), Healthcare, Hotels, Real Estate & IPOs, F&B, Every Sector catch-all.

3D objects per card (generate as part of this gate, batch all six in the set so they look cohesive):
- Legal: Gilded Gavel on Vellum
- Healthcare: Rod of Asclepius as Precision Instrument
- Hotels: Concierge Bell
- Real Estate & IPOs: NYSE Opening Bell
- F&B: Silver Cloche lifting to reveal map pin
- Every Sector: Compass Rose

Material language for all 3D: polished gold (brass-warm), matte obsidian, polished marble, pearl/alabaster, crystal for data objects. Single cinematic key light upper-left 45°. Shallow DOF. 85mm camera. Obsidian backdrop with radial falloff.

Show me all three sections at 1440px. I will approve before Gate 3.
```

---

## GATE 3 · CASE STUDIES + HOW TAMAZIA WORKS

### PROMPT TO PASTE

```
Gate 2 approved. Continue with sections 07 and 08.

SECTION 07 CASE STUDIES: Centred header Playfair 48px oxblood "Case Studies." Subline Inter italic 15px "Case I. II. III. — Three clients. Three regulators. Every number below is verified." Three stacked panels each 96vh, alternating obsidian/ivory/obsidian backgrounds.

Case I HOSPITALITY (obsidian): Left half — Inter 11px caps gold eyebrow "CASE I · HOSPITALITY · HOTEL GROUP · ASIA PACIFIC." Playfair 56px ivory pull quote "If you are paying OTA commission, you are funding your competitor's marketing." Paragraph Inter 16px pearl. VERIFIED gold seal with "DATA VERIFIED AGAINST HOTEL GROUP INTERNAL BOOKING SYSTEM, 2024." Right half — Freight Big Pro 220px gold "£1.2M" with Inter caps caption "ANNUAL OTA COMMISSION SAVED · 100-ROOM PROPERTY · POST-ENGAGEMENT."

Case II REAL ESTATE (ivory, inverted): Verbatim copy. Meraas faint logo watermark 10% background. RERA-DIFC-Dubai Holding verification stat.

Case III HEALTHCARE (obsidian): Verbatim CGON copy. Freight Big Pro 220px gold "+96%" with caption "NYSE IPO SHARE PRICE MOVEMENT · CG ONCOLOGY (CGON) · 2024. VERIFIED PER SEC FILINGS." Include superscript link reference to SEC EDGAR filing.

Below three panels, 160px gap, full-width ivory. Centred pull quote Playfair 40px oxblood "Your digital agency is either a compliance asset or a compliance risk. There is no middle position." 2px gold hairline 120px drawing in on scroll.

SECTION 08 HOW TAMAZIA WORKS: Full-width ivory, 160px padding. Left column 40% — eyebrow Inter 11px caps gold "IV. HOW TAMAZIA WORKS." H2 Playfair 56px oxblood. Verbatim paragraph Inter 17px. Pull quote Playfair italic 32px oxblood with gold brackets "Every unreviewed piece of content is exposure. It compounds. When a regulator notices, your agency does not share the liability. You do."

Right column 50% — five role cards stacked, each 88px tall ivory with 1px gold hairline, 24px padding. Each card: gold hairline 48px icon (Book for Regulatory Analysts, Signal for AI Search Engineers, Quill for Legal Content Strategists, Wrench for Technical SEO Architects, Line-chart for Revenue Attribution Analysts), Playfair 20px ink role title, Inter 14px ink-muted one-line description. Sequential reveal 180ms stagger on scroll.

Below both columns — horizontal gold hairline 40% width left-aligned. Founder sign-off block: optional 96×96 portrait with 4px gold border, Playfair italic 20px "Led by the founder, LLM in International Business Law." Inter 13px caps "KING'S COLLEGE LONDON · MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION." Gold cursive signature "A. Igga." CTA text link gold underline "Request your compliance and SEO audit →"

Inline regulatory citation chips throughout where referenced (SRA RULES, FCA PROMOTION CODES, MHRA HEALTH CLAIMS, GDPR, ASA) — small gold hairline pills with tooltip reveal.

Show me both sections at 1440px.
```

---

## GATE 4 · PRICING + FAQ

### PROMPT TO PASTE

```
Gate 3 approved. Continue with sections 09 and 10.

SECTION 09 PRICING: Ivory background, 160px padding. Centred header eyebrow "V. ENGAGEMENT TIERS." Playfair 48px oxblood "Pricing." Inter italic 16px ink-muted intro verbatim.

Three-card grid, 32px gap:

Card I Foundation — pearl background, 1px gold hairline. Playfair italic 14px gold "I." top-left. Playfair 32px ink "Foundation." Freight Big Pro 80px oxblood "From £2,500." Inter italic 14px ink-muted "Best for single-location businesses building local search authority." Four-icon row 40px gold hairline (Audit, Team, Deliverables, Review). Inter 13px ink verbatim best-for paragraph. Oxblood ghost button 48px "Request your compliance and SEO audit" with 1px gold border.

Card II Authority — pearl, elevated 8px shadow gold 10%. Same structure. "II." "From £4,500." Includes line "The team that works on your account does not rotate. The founder reviews every deliverable before it leaves."

Card III Enterprise — obsidian background, ivory text, double gold border (2px inner + 1px outer with 4px gap), 1.05× scale. "III." "From £9,500." Oxblood filled CTA.

Below three cards, 96px gap. Gold-hairline-framed callout on obsidian with 1px gold top and bottom, 24px vertical padding. Inter 14px caps 0.1em gold centred verbatim "FOR PRE-IPO PREPARATION, LISTED COMPANIES, AND INTERNATIONAL ENTERPRISE GROUPS, ENGAGEMENT IS STRUCTURED TO MANDATE. SPEAK WITH THE FOUNDER BEFORE ANY SCOPE IS AGREED." 24px gap. Oxblood button "SPEAK WITH THE FOUNDER" with gold border. Beside button, gold cursive signature "A. Igga." Micro-note below: Inter italic 12px ink-muted "Pricing is indicative. All engagements are bespoke."

SECTION 10 FAQ: Ivory, 160px padding. Left-aligned header max-width 320px: eyebrow "VI. FAQ." H2 Playfair 48px oxblood "FAQ." Inter italic 16px ink-muted intro.

Two-column layout. Left column 40% sticky with FAQ category nav: "01 AUDIT PROCESS (5)" "02 SECTORS (7)" "03 INDIVIDUAL CLIENTS (4)" "04 WHAT THE AUDIT INCLUDES (4)" "05 FEES AND ENGAGEMENT (3)." Inter 14px caps 0.1em ink-muted. Active category gold with 3px dot.

Right column 60%: expandable FAQ cards with FAQ-gold-box styling — oxblood fill with gold accent, Playfair 22px question, Inter 15px answer, 16px radius, 24px padding, 24px gap between cards. Chevron gold hairline rotates 180° on expand. aria-expanded + aria-controls.

Featured at top of "01 AUDIT PROCESS": horizontal 4-node timeline 80px tall. Each node 48px circle 1px gold hairline with Playfair Roman numeral inside. Below nodes: Inter 11px caps gold "WEEK 01 · TECHNICAL" / "WEEK 02 · ON-PAGE & COMPLIANCE" / "WEEK 03 · OFF-PAGE" / "WEEK 04 · GBP & CONTENT." Gold hairline connecting nodes.

Inline regulatory citation chips throughout answers: small gold hairline pills Inter 11px caps. Tooltip reveals full rule text.

Editorial break between "03" and "04": full-width Playfair 32px oxblood centred pull quote with gold corner brackets "These sectors share one characteristic: in all of them, an SEO mistake costs the client more than the agency ever charged."

Below FAQ full-width centred: Inter italic 15px ink-muted max-width 560px "Still have a question not answered here? The SEO and compliance audit is where every conversation starts. Reach out and we will answer anything specific to your sector and scale before any commercial discussion begins." Text link gold hairline underline "Reach out →"

Use verbatim FAQ content from the Build Bible. Show me both sections at 1440px.
```

---

## GATE 5 · CONTACT + FOOTER

### PROMPT TO PASTE

```
Gate 4 approved. Continue with sections 11 and 12 — the final gate.

SECTION 11 CONTACT: Full-width obsidian, 160px padding, monogram 3%. Centred header: eyebrow "VII. CONTACT." Playfair 48px ivory "Every engagement begins with a conversation." Inter italic 15px pearl 80% "Start yours below. Under NDA on request. Average response under 12 hours."

Two-column split 50/50 with 48px gap, max-width 1200px.

Left column Custom Form: Inter 11px caps 0.15em gold field labels above each input. Inputs as transparent background with 1px gold hairline bottom only, Inter 16px ivory typing, 48px tall, 24px gap between fields. Fields: Full name, Company or Organisation, Your role or title, Regulated sector (select), What is the primary outcome you want to achieve? (textarea 4 rows). Pre-fill support when user arrives via Quick Audit engine (sector detected, primary outcome pre-filled with audit summary, user can edit). Inline validation: valid = thin gold hairline, error = thin oxblood hairline + Inter 12px oxblood error text. 48px gap. Submit button: oxblood filled, 1px gold border, Inter 13px caps 0.1em ivory "REQUEST YOUR SEO & COMPLIANCE AUDIT." 64px tall, full column width. Magnetic cursor pull.

Right column Calendly: label Inter 11px caps gold "OR SCHEDULE DIRECTLY." Calendly iframe 520px tall with 1px gold hairline, brand-themed ivory/oxblood/gold.

Below both columns 80px gap. Centred 2px gold hairline 160px. Inter italic 13px pearl 60% centred "All briefings are conducted under NDA on request. The founder reviews every enquiry."

Success state: form replaces with Playfair 28px ivory "Your briefing request has been received." Inter 15px pearl "The founder will be in touch within 12 hours." Inter italic 13px pearl 70% "If your enquiry is time-sensitive, book directly using the calendar." aria-live polite announces.

SECTION 12 FOOTER: Full-width obsidian, 120px top padding, 40px bottom padding, 2px gold hairline top, monogram 5%.

Three columns 48px gap:

Col 1 (40% brand): Full logo lockup (horse + wordmark + ornament) at 96px tall. 24px gap. Tagline Playfair italic 18px gold "International SEO for regulated enterprises." 32px gap. Location Inter 13px caps 0.15em pearl "LONDON · DUBAI · NEW YORK · PARIS." 16px gap. Credentials Inter 11px caps 0.15em gold "MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION · GOOGLE PARTNER · META BUSINESS PARTNER."

Col 2 (30% navigation): Header Inter 11px caps 0.2em gold "NAVIGATION." Vertical list Inter 14px pearl 16px gap: Why Us, Sectors, Case Studies, How We Work, Pricing, FAQ, Contact. Gold hairline underline on hover.

Col 3 (30% regulatory briefings): Header Inter 11px caps 0.2em gold "REGULATORY BRIEFINGS." Inter 14px pearl body verbatim "Receive a quarterly briefing on regulatory developments affecting your sector. No marketing, no sales. Findings only." Email input 1px gold hairline bottom, transparent, 48px tall, Inter 15px italic pearl placeholder "your@domain.com." Oxblood button 48px 1px gold border Inter 13px caps "SUBSCRIBE."

Below all columns 80px gap. 1px gold hairline full-width. 24px gap. Bottom flex row: left Inter 11px pearl 60% "© Tamazia 2026. All rights reserved." Right Inter 11px pearl 60% with gold hairline underline on hover "TERMS · COOKIE POLICY · PRIVACY · MODERN SLAVERY STATEMENT."

Fixed bottom-right corner after hero scroll: Back-to-top gold hairline up-arrow 32×32px fades on scroll to top.

Single LinkedIn link top-right of Col 1: 32px gold hairline LinkedIn glyph.

Show me both sections at 1440px. This is the final gate for Claude Design.
```

---

## AFTER GATE 5 · HAND OFF TO CLAUDE CODE

Once Claude Design has produced approved HTML/CSS/JS for all 12 sections, the session output is bundled and handed to Claude Code (via Netlify Agent Runners or directly) with this instruction:

### CLAUDE CODE HANDOFF PROMPT

```
You are implementing the Tamazia.in rebuild. Claude Design has produced approved HTML/CSS/JS for all 12 homepage sections at 1440px desktop width. Your job: convert into a production Astro project, engineer full fluid responsiveness across 18 viewports, build the Quick Audit Engine backend, deploy to Netlify staging.

Read the Build Bible (TAMAZIA-01-BUILD-BIBLE.md) for system rules. Read the Audit Engine Spec (TAMAZIA-05-AUDIT-ENGINE.md) for backend implementation.

Tech stack:
- Astro with TypeScript.
- Tailwind CSS v4 (utility + custom properties).
- GSAP ScrollTrigger for all motion (replaces Elementor Motion; Safari-safe).
- MDX for future blog posts (empty at launch, scaffold only).
- Netlify hosting: free tier, Edge Functions for Quick Audit backend.
- Git version control.

Convert each Claude Design section into an Astro component:
- Header.astro, Hero.astro, QuickAudit.astro, WhyUs.astro, Sectors.astro, Interstitial.astro, CaseStudies.astro, HowWeWork.astro, Pricing.astro, FAQ.astro, Contact.astro, Footer.astro.

Fluid responsive engineering:
- container-type: inline-size on every card.
- @container queries drive card-internal responsiveness.
- clamp() on typography, padding, margin, gap.
- min-height, never height, on cards.
- min-width: 0 on flex children.
- overflow: clip where needed.
- CSS Grid auto-fit + minmax() for card grids.
- Test at 18 viewports: 320, 375, 390, 414, 428, 768, 820, 1024, 1280, 1366, 1440, 1536, 1600, 1728, 1920, 2560, 3440, 3840 px.

Quick Audit Engine backend:
- Netlify Edge Function at /api/audit.
- Free-tier APIs: Google PageSpeed Insights, Mozilla Observatory, Chrome UX Report, direct HTML fetch, Google Autocomplete, Serper.dev free tier (or SearXNG), Wikipedia entity API.
- Cache layer: Upstash Redis free tier OR Cloudflare Workers KV.
- Rate limit: 20/hour per IP, 5/min per session.
- Compliance snippet JSON library (~80 snippets organised sector × issue).
- Observation template library (~20 variants).
- Founder alert via Resend when high-value domain audited.
- No open AI-generated text at launch (hallucination risk).
- P95 response target: under 2.5 seconds.

Accessibility: WCAG 2.1 AA binding. Semantic HTML. ARIA on interactive elements. Visible focus indicators 2px gold #C9A772 with 2px offset. Respect prefers-reduced-motion.

Performance: LCP < 1.5s, TBT < 200ms, CLS < 0.1, Lighthouse Performance > 95.

Deploy first to Netlify staging subdomain (tamazia.netlify.app). After staging approved, execute DNS cutover at Bigrock — change A record to Netlify apex IP, never touch MX records.

Produce a deploy preview I can review.
```

---

## RESCUE / REVERT GUIDANCE

If Claude Design produces something that drifts off-brand at any gate:

Say this:
```
The output drifts from the compass sentence "Hermès, Clifford Chance, and a Swiss watchmaker collaborated on an SEO firm." Specifically [name the drift — too tech, too playful, too cold, wrong palette]. Reground against Reference [name specific screenshot]. Keep all copy verbatim. Re-output this section only.
```

If a specific element breaks WCAG:
```
The [element] fails WCAG 2.1 AA on contrast. Adjust to meet 4.5:1 minimum for body text or 3:1 for large text. Do not change palette values; adjust opacity or weight instead.
```

If responsive behaviour is wrong:
```
Claude Design outputs 1440px only — responsive is Claude Code's job. Do not specify any viewport-level behaviour. Remove any @media queries. The HTML structure and CSS custom properties will be made fluid downstream by Claude Code using container queries and clamp().
```

— End of Claude Design prompts —
