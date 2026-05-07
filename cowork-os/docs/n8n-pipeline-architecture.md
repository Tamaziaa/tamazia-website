# Tamazia · n8n Cold Outreach Pipeline · Architecture v1 · 2026-05-06

Single VPS on Hetzner CX22 (Ubuntu 24.04, 2 vCPU, 4GB RAM, 40GB SSD, ~£3.79/month). n8n self hosted via Docker. Postgres alongside for state. Caddy for HTTPS termination on the n8n editor URL.

---

## Five workflows. Defined separately so a failure in one does not cascade.

### W1. Warmup loop

Purpose: every alias sends and receives 5 to 10 inter alias emails per day with realistic jitter, building reputation against tamazia.co.uk and tamazia.in DKIM identities.
Trigger: cron, every 30 minutes between 0700 and 2200 UK time.
Logic: pick N source aliases (random within day budget), pick N destination aliases (different domain side preferred to test cross domain reputation), generate plausible thread bodies from a 500 line warmup corpus, send via SMTP rotation, mark thread as warmup so the IMAP listener in W3 archives the reply silently.
Day budget per alias scales by warmup curve: day 1 to 3 send 2, day 4 to 7 send 5, day 8 to 14 send 8, day 15+ send 10. Curve documented in references/email-warmup-curve.md.
Success metric: per alias delivered count, per alias reply count, per alias spam folder rate (sampled by IMAP scrape on a quarter of warmup recipients).

### W2. Send orchestration (cold outbound)

Purpose: dispatch personalized cold emails to leads.
Trigger: webhook from lead source (CSV import on Hetzner volume, Apollo MCP feed once activated, or manual paste in Cowork chat). Also a cron at 0900, 1100, 1400, 1600 UK time to drain pending queue.
Logic: read lead row, look up sector entry from sector-pitch-library, fill merge fields, pick next available alias by round robin within day quota, pick next SMTP relay by health score, dispatch. Per alias day quota = warmup quota minus warmup sends already used today.
Throttle: max 1 cold send per alias per 12 minutes to avoid burst patterns. Max 5 cold sends per alias per day until day 30 of warmup, then 10.
Reply rerouting: every cold send sets Reply To header to founder@tamazia.co.uk. Once CF Email Routing is live with the 90 forwarding rules, replies arrive at founder@ regardless.
Logging: every send writes to Postgres table sends with alias, recipient, sector, subject, smtp_relay, message_id, sent_at, status.

### W3. IMAP suppression listener

Purpose: parse founder@tamazia.co.uk Zoho mailbox for bounces, unsubscribes, and warm replies.
Trigger: cron, every 5 minutes.
Logic: connect to Zoho IMAP, fetch unread, classify each message:
- Hard bounce or soft bounce above threshold: extract recipient address, write to suppression table, immediately disable any pending sends to that address across all aliases.
- Unsubscribe (UNSUBSCRIBE in subject or body, or RFC 8058 List Unsubscribe header click): same path, also flag the lead row in Postgres and respond with confirmation email within 60 minutes.
- Warm reply: not auto handled. Instead push a Slack or email notification to Aman's preferred channel with the full thread, the alias used, the lead context. Aman writes the reply by hand in Cowork chat. Workflow waits.
- Warmup reply: archive in a warmup folder. No notification.
Suppression list is global. Once an address is suppressed it cannot receive any send from any alias forever unless Aman manually reinstates.

### W4. Daily health check

Purpose: monitor reputation and surface anomalies before they bite.
Trigger: cron, every day at 0815 UK time.
Logic: pull Postmaster Tools API for tamazia.co.uk and tamazia.in (spam rate, IP reputation, DMARC compliance, encryption rate, delivery errors). Pull bounce rate per alias from Postgres for last 24 hours. Pull spam folder placement sample from W1's mini scrape. Threshold check: if any per alias bounce rate above 5% in 24 hours, trigger W5. If domain spam rate above 0.3% per Google Postmaster, ping Aman with severity HIGH.
Output: a daily status row in Postgres table health_check, plus an email to founder@ with the rollup. After 14 days clean, prompt Aman to upgrade tamazia.co.uk DMARC from quarantine back to reject.

### W5. Bounce kill switch

Purpose: isolate bad aliases and bad SMTP credentials before they damage the rest.
Trigger: called by W4 when threshold breached.
Logic: identify offending alias or SMTP credential. Disable the alias in Postgres (sends queued for it pause). If SMTP relay is the offender, mark relay unhealthy and route all sends to the remaining healthy relays for the next 24 hours. Notify Aman with full diagnostic. Auto reinstate after 48 hours of clean signal unless Aman keeps the lock.

---

## Postgres schema (simplified)

- aliases: id, email, domain, persona_data_json, day_quota, warmup_day, status, created_at
- leads: id, company, sector, contact_first, contact_last, contact_title, email, city, product_line, status, source, imported_at
- sends: id, alias_id, lead_id, smtp_relay, subject, message_id, sent_at, delivery_status, opened_at, replied_at
- suppression: id, email, reason, suppressed_at, source_send_id
- health_check: id, domain, postmaster_data_json, alias_bounce_summary_json, spam_rate, checked_at
- smtp_relays: id, name, api_key_ref, daily_quota, sent_today, healthy, last_failure_at

---

## SMTP relay pool (4 free + Resend already live = 5)

| Relay | Free daily cap | Verification | Status |
|---|---|---|---|
| Resend | varies | both domains | Already live |
| Brevo | 300 | both domains | Pending key |
| Mailjet | 200 | both domains | Pending key |
| SendGrid | 100 | both domains | Pending key |
| Optional Amazon SES | up to 200 if uplifted | both domains | Optional, future |

Combined free capacity: ~700 to 800 a day, comfortably above the 450/day target across 90 aliases at 5 a day.

---

## Volume model and unit economics

- 90 aliases x 5 cold sends per day post warmup = 450 cold sends per day = 13.5K per month.
- Conservative cold reply rate at 1.5% on a regulated B2B audience = 6.75 replies a day = ~200 a month.
- Warm reply to call rate at 35% = ~70 founder calls a month.
- Call to engagement rate at 10% = 7 new clients a month at average £4,500 / month each = £31,500 incremental MRR a month, compounding.
- Cost: £4 a month VPS, £40 a year YAMM Pro already paid, £0 SMTP relays. Compute cost approximately zero.

---

## Failure modes and mitigations

1. SMTP relay throttles or 429s. Mitigation: round robin and per relay daily quota tracker in W2 plus W5 kill switch.
2. One alias goes spammy, drags reputation. Mitigation: per alias bounce threshold in W4 plus W5 isolates. Other aliases protected.
3. Zoho IMAP rate limits W3. Mitigation: 5 minute interval with exponential backoff, fall back to 15 minute interval if 429.
4. Lead list contains role addresses (info@, contact@). Mitigation: pre validation step in W2 strips role addresses before send, logs to Postgres rejected table.
5. n8n container crashes. Mitigation: Docker restart unless stopped policy, plus Hetzner snapshot every 6 hours, plus weekly off site backup to Cloudflare R2.
6. Aman wants to pause everything. Mitigation: master kill switch endpoint at /admin/pause that sets a global flag in Postgres. All workflows check this flag before any send.

---

## What I do once each API key arrives

1. CF token (after `cf done`): enable Email Routing on tamazia.in, add founder@tamazia.co.uk as verified destination, create 90 forwarding rules in one API pass. Verify with curl.
2. Hetzner token (after `hz <token>`): provision Ubuntu CX22 in Falkenstein region, install Docker via cloud init, install n8n via Docker compose, install Postgres via Docker compose, install Caddy via Docker compose, set DNS record for n8n.tamazia.co.uk pointing at the VPS. Verify n8n editor loads. Pass the editor URL to Aman.
3. Brevo key (after `brevo <key>`): add SPF and DKIM TXT records via CF API for both domains, complete sender verification flow via Brevo API, drop the API key into n8n encrypted credential vault.
4. Mailjet key (after `mj <api> <secret>`): same DNS verification flow, add to n8n.
5. SendGrid key (after `sg <key>`): add CNAME records via CF API for SendGrid sender authentication, verify, add to n8n.

After all five: import workflows into n8n, run W1 dry run for 24 hours with verbose logging, review with Aman, then enable W2 progressively as warmup curve allows.

End.
