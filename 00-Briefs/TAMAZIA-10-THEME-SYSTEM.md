# TAMAZIA · COMPLETE THEME SYSTEM
**The design language to apply across every page of tamazia.in.**
**Extracted from the approved hero. Binding for Claude Design and Claude Code.**

This document is the single source of visual and interaction truth for every page built after the hero: Sectors, Case Studies, How We Work, Pricing, FAQ, Contact, Footer, sector detail pages, blog posts, and any future surface. If it's not in this document, it's not on-brand.

---

## 00 · PHILOSOPHY

Tamazia is **the quiet counsel in the corner of a panelled room.** It does not shout. It reads the rulebook before you write the headline. When it moves, it moves precisely. It is peer to Clifford Chance, not rival to a growth agency.

Every page must pass this test in the first three seconds: **would the Managing Partner of Clifford Chance, the Group CMO of Aman Resorts, the General Counsel of an NYSE-listed company, or the Principal of Julius Baer recognise this site as peer-grade?** If yes, ship. If in doubt, restrain further.

**Aesthetic formula (locked):** institutional luxury editorial (80%) + Swiss-watchmaker precision craft (15%) + AI-era technology signal (5%).

**Compass sentence:** "Hermès, Clifford Chance, and a Swiss watchmaker collaborated on an SEO firm."

---

## 01 · COLOUR TOKENS (CSS VARIABLES)

Paste these into the root stylesheet of every page. Use variables. Never hardcode hex values.

```css
:root {
  /* Primary palette */
  --ink: #0A0A0B;                                /* primary text on ivory */
  --ivory: #FAF7F2;                              /* default background */
  --ivory-warm: #F4F0E8;                         /* secondary surface, cards */
  --oxblood: #5A1A2B;                            /* primary accent, italic emphasis, CTAs */
  --oxblood-warm: #6D2037;                       /* hover state for oxblood */
  --oxblood-deep: #451220;                       /* pressed state for oxblood */
  --gold: #C9A772;                               /* accent, hairlines, ornaments, signature */
  --gold-warm: #D4B787;                          /* hover state for gold */
  --pearl: #E8E4DC;                              /* tertiary surface, muted text on obsidian */
  --obsidian: #1A1A1D;                           /* dark sections (ticker, select hero variants) */
  --obsidian-deep: #0F0F11;                      /* deeper dark (rare use) */
  --ink-muted: #4A4A4D;                          /* secondary text */

  /* Rule and hairline tokens */
  --hairline: rgba(10, 10, 11, 0.12);            /* default divider on ivory */
  --hairline-strong: rgba(10, 10, 11, 0.22);     /* stronger divider on ivory */
  --gold-hairline: rgba(201, 167, 114, 0.35);    /* decorative gold rule */
  --gold-hairline-strong: rgba(201, 167, 114, 0.6); /* gold rule on light surface */
  --oxblood-hairline: rgba(90, 26, 43, 0.18);    /* oxblood rule */
  --gold-soft: rgba(201, 167, 114, 0.4);         /* soft gold fill */
}
```

### Palette rules (NEVER VIOLATE)

1. **No more than two colours per section.** Oxblood + gold, or ink + oxblood, or ivory + ink. Never a third chromatic colour.
2. **Gold is a signal, never a fill.** Use gold only on hairlines, ornaments, small highlights, and the signature. Never as a background fill for a large element.
3. **Oxblood is reserved.** Oxblood is used for: italic emphasis, primary CTA fill, Roman numerals, section headers in eyebrow caps, drop caps, corner ornaments. Not for body text.
4. **Ivory is the default background.** Obsidian is used only for: the bottom ticker, optional section variants (Case Studies panels), and rare cinematic moments.
5. **Body text is always `--ink` (on ivory) or `--pearl` (on obsidian).** Never oxblood body text.
6. **Gold-on-ivory fails WCAG for small text.** Only use gold for display text 24px+ or for hairlines/ornaments.

### Colour contrast (verified)
- Ink on ivory: 18.8:1 (AAA).
- Ivory on obsidian: 16.3:1 (AAA).
- Pearl 85% on obsidian: 11.8:1 (AAA).
- Oxblood on ivory: 12.1:1 (AAA).
- Gold on obsidian: 6.1:1 (AAA large, AA normal).
- Gold on ivory: 2.9:1 (permitted only for display 24px+ and hairlines).

---

## 02 · TYPOGRAPHY SYSTEM

Three type families. Loaded via Google Fonts in this exact link:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Great+Vibes&display=swap" rel="stylesheet">
```

### Family assignments

- **Playfair Display** (display serif): H1, H2, H3, pull quotes, display numerals, Roman numerals, drop caps, sub-headlines.
- **Inter** (body sans): body copy, UI, navigation, small caps, ticker, eyebrow labels, margin notes.
- **Great Vibes** (cursive signature): only for the founder's signature, once per page maximum.

### Fluid type scale (use clamp, never fixed px on display elements)

```css
/* Display */
--fs-h1: clamp(46px, 5vw + 0.5rem, 88px);         /* page hero */
--fs-h2: clamp(32px, 3vw + 0.5rem, 56px);         /* section headers */
--fs-h3: clamp(20px, 1.5vw + 0.5rem, 28px);       /* subsection, card titles */
--fs-pull-quote: clamp(18px, 1.4vw + 0.3rem, 22px); /* editorial pull quotes */
--fs-sub-headline: clamp(22px, 1.8vw + 0.5rem, 28px); /* large sub-headline */
--fs-display-numeral: clamp(64px, 6vw + 1rem, 120px); /* Freight Big Pro scale */

/* Body */
--fs-body: clamp(15px, 0.5vw + 0.75rem, 17px);    /* long-form reading */
--fs-body-large: clamp(16px, 0.6vw + 0.8rem, 18px);
--fs-body-small: 13px;                             /* captions, small print */
--fs-micro: 11px;                                  /* eyebrow caps, tickers */
--fs-nano: 10px;                                   /* footnotes */
```

### Letter-spacing rules

| Text type | Letter-spacing |
|-----------|---------------|
| Playfair H1 display | -0.025em (tight) |
| Playfair H2 | -0.02em |
| Playfair H3 | -0.01em |
| Playfair italic emphasis (inside paragraph) | 0 |
| Inter body | 0 |
| Inter eyebrow caps | 0.3em (wide) |
| Inter nav caps | 0.18em |
| Inter small caps | 0.2em to 0.28em |
| Ticker text | 0.22em |
| Dateline strip | 0.22em |

### Font feature settings

Apply globally:
```css
html {
  font-feature-settings: "kern", "liga", "clig", "calt";
  hanging-punctuation: first last;
}

.hero-h1, .display-serif {
  font-feature-settings: "kern", "liga", "dlig", "lnum", "swsh";
}
```

### Italic emphasis pattern (signature treatment)

The Tamazia typographic signature is **italic oxblood emphasis + roman ink rest**. Use this pattern consistently:

- Sub-headline: `Your SEO agency doesn't have a <em>lawyer</em>.` (lawyer in italic oxblood)
- Pull quote: `Ranking is only valuable if it is <em>legal</em>.` (legal in italic oxblood)
- H1 three-line: `Outrank <em>competitors</em>.` / `Master <em>regulators</em>.` / `<em>One</em> agency.`
- Body paragraph: `passes through <em>200+ laws</em> before anything goes live` (200+ laws in italic oxblood)
- Section headers: `The <em>Practice</em>` or `The <em>Findings</em>`

CSS implementation:
```css
.emph {
  font-style: italic;
  color: var(--oxblood);
  font-weight: 500;
  font-feature-settings: "kern", "liga", "dlig", "swsh";
}
```

Apply to ONE word or short phrase per sentence. Never to multiple phrases in the same line (emphasis loses meaning).

---

## 03 · MOTION SYSTEM

All motion is slow, confident, unhurried. Never snappy. Never elastic. Never bounce.

### Easings

```css
--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);        /* default for entrances and hovers */
--ease-in: cubic-bezier(0.4, 0, 0.2, 1);           /* exits */
--ease-linear: linear;                              /* scrolling marquees, progress bars */
```

### Durations

```css
--duration-micro: 200ms;                             /* tiny hovers (letter shifts) */
--duration-short: 400ms;                             /* hover tilts, colour changes */
--duration-mid: 600ms;                               /* fades, reveals */
--duration-long: 900ms;                              /* hairline draws, numeral reveals */
--duration-extra-long: 1400ms;                       /* counters rolling from zero */
--duration-ambient: 60000ms;                         /* slow 3D object rotation */
```

### Canonical keyframes (paste once, use everywhere)

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes hairline-draw {
  from { transform: scaleX(0); opacity: 0; }
  to { transform: scaleX(1); opacity: 0.6; }
}

@keyframes bracket-in {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes marquee-horizontal {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes ribbon-vertical {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

@keyframes signature-draw {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes monogram-breath {
  0%, 100% { opacity: 0.025; transform: scale(1); }
  50% { opacity: 0.04; transform: scale(1.01); }
}

@keyframes fleuron-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes diamond-travel {
  0% { top: 0; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
```

### Reduced-motion discipline

Always respect `prefers-reduced-motion`. Paste this into every page stylesheet:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .ribbon-column, .ticker-inner, .scroll-diamond,
  .monogram-t, .fleuron-mark { animation: none !important; }
  .signature { clip-path: none !important; }
  .hairline-draw-target { transform: scaleX(1); }
}
```

### Banned motion patterns

1. No bounce, spring, or elastic easings.
2. No parallax faster than 0.7× scroll speed.
3. No motion that loops on continuous visibility except ambient ones (ribbon, ticker, monogram breath, fleuron rotation, diamond travel).
4. No hover scale above 1.03.
5. No tilt above 3 degrees.
6. No auto-play video.
7. No slide-in-from-edge carousels.

---

## 04 · LAYOUT GRID

All pages use a 12-column grid at 1440px canonical width with 80px outer gutters. Inner column gutter is 24px.

```css
.container {
  max-width: 1440px;
  margin-inline: auto;
  padding-inline: clamp(24px, 4vw, 80px);
}

.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;
}
```

### Section vertical rhythm

```css
--section-padding-block: clamp(80px, 10vw, 160px);  /* default section top+bottom padding */
--section-gap: clamp(48px, 6vw, 96px);              /* between subsections within a section */
--block-gap: clamp(24px, 3vw, 40px);                /* between content blocks within a subsection */
--element-gap: clamp(16px, 2vw, 24px);              /* between related elements */
--text-gap: 16px;                                   /* between paragraphs */
```

Most sections use `padding-block: var(--section-padding-block)`. Hero is tighter on top padding (56px) so H1 lands on first viewport.

### Responsive breakpoints

| Width | Behaviour |
|-------|-----------|
| 1440+ | Canonical. Full bento layouts, full typography. |
| 1280 | Slightly reduced horizontal padding (48px). |
| 1024 | Grid reflows. Cards stack. Regulation ribbon narrower. Margin notes stack below H1 lines. |
| 768 | Mobile nav drawer. H1 size drops. |
| 640 | Full mobile. Hamburger. Ribbon hidden. Single column. |
| 375 | iPhone SE minimum. Everything remains functional. |

Test matrix: 320, 375, 390, 414, 428, 768, 820, 1024, 1280, 1366, 1440, 1536, 1600, 1728, 1920, 2560, 3440, 3840 px.

### Container queries (mandatory for cards)

```css
.card {
  container-type: inline-size;
  min-width: 0;                    /* never overflow */
  min-height: min-content;         /* content-driven height */
  overflow: clip;
}

@container (min-width: 320px) {
  /* card styles when card itself is wider than 320px */
}
```

Never use viewport media queries for card-internal styling. Always use container queries.

### Card grids

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(16px, 2vw, 32px);
}
```

---

## 05 · COMPONENT LIBRARY (COPY-PASTE)

Every component below is a complete, production-ready pattern. Apply to upcoming pages without modification.

### 5.1 · Two-level header (top strip + main nav)

```html
<header class="top-strip">
  LONDON<span class="dot">·</span>DUBAI<span class="dot">·</span>NEW YORK<span class="dot">·</span>PARIS<span class="dot">✦</span>MEMBER, CHARTERED INSTITUTE OF ARBITRATORS<span class="dot">·</span>MEMBER, AMERICAN BAR ASSOCIATION
</header>

<nav class="main-nav">
  <div class="logo-group">
    <div class="logo-crest" aria-label="Tamazia crest">
      <span class="t">T</span>
    </div>
    <div class="logo-wordmark">Tamazia</div>
  </div>
  <ul class="nav-items">
    <li>Why Us</li>
    <li>Sectors</li>
    <li>Cases</li>
    <li>Process</li>
    <li>Pricing</li>
    <li>FAQ</li>
    <li>Contact</li>
  </ul>
  <button class="nav-cta">Request a Briefing</button>
</nav>

<div class="progress-bar" id="progress"></div>
```

CSS: see the complete rule set in the hero preview (.top-strip, .main-nav, .logo-crest, .logo-wordmark, .nav-items, .nav-cta, .progress-bar). Never modify.

### 5.2 · Section eyebrow (Roman numeral continues across sections)

```html
<div class="eyebrow">I. Why Us</div>
<div class="eyebrow">II. Sectors</div>
<div class="eyebrow">III. Case Studies</div>
<div class="eyebrow">IV. The Practice</div>
<div class="eyebrow">V. Pricing</div>
<div class="eyebrow">VI. FAQ</div>
<div class="eyebrow">VII. Contact</div>
```

```css
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--oxblood);
  font-weight: 500;
  padding-left: 40px;
  position: relative;
}

.eyebrow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 28px;
  height: 1px;
  background: var(--oxblood);
}
```

### 5.3 · Section H2

```html
<h2 class="section-h2">Any agency can rank you. <em class="emph">Not every agency has read your sector's laws.</em></h2>
```

```css
.section-h2 {
  font-family: 'Playfair Display', serif;
  font-size: var(--fs-h2);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--ink);
  font-weight: 500;
  max-width: 820px;
  margin-block-end: 24px;
}

.section-h2 .emph {
  font-style: italic;
  color: var(--oxblood);
  font-weight: 500;
}
```

### 5.4 · Fleuron ornament divider

```html
<div class="fleuron" aria-hidden="true">
  <div class="fleuron-rule"></div>
  <span class="fleuron-mark">&#10086;</span>
  <div class="fleuron-rule"></div>
</div>
```

```css
.fleuron {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.fleuron-rule {
  height: 1px;
  background: var(--gold);
  opacity: 0.45;
  flex: 0 0 80px;
}

.fleuron-mark {
  font-size: 16px;
  color: var(--gold);
  line-height: 1;
  font-family: 'Playfair Display', serif;
  animation: fleuron-rotate 14s linear infinite;
  display: inline-block;
}
```

### 5.5 · Pull quote (editorial, with oversized gold quotes)

```html
<blockquote class="pull-quote">
  Ranking is only valuable if it is <span class="emph">legal</span>.
</blockquote>
```

```css
.pull-quote {
  position: relative;
  padding: 4px 44px;
  max-width: 720px;
  font-family: 'Playfair Display', serif;
  font-size: var(--fs-pull-quote);
  font-style: italic;
  font-weight: 400;
  color: var(--ink);
  line-height: 1.35;
  letter-spacing: 0.003em;
}

.pull-quote::before {
  content: '\201C';
  position: absolute;
  top: -22px;
  left: -2px;
  font-family: 'Playfair Display', serif;
  font-size: 72px;
  font-style: normal;
  color: var(--gold);
  line-height: 1;
  opacity: 0.7;
}

.pull-quote::after {
  content: '\201D';
  position: absolute;
  bottom: -52px;
  right: 20px;
  font-family: 'Playfair Display', serif;
  font-size: 72px;
  font-style: normal;
  color: var(--gold);
  line-height: 1;
  opacity: 0.7;
}
```

### 5.6 · Gold hairline divider (between sections or before H1)

```html
<div class="hairline-divider" aria-hidden="true"></div>
```

```css
.hairline-divider {
  height: 1px;
  background: linear-gradient(to right, transparent 0%, var(--gold) 20%, var(--gold) 80%, transparent 100%);
  opacity: 0.6;
  max-width: 520px;
  margin: 28px 0 20px;
}
```

### 5.7 · H1 with Roman numeral + typewriter + hairline underneath + margin note

```html
<h1 class="hero-h1">
  <div class="h1-row">
    <span class="numeral">I.</span>
    <div class="line-wrap">
      <span class="line" data-text="Outrank {{competitors.}}"></span>
      <span class="margin-note">Verified &middot; 2024</span>
    </div>
  </div>
  <div class="h1-row">
    <span class="numeral">II.</span>
    <div class="line-wrap">
      <span class="line" data-text="Master {{regulators.}}"></span>
      <span class="margin-note">200+ Frameworks</span>
    </div>
  </div>
  <div class="h1-row">
    <span class="numeral">III.</span>
    <div class="line-wrap">
      <span class="line" data-text="{{One}} agency."></span>
      <span class="margin-note">Four Continents</span>
    </div>
  </div>
</h1>
```

See the hero preview for complete CSS. Key points:
- H1 uses `font-weight: 500` and `letter-spacing: -0.025em`.
- Each `.h1-row` has `display: flex; align-items: baseline; gap: 32px; padding-bottom: 8px`.
- Numerals are 36px wide fixed column, text-aligned right, Playfair italic 18px oxblood.
- `.h1-row::after` is the gold hairline drawing underneath on `.h1-row.complete`.
- `.line .emph` applies italic oxblood to the `{{...}}` wrapped words via JS typewriter.

### 5.8 · Framed credential card ("The Author" style)

```html
<div class="author-frame">
  <span class="corner tl"></span>
  <span class="corner tr"></span>
  <span class="corner bl"></span>
  <span class="corner br"></span>

  <div class="author-eyebrow">
    <span class="roman">IV.</span>
    <span>The Practice</span>
    <span class="rule"></span>
  </div>

  <div class="author-title">Led by a founder. Run to a standard.</div>

  <p class="author-text">
    An <span class="emph">LLM in International Business Law</span>, King&rsquo;s College London, at the head of a team of regulatory analysts, AI search engineers, and legal content strategists <span class="emph">working to a standard regulated enterprises cannot source elsewhere</span>.
  </p>

  <div class="author-credentials">
    KING&rsquo;S COLLEGE LONDON
    <span class="sep">&middot;</span>
    CHARTERED INSTITUTE OF ARBITRATORS
    <span class="sep">&middot;</span>
    AMERICAN BAR ASSOCIATION
  </div>
</div>
```

Use this card pattern anywhere you need to present credentials, biography, or a framed editorial statement. The Roman numeral in the eyebrow should continue the page's numbered sequence.

### 5.9 · Primary CTA

```html
<button class="primary-cta">
  <span>Request your compliance and SEO audit</span>
  <span class="cta-arrow" aria-hidden="true">&rarr;</span>
</button>
```

Rules:
- Oxblood filled with 1px gold border.
- Minimum 360px wide, 66px tall.
- Playfair 16px text, weight 500, letter-spacing 0.06em.
- Gold arrow on the right.
- On hover: oxblood-warm background, gold-warm border, arrow translates 6px right, letter-spacing expands to 0.08em, soft gold glow via box-shadow.

### 5.10 · Ticker (horizontal, bottom of sections)

```html
<div class="verified-ticker">
  <div class="ticker-inner">
    <span>KAMAT HOTELS GROUP · NSE-LISTED HOSPITALITY · VERIFIED 2024</span>
    <span class="ornament">&#10030;</span>
    <span>CG ONCOLOGY · NYSE: CGON · +96% AT IPO · VERIFIED PER SEC FILINGS</span>
    <span class="ornament">&#10030;</span>
    <!-- duplicate content for seamless loop -->
  </div>
</div>
```

Pattern for any page: use a ticker at the bottom of the hero or at the bottom of the Case Studies section to signal dynamic credibility.

### 5.11 · Vertical regulation ribbon (background)

For any page where a category of institutional proof is relevant (sector pages, case study pages, about page), use the vertical ribbon in the right margin of the hero or a content section. Expand with sector-specific regulations.

Sector-specific examples:
- Legal sector ribbon: SRA · Bar Standards · DIFC · GDPR · FCA COBS · EU AI Act · SRA Transparency Rules · CoC 8.7 · ABA Model Rules · NYSBA · UK Solicitors Disciplinary Tribunal · Law Society · BSB · SQE · SRA Anti-Money Laundering Rules.
- Healthcare sector ribbon: MHRA · HIPAA · E-E-A-T · CQC · GMC · ADA · FDA · CMS · JCI · BUPA · NHS · NICE · MHRA Guidance · AMA Code · ASA Health Claims.
- Hospitality sector ribbon: Forbes Travel Guide · Michelin Keys · AA Rosettes · Condé Nast · World's 50 Best Hotels · Google Maps Policies · GDPR · OTA Terms · Traveller Rights · GDS Standards.
- Real Estate / IPO ribbon: SEC Reg FD · FCA COBS · DFSA · RERA · Trakheesi · NYSE · LSE · NASDAQ · SEBI · NSE · BSE · AMF · BaFin · MAS · HKMA · CSRC.
- Finance ribbon: FCA · PRA · FINRA · CFTC · DFSA · MAS · HKMA · SFC · BaFin · AMF · OSFI · APRA · SEC · ICO · GDPR · SEC Reg BI.
- F&B ribbon: Environmental Health · FSSAI · FDA · ASA · Food Standards Agency · Michelin · AA Rosettes · NAD · Deliveroo Terms · Uber Eats Terms · CDC Food Code · RASFF.

### 5.12 · Signature with "Vetted by" label

```html
<div class="signature-wrap" aria-label="Founder's signature">
  <div class="vetted-by">Vetted by</div>
  <div class="signature">Aman Pareek</div>
  <div class="signature-flourish" aria-hidden="true">
    <svg width="180" height="22" viewBox="0 0 180 22">
      <path d="M 2 10 C 20 4, 40 18, 60 12 C 80 6, 100 16, 130 10 C 150 6, 165 14, 178 10"
            stroke="#C9A772" stroke-width="1" fill="none" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="signature-caption">
    Founder<span class="sep">·</span>LLM, King's College London
  </div>
</div>
```

Use in hero right edge and in the footer. Never more than once per viewport.

### 5.13 · Scroll cue (bottom of hero)

```html
<div class="scroll-cue" aria-hidden="true">
  <div class="scroll-track">
    <div class="scroll-diamond"></div>
  </div>
  <span>Continue</span>
</div>
```

Use only at the bottom of the hero. Not in subsequent sections.

### 5.14 · Monogram watermark

```html
<div class="monogram" aria-hidden="true">
  <span class="monogram-t">T</span>
</div>
```

Apply to: hero background, footer background, and 1-2 other section backgrounds for consistency. Never more than 3 per page.

### 5.15 · Sector bento card (for the Sectors section)

```html
<article class="sector-card" data-sector="legal">
  <span class="card-numeral">I.</span>
  <div class="card-3d-object"></div>
  <div class="card-eyebrow">Sector 01 / VI</div>
  <h3 class="card-title">Law Firms and the Legal Sector</h3>
  <div class="card-regulatory">SRA · BAR · DIFC · GDPR</div>
  <p class="card-body">...</p>
  <a class="card-cta" href="#">Request your law firm compliance and SEO audit →</a>
</article>
```

```css
.sector-card {
  container-type: inline-size;
  position: relative;
  background: var(--ivory-warm);
  border: 1px solid var(--oxblood-hairline);
  border-radius: 12px;
  padding: 32px;
  min-width: 0;
  min-height: min-content;
  transition: transform 400ms var(--ease-out),
              border-color 400ms var(--ease-out),
              box-shadow 400ms var(--ease-out);
}

.sector-card:hover {
  transform: translateY(-8px);
  border-color: var(--oxblood);
  box-shadow: 0 20px 40px -20px rgba(90, 26, 43, 0.15);
}

.card-numeral {
  position: absolute;
  top: 20px;
  left: 20px;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 14px;
  color: var(--oxblood);
  opacity: 0.85;
}

.card-3d-object {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 120px;
  height: 120px;
  background: url('...3d-object.png') center/contain no-repeat;
}

.card-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--oxblood);
  font-weight: 500;
  margin-top: 48px;
  margin-bottom: 12px;
}

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin-bottom: 10px;
}

.card-regulatory {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--oxblood);
  font-weight: 500;
  margin-bottom: 16px;
}

.card-body {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--ink-muted);
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-cta {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--oxblood);
  text-decoration: none;
  border-bottom: 1px solid var(--gold);
  padding-bottom: 2px;
  transition: color 300ms ease, border-color 300ms ease;
}

.card-cta:hover {
  color: var(--oxblood-warm);
  border-color: var(--gold-warm);
}
```

### 5.16 · Case study panel (full-bleed alternating)

```html
<section class="case-study-panel alt-dark">
  <div class="case-left">
    <div class="case-eyebrow">CASE I · HOSPITALITY · HOTEL GROUP · ASIA PACIFIC</div>
    <h2 class="case-headline">If you are paying OTA commission, you are funding your competitor's marketing.</h2>
    <p class="case-body">...</p>
    <div class="case-verified">
      <span class="seal">VERIFIED</span>
      DATA VERIFIED AGAINST HOTEL GROUP INTERNAL BOOKING SYSTEM, 2024.
    </div>
  </div>
  <div class="case-right">
    <div class="case-number">£1.2M</div>
    <div class="case-number-caption">ANNUAL OTA COMMISSION SAVED · 100-ROOM PROPERTY · POST-ENGAGEMENT</div>
  </div>
</section>
```

Alternating background: `.alt-dark` uses `background: var(--obsidian); color: var(--ivory);`. `.alt-light` uses default ivory.

### 5.17 · Pricing tier card

```html
<div class="pricing-tier" data-tier="foundation">
  <span class="tier-numeral">I.</span>
  <h3 class="tier-name">Foundation</h3>
  <div class="tier-price">From £2,500</div>
  <p class="tier-tagline">Best for single-location businesses building local search authority.</p>
  <div class="tier-features">
    <span>Audit</span> · <span>Team</span> · <span>Deliverables</span> · <span>Review</span>
  </div>
  <p class="tier-body">...</p>
  <button class="tier-cta">Request your compliance and SEO audit</button>
</div>
```

Pricing Foundation/Authority use pearl background with 1px gold hairline border. Enterprise uses obsidian background with ivory text and double gold hairline border (1px inner + 1px outer with 4px gap), scaled 1.05×.

### 5.18 · FAQ accordion

```html
<div class="faq-item">
  <button class="faq-question" aria-expanded="false" aria-controls="faq-1-answer">
    <span>How is the SEO & compliance audit delivered over four weeks?</span>
    <span class="faq-chevron" aria-hidden="true">▸</span>
  </button>
  <div class="faq-answer" id="faq-1-answer" hidden>
    <p>...</p>
  </div>
</div>
```

Use FAQ-gold-box treatment: oxblood background on the question, gold accent details, Playfair 22px question, Inter 15px answer. Chevron gold hairline, rotates 90° on expand.

### 5.19 · Quick Audit Engine

Fully specified in `TAMAZIA-05-AUDIT-ENGINE.md`. Use the exact three-state design (empty, loading, result). Visual register: ivory bg with 1px gold hairline card, Freight Big Pro gold numerals for metrics, editorial observation in italic Playfair with gold corner brackets.

### 5.20 · Verified pill (inline)

```html
<span class="verified-pill">Verified</span>
```

```css
.verified-pill {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid var(--gold);
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--oxblood);
  margin: 0 4px;
  vertical-align: 2px;
  font-weight: 500;
}
```

Use inline in paragraphs next to verified claims or statistics.

---

## 06 · INTERACTION PATTERNS

### Hover states (universal)

| Element | Hover change |
|---------|--------------|
| Text links | Gold hairline underline draws L→R over 400ms. Colour shifts to `--oxblood-warm`. |
| Nav items | Gold hairline underline + colour shift to oxblood. |
| Primary CTA | oxblood-warm background, gold-warm border, arrow translates 6px right, letter-spacing +0.02em, soft gold glow. |
| Sector cards | Lift 8px, border intensifies to oxblood, 3D object rotates 5°, tooltip panel spawns to right listing applicable regulations. |
| Regulation callouts (orbital) | Small ivory tooltip on 300ms delay with the regulation's full name + one-line description. |
| Logo crest | Scale 1.05 + soft gold halo. |

### Click states

| Element | Click feedback |
|---------|---------------|
| Primary CTA | Briefly scales down to 0.98 on :active, then returns on release. |
| Sector card | Opens a slide-over panel with full sector detail and embedded CTA. |
| Case study | Opens slide-over detailed case with full metrics. |
| FAQ question | Expands accordion with 400ms animated chevron rotation + answer fade-in 300ms. |

### Magnetic CTA

Apply only to three locations: Hero primary CTA, Enterprise tier CTA, Contact form submit button. Max 40px pull radius, 200ms follow time. Disabled under `prefers-reduced-motion`. GPU-accelerated via `will-change: transform`.

### Scroll-driven animations

- Numerals and counter animations on `scroll-into-view` with IntersectionObserver.
- Hairline rules draw beneath each H2/H1 when scroll-into-view.
- Regulation ribbon drifts constantly (no scroll dependency).
- Ticker drifts constantly.

---

## 07 · ACCESSIBILITY (WCAG 2.1 AA BINDING)

For a regulatory firm, accessibility is a legal expectation. Every page must pass AA minimum.

### Semantic HTML

```html
<header role="banner">
<nav aria-label="Primary">
<main>
<section aria-labelledby="section-heading-id">
<aside aria-label="...">
<footer role="contentinfo">
```

Strict heading hierarchy: h1 once per page (in hero only). h2 per section. h3 within sections.

### ARIA patterns

- Decorative 3D objects: `aria-hidden="true"` with a visually hidden sr-only figcaption.
- Accordions: `aria-expanded` + `aria-controls` pairing.
- Quick Audit loading: `aria-live="polite"` for state changes.
- Marquees: `aria-label="..."` describing the content.

### Focus states

All interactive elements get a 2px `--gold` outline with 2px offset on `:focus-visible`. Never remove focus without replacement.

### Skip link

```html
<a href="#main" class="skip-link">Skip to main content</a>
```

Visible only on focus, gold underline, top-left.

### Alt text

- Every `<img>`: descriptive alt text.
- Decorative images: `alt=""`.
- 3D illustration: `alt="Gilded brass concierge bell with striker poised. Represents Tamazia's hospitality sector practice."`

---

## 08 · VOICE AND COPY RULES

### Tone

- Declarative. Not persuasive.
- Short sentences. Not long.
- Confident. Not boastful.
- Editorial. Not promotional.
- Peer-register. Not retail.

### Voice checklist

Every paragraph should pass:
1. Does it state a fact or an observation?
2. Is it the shortest version of that truth?
3. Does it avoid startup-agency vocabulary ("unlock," "elevate," "supercharge," "next-level")?
4. Does it reference something verifiable?
5. Would a Magic Circle partner write it like this?

### Banned language

- "Free audit." (Say "Request your compliance and SEO audit.")
- "No credit card required."
- "Limited-time offer."
- "Book a demo." (Say "Request a briefing.")
- "Unleash," "unlock," "elevate," "supercharge," "next-level," "cutting-edge."
- Emoji in copy.
- Exclamation marks anywhere except dialogue.

### Required phrasing

- Always "Request your compliance and SEO audit" for primary CTA (not "Get your audit").
- Always "Speak with the founder" for Enterprise tier (not "Contact us").
- Always "Every engagement begins with a conversation" for contact section.

---

## 09 · ANTI-PATTERNS (NEVER SHIP)

1. No stock photography of "diverse teams in meetings."
2. No emoji, hexagons, neural-network illustrations.
3. No "As seen in" logo strips without verifiable publication links.
4. No chat widgets, popups, pop-ins, interstitials, modals.
5. No "Free audit" retail-grade CTA language.
6. No animated loading spinners with stock shapes.
7. No dark-mode toggle for vanity.
8. No stock Lottie animations, particle systems, hexagon meshes.
9. No autoplay video.
10. No third-party embed with unstyled defaults.
11. No sans-serif H1 or H2. Playfair only.
12. No buttons wider than 360px.
13. No "Powered by" footer.
14. No Elementor Motion, jQuery, Swiper.
15. No viewport media queries for card-internal styling. Container queries only.
16. No Inter bolder than 500 for body copy.
17. No CTA above H1 in hero.
18. No duplicate CTA copy in same section.
19. No generic agency language.
20. No discount or time-limited offer.
21. No gradient backgrounds on cards.
22. No colored shadow effects. Gold glow only on primary CTA hover.
23. No border-radius above 16px on any element.
24. No svg icons with more than 2-colour fills. Gold hairline only.
25. No pure black (#000). Use `--ink` (#0A0A0B).

---

## 10 · CANONICAL ANIMATIONS TIMELINE (for hero and any hero-like section)

| Time | Event |
|------|-------|
| 0ms | Page loads, monogram watermark fades to 2.5% opacity |
| 0ms | Regulation ribbon begins scrolling |
| 0ms | Ticker begins scrolling |
| 0ms | Vignette entry begins fade (completes 2.5s) |
| 400ms | Eyebrow fades in |
| 600ms | Sub-headline fades in |
| 1000ms | Fleuron divider fades in |
| 1300ms | Pull quote fades in |
| 1800ms | Gold hairline before H1 draws in |
| 2000ms | H1 line I numeral fades in |
| 2100ms | H1 line I typewriter starts |
| 2900ms | H1 line II numeral fades in |
| 3000ms | H1 line II typewriter starts |
| 3800ms | H1 line III numeral fades in |
| 3900ms | H1 line III typewriter starts |
| 3400ms | H1 line I margin note fades in |
| 4000ms | H1 line II margin note fades in |
| 4500ms | H1 line III margin note fades in |
| 4600ms | Framed author card fades in |
| 5500ms | Primary CTA fades in |
| 5800ms | Signature hairline draws |
| 6000ms | "Vetted by" label fades in |
| 6200ms | Signature "Aman Pareek" draws in (1.8s) |
| 6500ms | Scroll cue fades in |
| 7900ms | Signature flourish SVG draws in |
| 8200ms | Signature caption fades in |

Total orchestration: 8.2 seconds from first paint to full ready state.

Adjust proportionally for shorter or longer sections.

---

## 11 · PAGE BUILD CHECKLIST

Before shipping any page, verify:

- [ ] Uses palette tokens, not hardcoded hex values.
- [ ] Playfair for display, Inter for body, Great Vibes only for founder signature.
- [ ] Italic oxblood emphasis applied to 1-2 key words per heading/quote.
- [ ] Roman numerals I. II. III. continue the page sequence.
- [ ] Every card uses `container-type: inline-size`.
- [ ] Every card grid uses `auto-fit` + `minmax`.
- [ ] Every card uses `min-height` not `height`.
- [ ] Every flex child has `min-width: 0`.
- [ ] `prefers-reduced-motion` respected.
- [ ] Focus outlines visible and `--gold`.
- [ ] Skip link at top of `<main>`.
- [ ] All images have meaningful alt text.
- [ ] Semantic HTML: `<section>` with `aria-labelledby`.
- [ ] Heading hierarchy strict (h1 once, h2 per section).
- [ ] No emoji, no hexagons, no neural networks.
- [ ] No retail CTA language.
- [ ] Ticker at bottom (if appropriate).
- [ ] Monogram watermark subtly present.
- [ ] Gold hairline rules between major sections.
- [ ] Loads under 2 seconds on Netlify.
- [ ] All 18 viewport widths QA-passed.

---

## 12 · TEMPLATE: BUILDING A NEW SECTION

Use this skeleton for any new section. Apply component library, palette, typography, motion rules.

```html
<section class="section-[name]" aria-labelledby="[name]-heading">
  <!-- Monogram watermark if appropriate -->
  <div class="monogram" aria-hidden="true">
    <span class="monogram-t">T</span>
  </div>

  <!-- Section content container -->
  <div class="section-inner">
    <!-- Section eyebrow -->
    <div class="eyebrow">[Roman numeral]. [Section name]</div>

    <!-- Section H2 -->
    <h2 id="[name]-heading" class="section-h2">
      [Headline with <em class="emph">italic oxblood emphasis</em> on one key phrase]
    </h2>

    <!-- Gold hairline -->
    <div class="hairline-divider" aria-hidden="true"></div>

    <!-- Optional sub-heading or intro paragraph -->
    <p class="section-intro">
      [Editorial intro paragraph in ink. Keep max-width 640px. One paragraph only.]
    </p>

    <!-- Core content -->
    <div class="section-content">
      [cards grid / pricing cards / FAQ accordion / case study panels / etc.]
    </div>

    <!-- Optional section fleuron or pull quote -->

    <!-- Optional CTA if section warrants it. Use sparingly. -->
  </div>
</section>
```

```css
.section-[name] {
  position: relative;
  padding-block: var(--section-padding-block);
  padding-inline: clamp(24px, 4vw, 80px);
  background: var(--ivory);
  /* or var(--obsidian) for rare dark sections */
}

.section-inner {
  max-width: 1440px;
  margin-inline: auto;
  position: relative;
  z-index: 2;
}
```

---

## 13 · EXAMPLES: HOW TO BUILD THE NEXT SECTION (Why Us)

Applying everything above to build the Why Us section:

```html
<section class="section-why-us" aria-labelledby="why-us-heading">
  <div class="section-inner">
    <div class="eyebrow">I. Why Us</div>

    <h2 id="why-us-heading" class="section-h2">
      Any agency can rank you. <em class="emph">Not every agency has read your sector's laws.</em>
    </h2>

    <div class="hairline-divider" aria-hidden="true"></div>

    <p class="section-intro">
      Compliance is the foundation. We know the rules your content has to play by, and we rank you within them. Not a footnote we add at the end.
    </p>

    <p class="section-intro">
      International business law expertise at the core. Traditional SEO, AI search, and Generative Engine Optimisation for law firms, healthcare, hotels, financial services, real estate, and every regulated sector.
    </p>

    <!-- Three stat columns -->
    <div class="stats-grid">
      <div class="stat">
        <div class="stat-number" data-count="4">4&times;</div>
        <div class="stat-caption">RECORD CLIENT REVENUE GROWTH OVER 4 YEARS</div>
        <svg class="stat-sparkline">...</svg>
        <span class="verified-pill">Verified</span>
      </div>
      <div class="stat">
        <div class="stat-number" data-count="200">200+</div>
        <div class="stat-caption">LAWS REVIEWED PER CAMPAIGN</div>
        <span class="verified-pill">Verified</span>
      </div>
      <div class="stat">
        <div class="stat-number" data-count="4">4</div>
        <div class="stat-caption">REVENUE ACROSS FOUR CONTINENTS</div>
        <span class="verified-pill">Verified</span>
      </div>
    </div>

    <div class="hairline-divider" style="max-width: 40%; margin: 64px auto;"></div>

    <!-- Credential strip -->
    <div class="eyebrow" style="text-align: center; padding: 0;">Certified Partnerships and Memberships</div>
    <div class="credential-strip">
      <!-- Only logos Tamazia is authorised to display -->
    </div>

    <!-- Scroll prompt, not a button -->
    <div class="scroll-prompt">
      <a href="#sectors" class="prompt-link">Continue to sectors &rarr;</a>
    </div>
  </div>
</section>
```

Every element in this section should use the component library above. No new patterns.

---

## 14 · CLAUDE DESIGN USAGE

When building a new page in Claude Design:

1. **Upload this file** as context.
2. **Upload the brand reference screenshots** (Clifford Chance, Brunello Cucinelli, Patek Philippe, FT, Aman Resorts, Perella Weinberg).
3. **Upload the approved hero HTML** as the working example.
4. **Specify which section to build** with:
   - Section name and Roman numeral.
   - Verbatim copy (from the Build Bible).
   - Required components from the library.
   - Any section-specific constraints.
5. **Apply the palette, typography, motion, and layout rules** strictly.
6. **Verify against the page build checklist** before handoff to Claude Code.

---

## 15 · CLAUDE CODE USAGE

When converting Claude Design output to Astro:

1. **Scaffold with this theme system applied globally.**
2. **Define all CSS variables in a single `tokens.css` file.**
3. **Define all animations in a `animations.css` file.**
4. **Create reusable components:** `<Header/>`, `<Footer/>`, `<SectionEyebrow/>`, `<PullQuote/>`, `<PrimaryCTA/>`, `<Fleuron/>`, `<AuthorFrame/>`, etc.
5. **Use Astro's islands model:** hydrate only interactive components (Quick Audit, FAQ accordion, ticker). Everything else static.
6. **Performance budget:** LCP < 1.5s, TBT < 200ms, CLS < 0.1, Lighthouse Performance > 95.

---

## 16 · EXAMPLE: HOW TO EXTEND THIS SYSTEM FOR A NEW SECTION

Let's say you're building a new "Regulatory Briefings" blog index section.

1. **Apply `eyebrow`:** "VIII. Briefings."
2. **Apply `section-h2`:** "Briefings on the laws that govern your brand's digital footprint."
3. **Use a grid of `blog-post-card` that inherits `sector-card` pattern:**
   - Container queries for responsive internal layout.
   - Roman numeral prefix.
   - Playfair article title.
   - Inter excerpt with 3-line clamp.
   - "Read brief →" text link with gold hairline underline.
4. **Subtle animation:** cards fade in with stagger on scroll-into-view.
5. **Nothing invented beyond the system.** Every colour, font, motion, and layout rule drawn from sections 01-15 above.

Result: the new section looks like it was built by the same hand as the hero. Every page on the site reads as one cohesive institution.

— End of Theme System —
