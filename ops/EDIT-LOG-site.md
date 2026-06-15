# EDIT LOG — BUILD STREAM P4 (website mirror)

Worktree: `_v4-p4-site` (branch `v4-p4-site`) off `origin/main` @ `46c20c0`. No merge.
Node not installed locally → JS/TS syntax-checked with `jsc`; `.astro` structurally reviewed; budget logic unit-tested under jsc. CI runs the real `astro build`.
Price source-of-truth = `src/content/pricing.ts` (P1-owned). NOT edited here — site renders FROM it. main pricing.ts == P1 (`a0857b2`) pricing.ts byte-for-byte.

Landed from `mission-d` (#61, `db2b03c`) = the files marked **[#61]**. New/changed by P4 here = **[P4]**.

---

### P4-1 · Mirror audit pricing + C4 disclosure · `src/components/sections/Pricing.astro`
- **[#61]** Imports `fixPacksGbp`, `fixPacksLane`, `entryAuditGbp`, `independentSolutionsGbp` from pricing.ts. Renders: Fix Packs (Priority Ten/Twenty/Thirty = `fixPacksGbp.ten/twenty/thirty` → £7,500 / £12,500 / £17,500), the 8 Independent Solutions (struck `anchor` → `offer`, or single `price`), and the £1,500 audit reference line from `entryAuditGbp`. All CTAs → `#contact` (no Stripe). Zero hardcoded prices.
- **[P4]** Appended the OS-V4 **C4 disclosure paragraph VERBATIM** as `.results-disclosure` after the Independent Solutions block ("Figures shown for client engagements are drawn from verified analytics … Full terms: /legal/service-terms."). Trailing reference rendered as a link to `/legal/service-terms/`. Added `.results-disclosure` CSS. Dash-free; no we/our.
- NOTE: P4 brief said "7 Independent Solutions"; the config holds **8** keys. Hard rule = render from config field-for-field → rendered all 8. Flagged.

### P4-2 · Reassurance card (copy-gated) · `src/components/sections/ReassuranceCard.astro` + `src/pages/index.astro`
- **[#61]** Component built (ivory + gold-hairline + seal motif), wired into index.astro directly after `<Sectors />`. COPY-GATED: while `copy4.placeholder === true` it renders ONLY an HTML comment (nothing visible to a live visitor). Founder pastes COPY 4 into `copy4.body` and sets `placeholder=false` to switch on. ⛔ COPY 4 pending. Matches P4-2 "hidden until COPY 4 supplied".

### P4-3 · "Paid audit £1,500" line
- **[#61]** `.audit-reference-line` in Pricing.astro renders the £1,500 figure from `entryAuditGbp`. Visible. Kept.

### P4-4 · Social links (header + footer) · `src/config/social.ts`, `Header.astro`, `Footer.astro`, `footer.ts`, `BaseLayout.astro` + drive-bys
- **[#61]** New single source `src/config/social.ts`: `INSTAGRAM_URL='https://www.instagram.com/tamaziauk/'` (confirmed) + `LINKEDIN_URL='https://www.linkedin.com/in/amanpareekk/'` (founder profile). `isPlaceholder()` guard renders any blank/sentinel URL as a disabled span. Icon rows added to Header (desktop nav + mobile drawer) and Footer (brand column) with full a11y (`rel="noopener noreferrer me"`, `aria-label`, focus rings).
- **[#61]** `footer.ts` socialLinks + `BaseLayout.astro` JSON-LD `sameAs` (org + founder) updated to the confirmed Instagram/LinkedIn URLs.
- **[#61]** Drive-by URL corrections to the confirmed founder LinkedIn: `ArticleSchema.astro`, `FinalHero.astro` (was a wrong `amanpareektamazia` URL), and 20 `public/blog/*/index.html` (were `amanpareektamazia` / `company/tamazia`).
- ⛔ FLAG: founder profile is wired; a **LinkedIn COMPANY URL may be preferred** — one-line swap in `social.ts` when supplied.

### P4-5 · Contact form + Neon + PostHog + cal · `contact.ts`, `Contact.astro`, `functions/api/contact.js`, `functions/_lib/neon-sync.js`
- **[#61]** Heading "Every engagement begins with a conversation." (already verbatim in contact.ts). Added a required `website` field (`type:'url'`) between email and company; `Contact.astro` field loop extended to render `type:'url'` as `<input type="url" inputmode="url">`. Form POSTs to `/api/contact` (existing). Cal.com inline embed (`cal.com/tamazia/strategy-call`) + founder copy already beside the form (kept).
- **[#61]** `functions/api/contact.js`: server-side PostHog `contact_submitted` capture (fail-open, gated on `env.POSTHOG_KEY`, host default `eu.i.posthog.com`), pushed into the existing `Promise.allSettled`. `neon-sync.js` domain waterfall now prefers `body.website`.

### P4-6 · Legal pages · `src/pages/legal/service-terms.astro`, `src/pages/legal/cold-outreach-privacy-notice.astro`
- **[#61]** Both NEW, both `noindex`, both carry a prominent "DRAFT FOR LEGAL REVIEW · not yet in force" banner. service-terms: 13 sections (reads `entryAuditGbp` from config for the audit reference, never hardcoded). cold-outreach: maps UK GDPR Articles 13 + 14 per section. Company-registration details are clearly-marked `[TODO: founder]` placeholders (legal-review gated).

### P4-7 · STATE digest action · `scripts/gen-state-digest.mjs` + `.github/workflows/state-digest.yml`
- **[P4]** New Node script (dependency-free, native fetch) queries Neon via the HTTP `/sql` endpoint (same pattern as `functions/api/_neon.js`) using `NEON_URL` secret. Writes `docs/STATE.md` (live counts: leads/ready/qualified/client, sends, suppression, inbound, minting_queue, audit_pages, cal_bookings; last runs from engine_runs|sourcing_runs; open flags from system_state) under a **hard < 8 KB budget** (cascading trim, unit-tested: 27,815 B → 1,400 B, headers + footer preserved) and `docs/CONTEXT-PACK.md`. Every query is defensive (missing table/column → "n/a", never crashes). With NEON_URL unset it writes a clearly-marked "unconfigured" stub and exits 0.
- **[P4]** Workflow runs on push to main (paths-ignore the two docs to avoid a loop), daily 06:17 UTC, and `workflow_dispatch`; `concurrency` guard; `permissions: contents: write`; setup-node@20; enforces the < 8 KB budget as a CI step; commits regenerated docs back with `[skip ci]` only if changed.

### P3-3 (folded) · PostHog + Microsoft Clarity site-wide · `src/components/analytics/Analytics.astro` + `BaseLayout.astro` + `public/_headers`
- **[P4]** New `Analytics.astro`: client PostHog (official loader) + Microsoft Clarity, both env-driven and a **graceful no-op when the key is unset** (reads `PUBLIC_POSTHOG_KEY||POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST||POSTHOG_HOST` default `eu.i.posthog.com`, `PUBLIC_CLARITY_ID||CLARITY_ID`). PostHog captures `$pageview` (+ pushState/popstate), autocapture, `form_started` (focusin), `form_submitted` + `identify(email)` on submit. Both gated behind the SAME analytics consent the GA4 loader uses (`tamazia-cookie-consent` + `tz-consent-change`), so nothing loads before consent. Wired into `BaseLayout.astro` before `</body>` (site-wide; audit-adjacent Astro pages inherit it). Did NOT touch P1's `functions/audit/*` / `public/audit/*`.
- **[P4]** `public/_headers` CSP: added `https://*.posthog.com https://*.clarity.ms https://www.clarity.ms` to `script-src` and `connect-src`, and `https://*.clarity.ms` to `img-src`, so PostHog/Clarity loaders (via the nonce'd inline script + `'strict-dynamic'`) and their event sends are not CSP-blocked.

---

## Did NOT take from #61
- `ops/*` (PLAN-D / INVENTORY-D / EDIT-LOG-D / STATUS-D / VERIFY-D) — this stream keeps its own `ops/` (PRECHECK-site.md, EDIT-LOG-site.md, VERIFY-site.md).
- `src/content/pricing.ts` — confirmed #61 does NOT edit it (correct; P1 owns it).

## GATES (⛔ flagged, NOT faked)
- ⛔ **COPY 4** — ReassuranceCard stays copy-gated/hidden until founder supplies verbatim copy.
- ⛔ **LinkedIn COMPANY URL** — founder profile `/in/amanpareekk/` wired; company URL may be preferred (one-line swap in `social.ts`).
- (Stripe) pricing CTAs deliberately stay `href="#contact"` — no Stripe URLs invented.

## Needs a live deploy to confirm (cannot verify statically here)
- PostHog/Clarity firing (needs `PUBLIC_POSTHOG_KEY` / `PUBLIC_CLARITY_ID` bound at CF build) + a live consent accept.
- `/api/contact` server-side PostHog event (needs `POSTHOG_KEY` bound in CF) and the Neon `leads` write.
- STATE digest action populating live counts (needs `NEON_URL` repo secret; runs only on GitHub).
- Astro production build / `astro check` (no Node locally).
