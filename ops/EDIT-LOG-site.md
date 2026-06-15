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

---

# EDIT LOG — FIX STREAM WEB-B (Cluster 6) · branch `v4-fix-site` off `origin/main` @ `bb38ba7`
JS parse-checked with `jsc -m` (JavaScriptCore; module-aware: SyntaxError = FAIL, ReferenceError/module-resolution = PASS). Astro = structural review. YAML = python3 `yaml.safe_load`. Price source-of-truth = `src/content/pricing.ts` (read FROM, not redefined). One commit per fix.

### S1 [D24/D37/C81/C82] · Turnstile verify + CORS lockdown · `functions/api/contact.js`, `functions/api/briefings.js`
- Both handlers now call `verifyTurnstile(request, body, env)` (was imported, never invoked) after the honeypot/age gates and reject with HTTP 403 on a failed/missing challenge. **Fail-open** preserved: the lib returns `{ok:true,skipped:'no_secret'}` when `TURNSTILE_SECRET_KEY` is unset, so behaviour is unchanged until the secret is bound.
- `Access-Control-Allow-Origin` changed off `*` to a `new URL()`-validated allowlist (`allowOrigin(request)`): same-origin `https://tamazia.co.uk` + `www.` + Cloudflare Pages previews `*.pages.dev` only; falls back to the canonical origin for same-origin POSTs (no Origin header) so the real forms keep working while a cross-site browser caller is denied. Applied to both the POST response headers and the `onRequestOptions` preflight; added `Vary: Origin`.
- jsc: PASS (both).

### S2 [D1/D2/D3] · Disclose PostHog + Clarity + Sentry; gate Sentry replay behind consent · `src/pages/cookie-policy.astro`, `src/components/analytics/Sentry.astro`, `src/components/ui/CookieConsent.astro`
- **cookie-policy.astro:** added table rows for PostHog (`ph_*` / opt-in flags, EU region, 12mo), Microsoft Clarity (`_clck`/`_clsk`, 12mo / 1 day), and Sentry Session Replay (`sentryReplaySession`, session). Corrected the lede, the post-table prose, the §3 "What we do not use" list (removed the false "no session-replay / GA4 is the only analytics platform" claims; now names GA4 + PostHog + Clarity + Sentry and keeps the true "no advertising/fingerprinting" lines), the §4 "Your choices" copy (Reject/Accept/Manage now actually differ), and the page `description`.
- **Sentry.astro:** Session Replay now gated behind the SAME analytics consent as GA4/PostHog/Clarity. `init` runs with `replaysSessionSampleRate:0` + `replaysOnErrorSampleRate:0` and `integrations:[]`; the Replay integration (`maskAllText`, `blockAllMedia`) is added via `addIntegration` only after `analyticsConsented()` is true, and live on the `tz-consent-change` accept event. Error reporting still runs without consent (strictly-necessary reliability, sets no replay storage). Bundle switched to `bundle.tracing.replay.min.js` so `replayIntegration` is available. Still a full no-op when `SENTRY_DSN` is unset.
- **CookieConsent.astro:** the single Analytics toggle label now names all four tools (GA4, PostHog, Microsoft Clarity, Sentry Session Replay); header comment corrected to match.
- ⚠️ CSP follow-up (NOT my file — `public/_headers`): Sentry needs `https://browser.sentry-cdn.com` in `script-src`, `https://*.sentry.io https://*.ingest.sentry.io` in `connect-src`, and `worker-src 'self' blob:` for Replay's worker. Today Sentry is a no-op (no DSN), so not yet breaking; must be added before binding `SENTRY_DSN`.
- Astro structural review: frontmatter fences balanced; no we/our/us introduced in new copy.

### S3 [D26/X17/D32/D25] · Newsletter vs inbound separation + correct briefings ack/lawful basis · `functions/_lib/neon-sync.js`, `functions/api/briefings.js`
- **neon-sync.js:** the lead `INSERT` now sets `lead_type` by source — `briefings` → `lead_type='newsletter'`, every other form → `lead_type='inbound'` (was hardcoded `'inbound'` for all). Both are values the COLD qualifier excludes, so footer briefings subscribers and inbound enquiries no longer pollute the cold-outreach set. `lead_type` is also recorded inside `personalisation_pointers`.
- **briefings.js:** replaced the enquiry ack (which wrongly promised a "reply within one working day" and cited Art 6(1)(f) legitimate interest) with a subscription-confirmation ack: names it a regulatory-briefings opt-in, gives unsubscribe instructions, and states the correct lawful basis **UK GDPR Art 6(1)(a) Consent** with a withdraw-anytime line. Subject + JSON response message updated to match.
- ⚠️ Deferral (NOT my file — `Footer.astro`): the briefings form markup is missing `ts_form_open` and carries a duplicate `name="bot-field"` honeypot. The server (`briefings.js`) already tolerates a missing `ts_form_open` (timing gate skipped) and the honeypot check still fires, so this is non-breaking; the hidden-field additions belong in `Footer.astro`, which is outside this stream's file scope.
- jsc: PASS (both).

### CONTRACT (WEB-A) + S4 (neon side) · `functions/_lib/neon-sync.js`
- **WEB-A contract:** reads `body.audit_slug`, `body.audit_domain`, `body.top_finding` (the fields WEB-A's audit forms POST) and maps them into the lead's `personalisation_pointers` JSON (only when present). No new lead columns — `pending.js` already reads `personalisation_pointers->>'top_finding'`, so this is the established home (Neon rule = additive/none).
- **S4[D54] new URL() host parse:** host now parsed with `new URL(env.NEON_URL).host`, regex kept only as a fallback for an unparseable string.
- **S4[C15/C18] idempotency:** the lead INSERT is now `INSERT ... SELECT ... WHERE NOT EXISTS (SELECT 1 FROM leads WHERE lower(contact_email)=lower($3))`, so a repeat submission cannot create a duplicate lead. **Deviation from the brief's literal "ON CONFLICT (contact_email) DO UPDATE":** `leads` has no unique index on `contact_email` (evidence: `add-manual.js` dedupes leads in app code on domain OR contact_email and uses `ON CONFLICT (domain)` only for `minting_queue`; I was not granted prod-Neon read to confirm a constraint). A bare `ON CONFLICT (contact_email)` would raise 42P10 and, on this fail-open path, silently drop every web lead. Adding a unique index is DDL (avoided per the Neon additive/prefer-none rule on the shared `leads` table). The WHERE NOT EXISTS form gives the same no-duplicate-per-email guarantee, schema-safe.
- jsc: PASS.

### S4 [D51/D52/D28] · STATE digest schema + PR-based commit · `scripts/gen-state-digest.mjs`, `.github/workflows/state-digest.yml`
- **gen-state-digest.mjs:** reconciled the lead counts to the real schema. `status='ready'` → `status='new'` (the funnel is stalled so 'ready' is ~0); `stage='qualified'`/`stage='client'` → `lifecycle_stage='qualified'`/`lifecycle_stage='client'` (there is no `stage` column on leads; `lifecycle_stage` is the value used across the codebase). Renamed the metric/label `email-ready`→`new` in both STATE.md and CONTEXT-PACK output.
- **state-digest.yml:** replaced the direct `git push` (rejected + swallowed on ruleset-protected main → STATE.md never persisted, 0 bytes) with `peter-evans/create-pull-request@v6` opening/updating `bot/state-digest`. Added `pull-requests: write` permission. The < 8 KB budget gate is kept. This is why `docs/STATE.md` was empty (D51); it now lands via a mergeable PR.
- YAML: `yaml.safe_load` OK (5 steps). jsc (digest script): PASS.

### S5 [D8/D9/D10] · OG/Twitter card metadata · `src/layouts/BaseLayout.astro`
- **[D10]** Added `og:image:type` (image/png), `og:image:width` 1200, `og:image:height` 630 (verified dims of `public/og-default.png` and the per-route overrides), `og:image:alt`, and `twitter:image:alt` (both = page title). Scrapers no longer need to re-fetch to size the card; the image now has an accessible description.
- **[D9]** Removed `<meta name="twitter:site" content="@tamazia_co">` — no such X account is owned or referenced anywhere (social config = Instagram + LinkedIn only; org JSON-LD `sameAs` has no X URL). `twitter:card=summary_large_image` is kept and renders from `og:image` without a handle.
- ⚠️ **[D8] DEFERRED (NOT my files):** the dangling JSON-LD `#org` provider is in `src/pages/index.astro:54` and `src/pages/instrument.astro:24` (`provider: { '@id': 'https://tamazia.co.uk/#org' }`), which must become `#organization` to resolve to the org node BaseLayout emits (`@id` already `#organization`). Both pages are outside this stream's file scope. One-token fix in each: `/#org` → `/#organization`.
- Astro structural review: frontmatter balanced; meta block intact.

### S6 [D15/D16/D19] · Mobile sticky CTA price from config + render mandateSignature · `src/layouts/BaseLayout.astro`, `src/components/sections/Pricing.astro`
- **[D16] BaseLayout.astro:** the mobile sticky CTA price now derives from the ONE pricing config — `pricingContent` is imported and the lowest tier's `priceGbp` (Foundation = 2500) is formatted as `stickyPrice` and rendered, replacing the hardcoded `£2,500` literal. Falls back to 2500 only if the config is somehow empty.
- **[D15] Pricing.astro:** `mandateSignature` (already destructured from config + already styled by the `.mandate-signature` CSS, but never emitted) is now rendered as a decorative `<p class="mandate-signature" aria-hidden="true">` after the mandate actions. Dead CSS is now live.
- **[D19] exposureReportGbp:** NOT dead — it is the Exposure Report product (`unlock` £750 + `monthlyCover` £449) consumed by the audit-side commerce (Cluster 5 C-H / Route-3, owned by WEB-A) and `pricing.ts` is P1-owned (outside this stream). No change made here: marking it "dead" would be wrong, and rendering a duplicate pricing block on the marketing page would gold-plate + diverge from the audit's single commerce source. Resolution = documented as a live, audit-side-consumed export.
- Astro structural review: frontmatter balanced (both); pricing import path resolves; no dashes added.

### S7 [D45/D46/D44] · Sitemap exclude noindex drafts + one canonical terms URL · `astro.config.mjs`, `src/components/sections/Pricing.astro`
- **[D45] astro.config.mjs:** the sitemap `filter` now also excludes `/legal/service-terms/` and `/legal/cold-outreach-privacy-notice/` (the two `noindex` DRAFT legal pages), so the sitemap never advertises a noindex URL. Verified the other `/legal/` pages (data-protection, dpa, sub-processors) are NOT noindex and correctly stay in; `/terms/` stays in as canonical.
- **[D44/D46] Pricing.astro:** the C4 results-disclosure "Full terms" link was repointed from the noindex draft `/legal/service-terms/` (still carrying `[TODO]` founder-identity placeholders) to the canonical, indexable `/terms/`. Production marketing copy no longer links a raw-TODO draft. footer.ts already uses `/terms/`, so the canonical terms URL is now consistent across the site.
- jsc (astro.config.mjs): PASS. Astro structural review of Pricing.astro: balanced.

### S8 [D57/D58/D59] · Remove duplicate skip link · `src/layouts/BaseLayout.astro`
- **[D57]** Removed the second `<a class="skip-link">Skip to main content</a>` (there were two identical skip links targeting `#main`, so screen-reader users heard the bypass twice). Kept `<a class="skip-to-main">`, the one whose styles live in this layout. The orphaned `.skip-link` CSS lives in global `base.css`/`animations.css` (out of scope) and is now harmlessly unused.
- **[D58] ReassuranceCard (COPY 4):** verified it is ALREADY correctly gated — `copy4.placeholder===true` renders only an HTML comment, nothing visible. ⛔ Founder-blocked on the verbatim COPY 4. Component + index.astro are outside this stream's file scope; no change needed (it is already hidden, not empty-but-visible).
- **[D59] Interstitial numerals:** NOT in this stream's files — the only interstitial reference in my files is the BaseLayout reveal-safety-net script (`.interstitial:not(.in-view)`), which is unrelated to numerals. Deferred to the owning component.
- Astro structural review: one skip anchor remains; fences balanced.

### S9 [X1] + S1-audit · QuickAudit Authority rate from config + wire audit form ts_form_open · `src/components/sections/QuickAudit.astro`
- **[X1]** The Authority "Preferred Partner Rate" upsell card sourced its rates from hardcoded literals (£3,600 preferred / £4,500 standard). Now imports `pricingContent` and derives them from the Authority tier: preferred = `priceGbp` (£4,500/month), standard = `priceGbpStandard` (£6,000/month). Applied to the server-rendered `#rate-preferred`/`#rate-standard`, and the client JS fallbacks now read config-derived `data-preferred-rate`/`data-standard-rate` off the card (replacing the hardcoded fallback literals). The dynamic `/api/audit` response values (WEB-A) still win when present.
- **[S1 audit-form]** Added a hidden `ts_form_open` field, hydrated it on load, and forwarded `ts_form_open` + the three honeypots (`bot-field`/`c_website_2`/`c_homepage_url`) in the POST payload. `/api/audit` already inspects these (age + honeypot bot-trap) but the QuickAudit JS was only sending `{input,email,sector}`, so the server trap was inert for this path — it now fires.
- Astro structural review: fences balanced; pricing import path resolves; no £3,600/£4,500 literals left in live markup/script; no dashes added.
