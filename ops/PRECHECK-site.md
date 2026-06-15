# PRECHECK — BUILD STREAM P4 (website mirror)

Worktree: `_v4-p4-site` (branch `v4-p4-site`) off `origin/main` @ `46c20c0` (PR #62, csp-report-fix). No merge.
Node availability for `astro build` / `astro check`: verified in Phase 1 below.

## Phase 0 — search-first findings

### Stack
- Astro 4.16 + `@astrojs/sitemap`, Cloudflare Pages. Build = `node scripts/generate-og.js && node scripts/build-cockpit.mjs && astro build` then `patch-dist.js` + wrangler (CI, deploy.yml).
- Single layout: `src/layouts/BaseLayout.astro` (used site-wide). It hardcodes the public analytics tokens (`bingVerify`, `cfBeacon`, `ga4Id`) in frontmatter and passes them to `HeadAnalytics.astro` / `BodyAnalytics.astro`.
- GA4 is consent-gated (Consent Mode v2) via `localStorage['tamazia-cookie-consent']` + the `tz-consent-change` event (see `BodyAnalytics.astro` + `ui/CookieConsent.astro`). Cloudflare Web Analytics is cookieless and loads unconditionally.
- Only existing PostHog usage in the repo: `functions/audit/[[path]].js` (server-side capture, gated on `env.POSTHOG_KEY`, host default `https://eu.i.posthog.com`). No client PostHog. No Microsoft Clarity anywhere.
- Neon access from Pages Functions: `functions/api/_neon.js` → HTTPS `/sql` endpoint with `Neon-Connection-String` header. Secret resolves from `NEON_URL` || `NEON_CONNECTION_STRING` || `NEON_DATABASE_URL`.
- CI workflows in `.github/workflows/`: deploy.yml (build+deploy), lighthouse-pa11y, visual-regression, weekly-backup, synthetic-check, codeql, three setup-*-secrets. NO docs/STATE digest workflow exists → P4-7 is net-new. `NEON_URL` is already a known CF secret (setup-extra-secrets.yml).

### THE single price source: `src/content/pricing.ts`
- main (46c20c0) pricing.ts == P1 branch (`v4-p1-audit` @ `a0857b2`) pricing.ts — **byte-identical**. So the version I render from is exactly what P1 currently holds. The "882→480" fix is already in main (copy reads 480%, no 882 anywhere). I do NOT edit pricing.ts.
- Constants available to render the site from: tier `priceGbp`/`priceGbpStandard`/`savesGbp6`, `fixPacksGbp` (ten 7500 / twenty 12500 / thirty 17500), `fixPacksLane`, `entryAuditGbp` (1500), `exposureReportGbp`, `independentSolutionsGbp` (**8** keys — websiteRemodelling, aiAuthority, icpOutreach, onlinePersonalBranding, instagramPresence, ymylContent, reputationCrisis, gbpDomination).
- NOTE / discrepancy: P4 brief says "7 Independent Solutions"; config holds **8**. Hard rule = render from the config field-for-field, so I render all 8. Flagged in report.

### mission-d (#61) — `origin/mission-d` @ `db2b03c` (off origin/main @ 0f2ac7b)
`git diff main...mission-d` = 49 files, +1208/-87. Confirmed it does **NOT** touch `src/content/pricing.ts` and does **NOT** touch any P1-owned audit file (`functions/audit/*`, `public/audit/*`). Maps to P4 as:
- `src/config/social.ts` (NEW) — single source; **already updated** to confirmed Instagram `https://www.instagram.com/tamaziauk/` + LinkedIn founder `https://www.linkedin.com/in/amanpareekk/` (the EDIT-LOG-D prose is stale and still says TODO-founder, but the committed file is correct). → P4-4
- `Header.astro` + `Footer.astro` — social icon rows (desktop nav, mobile drawer, footer brand column), a11y, placeholder guard. → P4-4
- `Pricing.astro` (+295) — fix packs, £1,500 audit reference line, 8 Independent Solutions struck-then-offer, all from pricing.ts constants, CTAs → `#contact`. → P4-1/P4-3. **MISSING: the verbatim C4 disclosure paragraph** (must add).
- `ReassuranceCard.astro` (NEW) + `index.astro` — card built, wired under `<Sectors />`, **copy-gated**: while `copy4.placeholder` is true it renders ONLY an HTML comment (nothing visible). → P4-2 (matches "hidden until COPY 4 supplied").
- `contact.ts` (+website field) + `Contact.astro` (url input handling) + `functions/api/contact.js` (server-side PostHog `contact_submitted`, gated on POSTHOG_KEY) + `functions/_lib/neon-sync.js` (domain waterfall prefers body.website). → P4-5. contact.js base == current main base (clean, surgical add).
- `legal/service-terms.astro` (NEW) + `legal/cold-outreach-privacy-notice.astro` (NEW) — both `noindex`, DRAFT FOR LEGAL REVIEW banner; cold-outreach maps Articles 13+14; company-reg details are `[TODO: founder]` placeholders. → P4-6
- `BaseLayout.astro` — JSON-LD `sameAs` + founder `sameAs` updated to confirmed Instagram/LinkedIn. (+6) 
- `hero.ts` — credential standardised to EXACTLY "LLM in International Business Law, King's College London" (marquee caps variant + sentence-case variants). Satisfies the hard credential rule.
- `footer.ts` — socialLinks mirror updated to confirmed URLs.
- Also touches: `FounderLink.astro`, `ArticleSchema.astro`, `FinalHero.astro`, `WhyUs.astro`, `about.astro`, `press.astro`, `terms.astro`, insights/resources `[slug].astro`, and ~22 `public/blog/*/index.html` files (credential-string normalisations). Will land the credential-string ones that are in client copy scope; review each.

### Gaps mission-d does NOT cover (I add these)
1. **P4-1 C4 disclosure paragraph** — verbatim, appended to the pricing section.
2. **P3-3 site-wide client PostHog** (identify + pageview + form-fill) + **Microsoft Clarity** snippet, env-driven, graceful no-op if unset. mission-d only did server-side PostHog in contact.js.
3. **P4-7 STATE digest GitHub Action** — regenerate docs/STATE.md (<8KB) + docs/CONTEXT-PACK.md from NEON_URL on push to main.

### FOUNDER-BLOCKED (⛔)
- COPY 4 (reassurance-card text): card stays copy-gated/hidden. ⛔
- LinkedIn COMPANY URL: founder profile `/in/amanpareekk/` is wired; a company URL may be preferred. Flag, do not block. ⛔

## Phase 1 — toolchain check
(filled during execution)
