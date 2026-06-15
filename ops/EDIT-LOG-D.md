# EDIT LOG — MISSION D finish + adversarial audit (V2)

Worktree: `_v4-p4-site` (branch `v4-p4-site`). No merge. Continuation of the prior agent's P4
stream (its own log is `ops/EDIT-LOG-site.md` + `ops/PRECHECK-site.md`; the prior agent shipped
the #61 site-mirror + P4 + P3-3 + P4-7 work across ~11 stream commits).

This pass = DISCOVER what the prior agent built, VERIFY each D done-when, FINISH the one gap,
ADVERSARIALLY AUDIT, push. No Node/npm/jsc-on-PATH locally; JS syntax-checked with the macOS
JavaScriptCore `jsc` helper (import/export/module-specifier errors = PASS = parsed clean). The
<8KB STATE-digest budget logic was unit-tested under jsc against small/medium/huge inputs.

## Safety re-verified first
- NONE of the P4-stream commits touch `src/content/pricing.ts` or the audit files
  (`functions/audit/*`, `public/audit/*`). Those files DO appear in `git diff main..HEAD` but only
  via inherited Mission C / audit-overhaul commits (#58/#59/#60 + the audit series) that are stacked
  on this branch below the P4 work. Confirmed by per-commit `git diff-tree` over every P4 commit.
- Render-from-config honoured: Pricing.astro reads every price from `pricing.ts` constants; zero
  hardcoded prices.

## What I FINISHED (this pass)
### D5 (gap closed) · founder call copy (credential exact) beside the cal calendar · `Contact.astro`
- The prior agent shipped the contact form (name/website/email/sector + company + objective),
  Neon POST, server-side PostHog, Turnstile + honeypots, and the cal embed beside the form — all
  verified present. The one thin spot vs the D5 brief was "founder call copy (credential exact)"
  beside the calendar: the booking pane carried no founder credential line.
- Added, at the top of the `.calendly-pane` (the dark booking pane beside the form):
  - one founder call line: "The strategy call is held by the founder in person." (no dashes, no
    we/our), and
  - `<FounderLink variant="dark" />` — the CANONICAL founder treatment, which renders
    "Founder · LLM in International Business Law, King's College London" (credential exact,
    single-sourced from the component, not re-typed) and links the founder LinkedIn.
- Added `.founder-call-copy` + `.contact-founder` spacing CSS. `FounderLink` imported once.
- Rationale for reusing FounderLink rather than authoring credential copy: keeps the credential
  string exact + single-sourced, links the (already-correct) founder LinkedIn, and matches the
  dark contact background via the existing `.on-dark` styles in `base.css`.

## VERIFIED (prior agent's work — confirmed done-when, not redone)
- D1 ✅ Pricing.astro renders tiers + Fix Packs (£7,500/£12,500/£17,500 from `fixPacksGbp`) +
  the Independent Solutions struck→offer from `independentSolutionsGbp`, all from config; CTAs →
  `#contact`. The C4 disclosure paragraph is appended and is BYTE-EXACT verbatim (diffed against the
  brief string programmatically — exact match), with the trailing reference linking
  `/legal/service-terms/`. NOTE: brief said "7" Independent Solutions; config holds 8 — prior agent
  correctly rendered all 8 per the render-from-config hard rule.
- D2 ✅ ReassuranceCard present, wired in `index.astro` directly after `<Sectors />`, copy-gated:
  while `copy4.placeholder` is true it renders only an HTML comment (nothing ships to a visitor).
  ⛔ COPY 4 stays gated.
- D3 ✅ £1,500 audit reference line visible, figure from `entryAuditGbp`.
- D4 ✅ Instagram `https://www.instagram.com/tamaziauk/` + LinkedIn `/in/amanpareekk/` from
  `src/config/social.ts`, rendered in BOTH Header and Footer as real `<a target="_blank"
  rel="noopener noreferrer me">` (neither is a placeholder). JSON-LD `sameAs` + all blog HTML use
  the correct URLs; no stale `amanpareektamazia` / `company/tamazia` survives. ⛔ company-URL option
  flagged (one-line swap in social.ts).
- D5 ✅ (after the finish above) form fields, theme (mirrors the audit booking form: obsidian +
  gold), POST `/api/contact` → `syncLeadToNeon` (Neon, parameterized INSERT, website field
  preferred, fail-open) + `firePostHog('contact_submitted')` (fail-open, gated on POSTHOG_KEY),
  honeypots (bot-field/c_website_2/c_homepage_url + ts_form_open age gate), cal embed beside it,
  founder credential now beside it.
- D6 ✅ `/legal/service-terms` AND `/legal/cold-outreach-privacy-notice` both exist, both
  `noindex={true}` (BaseLayout emits `<meta name="robots" content="noindex, nofollow">`), both carry
  the "DRAFT FOR LEGAL REVIEW · not yet in force" banner. service-terms reads `entryAuditGbp` from
  config (never hardcoded). cold-outreach maps UK GDPR Articles 13 + 14 per section. Company-reg
  details are clearly-marked `[TODO: founder]` placeholders.
- D7 ✅ `scripts/gen-state-digest.mjs` + `.github/workflows/state-digest.yml`. Script: dependency-
  free native fetch to the Neon `/sql` endpoint, defensive per-query (missing table/col → "n/a"),
  unconfigured stub + exit 0 when NEON_URL unset, fail-open on Neon errors. <8KB budget = cascading
  trim (last-runs → flags) then hard truncate; UNIT-TESTED under jsc: small=1,288B, medium=5,108B,
  huge input trims to 535B, all <8,192 with top header + Live counts + footer preserved. Workflow:
  push-to-main (paths-ignore the two docs to avoid a loop) + daily 06:17 + dispatch, concurrency
  guard, `contents: write`, setup-node@20, an independent CI step that fails if STATE.md >= 8192,
  commits regenerated docs with `[skip ci]` only on change.
- P3-3 ✅ `Analytics.astro` (client PostHog official loader + Microsoft Clarity), env-driven and a
  graceful no-op when both keys unset (`enabled` gate emits nothing), consent-gated behind the SAME
  `tamazia-cookie-consent` + `tz-consent-change` mechanism as GA4. Captures `$pageview` (+ history
  hooks), autocapture, `form_started`, `form_submitted`, `identify(email)`. Wired into BaseLayout
  before `</body>`. CSP (`public/_headers`) allows `*.posthog.com` + `*.clarity.ms` in script-src /
  connect-src / img-src (PostHog assets host `eu-assets.i.posthog.com` matches the `*.posthog.com`
  wildcard).

## ADVERSARIAL AUDIT — findings (see report for the numbered list)
- Pricing drift vs pricing.ts: NONE. All prices render from config; C4 disclosure byte-exact.
- Contact form: Neon write parameterized (no injection), honeypots present, PostHog fail-open. OK.
- Social links resolve: OK; no stale URLs anywhere.
- STATE-digest <8KB + fail-open: OK (unit-tested + CI-guarded).
- no dashes / no we-our in rendered D copy: clean (em-dashes only remain in non-rendered CSS/JS
  comments). Pre-existing "Please email us at …" error microcopy in Contact.astro (from #47, also on
  main) flagged — pre-existing site-wide, not D-introduced, left for a consistent site-wide pass.
- credential exact: the credential WORDING is exact everywhere ("LLM in International Business Law,
  King's College London"); a cosmetic straight-vs-curly apostrophe mix (`King's` vs `King's`) exists
  across hero.ts/faq.ts etc., pre-existing (Mission C), flagged not blocking.
- legal pages load + noindex on the privacy notice: OK (both noindex).

## GATES (⛔ flagged, NOT faked)
- ⛔ COPY 4 — ReassuranceCard stays copy-gated/hidden until founder supplies verbatim copy.
- ⛔ LinkedIn COMPANY URL — founder profile `/in/amanpareekk/` wired; company URL may be preferred
  (one-line swap in `src/config/social.ts`).
- Pricing CTAs deliberately stay `href="#contact"` (no Stripe URLs invented).

## Needs a live deploy to confirm (cannot verify statically; no Node locally)
- Astro production build / `astro check` (CI runs the real build on merge).
- PostHog/Clarity firing (needs `PUBLIC_POSTHOG_KEY` / `PUBLIC_CLARITY_ID` bound at CF build + a
  live consent accept) and `/api/contact` server-side PostHog + the Neon `leads` write
  (needs `POSTHOG_KEY` / `NEON_URL` bound in CF).
- STATE digest populating live counts (needs the `NEON_URL` repo secret; runs only on GitHub).
