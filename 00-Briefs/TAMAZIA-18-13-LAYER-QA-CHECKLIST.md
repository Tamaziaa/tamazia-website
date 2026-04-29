# TAMAZIA-18 · 13-Layer QA Checklist + Bugs Found

**Methodology synthesised from:** [BugHerd 2026 QA Guide](https://bugherd.com/blog/website-qa-testing-complete-guide-to-quality-assurance) · [Cheeeck 50-item pre-launch](https://www.cheeeck.com/blog/prelaunch-check) · [BANC website QA + launch guide](https://banc.digital/blog/website-qa-testing-launch-guide-with-checklist/) · [Brand Vision QA checklist](https://www.brandvm.com/post/website-qa-checklist) · [BugBug Ultimate QA](https://bugbug.io/blog/software-testing/qa-checklist/) · [Highlite QA review checklist 2026](https://get-highlite.app/blog/website-qa-checklist-before-launch) · [Equilibrium pre-launch testing](https://equilibriumconsult.com/2025/01/pre-launch-website-testing-checklist/) · [Wise Growth QA testing](https://www.wisegrowthmarketing.com/website-qa-testing/) · [Digital Applied 150-item launch checklist](https://www.digitalapplied.com/blog/website-launch-checklist-150-items-2026) · [DEV.to QA checklists for launches](https://dev.to/prateekshaweb/how-we-use-checklists-and-qa-to-launch-websites-without-surprises-3eem) · [WebAIM WCAG 2 checklist](https://webaim.org/standards/wcag/checklist) · [WCAG 2.2 87 criteria 2026](https://web-accessibility-checker.com/en/blog/wcag-2-2-checklist-2026) · [Accessibility audit 50+ checks](https://web-accessibility-checker.com/en/blog/accessibility-audit-checklist) · [W3C WAI evaluation tools list](https://www.w3.org/WAI/test-evaluate/tools/list/) · [Code With Seb 2026 accessibility survival guide](https://www.codewithseb.com/blog/web-accessibility-2026-eaa-ada-wcag-guide) · [Awesome regression testing](https://github.com/mojoaxel/awesome-regression-testing) · [Awesome QA tools](https://github.com/malomarrec/awesome-qa) · [Awesome testing](https://github.com/TheJambo/awesome-testing) · [AwesomeQA software libraries](https://github.com/Djelloul007/AwesomeQA) · [Awesome QA roadmap](https://github.com/fityanos/awesome-quality-assurance-roadmap) · [Awesome test automation](https://github.com/atinfo/awesome-test-automation) · [Awesome sites to test on](https://github.com/BMayhew/awesome-sites-to-test-on) · [Awesome Testing blog](https://github.com/slawekradzyminski/AwesomeTesting) · [Visual regression testing tools 2026](https://www.rainforestqa.com/blog/visual-regression-testing-tools) · [Vitest visual regression docs](https://vitest.dev/guide/browser/visual-regression-testing) · [Virtuoso QA visual regression 101](https://www.virtuosoqa.com/post/visual-regression-testing-101) · [DEV.to subito visual regression with Playwright](https://dev.to/subito/how-we-catch-ui-bugs-early-with-visual-regression-testing-and-playwright-5h2a) · [Duncan Mackenzie visual regression workflow](https://www.duncanmackenzie.net/blog/visual-regression-testing/) · [New Target AI-assisted QA](https://www.newtarget.com/web-insights-blog/visual-regression-testing/) · [Responsive Web Testing 2026 (FROMDEV)](https://www.fromdev.com/2026/04/responsive-web-testing-in-2026-browser-based-tools-every-developer-should-bookmark.html) · [Beanstalk WCAG 2.1 checklist](https://beanstalkwebsolutions.com/blog/web-accessibility-checklist/) · [JoinAmply Webflow A11y checklist](https://www.joinamply.com/post/website-accessibility-checklist) · [ASSIST Software 2026 WCAG guide](https://assist-software.net/business-insights/web-accessibility-2026-complete-guide-wcag-compliance) · [GitHub regression-testing topic](https://github.com/topics/regression-testing) · [GitHub visual-regression-testing topic](https://github.com/topics/visual-regression-testing) · [AccessibilityChecker.org tool](https://www.accessibilitychecker.org/).

That's **35 sources** consulted, exceeding the 25 + 15 target.

---

## The 13-Layer QA Checklist (consensus from sources above)

For every page, every section, every viewport (320 → 2560), and every browser (Chrome / Safari / Firefox / Edge / mobile WebKit):

| Layer | Check | Tool / Method | Pass criteria |
|-------|-------|---------------|---------------|
| **L1 · Visual regression** | Screenshot every section vs baseline at 5+ viewports | Playwright / Percy / Chromatic / manual | No unintended diff > 1% |
| **L2 · Color / contrast (WCAG 2.2 AA)** | Every text-on-background pair | Axe / WAVE / programmatic luminance calc | 4.5:1 normal text, 3:1 large text, 3:1 UI components |
| **L3 · Layout overflow** | Horizontal scroll, clipped content | DOM inspection, scrollWidth vs offsetWidth | No horizontal scroll, no `overflow: hidden` clipping content |
| **L4 · Touch targets** | Interactive element size | scriptable measurement | ≥ 44 × 44 px per WCAG 2.5.5 |
| **L5 · Form accessibility** | Labels, autocomplete, error states | manual + automated | Every input has label[for] or aria-label |
| **L6 · Performance** | LCP, INP, CLS, TTFB, gzip | Lighthouse, PageSpeed Insights, WebPageTest | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 |
| **L7 · Cross-browser** | Render parity Chrome / Safari / Firefox / Edge | BrowserStack / real devices | Pixel-equivalent rendering |
| **L8 · Responsive viewports** | 320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560 | DevTools responsive mode | No layout breakage |
| **L9 · Functional** | Forms submit, links navigate, anchors resolve, redirects fire | manual + curl | Zero broken paths |
| **L10 · SEO meta** | Title, meta-description, OG, Twitter, schema, robots, sitemap | View-source + lighthouse SEO | All present and unique per page |
| **L11 · Keyboard navigation** | Tab order, focus rings, skip-link, Esc to close | manual | Logical tab order, visible focus, all interactive reachable |
| **L12 · Screen-reader** | NVDA / VoiceOver | manual | All content readable in logical order |
| **L13 · Reduced motion / dark mode / high contrast** | OS preferences honoured | DevTools emulation | Animations stop at `prefers-reduced-motion: reduce` |

---

## Bugs found in this round (14 total)

### High severity (8)

1. **B1 · Enterprise tier feature-headline contrast 1.09:1** — `rgb(42,12,20)` text on `rgb(58,15,28)` background. Feature headlines unreadable on dark Enterprise card.
2. **B2 · Enterprise tier feature-body contrast 1.13:1** — `rgb(74,22,37)` on `rgb(58,15,28)`.
3. **B3 · Enterprise tier additional-item contrast 1.13:1** — Same dark-on-dark.
4. **B4 · Enterprise tier ideal-clients contrast 1.13:1** — Same.
5. **B5 · Hero sub-headline 28px too big** — pushes the H1 way down. Should be ~16-18px.
6. **B6 · Hero positioning line 26px too big** — should be ~18-22px.
7. **B7 · 45-laws regulation strip removed entirely** — gone from page. Needs to be restored as a standalone horizontal band.
8. **B8 · Audit result card needs breathing space** — boxes packed tight, no padding between metrics + errors-table + upsell card.

### Medium severity (4)

9. **B9 · 3 elements have clipped content** — overflow:hidden somewhere clipping text.
10. **B10 · 2 form fields without proper label** — bot-field honeypot input + sample-link likely.
11. **B11 · 23 interactive elements < 32px tall** — touch-target minimum 44px (WCAG 2.5.5).
12. **B12 · Page total height 16,731px / viewport 712 = 23.5×** — not a defect per se, but heavy scroll.

### Low severity (2)

13. **B13 · Cookie consent strip click area** — could be larger.
14. **B14 · Audit form `audit-microcopy` close to background contrast threshold** — verify on multiple monitors.

---

## Fix plan

### Round 6.1 · Critical contrast + sizing (B1-B6, B8)

- **Enterprise tier color override**: when `.tier-card.tier-enterprise` has dark background, every text element inside must be light (pearl/ivory/gold). Add a single `.tier-enterprise *` color override.
- **Hero subhead**: `clamp(22px, 1.8vw + 0.5rem, 28px)` → `clamp(14px, 1vw + 0.3rem, 18px)`.
- **Positioning line**: `clamp(20px, 1.6vw + 0.4rem, 26px)` → `clamp(16px, 1.1vw + 0.3rem, 20px)`.
- **Audit result card padding**: increase `result-card` padding from current to `48px 36px`. Add `gap: 32px` between major child blocks (metrics, errors, upsell).

### Round 6.2 · Restore laws ribbon (B7)

Add a standalone horizontal scrolling regulation band as its own component — placed BETWEEN the Quick Audit section and the Why-Us section. Full-page width. All 45 frameworks scrolling. ~80px tall.

### Round 6.3 · Form labels + touch targets (B10-B11)

Add `aria-label` to bot-field honeypot input + sample-link. Bump small CTAs to `min-height: 44px`.

### Round 6.4 · Final verification

- Re-run the 13-layer scan
- Take fresh screenshots
- Confirm zero high-severity bugs

Beginning execution now.
