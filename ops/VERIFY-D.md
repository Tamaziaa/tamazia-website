# MISSION D — VERIFY (Phase E)

Worktree `_mission-d` (branch `mission-d`) off `origin/main` @ `0f2ac7b`.

## Build status
- **`npm run build` could NOT be run locally: Node/npm/npx are not installed on this machine** (checked PATH, nvm, homebrew, /usr/local — none present). This matches Mission C's recorded note ("node is NOT available locally"). The real build + the 110 `patch-dist` gates run in CI on merge (Tamaziaa/tamazia-website Actions → generate-og.js + build-cockpit.mjs + astro build + patch-dist.js + wrangler → ~35s → live).
- All changes were therefore validated STRUCTURALLY. Results below.

## Structural validation results

| Check | Result |
|-------|--------|
| New files present (social.ts, ReassuranceCard, 2 legal pages) | PASS |
| Astro frontmatter fences = 2 per new `.astro` | PASS (all 3 new pages) |
| `<style>`/`</style>` balanced in all 6 edited/new `.astro` | PASS |
| `<script>`/`</script>` balanced (Header 1/1, Contact 3/3) | PASS |
| Brace/paren balance on edited JS (`contact.js` 66/66 {} 123/123 (), `neon-sync.js`, `social.ts`) | PASS |
| Imports resolve: `pricing.ts` exports `fixPacksGbp`/`fixPacksLane`/`entryAuditGbp`/`independentSolutionsGbp` | PASS |
| `config/social.ts` imported by Header + Footer; ReassuranceCard imported + rendered in index | PASS |
| `firePostHog` defined once + wired into side-effects in `contact.js` | PASS |
| `set:html` directive used for social SVGs (Header 4 branches, Footer 2) | PASS |
| git status = 8 modified + 4 new paths, no strays | PASS |

## Mission acceptance checks (Phase E criteria)

| Criterion | Result | Evidence |
|-----------|--------|----------|
| `npm run build` succeeds | DEFERRED to CI | node absent locally; structural checks all pass |
| Site pricing equals the audit config field for field (same source constant) | PASS | `Pricing.astro` imports `fixPacksGbp`, `entryAuditGbp`, `independentSolutionsGbp`, `fixPacksLane` from `src/content/pricing.ts`. Zero hardcoded price literals (grep for 7500/12500/17500/1500/anchors in markup = empty). |
| Fix packs read 7,500 / 12,500 / 17,500 | PASS | rendered from `fixPacksGbp.ten/twenty/thirty`; `gbp()` formats to £7,500 / £12,500 / £17,500. |
| Reassurance card renders | PASS (structure) · COPY 4 = marked TODO | `<ReassuranceCard />` after `<Sectors />`; COPY 4 not found, placeholder + visible flag, not invented. |
| £1,500 line renders | PASS | `.audit-reference-line` renders `gbp(entryAuditGbp)` = £1,500. |
| Instagram resolves to TamaziaUK | PASS | `INSTAGRAM_URL='https://instagram.com/TamaziaUK'`, rendered live in header + footer. |
| Contact form matches booking theme | PASS | same `Contact.astro` dark/gold section; the booking Cal embed sits in the same section. |
| Contact form POSTs to Neon | PASS (wiring) | `/api/contact` → `syncLeadToNeon` INSERT INTO `leads`; `website` field now feeds the domain waterfall. Live insert confirmation = post-merge (env binds in CF). |
| Contact form fires PostHog | PASS (wiring) | `firePostHog()` server-side, event `contact_submitted`, gated on `env.POSTHOG_KEY`, fail-open. Mirrors the repo's only PostHog pattern. |
| Two legal routes load | PASS (structure) | `/legal/service-terms/` + `/legal/cold-outreach-privacy-notice/`, both BaseLayout + Breadcrumbs + `.legal`, both `noindex`, both "DRAFT FOR LEGAL REVIEW". |
| No dashes | PASS | zero em dashes in any new code or rendered copy; the only em dashes in edited files are PRE-EXISTING CSS/HTML comments I did not author. No hyphen-as-pause in new copy. |
| No we/our | PASS | zero `we`/`our`/`us` in any new client copy (social, reassurance, pricing additions, both legal pages). |
| Credential exact | N/A in D scope | the founder credential is not rendered by any D1-D6 file, so no credential string was introduced (zero risk). Existing site credential strings are inconsistent but out of D scope (that is Mission C's C2). |

## Runtime safety notes
- The existing currency switcher (`applyAll()`) iterates `[data-gbp]` but guards every mutation behind `if (display)` / `if (strike)` / `if (card)`. My new `.fp-price` / `.is-offer` carry `data-gbp` but NO `.price-display` child and NO `.tier-card` ancestor, so they are iterated harmlessly and never throw or get mutated. The GBP figure stays the canonical invoiced currency (matches the existing "All engagements are invoiced in GBP" note).
- LinkedIn placeholder renders as a non-navigating `<span aria-disabled>` (no href), so no broken/guessed URL can ship while `LINKEDIN_URL='TODO-founder'`.
- All pricing/fix-pack/solution CTAs keep `href="#contact"` — no Stripe URL invented (GATE 1).

## Cannot-verify-locally (left for post-merge / CI)
1. `npm run build` green + patch-dist gates (CI).
2. Visual rendering / pa11y AA contrast of the new pricing blocks + reassurance card (CI pa11y + manual).
3. A live contact submission landing in Neon `leads` and a `contact_submitted` event in PostHog (requires CF env keys; do a single test submission after deploy).
