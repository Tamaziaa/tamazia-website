# 30-day reputation curve · 90-alias warmup · Wave 52

## Why this curve matters

Tamazia.co.uk has zero email reputation history at major mailbox providers
(Gmail, Outlook, Yahoo, Apple). Even with perfect SPF/DKIM/DMARC, a fresh
domain spiking to 100 cold sends/day on day 1 will land 80% in spam folders
and burn the domain for 90 days. The curve below is the discipline.

## Day-by-day per-alias volume cap

| Days | Phase | Per-alias daily cap | Notes |
|------|-------|---------------------|-------|
| 1 to 7 | n8n internal warmup only | 0 cold | Aliases email each other + 5 aged Gmail buddy accounts. Replies, opens, marked-important. Zero external cold sends. |
| 8 to 14 | First cold trickle | 5-10 cold | Highest-quality leads only. Hand-personalised. Reply discipline: respond inside 60 min during business hours. |
| 15 to 21 | Volume ramp | 25 cold | Expand to second-tier leads. Still hand-curated. Bounce rate target <2%. |
| 22 to 30 | Steady state | 50 cold | Normal cold campaign cadence. n8n monitors per-alias bounce/complaint, auto-pauses if thresholds breached. |

## Kill switches (n8n auto-enforces)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Per-alias bounce rate | >5% in 24h | Disable alias's Zoho SMTP credential, alert in Slack |
| Per-alias complaint rate | >0.1% in 7d | Disable + investigate |
| Aggregate domain bounce rate | >3% in 24h | Pause ALL sending, escalate to founder |
| Aggregate complaint rate | >0.05% in 7d | Pause ALL sending, escalate to founder |

## YAMM-phase aliases (10 active)

These 10 personas go through Gmail Send-As setup manually (~1.5 hours):
1. Oliver
2. James Clark
3. William Edwards
4. Henry
5. Noah
6. Liam
7. Lucas
8. George Taylor
9. Jack Robinson
10. Harry

## Smartlead-phase aliases (80 reserve)

After day 21, all 90 are connected via SMTP to Smartlead.ai for parallel
multi-inbox campaigns. No Gmail Send-As needed for the 80 reserves.

## Pre-send list verification

Every recipient address must be ZeroBounce or NeverBounce verified as "valid"
within last 30 days before any send. n8n enforces.
