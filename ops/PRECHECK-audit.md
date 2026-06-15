# PRECHECK — Audit page (BUILD STREAM P1 / OS-V4)
Worktree: `_v4-p1-audit` · branch `v4-p1-audit` · base HEAD `46c20c0` (origin/main, after PR #59/#60/#62).
Discovery date: 2026-06-15. READ-ONLY discovery; no edits in this file's commit.

## 0. ARCHITECTURE (the live render chain — all in `tamazia-website`)
The audit page is NOT an Astro route and NOT the legacy `audit-worker-v14.js`. It is a **Cloudflare Pages Function** that renders a static shell + a client app reading `window.D`:

1. `functions/audit/[[path]].js` — Pages Function. Matches `/audit/<slug>/<hash>`, queries Neon `audit_pages`
   (`SELECT payload_json, domain, sector, country, lead_id, expires_at, COALESCE(unlocked,false) AS unlocked, company`),
   honours `expires_at`, R2 dual-path for big payloads, calls `payloadToD()` then `renderShell()`.
   Passes ctx `{ company, now, generated_at:null, unlocked }`. Fires a PostHog `audit_opened` server event if `env.POSTHOG_KEY`.
2. `functions/audit/_adapter.js` (1648 ln) — `payloadToD(payload, ctx)`: deterministic `payload_json → window.D`.
   Builds score/grade/exposure/fixes/frameworks + a `COMMERCE` scaffold → `D.pricing / D.pricingNotes / D.addons / D.addonsMore / D.upsellProof`. `D.unlocked` at L1467.
3. `functions/audit/_shell.js` (74 ln) — `renderShell(D)`: emits `<head>` (title already **"The Exposure Report · Tamazia"**),
   injects `window.D` as inline JSON, links the 3 static assets with cache-bust token `_av` (currently **`r26`**).
4. `public/audit/audit-app.js` (1095 ln) — **THE CLIENT RENDERER. The whole conversion surface lives here**
   (rail, panes, `planAndPricing()`, the commerce wiring: intake modal → `/api/intent` → Cal embed; add-ons → `/api/stripe/checkout`).
5. `public/audit/audit-charts.js` (402 ln) — chart/finding primitives incl. the freemium lock `lockFix()` (L66-75).
6. `public/audit/audit.css` (1200 ln) — styles.
7. `functions/audit/_commerce.js` (188 ln) — SERVER commerce source: `ADDON_CATALOGUE`, `PRICING_TIERS`, `ONE_TIME_FIX_GBP`,
   Stripe price-id resolver (env, NOT set), Cal slug resolver. Used by `/api/intent` + `/api/stripe/checkout`, NOT by the render.

**TWO commerce sources exist** (must not drift): server `_commerce.js`/adapter `COMMERCE`, and the client display constants
in `audit-app.js` (`PRICING_TIERS_RENDER` L300, `ADDONS` L370, `FIX_SPRINT` L437, Route-3 L494-515). Per the render comment
(L268-273) **the pane is the display owner**; `planData()` reads ONLY `rec`/`popular` flags off `D.pricing`. So price edits
land in `audit-app.js`. NOTE: `dist/audit/audit-app.js` is a BUILT copy — edit ONLY `public/audit/audit-app.js`; CI rebuilds dist.

## 1. PRICING SOURCE OF TRUTH — `src/content/pricing.ts` (NOW EXISTS, verified this session)
All OS-V4 constants are present (they were absent at Mission-C discovery; landed since):
- `pricingContent.tiers[].priceGbp`: Foundation **2500**, Authority **4500** (mostPopular:true), Enterprise **9500**.
- `fixPacksGbp = { ten:7500, twenty:12500, thirty:17500 }`; `fixPacksLane = 'No retainer required. Buy the fixes, own the work.'`
- `exposureReportGbp = { unlock:750, monthlyCover:449 }`
- `entryAuditGbp = 1500`
- `independentSolutionsGbp` (8 keys): `websiteRemodelling {4800→2400}`, `aiAuthority {3000→1800}`, `icpOutreach {2800→1400}`,
  `onlinePersonalBranding {2200→1100}`, `instagramPresence {1800→900}`, `ymylContent {price:1200}`,
  `reputationCrisis {3000→1500}`, `gbpDomination {price:850}`.
- **882% check:** `pricing.ts` body copy uses **480%** ("480% peak client revenue growth over a two-year engagement (verified)", L104). No `882` literal in `pricing.ts` or anywhere under `public/audit/` or `functions/audit/` (grep clean). E9 already satisfied on the audit page.

**Single-source decision for the AUDIT page:** `audit-app.js` is a static asset and cannot `import` a `.ts` at runtime; no
Pages Function imports a `.ts` as a JS module anywhere in the repo (only string path refs in the content editor). esbuild/wrangler
transpiling a `.ts` import into a Function is untested here and `node` is unavailable locally to verify. **Chosen approach: option (b)** —
one canonical `PRICES` constant block at the top of `audit-app.js`, values copied EXACTLY from `pricing.ts`, with all scattered
literals refactored to read from it (drift-proof within the file, zero build risk). The `pricing.ts` numbers are the authority.

## 2. ENV / FOUNDER-BLOCKED vars (verified against the execution `.env`)
- `.env` HAS: `POSTHOG_KEY`, `POSTHOG_HOST`, `RESEND_KEY`, `CALCOM_API_KEY`, `NEON_URL`, `SLACK_BOT_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- `.env` does NOT have: `BOOKING_URL`, `CONTACT_PHONE`, `STRIPE_LINK_UNLOCK/COVER/FIX10/FIX20/FIX30`.
- `STRIPE_LINK_*`, `BOOKING_URL`, `CONTACT_PHONE` are referenced NOWHERE in the repo today — they are NEW vars this stream introduces.
  (Distinct from `_commerce.js`'s `STRIPE_PRICE_*`, which are Checkout-Session price IDs, also unset.)
- ⛔ FOUNDER-BLOCKED (build conditional, render only when set, NO placeholder when unset): `CONTACT_PHONE`, `STRIPE_LINK_UNLOCK`,
  `STRIPE_LINK_COVER`, `STRIPE_LINK_FIX10`, `STRIPE_LINK_FIX20`, `STRIPE_LINK_FIX30`.
- Wiring plan: `[[path]].js` reads these off `env` and passes them into the adapter ctx; the adapter exposes them on
  `window.D.links` (URLs) and `window.D.contactPhone`; `audit-app.js` renders each element ONLY when its value is a non-empty string.
- `BOOKING_URL`: also founder-pending today. Existing booking path already works via the Cal embed/intake (`tamazia/strategy-call`)
  and `mailto:founder@tamazia.co.uk`. E2's "Claim the session" button → `BOOKING_URL` when set, else falls back to the existing
  Cal intake (`data-book`), so it is never a dead button. `founder@tamazia.co.uk` always renders (not blocked).

## 3. LIVE MINTED PAYLOAD — field names recorded (Phase-0 requirement)
Pulled live from Neon `audit_pages` (328 rows). Sample: slug `irwin-mitchell` / hash `tY4JGaqQ` (irwinmitchell.com, legal, UK).
Live page reachable: `https://tamazia.co.uk/audit/irwin-mitchell/tY4JGaqQ` → **HTTP 200**, title "The Exposure Report · Tamazia". `payload_json` stored full-in-Neon (no `r2` flag on this row).

`payload_json` top-level keys:
`ai_citation, ai_readiness, applicable_frameworks, archive_date, authority, competitive_benchmark, content_gap, country,
detected_jurisdictions, detected_sector, domain, engine_jurisdictions, exec_summary, firm_profile, framework_last_reviewed,
framework_version, geo_probe, geo_visuals, glossary, jurisdiction_statement, keyword_map, lead_id, needs_review, news_map,
pointers, rules, scan, schema_version, screenshots, sector, trust_summary, via_archive`

`pointers[]` (53 here) item keys (the findings the render consumes):
`bingo{fix,problem}, breach_panel, bucket, checked_urls, citation, citation_url, confidence, enforcement_example, evidence,
evidence_quote, evidence_url, fact, fine_high_gbp, fine_low_gbp, framework_short, impact, kind, layman_explanation,
occurrence_count, occurrences, penalty, penalty_basis, recent_news, recent_ruling, recommendation, regulator, rule_type,
severity, signals, state, tamazia_fix_short`

Other sections: `scan{psi,counts{p0,p1,p2,total},markets,signals,final_url,reachable,scanned_at,site_scan_reachable}`,
`authority{cc_indexed_pages,last_updated,peer_source,ranked,top,you}`,
`geo_probe{competitor_consistency,from_cache,grounded,providers_used,repeatability,samples,share_of_voice,top_competitors}`,
`ai_readiness{blocked_ai_bots,has_llms_txt,has_org_schema,has_same_as,in_wikidata,score}`, `exec_summary` (string).

**KEY ZERO-BUG FACT:** pricing/addons/copy are 100% render-side (adapter `COMMERCE` + audit-app constants); they are NOT in
`payload_json`. So editing them re-renders every one of the 328 existing minted pages with the new copy on next load, and CANNOT
corrupt a minted page. The ONLY payload/render coupling is `unlocked` (Route-3 paywall) — its contract
(`data-subscribe`/`data-trial` + slug+hash capture in `startAddon`) must NOT change, or Stripe-webhook unlock breaks for all pages.

## 4. CURRENT STATE vs THE 10 EDITS (what is already done by PR #59/#60)
- C1 (title/subtitle) DONE — shell title + rail report name already present.
- E2/C2 credential: BOTH occurrences already exact (`LLM in International Business Law, King's College London`, rail L57 + plan L543).
  MISSING: the NEW founder block directly under the score header with the verbatim "A direct line to the founder…" copy + Claim button + founder@ email.
- E5/C5 fix-pack third price already **17500** (was 19500) ✅, but label/scope still `all`/"All issues" not "Top 30"; buttons still Cal (`data-book`), not Stripe-conditional.
- E8/C8 oncology block present (third-person, +96%, SEC Reg FD, hedge "one of the factors"). Matches `caseStudies.ts`. (The E8 "Beat 1/Beat 2 'Done by experts'" verbatim is NOT locatable in the repo or control folder — see report.)
- E9/C9 480-not-882 already satisfied on the audit page (no 882 anywhere in audit assets).
- E10 cal-webhook (`functions/api/cal-webhook.js`) ALREADY does HMAC verify → KV persist → Resend alert → Neon `cal_bookings` INSERT (lead-matched) → Slack+Telegram on new booking. The audit intake form (`openIntake`) already POSTs name/website(domain)/sector to `/api/intent`.

REMAINING GAPS this stream closes: E2 (founder-under-score block), E3 (drawer), E4 (tiers from one source), E5 (Top-30 label + Stripe-conditional buy),
E6 (£449 monthlyCover tier + offer copy), E7 (7+GBP independent-solution cards from pricing.ts), E10 (explicit booking form fields name/website/email/sector + PostHog identify), and threading the founder-blocked env conditionals.

## 5. BUILD/VERIFY CONSTRAINTS
- `node`/`npx`/`astro` NOT available on this Mac (`which node` → none). Cannot run `npm run build` / `astro check` / patch-dist gates.
  JS syntax check via JavaScriptCore `jsc` (ReferenceError on import/module = PASS; SyntaxError = FAIL). `.astro` = structural review only.
- Deploy is PR-only to main → GitHub Actions (build + patch-dist.js + wrangler) → ~35s → live. Bump `_shell.js` `_av` token on any
  `audit-app.js`/`audit.css` change so the 4h CDN cache busts.
- Neon = READ-ONLY (used it only to read a payload + page list). No DDL. Do NOT deploy. Do NOT merge.
