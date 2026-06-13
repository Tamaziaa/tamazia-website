# MISSION D — INVENTORY (Phase A, discovery)

Discovery date: 2026-06-13 · Worktree: `_mission-d` off `origin/main` @ `0f2ac7b`.
READ-ONLY discovery. No edits made in this phase.

Standing rules enforced throughout: no em dashes, no hyphen-as-pause in client copy; never `we`/`our` on the website; founder credential verbatim `LLM in International Business Law, King's College London`; prices ONLY from the single pricing config constant; do not render unconfirmed figures; do NOT touch the audit ENGINE (`functions/audit/*` is the live audit renderer + commerce, off-limits to mirror-from but read for reference).

---

## 1. Live homepage structure (`src/pages/index.astro`)

Order of sections rendered inside `<main id="main">`:
1. `<Header />` (`src/components/layout/Header.astro`)
2. `FinalHero` (`src/components/sections/FinalHero.astro`)
3. `LawsStrip`
4. `WhyUs`
5. `SextantInstrument` (live enforcement-watch instrument; primes the six sector cards)
6. `Sectors` (`src/components/sections/Sectors.astro`) ← the sectors strip
7. `Interstitial` III. Case Studies
8. `CaseStudies`
9. `Testimonials`
10. `Interstitial` IV. The Process
11. `HowWeWork`
12. `Interstitial` V. Engagement
13. `Pricing` (`src/components/sections/Pricing.astro`) ← the pricing section
14. `Interstitial` VI. Questions & Findings
15. `FAQ`
16. `Contact` (`src/components/sections/Contact.astro`) ← the contact form + Cal embed
17. `<Footer />` (`src/components/layout/Footer.astro`)

`index.astro` also builds two JSON-LD blocks inline: a `FAQPage` and an `OfferCatalog` (`offerSchema`) whose prices read from `pricingContent.tiers[].priceGbp` (already single-sourced).

## 2. Sectors strip (`src/components/sections/Sectors.astro` + `src/content/sectors.ts`)

- Six sector cards (Legal, Healthcare, Hospitality, Real Estate, Financial, "Every Sector. One Standard.") rendered in `.sector-grid`.
- Closes with `.closing-line-wrap` (`.closing-hairline` + `.closing-line`) at template lines ~154-157, then `</section>` at ~160.
- A reassurance card under the sectors strip (D2) is naturally placed either (a) as a new block inside `Sectors.astro` after the closing line but before `</section>`, OR (b) as a standalone component rendered in `index.astro` immediately after `<Sectors />`. **Chosen: a standalone `ReassuranceCard.astro` rendered in `index.astro` right after `<Sectors />`** — keeps the sectors content file untouched and the card reusable.

## 3. Header (`src/components/layout/Header.astro`)

- `<header class="site-header">` → sticky `.main-nav` (oxblood bg, gold text). Logo lockup, `.nav-items` from `heroContent.headerNav`, `.nav-cta` (`heroContent.navCta` / `navCtaUrl` = "Book a Strategy Call" → `/#contact`), burger + mobile drawer.
- NO social links present today.
- Mobile drawer (`.mobile-drawer`) mirrors nav items + a `.drawer-cta`.

## 4. Footer (`src/components/layout/Footer.astro` + `src/content/footer.ts`)

- Three-column grid: brand (logo, tagline, presence, credentials, address, partner badges) · navigation · regulatory-briefings form (`/api/briefings`).
- Small-print block: copyright, legal entity line, `extra-legal-links` (Data Protection, DPA, Sub-processors, Modern Slavery, Complaints, Acceptable Use, Security, Status, RSS, Manage cookies), `legal-links`.
- `footer.ts` DOES define a `socialLinks` array, but **it is NOT rendered anywhere in Footer.astro** today. Its values are also stale/wrong for this mission:
  - Instagram `https://instagram.com/tamazia` (mission requires `https://instagram.com/TamaziaUK`)
  - LinkedIn `https://linkedin.com/company/tamazia` (an INVENTED URL — mission says LinkedIn company URL is founder-gated)
- `src/layouts/BaseLayout.astro` JSON-LD `sameAs` also lists `https://instagram.com/tamazia` and `https://linkedin.com/company/tamazia`, and `founder.sameAs` lists `https://linkedin.com/in/amanpareek`. (The `FounderLink` atom uses `https://www.linkedin.com/in/amanpareekk/` — a different, double-k personal handle.) These are inconsistent; out of D4 scope to fully reconcile, but flagged.

## 5. Current pricing section (`src/components/sections/Pricing.astro`)

- Renders ONLY the three retainer tiers (Foundation/Authority/Enterprise) from `pricingContent.tiers`, a currency switcher (GBP/USD/EUR/AED), a pilot-engagement toggle (struck standard rate + "saves" line), the mandate callout block, and a micro-note.
- It does NOT render: the fix packs, the £1,500 entry-audit reference, or the Independent Solutions cards. These are the D1/D3 gaps.
- All tier CTAs point to `#contact` (no Stripe — correct; Stripe is Mission E / founder-gated).

## 6. THE canonical pricing config constant (single source of truth)

**File: `src/content/pricing.ts`.** Mission C's discovery plan (`Tamazia-Remix/ops/MISSION-C-PLAN.md` §1) noted these constants were ABSENT at C-time; **PR #58 has since added them** and they are now present and verified in this worktree:

- `pricingContent.tiers[]` — Foundation `priceGbp:2500`, Authority `priceGbp:4500`, Enterprise `priceGbp:9500` (+ `priceGbpStandard`, `savesGbp6`). (lines ~13-222)
- `fixPacksGbp: { ten: 7500, twenty: 12500, thirty: 17500 }` and `fixPacksLane = 'No retainer required. Buy the fixes, own the work.'` (lines ~251-256)
- `exposureReportGbp: { unlock: 750, monthlyCover: 449 }` (lines ~264-267)
- `entryAuditGbp = 1500` (line ~270)
- `independentSolutionsGbp` — 8 keys, struck-then-offer (`anchor`/`offer`) or single `price` (lines ~278-287):
  - `websiteRemodelling { anchor:4800, offer:2400 }`
  - `aiAuthority { anchor:3000, offer:1800 }`
  - `icpOutreach { anchor:2800, offer:1400 }`
  - `onlinePersonalBranding { anchor:2200, offer:1100 }`
  - `instagramPresence { anchor:1800, offer:900 }`
  - `ymylContent { price:1200 }`
  - `reputationCrisis { anchor:3000, offer:1500 }`
  - `gbpDomination { price:850 }`

These match the values STATE.md lists for PR #58 EXACTLY (audit £1,500; Foundation £2,500 / Authority £4,500 / Enterprise £9,500; fix packs £7,500 / £12,500 / £17,500; unlock £750; cover £449/mo; independent-solution anchors/offers). **D1/D3 mirror from THIS file.** No price will be hardcoded.

> Note on the audit-engine twin: `functions/audit/_commerce.js` has its OWN `PRICING_TIERS`, `ONE_TIME_FIX_GBP=7500`, and `ADDON_CATALOGUE`. That is the OFF-LIMITS audit engine's server-side commerce and is NOT the site config. The site mirror reads `src/content/pricing.ts` only. The audit page's own pricing is Mission C's job, not D's.

## 7. COPY 4 (reassurance-card copy) — SEARCH RESULT

**VERBATIM "COPY 4" WAS NOT FOUND.** Searches performed:
- `grep -rln "COPY 4"` across the control folder `Tamazia-Remix/` → only hit is `STATE.md`, and that hit is the meta-line describing THIS mission ("reassurance card (COPY 4)"), not the copy itself.
- `grep -rlnE "COPY [0-9]"` across the control folder → only `STATE.md`.
- `grep -rln -i "reassur"` across `Tamazia-Remix/*.md` and the website `src/` → no verbatim reassurance-card block. The only near-match is `00-Briefs/TAMAZIA-04-ELEMENTS-LIBRARY.md` §10.6 ("Confidentiality reassurance: 'Findings belong to you whether you proceed or not.'") — this is NOT labelled COPY 4 and is a different (older) artefact.
- The control folder has NO `references/` directory (the website repo has its own `references/`, which holds ops/legal runbooks, no marketing COPY blocks).

**Decision per brief: do NOT invent copy. D2 ships the reassurance card with a clearly-marked `TODO: COPY 4` placeholder** so the founder drops the verbatim text in one place. The card structure, theme, and placement are built and correct; only the body string is a marked placeholder.

## 8. Contact form + booking (D5) — ALREADY LARGELY BUILT

`src/components/sections/Contact.astro` + `src/content/contact.ts` + `functions/api/contact.js`:
- Heading is already verbatim: **"Every engagement begins with a conversation."** (`contactContent.h2`), subline "Start yours below."
- Fields: `name` (Full Name), `email` (Work Email), `company` (Company), `sector` (12-option select), `outcome` (textarea). The mission asks for name / website / email / sector. **Gap: there is no `website` field today** (there is `company`). D5 adds a `website` field to match the brief while keeping the existing fields.
- Theme: dark obsidian section, gold hairline-underline inputs — this IS the booking/contact theme. The brief's "same theme as the existing booking form" is satisfied by editing in-place.
- Backend: form POSTs JSON to `/api/contact` → `handleSubmission(...,'contact')` → `syncLeadToNeon(env, 'contact', body, request_id)` (INSERT INTO `leads`, additive, fail-open) + KV store + Resend ack + Slack/Telegram notify. **Neon wiring already exists.** `neon-sync.js` already reads `body.c_homepage_url` for domain; a real `website` field strengthens the domain capture.
- Cal.com: the contact pane ALREADY embeds the inline Cal calendar (`tamazia/strategy-call`) with the brand theme (light cssVars), lazy-mounted on viewport. The brief's "cal.com booking calendar beside the founder-call copy" is satisfied.
- **Gap for D5: no PostHog event fires on submission.** PostHog exists ONLY server-side in the off-limits audit function (`functions/audit/[[path]].js` uses `env.POSTHOG_KEY` + `POSTHOG_HOST` default `https://eu.i.posthog.com`, event `audit_opened`, `/capture/`). There is NO client-side PostHog SDK on the public site, and adding one would need consent-gating. **Decision: mirror the established server-side capture pattern inside `/api/contact.js`** — fire a `contact_submitted` PostHog event from the Worker via `context.waitUntil`/fire-and-forget, gated on `env.POSTHOG_KEY` (fail-open, £0, no new client script, no consent issue). This proves the wiring and matches the only PostHog pattern in the repo.

## 9. Founder-call copy ("Mission C's C5")

Mission C's C5 is the **fix packs** block, not a founder-call block. The genuine founder-call copy already lives in `contactContent` (confidentiality line "All briefings are conducted under NDA on request. The founder reviews every enquiry." + success "The founder will be in touch within one business day.") and Mission C's C10 (the Cal embed with `founder@tamazia.co.uk`). D5 reuses the EXISTING founder copy beside the calendar; no new founder-call paragraph is invented (avoids unconfirmed copy). The reassurance/founder voice is preserved verbatim from config.

## 10. Analytics + consent pattern

- `src/layouts/BaseLayout.astro` wires `HeadAnalytics` (Bing verify), `BodyAnalytics` (Cloudflare beacon + GA4, GA4 hard-gated behind `tamazia-cookie-consent`), `Sentry`, `CookieConsent`.
- GA4 ID `G-4P8F2BHLFZ`, CF beacon token present.
- No PostHog client snippet. PostHog is server-side only (audit engine). D5 keeps PostHog server-side.

## 11. Legal pages (D6) — existing patterns

- Routes under `src/pages/legal/`: `data-protection.astro`, `dpa.astro`, `sub-processors.astro`. No `service-terms` and no cold-outreach privacy notice yet.
- Two layout patterns in use:
  - `legal/data-protection.astro`: `BaseLayout` + `Breadcrumbs` + `<main id="main" class="legal">` with `<section>`s, `<style>` block after `</BaseLayout>`. (No explicit `<Header/>`/`<Footer/>` — BaseLayout-driven chrome.)
  - `terms.astro` (root): `BaseLayout` + explicit `<Header/>` + `<main class="legal-page"><article class="legal-inner">` + `<Footer/>`.
- D6 will follow the `legal/data-protection.astro` pattern (Breadcrumbs + `.legal` main) for both new routes: `src/pages/legal/service-terms.astro` and `src/pages/legal/cold-outreach-privacy-notice.astro`. Both titled "DRAFT FOR LEGAL REVIEW".
- Source material for the cold-outreach notice: `references/article-14-notice-template.md` (Article 14 disclosure, lawful basis 6(1)(f), retention 24 months, ICO complaint route, Cal.com sub-processor) and the existing `data-protection.astro` (Article 13 content). The skeleton will summarise Articles 13 + 14 with these anchors and the DRAFT banner.

## 12. Build tooling

- `package.json`: `build = node scripts/generate-og.js && node scripts/build-cockpit.mjs && astro build`.
- Node availability TBD — will run `npm ci || npm install` then `npm run build` in Phase E. If those scripts fail on environment-specific deps (OG canvas, cockpit), will fall back to `npx astro build` / `npx astro check` and report structurally.

---

## Gates carried into PLAN-D / EDIT-LOG-D (do NOT fake)
- **GATE 1 (Stripe):** the pricing CTA hrefs stay on the existing contact route (`#contact`). No Stripe Payment Link URLs invented. Display only. (Mission E / founder.)
- **GATE 2 (LinkedIn URL):** LinkedIn company URL is founder-gated. Wire a `LINKEDIN_URL = 'TODO-founder'` placeholder constant so it is one line to fill. Do NOT invent a URL.
