# Phase 2 Status Snapshot · 2026-05-04

Email infrastructure milestones for tamazia.in and tamazia.co.uk.

## Closed (live and verified)

| Item | tamazia.in | tamazia.co.uk |
| --- | --- | --- |
| 5 mailboxes (beth.jana, callum.west, founder, george.west, katie.henderson) | LIVE | n/a |
| cPanel forwarders to amanpareek.pareek@gmail.com | LIVE 5 of 5 | n/a |
| Cloudflare Email Routing | n/a | LIVE catch-all to amanpareek.pareek@gmail.com |
| MX | mail.tamazia.in (BigRock) | route1/2/3.mx.cloudflare.net |
| DKIM 2048-bit | LIVE default._domainkey | LIVE cf2024-1._domainkey |
| SPF | LIVE webhostbox.net | LIVE _spf.mx.cloudflare.net |
| DMARC | LIVE p=none fo=1 adkim=r aspf=r | LIVE p=none fo=1 adkim=r aspf=r |
| DMARC reporting (Postmark Digests) | LIVE re+q8rbmufuzj6@dmarc.postmarkapp.com | LIVE re+fjumimj9rsu@dmarc.postmarkapp.com |
| DMARC backup rua | amanpareek.pareek@gmail.com | amanpareek.pareek@gmail.com |
| Google Postmaster Tools verification | VERIFIED | VERIFIED |
| Google Search Console (granted via Postmaster) | UNLOCKED | UNLOCKED |

## Open (manual click-through or deferred)

| Item | Status | Notes |
| --- | --- | --- |
| Gmail Send-As · 5 personas | DOC PUBLISHED | references/email-send-as.md · 5-7 min manual click-through |
| YAMM connection + Reply-To | BLOCKED | depends on Send-As |
| Microsoft JMRP (Hotmail/Outlook FBL) | NOT STARTED | quick signup |
| MTA-STS + TLS-RPT | DEFERRED | low marginal value before custom IP migration |

## Sources of truth

| File in repo | What it covers |
| --- | --- |
| references/email-send-as.md | 5-persona Gmail Send-As wizard checklist |
| references/email-reply-to-strategy.md | .in send + .co.uk receive loop architecture |
| references/email-dmarc-monitoring.md | Postmark DMARC Digests, API tokens, promotion path |

## Decision rule for promoting DMARC strictness

p=none → p=quarantine when two consecutive Postmark digests show 99 percent SPF or DKIM pass and "Other sources" is empty.

p=quarantine → p=reject after two more clean digests.

## Phase 2 closure path

The four items still open are documented and can be completed without additional Cowork sessions when Aman has 5-10 minutes to click through. Phase 2 email infrastructure is functionally complete: mail can be sent from any of the 5 .in personas with proper DKIM alignment, replies route to amanpareek.pareek@gmail.com from both .co.uk catch-all and .in forwarders, and DMARC is reporting via Postmark.
