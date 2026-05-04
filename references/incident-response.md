# Incident Response Runbook

## /api/* returning 404

Cause: Cloudflare Pages Functions did not deploy. Workflow's wrangler step likely failed silently or was removed.

Action:
1. Check the most recent workflow run at github.com/Tamaziaa/tamazia-website/actions.
2. If wrangler step is missing, restore it from `.github/workflows/deploy.yml` history.
3. Re-trigger the workflow.
4. Verify with `curl -X POST https://tamazia.co.uk/api/contact -d '{}'` · expect HTTP 400.

## /api/* returning 5xx

Cause: function-level error.

Action:
1. Check Cloudflare Pages → Functions → real-time logs.
2. Most common: missing env var (RESEND_API_KEY, SEO_SCORE_API_KEY).
3. Verify env vars at Cloudflare Pages → Settings → Environment variables.

## Traffic spike degrading site

Cloudflare's free tier handles spikes well. If Pages gets overloaded:
1. Cloudflare → Caching → Configuration → enable "Always Online" (serves cached version).
2. Cloudflare → Security → Bot Fight Mode (blocks scrapers).

## Data breach (ICO 72h notification)

If any form data is exposed:
1. Pause sends immediately (suspend Resend domain).
2. Notify Danish (CLO) within 1 hour.
3. ICO notification within 72 hours via ico.org.uk → Personal Data Breach Notification.
4. Affected individuals notified via email if high risk.

## Domain hijacked

If tamazia.co.uk DNS is hijacked:
1. Log into BigRock immediately, check NS values.
2. Restore correct NS values (Cloudflare).
3. If credentials compromised, contact BigRock support and rotate.
4. CAA record (`Founder@tamazia.co.uk` iodef) should have alerted on unauthorised cert issuance.
