# Tamazia Website

International SEO and regulatory compliance content firm. Lawyer-led. Patek Philippe / Hermès institutional editorial register. Serves regulated enterprises in UK, EU, USA, GCC, Singapore, Hong Kong.

Live: https://tamazia.co.uk
Preview alias: https://tamazia-website.pages.dev

## Stack

- **Framework:** Astro 4.16 (TypeScript) static site generator.
- **Hosting:** Cloudflare Pages (project `tamazia-website`).
- **Functions:** Cloudflare Pages Functions for `/api/contact`, `/api/audit`, `/api/briefings`, `/api/health`.
- **Email delivery:** Resend API.
- **Sitemap:** `@astrojs/sitemap` pinned to `3.2.0`.
- **Fonts:** Self-hosted WOFF2 (Inter, Playfair Display, Great Vibes) under `/public/fonts/`.

## Deploy

Push to `main` triggers GitHub Actions → builds Astro → runs `patch-dist.js` (14 brand-register checks) → compiles Cloudflare Functions → deploys via Wrangler. Round-trip ~50 seconds.

Manual trigger: https://github.com/Tamaziaa/tamazia-website/actions/workflows/deploy.yml → "Run workflow" → main → Run.

## Reference docs

- [`references/deploy-runbook.md`](references/deploy-runbook.md) · how deploys work, what to do if one fails.
- [`references/incident-response.md`](references/incident-response.md) · 404s, 5xx, traffic spikes, ICO 72h.
- [`references/brand-register.md`](references/brand-register.md) · the 14 patch-dist checks.
- [`references/env-vars.md`](references/env-vars.md) · expected Cloudflare Pages env vars (no values).
- [`references/devops.md`](references/devops.md) · Mac vs sandbox path map, common workarounds.

## Repository conventions

- No em-dashes used as pauses. Use `.` or ` · ` (interpunct).
- "200+" everywhere referencing the framework count, never bare "200".
- "Aman Pareek" capitalised, every reference.
- British English in copy (`enquiry` not `inquiry`, `organisation` not `organization`).
- No Indian regulators in copy (Tamazia does not serve the Indian domestic market).
- Never edit `dist/` directly; always source. Build regenerates.
