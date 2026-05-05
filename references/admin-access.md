# /admin/* Access Policy

Phase 6 carry-over · founder decision 2026-05-04.

## Threat model

`/admin/submissions/` reveals every contact-form, briefings-form, audit-tool, and Cal-booking submission. Includes name, email, intent text, IP-derived signals. UK GDPR Article 32 obligation: technical measure proportional to risk.

Today the URL is unguessed but unguarded. A leak in chat, browser history, or share-link exposes everything.

## Defence-in-depth

Layer 1 · `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` on every `/admin/*` response. Stops accidental search-engine indexing. **Live in `_headers`.**

Layer 2 · Cloudflare Access policy. Pages → tamazia-website → Settings → Custom domains → tamazia.co.uk → Access. Add Access Application:
- Application name: Tamazia Admin
- Application domain: tamazia.co.uk/admin/*
- Identity provider: Google OAuth (single-sign-on)
- Policy: include rule `email is in [founder@tamazia.co.uk, amanpareek.pareek@gmail.com]`
- Session duration: 24 hours

Once applied, every request to `/admin/*` requires Google sign-in with one of the allowed emails. Free-tier Cloudflare Zero Trust covers up to 50 users; we use 2.

Layer 3 · Application-level admin secret. `functions/api/admin-submissions.js` already requires `x-admin-secret: <ADMIN_SECRET>` header. The HTML viewer at `/admin/submissions.astro` reads this from a localStorage prompt. Not a substitute for Layer 2 — it is the redundant gate so a misconfigured CF Access policy is not a single point of failure.

## Verification

Post-config, `curl https://tamazia.co.uk/admin/submissions/` from an un-signed-in client should return Cloudflare Access challenge HTML, not the page.

Last updated 2026-05-04.
