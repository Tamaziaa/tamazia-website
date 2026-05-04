# Email Reply-To Strategy · Tamazia 2026

Auto-generated 2026-05-04 by Cowork session at the moment Cloudflare Email Routing went live for tamazia.co.uk.

## Goal

Send outreach FROM .in (BigRock) to keep DKIM aligned and stay inside the existing 5-mailbox quota. Receive replies AT .co.uk (Cloudflare Email Routing catch-all) so the canonical brand domain owns the inbound conversation. Aman reads everything in amanpareek.pareek@gmail.com.

## How the loop closes

1. Aman composes in Gmail with Send-As beth.jana@tamazia.in
2. SMTP mail.tamazia.in:465 SSL · DKIM signed by default._domainkey.tamazia.in
3. Recipient inbox: From beth.jana@tamazia.in · Reply-To founder@tamazia.co.uk
4. Recipient hits Reply
5. Mail to founder@tamazia.co.uk
6. MX route1/2/3.mx.cloudflare.net
7. Cloudflare Email Routing catch-all rule
8. Forward to amanpareek.pareek@gmail.com
9. Aman replies from Gmail with Send-As beth.jana@tamazia.in
10. Loop continues

## Domain alignment quick reference

| Concern | tamazia.in | tamazia.co.uk |
| --- | --- | --- |
| Outbound | YES (BigRock SMTP, all 5 personas) | NO |
| Inbound | YES (cPanel forwarders, defensive) | YES (Email Routing catch-all, primary) |
| MX | 0 mail.tamazia.in (BigRock) | route1/2/3.mx.cloudflare.net |
| DKIM | default._domainkey 2048-bit | cf2024-1._domainkey 2048-bit |
| SPF | v=spf1 a mx include:webhostbox.net ~all | v=spf1 include:_spf.mx.cloudflare.net ~all |
| DMARC | p=none reporting to gmail | p=none reporting to gmail |
| Catch-all | NO (5 named mailboxes only) | YES → amanpareek.pareek@gmail.com |

## Why both forwarders AND catch-all

The .in cPanel forwarders are defensive against MUAs that ignore Reply-To headers and send replies straight to the From: address. With the forwarder, even those replies still reach Aman's Gmail. The .co.uk catch-all is the primary path because Reply-To is set on every campaign template.

## Future moves (deferred to later phases)

- Promote DMARC to p=quarantine after 14 days of clean reports.
- Promote DMARC to p=reject after 30 days of clean reports.
- Add MTA-STS and TLS-RPT records on both domains.
- Consider Cloudflare Email Workers for content-aware routing if catch-all volume grows.

Last updated 2026-05-04.
