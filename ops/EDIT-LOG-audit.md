# EDIT-LOG — Audit page (BUILD STREAM P1 / OS-V4)
Branch `v4-p1-audit` · base `46c20c0`. One E-ID per commit. Render layer + booking flow only. Engine OFF-LIMITS.
All prices sourced from the single `PRICES` block in `audit-app.js` (copied EXACTLY from `src/content/pricing.ts`).
Founder-blocked elements render ONLY when their env var is set (no placeholder when unset).

| ID | What | Files | Status |
|----|------|-------|--------|
| E0 | Phase-0 precheck (architecture, payload field names, env audit) | ops/PRECHECK-audit.md | logged |
| E1 | Single `PRICES` constant block (mirror pricing.ts) + thread founder-blocked env (links/phone/posthog) through `[[path]].js`→adapter→`window.D` | audit-app.js, functions/audit/[[path]].js, functions/audit/_adapter.js, _shell.js (_av r26→r27) | DONE |
| E2 | Founder session block directly under the score header (verbatim copy + Claim button + founder@ email; phone conditional) | audit-app.js, audit.css | DONE |
| E3 | In-page pricing slide-over drawer (sticky "Plans" pill + each fix link; restores scroll; no nav) | audit-app.js, audit.css | pending |
| E4 | Retainer tiers from `PRICES` (Foundation 2500 / Authority 4500 popular / Enterprise 9500), results-led, "online personal branding" bullet | audit-app.js | DONE |
| E5 | Fix packs one-time lane (10=7500/20=12500/30=17500) from `PRICES`; lane copy; Stripe-conditional buy buttons | audit-app.js | pending |
| E6 | Route-3 recurring: golden line + £750 unlock / first month cover included / then £449/mo; specs w/ hover; absorb Compliance-Monitoring + Reg-Change-Alerts; cold pages skip paywall; Stripe-conditional | audit-app.js, audit.css | pending |
| E7 | Independent Solutions: 7 cards + GBP £850 from `PRICES`, struck-anchor→offer, 5 steps each, scope line, disclosure paragraph; Stripe-conditional add | audit-app.js | pending |
| E8 | Verify oncology block (locked copy) | audit-app.js | pending |
| E9 | Ensure 480% (not 882%) on the audit page; verify pricing.ts | audit-app.js, src/content/pricing.ts | pending |
| E10 | Booking form on the audit (name, website, email, sector) + PostHog identify + form-fill event; verify cal-webhook (Resend + Neon cal_bookings + Slack/Telegram) | audit-app.js, functions/api/cal-webhook.js (verify) | pending |
