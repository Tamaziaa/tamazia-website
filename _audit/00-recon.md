# Phase 0 · Recon — tamazia.co.uk remodel (2026-06-11)

## Repository
- Repo: `Tamaziaa/tamazia-website` (this clone: `work/tamazia-website-union`). Astro 4 static build + Cloudflare Pages Functions. Main is PR-gated (0 required reviews, no force-push, no required status checks — qa/visual checks are chronically red and non-required; CodeQL informational).
- Deploy pipeline (`.github/workflows/deploy.yml`, push to main): gates `node _qa/qa_render.mjs` (0 issues) → `node _qa/backtest.mjs --max-bugs=0` → wrangler functions build → `npm run build` → `node patch-dist.js` (132 checks) → functions compile → `wrangler pages deploy dist/ --branch=main` → post-deploy synthetic + audit-page probe.
- Preview deploys: `npx wrangler@4.19.1 pages deploy dist/ --project-name=tamazia-website --branch=<name>` → unique `<hash>.tamazia-website-3fy.pages.dev` + branch alias URL. This is the founder's "different URL" review surface.
- `dist/` is tracked but vestigial (CI rebuilds). Rule: restore `dist/` to main state before every commit; never track `dist/audit/*` (CodeQL re-attributes the audit bundle's pre-existing alerts as "new").

## Invariants (hard)
1. **Audit engine NO-TOUCH**: `functions/audit/*`, `public/audit/*` byte-identical; `/audit/<slug>/<token>` render contract = r25 assets + `window.D` payload. Canonical probe: `/audit/monzo/yTn7BIzS` → 200, `?v=r25`, `window.D`. (The old checklist's `psiharley` slug is dead — fixture name, not a live slug.)
2. **patch-dist copy contract** (subset that constrains copy work): no em-dashes anywhere in stripped HTML; `400+` ≥4× on homepage; British `enquiry`; `Nasdaq: CGON`; no Indian regulator names; no `pages.dev` in dist; `Verified mandates`; `Aman Pareek` capitalization; Article 27 line ABSENT from footer (gate 47, inverted 2026-06-10).
3. **£1,500 relocation watch**: pricing rewrite removes audit copy from the homepage; before shipping M2, grep patch-dist.js for £1,500/audit assertions and update deliberately (gate-47 precedent). The £1,500 narrative moves wholly to `/instrument/`.
4. Founder gate: nothing deploys to production except after his explicit approval; previews only.

## Current homepage composition (src/pages/index.astro, post-#46)
FinalHero (typewriter H1 "Outrank competitors. / Master regulators. / One agency.", eyebrow "Ranking is only valuable if it is legal.", subs, pull-quote "Your SEO agency doesn't have a lawyer. Ours is run by one.", 400+ chips row, founder pill w/ socials top-right, CTA "Run my free audit" → /instrument/, colophon "LONDON · Engagements delivered in UK, UAE, USA, EU & Worldwide", right laws ribbon ≥1180px)
→ LawsStrip ("Live 400+ regulatory register applied to client work" + 312s marquee)
→ WhyUs (882% / 400+ / £110M+, credential strip, proof strip)
→ Sectors (6 cards w/ animated icons)
→ Interstitial III → CaseStudies (Orchid 840%, Meraas, CG Oncology +96%)
→ Testimonials (100 ★★★★★ cards, 600s marquee, quotes truncate at ~200ch with …)
→ Interstitial IV → HowWeWork → Interstitial V
→ Pricing (Foundation £2,500 / Authority £4,500 Most-popular / Enterprise £9,500; intro currently audit-led — to be rewritten audit-free)
→ Interstitial VI → FAQ (6 questions) → Contact (form + inline Cal.com `tamazia/strategy-call`)
→ SextantInstrument (6-sector dial; **moving to between WhyUs and Sectors in M5**) → Footer.

`/instrument/` = QuickAudit widget only (audit request POST flow + £1,500 + credited line + Monzo sample button) — **M2 rebuilds this into the full audit sales page**.

## Design system ground truth (src/styles/)
- `tokens.css`: 21 colors + 12 gradients (oxblood/gold/ivory family); 3 font families (Playfair Display display, Inter body, Great Vibes signature; self-hosted woff2, font-display swap, 3 preloads in BaseLayout); fluid type tokens (--fs-h1 clamp(46,5vw,88) … --fs-body clamp(15,…,17) ← **floor 15px, raise to 16 in M3**); spacing rhythm --section-padding-block clamp(56,6vw,96) → hard 28px ≤480; motion tokens (durations 200/400/600/900/1400ms, --ease-out cubic-bezier(.2,.8,.2,1)); container 1440px.
- 42 keyframes (animations.css + animations-library.css); reduced-motion coverage ≈100% (32 locations). Known jank: FAQ max-height accordion. Typewriter = setInterval(42ms) innerHTML, IO-triggered (threshold .25) — **check H1 presence in server HTML (LCP/SEO)**.
- Known drift: FinalHero + Sextant hardcoded off-token sizes; h2 clamps differ per section; 22 distinct breakpoint values.
- No >120px section paddings anywhere (max 96). Site is already compact; remodel = precision, not compression-by-force.

## QA harnesses
- `tests/visual/overflow.spec.ts` (Playwright 1.59.1): 6 breakpoints × 5 routes; overflow + screenshot baseline. **No playwright.config.ts exists** → CI `visual` workflow red on every branch (server never starts). P2 adds the config (webServer npm run preview @4321) + 10-viewpoint projects.
- `lighthouse-pa11y.yml` red on every branch: lhci assert config bug ("accessibility is not a known audit") + preview race. Fix in M3; local Lighthouse runs are the gate of record meanwhile.
- `_qa/qa_render.mjs` + `_qa/backtest.mjs` protect the audit render — run before every preview.

## Browser-QA rule (recorded after repeated false alarms)
Hidden/background tabs pause CSS transitions, IntersectionObserver delivery, and rAF: the hero typewriter shows EMPTY and reveals sit at opacity 0 in screenshots of unfocused tabs. **All visual verification through Playwright (pages count as visible) or a foreground tab.** `document.visibilityState === 'hidden'` is the tell.

## Error sweep (input to M1 — full list lives in copy-errors.md)
- CRITICAL: complaints.astro:16 "Indian private limited company… Mumbai"; legal/dpa.astro:109 Indian-law/courts clause.
- HIGH: realfamemedia@gmail.com ×5 (privacy.astro:31,120; privacy-notice.astro:39,132; terms.astro:129).
- MEDIUM: testimonials.ts:84 "Definately"; footer.ts:62 cin "Registration in progress" (founder: remove line entirely); data-protection.astro:80 India processor mention.
- MINOR: insights.ts India/Mumbai illustrative stubs (lines ~88, 116-117).

## Founder decisions in force (2026-06-11)
Audit-free pricing intro (I choose); £1,500 audit lives only on /instrument/ with Monzo specimen; Sextant → WhyUs↔Sectors + compact + curated laws + Healthcare local-intent framing; unlinked greyscale Trustpilot/Google/Clutch 5-star marks, no counts; remove cin line; testimonials = stars + full-fit quotes (no type labels, no ellipsis); hero gets "If you market online, you are regulated"; animated-icon system site-wide above current quality; cookie banner (UK/EU/US/ME compliant, themed, Accept+Reject equal, Consent Mode v2); auto-mode execution, single end review, deploy only on his approval.

## Live baseline
Screenshots: `_audit/baseline-screenshots/live/` — home at all 10 viewpoints; /instrument/ + cg-oncology case at 375/1280/1440. Captured with reveal-settling scroll pass (see `_audit/tools/live-baseline.mjs`).
