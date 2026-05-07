# Tamazia Cowork OS · Credentials & Setup Reference

All API keys, tokens, and environment variables needed to run the pipeline. File path on disk: `/Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/.credentials/email-pipeline.env` (700 perms, gitignored).

## Required for outbound

| Service | Purpose | Status | How to obtain |
|---|---|---|---|
| `BREVO_API_KEY` | Outbound SMTP | Pending activation | Email contact@brevo.com after free signup |
| `MAILJET_API_KEY` | Outbound SMTP | WORKING | Mailjet dashboard → Account → API Keys |
| `MAILJET_SECRET_KEY` | Outbound SMTP | WORKING | Same |
| `SENDGRID_API_KEY` | Outbound SMTP | WORKING | SendGrid → Settings → API Keys → Full Access |
| `RESEND_API_KEY` | Outbound SMTP (transactional) | tamazia.in only | Resend → API Keys (need full-access for tamazia.co.uk) |

## Required for routing

| Service | Purpose | Status | How to obtain |
|---|---|---|---|
| `CF_API_TOKEN` (Zone Operator) | DNS + Email Routing | Active w/ scopes | Cloudflare → My Profile → API Tokens |
| `CF_ACCOUNT_ID` | Cloudflare account | `4a3b271b5f1f4cbfc16c6e9e5e62451b` | dashboard URL |

Token scopes:
- Zone DNS Edit (all zones)
- Zone WAF Edit (all zones)
- Zone Settings Edit (all zones)
- Account Access:Apps and Policies Edit
- Zone Email Routing Addresses Edit
- Zone Email Routing Rules Edit

## Required for inbox

| Service | Purpose | Status |
|---|---|---|
| Zoho Mail Free | founder@ master mailbox + 4 secondary mailboxes | Live |
| Zoho admin password | account-level admin | In `.credentials/email-pipeline.env` |

## Required for triage

| Service | Purpose | Status |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Warm reply routing | WORKING |
| `SLACK_TEAM_ID` | `T0B22Q3963Y` (Tamazia workspace) | Active |
| `SLACK_CHANNEL` | `#new-channel` (rename to `#tamazia-cold-replies` later) | Live |

## Required for VPS

| Service | Purpose | Status |
|---|---|---|
| Oracle Cloud Always Free tenancy | n8n + Postgres + Caddy host | Pending re-auth + finish provision |
| SSH keypair `tamazia-n8n` | VPS access | Generated, saved to `.credentials/ssh-keys/` |

## n8n credential vault entries (after VPS up)

When importing workflows into n8n, set these in n8n → Credentials → New:

1. **Postgres** — host: postgres, port: 5432, database: n8n, user: n8n, password: from .env POSTGRES_PASSWORD
2. **Brevo HTTP** — header `api-key` = $BREVO_API_KEY
3. **Mailjet HTTP** — basic auth `MAILJET_API_KEY:MAILJET_SECRET_KEY`
4. **SendGrid HTTP** — bearer `$SENDGRID_API_KEY`
5. **Resend HTTP** — bearer `$RESEND_API_KEY`
6. **Slack webhook HTTP** — URL = $SLACK_WEBHOOK_URL
7. **Zoho IMAP** — host: imappro.zoho.eu, port: 993, TLS, user: founder@tamazia.co.uk, password: $ZOHO_FOUNDER_PASSWORD

## Setup checklist

```
[x] Tamazia.co.uk and tamazia.in DNS on Cloudflare
[x] DKIM/SPF for Resend, Brevo, Mailjet, SendGrid on both domains
[x] DMARC published (p=quarantine on .co.uk, p=reject on .in)
[x] Zoho Mail org provisioned, MX swapped, founder@ live
[x] 5 Zoho users created (founder + hello + sales + support + Legal)
[x] 45 .co.uk aliases distributed 9 per user
[x] Slack workspace + webhook
[x] CF Email Routing enabled on tamazia.in (MX swapped from BigRock)
[ ] CF Email Routing destination founder@tamazia.co.uk verified
[ ] 45 CF Email Routing rules for .in aliases (will fire on dest verify)
[ ] Brevo SMTP activation
[ ] Resend tamazia.co.uk domain verification
[ ] Oracle VPS provisioned + n8n stack installed
[ ] n8n W1-W5 workflows imported and activated
[ ] First 50-lead pilot run on UK boutique hotels
[ ] Postmaster Tools registration per domain
[ ] Entity question resolved (A/B/C)
[ ] Footer rebrand to UK Ltd entity
```

## Standing risks

1. **Brevo activation**: 24-48h, can stall pipeline at 300/day until cleared
2. **Resend domain verification**: blocks tamazia.co.uk transactional sends
3. **Oracle ARM capacity**: occasional unavailability in some regions, retry 1-2h later
4. **Zoho free tier 5-user cap**: hit. No room to add more secondary mailboxes
5. **GitHub PAT expiry**: PAT expires 2027-04-30 per memory. Rotate before then
6. **CF token scope**: Zone Operator token cannot manage account-level destinations or token-level operations

End of credentials reference.
