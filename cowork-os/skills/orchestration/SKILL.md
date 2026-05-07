---
name: tamazia-orchestration
description: Engine H. Weighted SMTP relay rotation. Triggers on "rotate SMTP", "which relay", "send via best relay", "orchestration check".
---

# Engine H · Orchestration

n8n W2. Pre-send check selects relay by:

1. Is healthy (no recent 429 burst, no 5% bounce rate in 24h)
2. Under daily quota (sent_today < daily_quota)
3. Best affinity to alias's day budget (more reputable relays for newer aliases)

## Default relay weights

| Relay | Weight | Daily cap (per domain) | Notes |
|---|---|---|---|
| Resend | 4 | unlimited | Highest reputation, primary for transactional |
| Brevo | 3 | 300 | Reliable, both domains verified |
| Mailjet | 2 | 200 | DKIM verified, SPF transient |
| SendGrid | 1 | 100 | Newest, lowest cap |

Round-robin within tied weight scores.

## Failure handling

- 429 from relay: pause relay 1h, route to next
- 5% bounce rate in 24h: W5 kill switch disables relay for 24h
- All relays unhealthy: master kill switch activates, alerts Aman via Slack

## Edit point H1

Weights override per Aman. e.g., if SendGrid IP reputation is best in your sector for a season, raise to 3.

## Postgres relay state table

```sql
SELECT name, daily_quota, sent_today, weight, healthy, last_failure_at 
FROM smtp_relays ORDER BY weight DESC;
```
