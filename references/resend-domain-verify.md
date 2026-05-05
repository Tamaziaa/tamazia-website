# Resend domain verify · tamazia.in · 2026-05-05

## Status

Domain `tamazia.in` added to Resend account `realfamemedia` at https://resend.com/domains. The domain ID is `8ee66c30-ccc4-4d3e-b6d4-ad90013a8e31`. Region: Ireland (eu-west-1).

## DNS records Resend wants on tamazia.in

| Type | Name | Content (abbreviated) |
| --- | --- | --- |
| TXT | resend._domainkey | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDJ...wIDAQAB |
| MX | send | feedback-smtp.eu-west-1.amazonses.com (priority 10) |
| TXT | send | v=spf1 include:amazonses.com ~all |

Note · Resend uses a `send.tamazia.in` subdomain rather than amending the root SPF. This means the existing root SPF `v=spf1 a mx include:webhostbox.net ~all` stays as-is for inbound mail handling; only outbound transactional from Resend uses the `send.tamazia.in` subdomain envelope.

## Two paths

Path A · Resend Auto configure (RECOMMENDED · 30 seconds)
- Click "Go to Cloudflare" button on the Resend UI
- Authorise the Cloudflare app integration once
- Resend programmatically adds the 3 records via Cloudflare API
- Verification flips to green within 60 seconds

Path B · Manual DNS at Cloudflare (5 minutes)
- Get full values from https://resend.com/domains (click each record to expand)
- Add 3 records at Cloudflare DNS for tamazia.in
- Click "Verify" in Resend
- Wait for green status

## After verification

Resend transactional email from `founder@tamazia.in` will be DKIM-aligned. The auto-acknowledgement in our forms-receiver currently sends from `Tamazia <onboarding@resend.dev>` because Resend's onboarding domain is unverified-friendly. Once tamazia.in is verified, change the env var:

```
CONTACT_FROM=Tamazia <founder@tamazia.in>
```

And in wrangler.toml the [vars] block already defaults to `RESEND_FROM_ACK = "Tamazia <founder@tamazia.in>"` so no code change needed.

## Bug-test

After verification:

```
curl https://api.resend.com/emails -X POST \
  -H "Authorization: Bearer re_dEbinPFH_3GKvAhvcbAfy5HgzK2mqJEkh" \
  -H "Content-Type: application/json" \
  -d '{"from":"Tamazia <founder@tamazia.in>","to":["realfamemedia@gmail.com"],"subject":"Resend verify test","html":"<p>If you see this with dkim=pass header.d=tamazia.in, verification worked.</p>"}'
```

Open the message in Gmail and View Original. Look for `dkim=pass header.d=tamazia.in`.

Last updated 2026-05-05.
