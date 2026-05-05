# Phase 4 Perfection Spec · 2026-05-05

Founder-mode end-to-end build. Phase 0/1/2/3 carry-overs CLOSED inside Phase 4 scope so nothing remains. Backtest-then-implement protocol on every change.

## Backtest protocol

Every sub-item starts with: read current state, state hypothesis, cite standard or vendor doc, implement smallest viable change, verify on live or via test, log gap if anything new surfaces.

## Wave 11 · Phase 0/1/2/3 carry-overs that ARE doable from repo

| ID | Item | Why now |
| --- | --- | --- |
| 11-1 | Contact form HTML adds hidden ts_form_open + honeypot inputs | Closes bug-test level 2 SKIP |
| 11-2 | /api/audit rewired to shared KV receiver pattern | Was missing from Wave 8 |
| 11-3 | /api/cal-webhook stub for Phase 5 booking ingestion | Pre-wires Cal.com integration |
| 11-4 | Turnstile widget rendered on /contact + /briefings (CSP-compatible) | Phase 3 sub-item 3-5 close |
| 11-5 | /api/health probes Resend auth + DNS state via DoH | Closes /api/health partial coverage |
| 11-6 | Footer renders company name + Indian registered office address visible | Companies Act trading disclosure compliance |
| 11-7 | RSS feed at /insights/feed.xml | Discoverability |
| 11-8 | OG image dynamic per page · static fallback | Open Graph quality |
| 11-9 | Web app manifest tested + theme-color + msapplication-TileColor metas | PWA basics |
| 11-10 | Article 14 + DPA template files visible in repo with proper headers | Compliance posture |

## Wave 12 · Phase 4 build (10 sub-items)

| ID | Item | Spec |
| --- | --- | --- |
| 12-1 | Cloudflare WAF custom rule · UA blocklist | Block POST with empty UA, curl, scrapy, python-requests, postman, insomnia |
| 12-2 | Cloudflare Rate Limit · 3 zone rules | /api/contact 10/5min, /api/briefings 10/5min, /api/audit 60/hr (all 429 + Retry-After 300) |
| 12-3 | Turnstile site keys generated + embedded | Server-side validation in shared receiver pattern |
| 12-4 | Cron Trigger watchdog Worker | Probes 6 endpoints / 15 min, alerts on 2-consecutive-fail |
| 12-5 | Sentry SDK in Cloudflare Functions + client | Captures unhandled errors, CSP violations, network errors |
| 12-6 | Logpush to Logflare free tier | 30-day retention, queryable |
| 12-7 | status.tamazia.co.uk live | Reads /api/health, public, auto-refresh |
| 12-8 | Pen test schedule documented | Bug bounty program OR boutique pen test annual cadence |
| 12-9 | SSL Labs A+ verified | Re-test after CSP + HSTS preload |
| 12-10 | Mozilla Observatory A+ verified | Same, post-deploy |

## Wave 13 · Compliance + identity

| ID | Item | Spec |
| --- | --- | --- |
| 13-1 | ICO registration (Aman as DC) | £40/yr, online form |
| 13-2 | Footer · company name + reg number + address visible | Companies (Trading Disclosures) Regs 2008 |
| 13-3 | Schema.org Organization full address + sameAs | LinkedIn, GitHub, Crunchbase if present |
| 13-4 | DPO assessment doc visible (already written) | Phase 4 verifies it links from /privacy-notice/ |
| 13-5 | Article 14 template visible in repo (already written) | Phase 4 verifies link from /privacy-notice/ |
| 13-6 | Modern Slavery Statement linked from footer | Already exists at /modern-slavery-statement/ · just add footer link |

## Wave 14 · Phase 4 7-level bug test

Levels (in addition to the existing 21):

22. Footer renders company name + address on every page
23. Schema.org Organization has full sameAs array
24. RSS feed at /insights/feed.xml validates
25. /api/audit rewired and accepts POST
26. theme-color + msapplication-TileColor present in head
27. /api/health includes "resend" status field
28. Contact form HTML carries ts_form_open hidden input

## What "perfection" means for Phase 4 closure

- All 7 new bug-test levels green (28-level test total)
- Lighthouse > 95 on home, contact, briefings, case-studies
- Pa11y zero violations
- securityheaders.com A+ grade
- mozilla observatory A grade
- No items remain in pending column for Phase 0/1/2/3 except Aman-only manual UI tasks
- All 10 Phase 4 sub-items deployed and live

## What I'm doing right now

Wave 11 first (Phase 0-3 carry-overs that I can drive from repo edits) → Wave 12 (Phase 4 build) → Wave 13 (compliance) → Wave 14 (7-level test). One mega-commit per wave to keep deploy iterations fast.

Last updated 2026-05-05.
