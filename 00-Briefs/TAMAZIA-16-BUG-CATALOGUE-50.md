# TAMAZIA-16 · 50-Bug Catalogue + Persona Walkthrough + Fix Plan

**Inspection method:** Live HTML + minified CSS pulled from production, parsed for structure, sizing, copy fidelity. Cross-referenced against tamazia.in snapshot (TAMAZIA-13).

**Layers:**
1. **Visual / layout** — text cropping, overflow, alignment, viewport-fit, gaps
2. **Functional** — broken renders, dead JS, form fields, anchors
3. **Content / copy fidelity** — verbatim mismatch with tamazia.in
4. **Brand register / persona** — what 20 high-end client personas would reject
5. **Polish / unique elements** — what each section needs to feel finished

---

## LAYER 1 · VISUAL / LAYOUT (Bugs 1-15)

| # | Bug | Where | Severity |
|---|-----|-------|---------|
| **B-01** | **Pricing tier cards show only 4 generic icons (Audit / Team / Deliverables / Review)** instead of the rich 8-10 feature list from the live site. The rich data exists as `featuresDetailed` but the component renders only the legacy `features` stub. | Pricing, all 3 tiers | **Critical** |
| **B-02** | **H1 typewriter renders the literal text `{{One agency.}}`** — the curly-brace markers are in the `data-text` attribute and the CSS pseudo-content prints them verbatim including braces. | Hero, H1 line 3 | High |
| **B-03** | Sector card `.card-inner` has fixed-height interior — long body paragraphs overflow the card, especially Legal and Real Estate (200+ word bodies). Text cuts off behind tooltip. | Sectors, all 6 cards | High |
| **B-04** | Hero `.hero` has no explicit `min-height: 100vh` — the section fills naturally but on 1440×900 there's still ~300px of below-fold content (compliance paragraph, client ribbon). Goal was 100vh fit. | Hero | High |
| **B-05** | Section padding-block uses `clamp(80px, 10vw, 160px)` — at desktop this is 144-160px top + bottom giving ~300px between sections. Too generous; reads as empty space. | Every section transition | Medium |
| **B-06** | Hero author signature "Aman Pareek" in Great Vibes — capital A is rendered but the signature flourish underline animates 7.9s after page load, creating awkward delay where signature looks unfinished. | Hero, signature block | Medium |
| **B-07** | Author frame "corner brackets" (tl/tr/bl/br) rendered with absolute positioning relative to `.author-frame` but the frame doesn't have `position: relative` set explicitly — corners may misalign on first paint. | Hero, author frame | Medium |
| **B-08** | Audit result `.result-card` does not set `overflow: visible` — the new errors-table + upsell card may clip if total height exceeds parent. | Quick Audit, result state | Medium |
| **B-09** | `.case-stat` value font-size is `clamp(96px, 15vw + 1rem, 220px)` — at 1440 viewport that's ~225px, too large for the case-right column which now hosts a 3-metric stack (each up to 64px font). Value pushes column wider than designed. | Case Studies, right column | Medium |
| **B-10** | Sectors monogram T watermark `font-size: 680px` is hardcoded — overflows tablet/mobile viewports. Should use `min(60vw, 680px)`. | Sectors background watermark | Medium |
| **B-11** | The `--obsidian` CSS variable is now `#3A0F1C` (oxblood-deep) but legacy `bg-obsidian` was renamed to `bg-oxblood` only inline; CSS classes still reference `--obsidian` which works as fallback but variable name is misleading. | Tokens / Case Studies | Low |
| **B-12** | Hero ribbon (rotated regulation list) uses `position: fixed` margin column on right edge — on viewports 1024-1280 it overlaps the H1 right margin. | Hero, regulation ribbon | Medium |
| **B-13** | Top bar credentials (`heroContent.eyebrow = "TAMAZIA · The Practice"`) is the WRONG text — the gate-A directive was the institutional credentials line. Eyebrow needs to render the dateline array (CIArb · ABA · LLM King's). | Header, top bar | High |
| **B-14** | Pricing tier-includes-prior line "Everything in Foundation, included" only appears in Authority + Enterprise tiers; the Foundation card looks naked compared to the others — needs a top hairline marker for visual parity. | Pricing, Foundation tier | Low |
| **B-15** | Footer "back-to-top" button if present has no scroll behavior wired; also footer credentials line not styled with letter-spacing as promised. | Footer | Low |

## LAYER 2 · FUNCTIONAL (Bugs 16-25)

| # | Bug | Where | Severity |
|---|-----|-------|---------|
| **B-16** | Pricing component renders `featureIcons[f]` where `f` is a string from the legacy stub — but the rich `featuresDetailed` array is silent. The component needs a full rewrite to consume `featuresDetailed`. | Pricing component | Critical |
| **B-17** | FAQ accordion uses `<summary>` + `<details>` natively — answer is the joined `answerParagraphs` array (concatenated with double spaces, no `<p>` tags), so paragraphs run as a wall of text. | FAQ accordion answers | High |
| **B-18** | FAQ Q2 "Which sectors does Tamazia work with…" should render the 8 sub-sector breakdown (Hotels, Law, Healthcare, F&B, Real Estate, Financial, Education, Luxury Retail/etc.) but the component just dumps the array's first paragraph. Sub-sector data lives in `sectorBreakdown` but is unused. | FAQ Q2 | High |
| **B-19** | FAQ Q4 "Audit cover" should render the 4 scope blocks (Technical, Compliance, Competitive, AI search) but the component dumps the intro paragraph only. `auditScope` array is unused. | FAQ Q4 | High |
| **B-20** | Audit form submission still sends `{ input }` only — the inline JS DOES wire email + sector but the function in production may be running an older deploy. Confirmed via earlier test that v2 logic works, but verifying. | Audit form / API | Medium |
| **B-21** | Hero H1 typewriter: the JS reads `data-text` attribute and types it character-by-character; brace markers render as part of the text. Needs to either pre-process the marker before assigning data-text, or use `parseEmph()` and skip typewriter for the marker spans. | Hero H1 typewriter | High |
| **B-22** | Sector card "tooltip" uses CSS hover state — on touch devices the regulation list never surfaces. No tap-to-reveal. | Sector cards mobile | Medium |
| **B-23** | Article body in Insights renders paragraphs but no styling for emphasis, links, lists, or quotes — articles will look flat as more posts are added. | /insights/[sector]/[slug] | Medium |
| **B-24** | Insights index has `</BaseLayout>` followed by stray markup at end of file — visible `</BaseLayout>` text at bottom of index page. (Hypothesis from template fix needed.) | /insights/ | Low |
| **B-25** | The hero `.fleuron` decorative block (rule + asterism + rule) sits between subhead and pull-quote — the asterism `&#10086;` renders but the rules don't have explicit width, may collapse to 0 on narrow viewports. | Hero fleuron | Low |

## LAYER 3 · CONTENT / COPY FIDELITY (Bugs 26-35)

| # | Bug | Where | Severity |
|---|-----|-------|---------|
| **B-26** | Pricing tier card "description" field renders `idealClients` text (e.g., "Single-location hotels, clinics…") but the live tamazia.in puts that text BEFORE features as "Best for X". Currently appears AFTER features as a subdued paragraph — wrong information hierarchy. | Pricing all tiers | High |
| **B-27** | Authority tier "Most popular" gold ribbon is rendered but uses the live "Most popular" string with sentence case — tamazia.in shows "Most popular" lowercase, the rebuild now matches but the ribbon is positioned `top: -14px` and gets clipped if `tier-card` has `overflow: hidden`. | Pricing Authority ribbon | Medium |
| **B-28** | The Authority and Enterprise tiers' `additionalCapabilities` arrays (6 add-on bullets each) are completely missing from rendering. These are the live site's "Additional capabilities commonly added at this tier" lists. | Pricing Authority + Enterprise | Critical |
| **B-29** | Hero compliance paragraph ("Every campaign…200+ laws…") is rendered as plain prose without highlighting the regulator names (GDPR, FCA, SRA, etc.) — live site visually emphasises these in caps + tracking. | Hero compliance paragraph | Medium |
| **B-30** | Why Us metrics 882% / 200+ / $110M+ rendered but no rolling-counter animation triggers on scroll-into-view — they're static numbers. Was specified as a Gate D animation. | Why Us metrics | Medium |
| **B-31** | Case Study "verifiedNote" ("GA4 VERIFIED · INTERNAL BOOKING SYSTEM CROSS-REFERENCED") renders next to the "VERIFIED" pill but the verified note for Meraas should NOT include "GA4" since it's not a metrics-driven case study — needs sector-specific note. | Meraas verified note | Low |
| **B-32** | The hero client ribbon prefix "Trusted by" is rendered but has no visual separation from the list — should have a vertical hairline or extra padding. | Hero client ribbon | Low |
| **B-33** | Sectors card pull-quote (e.g., "2 million legal professionals…") shows below the body text but inside the card — too cluttered. Should sit OUTSIDE the body block as a footer-quote element. | Sector cards | Medium |
| **B-34** | The audit form's three labels (Website, Work email, Sector) all use the same gold uppercase 11px style — visually identical. The Website field needs to be visually-emphasised as primary. | Audit form labels | Low |
| **B-35** | The Insights `/insights/` hero says "Sector intelligence for regulated enterprises" — should match the homepage register: "Insights for regulated enterprises. Compliance and SEO findings written against the framework that governs you." | Insights index hero | Low |

## LAYER 4 · BRAND REGISTER / PERSONA WALKTHROUGH (Bugs 36-45)

For each persona, what they would reject or expect to see and don't:

| # | Persona | What's missing or wrong |
|---|---------|--------------------------|
| **B-36** | **Magic Circle senior partner (Clifford Chance / Linklaters / A&O Shearman tier)** — Would reject: any startup-tone language. Wants to see: London office address (not just "London"), peer-firm references, ICC arbitration experience explicitly named. **Missing**: Tamazia does not list a London office address anywhere — this damages credibility for the persona who wants to know which floor of which building you're on. |
| **B-37** | **US BigLaw GC (transitioning to family office)** — Wants: Reg FD competency mentioned in pricing tier, ABA Model Rules cited in Legal sector card. **Missing**: Both are mentioned in copy but not surfaced as a skim signal. |
| **B-38** | **Sovereign wealth fund portfolio manager** — Wants: explicit zero-incident track record visible. **Missing**: "Zero compliance incidents" is on Meraas + CGON case panels but not aggregated as a top-of-page proof. Should appear in Why Us metrics box. |
| **B-39** | **UAE HNW developer CEO (Emaar / Meraas tier)** — Wants: Arabic-market signal, Trakheesi mentioned, Sheikh Mohammed framing. **Missing**: Arabic capability not surfaced anywhere; Trakheesi is in Real Estate sector card body but not in any header. |
| **B-40** | **London Mayfair boutique hotel GM** — Wants: "£50-80k/year saved" exact stat for their property size. **Has**: stat IS in sector card pull-quote and FAQ. **Missing**: not in Hospitality case study Orchid section (would strengthen). |
| **B-41** | **Harley Street plastic surgeon** — Wants: ASA + MHRA + GMC named together, before/after gallery compliance. **Missing**: GMC not mentioned anywhere in the live rebuild copy (only ASA + MHRA). |
| **B-42** | **NYSE-listed biotech GC pre-IPO** — Wants: SEC Reg FD mentioned, "Quiet period" protocol referenced. **Missing**: Quiet period protocol not in any homepage section, only in the seed blog post. |
| **B-43** | **ICC arbitrator / international counsel** — Wants: ICC + LCIA + SIAC named, peer-grade institutional language. **Missing**: ICC/LCIA/SIAC are in the audit classifier and one blog title but NOT on the homepage. The Legal sector card mentions only SRA + DIFC + GDPR. |
| **B-44** | **Mumbai hospitality founder (Orchid / Taj tier)** — Wants: Indian regulatory context (DPDP Act, IRDAI), GA4 verification mentioned. **Has**: GA4 mentioned. **Missing**: DPDP Act 2023 compliance not surfaced anywhere; Tamazia is Indian-incorporated and serves Indian clients but the site reads as if UK + UAE only. |
| **B-45** | **UK public-company CFO / pre-IPO tech founder** — Wants: FCA Listing Rules referenced, MAR (Market Abuse Regulation) competency. **Missing**: FCA Listing Rules not on homepage; FCA COBS 4 only. |

## LAYER 5 · POLISH / UNIQUE ELEMENTS (Bugs 46-55)

| # | Bug | Fix direction |
|---|-----|---------------|
| **B-46** | Why Us section has only 3 metrics + body text + credentials. Live site has additional micro-line "TAMAZIA · Technology Partnership · TAMAZIA" — currently absent. | Add micro-line component. |
| **B-47** | Sectors section has all-equal cards but no clear sector ordering signal — the user can't tell why Legal is first. Should add a serpentine connector line or ordinal marker that shows the ordering rationale. | Add gold-hairline connector. |
| **B-48** | Case Studies section has parallax background but no scroll-progress indicator — users miss that there are 3 panels. | Add side-rail "I · II · III" indicator. |
| **B-49** | How Tamazia Works: 3 steps render but the team-role list (Regulatory Analyst / AI Search Engineer / etc.) is dense paragraph instead of a stepped reveal. | Layout team list as 5-row grid with monogram. |
| **B-50** | Pricing has no FAQ-style comparison toggle — users can't see "Foundation vs Authority vs Enterprise at a glance". Live site has same limitation but a comparison widget would be unique. | Add "Compare tiers" toggle. |
| **B-51** | Contact form submits to Netlify but no success-state inline confirmation — page redirects. Should remain on page and show "Your briefing request has been received." inline. | Wire success-state JS. |
| **B-52** | No "Live regulator news" strip anywhere — would be a unique brand element. Could pull last 3 SRA / FCA / RERA enforcement bulletins via RSS. | Future: scheduled RSS scrape. |
| **B-53** | Footer "REGULATORY BRIEFINGS" newsletter has no input — just a heading + body + CTA. Needs an email input + working endpoint. | Wire to Netlify form or Resend. |
| **B-54** | No "Last updated" timestamp on insights pages or homepage — high-trust audiences want freshness signal. | Add `lastmod` chip in footer per page. |
| **B-55** | The cookie consent / privacy strip is missing entirely — required for GDPR compliance, ironic for a regulatory-SEO firm. | Add a minimal consent strip on first visit. |

---

## PERSONA-DRIVEN ADDITIONAL ITEMS (extends beyond 50)

Walking the page as 20 personas surfaces these additional asks:

- **B-56** ICC arbitrator → wants to see arbitration credentials front and centre; Manuel Penadés Fons (LexQuity co-founder, ICC-adjacent) not referenced anywhere on Tamazia. Manuel is LexQuity, not Tamazia, so this is a deliberate call.
- **B-57** Indian Big-4 partner (PwC Legal / Deloitte Legal India) → wants Indian-jurisdiction SEO mentioned; rebuild mentions UK + UAE + US prominently but India only as inferred from Aman's location.
- **B-58** Wealth-management founder ($5B AUM) → wants "Family office" sector or sub-sector — currently bundled into Real Estate, Finance and IPOs. Needs splitting OR a distinct family-office mention.
- **B-59** Michelin-starred chef-owner → wants Michelin-tier brand visible; F&B sector card mentions Michelin once but only as keyword, not as proof.
- **B-60** Pre-IPO fintech founder (UK) → wants "FCA Sandbox" mentioned; not on the rebuild.
- **B-61** Ritz-Carlton / Mandarin GM → wants international portfolio signal — "Hotel groups across three countries" only appears in Enterprise tier.
- **B-62** Peninsula / Aman / Rosewood GM → wants discreet language; currently the rebuild's hospitality copy is correct register but no specific tier signal that says "we serve only the top 5%".
- **B-63** ASA-regulated cosmetic clinic → wants GMC + GDC mentioned for medical+dental dual practice; only ASA + MHRA + ADA referenced.
- **B-64** Family office GC → wants confidentiality clause front-and-centre on the contact form ("Submissions handled under NDA on request"). Form has confidentiality line but it's small.
- **B-65** SWF allocator → wants institutional reference list at top of page; only "Trusted by Kamat / CGON / Meraas" — needs more institutional names if available.

---

## FIX PLAN — Prioritised execution order

### Round 1 · Critical fixes (must ship before anything else)
- **B-01 / B-16 / B-28**: Pricing component rewrite — render full feature lists (headline + body) plus Additional Capabilities bullets.
- **B-02 / B-21**: Hero H1 typewriter — strip `{{}}` markers from `data-text` so curly braces don't render literally.
- **B-13**: Top bar — render dateline credentials, not "TAMAZIA · The Practice" eyebrow.
- **B-17 / B-18 / B-19**: FAQ component — render `answerParagraphs` as `<p>` blocks; render `sectorBreakdown` array under Q2; render `auditScope` array under Q4.

### Round 2 · High-impact polish
- **B-03 / B-09**: Sector / case-study sizing fixes.
- **B-04**: Hero 100vh fit (compress padding + ribbon).
- **B-05**: Section padding-block from `clamp(80,10vw,160)` → `clamp(56,7vw,112)`.
- **B-26**: Pricing description hierarchy fix.
- **B-22**: Sector card tooltip → tap-to-reveal on touch devices.

### Round 3 · Persona signals
- **B-43**: Add ICC / LCIA / SIAC chip on Legal sector card.
- **B-39**: Add Trakheesi to Real Estate sector card header.
- **B-44**: Add DPDP Act 2023 to compliance ribbon.
- **B-41**: Add GMC alongside MHRA on Healthcare card.
- **B-45**: Add FCA Listing Rules to Real-Estate sector card.

### Round 4 · Polish + unique elements
- **B-46**: Why Us micro-line.
- **B-48**: Case Studies side-rail I/II/III indicator.
- **B-49**: How We Work team-role grid restyle.
- **B-23**: Article body typography (lists, quotes, lead paragraph).
- **B-30**: Why Us rolling counter animation.

### Round 5 · Future improvements (not blocking)
- B-50, B-52, B-53, B-54, B-55, B-58–B-65.

---

**Execution begins now in Round 1.**
