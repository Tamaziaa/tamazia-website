# MISSION D — STATUS

Branch: `mission-d` (off `origin/main` @ `0f2ac7b`). NOT merged. Worktree: `_mission-d`.
Date: 2026-06-13.

## Summary
The public-site mirror is built as real Astro code on `mission-d`. All six tasks (D1-D6) are implemented; the two founder-gated bits are flagged, not faked. Every price reads from the single config constant `src/content/pricing.ts`. No em dashes, no we/our, no invented copy, no invented URLs.

## What shipped (file paths)
- **D1 + D3** — `src/components/sections/Pricing.astro`: added Fix Packs (£7,500 / £12,500 / £17,500), Independent Solutions (8 cards, struck-then-offer), and the "Paid audit £1,500 one time" reference line. All figures imported from `pricing.ts` (`fixPacksGbp`, `fixPacksLane`, `independentSolutionsGbp`, `entryAuditGbp`). CTAs → `#contact`.
- **D2** — `src/components/sections/ReassuranceCard.astro` (new) + `src/pages/index.astro`: reassurance card under the sectors strip. COPY 4 = clearly-marked TODO placeholder (not found, not invented).
- **D4** — `src/config/social.ts` (new), `src/components/layout/Header.astro`, `src/components/layout/Footer.astro`: Instagram (`https://instagram.com/TamaziaUK`) + LinkedIn wired into header AND footer from one config. LinkedIn = disabled placeholder until the founder fills `LINKEDIN_URL`.
- **D5** — `src/content/contact.ts`, `src/components/sections/Contact.astro`, `functions/_lib/neon-sync.js`, `functions/api/contact.js`: added the `website` field; form POSTs to Neon via the existing `/api/contact` → `syncLeadToNeon`; added server-side PostHog `contact_submitted` capture. Cal calendar + founder copy already beside the form.
- **D6** — `src/pages/legal/service-terms.astro` (new), `src/pages/legal/cold-outreach-privacy-notice.astro` (new): both "DRAFT FOR LEGAL REVIEW" skeletons, `noindex`, Articles 13 + 14 mapped.
- **Docs** — `ops/INVENTORY-D.md`, `ops/PLAN-D.md`, `ops/EDIT-LOG-D.md`, `ops/VERIFY-D.md`, `ops/STATUS-D.md`.

## Build result
`npm run build` NOT runnable locally (Node absent on this machine — same as Mission C). Validated structurally: frontmatter fences, style/script balance, JS brace/paren balance, imports resolve, zero hardcoded prices, copy rules clean. The real build + patch-dist gates run in CI on merge.

## Pricing config constant mirrored from
`src/content/pricing.ts` — `pricingContent.tiers[].priceGbp` (2500/4500/9500), `fixPacksGbp {ten:7500, twenty:12500, thirty:17500}`, `fixPacksLane`, `entryAuditGbp` (1500), `exposureReportGbp {unlock:750, monthlyCover:449}`, `independentSolutionsGbp` (8 keys, anchor/offer or price). These match STATE.md's PR #58 values exactly.

## COPY 4
NOT FOUND (verbatim). Only reference is the meta-line in `Tamazia-Remix/STATE.md` describing this mission. D2 ships a marked placeholder with a visible on-card flag; founder supplies the verbatim copy in one constant (`copy4.body`, set `placeholder=false`).

## FOUNDER-GATED (do NOT fake — flagged)
1. **Stripe checkout URLs** (Mission E): all pricing/fix-pack/solution CTAs render the display and keep `href="#contact"`. No Stripe Payment Link URL invented.
2. **LinkedIn company URL** (founder): `src/config/social.ts` `LINKEDIN_URL = 'TODO-founder'`. Header + footer render LinkedIn as a disabled, labelled placeholder until filled. One-line fix.

## Out-of-scope observations (NOT changed — for a follow-up)
- `src/content/footer.ts` `socialLinks` array + `src/layouts/BaseLayout.astro` JSON-LD `sameAs` still carry the OLD `instagram.com/tamazia` and an invented `linkedin.com/company/tamazia`. The footer array is no longer rendered (D4 renders from `config/social.ts`), but the JSON-LD `sameAs` is still emitted with the stale handles. Reconciling those (and the inconsistent founder credential strings flagged by Mission C's C2) is outside D scope.
- `src/layouts/BaseLayout.astro` mobile sticky CTA hardcodes `From £2,500/month` (line ~420). Pre-existing; should read from the pricing constant. Out of D scope.

## Post-merge verification to run
1. CI build green + patch-dist gates.
2. One live contact submission → confirm a row in Neon `leads` + a `contact_submitted` event in PostHog (needs CF env keys).
3. pa11y AA on the new pricing blocks + reassurance card.
