# Tamazia Audit Report — Visual / UX Bug Checklist

Live render driven in a real browser (Preview MCP, port 8790). Fixtures audited: `psiharley` (UK healthcare), `psiloaf` (ecommerce), `psithird` (gym), `altamimi-law-uae` (UAE law, PSI fallback). Viewports: desktop **1366×768** and mobile **390×844**.

Each bug: `- [ ] #NN [fixture/viewport][section] description — evidence`.

---

<!-- BUGS APPENDED BELOW -->

## Rail / sidebar nav

- [ ] #1 [psiharley/desktop][rail] Rail KPI block (`.rail-kpis`) is `display:none` — the four headline KPIs "18 Critical findings / 79 Confirmed v. evidence / 0 AI share of voice / 22 Domain rating" are in the DOM but never shown, leaving a premium-feeling sidebar with dead/hidden content where the most scannable numbers belong — evidence: `getComputedStyle('.rail-kpis').display === 'none'`, 4 child `.rail-kpi` all w:0 h:0
- [ ] #2 [psiharley/desktop][rail] Brand logo box (`.rail-logo`, 192×36) is completely empty — no `<img>`, no background-image, no initials/text fallback; renders as blank space above the gauge — evidence: `.rail-logo` innerHTML "", childCount 0, backgroundImage none
- [ ] #3 [psiharley/desktop][rail] Exposure figure "£207k" (`.rail-exposure .v`) is vertically clipped — font-size 24px but line-height 21.6px, scrollHeight 26 > clientHeight 22; the £ glyph / descenders are cut — evidence: `.rail-exposure .v` sh:26 ch:22, fontSize 24px / lineHeight 21.6px
- [ ] #4 [psiharley/desktop][rail] Tiny font: rail KPI labels render at 8px, rail nav-title ("Jump to") and exposure label at 8.5px, trust line at 9px — all below the 9px floor and hard to read in a CEO-facing premium report — evidence: `.rail-kpi .l` 8px, `.rail-navtitle` 8.5px, `.rail-trust` 9px
- [ ] #5 [psiharley/desktop][rail] Rail nav items (`.railnav button`) are only 23px tall (one is 36px) — well under the 40px tap-target minimum; cramped click targets even on desktop and unusable on touch — evidence: 6 `.railnav button` heights = 23,23,36,23,23,23

## Verdict / hero

- [ ] #6 [psiharley/desktop][verdict] Verdict "fix" chips (`.vfix`) scroll the target finding to ~609px down a 768px viewport (heading lands ~79% down, the "jump-to-bottom" anti-pattern) instead of pinning it near the top like the rail nav does (top:12) — the report's most prominent CTAs leave the user looking at the wrong place — evidence: after `.vfix[data-finding=fx-1].click()` scrollY 729, finding heading top:609 (winH 768); compare rail-nav Regulatory which lands pillar at top:12
- [ ] #7 [psiharley/desktop][verdict] Verdict "fix" chip does NOT open/expand the finding it links to — after clicking `.vfix[data-finding=fx-1]` the target finding fx-1 remains collapsed (height 56, open=false), so the user scrolls to a closed row and must hunt+click again — evidence: fxOpenAfter false, fxHeight 56 after chip click
- [ ] #8 [psiharley/desktop][verdict] Verdict fix chips are unreliable under the page's own smooth-scroll: a real mouse click (smooth-scroll active) frequently nets zero scroll (scrollY returns to 0) — the navigation visibly fails for a real user — evidence: preview_click on `.vfix[data-finding=fx-1]` left scrollY 0, target fx-1 still at top:1337 across repeated attempts

## Overview — finding cards (7-layer dimgrid) + hero/overview charts

- [ ] #9 [psiharley/desktop][overview] The 10 metric cards (`.dimgrid > .dimcard`) render in two rows of UNEQUAL height — row 1 = 100px, row 2 = 112px — because each row sizes to its tallest card and the two rows differ; produces a visibly ragged horizontal seam in a flagship "scorecard" grid — evidence: row1 cards y:223 h:100, row2 cards y:332 h:112
- [ ] #10 [psiharley/desktop][overview] Large wasteful empty space inside short metric cards: single-line cards ("On-page SEO", "Technical SEO", "AI/GEO visibility", "Authority & backlinks") have a 14px summary in a 100–112px card while neighbours pack 42px (3 lines) — content height ≪ box height, cards look half-empty — evidence: `.dcs` heights vary 14→42px within equal-height cards
- [ ] #11 [psiharley/desktop][overview] "Where Tamazia takes you" projection chart SVG is horizontally stretched: viewBox is `0 0 820 150` but it renders 912px wide with `preserveAspectRatio="none"`, distorting the x-axis (and any glyphs) by ~11% — evidence: `#sec-overview svg` rendered w:912 vs viewBox width 820, preserveAspectRatio none
- [ ] #12 [psiharley/desktop][overview] Waterfall bar width uses an un-rounded inline style `width:50.612444879960805%` (15 decimal places) — sloppy generated output, should be rounded — evidence: `.wf-row .bar-fill` style attr
- [ ] #13 [psiharley/desktop][overview] Tiny fonts pervasive inside open findings: `.fix-rib` ("✓ every mandate") renders at **7.5px**, `.shot-live`/`.cap` at 8px, `.tag`/`.lk` at 8.5px — multiple labels well under the 9px legibility floor in a document shown to senior partners — evidence: `.fix-rib` 7.5px, `.shot-live` 8px, `.cap` 8px, `.tag` 8.5px, `.lk` 8.5px
- [ ] #14 [psiharley/desktop][overview] Low-contrast caption text: `.cap` ("statutory ceiling · evidence-led") is rgb(110,98,95) grey on white at only 8px — fails comfortable contrast for tiny text — evidence: `.cap` color rgb(110,98,95) on #fff, fontSize 8px
- [ ] #15 [psiharley/desktop][overview] In-finding price span "£3k–£67k▸" overflows its container by ~6px (the trailing chevron clips) — evidence: SPAN scrollWidth-clientWidth = 6 inside fx-1

## Regulatory — framework boxes + Article-grouped breaches

- [ ] #16 [psiharley/desktop][regulatory] Tiny fonts throughout: jurisdiction badge (`.jbadge`), section label "Why this framework matters" (`.lbl`), inspection note (`.art-insp`) all 8.5px, and the "Tamazia fix" `<b>` label 8px — below 9px floor — evidence: `.jbadge`/`.lbl`/`.art-insp` 8.5px, fix `<b>` 8px in `#sec-regulatory`
- [ ] #17 [psiharley/desktop][regulatory] Severity dots in breach lists (`.art-dot`) are only 7×7px — very small for the primary severity signal a partner scans; easy to miss critical-vs-standard — evidence: `.art-dot` rendered 7×7px (colors are correct: c red, h amber, s gold)
- [ ] #18 [psiharley/desktop][regulatory] Section sub-text widths are inconsistent: `.reg-sub` is 760px wide but the `.jur-select` filter row directly below spans 946px and the intro paragraph spans full width — ragged left-aligned blocks of differing measure — evidence: `.reg-sub` w:760 vs `.jur-select` w:946 at same x:292

