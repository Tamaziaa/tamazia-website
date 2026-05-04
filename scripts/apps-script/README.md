# Apps Script Receiver · Deployment Guide

## One-time setup (5 minutes)

1. Create a new Google Sheet titled "Tamazia Form Submissions". Note the Sheet ID from the URL (the long string between /d/ and /edit).
2. Open https://script.google.com → New project. Name it "Tamazia Forms Receiver".
3. Replace Code.gs contents with the file alongside this README.
4. In the Apps Script editor, click the gear icon (Project Settings).
5. Under Script Properties, add:
   - SHEETS_HMAC_SECRET (32+ random chars · must match Cloudflare Pages env)
   - RESEND_API_KEY (same as CF Pages env)
   - ALERT_TO = realfamemedia@gmail.com
   - AUTO_ACK_FROM = "Tamazia <founder@tamazia.in>"
   - SHEET_ID = the Sheet ID from step 1
6. Click Deploy → New deployment.
7. Type: Web app. Description: "v1 production". Execute as: Me. Who has access: Anyone.
8. Click Deploy. Authorise the OAuth scopes (Sheets read/write + UrlFetch).
9. Copy the deployment URL.
10. In Cloudflare Pages → Settings → Environment variables, add:
   - SHEETS_WEBHOOK_URL = the deployment URL from step 9
   - SHEETS_HMAC_SECRET = same value from Apps Script
11. Trigger a redeploy of the Pages site so env vars take effect.

## Verifying the receiver

Run scripts/p3-bug-test.sh after deployment. All 14 levels should pass.

## Rotating the HMAC secret

1. Generate new value: `openssl rand -hex 32`
2. Update Apps Script Script Property SHEETS_HMAC_SECRET
3. Update Cloudflare Pages env SHEETS_HMAC_SECRET
4. Trigger Pages redeploy

## What this script does

- Verifies HMAC signature on every POST
- Appends row to the right tab (contact, briefings, audit, bookings, errors, health)
- Idempotency check on request_id to prevent duplicates
- Fires alert email to realfamemedia@gmail.com via Resend
- Fires auto-acknowledgement to submitter from founder@tamazia.in via Resend with List-Unsubscribe RFC 8058 headers
- Auto-pairs intent containing "call/meeting/book/demo" into bookings tab
- Logs all errors to the errors tab so failures are auditable
