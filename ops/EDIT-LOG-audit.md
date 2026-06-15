# EDIT-LOG — Audit page (BUILD STREAM P1 / OS-V4)
Branch `v4-p1-audit` · base `46c20c0`. One E-ID per commit. Render layer + booking flow only. Engine OFF-LIMITS.
All prices sourced from the single `PRICES` block in `audit-app.js` (copied EXACTLY from `src/content/pricing.ts`).
Founder-blocked elements render ONLY when their env var is set (no placeholder when unset).

| ID | What | Files | Status |
|----|------|-------|--------|
| E0 | Phase-0 precheck (architecture, payload field names, env audit) | ops/PRECHECK-audit.md | logged |
| E1 | Single `PRICES` constant block (mirror pricing.ts) + thread founder-blocked env (links/phone/posthog) through `[[path]].js`→adapter→`window.D` | audit-app.js, functions/audit/[[path]].js, functions/audit/_adapter.js, _shell.js (_av r26→r27) | DONE |
| E2 | Founder session block directly under the score header (verbatim copy + Claim button + founder@ email; phone conditional) | audit-app.js, audit.css | DONE |
| E3 | In-page pricing slide-over drawer (sticky "Plans" pill + lock-veil fix links; restores scroll; no nav; relocates live #sec-plan node so all ids/handlers/Cal survive) | audit-app.js, audit.css | DONE |
| E4 | Retainer tiers from `PRICES` (Foundation 2500 / Authority 4500 popular / Enterprise 9500), results-led, "online personal branding" bullet | audit-app.js | DONE |
| E5 | Fix packs one-time lane (10=7500/20=12500/30=17500) from `PRICES`; lane copy; Stripe-conditional buy buttons | audit-app.js | DONE (buy buttons ⛔ conditional, omitted until STRIPE_LINK_FIX* set) |
| E6 | Route-3 recurring: golden line + £750 unlock / first month cover included / then £449/mo; 8 specs w/ hover ?; absorbs Compliance-Monitoring + Reg-Change-Alerts; cold pages skip paywall; Stripe-conditional | audit-app.js, audit.css | DONE (Unlock/Cover buttons ⛔ conditional; data-subscribe contract preserved) |
| E7 | Independent Solutions: 7 cards + GBP £850 from `PRICES`, struck-anchor→offer, 5 steps each, scope line, disclosure paragraph; add buttons via existing /api/stripe/checkout fallback | audit-app.js, _commerce.js (aliases) | DONE (disclosure NOT verbatim-sourced — see report) |
| E8 | Verify oncology block (locked copy) | audit-app.js | VERIFIED (present, 3rd-person, +96%/SEC Reg FD/hedge; matches locked caseStudies.ts per MISSION-C-PLAN). "Beat 1/Beat 2 Done-by-experts" variant NOT in repo — see report |
| E9 | Ensure 480% (not 882%) on the audit page; verify pricing.ts | audit-app.js, src/content/pricing.ts | VERIFIED (no 882 in any audit asset; pricing.ts uses 480% two-year verified; no GA4-882 context to keep) |
| E10 | Booking form (name/website/email/sector) → /api/audit-request (Neon leads) + PostHog identify + form-fill/submit events; cal-webhook verified (Resend ack + Neon cal_bookings + Slack/Telegram) | audit-app.js, audit.css; functions/api/cal-webhook.js (verified) | DONE |

## MISSION C finish + adversarial audit (V2) — 2026-06-15
| ID | What | Files | Status |
|----|------|-------|--------|
| C7 | Replace Independent Solutions disclosure with EXACT OS-V4 C4 verbatim text (under the Independent Solutions group). Only deviation: `agency's`→`agency’s` (curly apostrophe, house typography). Render-sim confirms it in the DOM, old E7 disclosure gone. | audit-app.js:652 | DONE |
| C8 | Oncology block: NO code change. Build kept the live hedged third-person version (+96%, "one of the factors contributing", "Zero violations across the IPO window"); matches the locked src/content/caseStudies.ts. OS-V4 C6 "CG Oncology / nearly doubled / zero compliance incidents" variant left UNUSED. FLAGGED for founder; recommendation = keep the hedged version (safer; OS-V4 itself flags the two absolute claims as keep-only-if-defensible). | (no change) | FLAGGED |
| C-BUG1 | Exposure Report unlock/cover passed literal '£449'/'£750' to Commerce.startAddon → now `gbpFmt(PRICES.exposureReport.monthlyCover/unlock)`. Removes the last hardcoded display-price drift vs pricing.ts. Backend charge unaffected (server-side Stripe price_id), 'Compliance Monitoring' addon-name contract unchanged. | audit-app.js:978-979 | FIXED |
| C-BUG2 | Stripe checkout hardened: intake-only addon keys (website_remodelling, instagram_presence aliases) have no ADDON_CATALOGUE entry; the later ADDON_CATALOGUE[key].unit/.name reads could throw if a future STRIPE_PRICE_MAP resolved a price. Now falls back when key is not a real catalogue entry (mirrors the guard intent.js already uses). No behavior change today. | functions/api/stripe/checkout.js:48-52 | FIXED |
| C-FLAG3 | Copy-rule: 5 "we" instances remain in the RENDERED DOM (regulatory headlines audit-app.js:136-139, hero-chart titles 785/789, an urgent note 200, a stand-where line 718, plus error toasts 1204/1307). All PRE-EXISTING live engine copy, NONE in the C1–C10 scope. Not mass-rewritten (locked live copy; risky). FLAGGED. | audit-app.js (various) | FLAGGED |
| C-FLAG4 | /legal/service-terms page does NOT exist (only dpa/sub-processors/data-protection under src/pages/legal). The C7 disclosure names it verbatim per OS-V4, rendered as plain text (not a clickable dead link). Needs the page created OR the founder to confirm the path. | src/pages/legal/* | FLAGGED |

## V4 FIX AGENT WEB-A — audit money+security+data cluster (BUG-LEDGER-V4 Cluster 5) — 2026-06-15
Branch `v4-fix-audit` · base `bb38ba7` (origin/main, post-v4-polish). One commit per fix `fix(audit): <id> ...`. Render/commerce/audit-API only; AUDIT ENGINE off-limits (payload_json read-only). Prices from pricing.ts via the single PRICES block. SEND OFF. Stripe price IDs left env-driven (founder-blocked).

| ID | What | Files | Status |
|----|------|-------|--------|
