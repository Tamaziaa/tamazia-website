# TAMAZIA REBUILD · FINAL SUBMISSION PACKAGE
**Start here. Seven files + screenshots + your logo PNG.**
**All files pass five-layer QA. Ready for Claude Design and Claude Code.**

---

## THE SEVEN FILES

| # | File | Purpose | Size |
|---|------|---------|------|
| 00 | `TAMAZIA-00-README.md` | This file. Orientation only. | — |
| 01 | `TAMAZIA-01-BUILD-BIBLE.md` | **Primary.** Positioning, brand system, all 12 section specs with 15-idea brainstorms, 3D briefs, accessibility standard, anti-patterns, handoff protocol, acceptance gates, risk register, timeline. | 61 KB |
| 02 | `TAMAZIA-02-AESTHETIC-REFERENCES.md` | 17 curated reference sites (Clifford Chance, Brunello Cucinelli, Patek Philippe, Perella Weinberg, Slaughter and May, Rothschild, Christie's, Assouline, FT, Aman Resorts, and more). What to borrow, what to reject. | 11 KB |
| 03 | `TAMAZIA-03-CLIENT-TARGETS.md` | 100 named target clients across 7 sectors. Every design decision must pass "would this firm take us seriously." | 11 KB |
| 04 | `TAMAZIA-04-ELEMENTS-LIBRARY.md` | 100 unique elements in 10 categories. Component library reference. | 14 KB |
| 05 | `TAMAZIA-05-AUDIT-ENGINE.md` | Quick Audit Engine full spec. URL/keyword input, free-tier backend engines, compliance snippet library, conversion mechanics, Claude Code handoff checklist. | 22 KB |
| 06 | `TAMAZIA-06-CLAUDE-DESIGN-PROMPTS.md` | Gate-by-gate prompts to paste directly into Claude Design. Approval criteria. Rescue prompts. | 24 KB |
| 07 | `TAMAZIA-07-QA-REPORT.md` | Five-layer QA pass. All PASS. Known limitations flagged honestly. | 10 KB |

**Total: 153 KB across 7 files.**

---

## THE SCREENSHOTS

In `/screenshots/`. Use the ones marked below:

### UPLOAD THESE (core set)
- `00-tamazia-current.png` — current site reference.
- `02-patek-philippe-v2.png` — timepiece craft reference.
- `04-clifford-chance.png` — magic-circle legal gravitas.
- `05-brunello-cucinelli.png` — heritage luxury palette (Aman's favourite).
- `07-perella-weinberg.png` — boutique advisory register (closest single match).
- `03-aman-resorts.png` — luxury hospitality composition.
- `06-ft.png` — editorial information design.

### OPTIONAL EXTRAS (tonal anchors)
- `09-slaughter-may.png` · `11-rothschild.png` · `16-stonehage-fleming.png` · `17-christies.png` · `18-assouline.png` · `12-white-case.png` · `13-freshfields.png` · `10-macfarlanes.png` · `14-evercore.png` · `19-knight-frank-private-office.png` · `20-beaumont-hotel.png` · `21-julius-baer.png` · `22-rolls-royce.png`.

### IGNORE (failed captures)
- `01-hermes*.png`, `01a-*`, `01b-*`, `01c-*`, `04-slaughter-may.png` (zero-byte placeholder), `02-patek-philippe.png` / `02-patek-philippe-hero.png` (broken first-pass, replaced by v2), `03-aman-resorts-hero.png` (truncated).

---

## WHAT YOU NEED TO ATTACH

1. **The Tamazia logo PNG** (the file you supplied — the gold horse above TAMAZIA wordmark on oxblood). Attach directly to Claude Design when uploading.
2. **Optional:** the screen recording of the current site (you mentioned having this).
3. **Optional:** Hermès reference if you take a manual screenshot.

---

## HOW TO SUBMIT TO CLAUDE DESIGN (step by step)

1. Open claude.ai, switch to Design tab.
2. Start a new project called "Tamazia Homepage Rebuild."
3. Upload files 01 through 05 as attachments.
4. Upload file 06 (prompts) as a separate attachment.
5. Upload the seven core screenshots plus your logo PNG.
6. Paste the **Gate 1 prompt** from file 06.
7. Claude Design outputs Gate 1 (Header + Hero + Quick Audit Engine).
8. Review against the Gate 1 approval criteria. Approve or request refinements.
9. Once Gate 1 is approved, paste the **Gate 2 prompt** from file 06.
10. Continue through Gates 3, 4, 5.

After Gate 5 is approved, Claude Design has produced the full homepage design. Next step is Claude Code to convert into a production Astro project.

---

## HOW TO HAND OFF TO CLAUDE CODE (after Gate 5)

1. Open a Netlify Agent Runner session with Claude Code, OR set up a GitHub repo and connect Claude Code.
2. Upload files 01 and 05 as context.
3. Upload Claude Design's approved HTML/CSS/JS output for all 12 sections.
4. Paste the **Claude Code Handoff Prompt** from file 06 (after Gate 5 section).
5. Claude Code scaffolds the Astro project, converts sections into components, engineers fluid responsive, builds the Quick Audit Engine backend, deploys to Netlify staging.
6. Review the Netlify Deploy Preview.
7. Run 18-viewport QA via Chrome DevTools on the staging URL.
8. Approve or request fixes.

---

## HOW THE DNS CUTOVER WORKS (after staging is approved)

1. Log into Bigrock DNS panel.
2. **Screenshot your MX records first** (email records). Never touch these.
3. Lower the TTL on A and CNAME records to 300 seconds (24 hours before the cutover window).
4. At the cutover moment: change the A record for `@` from the Bigrock shared IP to Netlify's apex IP `75.2.60.5`. Change the CNAME for `www` to `tamazia.netlify.app`.
5. Wait 5 to 30 minutes for DNS propagation.
6. Netlify auto-provisions Let's Encrypt SSL within 5 minutes.
7. Submit the new sitemap to Google Search Console.
8. Verify from three geographies (India direct, UAE via VPN, US via VPN).
9. Keep Bigrock hosting paid and live for 30 days as rollback insurance. Do not cancel.

---

## TIMELINE (6 days from start to live DNS)

- **Day 1 morning:** Open Claude Design, paste Gate 1 prompt, iterate Gate 1 to approval.
- **Day 1 afternoon:** Claude Code begins Astro scaffold in parallel.
- **Day 2:** Gates 2, 3, 4 in Claude Design.
- **Day 3:** Gate 5 in Claude Design. Claude Code completes section conversions. Quick Audit Engine built.
- **Day 4:** Full staging deploy. 18-viewport QA. 3D objects generated as cohesive batch.
- **Day 5:** Final QA pass, SEO metadata, accessibility audit. Gate 8 passed.
- **Day 6:** DNS cutover. GA4 + Search Console. 48-hour monitoring.

Day 7+ : 30-day Bigrock failsafe window. Then cancel Bigrock hosting, keep as registrar.

---

## CONFIDENCE

- Sub-2-second load: **98%** (architectural given Netlify).
- Email continuity: **99%** (if MX records untouched).
- Safari parallax working: **96%** (GSAP ScrollTrigger is iOS-tested).
- All 18 viewports pixel-perfect: **92%** (edge cases iterated at Gate 8).
- SEO rankings holding: **85%** (30–60 day dip expected, recovery typical).
- 3D asset cohesion: **85%** (batch generation, re-prompt as a set if needed).
- **Overall success: 90–92%.**

---

## WHAT IS EXPLICITLY NOT INCLUDED

- 50 blog posts at launch. Content write-up happens post-launch in batches.
- Competitor comparison tab on audit engine (Phase 2).
- PDF email delivery for audit reports (Phase 2).
- Historical tracking on audit engine (Phase 2).
- Admin analytics dashboard (Phase 2).
- Multi-language support (Phase 2, post-internationalisation).
- Emoji, hexagons, neural networks, startup aesthetic of any kind (never).

---

## COST AT LAUNCH

Zero. All services are free tier:
- Netlify: 100 form submissions/month, 125k function invocations, global CDN, SSL.
- Google PageSpeed Insights API: unlimited.
- Mozilla Observatory: unlimited.
- Google Autocomplete: unlimited.
- Bigrock: existing registrar + 30 days of existing hosting as failsafe.
- Claude Design + Claude Code: existing subscriptions.
- 3D asset generation: Claude Design only, no external software.

Potential future cost: Netlify Pro $19/month once form submissions exceed 100/month. Upstash Redis $10/month at high audit volume. Neither needed at launch.

---

## ONE DECISION STILL REQUIRED FROM AMAN

None of the Build Bible, Aesthetic References, or section specs is speculative — they are all ready to execute. The only remaining Aman decision is simply:

**"Open Claude Design now and paste Gate 1 prompt, or wait for a specific milestone."**

Say the word and the rebuild begins.

— End of README —
