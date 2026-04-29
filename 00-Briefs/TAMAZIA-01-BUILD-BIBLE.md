# TAMAZIA.IN · BUILD BIBLE
**Single source of truth for the Tamazia rebuild.**
**Supersedes v1, v2, v2-part2, and logo-description.**
**Written for direct ingestion by Claude Design and Claude Code.**
**Date: 24 April 2026 · Canonical viewport: 1440px · Target responsive: 18 widths from 320 to 3840px.**

---

## 00 · HOW TO USE THIS DOCUMENT

Read sections in order. Each section builds on the last. Claude Design should reference §02 (Aesthetic) and §03 (Brand System) as it produces output for §04 (Section Specs). Claude Code inherits the entire build bible plus the separate audit engine spec.

**Contents:**
- §01 Positioning and clientele.
- §02 Aesthetic direction (recalibrated to institutional luxury editorial, no techy-AI cues).
- §03 Brand system (typography, colour, material language, motion, logo usage).
- §04 Section-by-section specs for all 12 homepage sections. Every section: verbatim copy, 15+ brainstormed ideas, curated picks, final direction.
- §05 3D illustration briefs (7 objects, unified material language).
- §06 Accessibility standard (WCAG 2.1 AA binding).
- §07 Anti-patterns (20 things that never ship).
- §08 Handoff protocol (Claude Design vs Claude Code ownership).
- §09 Acceptance gates.
- §10 Risk register.
- §11 Timeline.

---

## 01 · POSITIONING AND CLIENTELE

Tamazia is a **lawyer-led SEO and regulatory compliance firm for regulated enterprises**. Founded and led by a LLM (Master of Laws) graduate in International Business Law from King's College London. Every campaign passes through 200+ laws before publication: GDPR, FCA, SRA, MHRA, ASA, HIPAA, EU AI Act, SEC Regulation FD, DFSA Conduct of Business, RERA. Offices/presence: London, Dubai, New York, Paris. Memberships: Chartered Institute of Arbitrators, American Bar Association.

Verified case studies:
- **Kamat Hotels** (NSE-listed), hospitality.
- **CG Oncology** (NYSE: CGON), +96% share move at IPO, zero compliance incidents.
- **Meraas** (Dubai Holding subsidiary), UAE real estate and lifestyle.

### Clientele (summary; full 100 in `TAMAZIA-03-CLIENT-TARGETS.md`)

Seven target sectors with exemplars:
- **Legal**: Clifford Chance, Kirkland & Ellis, Slaughter and May, Davis Polk, Macfarlanes.
- **Hospitality**: Aman Resorts, Mandarin Oriental, Rosewood, Four Seasons, The Leela.
- **Healthcare**: HCA Healthcare UK, Cleveland Clinic Abu Dhabi, Mayo Clinic International, The London Clinic.
- **Real Estate / IPO**: Emaar, Meraas, Berkeley Group, Knight Frank Private Office.
- **Finance / Wealth**: Julius Baer, Pictet, Rothschild & Co, Coutts, Stonehage Fleming.
- **Fine Dining / Private Clubs**: Gordon Ramsay Restaurants, Nobu Hospitality, Soho House.
- **Institutional / Professional Services**: Perella Weinberg, Evercore, Big Four Legal arms, LCIA, ICC.

Archetype: **Managing Partner / Group CMO / General Counsel / Principal, aged 42–65, who reads the FT, and whose first test of a vendor is whether the vendor would be comfortable in front of their client, their regulator, and their board simultaneously.**

### What this clientele responds to

Restraint. Typography. Whitespace. Verified evidence. Institutional references. Swiss-watchmaker craftsmanship. Silence.

### What this clientele rejects on sight

Startup aesthetic. Cartoon illustrations. Emoji. Hexagons. Neural-network clichés. "Free audit" retail CTA language. Pop-ups. Chat widgets. Stock photography of "diverse teams." Drift from editorial gravitas.

---

## 02 · AESTHETIC DIRECTION

### The aesthetic compass

"Tamazia's website looks as if **Hermès, Clifford Chance, and a Swiss watchmaker collaborated on an SEO firm.**" This single sentence resolves every ambiguous design question. If a choice fits that sentence, it stays. If it doesn't, it goes.

### The aesthetic formula (locked)

**Institutional luxury editorial (80%) + Swiss-watchmaker precision craft (15%) + AI-era technology signal (5%).**

Technology is shown through craftsmanship (a sparkline drawn in hairline gold, a loading line filling precisely, a number rolling tabular). Technology is never shown through tropes (no gradient meshes, no hexagon patterns, no neural network illustrations, no dark-mode neon, no particle systems, no "cyber" visuals).

### Reference sites (17 curated; full analysis in `TAMAZIA-02-AESTHETIC-REFERENCES.md`)

Legal gravitas: Clifford Chance · Slaughter and May · Davis Polk · Macfarlanes · Freshfields · White & Case.
Wealth and advisory: Rothschild & Co · Julius Baer · Stonehage Fleming · Perella Weinberg · Evercore.
Heritage luxury: Brunello Cucinelli · Assouline · Christie's · The Beaumont Hotel · Knight Frank Private Office · Rolls-Royce Motor Cars.
Timepiece precision: Patek Philippe.
Hospitality: Aman Resorts.
Editorial publishing: Financial Times.

### What Tamazia is NOT

Not Linear. Not Vercel. Not OpenAI. Not Anthropic. Not ChatGPT. Not Cursor. Not a tech startup website. Not an agency template. Not Framer. Not a dark-mode SaaS landing page.

---

## 03 · BRAND SYSTEM

### Logo (supplied by Aman)

Vertical lockup: stylised antique-gold horse in mid-trot above serif caps wordmark "TAMAZIA", small tri-petal lotus ornament below flanked by thin gold hairlines, all on deep oxblood.

**Colour derived from logo:** oxblood `#5A1A2B`, antique warm gold approximately `#C9A772`. The logo's gold is warmer and brighter than the `#B8965A` proposed earlier; **the brand system now uses `#C9A772` as the canonical gold** to match the logo exactly.

**Usage rules:**
1. Primary header: wordmark only (no horse). Playfair-matching weight. 28px tall.
2. Footer: full lockup (horse + wordmark + ornament) at 96–128px tall.
3. Favicon: horse mark alone. 256/64/32/16.
4. Watermark pattern: horse silhouette at 3% opacity, diagonal diamond lattice at 120px intervals.
5. Social OG image: full lockup on oxblood, 1200×630.
6. Minimum size: 120px wide for wordmark, 48px tall for horse.
7. Clear space: 0.5× wordmark height on all sides.
8. Never: stretch, recolour, drop-shadow, outline, gradient-fill, place on busy backgrounds.
9. Dark contexts: gold-on-oxblood as supplied.
10. Light contexts (rare): oxblood-on-ivory or gold-on-obsidian. Never gold-on-ivory except on oversized display (24px+).

Alt text: `Tamazia wordmark and horse mark, classical serif display caps in antique gold over deep oxblood. Symbol of the firm's international regulatory and search practice.`

### Colour palette (FINAL)

```
--ink: #0A0A0B
--ivory: #FAF7F2
--oxblood: #5A1A2B
--gold: #C9A772       /* matches logo */
--gold-warm: #D4B787  /* hover state */
--pearl: #E8E4DC
--obsidian: #1A1A1D
--ink-muted: #4A4A4D
--hairline: rgba(10,10,11,0.12)
```

**Rules:** no more than two colours per section. Gold is signal, never fill. Oxblood is reserved for hero and one or two moments. Ivory and obsidian are the only backgrounds.

### Typography

- **Display serif:** Playfair Display. H1, H2, key numerals, pull quotes. Variable weight 400–900. Hanging punctuation on quotes. Tabular lining on statistics.
- **Body sans:** Inter. Body copy, UI, navigation. Weights 400 regular + 500 medium only.
- **Accent serif:** Freight Big Pro (fallback GT Sectra) for oversized numerals 80–220px only.

Fluid type scale (clamp-driven, never fixed on display elements):
```
H1        clamp(48px, 5vw + 1rem, 96px)
H2        clamp(32px, 3vw + 0.5rem, 56px)
H3        clamp(20px, 1.5vw + 0.5rem, 28px)
H6 caps   12px 0.15em tracking uppercase
Body      clamp(15px, 0.5vw + 0.75rem, 17px)
Small     13px
Micro caps 11px 0.2em tracking
```

### Material language (for 3D illustrations)

Five materials, used cohesively across all 3D objects:
1. **Polished gold** (brass-warm, not Rolex-yellow).
2. **Matte obsidian** (velvet-feel 3% specular).
3. **Polished marble** (warm cream, faint grey veining, for pedestals).
4. **Pearl / alabaster** (soft translucent white).
5. **Crystal / glass** (sharp refraction, cold, for data objects only).

All renders: single cinematic key light upper-left 45°. Shallow DOF f/2.8. 85mm portrait camera equivalent. Obsidian backdrop with soft radial falloff. Centred or rule-of-thirds composition.

### Motion rules

- Slow, confident, unhurried. 600–900ms transitions. Never snappy.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` entrances. `cubic-bezier(0.4, 0, 0.2, 1)` exits.
- Parallax: GSAP ScrollTrigger only. Never Elementor Motion.
- Respect `prefers-reduced-motion`.
- Hover: max 3° card tilt, max 1.02 scale. Gold hairline fade-in.
- No bounce, elastic, overshoot.

### Responsive engineering rules

- CSS Grid `grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr))` for all card grids.
- `container-type: inline-size` on every card. `@container` rules drive card-internal responsiveness.
- `clamp()` on typography, padding, margin, gap.
- `min-height` never `height` on cards. `min-width: 0` on flex children. `overflow: clip` where needed.
- 18-viewport target: 320, 375, 390, 414, 428, 768, 820, 1024, 1280, 1366, 1440, 1536, 1600, 1728, 1920, 2560, 3440, 3840.

### Watermark and noise

- Tamazia horse monogram at 3% opacity, diagonal diamond lattice at 120px intervals, applied to hero, footer, and one or two section backgrounds only.
- Noise grain 1.5% opacity applied globally. Kills digital sterility, imitates FT print-digital hybrid feel.
- 1px oxblood or gold hairlines between major sections.

---

## 04 · SECTION-BY-SECTION BUILD SPECS

The homepage has 12 sections. Each section follows: verbatim copy · 15+ brainstormed ideas · curated picks · final direction.

---

### SECTION 01 · HEADER / NAVIGATION

**Copy verbatim:** Logo (Tamazia wordmark). Nav: Why Us · Sectors · Cases · Process · Pricing · FAQ · Contact. CTA: Request a Briefing (→ calendly.com/tamazia).

**Brainstorm (18 ideas):**
1. Single-row magazine masthead (logo left, nav centre, CTA right).
2. Two-level header: top dateline strip + bottom logo/nav/CTA strip.
3. Playfair wordmark only (no horse icon in header).
4. Inter small caps 13px 0.1em tracking for nav items.
5. Oxblood CTA button with 1px gold hairline border.
6. Nav gold hairline underline draws left-to-right on hover.
7. Scroll-shrink from 96px to 56px with backdrop-blur.
8. Scroll-spy 3px gold dot to left of active nav item.
9. Dateline strip: "LONDON · DUBAI · NEW YORK · PARIS · MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION."
10. Progress hairline gold bar below header fills as user scrolls.
11. Mobile drawer: full-bleed obsidian sliding from right.
12. Search icon opening FAQ overlay (Phase 2).
13. Current local time widget top-right ("LONDON 14:32 GMT").
14. Monogram watermark 3% opacity in header background.
15. Logo wordmark animates subtly on first load (letters fade in 60ms stagger).
16. Nav item micro-preview on hover (hovering "Sectors" reveals the six sector names in floating list).
17. Skip-to-content link for keyboard users, visible only on focus.
18. Language selector (Phase 2, future internationalisation).

**Curated picks:** 2, 3, 4, 5, 6, 7, 8, 9, 10, 17.

**Final direction:**

Two-level sticky header.

**Top strip (32px tall, ivory, 1px oxblood hairline below, Inter 11px caps 0.15em tracking):** centred text `LONDON · DUBAI · NEW YORK · PARIS · MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION`. No interactive elements.

**Bottom strip (72px tall, ivory):** Playfair "Tamazia" wordmark 28px ink 0.04em tracking left-aligned. Nav items right-aligned: `Why Us · Sectors · Cases · Process · Pricing · FAQ · Contact` in Inter 13px caps 0.1em tracking ink, 24px gap between items. Oxblood filled CTA button far right, 1px gold border, Inter 13px caps 0.1em "REQUEST A BRIEFING" ivory, 48px tall 180px wide, → `calendly.com/tamazia`.

**Scroll behaviour:** past hero, top strip fades (-32px), bottom strip shrinks to 56px with `backdrop-filter: blur(12px) saturate(150%)` and ivory 88% opacity.

**Scroll-spy:** 3×3px gold dot appears to left of active nav item, 300ms transitions.

**Progress bar:** 1px gold hairline below bottom strip, width animates 0%→100% on page scroll.

**Mobile (<768px):** logo left, hamburger right (three 2px gold hairlines 20px wide). Opens full-bleed obsidian drawer from right. Inter 18px caps 0.1em pearl nav items, 32px vertical gap. CTA at bottom of drawer.

**Accessibility:** Skip link at very top `<a href="#main" class="skip-link">Skip to main content</a>` visible on focus.

---

### SECTION 02 · HERO

**Copy verbatim:**
> Led by a founder with an LLM in International Business Law, King's College London. Regulatory analysts, AI search engineers, and legal content strategists working to a standard regulated enterprises cannot source elsewhere.
>
> **Outrank competitors. Master regulators. One agency.**
>
> Your SEO agency doesn't have a lawyer. Ours is run by one.
>
> Every campaign executed through us passes through 200+ laws before anything goes live: GDPR, FCA, SRA, MHRA, ASA, HIPAA, EU AI Act, and international advertising law.
>
> Ranking is only valuable if it is legal.
>
> Trusted by Kamat Hotels (NSE) · CG Oncology (NYSE: CGON) · Meraas (Dubai Holding) and regulated enterprises across London, Dubai, New York and four continents.
>
> CTA: Request your compliance and SEO audit

**Brainstorm (18 ideas):**
1. Full-bleed obsidian hero 100vh with 3D centrepiece right.
2. Split composition 60/40 copy-left / 3D-object-right.
3. Kinetic H1 three-line stagger on load (Playfair 400→700 variable weight).
4. Pre-headline as Inter italic 15px editorial kicker above H1.
5. Pull quote "Ranking is only valuable if it is legal." in Playfair 28px gold with corner brackets.
6. Trusted-by strip as scrolling gold-hairline marquee.
7. Scroll cue bottom: gold hairline pulse with CONTINUE caps.
8. Monogram watermark 3% opacity across background.
9. Single-object 3D centrepiece (The Scales of Law and Search) rotating slowly.
10. No image, just typography - pure editorial hero.
11. Oxblood-to-obsidian vertical gradient mesh at 3% motion.
12. Full-bleed Kamat/Meraas/CGON logo watermark at 8% behind copy.
13. Cinematic abstract video loop (10% opacity) behind copy.
14. Founder credential micro-badge "LLM King's College London" in top-left.
15. Secondary CTA "View case studies" below primary.
16. Regulatory framework constellation in background (SRA, FCA, MHRA glyphs floating faintly).
17. Dual-hero: first frame A (copy + object), scroll reveals frame B (zoomed detail of object).
18. Single gold hairline diagonal element uniting hero-to-next-section.

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 8, 9.

**Final direction:**

Full-bleed obsidian hero, 100vh desktop (720px minimum tablet, 90vh mobile). Monogram watermark 3%. Noise grain 1.5%. 12-column grid with 80px gutters.

**Left column (cols 1-7):**
- Pre-headline kicker: Inter 15px italic pearl 85% opacity 0.02em tracking, max-width 560px: verbatim founder copy.
- 32px gap.
- H1: Playfair `clamp(48px, 5vw + 1rem, 96px)` ivory, variable weight 400→700 on load, line-height 1.05, letter-spacing -0.02em. Three lines: `Outrank competitors.` / `Master regulators.` / `One agency.` Each line fades + translates up 20px with 180ms stagger using `cubic-bezier(0.2, 0.8, 0.2, 1)`. Total: 700ms.
- 40px gap.
- Sub-headline: Playfair italic 24px gold. Content verbatim.
- 24px gap.
- Paragraph: Inter 16px pearl 85%, max-width 580px. Content verbatim.
- 16px gap.
- Pull quote: Playfair 28px gold "Ranking is only valuable if it is legal." with 2px gold hairline corner brackets (32px legs, top-left + bottom-right only).
- 48px gap.
- Primary CTA: oxblood filled button, 1px gold hairline border, 64px tall 320px wide. Content "Request your compliance and SEO audit" in Playfair 16px ivory 0.05em tracking. Magnetic cursor pull (40px radius, 200ms). → `#quick-audit` anchor.

**Right column (cols 8-12):**
3D centrepiece object (The Scales of Law and Search — §05). Centred vertically. 60% column height. Soft gold radial glow at 8% opacity. Slow 360° rotation over 60s.

**Bottom band (56px, obsidian darker tint, 1px gold top):**
Trusted-by marquee scrolling left 20px/sec. Content: `KAMAT HOTELS (NSE) · CG ONCOLOGY (NYSE: CGON) · MERAAS (DUBAI HOLDING) · LONDON · DUBAI · NEW YORK · PARIS · FOUR CONTINENTS`. Inter 13px caps 0.15em tracking gold. Paused on hover.

**Scroll cue (40px above bottom):**
2px gold hairline 40px tall pulsing 40→100→40% over 3s. Below: Inter 11px caps 0.2em tracking gold "CONTINUE."

**Accessibility:** H1 is the page's single h1. 3D object: `<figure><img alt="Gilded brass apothecary scale balancing a miniature Lex monogram against a polished crystal search cursor" /><figcaption class="sr-only">Symbol of Tamazia's unified legal and search practice.</figcaption></figure>`. Marquee: `aria-label="Trusted client names"`.

---

### SECTION 03 · QUICK AUDIT ENGINE (NEW)

**Placement:** Immediately below hero, above Why Us. Full technical detail in `TAMAZIA-05-AUDIT-ENGINE.md`. Design direction here only.

**Copy verbatim (UI):**
- Eyebrow: LIVE INSTRUMENT
- Headline: "Benchmark your current presence in 2 seconds."
- Subline: "Enter your domain or a primary commercial keyword. Compliance, Core Web Vitals, and AI-search visibility checked in real time."
- Input placeholder: "yourdomain.com  ·  or  ·  primary keyword"
- Button: RUN AUDIT
- Link below: "View a sample audit →"
- Result CTA: REQUEST YOUR FULL COMPLIANCE AND SEO AUDIT
- Confidentiality: "Findings belong to you whether you proceed or not."
- PDF opt-in: "Email me the findings as a PDF."

**Brainstorm (17 ideas):**
1. URL-only input (simpler).
2. URL OR keyword input (dual lead pathway).
3. URL + sector dropdown (rejected, friction).
4. Pre-filled example "try: cliffordchance.com" on focus.
5. Multiple metric tabs (rejected).
6. Freight Big Pro numerals for metric values.
7. Fabergé-line gold hairline loading progress filling L→R.
8. Result card with gold corner brackets around observation.
9. "View a sample audit" link for visitors not ready to input.
10. Deep-linked CTA that pre-fills contact form with domain.
11. Email PDF opt-in checkbox.
12. Compare-with-competitor tab (Phase 2).
13. Three-metric discipline (not four or five).
14. Editorial Playfair italic observation, not AI-generated open text.
15. Sample audit link opens a branded PDF viewer overlay.
16. Sector-specific compliance snippet (1-2 lines tailored to auto-inferred sector).
17. Founder alert triggers when a high-value domain (from top-100 list) runs an audit.

**Curated picks:** 2, 4, 6, 7, 8, 9, 10, 11, 13, 14, 16, 17.

**Final direction:**

Full-width ivory with monogram watermark 3%, 96px vertical padding, 1px oxblood hairline top + bottom.

**Empty state (720px max centred content):**
- Eyebrow: Inter 11px caps 0.2em oxblood "LIVE INSTRUMENT."
- 16px gap.
- Headline: Playfair italic 28px oxblood "Benchmark your current presence in 2 seconds."
- 12px gap.
- Subline: Inter 15px ink-muted max-width 560px centred (verbatim).
- 48px gap.
- Input: gold-hairline underline (transparent bg, 2px gold bottom only), 56px tall 480px wide, Inter 15px italic ink placeholder. Pre-fills "try: cliffordchance.com" faded on focus.
- 24px gap right (or below on mobile): oxblood filled button 56px × 140px, Inter 13px caps 0.1em ivory "RUN AUDIT."
- 24px gap below input row.
- Text link: Inter 14px italic ink-muted, gold hairline underline: "View a sample audit →"

**Loading state:**
Input + button lock (opacity 60%). Gold hairline 1px × 480px centred beneath input. 2px gold hairline progresses L→R over 2.5s filling the line. Beside: Inter 12px caps 0.2em gold "ANALYSING" with 4-dot sequence cycling every 300ms. `aria-live="polite"` announces state changes.

**Result state (expands to ~960px):**
Input row remains. Small "RE-RUN" gold text link beside input. 48px gap. Result card: ivory, 1px gold hairline, 24px border-radius, 32px padding, 960px max centred.

Card content order:
1. Top row: Playfair 22px ink `Preliminary finding for [user domain]`. Right-aligned pill "ANALYSIS COMPLETE" Inter 11px caps 0.15em ivory on oxblood 1px gold, 8px padding.
2. 32px gap.
3. Three-column metric grid (collapses to stacked on mobile):
   - Col 1: Freight Big Pro 64px gold numeral (e.g. `2.4s`). Inter 11px caps 0.15em ink `CORE WEB VITALS · LCP`. Gold status dot (green/amber/red).
   - Col 2: Freight Big Pro 64px gold numeral (e.g. `8/12`). Inter 11px caps ink `META & SCHEMA READINESS`.
   - Col 3: Freight Big Pro 64px gold numeral (e.g. `62`). Inter 11px caps ink `REGULATORY READINESS / 100`.
4. 40px gap.
5. Editorial observation: Playfair italic 18px ink, max-width 720px centred, with 2px gold hairline corner brackets (top-left + bottom-right).
6. 32px gap.
7. Sector compliance snippet card: small pill "DETECTED SECTOR: [HEALTHCARE]" + one line of sector-specific compliance insight (e.g. `E-E-A-T signals present. HIPAA-safe contact form not detected. MHRA health claim wording review recommended.`).
8. 40px gap.
9. 1px gold hairline full-width.
10. 32px gap.
11. Primary CTA: oxblood filled, 1px gold border, Inter 13px caps 0.1em ivory `REQUEST YOUR FULL COMPLIANCE AND SEO AUDIT`, 56px tall, full-card width. Click scrolls to contact form with domain pre-filled.
12. 16px gap.
13. Opt-in: Inter 13px italic ink-muted with gold hairline checkbox: `☐ Email me the findings as a PDF.`
14. 16px gap.
15. Italic 13px ink-muted centred: `Findings belong to you whether you proceed or not.`

**Accessibility:** `aria-live="polite"` region announces "Analysing" and "Analysis complete for [domain]." Input has associated `<label>`. Metrics marked as a semantic list. Observation in a `<blockquote>`.

---

### SECTION 04 · WHY US / PROOF

**Copy verbatim:** (from live site)
> **Any agency can rank you. Not every agency has read your sector's laws.**
> Compliance is the foundation. We know the rules your content has to play by, and we rank you within them. Not a footnote we add at the end.
> International business law expertise at the core. Traditional SEO, AI search, and Generative Engine Optimisation for law firms, healthcare, hotels, financial services, real estate, and every regulated sector.
> · Record client revenue growth over 4 years
> · Laws reviewed per campaign
> · Revenue across four continents
> Technology Partnership: Google Partner · Marketing Partner · Meta Business Partner

**Brainstorm (16 ideas):**
1. Centred H2 with drawing gold hairline underline on scroll-into-view.
2. Three-column stat grid with Freight Big Pro numerals.
3. Counter animation on scroll (rolls 0 to value over 1400ms).
4. Sparkline beside "Record client revenue growth" stat.
5. Gold scale-of-justice icon beside "Laws reviewed" stat.
6. Gold compass icon beside "Four continents" stat.
7. Partner badges as credential strip (greyscale to colour on hover).
8. Add ABA + Chartered Institute of Arbitrators memberships.
9. Editorial italic "Continue to sectors →" scroll prompt instead of button.
10. Background pearl colour with monogram watermark.
11. Inline source citation beneath each stat (e.g. "Verified April 2026.")
12. Two-column layout: copy left, stats right (rejected - less impactful).
13. Animated globe with 4 continent highlights.
14. Remove this section and merge into Hero (rejected - section earns its place).
15. Five stats instead of three (rejected - dilutes).
16. Pull quote between copy block and stats: "International business law expertise at the core." in Playfair italic with gold corner brackets.

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16.

**Final direction:**

Full-width pearl background, 160px vertical padding. Monogram watermark 3%.

**Header block (centred, max-width 720px):**
- Eyebrow: Inter 11px caps 0.2em oxblood "I. WHY US."
- 16px gap.
- H2: Playfair 48px oxblood line-height 1.1 verbatim copy.
- Below: 2px gold hairline 80px wide drawing in from centre over 800ms on scroll-into-view.
- 32px gap.
- Paragraph 1 Inter 17px ink max-width 640px (verbatim).
- 16px gap.
- Paragraph 2 Inter 17px ink (verbatim).
- 32px gap.
- Pull quote: Playfair italic 22px gold centred "International business law expertise at the core." with 2px gold hairline corner brackets.

**96px gap. Three-column stat grid (max-width 1100px centred, 40px gap):**

| Col | Freight Big Pro | Caption | Accent |
|-----|-----------------|---------|--------|
| 1 | `4×` gold 128px | "RECORD CLIENT REVENUE GROWTH OVER 4 YEARS." | Gold hairline sparkline 100×30px drawing once on scroll |
| 2 | `200+` gold 128px | "LAWS REVIEWED PER CAMPAIGN." | Gold 40px scale-of-justice icon |
| 3 | `4` gold 128px | "REVENUE ACROSS FOUR CONTINENTS." | Gold 40px compass icon |

Numerals roll from 0 over 1400ms on scroll-into-view. Small "VERIFIED" gold seal micro-badge beside each. 120px gap below.

**Horizontal gold hairline 40% width centred. 48px gap. Credential strip:**
- Inter 11px caps 0.2em gold centred: "CERTIFIED PARTNERSHIPS AND MEMBERSHIPS."
- 24px gap.
- Row of 5 badges, 80px tall, equal spacing: Google Partner · Meta Business Partner · Marketing Partner · Chartered Institute of Arbitrators · American Bar Association. Greyscale 75% opacity. 120ms colour fade-in on hover.

**80px gap. Scroll prompt centred:** Inter 14px italic ink-muted gold hairline underline "Continue to sectors →"

---

### SECTION 05 · SECTORS (6 cards)

**Copy verbatim:** Full per-sector copy in live site extract. Summarised:

| Sector | Regulatory shorthand | Key pitch |
|--------|---------------------|-----------|
| Law Firms | SRA. Bar. DIFC. GDPR. | Every rule, every jurisdiction. |
| Healthcare | E-E-A-T. HIPAA. MHRA. ADA. | Medical content under the hardest scrutiny. |
| Hotels | OTA commission eliminated. | Direct bookings built. Revenue followed. |
| Real Estate / IPO | NYSE IPO. SEC disclosure on every word. | Shares nearly doubled. |
| F&B | 30,000 to 40,000 map citations. | Google Maps dominance. Deliveroo cut. |
| Every Sector | If it needs to rank, we build it. | Schools. E-commerce. Automotive. Executives. |

**Brainstorm (16 ideas):**
1. Asymmetric bento grid (Legal 2×2, others 1×1).
2. All obsidian cards with gold hairline borders.
3. 3D sculptural object per card (§05 briefs).
4. Roman numeral top-left card label.
5. Regulatory shorthand strip in gold monospace-caps.
6. Playfair sector headline + Inter body.
7. Per-card CTA as gold-underline text link.
8. Hover: card lifts 8px, gold border intensifies, 3D rotates 5°, regulation tooltip spawns.
9. 3-line body clamp on standard cards.
10. Sequential card reveal on scroll 120ms stagger.
11. Gold hairline diagonal under grid.
12. H2 left-aligned with blank right column.
13. Closing italic line below grid.
14. Click-to-expand: card opens slide-over with deeper sector content.
15. Background obsidian full-bleed.
16. Link each card to a future `/sectors/[slug]` page.

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16.

**Final direction:**

Full-bleed obsidian, 160px vertical padding, monogram watermark 3%.

**Section header (left-aligned, max-width 480px):**
- Eyebrow: Inter 11px caps 0.2em gold "II. SECTORS."
- 16px gap.
- H2: Playfair 48px ivory "Every sector. One standard."
- 32px gap.
- Subline: Inter 16px italic pearl 70% "Six sectors. One regulatory standard. Verified compliance engineering."
- 96px gap.

**Bento grid (12-column, 24px gap):**

| Card | Grid | Size |
|------|------|------|
| Legal | cols 1–6, rows 1–2 | 2×2 large |
| Healthcare | cols 7–12, row 1 | 1×1 |
| Hotels | cols 7–12, row 2 | 1×1 |
| Real Estate & IPOs | cols 1–4, row 3 | 1×1 |
| F&B | cols 5–8, row 3 | 1×1 |
| Every Sector | cols 9–12, row 3 | 1×1 |

**Card template:**
- Obsidian bg, 1px gold hairline 40% opacity, 24px border-radius, 24px padding.
- Top-left: Roman numeral (I.–VI.) Playfair italic 14px gold.
- Top-right: 3D object 40% of card height.
- Middle-left: Inter 11px caps 0.15em gold `SECTOR 0X / VI`.
- 16px gap.
- Playfair 28px ivory sector headline.
- 12px gap.
- Gold monospace-caps 13px regulatory shorthand strip.
- 16px gap.
- Inter 14px pearl 85% body copy. 3-line clamp on standard cards. Full on 2×2 Legal card.
- 24px gap.
- CTA: Inter 13px pearl gold underline text link "Request [sector] compliance audit →"

**Hover states:** card lifts 8px with 300ms cubic-bezier. Gold border 40%→100%. 3D rotates 5° clockwise. Regulation tooltip panel spawns right (or left near edge), 320px wide gold hairline card listing full specific regulations for that sector.

Cards reveal sequentially on scroll-into-view with 120ms stagger.

**Below grid:** 96px gap, full-width gold hairline, 48px gap, centred italic line Inter 16px pearl 70% "If your sector is not listed, it is served. Scope confirmed after the SEO and compliance audit."

---

### SECTION 06 · ROMAN NUMERAL INTERSTITIAL

**Copy verbatim:** `III.` + `QUESTIONS AND FINDINGS`.

**Brainstorm (15 ideas):**
1. Remove section entirely (rejected, pacing).
2. Roman numeral centred section break.
3. Gold hairline horizontal + caps text below.
4. Full-bleed ivory strip 96px tall.
5. Quotation pull above the hairline.
6. Scroll-triggered hairline drawing animation.
7. Obsidian strip with gold accent.
8. Founder signature as separator.
9. Gold diamond glyph ornament.
10. Nothing but 1px gold hairline.
11. Full-width blank section with no content.
12. Rotating 3D gold ornament small centred.
13. Parallax hairline drawing as user scrolls.
14. Text fade-in on scroll.
15. Animated horse-mark at 10% opacity drifts across.

**Curated picks:** 2, 3, 4, 6, 13.

**Final direction:**

Full-width ivory strip, 96px tall. Monogram watermark 2%. Centred 2px gold hairline 80px wide drawing in from centre on scroll-into-view over 800ms. Above (16px gap): Playfair italic 18px ink `III.` Below (16px gap): Inter 11px caps 0.2em tracking ink `CASE STUDIES`. No interactivity.

Reused as section break pattern between any two sections. Instance for FAQ uses `IV. QUESTIONS AND FINDINGS`, instance before Contact uses `VII. CONTACT`, etc.

---

### SECTION 07 · CASE STUDIES

**Copy verbatim:**
> **Case Studies**
> Three clients. Three regulators. Every number below is verified.
>
> **HOSPITALITY | HOTEL GROUP | ASIA PACIFIC**
> If you are paying OTA commission, you are funding your competitor's marketing.
>
> **REAL ESTATE AND LIFESTYLE | DUBAI HOLDING SUBSIDIARY | UAE**
> If this standard was adequate here, it is adequate for your brand.
>
> **HEALTHCARE | NYSE IPO | USA**
> CG Oncology listed on the NYSE as CGON. Shares nearly doubled, a 96% increase at IPO. Every piece of content Tamazia produced was published without a single compliance incident.
>
> Your digital agency is either a compliance asset or a compliance risk. There is no middle position.

**Brainstorm (16 ideas):**
1. Three stacked full-width panels alternating ivory/obsidian.
2. Each panel 96vh full-bleed.
3. Eyebrow sector | client | region in gold caps.
4. Oversized stat in Freight Big Pro 220px.
5. VERIFIED gold seal micro-badge beside stat.
6. Closing pull quote Playfair oxblood with gold corner brackets.
7. Roman numeral case sequencing (I., II., III.).
8. Background client logo at 10% opacity.
9. Cinematic fade-from-black entry on first panel.
10. Alternating left-right composition across panels.
11. Click to open slide-over with full case detail (Phase 2).
12. Before/after slider for hotel metrics.
13. Gold hairline growth curve drawing on scroll.
14. Inline citation (SEC filings for CGON, internal data for Kamat).
15. Parallax: background image 0.6× scroll speed.
16. Per-case CTA buried as quiet text link "Request private briefing for this sector."

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 9, 13, 14.

**Final direction:**

**Section header (centred, max-width 640px, 96px vertical padding):**
- Eyebrow Inter 11px caps 0.2em gold "III. CASE STUDIES."
- 16px gap.
- H2 Playfair 48px oxblood "Case Studies."
- 16px gap.
- Subline Inter italic 15px ink-muted max-width 560px "Case I. II. III. — Three clients. Three regulators. Every number below is verified."
- 96px gap.

**Three stacked panels, 96vh each, alternating ivory/obsidian:**

**Case I · HOSPITALITY (obsidian):** Left half (50%, 80px padding): eyebrow Inter 11px caps 0.15em gold `CASE I · HOSPITALITY · HOTEL GROUP · ASIA PACIFIC`. 24px gap. Playfair 56px ivory pull quote (verbatim). 32px gap. Paragraph Inter 16px pearl 85% describing OTA shift engagement. 40px gap. VERIFIED gold seal + Inter 11px caps gold `DATA VERIFIED AGAINST HOTEL GROUP INTERNAL BOOKING SYSTEM, 2024.` Right half: Freight Big Pro 220px gold `£1.2M` centred. 16px gap. Inter 13px caps 0.15em pearl 80% `ANNUAL OTA COMMISSION SAVED · 100-ROOM PROPERTY · POST-ENGAGEMENT.`

**Case II · REAL ESTATE (ivory, inverted palette):** Same structure. Oxblood 56px headline. Meraas faint logo watermark 10% opacity background.

**Case III · HEALTHCARE (obsidian):** Same structure. Freight Big Pro `+96%`. Caption: `NYSE IPO SHARE PRICE MOVEMENT · CG ONCOLOGY (CGON) · 2024. VERIFIED PER SEC FILINGS.` Superscript link to SEC filing EDGAR URL.

**Below panels:** 160px gap. Full-width ivory section. Centred pull quote Playfair 40px oxblood max-width 720px `Your digital agency is either a compliance asset or a compliance risk. There is no middle position.` 2px gold hairline beneath 120px wide drawing in on scroll.

---

### SECTION 08 · HOW TAMAZIA WORKS

**Copy verbatim:**
> **How Tamazia works**
> SRA advertising rules. FCA financial promotion codes. MHRA health claim standards. GDPR. ASA. These govern every word your brand publishes. Most SEO agencies have never read them. Every unreviewed piece of content is exposure. It compounds. When a regulator notices, your agency does not share the liability. You do.
>
> · Regulatory Analysts tracking law changes across every jurisdiction you operate in.
> · AI Search Engineers placing your brand inside ChatGPT, Perplexity and Google AI Overviews.
> · Legal Content Strategists writing to compliance from sentence one.
> · Technical SEO Architects.
> · Revenue Attribution Analysts.
>
> Led by the founder, LLM in International Business Law, King's College London.

**Brainstorm (17 ideas):**
1. Editorial two-column (H2 + paragraph left, 5 role cards right).
2. Each role card with a gold hairline icon (book, signal, pen, wrench, chart).
3. Sequential reveal on scroll 180ms stagger.
4. Pull quote between paragraph and role cards.
5. Founder signature block with portrait + credentials.
6. Animated regulatory-checklist ticking (5 laws visible at a time).
7. Interactive framework explorer (hover regulation, see summary).
8. Three-column: What we review · Who reviews · How reported.
9. Vertical timeline 6 nodes.
10. Pull-out inline citations (SRA Code 8.7, FCA COBS 4).
11. Sparkline of regulator exposure curve (if no action, exposure grows over time).
12. Mini infographic of the 5-stage workflow.
13. Founder photograph with signature below.
14. Background ivory with monogram watermark.
15. Subtle gold hairline surround each role card.
16. Roles stacked as horizontal flip-cards (rejected - too gimmicky).
17. Testimonial quote from a past client (anonymised) as section closer.

**Curated picks:** 1, 2, 3, 4, 5, 10, 13, 14, 15.

**Final direction:**

Full-width ivory, 160px vertical padding. Monogram watermark 3%.

**Section header (left-aligned, max-width 480px):**
- Eyebrow Inter 11px caps 0.2em gold "IV. HOW TAMAZIA WORKS."
- 16px gap.
- H2 Playfair 56px oxblood `How Tamazia works.`
- 48px gap.
- Paragraph Inter 17px ink max-width 440px (verbatim).
- 32px gap.
- Pull quote Playfair italic 32px oxblood max-width 440px with gold corner brackets: `Every unreviewed piece of content is exposure. It compounds. When a regulator notices, your agency does not share the liability. You do.`

**Right column (50% width, 10% gutter):** Five role cards stacked, 24px gap. Each card: ivory 1px gold hairline 88px tall 24px padding.

| Role | Icon (gold hairline 48px) | One-line |
|------|---------------------------|----------|
| Regulatory Analysts | Book spine | Tracking law changes across every jurisdiction you operate in. |
| AI Search Engineers | Signal/waveform | Placing your brand inside ChatGPT, Perplexity, and Google AI Overviews. |
| Legal Content Strategists | Quill pen | Writing to compliance from sentence one. |
| Technical SEO Architects | Wrench | Engineering site infrastructure against Core Web Vitals and compliance standards. |
| Revenue Attribution Analysts | Line chart | Attributing organic search revenue back to engagement. |

Sequential reveal 180ms stagger. 80px gap below.

**Founder sign-off block (left-aligned below both columns):**
- Horizontal gold hairline 40% width.
- 40px gap.
- Founder portrait 96×96px 4px gold border (optional if image available).
- Playfair italic 20px `Led by the founder, LLM in International Business Law.`
- Inter 13px caps 0.1em `KING'S COLLEGE LONDON · MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION.`
- Gold cursive signature `A. Igga.`
- CTA text link Inter 14px ink gold hairline underline `Request your compliance and SEO audit →`

**Inline citation chips** throughout paragraph: Hover `SRA RULES` and see the exact rule in floating tooltip.

---

### SECTION 09 · PRICING

**Copy verbatim:**
> **Pricing**
> Every engagement begins with an SEO and compliance audit. Regulatory compliance review is standard across all tiers.
>
> **Foundation** — From £2,500
> Best for single-location businesses building local search authority.
> Single-location hotels, clinics, restaurants, estate agents. Sole solicitors and practitioners. Financial advisers establishing local authority. Executives building professional visibility.
>
> **Authority** — From £4,500
> Best for multi-location brands scaling organic growth across regions.
> Multi-location hotel groups. Law firms across practice areas and offices. Healthcare groups. Financial services firms competing nationally. Real estate developers with international buyers. F&B brands expanding beyond a single location.
> The team that works on your account does not rotate. The founder reviews every deliverable before it leaves.
>
> **Enterprise** — From £9,500
> Best for enterprise or regulated brands requiring full-stack SEO dominance.
> International hotel groups. Multi-jurisdiction law firms. Listed companies and pre-IPO businesses. Healthcare groups with cross-border operations. Real estate developers targeting international buyers. Financial services enterprises regulated under FCA, DFSA, and SEC simultaneously.
>
> FOR PRE-IPO PREPARATION, LISTED COMPANIES, AND INTERNATIONAL ENTERPRISE GROUPS, ENGAGEMENT IS STRUCTURED TO MANDATE. SPEAK WITH THE FOUNDER BEFORE ANY SCOPE IS AGREED.

**Brainstorm (16 ideas):**
1. Three cards side-by-side uniform height (via container queries, no content overflow ever).
2. Enterprise visually distinguished: obsidian background, ivory text, double gold hairline.
3. Roman numeral card labels (I. II. III.).
4. Tier name Playfair 32px.
5. Price Freight Big Pro 80px gold.
6. Inter italic 14px subline.
7. Four-icon row for what's included (audit · team · deliverables · review).
8. Hover: card lifts, gold border intensifies.
9. Gold-hairline-framed callout on obsidian below cards (Enterprise mandate).
10. Founder signature beside Speak with the founder CTA.
11. Currency toggle (£ / $ / AED) Phase 2.
12. "Best for" highlighted with a small gold hairline pill tag.
13. Feature matrix (rejected - too SaaS-grade).
14. Testimonial beneath each tier (rejected - clutters).
15. Scale-proof pricing: numbers roll on scroll-into-view.
16. Below Enterprise: `Pricing is indicative. All engagements are bespoke.`

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16.

**Final direction:**

Ivory background, 160px vertical padding.

**Header (centred, max-width 640px):**
- Eyebrow Inter 11px caps 0.2em gold "V. ENGAGEMENT TIERS."
- 16px gap.
- H2 Playfair 48px oxblood "Pricing."
- 16px gap.
- Intro Inter italic 16px ink-muted "Every engagement begins with an SEO and compliance audit. Regulatory compliance review is standard across all tiers."
- 80px gap.

**Three-card grid, 32px gap:**

**Card I · Foundation (pearl bg, 1px gold hairline):**
- Roman "I." Playfair italic 14px gold top-left.
- Playfair 32px ink "Foundation."
- Freight Big Pro 80px oxblood "From £2,500."
- Inter italic 14px ink-muted best-for.
- 32px gap.
- Four-icon row (40px gold hairline): Audit · Team · Deliverables · Review.
- 24px gap.
- Inter 13px ink body (verbatim best-for paragraph).
- 40px gap.
- Oxblood ghost button 48px "Request your compliance and SEO audit" with 1px gold border.

**Card II · Authority (pearl, elevated 8px shadow gold 10%):** Same structure. `II.`, `From £4,500`. Add line: `The team that works on your account does not rotate. The founder reviews every deliverable before it leaves.`

**Card III · Enterprise (obsidian, ivory text, double gold border 2px inner + 1px outer with 4px gap, 1.05× scale):** `III.`, `From £9,500`. Oxblood filled (not ghost) CTA.

**Below cards, 96px gap. Gold-hairline-framed callout on obsidian (1px gold top/bottom, 24px vertical padding):**
- Inter 14px caps 0.1em gold centred: `FOR PRE-IPO PREPARATION, LISTED COMPANIES, AND INTERNATIONAL ENTERPRISE GROUPS, ENGAGEMENT IS STRUCTURED TO MANDATE. SPEAK WITH THE FOUNDER BEFORE ANY SCOPE IS AGREED.`
- 24px gap.
- Oxblood button "SPEAK WITH THE FOUNDER" with gold border.
- Beside button: gold cursive signature `A. Igga.`

**Micro-note below:** Inter italic 12px ink-muted centred `Pricing is indicative. All engagements are bespoke.`

---

### SECTION 10 · FAQ

**Copy verbatim:** Full long-form FAQ content captured in the extract. Categories:
- 01 Audit Process (4-week breakdown)
- 02 Sectors (sector-specific FAQ)
- 03 Individual Clients (execs, founders, lawyers, doctors)
- 04 What the Audit Includes (Technical · Compliance · Competitive · AI search)
- 05 Fees and Engagement

**Brainstorm (16 ideas):**
1. Two-column: left sticky nav categories, right expandable cards.
2. Accordion pattern with gold hairline reveal.
3. FAQ-gold-box styling (previously approved): oxblood+gold boxes for each card.
4. 4-week audit process as horizontal timeline at top of "01."
5. Roman numeral node circles along timeline.
6. Inline regulatory citation chips (SRA CODE 8.7, FCA COBS 4).
7. Hover tooltip revealing full rule text from citations.
8. Editorial pull quote between categories.
9. Search bar filter (Phase 2).
10. Print-friendly PDF download (Phase 2).
11. CTA after every 3 questions (rejected - too aggressive).
12. Scrollspy active category highlighting.
13. Founder voice tone on answers ("Most agencies do not read your rulebook. We do.").
14. Each category has a small gold count badge (e.g. `4 QUESTIONS`).
15. Category dividers: Roman numeral Playfair italic + Inter caps label.
16. Below full FAQ: catch-all line "Still have a question? The audit is where every conversation starts."

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 8, 12, 14, 15, 16.

**Final direction:**

Ivory background, 160px vertical padding.

**Header (left-aligned, max-width 320px):**
- Eyebrow Inter 11px caps 0.2em gold "VI. FAQ."
- 16px gap.
- H2 Playfair 48px oxblood "FAQ."
- 16px gap.
- Intro Inter italic 16px ink-muted "Questions we hear from managing partners, hotel group CMOs, and general counsel before every engagement."
- 80px gap.

**Two-column layout:**

**Left column (40%, sticky):** FAQ category nav in Inter 14px caps 0.1em ink-muted, 32px vertical gap. Active category gold with 3px gold dot left. Categories:
- `01 AUDIT PROCESS  (5)`
- `02 SECTORS  (7)`
- `03 INDIVIDUAL CLIENTS  (4)`
- `04 WHAT THE AUDIT INCLUDES  (4)`
- `05 FEES AND ENGAGEMENT  (3)`

**Right column (60%):** FAQ entries as expandable cards with FAQ-gold-box styling. Each card: oxblood fill with gold (#EAB308 at 60% opacity) accents, Playfair 22px question, Inter 15px answer, 16px border-radius, 24px padding, 24px gap between cards. Chevron gold hairline rotates 180° on expand. `aria-expanded` and `aria-controls` implemented.

**Featured at top of "01 AUDIT PROCESS":**

Horizontal 4-node timeline, 80px tall. Each node: 48px circle with 1px gold hairline, Playfair Roman numeral inside. Below: Inter 11px caps gold `WEEK 01 · TECHNICAL` / `WEEK 02 · ON-PAGE & COMPLIANCE` / `WEEK 03 · OFF-PAGE` / `WEEK 04 · GBP & CONTENT`. Gold hairline connecting nodes. Active node highlighted on scroll.

**Inline regulatory citation chips** throughout answers: gold hairline pills in Inter 11px caps 0.1em. Hover spawns tooltip with full rule text.

**Editorial break between "03" and "04":**
Full-width Playfair 32px oxblood centred pull quote with gold corner brackets: `These sectors share one characteristic: in all of them, an SEO mistake costs the client more than the agency ever charged.`

**Below FAQ (full-width centred):**
Inter italic 15px ink-muted max-width 560px `Still have a question not answered here? The SEO and compliance audit is where every conversation starts. Reach out and we will answer anything specific to your sector and scale before any commercial discussion begins.` 24px gap. Text link gold hairline underline "Reach out →" → `#contact`.

---

### SECTION 11 · CONTACT

**Copy verbatim:**
> Every engagement begins with a conversation. Start yours below.
> [form fields: Full name · Company or Organisation · Your role or title · Regulated sector · What is the primary outcome you want to achieve?]
> CTA: Request SEO & Compliance Audit
> Or schedule directly using the calendar below.

**Brainstorm (16 ideas):**
1. Two-column split: form left, Calendly right.
2. Gold-hairline underline inputs (no boxes).
3. Inter 11px caps field labels.
4. Oxblood filled submit button with gold border.
5. Success state: form replaced by Playfair message.
6. Confidentiality line below form.
7. Response time promise.
8. Calendly brand-themed (oxblood/gold).
9. Monogram watermark 3% background.
10. Single-column centred form (rejected - too narrow).
11. Multi-step form (rejected - friction).
12. Floating "Speak with the founder" pill lower-right after scroll.
13. Autofill sector dropdown from detected sector if user came from audit engine.
14. Inline validation with gold hairline for valid, oxblood for error.
15. Sector-specific subtle copy variant (detected sector hint above form).
16. Full-bleed cinematic background (rejected - distraction).

**Curated picks:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15.

**Final direction:**

Full-width obsidian, 160px vertical padding. Monogram watermark 3%.

**Header (centred, max-width 720px):**
- Eyebrow Inter 11px caps 0.2em gold "VII. CONTACT."
- 16px gap.
- H2 Playfair 48px ivory `Every engagement begins with a conversation.`
- 16px gap.
- Subline Inter italic 15px pearl 80% `Start yours below. Under NDA on request. Average response under 12 hours.`
- 96px gap.

**Two-column split (50/50 with 48px gap, max-width 1200px):**

**Left column · Custom form:** Each field has label Inter 11px caps 0.15em gold above. Input: transparent background, 1px gold hairline bottom only, Inter 16px ivory typing, 48px tall. 24px gap between fields.
1. Full name
2. Company or Organisation
3. Your role or title
4. Regulated sector (select)
5. What is the primary outcome you want to achieve? (textarea 4 rows)

Pre-filled values when user arrives via audit engine:
- Sector pre-selected (detected).
- Primary outcome pre-filled with audit summary (`"[domain]: regulatory readiness 62/100, Core Web Vitals LCP 3.2s, book priority audit."`) — user can edit.

Inline validation: valid = thin gold hairline, error = thin oxblood hairline + error text in Inter 12px oxblood.

48px gap after last field.

**Submit button:** oxblood filled, 1px gold border, Inter 13px caps 0.1em ivory `REQUEST YOUR SEO & COMPLIANCE AUDIT`. 64px tall, full column width. Magnetic cursor pull.

**Right column · Calendly embed:** Label Inter 11px caps 0.15em gold `OR SCHEDULE DIRECTLY.` 16px gap. Calendly iframe, 520px tall, 1px gold hairline, branded with ivory/oxblood/gold.

**Below both columns, 80px gap. Centred 2px gold hairline 160px wide. 24px gap. Inter italic 13px pearl 60%:**
`All briefings are conducted under NDA on request. The founder reviews every enquiry.`

**Success state:** Form replaces with Playfair 28px ivory `Your briefing request has been received.` 16px gap. Inter 15px pearl `The founder will be in touch within 12 hours.` 24px gap. Inter italic 13px pearl 70% `If your enquiry is time-sensitive, book directly using the calendar.` `aria-live="polite"` announces.

---

### SECTION 12 · FOOTER

**Copy verbatim (expanded from current live one-liner):**
- Brand: TAMAZIA wordmark. Tagline: "International SEO for regulated enterprises."
- Location: London · Dubai · New York · Paris.
- Credentials: Member, Chartered Institute of Arbitrators · Member, American Bar Association · Google Partner · Meta Business Partner.
- Navigation: Why Us · Sectors · Case Studies · How We Work · Pricing · FAQ · Contact.
- Newsletter: "Receive a quarterly briefing on regulatory developments affecting your sector. No marketing, no sales. Findings only."
- Legal: Terms · Cookie Policy · Privacy · Modern Slavery Statement.
- Copyright: © Tamazia 2026. All rights reserved.

**Brainstorm (16 ideas):**
1. Three-column footer (brand, navigation, newsletter).
2. Obsidian background with pearl text.
3. Oversized Playfair wordmark TAMAZIA.
4. Full logo lockup (horse + wordmark + ornament) at 128px.
5. Location block Inter caps.
6. Credential badges inline with small greyscale logos.
7. Newsletter signup with gold hairline input.
8. Navigation column.
9. Legal links row at bottom.
10. Copyright centred at bottom.
11. Monogram watermark 5% background.
12. LinkedIn icon gold hairline (single social).
13. Language selector (Phase 2).
14. Back-to-top hairline arrow top-right.
15. Four-column split (rejected - too dense).
16. Contact email + phone as fallback (rejected - Calendly is preferred pathway).

**Curated picks:** 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14.

**Final direction:**

Full-width obsidian footer, 120px top + 40px bottom padding. 2px gold hairline top. Monogram watermark 5%.

**Three columns, 48px gap:**

**Col 1 (40% · brand):**
- Full logo lockup (horse + wordmark + ornament) at 96px tall, centred or left-aligned.
- 24px gap.
- Tagline Playfair italic 18px gold `International SEO for regulated enterprises.`
- 32px gap.
- Location block Inter 13px caps 0.15em pearl `LONDON · DUBAI · NEW YORK · PARIS.`
- 16px gap.
- Credential line Inter 11px caps 0.15em gold `MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION · GOOGLE PARTNER · META BUSINESS PARTNER.`

**Col 2 (30% · navigation):**
- Inter 11px caps 0.2em gold `NAVIGATION.`
- 16px gap.
- Vertical list Inter 14px pearl, 16px gap: Why Us · Sectors · Case Studies · How We Work · Pricing · FAQ · Contact. Gold hairline underline on hover 400ms draw-in.

**Col 3 (30% · regulatory briefings):**
- Inter 11px caps 0.2em gold `REGULATORY BRIEFINGS.`
- 16px gap.
- Inter 14px pearl body: newsletter copy verbatim.
- 24px gap.
- Email input: 1px gold hairline bottom, transparent, 48px tall, Inter 15px italic pearl placeholder `your@domain.com`.
- 16px gap.
- Oxblood button 48px 1px gold border Inter 13px caps `SUBSCRIBE.`

**Below all columns:** 80px gap. Full-width 1px gold hairline. 24px gap.

**Bottom small-print row (flex between):**
- Left: Inter 11px pearl 60% `© Tamazia 2026. All rights reserved.`
- Right: Inter 11px pearl 60% links with gold hairline underline on hover `TERMS · COOKIE POLICY · PRIVACY · MODERN SLAVERY STATEMENT.`

**Fixed bottom-right corner (after hero scroll):**
- Back-to-top button: gold hairline up-arrow 32×32px, fades on scroll to top.

**Single LinkedIn link (top-right of Col 1 area):** 32px gold hairline LinkedIn glyph → Tamazia's LinkedIn profile.

---

## 05 · 3D ILLUSTRATION BRIEFS

All seven objects generated inside Claude Design (zero external cost). Use these prompts verbatim. Batch-generate all seven in one session to lock cohesion.

### Unified specs (apply to all seven)

- Materials: polished gold (brass-warm), matte obsidian, polished marble (cream), pearl/alabaster, clear crystal for data objects only.
- Lighting: single cinematic key light upper-left 45°.
- Camera: 85mm portrait equivalent.
- DOF: shallow f/2.8.
- Backdrop: obsidian with soft radial falloff.
- Composition: centred or rule-of-thirds.
- Deliverable: transparent PNG 1200×1600px minimum, plus a subtle animation spec for implementation.

### Object 01 · HERO CENTREPIECE · "The Scales of Law and Search"

Gold apothecary scale suspended in obsidian space. Left pan carries a miniature "Lex" monogram sculpture in marble. Right pan carries a stylised search cursor in pearl-crystal. Perfectly balanced. Fine gold chain from fulcrum. Slow 360° rotation over 60s. On hover, pans tighten slightly and rebalance.

### Object 02 · LEGAL SECTOR · "The Gilded Gavel on Vellum"

Ceremonial gavel with gold rings and handle cap, walnut wood body, resting diagonally on aged vellum with faint Latin printed text. Beside: miniature stack of three gold + oxblood-leather law book spines. Subtle 5° orbit on hover.

### Object 03 · HEALTHCARE SECTOR · "The Rod of Asclepius as Precision Instrument"

Single Rod of Asclepius as surgical instrument, polished gold with single serpent spiralling. Resting on pearl marble base. Behind: frosted-glass regulatory document faintly visible. Serpent scales glint once every 12s.

### Object 04 · HOTELS SECTOR · "The Concierge Bell"

Polished brass hotel concierge bell, captured at moment of being struck. Striker hovers above. Beneath: gold "Do Not Disturb" plaque. On hover, thin gold hairline sound-wave ring emanates.

### Object 05 · REAL ESTATE / IPO SECTOR · "The Opening Bell"

Miniature NYSE-style opening bell in polished brass, suspended from gold arched mount, engraved "NYSE" on face. Beneath: marble architectural keystone. On hover, gold-dust ring disperses slowly.

### Object 06 · F&B SECTOR · "The Lifted Cloche"

Silver cloche captured mid-lift revealing single golden map pin on pearl plate. Cloche hovers in suspended motion. On hover, cloche rises 8px fully revealing pin.

### Object 07 · EVERY SECTOR CATCH-ALL · "The Compass Rose"

Ornate compass rose engraved in gold rotating on marble plinth. Points labelled faintly with non-listed sectors (Schools · E-commerce · Automotive · Wellness · Tech · Retail). Rotates 360° over 90s. On hover, pointing sector illuminates in gold.

---

## 06 · ACCESSIBILITY STANDARD (WCAG 2.1 AA · BINDING)

For a regulatory firm, accessibility is a legal expectation. WCAG 2.1 Level AA is the minimum. AAA where practical.

### Colour contrast (verified against palette)
- Ink on ivory: 18.8:1 (AAA).
- Ivory on obsidian: 16.3:1 (AAA).
- Pearl 85% on obsidian: 11.8:1 (AAA).
- Gold `#C9A772` on obsidian: 6.5:1 (AAA large, AA normal).
- Gold on ivory: 2.9:1 (fails AA normal). Gold is **never** used for body text on ivory. Permitted only for display text 24px+ and hairlines/ornament.

### Semantic HTML (mandatory)
- `<header role="banner">`, `<nav aria-label="Primary">`, `<main>`, `<section aria-labelledby="...">`, `<footer role="contentinfo">`.
- Strict heading hierarchy: h1 once in hero, h2 per section, h3 within.
- `<ul>`, `<ol>` not div soup.
- Forms: `<form>` with `<label for="">` paired to every `<input>`.

### ARIA
- 3D objects: `aria-hidden="true"` with accompanying sr-only figcaption.
- Quick Audit: `aria-live="polite"` for state announcements.
- Accordions: `aria-expanded` + `aria-controls`.
- Marquee: `aria-label="Trusted client names"`.

### Focus states
- All interactive elements: 2px gold `#C9A772` outline 2px offset on `:focus-visible`.
- Never remove focus without replacement.
- Skip link at top of page.

### Alt text
- Every `<img>` has descriptive alt text (not filename-labelling).
- Decorative images: `alt=""`.
- 3D example: `alt="Gilded brass apothecary scale balancing a miniature Lex monogram in marble against a polished crystal search cursor. Represents Tamazia's unified legal and SEO practice."`

### Motion
- `prefers-reduced-motion: reduce` fully respected.
- Under reduced motion: 3D object static, marquee paused, ScrollTrigger disabled, counters show final values immediately.

### Forms
- Errors via `aria-describedby` + `aria-live="polite"` region.
- Required fields: `aria-required="true"` + visible gold asterisk.
- Success: `aria-live="polite"` announces "Briefing request received."

### Keyboard navigation
- Fully navigable without mouse.
- Mobile drawer traps focus until Escape.
- Magnetic CTA does not interfere with keyboard focus.

### Manual QA (Gate 8)
- VoiceOver on macOS Safari.
- NVDA on Windows Firefox.
- TalkBack on Android Chrome.

---

## 07 · ANTI-PATTERNS (NEVER SHIP)

1. No "diverse team in conference room" stock photography.
2. No emoji, hexagons, neural networks, circuit boards, AI humanoids.
3. No "As seen in" logo strips without verifiable publication links.
4. No chat widgets, popups, pop-ins, interstitials, modals.
5. No "Free audit" or "No credit card required" consumer-grade CTA.
6. No animated loading spinners with clichéd shapes.
7. No dark-mode toggle for vanity.
8. No stock Lottie animations, particle systems, hexagon meshes.
9. No autoplay video.
10. No third-party embed with unstyled defaults.
11. No sans-serif H1 or H2.
12. No buttons wider than 360px.
13. No "Powered by" footer.
14. No Elementor Motion, jQuery, Swiper.
15. No viewport media queries for card-internal styling — container queries only.
16. No Inter bolder than 500 for body.
17. No CTA above H1 in hero.
18. No duplicate CTA copy in same section.
19. No generic agency language ("unlock potential," "skyrocket rankings," "next-level").
20. No discount or time-limited offer.

---

## 08 · HANDOFF PROTOCOL

### Claude Design owns
- Visual design at 1440px canonical width.
- Typography composition within brand system.
- Whitespace and composition.
- 7 × 3D illustration generation (batched session).
- Quick Audit empty/loading/result visual states.
- Output: HTML/CSS/JS per section, approved gate by gate.

### Claude Code owns
- Astro project scaffold (+ Tailwind, GSAP, MDX).
- Component conversion (Claude Design HTML → `.astro`).
- Fluid responsive system (container queries + clamp + auto-fit + min-height + min-width:0).
- GSAP ScrollTrigger for all motion.
- Quick Audit engine frontend + Netlify function backend.
- Netlify Forms.
- Calendly embed with brand colours.
- SEO metadata, sitemap, 301 redirects.
- Deploy to Netlify staging, DNS cutover at Bigrock.
- Performance: LCP < 1.5s, TBT < 200ms, CLS < 0.1, Lighthouse > 95.
- 18-viewport QA.
- Accessibility build (WCAG 2.1 AA).

### Founder (Aman) owns
- Copy approvals (already locked in the brief).
- Aesthetic approvals at each gate.
- Bigrock DNS access for cutover.
- GA4 and Search Console setup.

---

## 09 · ACCEPTANCE GATES

- **Gate 1** Claude Design: Header + Hero + Quick Audit Engine visual.
- **Gate 2** Claude Design: Why Us + Sectors + Interstitial.
- **Gate 3** Claude Design: Case Studies + How Tamazia Works.
- **Gate 4** Claude Design: Pricing + FAQ.
- **Gate 5** Claude Design: Contact + Footer.
- **Gate 6** Claude Code: Astro scaffold + fluid responsive + 18-viewport matrix.
- **Gate 7** Claude Code: Quick Audit engine working end-to-end on staging.
- **Gate 8** Full staging site QA (accessibility, performance, content).
- **Gate 9** DNS cutover to Netlify.

Nothing advances past a gate without Aman's written approval.

---

## 10 · RISK REGISTER

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Email breakage at DNS cutover | High if MX touched, low if not | Screenshot MX before cutover. Never touch MX records. |
| 2 | SEO dip 30–60 days | Medium | 301 redirects, sitemap resubmission, 30-day Bigrock failsafe. |
| 3 | Calendly/forms break | Medium | Test on staging. Netlify Forms replaces Elementor Forms. |
| 4 | Hidden Elementor detail missed | Medium | Side-by-side visual compare at each gate. |
| 5 | Claude Design 3D cohesion breaks | Medium | Batch-generate in one session; reject and re-prompt as a set. |
| 6 | Image perf regression | Low | Netlify Image CDN + explicit width/height + AVIF/WebP. |
| 7 | Safari parallax still fails | Very low | GSAP ScrollTrigger is iOS-tested. |
| 8 | Container queries fail on old browsers | Very low | 95% global support. Viewport fallback. |

Overall confidence: 90–92%.

---

## 11 · TIMELINE

6 focused days from start to live DNS.

- **Day 1 AM**: assemble reference bundle, open Claude Design, Gate 1 iterated.
- **Day 1 PM**: Gate 1 approved. Claude Code starts Astro scaffold.
- **Day 2**: Gates 2, 3, 4 designed + approved.
- **Day 3**: Gate 5 designed. Claude Code completes section conversions. Quick Audit engine built.
- **Day 4**: Full staging. 18-viewport QA. 3D objects generated as batch.
- **Day 5**: Final QA, SEO metadata, accessibility audit. Gate 8 passed.
- **Day 6**: DNS cutover. GA4 + Search Console. 48-hour monitoring.

— End of Build Bible —
