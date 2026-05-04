# Phase 4 Deep Roadmap · Production Hardening + Observability · 2026-05-05

Phase 0/1/2/3 closure verifies tamazia.co.uk is launched. Phase 4 makes it operationally bulletproof: every failure mode visible, every abuse path defended, every external dependency monitored. Each sub-item ends with a check that goes into the 21-level bug test (extended from 14).

## Sub-items (12)

### 4-1 · Cloudflare KV namespace + binding live

Create namespace `form_submissions`. Bind to Pages project under FORM_SUBMISSIONS. Verify by submitting a test record and inspecting the KV browser. Bug-test level: KV.put/get round-trip from /api/contact returns deduped=true on repeat.

### 4-2 · /admin/submissions dashboard

Auth-gated (ADMIN_SECRET) HTML page that lists submissions from KV. Filters by tab. Search by email. Export CSV. Bug-test level: GET /admin/submissions with valid secret returns >= 1 row after a test submission.

### 4-3 · WAF custom rules

Cloudflare WAF: block POST with empty UA, block UA matching curl/scrapy/python-requests/postman/insomnia, block ASNs known for spam (configurable env), challenge requests with no Accept-Language header. Bug-test level: forged UA returns 403.

### 4-4 · Rate Limit rules

3 zone-level rules:
- /api/contact 10 req / 5 min / IP
- /api/briefings 10 req / 5 min / IP
- /api/audit 60 req / hour / IP
All return 429 with Retry-After 300. Bug-test level: 11th request in same window returns 429.

### 4-5 · Cloudflare Turnstile

Generate site keys, embed widget on /contact and /briefings, validate token server-side in shared receiver. Bug-test level: missing turnstile token rejects with 400.

### 4-6 · Resend domain verification for tamazia.in

Add resend._domainkey TXT (Resend provides), append `include:_spf.resend.com` to existing tamazia.in SPF, wait for Resend domain status to flip to verified. Bug-test level: send test email from founder@tamazia.in via Resend API, mail-tester.com score >= 9.

### 4-7 · /api/health extended probe

Probe KV (write+read), Resend (auth check), DNS (CAA + DMARC), CSP report endpoint. Return JSON with each leg's status. Bug-test level: GET /api/health includes "kv": "ok".

### 4-8 · Watchdog Cron Worker

Cloudflare Worker on Cron Trigger every 15 min. Probes 6 endpoints (homepage, /contact, /briefings, /audit, sitemap, /.well-known/security.txt). On 2 consecutive failures, fires Resend alert email. Bug-test level: synthetic outage triggers alert within 30 min.

### 4-9 · Sentry / error tracking

Wire Sentry SDK in Cloudflare Functions and the Astro client. Capture unhandled errors, unhandled rejections, CSP violations, network errors. Bug-test level: throw new Error("test-sentry") inside /api/health appears in Sentry dashboard.

### 4-10 · Cloudflare Logpush

Push HTTP request logs to a log endpoint (Logflare free tier or self-hosted). Retain 30 days. Bug-test level: known request appears in Logflare within 60 seconds.

### 4-11 · Status page

status.tamazia.co.uk · simple Cloudflare Pages site that renders /api/health output as a green/red dashboard. Public. Updates every minute. Bug-test level: status.tamazia.co.uk returns 200 with current status JSON.

### 4-12 · Annual penetration test scheduled

Sign up for a continuous bug bounty platform (HackerOne for early-stage / public program OR YesWeHack). Or a one-shot pen test from a UK boutique (£3-5k). Document the cadence in /security-policy/. Bug-test level: pen test report exists in a private folder with > 0 findings or "no findings".

## Phase 4 closure criteria

- All 12 sub-items above implemented and pushed
- 21-level bug test 21/21 green
- securityheaders.com A+ grade
- mozilla observatory A grade
- mail-tester.com >= 9/10
- Lighthouse >= 95 on /home, /contact, /briefings, /case-studies
- Pa11y zero violations
- Postmark DMARC dashboard clean for 7 days
- Sentry shows zero unresolved errors for 24 hours

## Phase 5 onwards (parking lot)

| Phase | Scope | When |
| --- | --- | --- |
| Phase 5 | Cal.com integration · 30-min strategy call event + booking webhook | After Phase 4 |
| Phase 6 | SEO + Analytics · GSC + GA4 + Bing + IndexNow + CF Web Analytics | Parallel to Phase 5 |
| Phase 7 | Compliance · ICO registration + Article 14 + DPA + footer identity | Parallel |
| Sprint C | Cowork OS foundation + Engine A sourcing + Engine B enrichment | After Phase 5/6 |
| Sprint D | Engine C research + D proposals + E sequences + F triage | After Sprint C |
| Sprint E | Single-command launch · UK aesthetic clinics target | Final |

## Gap log promotion (from previous session italics)

The 100-gap italic log lives at the bottom of session checkpoints. The genuine 30 gaps that should fold into Phase 4 work directly:

- KV namespace creation (4-1)
- ADMIN_SECRET (4-2)
- /admin dashboard (4-2)
- WAF UA blocklist (4-3)
- Rate limits (4-4)
- Turnstile (4-5)
- Resend verify (4-6)
- KV health probe (4-7)
- Watchdog Cron (4-8)
- Sentry (4-9)
- Logpush (4-10)
- status.tamazia.co.uk (4-11)
- Pen test (4-12)

The remaining gaps (50-77 + 80-100) are smaller polish items folded into the per-sub-item work above OR into the Sprint C/D/E plans where they are content rather than infrastructure.

## What I'm doing right now

Wave 10 batch commit closes ~30 italic gaps in one commit:
- /admin/submissions HTML page
- /api/health extended with KV probe
- patch-dist.js 15th check for new legal pages
- bug test #4 repointed at admin auth
- _redirects dead rewrite removed
- humans.txt build hash injected at deploy time
- Cookie banner gtag queue pattern
- TTL by record-type in shared receiver
- WAF UA check at the function layer (defence-in-depth before the WAF UI rules)
- Per-mailbox password rotation script in scripts/
- DPO assessment doc
- Article 14 template
- DPA template
- 5 minor copy fixes

Then Chrome MCP drives:
- KV namespace creation
- ADMIN_SECRET env var
- Resend domain verify
- iodef CAA on .in

Last updated 2026-05-05.
