# TAMAZIA · MASTER EXECUTION ROADMAP
**The single plan that governs the whole rebuild.**
**Read this first. Return to this document at every decision point.**
**Date: 24 April 2026.**

---

## 00 · EXECUTIVE SUMMARY

We are rebuilding **tamazia.in** from WordPress + Elementor (hosted on Bigrock) to **Astro + GSAP + Netlify** with GitHub version control, while preserving all copy verbatim, keeping email continuity, and executing sub-2-second loads.

Architecture principle: **content-driven components.** Every piece of copy lives in structured data files. Components read from data. One YAML line edit changes the live site. No section ever has to be rebuilt for small changes. This is the "sniper edits" capability you asked for.

Total build time: **6 to 8 focused working days** from scaffold to live DNS cutover. Total cost: **zero** at launch (all free-tier services).

Overall confidence: **92%** end-to-end success. Primary risk: SEO rankings dipping 30-60 days post-cutover. Mitigated by 301 redirects and 30-day Bigrock failsafe.

---

## 01 · CONFIRMED UNDERSTANDING (recap so nothing is ambiguous)

### Current state of tamazia.in
- WordPress 6.9.4 + Hello Elementor parent theme + Hello Elementor child theme.
- Elementor Pro 4.0.1 as builder. Elementor Pro Motion Effects is the failed parallax source.
- Jetpack (images served via `i0.wp.com` CDN), Complianz GDPR, Pojo Accessibility, Rank Math SEO.
- Hosting: Bigrock shared Apache, India origin.
- 382 KB HTML, 60 stylesheets, 43 script tags (unfixable inside Elementor).
- 16 top-level sections in current markup, 11 with content.
- 26 unique images.
- Zero blog posts currently live.
- Full copy extracted and preserved verbatim (stored in `TAMAZIA-01-BUILD-BIBLE.md`).
- UpdraftPlus backup: 5 April 2026, on Google Drive (`personage418@gmail.com`).

### Target new state
- Astro static site, TypeScript, component-based.
- GSAP ScrollTrigger for all parallax and scroll-driven animation.
- Tailwind-style design tokens in CSS custom properties.
- Netlify hosting, global CDN, auto HTTPS.
- Netlify Edge Functions for the Quick Audit backend.
- Netlify Forms for contact.
- GitHub repository for version control.
- Domain remains at Bigrock (registrar only), DNS points to Netlify.
- Email MX records untouched.

### Clientele (verified)
Top 100 target clients across 7 sectors: Magic Circle law firms, luxury hotel groups, healthcare providers, listed/pre-IPO companies, real estate developers, private banks, fine dining. Full list in `TAMAZIA-03-CLIENT-TARGETS.md`.

### Theme (locked)
Institutional luxury editorial with Swiss-watchmaker precision. Ivory ground, ink primary text, oxblood italic emphasis, gold hairlines and ornaments. Playfair Display + Inter + Great Vibes (signature only). Full system in `TAMAZIA-10-THEME-SYSTEM.md`.

### Hero prototype (approved)
Live HTML preview at `tamazia-hero-preview.html`. Burgundy crest logo, italic oxblood emphasis H1, Roman numeral prefixes, gold hairline underline draws, framed author credential card below H1, "Vetted by Aman Pareek" signature, regulation ribbon with 45 frameworks, verified-client ticker. All approved.

---

## 02 · TEN-PERSPECTIVE AUDIT

Audit the upcoming build from ten different viewpoints before writing a line of code.

### Perspective 1 · The Managing Partner at Clifford Chance
Tests: would this site read as peer-grade or vendor-grade in three seconds? Would the partner forward this link to their internal Comms team without apology? Does the founder credential matter to them? Answer: yes, yes, yes. Site passes this audience if aesthetic and language register are held strictly.

### Perspective 2 · The SEO practitioner
Tests: do we preserve current ranking signals? Critical elements: `<title>`, meta description, canonical, structured data (JSON-LD for Organization, ProfessionalService, WebPage), `<h1>` hierarchy, internal linking, `sitemap.xml`, `robots.txt`, `hreflang` (future). 301 redirects from every old URL to the new equivalent. Rank Math currently owns this — we replace with Astro's built-in SEO tooling and hand-crafted schema.

### Perspective 3 · The accessibility auditor (WCAG 2.1 AA)
Tests: colour contrast ≥ 4.5:1 for body, 3:1 for large text. Focus states visible. Semantic HTML. Alt text on every image. `prefers-reduced-motion` fully respected. Keyboard navigable. Screen reader tested via VoiceOver, NVDA, TalkBack. The theme system specifies this but we must verify every component.

### Perspective 4 · The performance engineer
Tests: LCP < 1.5s, TBT < 200ms, CLS < 0.1, FCP < 1.0s, INP < 200ms, Lighthouse Performance > 95. Architectural path: Astro zero-JS by default, GSAP loaded only where needed via islands, WebP/AVIF images with explicit dimensions, Netlify Image CDN, no external tracking at launch.

### Perspective 5 · The long-term maintainer (you)
Tests: can you change a headline in 30 seconds? A colour token globally? Add a new blog post? Add a new sector card? Yes to all, because of the content-driven architecture described in Section 05.

### Perspective 6 · The security and privacy engineer
Tests: no MX records touched. HTTPS enforced. Forms server-side validated. Rate-limited audit engine. No tracking cookies without consent. GDPR-compliant cookie banner. DNS cutover with zero downtime via TTL lowering. Email continuity verified.

### Perspective 7 · The brand custodian
Tests: every section feels like one designer built it. Same typography. Same spacing rhythm. Same motion vocabulary. Same restraint. Theme system enforced at the component level — no drift possible because components read tokens.

### Perspective 8 · The content author (you)
Tests: is every word of current tamazia.in preserved verbatim? Is the regulation framework list accurate and current? Are all three verified case studies represented precisely? Verbatim copy is already extracted in Build Bible and locked.

### Perspective 9 · The migration risk officer
Tests: what happens if we break email? What happens if SEO rankings drop? What happens if DNS cutover fails? Mitigated by: never touching MX records, 30-day Bigrock hosting failsafe, 301 redirects for every legacy URL, staging site approved before cutover, 24-hour DNS TTL reduction before change.

### Perspective 10 · The future scalability architect
Tests: can we add a blog with 50 posts without rebuilding? Can we internationalise (UAE Arabic, Europe French)? Can we add sector detail pages? Can we add case study detail pages? All yes because Astro's content collections pattern supports this natively. Blog is MDX files in a folder. Pages are dynamic routes. Internationalisation is a plugin.

---

## 03 · FIVE COMPREHENSIVE AUDITS

### Audit 1 · CONTENT

Exactly what copy and assets move from old to new.

**Copy to preserve verbatim** (from extraction in Build Bible):
- Hero pre-headline, H1, sub-headline, paragraph, pull quote, trusted-by strip, CTA.
- Why Us section: H2, 2 paragraphs, 3 statistic captions, partner credentials.
- Sectors section: 6 sector descriptions (each ~100 words), regulatory shorthand, per-sector CTA.
- Case Studies section: 3 verified case panels, closing pull quote.
- How Tamazia Works: paragraph, 5 team roles, founder signoff.
- Pricing: 3 tiers with descriptions, Enterprise mandate callout.
- FAQ: long-form content across 4-week audit process, sector specifics, individual client details.
- Contact: form labels, success message.
- Footer: location strip, memberships, legal links.

**Copy to add** (approved during this work):
- Regulation ribbon list of 45 frameworks.
- Verified ticker continuous strip.
- Eyebrow "The Brief · 2026" and Roman numeral section labels.
- Framed author card: "IV. The Practice" + "Led by a founder. Run to a standard."
- Signature block: "Vetted by Aman Pareek."
- Section eyebrows I. through VII.
- Newsletter footer column: "Regulatory Briefings" text.

**Assets to migrate:**
- 26 images from `/wp-content/uploads/` (I download these via HTTP when ready).
- Tamazia crest logo (provided by Aman as PNG).
- Founder portrait (optional, to be provided if we use it in the About card).

**Assets to create new:**
- 6 × 3D sector card illustrations (via Claude Design batch generation, or Spline).
- 1 × Hero 3D centrepiece (if we want one — current hero uses typography only).
- Open Graph image for social sharing (1200×630).
- Favicon set (256/180/64/32/16).

### Audit 2 · TECHNICAL

Complete technical stack.

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Astro 4.x | Static-first, component-based, markdown support, zero JS by default |
| Styling | CSS custom properties + lightweight layer (no Tailwind) | Full control, smaller bundle, matches brand specificity |
| Motion | GSAP 3.x + ScrollTrigger plugin | Safari-safe parallax, industry standard, accessible |
| Content | Astro content collections (YAML/MDX) | Sniper edits, type-safe, git-tracked |
| Fonts | Google Fonts (self-hosted via `astro-fonts-next` plugin) | Performance, no third-party requests |
| Forms | Netlify Forms | Free tier, zero backend to maintain |
| Backend functions | Netlify Edge Functions | Quick Audit Engine, low latency |
| Hosting | Netlify | Global CDN, auto SSL, preview deploys |
| DNS | Bigrock (registrar) → Netlify (A + CNAME) | Keep existing registrar, change pointing only |
| Version control | GitHub | Standard, integrates with Netlify, per-commit deploys |
| Analytics | GA4 + Netlify Analytics | Existing infrastructure, privacy-compliant |
| Accessibility | axe-core dev tool + manual QA | WCAG 2.1 AA enforcement |

**Dependencies to install:**
```
astro
@astrojs/mdx
@astrojs/sitemap
@astrojs/netlify
gsap
@tailwindcss/typography (optional for blog)
```

**Node version:** 20.x LTS. Handled by Netlify build image.

### Audit 3 · DESIGN

Theme compliance check. Every component must inherit from tokens. Every section must follow the 15-ideas-per-section brainstorm pattern (already done in Build Bible and hero preview).

**Unresolved design questions:**
- 3D sector card illustrations: Claude Design batch vs. Spline vs. hybrid. Decision needed before Section 05 Sectors builds.
- Hero 3D centrepiece: keep typography-only (current) or add a sculptural anchor? Current preview is typography-only and works. My vote: keep as is, save the "3D moment" for the sector cards.
- Founder portrait on How We Work section: yes or no? Requires one editorial-grade photograph.

### Audit 4 · MIGRATION

Risk-ranked migration concerns.

| Risk | Likelihood | Severity | Mitigation |
|------|------------|----------|------------|
| Email breaks during DNS cutover | Low | High | Screenshot MX records, never touch them |
| SEO ranking dip 30-60 days | Moderate | Medium | 301 redirects, sitemap resubmit, 30-day Bigrock failsafe |
| Contact form breaks | Low | Medium | Test on staging before cutover |
| Calendly embed breaks | Very low | Low | Same script tag, works everywhere |
| UpdraftPlus backup corrupted | Very low | Critical | Verify backup opens before touching production |
| User accidentally deletes current Bigrock site | Very low | Critical | Do not delete Bigrock during migration window |
| Regulation list becomes outdated | Moderate | Low | Make regulations a content file, review quarterly |
| GSAP license issue | Zero | None | GSAP is free for personal and single-domain use |
| Netlify free tier exceeded | Low | Low | Upgrade at $19/month if needed |

### Audit 5 · POST-LAUNCH

What to monitor after DNS cutover.

- Netlify Analytics: daily visits, top pages, bounce rate.
- Google Search Console: indexing rate, crawl errors, new sitemap submission.
- GA4: user behaviour, form submission rate, Quick Audit runs, audit-to-contact conversion.
- Uptime monitoring (Netlify has this built in, plus optional UptimeRobot free tier).
- Keep Bigrock hosting paid for 30 days as rollback insurance.
- Monitor for SEO ranking drops daily for first 14 days.
- Manual QA sweep at 7 days and 30 days to catch regressions.
- Collect any client feedback through inbound channels.

---

## 04 · SNIPER-EDITS ARCHITECTURE

This is the single most important architectural decision. Every edit later in the project's life should take 30 seconds, not rebuilding a section.

### The pattern: content-driven components

**Every section has three files:**
1. `src/content/[section].yaml` — all copy lives here.
2. `src/components/sections/[Section].astro` — pure presentation, reads from content.
3. `src/styles/sections/[section].css` — scoped styles (or reuses global tokens).

**Example: Hero**

`src/content/hero.yaml`:
```yaml
dateline:
  - "LONDON"
  - "DUBAI"
  - "NEW YORK"
  - "PARIS"
  - "MEMBER, CHARTERED INSTITUTE OF ARBITRATORS"
  - "MEMBER, AMERICAN BAR ASSOCIATION"

eyebrow: "The Brief · 2026"

subHeadline: "Your SEO agency doesn't have a {{lawyer}}. Ours is run by {{one}}."

pullQuote: "Ranking is only valuable if it is {{legal}}."

h1:
  - numeral: "I."
    text: "Outrank {{competitors.}}"
    marginNote: "Verified · 2024"
  - numeral: "II."
    text: "Master {{regulators.}}"
    marginNote: "200+ Frameworks"
  - numeral: "III."
    text: "{{One}} agency."
    marginNote: "Four Continents"

authorFrame:
  numeral: "IV."
  label: "The Practice"
  title: "Led by a founder. Run to a standard."
  body: "An {{LLM in International Business Law}}, King's College London, at the head of a team of regulatory analysts, AI search engineers, and legal content strategists {{working to a standard regulated enterprises cannot source elsewhere}}."
  credentials:
    - "KING'S COLLEGE LONDON"
    - "CHARTERED INSTITUTE OF ARBITRATORS"
    - "AMERICAN BAR ASSOCIATION"

cta: "Request your compliance and SEO audit"

signature:
  vettedBy: "Vetted by"
  name: "Aman Pareek"
  caption:
    - "Founder"
    - "LLM, King's College London"
```

To change "Verified · 2024" to "Verified · 2025": edit one line in `hero.yaml`, Netlify auto-rebuilds (or I rebuild in sandbox, push, done). 30 seconds.

To change the H1 line from "Outrank competitors" to "Outperform competitors": edit one word. 30 seconds.

To change the gold colour site-wide: edit one variable in `tokens.css`. 30 seconds.

### Architectural rules

1. **No copy in components.** If a component has hardcoded text, refactor to pull from content.
2. **No design values in components.** Every colour, spacing, size reads from a CSS variable.
3. **No duplicated components.** If two sections share a pattern, extract it to `components/ui/`.
4. **Content is the source of truth.** Even Roman numerals are pulled from content files so they can be renumbered.
5. **Every section's content file has a TypeScript schema.** Astro content collections give us type-safety. If a YAML key is missing, the build fails loudly.

### What "sniper edits" lets you do

- Change a headline word: 30 seconds.
- Add a new testimonial: 1 minute (edit one YAML file).
- Change the primary colour: 30 seconds.
- Swap the featured case study: 1 minute.
- Add a new sector card: 5 minutes (add one entry to `sectors.yaml`).
- Add a blog post: 5 minutes (create one MDX file).
- Add a new page (e.g. Sector detail): 1 hour (scaffold new Astro page).

The only things that take longer than 5 minutes to change: adding a completely new section type (e.g. a comparison table we've never designed), changing the overall navigation structure, migrating to a different framework.

---

## 05 · COWORK PROJECT SETUP

You asked "can we create a project in Cowork to save context?" Yes. Here's how.

### Current state
- No folder selected. All work lives in a session-scoped `outputs/` folder that does not persist across sessions.

### Target state
- A persistent folder on your computer where the entire Tamazia project lives.
- All documents, the Astro project, the screenshots, the logo, everything in one place.
- Accessible across any future Cowork session.

### Setup step
I request access to a folder on your computer via the `request_cowork_directory` tool. You click through a dialog to approve. Recommendation: create a new folder named `Tamazia-Rebuild` somewhere easy (Documents, Desktop, or your Google Drive folder if it syncs).

### Folder structure that will live there

```
Tamazia-Rebuild/
├── 00-Briefs/
│   ├── TAMAZIA-00-README.md
│   ├── TAMAZIA-01-BUILD-BIBLE.md
│   ├── TAMAZIA-02-AESTHETIC-REFERENCES.md
│   ├── TAMAZIA-03-CLIENT-TARGETS.md
│   ├── TAMAZIA-04-ELEMENTS-LIBRARY.md
│   ├── TAMAZIA-05-AUDIT-ENGINE.md
│   ├── TAMAZIA-06-CLAUDE-DESIGN-PROMPTS.md
│   ├── TAMAZIA-07-QA-REPORT.md
│   ├── TAMAZIA-08-HERO-AND-CARDS-DEEP.md
│   ├── TAMAZIA-09-HERO-ALTERNATIVES-AND-CARDS-v2.md
│   ├── TAMAZIA-10-THEME-SYSTEM.md
│   └── TAMAZIA-11-MASTER-EXECUTION-ROADMAP.md
├── 01-Screenshots/
│   └── [17 reference screenshots]
├── 02-Assets/
│   ├── logo/
│   ├── images/
│   └── fonts/
├── 03-Astro-Site/               ← the actual site code
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── astro.config.mjs
├── 04-Preview-Builds/            ← static HTML builds for visual verification
│   └── dist/
├── 05-Deployment/
│   ├── netlify.toml
│   └── deployment-notes.md
└── 06-Post-Launch/
    └── monitoring-checklist.md
```

Once the folder is connected, I can read and write to it directly. Every future Cowork session reads this folder and has the full context immediately.

---

## 06 · PHASE-BY-PHASE ROADMAP

Seven phases. Each phase has acceptance criteria and a checklist.

### PHASE 0 · PROJECT SETUP (30-60 minutes)

**Goal:** establish persistent workspace, confirm all context, set up Netlify and GitHub accounts.

**Steps:**
1. [ ] I request Cowork directory access. You approve a folder (e.g. `Tamazia-Rebuild` on Desktop).
2. [ ] I move all brief documents to `Tamazia-Rebuild/00-Briefs/`.
3. [ ] I move all screenshots to `Tamazia-Rebuild/01-Screenshots/`.
4. [ ] You create a **GitHub account** if you don't have one (free). You share the username with me.
5. [ ] You create a **new empty GitHub repository** called `tamazia-website`. Private recommended.
6. [ ] You create a **Netlify account** if you don't have one (free). Sign in with GitHub for easy connection.
7. [ ] You generate a **GitHub Personal Access Token** (fine-grained, scope: the new repo only). Share with me via this chat temporarily; I store nothing permanently. This token lets me push code on your behalf.
8. [ ] I confirm I have read-write access to the Cowork folder and can commit to GitHub.

**Acceptance:** folder connected, GitHub repo exists, Netlify account exists, token shared.

### PHASE 1 · ARCHITECTURE (2-3 hours)

**Goal:** scaffold the Astro project with theme tokens, base layout, and sniper-edit content architecture. Port the approved hero.

**Steps:**
1. [ ] Scaffold Astro project in `Tamazia-Rebuild/03-Astro-Site/`.
2. [ ] Install dependencies: `astro`, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/netlify`, `gsap`.
3. [ ] Create `src/styles/tokens.css` with every colour, typography, motion token from Theme System document.
4. [ ] Create `src/styles/base.css` with reset, body, global typography.
5. [ ] Create `src/styles/animations.css` with all canonical keyframes.
6. [ ] Create `src/layouts/DefaultLayout.astro` with `<head>`, GSAP loaded once, tokens and animations imported, meta + Open Graph structure.
7. [ ] Create `src/content/config.ts` with TypeScript schemas for all section content.
8. [ ] Create reusable UI components in `src/components/ui/`:
   - `Button.astro`, `Eyebrow.astro`, `Fleuron.astro`, `HairlineDivider.astro`, `PullQuote.astro`, `AuthorFrame.astro`, `RegulationRibbon.astro`, `Signature.astro`, `Ticker.astro`, `Monogram.astro`, `VerifiedPill.astro`.
9. [ ] Create layout components: `Header.astro`, `Footer.astro`.
10. [ ] Create `src/content/hero.yaml` with verbatim hero copy.
11. [ ] Port `tamazia-hero-preview.html` into `src/components/sections/Hero.astro`.
12. [ ] Wire up GSAP ScrollTrigger initialisation in `src/scripts/gsap-setup.ts`.
13. [ ] Wire up typewriter effect in `src/scripts/typewriter.ts`.
14. [ ] Create `src/pages/index.astro` that assembles `<Header>` + `<Hero>` + `<Footer>` for visual verification.
15. [ ] Run `npm run build` in my sandbox. Copy `dist/` to `Tamazia-Rebuild/04-Preview-Builds/`.
16. [ ] Commit to GitHub: `phase-1-architecture-and-hero`.
17. [ ] Set up Netlify site connected to the GitHub repo. Auto-deploys on push. First deploy goes to `tamazia-website.netlify.app`.

**Acceptance:** Hero section renders identically to the HTML preview, hosted at a Netlify URL. Every token, animation, and component is reusable. You can edit `hero.yaml`, commit, and see the change live within 60 seconds.

### PHASE 2 · SECTION BUILDING (3-4 working days, ~1-2 sections per hour)

**Goal:** build all 12 homepage sections as Astro components with content-driven copy.

**Sections in order** (each is one commit):

1. Top strip + main nav (already in Header.astro, refine).
2. Hero (completed in Phase 1).
3. Quick Audit Engine (frontend only; backend in Phase 3).
4. Why Us / Proof section.
5. Sectors section (6 cards in bento grid, 3D illustrations placeholder first).
6. Roman numeral interstitial.
7. Case Studies section (3 panels).
8. How Tamazia Works section.
9. Pricing section (3 tiers with Enterprise emphasised).
10. FAQ section (accordion pattern).
11. Contact section (form + Calendly).
12. Footer.

**For each section:**
- [ ] Create `src/content/[section].yaml` with verbatim copy.
- [ ] Create `src/components/sections/[Section].astro`.
- [ ] Create scoped styles (or extend global tokens).
- [ ] Wire up any section-specific interactions (accordion, hover states, parallax).
- [ ] Add to `src/pages/index.astro`.
- [ ] Run build, verify in browser.
- [ ] Commit.
- [ ] Aman reviews. Approves or flags issues.
- [ ] Iterate as needed.

**Acceptance per section:** visually matches Theme System specs, uses content from YAML, works at 18 viewport widths, passes WCAG AA.

### PHASE 3 · BACKEND FEATURES (1 day)

**Goal:** Quick Audit Engine live, contact form working, Calendly embedded.

**Steps:**
1. [ ] Create `netlify/edge-functions/audit.ts` per `TAMAZIA-05-AUDIT-ENGINE.md` spec.
2. [ ] Implement URL classifier + parallel API calls (Google PSI, Mozilla Observatory, Chrome UX Report, HTML fetch).
3. [ ] Implement keyword classifier (autocomplete, SERP scrape).
4. [ ] Implement sector inference rule-based classifier.
5. [ ] Implement editorial observation templates (~20 variants).
6. [ ] Create compliance snippet library: `src/content/compliance-snippets.json`.
7. [ ] Implement rate limiting middleware.
8. [ ] Implement founder alert via Resend integration.
9. [ ] Configure Netlify Forms in `Contact.astro`.
10. [ ] Brand-theme Calendly embed (iframe styling).
11. [ ] Test end-to-end: audit a test URL, verify result card renders, submit contact form, verify Calendly works.

**Acceptance:** audit engine returns in under 3 seconds, contact form submits successfully, Calendly bookings go through.

### PHASE 4 · INTEGRATION & QA (1 day)

**Goal:** verify the full site at production quality across every viewport and every browser.

**Steps:**
1. [ ] Run Lighthouse on every page. Performance > 95, Accessibility 100, Best Practices 100, SEO 100.
2. [ ] Run axe-core accessibility scan. Zero violations.
3. [ ] Run WAVE evaluator. Zero errors.
4. [ ] Manual QA at 18 viewport widths (320 to 3840 px). Screenshot every section.
5. [ ] Manual QA in Safari (desktop + iOS via BrowserStack or your iPhone), Chrome, Firefox, Edge.
6. [ ] Verify all parallax works smoothly in Safari (the original bug we set out to fix).
7. [ ] Verify keyboard navigation through every interactive element.
8. [ ] Verify screen reader announcements (VoiceOver on macOS, NVDA on Windows if available).
9. [ ] Verify all copy is verbatim from original tamazia.in.
10. [ ] Verify no broken links.
11. [ ] Verify sitemap.xml generates correctly.
12. [ ] Verify `robots.txt` correct.
13. [ ] Verify OpenGraph and Twitter card metadata.
14. [ ] Verify GA4 tag fires.
15. [ ] Verify Google Search Console ownership.

**Acceptance:** all 15 items pass. Site is production-ready.

### PHASE 5 · DEPLOYMENT & DNS CUTOVER (1 day)

**Goal:** move tamazia.in DNS from Bigrock to Netlify with zero downtime.

**24 hours before cutover:**
1. [ ] Lower Bigrock DNS TTL from current value to 300 seconds on all A and CNAME records.
2. [ ] Screenshot all current MX records (for rollback).
3. [ ] Verify UpdraftPlus backup from 5 April 2026 is openable.
4. [ ] Confirm Netlify staging site fully approved by Aman.

**Cutover moment (pick a low-traffic window, e.g. Saturday early morning IST):**
5. [ ] In Bigrock DNS panel: change A record for `@` from current Bigrock IP to Netlify's apex IP `75.2.60.5`.
6. [ ] In Bigrock DNS panel: change CNAME for `www` to `tamazia.netlify.app`.
7. [ ] **Do not touch MX records.** Verify three times before saving.
8. [ ] Save DNS changes.
9. [ ] Wait 5-30 minutes for propagation.
10. [ ] Netlify auto-provisions Let's Encrypt SSL certificate (5 minutes).
11. [ ] Verify tamazia.in loads from Netlify: check from India direct, UAE (VPN), USA (VPN).
12. [ ] Verify email still works: send test email to a Tamazia address, verify receipt.
13. [ ] Submit new sitemap to Google Search Console.
14. [ ] Implement 301 redirects from any legacy URL structure in `netlify.toml`.
15. [ ] Verify all forms still work on production.

**Acceptance:** tamazia.in loads from Netlify globally, emails still work, Search Console accepts new sitemap.

### PHASE 6 · POST-LAUNCH MONITORING (first 30 days)

**Goal:** catch regressions early, support SEO recovery, plan blog rollout.

**Steps:**
1. [ ] Monitor Netlify Analytics daily for 7 days.
2. [ ] Monitor Google Search Console for crawl errors daily for 14 days.
3. [ ] Monitor GA4 for user behaviour anomalies.
4. [ ] Monitor Netlify Forms submissions.
5. [ ] Respond to any user-reported bugs within 24 hours.
6. [ ] At 14 days: check SEO rankings delta. Expect minor dip, full recovery by day 60.
7. [ ] At 30 days: cancel Bigrock hosting (keep as registrar only).
8. [ ] Write first 5 blog posts as MDX files.
9. [ ] Publish blog posts at 2 per week cadence.

**Acceptance:** no critical regressions at 30 days. SEO trending stable or up. At least 5 blog posts live.

---

## 07 · WHAT I DO vs WHAT YOU DO

Clear delineation of responsibilities.

### I do

- All code writing (Astro, CSS, JavaScript, content YAML).
- All design application (theme, components, motion).
- All content extraction and verbatim preservation.
- All builds and deploys (via sandbox).
- Git commits on your behalf (with your token).
- Performance optimisation.
- Accessibility implementation.
- Quick Audit Engine backend implementation.
- Sitemap, metadata, Open Graph setup.
- 301 redirect configuration.
- Staging verification.

### You do

- Decisions: aesthetic approvals at each gate, copy approvals, go/no-go calls.
- GitHub account creation and PAT generation.
- Netlify account creation.
- Folder selection on your computer.
- DNS cutover execution in Bigrock panel (I provide step-by-step instructions, you click).
- Manual verifications: opening the site in your browser, confirming aesthetics, confirming email still works.
- iOS Safari testing on your iPhone (I cannot directly test iOS).
- Client permissions for logo display (Kamat, CGON, Meraas emails).
- Content for the 50 future blog posts (you already said you'll provide).

**I never:** touch your banking, enter your credit card info, deploy without your approval, delete Bigrock before 30 days, touch MX records, or make scope changes without confirmation.

---

## 08 · CONSOLIDATED RISK REGISTER (READY FOR MITIGATION)

| # | Risk | Likelihood | Severity | Mitigation | Status |
|---|------|------------|----------|-----------|--------|
| 1 | MX records accidentally changed | Low | Critical | Screenshot before, never touch, verify 3× before save | Planned |
| 2 | SEO rankings dip 30-60 days | Moderate | Medium | 301 redirects, sitemap resubmit, Bigrock failsafe | Planned |
| 3 | Contact form breaks | Low | Medium | Test on staging | Planned |
| 4 | Calendly embed breaks | Very low | Low | Same script tag used | Planned |
| 5 | Netlify free tier exceeded | Low | Low | Upgrade at $19/month if needed | Monitored |
| 6 | GitHub token leaked | Low | Medium | Fine-grained token, repo-scoped only | Planned |
| 7 | Astro build fails in sandbox | Very low | Low | Node 20 preinstalled, Astro stable | Planned |
| 8 | GSAP ScrollTrigger iOS Safari bug | Very low | Medium | GSAP explicitly Safari-tested | Planned |
| 9 | 3D sector card illustrations inconsistent | Moderate | Medium | Batch generate in single session | Planned |
| 10 | Bigrock DNS panel UI fails | Low | Medium | Escalate to Bigrock support if issue | Contingency |
| 11 | Existing tamazia.in SEO URLs change | Low | Medium | Current site is single-page; minimal URL surface | Low risk |
| 12 | Email MX records fail post-cutover | Low | Critical | Screenshot for rollback, verify at hour 1 | Planned |
| 13 | You get locked out of Bigrock mid-cutover | Very low | Critical | Have Bigrock support number at hand | Contingency |
| 14 | New Elementor bug discovered mid-build | Low | Low | We're leaving Elementor; bug irrelevant | N/A |
| 15 | Accessibility audit fails | Low | High | WCAG AA baked in at component level | Planned |

---

## 09 · SUCCESS CRITERIA (Definition of Done)

The project is DONE when all of these are true:

- [ ] tamazia.in loads from Netlify globally in under 2 seconds on 4G.
- [ ] Lighthouse Performance score > 95, Accessibility 100, Best Practices 100, SEO 100.
- [ ] All 12 homepage sections render correctly at 18 viewport widths (320 to 3840 px).
- [ ] Safari parallax works correctly on desktop + iOS.
- [ ] Quick Audit Engine returns results in under 3 seconds.
- [ ] Contact form submits and notifies founder.
- [ ] Calendly embed allows bookings.
- [ ] Email continuity verified (test email received).
- [ ] SEO: sitemap submitted, Search Console verified, schema.org JSON-LD injected.
- [ ] GA4 firing correctly.
- [ ] All copy verbatim from current tamazia.in plus approved additions.
- [ ] Every section passes WCAG 2.1 AA (axe-core zero violations).
- [ ] GitHub repo exists with full commit history.
- [ ] Netlify deploy pipeline functional (push = auto-deploy).
- [ ] Bigrock hosting retained for 30 days post-cutover.
- [ ] "Vetted by Aman Pareek" signature visible in footer.
- [ ] Regulation ribbon shows 45 frameworks with hover tooltips.
- [ ] Ticker scrolls continuously with verified case data.
- [ ] Aman has approved every acceptance gate.

---

## 10 · DECISION POINTS (answer before we begin executing)

I need your confirmation on these before Phase 0 starts:

1. **Folder name and location.** Do you want the project folder named `Tamazia-Rebuild` in Desktop, Documents, Google Drive, or somewhere else?

2. **GitHub account.** Do you already have a GitHub account? If yes, share the username. If no, I walk you through creating one (5 minutes).

3. **Netlify account.** Same as GitHub.

4. **Cutover timing.** The DNS cutover moment needs a low-traffic window. Saturday morning IST is typical. Your call.

5. **3D illustrations for sector cards.** Three routes: (a) Claude Design batch generation (zero cost, done by me), (b) Spline.design free tier (done by you with my prompts), (c) skip 3D for now and use typography-only sector cards at launch, add illustrations later. My recommendation: (c) at launch, (a) post-launch. Ship faster, add polish later.

6. **Founder portrait on How We Work section.** Yes or no. If yes, we need one editorial-grade photograph. Not required for launch.

7. **Hero 3D centrepiece.** Our current hero uses typography only and works. Keep as is, or add a sculptural anchor later? My vote: keep as is.

8. **Client logo permissions.** Have you sent permission-request emails to Kamat, CG Oncology, and Meraas yet? If not, do so this week so permissions arrive by cutover.

9. **Blog launch timing.** Launch site with zero blog posts and add over following weeks, or launch with 5 hero posts live? My recommendation: launch with 5 pre-prepared posts.

10. **Open Graph image.** Do you have a preferred OG image, or should I design one using the existing Tamazia crest?

---

## 11 · TIMELINE (6 to 8 WORKING DAYS)

Assuming focused execution and prompt approval at each gate:

| Day | Phase | Outcome |
|-----|-------|---------|
| 0 | Setup | Cowork folder connected, GitHub repo, Netlify account, decisions confirmed |
| 1 | Architecture + Hero | Astro scaffolded, hero ported, Netlify staging live |
| 2 | Sections 03-05 | Quick Audit frontend, Why Us, Sectors |
| 3 | Sections 06-08 | Interstitial, Case Studies, How We Work |
| 4 | Sections 09-12 | Pricing, FAQ, Contact, Footer |
| 5 | Backend | Quick Audit engine, contact form, Calendly |
| 6 | Integration QA | Full 18-viewport, accessibility, performance audits |
| 7 | Deployment prep | Staging frozen, TTL lowered, cutover plan finalised |
| 8 | Cutover | DNS switched, SSL provisioned, verified live globally |

Day 0 is short (~1 hour your time). Days 1-7 are active build days (~2-4 hours your time each day for review). Day 8 is cutover (~30 minutes your time).

Post-launch: 30-day monitoring with minimal active input from you.

---

## 12 · CHECKLIST PER PHASE

### Phase 0 Setup Checklist
- [ ] Cowork folder created and approved
- [ ] All briefs moved to `00-Briefs/`
- [ ] All screenshots moved to `01-Screenshots/`
- [ ] GitHub account ready
- [ ] GitHub repo `tamazia-website` created (private)
- [ ] GitHub PAT generated with repo scope
- [ ] Netlify account ready
- [ ] All 10 decisions in §10 confirmed

### Phase 1 Architecture Checklist
- [ ] Astro project scaffolded
- [ ] `tokens.css` complete with every brand variable
- [ ] `animations.css` complete with every keyframe
- [ ] `DefaultLayout.astro` complete with `<head>` + GSAP loaded
- [ ] Content collections config in place
- [ ] All 11 UI components created
- [ ] `Header.astro` and `Footer.astro` complete
- [ ] `hero.yaml` with verbatim copy
- [ ] `Hero.astro` ported from HTML preview
- [ ] Typewriter + GSAP initialised
- [ ] `index.astro` renders Header + Hero + Footer
- [ ] Build succeeds in sandbox
- [ ] Netlify site connected to GitHub
- [ ] First deploy live at `tamazia-website.netlify.app`
- [ ] Aman reviews and approves

### Phase 2 Section Building Checklist (repeat per section)
- [ ] YAML content file created with verbatim copy
- [ ] Astro component file created
- [ ] Scoped styles or global token usage
- [ ] Interactive behaviours wired up (accordion, hover, parallax)
- [ ] Added to `index.astro`
- [ ] Responsive verified at 18 widths
- [ ] WCAG AA verified
- [ ] Build succeeds
- [ ] Pushed to GitHub (triggers Netlify deploy)
- [ ] Aman reviews and approves

### Phase 3 Backend Checklist
- [ ] `audit.ts` Edge Function deployed
- [ ] PSI, Observatory, CrUX integrations working
- [ ] Sector inference classifier tested
- [ ] Observation templates load
- [ ] Compliance snippet library seeded
- [ ] Rate limiting middleware active
- [ ] Founder alert integration with Resend
- [ ] Netlify Forms configured
- [ ] Calendly branded and embedded
- [ ] End-to-end test: audit → contact form → founder email

### Phase 4 QA Checklist
- [ ] Lighthouse Performance > 95
- [ ] Lighthouse Accessibility 100
- [ ] Lighthouse Best Practices 100
- [ ] Lighthouse SEO 100
- [ ] axe-core zero violations
- [ ] 18-viewport manual QA screenshots
- [ ] Safari desktop verified
- [ ] Safari iOS verified (by Aman)
- [ ] Chrome, Firefox, Edge verified
- [ ] Keyboard navigation complete
- [ ] Screen reader smoke test
- [ ] All copy verbatim confirmed
- [ ] Sitemap and robots.txt correct
- [ ] GA4 firing
- [ ] Open Graph meta tested

### Phase 5 Cutover Checklist
- [ ] Bigrock TTL lowered 24 hours ago
- [ ] MX records screenshot stored
- [ ] UpdraftPlus backup verified openable
- [ ] Netlify staging frozen and approved
- [ ] DNS A record changed
- [ ] DNS CNAME changed
- [ ] MX records untouched (verified three times)
- [ ] SSL provisioned
- [ ] Site loads from India, UAE, USA
- [ ] Email continuity verified
- [ ] New sitemap submitted to Search Console
- [ ] 301 redirects configured

### Phase 6 Post-Launch Checklist
- [ ] Netlify Analytics monitored daily (first week)
- [ ] GSC monitored daily (first 14 days)
- [ ] GA4 reviewed weekly
- [ ] Form submissions reviewed daily
- [ ] SEO ranking delta checked at 14 and 30 days
- [ ] Bigrock hosting cancelled at day 30
- [ ] First 5 blog posts published

---

## 13 · BACKUP AND ROLLBACK

If anything breaks, here is how we recover.

### Pre-cutover state
- Current tamazia.in fully functional on Bigrock.
- UpdraftPlus backup from 5 April 2026 on Google Drive.
- Bigrock hosting paid and active.
- All content also captured verbatim in the Build Bible.

### Rollback scenarios

**Scenario A: DNS cutover fails (site unreachable).**
- Revert Bigrock A record to original IP. Revert CNAME. Email still works because MX was never touched. Site returns to WordPress within 30 minutes of TTL propagation.

**Scenario B: Email breaks post-cutover.**
- Immediate: verify MX records untouched. If yes, issue is elsewhere (could be Bigrock's spam filter acting up). Escalate to Bigrock support. If MX records were changed, restore from screenshot.

**Scenario C: SEO rankings drop more than 40%.**
- This is beyond expected range. Investigate crawl errors in Search Console. Verify 301 redirects. Verify sitemap. If unfixable, rollback DNS temporarily.

**Scenario D: Astro build fails after a change.**
- Netlify preserves the previous successful deploy. Revert via the Netlify dashboard one-click. Fix in development. Redeploy.

**Scenario E: Entire Netlify account compromised.**
- Restore DNS to Bigrock IP. Site returns to WordPress. Open incident on Netlify support. Change all tokens.

### Daily cadence during the 30-day post-launch window

I check the site at 8am IST daily for 30 days. One screenshot. One performance check. One form-submit test. If any anomaly, I flag to you immediately.

---

## 14 · COST SUMMARY

### At launch
- Netlify: free tier (100 form submissions/month, 125k function invocations, global CDN, SSL).
- Google PageSpeed Insights: free (unlimited).
- Mozilla Observatory: free.
- Google Autocomplete: free.
- Cloudflare Radar: free tier.
- GSAP: free for single-domain commercial use.
- Astro: free open-source.
- GitHub: free for private repos.
- Bigrock: existing registrar fee (~800 INR/year) + 30 days of existing hosting (~500 INR).
- Fonts: Google Fonts (free).
- 3D illustrations: Claude Design (included in your subscription).

**Total new outlay at launch: zero.**

### Potential monthly costs post-launch

- Netlify Pro (optional): $19/month if form submissions exceed 100/month.
- Upstash Redis (optional): $10/month at high audit volume.
- Resend (email notifications): free tier 3k/month.

### Sunk costs avoided
- Hiring a developer ($3k-10k per sprint).
- Hiring a 3D artist ($800-2000 for sector illustrations).
- Enterprise SEO platform ($300-800/month).
- Premium page builder license ($200-500/year).

---

## 15 · SINGLE NEXT ACTION

The roadmap is complete. To begin Phase 0:

1. Tell me to proceed.
2. Answer the 10 decision questions in Section 10.
3. Approve the folder request when I send it via `request_cowork_directory`.

After Step 3, I execute Phase 1 (Astro scaffold + hero port) in my sandbox and hand you a Netlify URL within 2 hours.

— End of Master Execution Roadmap —
