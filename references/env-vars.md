# Cloudflare Pages Environment Variables

Set at Cloudflare Pages → Settings → Environment variables. Production env. Never commit values to git.

| Name | Purpose | Set at Phase |
|---|---|---|
| `RESEND_API_KEY` | Resend API key for `/api/contact`, `/api/briefings`, `/api/cal-webhook` outbound email | Pre-Phase 0 |
| `CONTACT_FROM` | From: header sender address. Defaults to `Tamazia <onboarding@resend.dev>` until Phase 2 verifies the sending domain. | Phase 2 |
| `CONTACT_TO` | Where contact form submissions land. Currently `realfamemedia@gmail.com`. | Pre-Phase 0 |
| `SEO_SCORE_API_KEY` | seoscoreapi.com primary source for `/api/audit` | Pre-Phase 0 |
| `SHEETS_WEBHOOK_URL` | Apps Script web-app URL for backfill into the Sheet (optional, KV is canonical) | Phase 3 |
| `SHEETS_HMAC_SECRET` | HMAC shared secret with the Apps Script receiver to authenticate forwarded payloads | Phase 3 |
| `RESEND_FROM_ALERT` | From: header for internal alert emails. Default `Tamazia Forms <forms@tamazia.in>`. | Phase 3 |
| `RESEND_FROM_ACK` | From: header for the user-facing auto-acknowledgement. Default same as above. | Phase 3 |
| `ALERT_TO` | Internal alert recipient. Defaults to `realfamemedia@gmail.com`. | Phase 3 |
| `CAL_WEBHOOK_SECRET` | HMAC-SHA256 shared secret with Cal.com webhook. Set in Cal.com webhook config and as Pages env var. Verifies `x-cal-signature-256`. | Phase 5 |
| `INDEXNOW_KEY` | Shared secret for `/api/indexnow` ping endpoint. Defaults to filename of public key file. | Phase 5 |
| `PUBLIC_GA4_MEASUREMENT_ID` | GA4 measurement ID (e.g. `G-XXXXXXXXXX`). Empty disables GA4. | Phase 6 |
| `PUBLIC_CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics beacon token. Empty disables CF Analytics. | Phase 6 |
| `PUBLIC_BING_VERIFY` | Bing Webmaster Tools `<meta name="msvalidate.01">` content value. | Phase 6 |

## Cal.com webhook secret · current value

Webhook live at Cal.com → Event Types → 30-min Strategy Call → Webhooks. Subscriber URL `https://tamazia.co.uk/api/cal-webhook`. Triggers `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`. Secret value held in `references/_secrets-do-not-commit.md` (gitignored). Rotate by editing both the Cal.com webhook record and the Pages env var, then trigger a new deploy.

## Verify presence

`curl https://tamazia.co.uk/api/health` returns booleans for each. Never the values.

## Rotation

Rotate any secret by replacing the value at Cloudflare Pages → Settings → Environment variables → edit. Trigger a new deploy (any push to main, or manual workflow_dispatch) so functions pick up the new value.
