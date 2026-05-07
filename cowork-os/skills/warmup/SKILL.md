---
name: tamazia-warmup
description: Engine G. 90-alias warmup loop with day-quota curve. Triggers on "start warmup", "warm up aliases", "day N status", "warmup health".
---

# Engine G · Warmup

n8n W1 cron every 30 min, 0700-2200 UK time.

## Day budget per alias

```
Day 1-3:   2 sends/day
Day 4-7:   5 sends/day
Day 8-14:  8 sends/day
Day 15+:   10 sends/day
```

## Logic

1. Pick 5 source aliases at random (within quota)
2. Pick 5 destination aliases (different from source, prefer cross-domain co.uk ↔ in)
3. Generate plausible thread bodies from 500-line warmup corpus
4. Send via Brevo SMTP rotation (lowest-reputation cost relay first)
5. Mark thread `kind=warmup` so W3 archives reply silently

## Reputation signals to monitor

- Per-alias delivered count
- Per-alias reply count  
- Per-alias spam folder rate (sample 25% of warmup recipients via IMAP)
- Domain-level Postmaster Tools spam rate < 0.3%

## Promotion criteria

Move alias from `warmup_phase=active` to cold-eligible only when:
- Day 15+ reached
- 0 hard bounces last 7 days
- Spam folder rate < 5% on samples
- DKIM alignment 100%

## Reserve aliases

JSON has 5 personas marked `warmup_phase=reserve` per user. These stay parked until an active alias gets killed by W5 bounce kill switch, then a reserve takes its slot.
