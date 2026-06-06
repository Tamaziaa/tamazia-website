# Tamazia website · deploy runbook (canonical, post-consolidation 2026-06-06)

## The one-account setup
- **Canonical Cloudflare account:** `78c7941714fccce82e777108db054961` (Amanpareek.pareek@gmail.com).
  Holds: the `tamazia.co.uk` + `tamazia.in` DNS zones, the `tamazia-website` Pages project,
  the `FORM_SUBMISSIONS` KV namespace (`11971a76eda74339936dd7738680d973`),
  the Turnstile widget (sitekey `0x4AAAAAADf7dMzKneovEzOp`),
  and the workers (`tamazia-admin`, `tamazia-audit`, `tamazia-reply-handler`).
- **Old account** `4a3b271b...` (legacy): its `tamazia-website` project is retired — custom domains
  removed 2026-06-06. The old KV namespace `7c7537a8...` (historical form submissions) still lives
  there untouched. Delete the old project only after a comfortable soak period.

## How a change goes live (100% deterministic)
1. Merge a PR into `main` (or push to `main`).
2. `.github/workflows/deploy.yml` runs: build → `patch-dist.js` gates → functions build →
   `wrangler pages deploy dist/ --project-name=tamazia-website`.
3. Auth comes from repo secrets `CF_API_TOKEN` + `CF_ACCOUNT_ID` — both point at the canonical
   account. The project's `pages.dev` hostname is **tamazia-website-3fy.pages.dev** (the bare
   `tamazia-website.pages.dev` belongs to the retired old-account project).
4. Post-deploy probe checks `/audit/<slug>/<hash>` on the canonical subdomain (200 + `window.D`).
5. Custom domains `tamazia.co.uk` + `www.tamazia.co.uk` are attached to the canonical project
   (status: active). DNS: `tamazia.co.uk` CNAME → `tamazia-website-3fy.pages.dev` (proxied).

## /audit/* ownership
Served by the Pages Function `functions/audit/[[path]].js` (Neon-backed, HMAC optional on load).
The dangling zone route `tamazia.co.uk/audit*` (null script) was deleted 2026-06-06.
`tamazia.co.uk/admin*` still routes to the `tamazia-admin` worker — intentional, do not delete.

## Secrets map
- GitHub repo secrets: `CF_API_TOKEN` (canonical token `tamazia-consolidation-full`),
  `CF_ACCOUNT_ID` (`78c79417...`), optional `AUDIT_PROBE_SLUG`/`AUDIT_PROBE_HASH`.
- Pages project env (production + preview): 24 vars set 2026-06-06 — see project Settings.
  `ADMIN_SECRET`, `DSAR_SIGNING_SECRET`, `CAL_WEBHOOK_SECRET` were **rotated** (old values
  unrecoverable; new values in the founder's local SECRETS file). Cal.com webhook re-registered
  against `/api/cal-webhook` with the new secret (webhook id `4ba9f1b8-...`).
- `AUDIT_SIGNING_KEY` was never a Pages var; audit links did not break.
- Not carried over (set if needed): `ZEROBOUNCE_API_KEY` (validator fallback),
  `SEO_SCORE_API_KEY` (unused by functions).

## Verify after any deploy
`curl https://tamazia.co.uk/api/health` → version == merged SHA, status ok, kv bound.
Load one `/audit/<slug>/<hash>` URL → 200 + content.
