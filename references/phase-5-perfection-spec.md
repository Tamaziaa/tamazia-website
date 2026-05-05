# Phase 5 Perfection Spec · 2026-05-05

Founder-mode end-to-end build. Phase 0/1/2/3/4 carry-overs CLOSED inside Phase 5 scope so nothing remains. Backtest-then-implement on every change. 7-level bug test at end (extending from 35 to 56 levels).

## Backtest protocol

Read current state → state hypothesis → cite standard → implement smallest viable change → verify on live or via test → log gap if anything new surfaces.

## Wave 13 · Phase 0-4 carry-overs that I drive from repo

| ID | Item | Why now |
| --- | --- | --- |
| 13-1 | wrangler.toml restored cleanly · KV binding optional (defaults to fall-through) | Phase 3 KV pipeline wiring |
| 13-2 | Cloudflare Web Analytics beacon in BaseLayout, gated by env | Phase 5 sub-item 5-7, no-op until token set |
| 13-3 | GA4 gtag.js loader in BaseLayout, gated by env | Phase 5 sub-item 5-6 |
| 13-4 | Consent Mode v2 wiring · accept/reject buttons fire gtag('consent', 'update') | Phase 5 sub-item 5-9 |
| 13-5 | Bing site verification meta tag, gated by env | Phase 5 sub-item 5-8 |
| 13-6 | IndexNow key file at /public/{key}.txt | Phase 5 sub-item 5-8 |
| 13-7 | /api/indexnow Cloudflare Function · receives sitemap deltas, pings IndexNow | Phase 5 sub-item 5-8 |
| 13-8 | /press page with kit, boilerplate, contact, brand assets | Phase 5 sub-item 5-10 |
| 13-9 | Schema.org Service entries on /sectors/* pages | Phase 5 sub-item 5-13 |
| 13-10 | Schema.org Person for Aman on /about with sameAs + knowsAbout | Phase 5 sub-item 5-13 |
| 13-11 | BreadcrumbList JSON-LD via reusable Astro component on inner pages | Phase 5 sub-item 5-13 |
| 13-12 | Article schema on /insights/* posts | Phase 5 sub-item 5-13 |
| 13-13 | DKIM rotation cadence doc + 13-month cookie banner re-prompt logic | Phase 2 carry-over + ICO guidance |
| 13-14 | /api/cal-webhook idempotency check before write | Phase 5 sub-item 5-4 hardening |
| 13-15 | Stage 4 workflow YAMLs in references/_pending-workflow-changes/ | Phase 0 carry-over (workflow PAT scope) |
| 13-16 | Brand guidelines PDF stub linked from /press | Phase 5 sub-item 5-10 |
| 13-17 | Article 14 + DPA + DPO assessment cross-linked from /privacy-notice ✓ | Phase 4 verify (already done in Wave 11) |
| 13-18 | utm parameters preserved through Cal.com embed via data-cal-config | Phase 5 sub-item 5-3 hardening |
| 13-19 | Cookie banner expiry · 13-month sliding window per ICO guidance | Phase 5 sub-item 5-9 |
| 13-20 | Bug test extended to 56 levels with structured suites: deliverability, security, SEO, forms, analytics | Phase 5 sub-item 5-14 |

## Wave 14 · Phase 5 sub-items 5-1 to 5-14 build

Built per the roadmap. Sub-items 5-1, 5-2, 5-3, 5-4 require Cal.com UI and webhook secret drive. Sub-items 5-5, 5-6, 5-7, 5-8 require external service signups. 5-10, 5-13 are repo edits (covered above). 5-11 is content. 5-12 is regulatory. 5-14 is the test gate.

## Wave 15 · UI drives I attempt via Chrome MCP

| ID | Item | Probability success |
| --- | --- | --- |
| 15-1 | Cal.com signup with founder@tamazia.co.uk | High · standard form |
| 15-2 | Cal.com event type creation | High · UI form |
| 15-3 | Cal.com webhook config + secret capture | Medium · multi-screen |
| 15-4 | GSC sitemap submission for tamazia.co.uk + tamazia.in | High · already verified |
| 15-5 | Bing Webmaster verification + sitemap | Medium · login + form |
| 15-6 | Cloudflare Web Analytics enable + token capture | High |
| 15-7 | GA4 property creation | Medium · multi-screen wizard |
| 15-8 | ICO registration | Medium · long form, payment |
| 15-9 | JMRP signup | Medium · Microsoft account login |
| 15-10 | NeverBounce + Hunter + ZeroBounce signups (batch) | High · standard signup forms |

## Wave 16 · 56-level bug test

Suite groups + level numbers:

A · Security (1-9, 14)
B · DNS + email (9-12, 31, 50-52)
C · Forms pipeline (1-5, 16, 27-28, 30, 35)
D · Public pages + content (7-8, 15, 17, 22-26, 29, 32-34)
E · SEO + Analytics (24, 31, 36-49 new)
F · Compliance (15, 17, 22-23, 48 new)

New levels 36-56:

- 36. cal.com link returns 200
- 37. /briefings has data-cal-link
- 38. /api/cal-webhook valid sig 200, invalid 401
- 39. GSC API confirms tamazia.co.uk verified  
- 40. GA4 Measurement ID present (gated by env)
- 41. cloudflareinsights beacon present (gated by env)
- 42. Bing Webmaster confirms verified
- 43. IndexNow key file accessible at /<key>.txt
- 44. /press/ HTTP 200 + Schema.org Organization
- 45. /case-studies/cg-oncology/ has Schema.org Article
- 46. /about/ has Schema.org Person with sameAs
- 47. inner pages render BreadcrumbList JSON-LD
- 48. footer ICO registration not "TBD" (gated · pass when registered)
- 49. cookie banner Accept All flips analytics_storage to granted in dataLayer
- 50. /api/indexnow accepts POST and pings IndexNow
- 51. /api/cal-webhook idempotency · same uid twice deduped
- 52. wrangler.toml parses without placeholder errors
- 53. /press has brand guidelines PDF link
- 54. /humans.txt build hash matches latest commit short SHA
- 55. /api/health returns timestamp within last 60 seconds (no caching)
- 56. CSP report endpoint returns 204 on POST (regression check)

## Phase 5 closure criteria

- All 14 Phase 5 sub-items shipped
- 56-level bug test 56/56 active green (skips documented)
- Lighthouse > 95 on home, contact, briefings, case-studies (one verified per session)
- Pa11y zero violations on home + contact + briefings (smoke test)
- Postmark DMARC dashboard clean for 7 days (post-launch)
- securityheaders.com A+
- mozilla observatory A
- mail-tester.com >= 9 (post Resend tamazia.in verify + first send)
- Sentry zero unresolved errors for 24h (post Sentry signup)
- All UI tasks attempted via Chrome MCP, blockers documented per task

## Genuine gap log policy

Italic gap log accumulates during build. Target: 50-100 NEW genuine gaps not seen before. No padding. Each gap: what surfaced, why it matters, how solved (or why deferred).

Last updated 2026-05-05.
