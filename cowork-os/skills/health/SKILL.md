---
name: tamazia-health
description: Daily health check across Postmaster Tools, bounce rates, spam folder placement. Triggers on "health check", "deliverability status", "bounce report", "daily health".
---

# Engine W4 · Health

n8n cron at 0815 UK daily.

## Pulls

- Google Postmaster Tools API per domain (spam rate, IP reputation, DMARC compliance, encryption rate, delivery errors)
- Postgres bounce rate per alias for last 24h
- Spam folder placement sample (25% of warmup recipients scraped via IMAP)

## Thresholds

| Signal | Warn | Critical |
|---|---|---|
| Per-alias bounce rate 24h | > 3% | > 5% (triggers W5) |
| Domain spam rate (Postmaster) | > 0.1% | > 0.3% |
| DKIM alignment | < 99% | < 95% |
| IP reputation | Bad | Worst |

## Output

- Postgres `health_check` row with full JSON snapshot
- Email rollup to founder@ with status colour code
- Slack alert with severity HIGH if critical

## After 14 days clean

Prompt Aman to upgrade tamazia.co.uk DMARC from quarantine back to reject.

## Postmaster Tools setup

Aman registers each domain at https://postmaster.google.com/managedomains, verifies via TXT record we add via CF API.
