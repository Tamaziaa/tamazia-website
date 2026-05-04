# Cloudflare Pages Environment Variables

Set at Cloudflare Pages → Settings → Environment variables. Production env. Never commit values to git.

| Name | Purpose | Set at Phase |
|---|---|---|
| `RESEND_API_KEY` | Resend API key for `/api/contact`, `/api/briefings` outbound email | Pre-Phase 0 |
| `CONTACT_FROM` | From: header sender address. Defaults to `Tamazia <onboarding@resend.dev>` until Phase 2 verifies the sending domain. | Phase 2 |
| `CONTACT_TO` | Where contact form submissions land. Currently `realfamemedia@gmail.com`. | Pre-Phase 0 |
| `SEO_SCORE_API_KEY` | seoscoreapi.com primary source for `/api/audit` | Pre-Phase 0 |

## Verify presence

`curl https://tamazia.co.uk/api/health` returns booleans for each. Never the values.

## Rotation

Rotate any secret by replacing the value at Cloudflare Pages → Settings → Environment variables → edit. Trigger a new deploy (any push to main, or manual workflow_dispatch) so functions pick up the new value.
