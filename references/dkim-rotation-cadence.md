# DKIM Rotation Cadence · 2026-05-05

## Recommended cadence

Annual rotation. Generate new 2048-bit RSA keypair via BigRock cPanel + Cloudflare DNS for tamazia.in. Same for Cloudflare Email Routing-managed cf2024-* selector for tamazia.co.uk (Cloudflare auto-rotates · no action needed beyond awareness).

## Procedure for tamazia.in

1. cPanel → Email Deliverability → Manage tamazia.in.
2. Click "Generate New Key". Choose 2048-bit RSA.
3. cPanel exposes new TXT record value at default._domainkey.tamazia.in.
4. Add new record at Cloudflare DNS as default-2026._domainkey.tamazia.in (use a dated selector).
5. Wait 24 hours for DNS propagation.
6. Update cPanel DKIM signing config to use the new selector.
7. Send a test email and verify dkim=pass header.d=tamazia.in selector=default-2026.
8. After 7 days of clean Postmark digests, delete the old default._domainkey record.

## Calendar reminders

Annual reminder to amanpareek.pareek@gmail.com on 1 May each year.

## Cookie banner re-prompt

ICO guidance is to re-collect consent every 13 months. Implementation:
- localStorage key 'tamazia-cookie-consent' stores `{decision: 'accept'|'reject', ts: epochMs}`
- On page load, check ts within (now - 13*30*86400000) ms
- If older, treat as no-decision and re-prompt

This is wired in BaseLayout cookie banner JS as part of Wave 13.

Last updated 2026-05-05.
