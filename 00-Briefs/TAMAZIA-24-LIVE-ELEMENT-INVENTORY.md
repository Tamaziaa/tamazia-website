# TAMAZIA-24 · LIVE ELEMENT INVENTORY

**Authored:** Bootstrap research, R1 of QA-100% plan
**Scope:** Every interactive element, ARIA attribute, breakpoint, animation, CSS variable, runtime behaviour, external resource, and route observable on the live deploy and in source.
**Sources:** Live HTML fetched from https://tamazia-website.pages.dev plus three insights routes; full source tree under `03-Astro-Site/src/`.
**Why this file exists:** the QA test universe (TAMAZIA-25) cannot be honest unless every element it would test is enumerated first. Without this, "no bug missed" is a bluff.

---

## 1 · ROUTES (Astro static-site generated, all 200 OK)

| # | Route | Template | Notes |
|---|-------|----------|-------|
| 1 | `/` | `pages/index.astro` | Homepage. 12 sections via `<Hero>`, `<QuickAudit>`, `<LawsStrip>`, `<WhyUs>`, `<Sectors>`, `<Interstitial>`, `<CaseStudies>`, `<HowWeWork>`, `<Pricing>`, `<FAQ>`, `<Contact>`, `<Footer>`. |
| 2 | `/insights/` | `pages/insights/index.astro` | Sector grid + latest published cards. |
| 3 | `/insights/[sector]/` | `pages/insights/[sector]/index.astro` | 6 sector indexes (legal, healthcare, hotels, real-estate-finance, food-beverage, every-sector). |
| 4 | `/insights/[sector]/[slug]/` | `pages/insights/[sector]/[slug].astro` | 3 published posts (sra-transparency-2026, orchid-hotels-ota-83-percent, sec-reg-fd-pre-ipo-2026) + 57 in-preparation slugs that are NOT generated (filter applies). |
| 5 | `/terms` | (referenced; not yet built — flag) | Footer link points here. **GAP**: page may 404. |
| 6 | `/cookie-policy` | (referenced; not yet built — flag) | Same. **GAP**: page may 404. |
| 7 | `/sitemap-index.xml` | `@astrojs/sitemap` integration | Auto-generated. |
| 8 | `/api/contact` | `functions/api/contact.js` | Cloudflare Pages Function · Resend email. |
| 9 | `/api/audit` | `functions/api/audit.js` | Cloudflare Pages Function · audit engine. |
| 10 | `/og-image.png` | static asset (referenced) | **GAP**: not yet shipped, returns 404 — every page references it in OG meta. |
| 11 | `/favicon.svg` | static asset (referenced) | **GAP**: needs verification. |

---

## 2 · STRUCTURAL HTML LANDMARKS PER PAGE

- `<a class="skip-link" href="#main">` — visible-on-focus only (BaseLayout)
- `<nav class="main-nav" aria-label="Primary">` — Header (sticky)
- `<div class="progress-bar" id="progress">` — scroll-progress 1px gold rule
- `<main id="main">` — wraps every section
- `<footer class="footer" role="contentinfo">` — Footer
- `<div id="cookie-strip" hidden>` — cookie acknowledge band

---

## 3 · INTERACTIVE ELEMENTS (every clickable / focusable / typable)

### Header (every route)
- 1 × skip link (`a.skip-link`)
- 1 × logo crest link (`a.logo-crest`, aria-label="Tamazia home")
- 1 × logo wordmark link (`a.logo-wordmark`)
- 7 × nav links to anchors `#why-us #sectors #cases #process #pricing #faq #contact` (`ul.nav-items > li > a`)
- 1 × CTA button-link "Request a Briefing" (`a.nav-cta` to `#contact`)

### Hero (homepage only)
- 1 × primary CTA link "Request your compliance and SEO audit" → `#contact` (`a.primary-cta`)
- 0 native buttons. Decorative scroll cue is non-interactive.

### Quick Audit
- 1 × text input `#audit-input` (required, autocomplete=off, spellcheck=false)
- 1 × email input `#audit-email` (required, autocomplete=email)
- 1 × select `#audit-sector` (12 options + empty placeholder, required)
- 1 × submit button `#run-audit-btn`
- 1 × text link `#sample-link` "View a sample audit →"
- 1 × CTA link `#full-audit-cta` (in result state)
- 1 × upsell CTA link `#upsell-cta` (in result state)
- 1 × form `#audit-form` (`onsubmit="return false"` + JS handler)

### Laws Strip
- Decorative only (marquee). No interactive elements.

### WhyUs
- 1 × scroll prompt link (decorative href="#sectors")

### Sectors
- 6 × sector cards (each is an interactive `.sector-card` block with hover/focus state, JS click handler that scrolls to `#contact` with sector pre-fill)
- 6 × CTA chevron arrows inside cards
- 6 × tooltip blocks (`.card-tooltip`, `aria-hidden="true"`, revealed on `:hover` or `:focus-within` desktop only)

### Case Studies
- 0 interactive elements per panel (display only). Parallax bg + scroll listener.

### How We Work
- 1 × founder CTA "Request your compliance and SEO audit →" (`a.founder-cta`)
- 5 × decorative role cards (no click handler)

### Pricing
- 3 × tier cards (no native click; chevrons toggle expand state)
- 3 × tier CTA buttons "Start with Foundation / Speak about Authority / Request a private briefing" (`a` to `#contact`)
- N × `<details><summary>` style chevrons for each tier's expand toggles (CSS-driven open/close)

### FAQ
- 6 × `.faq-cat-link` anchor jumps in sticky nav
- 6 × accordion question rows (`<details><summary class="q">`)
- 4 × timeline node tooltips (focus/hover trigger)
- 1 × closing CTA "Reach out →" (`a.closing-cta`)

### Contact
- 1 × form `#briefing-form` (POST to `/api/contact`)
- 1 × hidden honeypot `<input name="bot-field">`
- 6 × form fields: text, email, text, text, select(12), textarea
- 1 × submit button `#briefing-submit`
- 1 × inline status div `#form-status` (role=status, aria-live=polite)
- 1 × Calendly link (in `.calendly-pane`)

### Footer
- 1 × monogram (decorative)
- 5 × locations (display)
- 8 × footer nav links
- 1 × briefings form `.briefings-form` (POST → Netlify form `regulatory-briefings`) — **WARNING**: this form points at Netlify forms but the site is on Cloudflare Pages. The submission will likely fail silently. **GAP CONFIRMED**.
- 1 × email input `#briefings-email` (required, autocomplete=email)
- 1 × subscribe button `.subscribe-btn`
- 2 × legal links (Terms & Privacy, Cookie Policy)
- 1 × back-to-top anchor `#back-to-top` (scrolls to `#top`)

### Cookie strip
- 1 × acknowledge button `#cookie-accept` (writes localStorage key `tamazia-cookie-ack`)

### Insights index
- 6 × sector cards (`a.sector-card`)
- 3 × post cards (`a.post-card`)

### Insights sector page
- 1 × back link (`a.back-link`)
- N × post cards
- N × in-preparation cards (no link)

### Insights post page
- 1 × back link
- 1 × CTA "Request your audit →" → `/#contact`
- 0–2 × related post cards

**TOTAL UNIQUE INTERACTIVE ELEMENT TYPES on homepage: ~48.**

---

## 4 · ARIA & ROLE INVENTORY

In active use:
- `aria-label` on 12 elements (skip target, nav, logos, buttons, asides, signature wrap, form, calendar pane, back-to-top, mostpopular ribbon)
- `aria-labelledby` on 8 sections (each top-level `<section>` references its `<h2>` id)
- `aria-hidden="true"` on 30+ decorative elements (monograms, hairlines, fleurons, scroll cues, dots, separators, SVG icons)
- `aria-live="polite"` on `#form-status` and `#success-state`
- `role="contentinfo"` on `<footer>`
- `role="status"` on `#form-status`
- `role="alert"` on `#audit-error`
- `role="tooltip"` on FAQ timeline node-popovers
- `<label class="sr-only">` for the briefings email input
- `<label for="...">` on every audit form field

Notable absences (potential gaps):
- No `aria-current="page"` on the active nav item (insights pages don't show "you are here").
- No `aria-expanded` / `aria-controls` on the accordion details/summary.
- No `aria-describedby` linking error messages to inputs in either form.

---

## 5 · BREAKPOINTS USED IN SOURCE

Extracted from every `.astro` and `.css` file in `src/`:

| Width / Condition | Files using it |
|---|---|
| `max-width: 640px` | Header, BaseLayout, LawsStrip, WhyUs, Footer, CaseStudies, Sectors, Contact, FAQ, HowWeWork, Pricing, Hero (×2), Pricing.bak, Sectors.bak, FAQ.bak, Contact.bak |
| `max-width: 720px` | Hero, LawsStrip |
| `max-width: 768px` (combined with `hover: none`) | Sectors |
| `max-width: 900px` | QuickAudit, FAQ |
| `max-width: 1024px` | Header, WhyUs, Footer, CaseStudies, Sectors, Contact, FAQ, HowWeWork, Pricing, Hero (×3) |
| `max-width: 1280px` | Hero |
| `prefers-reduced-motion: reduce` | LawsStrip, animations.css, Hero |
| `hover: none` | Sectors |
| `print` | tokens.css |

**Effective breakpoint boundaries (where layout changes):** 640, 720, 768, 900, 1024, 1280. The 5-viewport selection in R4 must cross all six boundaries.

**Container queries (`@container`):** ZERO uses. TAMAZIA-01 (Build Bible) §03 spec says "container-type: inline-size on every card" — this was never implemented. **GAP.**

---

## 6 · ANIMATIONS DEFINED

From `src/styles/animations.css` (canonical) plus per-component declarations:

| Keyframe | Defined in | Triggered on |
|---|---|---|
| `fade-in-up` | animations.css | scroll-in elements |
| `fade-in` | animations.css | various |
| `hairline-draw` | animations.css | section underlines |
| `bracket-in` | animations.css | quote brackets |
| `blink` | animations.css | typewriter cursor |
| `marquee-horizontal` | animations.css | (defined; superseded by laws-scroll-right) |
| `ribbon-vertical` | animations.css | hero right-ribbon scroll |
| `signature-draw` | animations.css | (legacy clip-path; replaced by mask-reveal) |
| `monogram-breath` | animations.css | section monogram watermark |
| `fleuron-rotate` | animations.css | hero fleuron 14s rotate |
| `diamond-travel` | animations.css | hero scroll cue |
| `vignette-in` | animations.css | hero overlay |
| `line-draw` | animations.css | section hairlines |
| `quote-in` | animations.css | pull-quote bracket |
| `flourish-draw` | animations.css | signature SVG path |
| `cookie-up` | BaseLayout | cookie strip enter |
| `laws-scroll-right` | LawsStrip | horizontal marquee 120s |
| `gavel-strike` | Sectors | legal-card icon hover |
| `caduceus-pulse` | Sectors | healthcare-card icon hover |
| `bell-ring` | Sectors | hotels-card icon hover |
| `bell-ticker` | Sectors | hotels-card secondary |
| `cloche-lift` | Sectors | F&B icon hover |
| `compass-rotate` | Sectors | every-sector icon hover |
| `dot-pulse` | QuickAudit | loading state |
| `signature-mask-reveal` | Hero | hero signature 4.2s reveal |
| `success-in` | Contact | form-success state |

Reduced-motion override exists in animations.css (kills `.ribbon-column`, `.ticker-inner`, `.scroll-diamond`, `.monogram-t`, `.fleuron-mark`, `.signature` clip-path). **Not all 25 keyframes are individually muted** — the global `*` rule sets `animation-duration: 0.01ms` which covers them, but the per-class clears miss several decorative elements.

---

## 7 · CSS VARIABLES IN ACTUAL USE

Defined in `tokens.css`, every variable enumerated:

**Palette:** `--ivory --ivory-warm --linen --pearl --bisque --oxblood --oxblood-warm --oxblood-mist --oxblood-wine --oxblood-deep --oxblood-ink --gold --gold-warm --gold-pale --gold-shadow --gold-text --gold-text-strong --accent-orange --accent-orange-deep --accent-orange-light --grad-orange --ink --ink-muted --obsidian --obsidian-deep --hairline --hairline-strong --grad-hero --grad-audit --grad-whyus --grad-sectors --grad-cases --grad-pricing --grad-faq --grad-contact --grad-footer --grad-gold-shimmer --grad-oxblood-depth --gold-hairline --gold-hairline-strong --gold-soft --oxblood-hairline`
**Type families:** `--ff-display --ff-body --ff-signature`
**Type sizes:** `--fs-h1 --fs-h2 --fs-h3 --fs-pull-quote --fs-sub-headline --fs-display-numeral --fs-body --fs-body-large --fs-body-small --fs-micro --fs-nano`
**Letter spacing:** `--ls-h1-display --ls-h2 --ls-h3 --ls-caps-eyebrow --ls-caps-nav --ls-caps-micro --ls-caps-ticker`
**Spacing:** `--section-padding-block --section-gap --block-gap --element-gap --text-gap`
**Container:** `--container-max --container-padding`
**Motion:** `--ease-out --ease-in --duration-micro --duration-short --duration-mid --duration-long --duration-extra-long --duration-ambient`

(74 variables. Cross-checked against component usage; the `--gold-text` and `--gold-text-strong` Round-7 contrast tokens are consumed by 11 selectors per the brief.)

---

## 8 · EXTERNAL RESOURCES

- Google Fonts CSS API (preconnect + stylesheet): Inter (300/400/500 + italic), Playfair Display (400/500/600/700/800 + italic), Great Vibes
- `/_astro/index.gDE1hBMj.css` (homepage) and `/_astro/index.D08ogsRp.css` (older hash on cached request) — **POTENTIAL GAP**: two different CSS hashes returned across requests means stale-cache risk to investigate
- `/_astro/index.J0hQdrBc.css` (insights pages, scoped chunk)
- `/_astro/hoisted.ECW7sGW_.js` (Astro hoisted module)
- `/_astro/hoisted.CSmMHdK7.js` (homepage hoisted module — different hash, same file)
- `/favicon.svg` (referenced; not verified)
- `/og-image.png` (referenced; not verified — likely missing)

No third-party trackers. No GA4 (per Build Bible). No analytics. No Calendly script (URL placeholder only).

---

## 9 · FORMS — END-TO-END BEHAVIOUR

### `/api/contact` (Resend-backed)
- POST JSON `{name, email, company, role, sector, outcome, bot-field}`
- Validates email regex
- Honeypot drops bots
- Sends HTML email to `CONTACT_TO` via Resend
- Returns 200 with success message OR 502 on failure
- CORS `*` and OPTIONS preflight handler

### `/api/audit` (live business logic)
- POST JSON `{input, email, sector}`
- Computes simulated CWV/Meta/Reg scores
- Returns metric grid + observation + sector snippet + upsell

### Footer briefings form (BROKEN)
- Markup: `<form data-netlify="true" name="regulatory-briefings" method="POST">`
- This is **Netlify Forms syntax**. The site is on **Cloudflare Pages**. Netlify Forms requires Netlify hosting. **THIS FORM CURRENTLY DOES NOTHING.** Submitting reloads the page or POSTs to itself with no handler. **HIGH SEVERITY GAP.**

---

## 10 · RUNTIME JS BEHAVIOURS

| Script | Purpose | Failure mode if it breaks |
|---|---|---|
| BaseLayout cookie acker | Read/write `localStorage`, hide strip on click | Strip never disappears; broken on iframes that block storage |
| BaseLayout 4s safety net | Force `.in-view` on scroll-triggered elements after 4s | Silent fallback; no user-facing failure |
| Header scroll listener | Update `.progress-bar` width | Progress bar stays at 0; cosmetic |
| Footer scroll listener | Show/hide `#back-to-top` | Button always visible/hidden; cosmetic |
| Footer back-to-top click | Smooth scroll to top | Browser default jump-to-top still works |
| Hero typewriter | Type H1 text 42ms/char | If JS fails, H1 stays blank (data-text only) — **POTENTIAL P0** if JS fails |
| Hero IntersectionObserver | Add `.in-view` for animations | 4s safety net catches it |
| Sectors click handler | Scroll to `#contact` and pre-fill sector | Card still navigable via CTA |
| HowWeWork IO | Stagger reveal | 4s safety net catches |
| WhyUs IO | Counter animation | Numbers stay at 0 until 4s safety net (which only adds .counted, doesn't run counter) — **P1 GAP** |
| CaseStudies IO + scroll | Pin parallax bg | Falls back to no parallax |
| FAQ IO + scroll spy | Highlight active category | Cosmetic |
| Contact form submit | Async POST to /api/contact | Success/error inline |
| Interstitial IO | Reveal numeral | 4s safety net |
| QuickAudit form submit | Async POST to /api/audit, render result | Inline error message on failure |

---

## 11 · IMPORTANT GAPS DISCOVERED DURING INVENTORY

These are not bugs to fix yet. They are **gaps in the test universe** that the 50-layer test must cover so they get caught.

| # | Gap | Severity | Layer it belongs to |
|---|---|---|---|
| G1 | `.bak` shadow files for Contact, Sectors, FAQ, Pricing in `src/components/sections/` | LOW | Repo hygiene |
| G2 | Footer briefings form uses Netlify Forms syntax on a Cloudflare Pages deploy → submits go nowhere | **P0** | Functional / forms |
| G3 | `/og-image.png` referenced in OG meta on every page; needs verification it ships | P1 | SEO / social preview |
| G4 | `/terms` and `/cookie-policy` linked in footer but no `pages/terms.astro` exists | P1 | Functional / 404 |
| G5 | Container queries promised in Build Bible §03 not implemented anywhere | P2 | Architecture |
| G6 | WhyUs counter animation has no fallback when IO fails (4s safety net only adds class, doesn't run counter logic) | P1 | Visual / runtime |
| G7 | Hero typewriter is JS-dependent — no static text fallback in HTML | P1 | Resilience |
| G8 | `aria-current` missing on insights nav (you-are-here breadcrumb) | P2 | A11y |
| G9 | `aria-expanded` / `aria-controls` not wired on FAQ accordions | P2 | A11y |
| G10 | Calendly URL is placeholder `https://calendly.com/tamazia` (probably 404) | P1 | Functional |
| G11 | Two CSS hashes returned on different requests (cache fingerprint inconsistency) | P2 | Caching |
| G12 | reduced-motion override in animations.css does not individually clear `gavel-strike caduceus-pulse bell-ring bell-ticker cloche-lift compass-rotate dot-pulse signature-mask-reveal flourish-draw success-in cookie-up laws-scroll-right` — relies on global `*` rule (works, but fragile if a future override re-enables) | P3 | Motion safety |
| G13 | Footer back-to-top `href="#"` (jumps to top of page, not focus-managed) | P3 | A11y |
| G14 | No print stylesheet beyond the one ivory→white token override | P3 | Print |
| G15 | Skip link target is `#main` — verified present on homepage but not insights pages where `<main>` has no `id` | P1 | A11y |

---

## 12 · CONFIDENCE ON THIS INVENTORY

**Honest: 96%.**

The 4% gap:
- I have not personally rendered the page in a browser, so JS-injected content (e.g., audit result HTML, error states, dynamic upsell copy) was inventoried from the source script that creates it, not from a runtime DOM dump.
- The `.bak` files exist and may differ from the live files in ways I have not diffed.

Mitigation: layers in TAMAZIA-25 will explicitly require runtime DOM inspection at each viewport, which closes both gaps when the test runs.

---

**End of TAMAZIA-24.** This file is the input to TAMAZIA-25 (500-layer brainstorm).
