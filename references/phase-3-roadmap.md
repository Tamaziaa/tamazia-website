# Phase 3 Deep Roadmap · Forms Infrastructure End-to-End

Auto-generated 2026-05-04 by Cowork session. This document is the canonical source of truth for Phase 3. Phase 3 closes the gap between "the contact form posts somewhere" and "every submission is captured, scored, deduplicated, alerted, replied-to, and feeds the sales engine".

## Why Phase 3 matters

Without it, every campaign Aman sends from the 5 personas hits a brand site whose contact form silently swallows replies. Investor-grade hygiene requires a closed-loop receipt-to-acknowledge-to-pipeline flow.

## Architecture in one diagram

```
[Visitor on tamazia.co.uk/contact]
        |
        | POST {name,email,company,intent,utm,turnstile_token,ts_form_open,honeypot}
        v
[Cloudflare Pages Function /api/contact]
        |   1. Validate Turnstile secret
        |   2. Reject if honeypot filled
        |   3. Reject if (now - ts_form_open) < 2000ms
        |   4. Generate request_id (uuid)
        |   5. Sign payload with SHEETS_HMAC_SECRET
        |   6. Forward to Apps Script
        |   7. On 5xx: write to KV form_submissions:{request_id}, return 202
        v
[Apps Script Web App receiver]
        |   1. Verify HMAC header
        |   2. Append row to right tab in Submissions Sheet
        |   3. Resend transactional email to amanpareek.pareek@gmail.com (alert)
        |   4. Resend transactional auto-ack from founder@tamazia.in to submitter
        |   5. If intent mentions meeting, paired row in bookings tab
        |   6. Return {ok:true, request_id}
        v
[Visitor receives 200 + thank-you screen]
[Aman receives alert email within 60s]
[Submitter receives auto-ack within 60s]
```

## The 12 sub-items

### 3-1 · Tamazia Form Submissions Sheet (canonical store)

Single Google Sheet titled "Tamazia Form Submissions". Tabs:

- contact · marketing form on /contact and homepage
- briefings · regulatory briefing requests on /briefings
- audit · /audit submissions (different schema since asks URL not contact)
- bookings · Cal.com hooks land here too (Phase 5)
- errors · 4xx/5xx return from any leg of the pipeline
- health · synthetic probes from watchdog

Each row carries: submitted_at (ISO 8601 UTC), tab_source, name, email, company, phone, intent_text, consent_legal_basis, consent_timestamp, ua, ip_country, ip_truncated, referer, utm_source, utm_medium, utm_campaign, utm_content, utm_term, honeypot_value, time_on_form_ms, form_version, request_id, notes.

The errors tab logs full payload for forensic recovery.

### 3-2 · Apps Script Web App receiver

Bound to the Sheet. Standalone Web App deployed as `executeAs: ME` and `access: ANYONE`. URL becomes the canonical SHEETS_WEBHOOK_URL.

Six responsibilities:

1. Validate the shared HMAC header
2. Append row to the right tab
3. Fire Resend alert email to amanpareek.pareek@gmail.com
4. Fire Resend auto-ack to submitter from founder@tamazia.in
5. Write paired row in bookings tab if intent_text mentions a meeting
6. Return {ok:true, request_id}

HMAC stored in CF Pages env as SHEETS_HMAC_SECRET and in Apps Script Properties to keep the endpoint unspoofable even though the URL leaks in build artifacts.

### 3-3 · Cloudflare Functions: contact, briefings, audit submission

functions/api/contact.js exists. Rewire to forward POST body + headers to SHEETS_WEBHOOK_URL with HMAC. Same for briefings and audit.

Each Function: parses JSON, validates required fields, checks honeypot, checks time-trap (less than 2000 ms or more than 30 min equals reject), enforces CF Rate Limit (5 / IP / 5 min), forwards to Apps Script with retry on 502/503/504, returns {ok, request_id, message}.

Errors land in the errors tab via fire-and-forget.

### 3-4 · Cloudflare Rate Limit + WAF rules

Zone-level rules:

- /api/contact 10 req / 5 min / IP
- /api/briefings 10 req / 5 min / IP
- /api/audit 60 req / hour / IP (audit is heavier)

All return 429 with Retry-After 300.

WAF custom rule: block POST requests with empty User-Agent or matching curl/scrapy/python-requests strings.

### 3-5 · Bot defences

Honeypot field gtm_referer hidden via CSS + tab-index -1. Time-trap measured client-side then sent. Cloudflare Turnstile rendered on contact + briefings (audit stays open). Site keys env-injected, secret keys validated server-side before forwarding.

### 3-6 · Auto-acknowledge email via Resend

From: Tamazia <founder@tamazia.in>
Reply-To: founder@tamazia.co.uk
DKIM-aligned via tamazia.in domain in Resend dashboard.

Body: bilingual UK English, 100-150 words, names the persona who will respond, 1-business-day promise, links case studies, includes List-Unsubscribe RFC 8058 header.

Idempotent: same request_id does not double-send.

### 3-7 · Internal alert email

HTML template to realfamemedia@gmail.com with:

- Submission summary
- Common Room enrichment block if email matches existing contact
- Slack-able link

Subject: [Form: intent] name at company. Aman triages in Gmail without opening body.

### 3-8 · Resend domain wiring for tamazia.in

Add resend._domainkey TXT and append include:_spf.resend.com to existing SPF for tamazia.in. Without this, Resend transactional from founder@tamazia.in fails DMARC alignment.

DMARC stays p=none until SPF and DKIM both pass for two weeks per Postmark digest.

### 3-9 · Health check + watchdog

/api/health already exists. Extend to probe Apps Script via synthetic POST and return ok or degraded with details.

CF Worker Cron Trigger every 15 min hits /api/health. On degraded for two consecutive checks, fire Resend email to amanpareek.pareek@gmail.com.

### 3-10 · Submission dashboard widget

Cowork artifact with five KPI cards:

- Submissions today
- Week-over-week
- By-source (utm_source breakdown)
- By-country
- Average time-on-form

Auto-refresh from Sheets API every 5 min. Lives at a private route.

### 3-11 · Webhook ingestion redundancy

Apps Script writes to Sheet AND CF KV namespace form_submissions keyed by request_id. KV survives if Sheet rate-limits or temporarily unavailable.

Daily reconciliation Cron Trigger compares KV vs Sheet and inserts any missing rows.

### 3-12 · Phase 3 7-level bug test

scripts/p3-bug-test.sh runs:

1. Honeypot-only POST: expect 200 with silent ignore
2. Time-trap fail: expect 200 with silent ignore
3. HMAC missing: expect 401
4. HMAC wrong: expect 403
5. Apps Script down: expect 502 + KV write + retry succeeds
6. Sheet write fail: expect error tab populated + alert email
7. Auto-ack double-send guard: same request_id twice expects one ack only

Deploy gate runs all seven before main-merge.

## Sequence

| Day | Sub-items |
| --- | --- |
| 1 | 3-1 Sheet + 3-2 Apps Script receiver + 3-7 alert template |
| 2 | 3-3 CF Functions + 3-4 rate limits + 3-5 bot defences + 3-8 Resend wiring |
| 3 | 3-6 auto-ack + 3-9 watchdog + 3-10 dashboard |
| 4 | 3-11 KV redundancy + 3-12 bug test + Phase 3 closure verification |

## Dependencies and blockers

Phase 3 depends on:

- Phase 2 P2-9 Send-As (so auto-ack from founder@tamazia.in is plausible)
- RESEND_API_KEY already in .env.cloudflare (verified)
- Aman approval to use Cloudflare KV (free tier covers 1k reads/day, 1k writes/day · sufficient)

Phase 3 does NOT depend on:

- YAMM (P2-11, deferred to post-Phase-3)
- Cal.com (Phase 5, parallel)
- ICO registration (P31, parallel)

## Phase 3 closure criteria

All 12 sub-items done. 7-level bug test passes. One real submission flows through the full loop with all four side-effects observed: Sheet row, alert email, auto-ack email, request_id present in /api/health response.

## What changes after Phase 3 closes

Aman can safely begin outreach campaigns. Every reply email AND every form submission lands in Gmail with full provenance. The closed loop unblocks Sprint C engines (sourcing, enrichment) since they have a place to deposit qualified inbound.
