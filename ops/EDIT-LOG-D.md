# MISSION D — EDIT LOG (Phase D)

Worktree: `_mission-d` (branch `mission-d`) off `origin/main` @ `0f2ac7b`. No merge.
Node is NOT installed on this machine (matches Mission C's note) — files validated structurally; the real build runs in CI on merge (Actions → generate-og + build-cockpit + astro build + patch-dist + wrangler).

Price source-of-truth for every figure below: `src/content/pricing.ts`. Zero prices hardcoded.

---

### NEW · `src/config/social.ts`
Single source of truth for social URLs. `INSTAGRAM_URL = 'https://instagram.com/TamaziaUK'` (confirmed). `LINKEDIN_URL = 'TODO-founder'` (FOUNDER-GATED sentinel). `isPlaceholder()` flags the sentinel so the LinkedIn link renders disabled until filled. Exports `socialLinks[]`.

### D4 · `src/components/layout/Header.astro`
- Imported `socialLinks`; added `socialIconPaths` (Instagram + LinkedIn SVGs, currentColor).
- Rendered `.nav-social` icon row (desktop) before the CTA, and `.drawer-social` row in the mobile drawer. Live links: `target=_blank rel="noopener noreferrer me"`. Placeholder (LinkedIn) renders as a non-navigating `<span class="is-placeholder" aria-disabled>` with a "link coming soon" label.
- Added CSS for `.nav-social`/`.social-link`/`.drawer-social`; `.nav-social` hidden in the `<=1024px` mobile band (where nav-items/cta already hide); `.drawer-social` hidden on desktop.
**Done:** Instagram resolves to TamaziaUK in the header; LinkedIn is a one-line fill (GATE 2).

### D4 · `src/components/layout/Footer.astro`
- Imported `socialLinks`; added matching `socialIconPaths`.
- Rendered `.footer-social` row in the brand column after the partner badges, same live/placeholder treatment. Added CSS (circular gold-hairline buttons, dimmed placeholder).
**Done:** Instagram resolves to TamaziaUK in the footer; LinkedIn gated placeholder. (Note: the stale `footer.ts socialLinks` array and BaseLayout JSON-LD `sameAs` still carry the old `instagram.com/tamazia` + invented company URL — NOT rendered now; flagged in STATUS for a follow-up, left untouched to stay in scope.)

### D1 + D3 · `src/components/sections/Pricing.astro`
- Imported `fixPacksGbp`, `fixPacksLane`, `entryAuditGbp`, `independentSolutionsGbp` from `pricing.ts`. Added a `gbp()` formatter and three render datasets (fix packs, independent solutions meta map keyed to the config keys in config order).
- **D3:** rendered `.audit-reference-line` — "Every engagement opens with the paid audit, **£1,500** one time…" with the figure from `entryAuditGbp`.
- **D1 fix packs:** `.independent-block` "Fix Packs" with `fixPacksLane` sub, three cards reading `fixPacksGbp.ten/twenty/thirty` (7,500 / 12,500 / 17,500), each `data-gbp`, results-led lead + scope, CTA → `#contact`.
- **D1 independent solutions:** `.independent-block` "Independent Solutions", 8 cards from `independentSolutionsGbp`. Struck-then-offer: cards with `anchor`+`offer` show `.is-anchor` (line-through) then `.is-offer`; single-`price` cards show one offer. Outcome line per card, CTA → `#contact`.
- Added CSS for all new blocks + responsive (3→1 fix packs, 4→2→1 solutions). Solid `background-color` bases set for pa11y contrast parity (mirrors the file's existing approach).
**Done:** site pricing now mirrors the audit config field-for-field from the same source constant; fix packs read 7,500/12,500/17,500; £1,500 line renders. CTAs stay on `#contact` (GATE 1 — no Stripe URLs invented).

### D2 · NEW `src/components/sections/ReassuranceCard.astro` + `src/pages/index.astro`
- COPY 4 verbatim NOT located (see INVENTORY-D §7). Built the card structure/theme (ivory, gold hairline, seal motif) with a single `copy4` constant holding a CLEARLY-MARKED `TODO: COPY 4` placeholder body + a visible on-card `.copy4-flag` "Placeholder · COPY 4 pending founder copy. Not for launch." and HTML-comment instructions. No copy invented.
- Wired `<ReassuranceCard />` into `index.astro` directly after `<Sectors />`.
**Done:** the reassurance card renders under the sectors strip; founder fills `copy4.body` + sets `placeholder=false` to launch.

### D5 · `src/content/contact.ts`, `src/components/sections/Contact.astro`, `functions/_lib/neon-sync.js`, `functions/api/contact.js`
- Heading already verbatim "Every engagement begins with a conversation." (config) — unchanged.
- **`contact.ts`:** added a `website` field (`type:'url'`, required, autocomplete url) between email and company. (Name, email, website, company, sector, outcome.)
- **`Contact.astro`:** extended the field loop to render `type:'url'` as `<input type="url" inputmode="url">`. Same dark/gold theme as the booking form (in-place; this IS the booking-theme section). The Cal.com inline calendar + founder copy already sit beside the form (kept verbatim).
- **`neon-sync.js`:** domain waterfall now prefers `body.website` then audit input then email-domain; strips `www.`. So a submission lands in Neon `leads` with a real domain.
- **`contact.js`:** added `firePostHog()` (server-side, fail-open, gated on `env.POSTHOG_KEY`, `POSTHOG_HOST` default `https://eu.i.posthog.com`, event `contact_submitted`) and pushed it into the existing `Promise.allSettled` side-effects. Mirrors the only PostHog pattern in the repo (the audit function). No client SDK, no consent issue.
**Done:** form renders name/website/email/sector (+company/outcome), POSTs to `/api/contact` → `syncLeadToNeon` (Neon) and fires the PostHog `contact_submitted` event; Cal calendar + founder copy beside it. Live booking/Neon/PostHog confirmation left for post-merge verification (env keys bind in CF).

### D6 · NEW `src/pages/legal/service-terms.astro` + `src/pages/legal/cold-outreach-privacy-notice.astro`
- Both follow the `legal/data-protection.astro` pattern (BaseLayout + Breadcrumbs + `.legal` main), both `noindex`, both carry a prominent `.draft-banner` "DRAFT FOR LEGAL REVIEW · not yet in force" and a draft `<h1>`/eyebrow.
- `service-terms`: 11 headed skeleton sections (parties, scope, fees [GBP, scoped per engagement — no hardcoded price], term, IP/ownership, confidentiality, compliance/warranties, liability, data protection cross-refs, governing law, contact).
- `cold-outreach-privacy-notice`: 9 headed skeleton sections explicitly mapped to UK GDPR Articles 13 + 14 (controller, categories, source, purpose+6(1)(f), retention 24mo, recipients/transfers incl. Cal.com, rights, ICO complaint, timing), anchored on `references/article-14-notice-template.md`.
**Done:** both routes (`/legal/service-terms/`, `/legal/cold-outreach-privacy-notice/`) build as skeleton pages.

---

## GATES (flagged, NOT faked)
- **GATE 1 — Stripe checkout URLs (Mission E / founder):** all pricing/fix-pack/solution CTAs render the DISPLAY and keep `href="#contact"`. No Stripe Payment Link URL invented anywhere.
- **GATE 2 — LinkedIn company URL (founder):** `src/config/social.ts` `LINKEDIN_URL = 'TODO-founder'`. Header + footer render LinkedIn as a disabled, clearly-labelled placeholder until the founder fills the one constant. No URL invented.

## COPY 4
NOT found (verbatim). D2 ships a marked placeholder per the brief — not invented copy.
