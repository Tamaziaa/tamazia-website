# DMARC Monitoring · Postmark DMARC Digests

Set up 2026-05-04 by Cowork session. Free weekly digest service from Postmark (now owned by ActiveCampaign). Aggregates DMARC XML reports from Google, Microsoft, Yahoo, Comcast and other ISPs into a readable weekly email summary.

## Where reports go

| Domain | Postmark rua endpoint | Postmark API token |
| --- | --- | --- |
| tamazia.in | re+q8rbmufuzj6@dmarc.postmarkapp.com | 8233942a-3d61-4d27-99e2-9ca104819d1e |
| tamazia.co.uk | re+fjumimj9rsu@dmarc.postmarkapp.com | de94e017-0587-43e6-930e-ebb388da8a5e |

DMARC TXT records on both domains have rua set as a comma-separated list with Postmark FIRST and amanpareek.pareek@gmail.com second. ISPs send to both; Postmark aggregates, Gmail keeps raw XML for forensic review.

## Reading the weekly digest

Postmark sends a weekly email each Monday morning with:

- Total emails seen sending as the domain
- Total passing SPF or DKIM
- Total failing both
- Per-source breakdown (which IPs sent mail claiming to be from the domain)
- "Other sources" panel: traffic Postmark cannot map to a known sending service · these need investigation since they may be spoofers

## Decision rule for moving DMARC strictness

Move from p=none to p=quarantine only when ALL of the following are true for two consecutive weeks:

1. Total emails passing SPF or DKIM is at least 99 percent of total seen.
2. The "Other sources" panel is empty or contains only known forwarders.
3. The legitimate sources list shows BigRock IP 162.241.148.160 (for .in) or _spf.mx.cloudflare.net (for .co.uk) with 100 percent DKIM pass.

Move from p=quarantine to p=reject after another two clean weeks. Update the DMARC TXT in Cloudflare DNS by replacing `p=none` with `p=quarantine` then `p=reject`.

## Developer API access

The API tokens above can pull JSON reports programmatically. Endpoint: https://dmarc.postmarkapp.com/records/my/{api_token}/. Useful when we wire the dashboard widget in Phase 6 or want to ingest digests into Cowork OS.

## Phase 2 sub-item closure

This file closes Phase 2 sub-item 8. dmarcian was the original choice but their free tier is gone in 2026; Postmark DMARC Digests deliver equivalent visibility for free.
