# JMRP (Microsoft) · architectural block · 2026-05-05

## Why JMRP cannot be enabled today

JMRP requires WHOIS-verified ownership of the sending IP. Our sending IPs:

1. **Resend (transactional)** — IPs managed by Resend Inc. JMRP already configured by Resend on their pool.
2. **BigRock `162.241.148.160` (Send-As personas)** — shared hosting. WHOIS abuse contact is `abuse@iana.org` (generic IANA fallback). We cannot click verification links sent there.

## What was attempted

Account: amanpareek99@outlook.com
URL: https://sendersupport.olc.protection.outlook.com/snds/Jmrp
IP submitted: 162.241.148.160
Authorization email returned by WHOIS: abuse@iana.org → unreachable

## Resolution

JMRP unnecessary for current architecture. Resend handles MS deliverability for our transactional pool. DKIM + SPF + DMARC alignment confirmed via Postmaster Tools (verified) + Postmark DMARC Digests (live). Spam complaints route through DMARC reports.

**Revisit JMRP when Tamazia gets a dedicated sending IP** (paid Resend tier or self-hosted Postal).

Last updated 2026-05-05.
