# Tamazia Website

International SEO for regulated enterprises. Built on Astro 4 + Cloudflare Pages.

**Live**: [tamazia.co.uk](https://tamazia.co.uk) · **Repo**: github.com/Tamaziaa/tamazia-website

Operated by Tamazia Ltd · India. UK + EU operations. Data Protection Officer: dpo@tamazia.co.uk.

## Stack

- **Framework**: Astro 4 (static + edge functions)
- **Hosting**: Cloudflare Pages (production environment, branch `main`)
- **Functions**: Cloudflare Workers (`functions/api/*` · 13 endpoints)
- **Storage**: Cloudflare KV (`FORM_SUBMISSIONS` namespace · 2-year TTL)
- **Email**: Resend (transactional auto-ack, alert, DSAR/erase verification)
- **Booking**: Cal.com webhook with HMAC-SHA256
- **Analytics**: GA4 + Cloudflare Web Analytics with Consent Mode v2
- **Anti-spam**: Cloudflare Turnstile + ZeroBounce/Hunter/NeverBounce email validators

## Repo layout

```
src/                        Astro source
  pages/                    Routes (53 built pages)
    legal/                  Compliance surface (data-protection, dpa, sub-processors)
    admin/                  Auth-gated dashboard
  components/               Reusable
    schema/                 4 JSON-LD components (Article, FAQ, Service, Breadcrumbs)
    security/               Turnstile widget
    sections/               Contact form, audit form, etc.
    layout/                 BaseLayout, Footer, BodyAnalytics
  content/                  Content data (TS modules)
functions/                  Cloudflare Pages Functions
  _lib/                     Shared utilities (3)
    email-validator.js      ZeroBounce → Hunter → NeverBounce chain
    turnstile.js            Cloudflare Turnstile siteverify
    dsar-token.js           HMAC-SHA256 token signer
  api/                      13 endpoints
    contact.js              Brief receiver
    briefings.js            Newsletter receiver
    audit.js                SEO audit
    cal-webhook.js          Cal.com booking webhook
    list-unsubscribe.js     RFC 8058 one-click
    health.js               Public health check
    admin-submissions.js    Admin dashboard backend
    dsar.js                 UK GDPR Art 15 (right of access)
    erase.js                UK GDPR Art 17 (right to erasure)
    portability.js          UK GDPR Art 20 (data portability)
    indexnow.js             Bing IndexNow
    csp-report.js           CSP violation receiver
    nel-report.js           Network Error Logging receiver
public/
  _headers                  CSP, HSTS, COOP, COEP, CORP, Permissions-Policy
  _redirects                Legacy URL handling
  .well-known/              security.txt, mta-sts.txt, change-password
references/                 Operator runbooks (50+ files)
patch-dist.js               Post-build verification (50 gates)
.github/workflows/
  deploy.yml                CF Pages deploy via wrangler
```

## Verification

110 patch-dist gates run on every build. Local run:
```
npm run build && node patch-dist.js
```
Expected: `OK All 50 checks passed.`

Live verification runbook: `references/phase-7-final-verification.md` (8 sections, A through H).

## Standing rules (operator)

- Indian jurisdiction for all corporate matters. Cross-border (UK/EU/UAE) flagged before commit.
- DMARC policy is `quarantine` (Phase 9 plans `reject` after 30-day observation).
- ICO Article 27 UK Representative engagement pending. Until then, contact dpo@tamazia.co.uk for all DSAR.
- ADMIN_SECRET rotation cadence: every 90 days. Rotation procedure in `references/admin-access.md`.
- Case studies (Kamat, CG Oncology, Meraas) require permission letters before any new external use. Drafts at `references/case-study-permission-letters.md`.

## Compliance

- UK GDPR + EU GDPR Articles 13/14 disclosure: [/legal/data-protection/](https://tamazia.co.uk/legal/data-protection/)
- DPA template: [/legal/dpa/](https://tamazia.co.uk/legal/dpa/)
- Sub-processors: [/legal/sub-processors/](https://tamazia.co.uk/legal/sub-processors/)
- Article 30 ROPA: `references/article-30-ropa.md` (internal)

## Deploy

Push to `main`. GitHub Actions builds via Astro + patches via `patch-dist.js` + compiles Functions via wrangler + deploys via `wrangler pages deploy`. Total: ~35s on a healthy runner.

If runners stuck (recurring GitHub-side issue): see `references/pending-workflows/_install-instructions.md` for the concurrency block patch and 3 pending workflow YAMLs.
