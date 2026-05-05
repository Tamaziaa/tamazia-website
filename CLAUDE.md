# Tamazia · Claude session instructions

## Identity

Tamazia is operated by Tamazia Pvt Ltd, an Indian private limited company. Founder: Aman Pareek (LLM, King's College London, business law and international arbitration). Co-founder: Manuel Penadés Fons (senior advisor, ICC/LCIA proximity).

## Standing rules

- **Tamazia Pvt Ltd everywhere.** Never "sole proprietor" or "Aman Pareek (sole proprietor)" or "Tamazia is operated by Aman".
- **Indian jurisdiction** for corporate matters. UK + UAE + EEA cross-border complexity must be flagged before any legal commit.
- **British English** throughout. No "inquiry", use "enquiry". No "ass" + "ociate", use specific roles.
- **Never use em dashes**. Tamazia voice rejects them as a stylistic choice (founder preference).
- **Never use "Subscribe"** in customer-facing copy. The string itself triggers a patch-dist gate. Use "Rejoin" or "List membership".
- **Never use "Indian regulators"** anywhere. Tamazia operates internationally; Indian regulators reference is misleading.
- **Never use NYSE: CGON ticker**. Case study references use the equity name only.

## Architecture

Cloudflare Pages + Functions. KV-backed receivers (replaced Apps Script in W8-1). Push to main → GH Actions → wrangler deploys to CF Pages tamazia-website project (account 4a3b271b5f1f4cbfc16c6e9e5e62451b).

## Verification

`npm run build && node patch-dist.js` runs 50 gates. Live verification: `references/phase-7-final-verification.md`.

## What works locally

- Astro build (`npm run build`)
- patch-dist (`node patch-dist.js`)
- Function syntax check (`node --check functions/api/*.js`)

## What doesn't work locally

- Wrangler functions build (runs at deploy, not local)
- Live API testing (requires deploy to CF Pages)

## Common tasks

- Add a /legal/ page → `src/pages/legal/<name>.astro` + add to footer extra-legal-links + add patch-dist gate.
- Add an API endpoint → `functions/api/<name>.js` with onRequestPost / onRequestGet / onRequestOptions exports.
- Update Cal.com webhook → also update bidirectional indexes if event affects bookings.
- Update KV record schema → also update /api/admin-submissions, /api/dsar, /api/portability.

## Verification ritual after each phase

7-level bug test:
1. Source-tree integrity (page count, function count, schema components)
2. Build sanity (npm run build · 53 pages)
3. patch-dist (50 gates)
4. Function syntax (16 .js files)
5. Live API state (curl /api/health, /api/cal-webhook etc.)
6. Static surface checks (footer entity, /legal/, confirmation pages, sitemap)
7. Security headers (HSTS, CSP, COOP/COEP/CORP, Permissions-Policy)
