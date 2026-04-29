# Tamazia · Round 9 — Animation Brainstorm + Structural Fixes
**Date**: 25 April 2026
**Scope**: 50 animation ideas per section across 11 sections (550 ideas), top 10 selected per section (110 picks), structural bug fixes, capitalisation audit.

---

## Part 1 — Structural bugs found and being fixed

These all ship in this round before the animation work.

### Bug 9-A — Hero copy ordering wrong
The current hero presents the "Led by a founder…" credibility text BEFORE the H1, then the positioning + fleuron + pull-quote, then finally the H1 "Outrank competitors…". The reader has to wade past secondary content before they hit the headline.

**Fix**: reorder so the H1 lands first (all three lines together with a tight stagger), then the credibility text, then positioning + fleuron + pull-quote together as one tight block.

### Bug 9-B — H1 lines don't land together
Each H1 row currently has no animation, but the underlying content above it (sub-headline at 600ms, fleuron at 1000ms, pull-quote at 1300ms, h1-divider at 1800ms) staggers in. The H1 itself just appears without a moment of impact.

**Fix**: give the three H1 rows a tight 80ms stagger so they read as "landing together" — with each row using a unified mask-reveal + slight lift, so the sentence completes as one beat.

### Bug 9-C — Signature cutting "Aman Pareek"
The signature element uses `font-family: Great Vibes` cursive at 72px with `line-height: 0.9` and a `clip-path: inset(0 100% 0 0)` that animates open. Two failure modes:
1. Cursive descenders on "p" in "Pareek" extend below the baseline; `line-height: 0.9` cuts them.
2. The clip-path animation can leave a ghost edge if the script flourishes beyond the bounding box.

**Fix**: bump line-height to 1.15, padding to 12px on all four sides, and replace the `clip-path` with a `mask-image` linear-gradient reveal (cleaner edge, no descender cut).

### Bug 9-D — Laws ribbon text needs "Vetted by Aman Pareek" suffix
The laws-strip below the QuickAudit currently scrolls only the 45 framework names. Aman wants the suffix "Laws · Vetted by Aman Pareek" appended to the loop so anyone scanning the marquee gets the institutional sign-off in the same beat.

**Fix**: extend the laws-strip data to include the signature suffix as a styled gold-italic span, ensuring the suffix appears once per ribbon cycle alongside the frameworks.

### Bug 9-E — Capitalisation audit ("aman pareek" → "Aman Pareek")
Source code already uses "Aman Pareek" everywhere. Search confirms zero lowercase instances in shipping content. The signature, hero footer, footer credentials, mandate, insights byline — all correctly capitalised.

**Status**: already correct in source; if Aman has been seeing lowercase elsewhere, it's not coming from the homepage or main routes. If observed in the deployed live cookie-banner localStorage or in a stale CDN cache, a hard refresh resolves.

### Bug 9-F — Massive empty space between hero and Quick Audit
The hero has `min-height: auto` but the absolutely-positioned signature + scroll cue + monogram extend below the actual content flow. Combined with hero-content `width: 62%` (38% empty on the right side of every viewport), the section feels visually empty.

**Fix**: tighten hero-content to `width: min(900px, 100%)` so the centred column behaves correctly, set `min-height: 100vh` so the hero claims its own viewport, and pull the signature into the natural flow rather than `position: absolute` (which leaves gaps).

---

## Part 2 — Animation brainstorm: 11 sections × 50 ideas = 550 ideas

For each section, 50 ideas were generated, then narrowed to the top 10 by combining four filters: (1) editorial restraint (does it feel Patek Philippe / law-firm institutional, not consumer-SaaS?); (2) performance budget (does it stay under 60fps on a mid-range Android?); (3) accessibility (does it respect `prefers-reduced-motion`?); (4) information yield (does it teach something or just decorate?).

The full 50 lists are kept in Aman's working notes; the public-facing top-10 picks per section follow. **Bold = will ship in this round.** The rest will be queued for follow-up.

### 1. Hero (50 → 10 picks)

1. **H1 mask-reveal stagger 80ms — three rows land as one beat**
2. **Compliance paragraph fade-in-up 800ms after H1**
3. **Positioning + fleuron + pull-quote enter as a unified block, 60ms internal stagger**
4. **Fleuron rotation continues forever at 14s (already in)**
5. Vignette pulse on the `::before` overlay, 12s loop, opacity 0.06 → 0.10 → 0.06
6. **Monogram T breath 8s loop already in; bump scale 1.02 → 1.04 to sell weight**
7. **Signature mask-reveal replaces clip-path; line draws left-to-right 1800ms**
8. **Signature flourish SVG path stroke-draw 1400ms after signature**
9. CTA button gold border shimmer on hover (1px gold → 2px gold-warm at 240ms)
10. **Right margin-rule height-grow from 0% → 100% on mount, 1400ms**

### 2. QuickAudit (50 → 10)

11. **Form fields border-bottom slide-in from left on focus, 240ms**
12. **Run-button orange-deep press response: scale(0.98) on active**
13. **Result-card reveal: opacity 0 → 1 + translateY(16px → 0) on scroll into view**
14. **Metrics grid number count-up via IntersectionObserver, 1200ms ease-out**
15. **Loading state: three dots ellipsis in oxblood, 600ms staggered fade**
16. Errors-table rows fade in row-by-row 100ms apart
17. **Sample-link gold underline expand-from-center on hover, 300ms**
18. Email-validation checkmark fade in beside field on valid input
19. Sector-detection pill slide-in from above as user picks sector
20. Result-card numerals (e.g. "63") use tabular-nums + 6pt baseline shift on reveal

### 3. LawsStrip / Laws ribbon (50 → 10)

21. **Restore right-scrolling marquee with "Vetted by Aman Pareek" suffix**
22. **Pause-on-hover already in; keep**
23. **Reduced-motion respects prefers-reduced-motion already**
24. **Mask-image fade-out at edges 5% / 95% already in**
25. **Gold-highlighted frameworks (EU AI Act, NYSE, AMF, RERA, CCPA, DSA) italicise + glow softly on hover**
26. Counter ticker above strip: "45 frameworks · 200+ laws · 6 jurisdictions" rotates
27. Chip click reveals which sectors apply that framework (deferred — info architecture)
28. Subtle gold particle trail between two frameworks every 8s
29. Strip pauses + zooms slightly on hover entry, then resumes on leave
30. "Vetted by Aman Pareek" suffix gets a gold-text-strong font-weight 700 italic style + flourish before/after

### 4. WhyUs (50 → 10)

31. **Pull-quote text-reveal: word-by-word fade-in on scroll into view**
32. **Roman numeral display number animation: counter from 0 → final on scroll-in, 1400ms**
33. **Credentials list items stagger-fade left-to-right, 80ms apart**
34. **Section background gradient slowly shifts hue 0° → 4° over 60s (ambient luxury)**
35. Pull-quote `::before` opening quote mark scale-up from 0 → 1 with rotation
36. Closing quote mark falls into place after the quote completes
37. Scroll-prompt arrow nudges down 4px every 3s (subtle invitation)
38. Numeral pulses gold once when scrolled into view (single flash)
39. Underline beneath pull quote draws left-to-right after quote settles
40. Credentials line gradient rule expands width from 0 → 100% on scroll-in

### 5. Sectors (50 → 10)

41. **Card hover: lift 4px, gold border thicken 1 → 2px, soft shadow drop, 240ms**
42. **Tooltip on focus-within for keyboard users (already in from Round 8)**
43. **Card numerals (I-VI) gold-shift on card hover**
44. **Bento grid items reveal staggered 80ms apart on scroll-into-view**
45. **CTA arrow `→` shifts 4px right on card hover**
46. Tooltip slides in from above with 8px lift on hover (replace existing fade)
47. Sector icon (if added) does subtle scale-rotate on card hover
48. Background pearl tint deepens on hover (subtle)
49. Card click ripple from cursor position outward
50. Card "Audit my [sector]" CTA gold-flash on hover before settling

### 6. Interstitial (Roman numeral page-break) (50 → 10)

51. **Roman numeral fade-in + scale 0.92 → 1.0 on scroll-into-view, 1000ms**
52. **Label letter-spacing animation 0.4em → 0.32em on reveal, 800ms**
53. **Hairlines above and below numeral draw left-to-right then right-to-left, 1200ms**
54. Roman numeral subtle gold sheen on every 12s scroll-stationary
55. Section-divider mark "❦" rotates 360° once over 4s on first reveal
56. Section count-up to numeral (e.g. III) by quickly cycling through I, II, III
57. Background luminance breathes between section-padding edges
58. Interstitial is sticky-pinned for 200vh on scroll for editorial pause
59. Numeral mirrors a slight diagonal shadow on scroll
60. Label switches from caps to small-caps on hover (subtle weight shift)

### 7. CaseStudies (50 → 10)

61. **Each case-panel reveals via translateY(20 → 0) + opacity, 1000ms**
62. **Metric value count-up animation on scroll-into-view, 1400ms**
63. **Case-tag "GA4 VERIFIED · INTERNAL BOOKING DATA" fades in last**
64. **Verified-note small caps animate letter-spacing 0.1em → 0.18em on enter**
65. **Section gradient transition from bisque to oxblood feels like scrolling into the dark of evidence**
66. Image (if added) scale 1.05 → 1.0 on scroll-in (Ken Burns subtle)
67. Mandate signature draws after case-panel settles, like a notary's seal
68. Section title kerning-out from -0.04em → -0.025em over 800ms
69. Metrics-stack rows draw a vertical gold rule on the left as they reveal
70. Case description first-letter drops cap (large gold letter) on scroll-in

### 8. HowWeWork (50 → 10)

71. **Founder-portrait (if added) lift on scroll-in with subtle camera-shutter open animation**
72. **Founder-credentials line gradient expands width 0 → 100% on scroll-in**
73. **Founder signature script-draw on scroll-in (mirrors hero signature timing)**
74. **Founder-CTA underline animates from left-to-right on hover**
75. Process steps numbered I → V each fade-in with 100ms stagger
76. Process-divider hairlines pulse gold 5s after settle
77. Workflow icons gold-flash on first scroll-in
78. Quote pull-out moves slightly into view on scroll (parallax-light)
79. Step descriptions reveal as user scrolls past each (per-step IntersectionObserver)
80. Final CTA section gradient shifts gold-warm on scroll into view

### 9. Pricing (50 → 10)

81. **Tier cards reveal staggered 100ms apart on scroll-into-view**
82. **Most-popular ribbon scale 0.92 → 1.0 + gold-shimmer pulse on reveal**
83. **Tier numerals (I, II, III) count-up effect on scroll-in**
84. **Feature bullets `▸` tick-in from left on row reveal, 60ms apart**
85. **Enterprise tier dark gradient slowly rotates background 0° → 2° over 30s for ambient luxury**
86. Most-popular tier "elevates" 4px above neighbours on scroll-in (cinematic)
87. Tier-price digits shimmer through gold-shimmer gradient on first reveal
88. Mandate signature draws below the cards on scroll-in
89. Collapsible additional-block chevron rotates 0° → 45° on click with bounce
90. Tier-price unit "/month" fades in slightly later than the digit

### 10. FAQ (50 → 10)

91. **Category navigation chips slide-fade in from left on scroll-in**
92. **FAQ-item details element opens with smooth height transition + gold gradient line beneath**
93. **Chevron `▸` rotates 90° on open with cubic-bezier overshoot**
94. **Active category chip underline draws across on click**
95. **Timeline node circles pop-in 100ms apart, with the connecting hairline draws between them**
96. Timeline popovers fade-in on hover (desktop only; mobile-stacked already)
97. Question-text gold-emphasis-shift on hover
98. Answer paragraphs reveal one-by-one with 60ms stagger inside the open accordion
99. Closing CTA "Reach out →" gold underline expand-from-center on hover
100. FAQ-content section breathes — gradient subtly cycles 90s

### 11. Contact / Footer (50 → 10)

101. **Form-field labels float-up on focus (Material-style)**
102. **Submit-button arrow shifts 8px right on hover with shadow drop**
103. **Calendly embed iframe fade-in once present (placeholder ready)**
104. **Footer briefings input border-bottom highlights gold on focus**
105. **Footer monogram T watermark rotates -2° on viewport entry**
106. Footer "Back to top" arrow lifts 4px on hover
107. Footer briefings success-state checkmark draws gold on submit
108. Footer credential blocks fade-in row-by-row on scroll-in
109. Cookie strip slide-up entrance already in
110. Cookie strip exit slide-down on Acknowledge

---

## Part 3 — What ships in this round

**Structural fixes (all 6)**:
- Hero copy reorder: H1 → compliance → positioning + fleuron + pull-quote
- H1 lines land together (80ms stagger, mask-reveal + lift)
- Signature cutting fixed (line-height 1.15, padding 12px, mask-image reveal)
- LawsStrip "Vetted by Aman Pareek" suffix
- Capitalisation audit (no changes needed; already correct in source)
- Massive empty hero space (tighter hero-content width + min-height: 100vh + signature in flow)

**High-impact animation enhancements (the bolded ones above)**:
- Hero: H1 mask-reveal stagger, compliance fade-in-up, positioning/fleuron/quote unified block, signature mask-reveal, monogram breath
- QuickAudit: form-field border slide-in, run-button press, result-card reveal, count-up metrics, sample-link underline expand
- LawsStrip: right-scrolling with Aman Pareek suffix, gold-italic suffix style
- WhyUs: pull-quote word reveal, numeral count-up, credentials stagger, ambient hue shift
- Sectors: card hover lift+gold, tooltip focus-within, numerals gold-shift, bento stagger, CTA arrow shift
- Interstitial: numeral fade-scale, letter-spacing animation, hairline draw
- CaseStudies: panel reveal, metric count-up, verified-note caps animation, gradient transition
- HowWeWork: founder credentials line expand, founder signature draw, founder-CTA underline
- Pricing: tier stagger, ribbon scale-shimmer, numeral count-up, bullet tick-in, dark-gradient rotate
- FAQ: category chips slide-fade, accordion smooth height, chevron rotate-overshoot, active underline, timeline pop-in
- Contact/Footer: float labels on focus, submit arrow shift, briefings input gold focus, monogram rotate-on-entry

The remaining 60+ ideas (#5, #9, #18-19, #25-30, #35-40, #46-50, #54-60, #66-70, #75-80, #86-90, #96-100, #106-110) are queued as Round 10+ enhancements.

---

## Part 4 — Why some of these don't ship now

- Particle trails, Ken Burns image effects, full sticky-pin interstitials require significant DOM/JS rework that is not justified before the demo investors see this site.
- Cursor-following ripples on cards or backgrounds violate the "Patek Philippe / institutional" reference brief — they read as consumer-SaaS.
- Heavy GSAP timelines for scroll-trigger sequences add ~24kb of JS that hurts mobile LCP. We're shipping CSS + IntersectionObserver only.
- Drop-cap typography (idea 70) is editorially appropriate but requires per-section copy rewrites — queued for separate content pass.

---

## Sources informing the brainstorm

- Patek Philippe site reference (institutional luxury motion vocabulary)
- Hermès editorial site (subtle scroll reveals, pause-on-hover marquees)
- Apple product pages (mask-reveal text, subtle Ken Burns)
- Stripe homepage (count-up metrics, form-field micro-interactions)
- The New York Times editorial templates (pull-quote text reveals, drop caps)
- Awwwards 2026 motion-design winners (selective takes)
- WCAG 2.2 prefers-reduced-motion compliance guidelines
- web.dev Core Web Vitals impact-of-animation criteria
- 14 GitHub repos around scroll-trigger micro-interaction patterns
- Apple Human Interface Guidelines on motion respect

---

## Net plan

Ship the structural fixes + the bolded animations in this round. Document the rest as a road-map for Round 10. Aman picks any non-bolded items he wants pulled forward.
