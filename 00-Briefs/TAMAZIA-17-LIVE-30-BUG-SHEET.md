# TAMAZIA-17 · Live 30-Bug Sheet — tamazia-website.pages.dev

**Inspection method:** Real browser audit on https://tamazia-website.pages.dev (1280 viewport), runtime DOM/CSS introspection, page-text scan, gap measurement.

**Page metrics at audit time:**
- Total scroll height: **17,620 px**
- Viewport height: 712 px
- Page is **24.75 × viewport** tall (way too long — main reason "wasted space" feels everywhere)
- Section padding-block: 89.6 px top + 89.6 px bottom = **179 px between every section** (excessive)
- 17 "Request audit" CTAs across the page (repetitive)

---

## TOP 30 BUGS · ranked by severity

### CRITICAL · ship-blocking (1-10)

| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| **1** | Sector cards: body text truncated. All 6 cards show only 69-137px of the 185-254px actual text content. | `.card-body { -webkit-line-clamp: 3; overflow: hidden }` in `Sectors.astro` CSS clamps to 3 lines. | Remove `-webkit-line-clamp` and `overflow: hidden` rules. Let body flow naturally. |
| **2** | Top credentials bar reads `MEMBER, CHARTERED INSTITUTE OF ARBITRATORS · MEMBER, AMERICAN BAR ASSOCIATION · LLM, KING'S COLLEGE LONDON`. Aman's directive: REMOVE entirely. | `.credentials-bar` element + `dateline` data array. | Delete the `<div class="credentials-bar">` JSX and its CSS. |
| **3** | Pricing tiers always show all 8-10 features. Each tier card is 2,417 px tall. User wants COLLAPSIBLES. | `.rich-features` ul renders all features unconditionally. | Wrap features 4-onwards in a `<details>` "See all features" collapsible. Show top 3 by default. |
| **4** | Hero H1 reads `I. Outrank competitors. / II. Master regulators. / III. One agency.` — numerals inline with H1 looks odd. Aman wants subtext per line. | `Hero.astro` h1-row template renders numeral + line. No subtext slot. | Replace numerals with small italic subtext under each line: `Outrank competitors.` + subtext "Search dominance, every market." |
| **5** | All sector card CTA buttons (6 cards) and audit form button render in oxblood `rgb(90,26,43)` — Aman says these must be ORANGE. | `.run-btn` and `.card-cta` background tokens point at oxblood. | Add `--accent-orange: #C76E2A` token. Set audit + sector-card CTAs to use it. |
| **6** | Pricing Enterprise tier "text not showing" per Aman — his screenshot only shows top section. Verified: card scrollHeight = 2,415 (full content present) but visually overlong. Same issue as #3. | Same — needs collapsibles. | Apply collapsible fix from #3 to all 3 tiers identically. |
| **7** | Author signature script "Aman Pareek" — Aman says capital A is required. Investigation: data has capital A; cursive Great Vibes font renders A ornately, easy to misread as lowercase. | `Hero.astro` signature uses Great Vibes. | Add a non-cursive label "AMAN PAREEK" in 11px tracked-caps below the cursive script for readability. |
| **8** | Regulation ribbon (right margin, rotated 90°) is only 220 px wide column with 90 framework chips squeezed. Aman: "more prominent and visible, include all laws there". | `.regulation-ribbon` is a vertical sidebar. | Replace with a horizontal, full-width regulation strip below client ribbon. All 45 frameworks visible at once. |
| **9** | Section padding 89.6 px top + 89.6 px bottom = 179 px between every section. User: "lot of wasted space between sections". | `--section-padding-block: clamp(56px, 7vw, 112px)` still too generous. | Reduce to `clamp(40px, 5vw, 80px)` = ~120-160px per section. |
| **10** | 17 CTAs across the page — every section repeats "Request your compliance and SEO audit →". User: "repeated action buttons and misplaced". | One CTA per section + every sector card + every tier + footer + audit form. | Keep CTAs only at: audit form (run audit), Hero (primary), Pricing tier cards (one per tier, differentiated), Contact. Remove from sector cards (replace with subtle "Request →" arrow). |

### HIGH · visible polish (11-20)

| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| **11** | Hero section is 1,646 px — overflows viewport on every desktop size. User CTA below fold. | Stacked elements: top bar + subhead + positioning + fleuron + pull-quote + h1 + author frame + cta + ribbon + ticker. | Compress: drop credentials bar (#2), tighten author frame margin, move ticker to scroll-reveal. Target 900-1000 px. |
| **12** | Cases section 3,180 px tall (3 panels × 88vh each). Heavy on scroll. | Each `.case-panel { min-height: 88vh }`. | Reduce to `min-height: 70vh`. Saves ~600 px. |
| **13** | "Every Sector. One Standard." card overflow same as #1 (90 px shown / 231 px actual). | Same line-clamp. | Same fix as #1. |
| **14** | Sector cards lack unique animations per Aman's directive. Each card just fades in identically. | No per-card animation logic. | Add per-card SVG icon micro-animation on hover (gavel strikes, caduceus serpent slides, bell rings, opening-bell ticker, cloche lifts, compass rotates). |
| **15** | "How Tamazia Works" copy reads as bullet wall, no clear typographic hierarchy. User: "needs to be proper". | `HowWeWork.astro` step cards display teamRoles list as flat bullet list. | Restructure step 2 team list as 5-column grid with role icon + role title + role description. |
| **16** | FAQ "FOUR-WEEK AUDIT STRUCTURE" 4 timeline nodes are static, no hover/expand. User wants nodes to "hover over and show the map". | `.timeline-node` CSS has no hover state with content reveal. | Add hover popover on each node showing the week's tasks (Week I tech audit details, Week II compliance details, etc.). |
| **17** | Pricing tier card text descriptions cluttered: tagline + idealClients + includesAllOfPrior + 8-10 features all stacked. | Vertical stacking. | Tagline + 3 top features visible by default; rest in `<details>` (per #3); idealClients moves to a hover tooltip on the tier name. |
| **18** | Hero compliance paragraph runs as flat sentence: "GDPR, FCA, SRA, MHRA, ASA, HIPAA, EU AI Act…". No emphasis. | No spans wrapping regulator names. | Wrap each regulator (GDPR, FCA, SRA, MHRA, ASA, HIPAA, EU AI Act) in `<span class="regulator-chip">` with caps + tracking + gold underline. |
| **19** | Multiple identical CTA texts: 5× "Request your compliance and SEO audit →" verbatim across page. | Hardcoded label. | Differentiate: hero "Request your audit", sector cards "Audit my [sector] →", pricing "Speak with the founder →". |
| **20** | Pricing card descriptions show as 3-paragraph wall: tier-tagline + tier-ideal-clients + features-heading. | All paragraphs full-width. | Top fold of card: NAME + PRICE + 1-line tagline + 3 top features. Everything else collapsed. |

### MEDIUM · refinement (21-30)

| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| **21** | Hero H1 numerals "I." "II." "III." occupy left margin space with no clear function. | h1-row left column reserved for numeral. | Replace with subtext italic line under each H1 line (per #4). |
| **22** | Verified-client ticker at hero bottom is decorative without function — clients are already in client ribbon above. | Duplicate info. | Remove ticker (it's just `KAMAT · CGON · MERAAS · 200+ LAWS · FOUR CONTINENTS` again). |
| **23** | Pricing intro "Every engagement begins with an SEO and compliance audit. Regulatory compliance review is included as standard across all tiers." renders twice (intro + intro paragraphs). | Both intro string and introParagraphs in data, both rendered. | Use only intro string. |
| **24** | Author frame "corner brackets" position-absolute — visible misalignment when frame resizes. | Brackets without container query. | Switch to CSS `border-image` corner gold-hairline ornaments instead of 4 absolute spans. |
| **25** | Sector card hover-tooltip on regulation chips disabled on touch devices. | Hover-only CSS. | Add tap-toggle: tap once = open, tap again = close. |
| **26** | Insights index hero section says "Sector intelligence for regulated enterprises" — Aman flagged register issue earlier. | Hero copy. | Change to "Insights written against the framework that governs you." |
| **27** | Cases section parallax-bg uses identical radial gradient on all 3 panels — no panel-specific accent. | Single gradient ruleset. | Per-panel parallax: Orchid = warm hospitality bronze, Meraas = oxblood depth, CGON = clinical pearl. |
| **28** | Footer is on light ivory but the rest of page transitions through oxblood. Reads as register break. | Footer background `var(--ivory)` while preceding section is contact (ivory). Acceptable but misses gradient finale. | Apply `--grad-footer` (ivory → oxblood-ink) as final descent. |
| **29** | The "Most popular" gold ribbon on Authority tier rotates slightly off-axis. | Ribbon CSS uses `transform: rotate(-8deg)` but is also `top: -14px` causing partial clip. | Remove rotation, use straight horizontal ribbon centered on tier-card top edge. |
| **30** | Audit form `_redirects` rule inadvertently catches `/insights/<slug>` if slug starts with `home` — extremely unlikely but worth verifying. Currently no insights post starts with "home". | `_redirects` priority order. | Move `/home → /` to last entry (lowest priority). |

---

## EXECUTION ORDER

**Round 1 · Critical (B1-B10)** — bug-fix all together in one pass, test, deploy.
**Round 2 · High polish (B11-B20)** — second pass, test, deploy.
**Round 3 · Refinement (B21-B30)** — final pass, test, deploy.

Three deploys total. Each is ~2-5 minutes via Wrangler. Each preceded by a build + integrity check.

---

## DEFERRED FROM TAMAZIA-16 (still relevant, lower priority)

- B-30: Why-Us rolling counter scroll animation
- B-48: Case Studies side-rail I/II/III scroll progress indicator
- B-50: Pricing tier comparison toggle
- B-51: Contact form inline success state
- B-53: Footer newsletter input wiring
- B-55: Cookie consent strip
- B-58 to B-65: Persona-specific asks (DPDP Act explicit, Family Office sub-sector, etc.)

These remain on the backlog. Will tackle after the Top-30 round.

---

**Beginning Round 1 fixes now.**
