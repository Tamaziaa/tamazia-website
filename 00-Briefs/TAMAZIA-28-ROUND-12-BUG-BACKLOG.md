# TAMAZIA-28 · Round-12 Bug Backlog

**Authored:** end of QA-100% Phase 6 (full 50-layer × 5-viewport audit ran successfully)
**Runner:** `00-Briefs/qa-runner/` (50/50 layers implemented, chunked execution, Lighthouse + axe-core integrated)
**Source run ID:** `full-1777328305` — see `00-Briefs/qa-runner/reports/full-1777328305/master-report.md`
**Live deploy under audit:** https://tamazia-website.pages.dev (Round 11)

---

## Audit overview

- **Total layers:** 50/50 implemented + executed
- **Total checks executed:** 2,286 across 5 viewports × 4 routes × 3 state-variant flags
- **Pass:** 444 · **Fail:** 200 · **Skip:** 1,642 · **Error:** 0
- **Lighthouse perf scores:** 0.98 (home mobile), 0.98 (home desktop), 0.99 (insights mobile). Zero CWV violations. Performance is not a problem.

The 200 fails collapse to **40 unique findings** across severities once duplicates per viewport/route are merged.

| Severity | Unique findings |
|---|---|
| **P0** (ship blocker) | **13** |
| **P1** (brand-degrading) | **21** |
| **P2** (annoyance) | **5** |
| **P3** (polish) | **1** |

---

## P0 ship blockers (must fix before production cutover)

### 1. Footer briefings form is dead — Netlify Forms on Cloudflare host
**Layer L48.** The footer "Regulatory briefings signup" form has `data-netlify="true"` but Tamazia is on Cloudflare Pages. Netlify Forms is a Netlify-only feature. Submissions are silently dropped — the user thinks they signed up, no email arrives.
**Fix:** convert the form to POST `/api/briefings` (a new Cloudflare Pages Function similar to `/api/contact`) that calls Resend with the email. Remove `data-netlify="true"` and `name="regulatory-briefings"`.

### 2. No cookie/privacy/terms pages exist
**Layer L43.** All of `/cookie-policy`, `/privacy`, `/terms` (and 7 other variants) return the home page with HTTP 200 because Cloudflare Pages SPA-fallbacks unknown URLs. The pages don't exist. UK GDPR / EU PECR require all three.
**Fix:** create real Astro pages: `src/pages/cookie-policy.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`. Add proper content (Tamazia is UK GDPR + UAE PDPL + EU PECR scope).

### 3. Cloudflare Pages serves 200 for any unknown URL (no 404 page)
**Layer L43 (bonus check).** Tested `/this-path-cannot-exist-{ts}` — returned 200 with home page content. SEO disaster (Google will index thousands of duplicate URLs) plus broken UX.
**Fix:** add `src/pages/404.astro` so Astro emits `dist/404.html` and Cloudflare serves it for unknown paths.

### 4. Cookie banner has no Reject button
**Layer L42.** UK GDPR + EU PECR require Reject to be **as prominent** as Accept. Currently only "Acknowledge" / "Accept" exists. ICO can fine for this.
**Fix:** add a Reject button equal in visual weight to Accept; persist consent state; default to Reject for non-essential cookies.

### 5. Missing CSP header on every response
**Layer L38.** No `content-security-policy` header on any page. With L40 already flagging an inline `onsubmit=` handler, adding CSP today would break the audit form. Order: fix L40 first, then add CSP.
**Fix:** in `public/_headers`, add a CSP that allows Google Fonts + self + Cloudflare. Strip the inline onsubmit (see #6).

### 6. Inline `onsubmit=` handler on the audit form
**Layer L40.** `<form ... onsubmit="return false;">`. Blocks any future strict CSP. Replace with JS event listener that calls `preventDefault()`.

### 7. Color contrast failures on case-study verified seals (3 nodes)
**Layer L10.** `.verified-seal` on Orchid Hotels, CG Oncology, Meraas case panels fails WCAG AA. These are the trust-signal blocks shown to investors and clients. Fix the gold/oxblood combo to use `--gold-text-strong` (#5C3F18) instead of decorative `--gold` (#C9A772) on the oxblood background.

### 8. Color contrast failures on insights post cards (6 nodes home insights, 11 nodes legal sector)
**Layer L10.** `.post-meta`, `.read-link`, `.status-chip` on insights pages fail contrast. Same root cause as #7 — body-size gold accents on light backgrounds need the bronze tokens, not decorative gold. R7 fix didn't reach insights pages.

### 9. Color contrast failures on "Every sector" bento card (4 nodes)
**Layer L10.** `.card-eyebrow`, `.card-shorthand`, `.card-pullquote` on the every-sector card. Bronze token application missed this card.

### 10. Container exceeds 1400px on Full HD desktop
**Layer L15.** At 1920×1080, the outermost container goes edge-to-edge instead of capping at 1400px or using readable margins. Hero/QuickAudit/WhyUs/Sectors all stretch awkwardly wide.
**Fix:** add `max-width: var(--container-max, 1400px); margin-inline: auto` on the body or BaseLayout outer wrapper.

### 11. Click-styled `<span>` elements without keyboard support
**Layer L06.** Pricing tier "See all 8 inclusions", "+", "See all 10 inclusions" are spans with `cursor: pointer` and click handlers, no `tabindex`, no `role="button"`. Keyboard users cannot reach them.
**Fix:** convert to `<button>` (preferred) or add `tabindex="0"` + `role="button"` + Enter/Space key handlers.

### 12. Bot-field input under 16px on mobile (false positive — see calibration note)
**Layer L13.** `INPUT#bot-field` (Netlify honeypot relic from the broken footer form) at 15px. Hidden from real users, but the runner doesn't know that. Will resolve when #1 above lands and the bot-field disappears.

### 13. iOS Safari 16px hit at 768 (false positive variant of #12)
Same root cause as #12.

---

## P1 — brand-degrading (fix before investor demos)

| # | Layer | Finding |
|---|---|---|
| 1 | L05 | Skip link `href="#main"` but no `#main` element exists on insights pages. Screen-reader users can't skip nav. Fix: ensure `<main id="main">` is rendered on every page layout. |
| 2 | L07 | 7 header nav links (`Why Us`, `Sectors`, `Cases`, `Process`, `Pricing`, etc.) show no focus indicator. Keyboard navigation invisible. Add `:focus-visible` outline to all nav `<a>`. |
| 3 | L08 | 6 sector `<article>` elements have an inappropriate ARIA role. Fix: drop the `role="region"` (or whatever's there) — `<article>` is its own landmark. |
| 4 | L09 | Audit result region missing `aria-live` / `role="status"`. Screen readers won't announce when the audit form returns a result. Add `role="status" aria-live="polite"` to `#audit-result`. |
| 5 | L12 | "Cookie policy" footer link is 99×19 — below the 24×24 AA touch target. Same for "← All sectors" / "← Legal & Arbitration" back-links. Add `padding: 12px 0` so hit area ≥ 44×44. |
| 6 | L16 | Hero is 1451px tall at 360×800 (1.81× viewport). User has to scroll to see the audit CTA. Compress mobile hero to ≤ 1100px (drop the vertical right ribbon copy, tighten H1 line-height, defer pull-quote below the fold). |
| 7 | L18 | Reduced-motion partially respected — animation-duration is `1e-05s` (effectively zero) but `animation-name` is still set. Acceptable in practice but a strict implementation would set `animation: none`. **Low priority.** |
| 8 | L36 | JSON-LD on every page is missing `@context` or `@type` at the root. Currently uses `@graph` shape — Google understands it, but schema.org validators flag it. Wrap each item in proper `@context`/`@type` or add at root. |
| 9 | L39 | Google Fonts CSS link has no `integrity` attribute (SRI). Strict security audits will flag. Either self-host Inter/Playfair/Great Vibes or accept the risk (Google Fonts SRI hashes change with every font cache refresh). |
| 10 | L01 | `/insights/legal/sra-transparency-2026/` `<title>` falls outside the 8–80 char range (probably too short). Audit and lengthen. |
| 11 | L35 | `/sitemap.xml` does not contain `<urlset>` or `<sitemapindex>`. Either it's empty, malformed, or 404. Fix: add `@astrojs/sitemap` integration to `astro.config.mjs`. |
| 12 | L44 | No DMARC TXT record at `_dmarc.tamazia.in`. **Already in TAMAZIA-22 §10 pending list.** Resolves when DNS cutover happens. |
| 13 | L47 | Anchor copy "Strategy" not detected on home (false positive — likely encoded inside a data-attribute or script. Calibration fix.) |
| 14 | L49 | Placeholder `href="#"` anchors on home (`View a sample audit →`, `Submit another request`) — these are JS-handled but a visitor with JS off will scroll to top. Either use `<button>` or add proper `href`. |

---

## P2 — annoyance

| # | Layer | Finding |
|---|---|---|
| 1 | L17 | Sector `.card-tooltip` content gets clipped at 200% text zoom (`overflow: hidden` on a tooltip that grows past the card). Allow tooltip to overflow the card or scale font. |
| 2 | L28 | CSS payload 144 KB > 100 KB budget. Astro is shipping per-component scoped CSS without aggressive purging. Run a `tailwindcss --minify` style sweep or split critical CSS. |
| 3 | L33 | DOM size 2,074 nodes on home > 1,500 budget. Largely driven by the 200-law marquee (200 `<li>` × 2 ribbons = 400 list items). Acceptable cost of the brand element; can compress with `<template>`-backed virtualisation if perf score drops. |
| 4 | L19 | `@keyframes diamond-travel` has 4 opacity stops — heuristic flag for possible flash. Visual inspection: it's a slow ambient animation, no flash risk. **False positive — fix the heuristic in L19.** |
| 5 | L34 | `@keyframes diamond-travel` animates `top`; `@keyframes line-draw` animates `width`. Both layout-triggering. Convert `top → translateY`, `width → scaleX`. Micro perf win. |

---

## P3 — polish

| # | Layer | Finding |
|---|---|---|
| 1 | L50 | 5 `.bak` files in `src/components/sections/` (Pricing, FAQ, Contact, Sectors) and `functions/api/_audit.legacy.bak`. No code references them. Delete or move to `_archive/`. |

---

## Calibration to-dos for the runner (V2 of qa-runner)

1. **L13:** exclude inputs that are `display:none`, `visibility:hidden`, or `type="hidden"`. Bot-field is the obvious case.
2. **L18:** treat `animation-duration: 1e-05s` (or any duration < 10ms) as effectively-zero and pass.
3. **L47:** search rendered text content (page.evaluate `innerText`), not just raw HTML. Catches text that's inside data attributes.
4. **L49:** if an anchor has `href="#"` AND a `data-action` / `onclick` / known JS hook attribute, downgrade to P3 (intentional JS button).
5. **L19:** check both opacity stop count AND duration. A 60s ambient animation with 4 opacity stops is not a flash.
6. **L48:** smarter classification of forms — JS-handled forms (with `onsubmit="return false;"` + a JS handler that fetches an API) should test the API endpoint, not the form action.

---

## Recommended Round-12 fix order

**Batch A (this week — pure ship blockers):**
1. L48 #1: build `/api/briefings` Cloudflare Function + replace footer Netlify form. Removes the silent-dropout bug.
2. L40 #6: replace inline `onsubmit` with addEventListener.
3. L43 #2: create cookie-policy, privacy, terms pages.
4. L43 #3: create 404.astro page.
5. L42 #4: add Reject button to cookie banner with equal weight.
6. L38 #5: add CSP header in `public/_headers`.

**Batch B (before next investor demo — accessibility + color):**
7. L10 #7-9: bronze-token sweep on case-verified seals, insights post cards, every-sector card.
8. L05, L06, L07, L08, L09 #11, P1.1-P1.4: accessibility cleanup batch (skip link target, click-spans, focus indicator, aria-live, sector article role).
9. L15 #10: container max-width on Full HD.
10. L16 #6: mobile hero height compression.

**Batch C (SEO/polish — within Round 12 if time permits):**
11. L01 #10, L35 #11, L36 #8: SEO meta, sitemap, JSON-LD schema fixes.
12. L12: touch-target expansion (footer + back-links).
13. L17 #1: tooltip overflow fix.

**Batch D (deferred to Round 13):**
14. L28 CSS budget, L33 DOM count, L34 transform conversion, L50 .bak cleanup.

---

## Files produced this phase

- `00-Briefs/qa-runner/audit.js` — original orchestrator (kept for reference)
- `00-Briefs/qa-runner/audit-route.js` — chunked per-route runner (audit + 5 viewports × default)
- `00-Briefs/qa-runner/audit-once.js` — site-once + per-route runner
- `00-Briefs/qa-runner/audit-perf.js` — Lighthouse runner (mobile + desktop)
- `00-Briefs/qa-runner/audit-merge.js` — merges all chunk findings to `master-report.md`
- `00-Briefs/qa-runner/audit-smoke.js` — single viewport smoke test
- `00-Briefs/qa-runner/lib/axe-runner.js` — axe-core injector helper
- `00-Briefs/qa-runner/lib/lighthouse-runner.js` — Lighthouse + chrome-launcher wrapper
- `00-Briefs/qa-runner/layers/L01–L50.js` — all 50 layer files (3 originally shipped + 47 newly written)
- `00-Briefs/qa-runner/reports/full-1777328305/` — first full run (master-report.md + per-chunk findings.json + screenshots × 20 + Lighthouse JSON × 3)

---

## Sandbox install workaround (for future Cowork sessions)

The default `npx playwright install chromium` exceeds the 45-second sandbox bash timeout. Use this pattern:

```
# 1. npm install (works, ~32s)
cd ~/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner && npm install --no-audit --no-fund

# 2. Chunked Chromium download via curl with -C - resume
URL="https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1217/chromium-linux-arm64.zip"
DEST="/tmp/chromium-1217.zip"
curl -L -C - -o "$DEST" "$URL"   # may need 2 invocations to complete

# 3. Manual extract + marker
TARGET="$HOME/.cache/ms-playwright/chromium-1217"
mkdir -p "$TARGET"
unzip -q -o "$DEST" -d "$TARGET"
touch "$TARGET/INSTALLATION_COMPLETE"

# 4. Repeat for the headless-shell variant (Playwright defaults to it)
URL2="https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1217/chromium-headless-shell-linux-arm64.zip"
DEST2="/tmp/headless-shell-1217.zip"
curl -L -C - -o "$DEST2" "$URL2"
TARGET2="$HOME/.cache/ms-playwright/chromium_headless_shell-1217"
mkdir -p "$TARGET2"
unzip -q -o "$DEST2" -d "$TARGET2"
touch "$TARGET2/INSTALLATION_COMPLETE"
```

Replace `1217` with the version Playwright wants — error message will name it if it changes.

---

**End of TAMAZIA-28.** Awaiting "go" on Batch A or pick-your-own selection.
