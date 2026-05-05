# User-Actions-Required · Master runbook

Every hand-on task across Phase 0–7. Each entry has the URL, exact field values, and the verification step to confirm success.

## 1 · Cloudflare Pages env vars (5 minutes · highest leverage · UNBLOCKS most pending tests)

**URL:** https://dash.cloudflare.com/4a3b271022be0b6f4eaeba70e5cefda0/pages/view/tamazia-website/settings/environment-variables

You must be signed in to Cloudflare account `4a3b271022be0b6f4eaeba70e5cefda0` (the Pages account, separate from the DNS account `78c7941…`). The Cowork session can only reach the DNS account in your current browser; switching accounts is a one-click operation in Cloudflare's account picker (top-left).

Set the following in the **Production** environment:

| Variable | Value | Notes |
|---|---|---|
| `CAL_WEBHOOK_SECRET` | See `references/_secrets/cal-webhook.txt` (gitignored) | Hex, 64 chars. Must exactly match the Secret field at Cal.com webhook config |
| `INDEXNOW_KEY` | `a8c7e0d2f6b4490fbda115c6d23e8740` | Matches the public key file at `/a8c7e0d2f6b4490fbda115c6d23e8740.txt` |
| `PUBLIC_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` | After GA4 property creation (step 2) |
| `PUBLIC_CF_ANALYTICS_TOKEN` | (CF Analytics beacon token) | After CF Web Analytics activation (step 3) |
| `PUBLIC_BING_VERIFY` | (Bing meta value) | After Bing Webmaster verify (step 4) |
| `ADMIN_SECRET` | (random 32-byte hex) | For /admin/submissions auth — generate with `openssl rand -hex 32` |

Trigger a redeploy (Pages → tamazia-website → Deployments → Retry latest) so functions pick up the new vars.

**Verification:** `curl https://tamazia.co.uk/api/health` returns `CAL_WEBHOOK_SECRET: true` in `env_present`.

## 2 · Google Analytics 4 property (3 minutes)

**URL:** https://analytics.google.com → Admin → Create property
- Property name: `Tamazia 2026`
- Time zone: `(GMT+00:00) United Kingdom Time`
- Currency: `GBP`
- Industry: `Professional Services`
- Business size: `Small`
- Property usage: `Generate leads`, `Examine user behaviour`
- Data Stream type: `Web`
- Stream URL: `https://tamazia.co.uk`
- Stream name: `tamazia.co.uk`

Capture the **Measurement ID** (`G-XXXXXXXXXX`) → paste into `PUBLIC_GA4_MEASUREMENT_ID` env var (step 1).

**Verification:** GA4 Realtime tab fires when you load tamazia.co.uk and click Accept on the cookie banner.

## 3 · Cloudflare Web Analytics (2 minutes)

**URL:** https://dash.cloudflare.com → Analytics & Logs → Web Analytics → Add a site
- Hostname: `tamazia.co.uk`
- Auto Insights: ON

Capture the **Beacon Token** → paste into `PUBLIC_CF_ANALYTICS_TOKEN` env var.

**Verification:** CF Analytics dashboard shows pageviews after redeploy + cookie consent.

## 4 · Bing Webmaster Tools (2 minutes)

**URL:** https://www.bing.com/webmasters → Add a site → `https://tamazia.co.uk`
- Verification method: **Meta tag** → copy the content value (e.g. `ABCDEF1234567890ABCDEF1234567890`)
- Paste into `PUBLIC_BING_VERIFY` env var

**Verification:** Bing Webmaster shows "Verified" status after redeploy.

## 5 · GSC sitemap submission (1 minute · already verified via Postmaster)

**URL:** https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Atamazia.co.uk
- Add new sitemap: `sitemap-index.xml`
- Submit

Same for `tamazia.in` if not yet on GSC: add as Domain property → verify via Postmaster cookie OR DNS TXT record (already there).

## 6 · GitHub PAT scope rotation (5 minutes · UNBLOCKS 4 staged workflows)

See `references/workflow-pat-rotation.md` for full procedure. TL;DR:
- https://github.com/settings/tokens → edit `Tamazia-deploy-bot` PAT → check `workflow` scope → Update
- Tell me you're done. I push the 4 staged workflow files (codeql, lighthouse-pa11y, synthetic-check, weekly-backup) in one commit.

## 7 · Branch protection on main (3 minutes)

**URL:** https://github.com/Tamaziaa/tamazia-website/settings/branches
See `references/branch-protection.md` for exact ruleset.

## 8 · Cloudflare Access policy on /admin/* (5 minutes)

See `references/admin-access.md` for exact policy. Requires Cloudflare Zero Trust enrolment first time.

## 9 · ICO registration (5 minutes · £40 annual)

**URL:** https://ico.org.uk/registration/new
- Pay £40
- Capture ICO registration number → paste into footer `legalEntity.icoRegistration` in `src/content/footer.ts`

## 10 · Send-As 5 personas in Gmail (5 minutes · the popup wizard)

See `references/email-send-as.md` for full procedure. SMTP: `mail.tamazia.in:465 SSL`. Password: held in cPanel.

## 11 · YAMM connection in Gmail (3 minutes)

OAuth popup. Reply-To header on every campaign template: `founder@tamazia.co.uk`.

## 12 · Microsoft SNDS + JMRP (10 minutes)

**SNDS:** https://sendersupport.olc.protection.outlook.com/snds/ · sign in with `founder@tamazia.co.uk` Microsoft account
**JMRP:** https://sendersupport.olc.protection.outlook.com/pm/ · same login

## 13 · Yahoo CFL (3 minutes)

**URL:** https://senders.yahooinc.com/complaint-feedback-loop/ · sign up with `founder@tamazia.co.uk`

## 14 · NeverBounce free 1000 credits (2 minutes)

**URL:** https://neverbounce.com/users/sign_up · email verification + captcha

## 15 · Hunter free 25/mo (2 minutes)

**URL:** https://hunter.io/users/sign_up · email + Google OAuth

## 16 · ZeroBounce free 100/mo (2 minutes)

**URL:** https://www.zerobounce.net/members/signup/

## 17 · Mac-side hygiene (10 minutes)

- Revoke any old `ghp_*` PATs at https://github.com/settings/tokens
- `git config --global --unset credential.helper` then re-add
- `ssh-keygen -p -f ~/.ssh/id_ed25519` to set passphrase if not already

## 18 · Resend Auto-configure (1 minute · I CAN drive this if you want)

**URL:** https://resend.com/domains → tamazia.in → Auto-configure (one click pushes 3 DNS records to Cloudflare via the integration).

## 19 · Disable Cal.com 15-min + Secret event types

**URL:** https://app.cal.com/event-types · toggle off the 15-min and Secret entries so every booking funnels through `/strategy-call`.

## 20 · Cal.com event-type Privacy + Terms URL fields

**URL:** https://app.cal.com/settings/my-account/general or per-event setting
- Privacy URL: `https://tamazia.co.uk/privacy-notice/`
- Terms URL: `https://tamazia.co.uk/terms/`

## Total time if all driven by you: ~80 minutes

Most can be batched in one focus session. Step 1 (env vars) is the highest-leverage — flips 5 tests from yellow to green in one move.

Last updated 2026-05-04.
