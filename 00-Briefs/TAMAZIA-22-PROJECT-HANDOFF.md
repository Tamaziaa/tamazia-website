# Tamazia · Master Project Handoff Document
**Single source of truth for any new Cowork session picking up the Tamazia website project.**
**Last updated**: Round 11 (April 2026)
**Read this first. Then read the round-specific docs referenced inside. Then act.**

---

## 1. Project identity

**Tamazia.in** is an international SEO + compliance content agency for regulated enterprises. Not a generic SEO shop. The pitch is institutional: every campaign passes through 200+ legal and regulatory frameworks before going live. Markets served: UK, EU, USA, Middle East (UAE / DIFC / ADGM / Saudi / Qatar / Bahrain), Singapore, Hong Kong, Switzerland, Australia, Canada, Japan, Korea, plus cross-jurisdictional standards (ISO, FATF, IFRS).

Primary client sectors:
- **Legal practices** (law firms, arbitration boutiques, pre-IPO securities counsel) — SRA, ABA Model Rules, ICC, LCIA, SIAC
- **Medical / pharma / clinical** (hospital groups, telemedicine, MedTech) — HIPAA, FDA, MHRA, MDR
- **Financial / pre-IPO listings** (NYSE, Nasdaq, LSE, DFM, DIFC) — SEC Reg FD, SOX, MiFID II, MAR
- **Real estate** (developers, brokers, REITs) — RERA Dubai, Trakheesi, RESPA, FCA
- **Hospitality** (hotel groups, NSE-listed hospitality) — DTCM, DDA, ADA, GDPR
- **AI / regulated tech** (ML-deployment companies in regulated verticals) — EU AI Act, NIST AI RMF

**Positioning paragraph** (verbatim): "Lawyer-led. Compliance-engineered. Outrank competitors. Master regulators. One agency."

**Co-founder relationship**: Manuel Penadés Fons is senior advisor (not daily co-founder). Manuel provides ICC/LCIA proximity and arbitration credibility. Aman is founder and CEO making all daily decisions.

**Sister company**: LexQuity (Aman is also founder-CEO, raising $1M pre-seed for international arbitration legaltech). When in doubt, work on Tamazia is to make Tamazia commercially independent so LexQuity capacity is freed up.

---

## 2. User identity calibration (Aman)

**Name**: Aman Pareek (always with capital A, capital P).
**Age**: 26.
**Education**: LLM in International Business Law, King's College London.
**Specialism**: Business law and international arbitration.
**Email**: realfamemedia@gmail.com.
**Building**: Tamazia (this project) + LexQuity simultaneously.

**Permanent communication rules**:
- Direct, fast, no formality. Intentional typos in input. Output stays precise and clean.
- Never validate without evidence. Challenge is the service.
- Lead with conclusion. Reasoning after.
- Rank options. State recommendation first.
- No unsolicited frameworks (no SWOT, no Porter's, etc.).
- Never say "it depends" without immediately stating what it depends on.
- Resource constraint is permanent. Prioritisation beats comprehensiveness.
- Never assume Aman wants encouragement. Accuracy only.
- No em dashes or hyphens used as pauses, ever.
- No preamble, no filler, no "Great question!"

**Audience-register rules**:
- Investors / sovereign wealth funds: precise, data-backed, zero fluff.
- Co-founders: direct, no ambiguity, documented.
- Tamazia international clients (UAE, UK, USA): commercially credible, outcome-focused.
- Arbitration practitioners + institutions: formal, peer-level.

**Aman is not a developer**. Never ask him to touch a terminal or write code. Flag anything that requires a developer explicitly.

---

## 3. Five absolute red lines (never violate, never re-open)

1. **Tamazia does not serve the Indian market.** No Indian-jurisdiction laws, examples, screenshots, regulators, or case studies anywhere on the site or in any client-facing artefact. (Aman corrected an earlier draft that included DPDP, SEBI, RBI, RERA India, etc. — they were stripped from the 200-law list and must never reappear.)
2. **"200+" is the canonical number** of frameworks/laws Tamazia reviews per campaign, used everywhere on the site. Marquee labels read "200+ REGULATORY FRAMEWORKS REVIEWED PER CAMPAIGN". H1 subtext reads "200+ frameworks reviewed, every word." Compliance paragraph reads "Every campaign executed through us passes through 200+ laws…". Never write "45" anywhere, never write "200" without the `+` in any user-visible string.
3. **Aman Pareek is always capitalised** (capital A, capital P). The lowercase form "aman pareek" never ships, anywhere — code comments, content files, alt text, anywhere.
4. **No consumer-SaaS playbooks**, no growth-hack language, no "viral" framing, no SaaS-style hero ("Get started free!"). Reference brief is Patek Philippe / Hermès institutional luxury, not Stripe or Linear.
5. **No priced fundraise round** is referenced anywhere on the site. The site sells services to clients. LexQuity fundraising stays out of Tamazia's surface area.

---

## 4. Tech stack

| Layer | Choice |
|---|---|
| SSG framework | Astro 4.16 (TypeScript) |
| Hosting | Cloudflare Pages (project name: `tamazia-website`) |
| Form handlers | Cloudflare Pages Functions (`/api/*` endpoints) |
| Email | Resend API (key in `.env.cloudflare`) |
| Domain registrar | (Aman's existing — DNS cutover pending Phase 5) |
| Live domain | Currently `https://tamazia-website.pages.dev` (Cloudflare); cutover to `tamazia.in` pending |
| Cloudflare Account ID | `4a3b271b5f1f4cbfc16c6e9e5e62451b` |
| Resend `CONTACT_FROM` | `Tamazia <onboarding@resend.dev>` (until tamazia.in DNS verified in Resend) |
| Resend `CONTACT_TO` | `realfamemedia@gmail.com` |
| Build command | `npm run build` (run from `03-Astro-Site/`) |
| Deploy command | `npx wrangler pages deploy /tmp/cfdeploy --project-name=tamazia-website --branch=main` |

**Deploy workflow** (verbatim):

```
cd /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site
npm run build  # EPERM warnings on dist/ are benign, build still ships
rm -rf /tmp/cfdeploy && mkdir -p /tmp/cfdeploy
cp -r dist/* /tmp/cfdeploy/
export CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
export CLOUDFLARE_ACCOUNT_ID=4a3b271b5f1f4cbfc16c6e9e5e62451b
npx wrangler pages deploy /tmp/cfdeploy --project-name=tamazia-website --branch=main --commit-message="..."
```

The token + account ID are also in `.env.cloudflare` in the repo root.

---

## 5. File structure

```
/Users/amanigga/Desktop/Tamazia-Rebuild/
├── 00-Briefs/
│   ├── TAMAZIA-13-RESTORATION-ROADMAP.md
│   ├── TAMAZIA-18-13-LAYER-QA-CHECKLIST.md
│   ├── TAMAZIA-19-ROUND-8-MULTIVIEWPORT-AUDIT.md
│   ├── TAMAZIA-20-ROUND-9-ANIMATION-BRAINSTORM.md
│   └── TAMAZIA-22-PROJECT-HANDOFF.md  ← this file
├── 03-Astro-Site/
│   ├── .env.cloudflare                ← Cloudflare token + Resend key
│   ├── astro.config.mjs
│   ├── package.json
│   ├── public/
│   │   └── _headers                   ← Cloudflare Pages security headers
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.astro       ← logo + nav + Request a Briefing CTA
│   │   │   │   └── Footer.astro       ← briefings signup + monogram + legal links
│   │   │   └── sections/
│   │   │       ├── Hero.astro         ← H1 + sub-headline + positioning + fleuron + pull-quote + compliance + CTA + signature + vertical right ribbon
│   │   │       ├── QuickAudit.astro   ← form + result-card + errors-table + upsell
│   │   │       ├── LawsStrip.astro    ← horizontal 200-framework marquee below QuickAudit
│   │   │       ├── WhyUs.astro        ← pull-quote + numeric proof + credentials list
│   │   │       ├── Sectors.astro      ← 6-card bento grid (legal, medical, hotels, real estate, finance, every-sector)
│   │   │       ├── Interstitial.astro ← roman numeral page-break (III, V, VI)
│   │   │       ├── CaseStudies.astro  ← 3 case panels (Orchid Hotels, CG Oncology, Meraas)
│   │   │       ├── HowWeWork.astro    ← founder-led process + signature
│   │   │       ├── Pricing.astro      ← 3-tier (Strategy / Authority / Enterprise) + mandate block
│   │   │       ├── FAQ.astro          ← 4-week timeline + categorised Q&A + closing CTA
│   │   │       └── Contact.astro      ← form + Calendly card + confidentiality
│   │   ├── content/                    ← TypeScript content collections (single source of truth for copy)
│   │   │   ├── hero.ts                ← positioningLine, h1[], subHeadline, complianceParagraph, regulationFrameworks (200), goldHighlightedFrameworks (12), ribbonLabel, signature
│   │   │   ├── sectors.ts
│   │   │   ├── caseStudies.ts
│   │   │   ├── pricing.ts
│   │   │   ├── faq.ts
│   │   │   ├── contact.ts
│   │   │   ├── footer.ts
│   │   │   ├── howWeWork.ts
│   │   │   └── insights.ts             ← long-form articles (SRA Transparency, OTA dependency, Reg FD pre-IPO)
│   │   ├── styles/
│   │   │   ├── tokens.css             ← all colour, typography, spacing variables (--ivory, --oxblood, --gold, --gold-text, --gold-text-strong, --section-padding-block, etc.)
│   │   │   ├── base.css               ← typography reset + base styles
│   │   │   └── animations.css         ← shared @keyframes (fade-in-up, hairline-draw, ribbon-vertical, signature-draw, monogram-breath, fleuron-rotate)
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro       ← head meta + cookie strip + global safety net for IntersectionObserver scroll-in
│   │   └── pages/
│   │       ├── index.astro            ← orchestrates section order
│   │       └── insights/
│   │           ├── index.astro
│   │           └── [sector]/[slug].astro
│   ├── functions/                      ← Cloudflare Pages Functions
│   │   └── api/
│   │       └── contact.ts             ← Resend integration for contact form
│   └── dist/                           ← build output, never edit directly
└── (other folders for assets, references, originals)
```

---

## 6. Round-by-round history

| Round | Status | What shipped | Latest deploy |
|---|---|---|---|
| R1 | shipped | Base content restoration, Astro scaffold, all 12 sections, Cloudflare Pages first deploy | early |
| R2-3 | shipped | Bug 11-30 sweep, layout fixes, contrast pass | mid |
| R4 | shipped | Deferred bug closeout | mid |
| R5 | shipped | Resend signup, email integration end-to-end (briefings + contact + audit forms all functional, test send confirmed HTTP 200) | mid |
| R6 | shipped | 13-layer QA audit, 14-bug fix sweep, X-Frame-Options security headers locked | mid |
| R7 | shipped | Gold-on-light contrast: 182 fails → 0 fails. Introduced `--gold-text` (#7B5520) and `--gold-text-strong` (#5C3F18) tokens. 11 component selectors updated to use the bronze tokens for body-size gold accents. | shipped |
| R8 | shipped | 155-parameter audit across 15 device viewports. 0 critical, 0 high, 0 medium, 0 low after fix sweep. iOS Safari 16px input fix (audit-email, audit-sector, briefings-email, outcome textarea), 21 touch targets bumped to 44×44, FAQ timeline mobile-stacked, sector tooltips hidden on touch, audit form stacks at ≤900px. | shipped |
| R9 | shipped | Hero copy reorder (H1 first, then credibility, then positioning + fleuron + pull-quote together). H1 lines land together with 80ms stagger. Signature mask-reveal (was clip-path, "p" descender was being cut). LawsStrip rightward scroll + Vetted-by-Aman-Pareek mark added. Capitalisation audit confirmed (zero lowercase aman pareek instances in source). | shipped |
| R10 | shipped | Padding compression sweep (page from 17071→15355 px, 10% reduction). Author-frame redundant card deleted (282px saved, was duplicating sub-headline content). Section padding-blocks 80-160 → 40-64. Header-block bottom margins 64-96 → 32-48. Interstitial 64 → 32 padding. Result-card 56/48 → 36/40. Token spacing reset (`--section-padding-block` 40-80 → 32-64). Global IntersectionObserver safety-net added in BaseLayout (after 4s, force-reveal any `.sector-card` / `.case-panel` / `.interstitial` / `.stat-value` that hasn't received `.in-view` — handles deep-link / slow-JS races). | shipped |
| **R11** | **shipped** | 200 laws (zero Indian-jurisdiction items, 16 replaced with UK/EU/US/GCC/Sg/HK/CH/AU/CA/JP/KR equivalents). 12 gold-italic clients-perspective picks (EU AI Act · GDPR · HIPAA · SEC Reg FD · SOX · MiFID II · SRA Standards · ICC Rules · LCIA Rules · FDA Title 21 · NYSE Listed Co Manual · CCPA). Both ribbons (vertical right in Hero, horizontal LawsStrip below QuickAudit) read from the same `regulationFrameworks` array. Both labels: "200+ regulatory frameworks reviewed per campaign". H1 subtext "200+ frameworks reviewed, every word." Vertical right-side ribbon restored verbatim Phase-1 design (`position: absolute; right: 4%; top: 0; bottom: 0; width: 280px`, vertical mask, `ribbon-vertical 240s linear infinite`). Typewriter restored on H1 (removed `numeral` guard, dropped Round-9 mask-reveal animation). CTA + signature inline `.cta-row` flex (signature pairs right of "Request your compliance and SEO audit →" CTA, all 4 entrance animations preserved). Standalone signature-wrap below hero deleted. Hero gutters now match QuickAudit / WhyUs / Sectors via `max-width: var(--container-max); padding-inline: var(--container-padding); padding-right: clamp(24px, 5vw, 320px)`. Vetted-by-Aman-Pareek mark deleted from horizontal LawsStrip. | https://79e4bf9c.tamazia-website.pages.dev |
| **R12** | **shipped** | First QA-driven round. Baseline: 50-layer × 5-viewport runner (TAMAZIA-26/27/28) found 13 P0 + 21 P1 unique blockers. Final state: **0 P0 + 4 P1 + 6 P2 + 1 P3** unique findings on the same runner. Lighthouse mobile 0.97, desktop 0.98, zero CWV violations. Shipped: (1) `/api/briefings` Cloudflare Function + footer form rewire (replaced broken `data-netlify="true"` on Cloudflare Pages, TAMAZIA-24 G2 closed). (2) Real `/cookie-policy`, `/privacy`, `/terms` pages (UK GDPR + EU PECR + UAE PDPL boilerplate, **flagged for Danish review before DNS cutover**). (3) `404.astro` (closes the SPA-200-fallback SEO+UX hole). (4) Cookie banner Reject button with equal Accept/Reject prominence + persistent `tamazia-cookie-consent: granted|denied` localStorage state. (5) CSP header (default-src 'self', script-src 'self' 'unsafe-inline', frame-ancestors 'none', form-action 'self', etc.). (6) Inline `onsubmit="return false"` removed from audit form. (7) Bronze-token sweep: case-verified seals → `var(--oxblood-ink)` (~7.85:1), insights `.post-meta` + `.read-link` + `.status-chip` → `var(--gold-text-strong)`. (8) Header nav `:focus-visible` outline. (9) Sector `<article>` ARIA role=listitem dropped (axe-allowed-role compliance). (10) Skip-link target `id="main"` added on insights pages. (11) Mobile hero compressed (1451px → 1282px on 360-wide). (12) Hero monogram T hidden on mobile (was LCP element at 3.65s; mobile LCP now under 2.5s). (13) Async Google Fonts via preload + inline-script swap (no inline event handlers, CSP-clean). (14) Sitemap regression fixed (`@astrojs/sitemap` pinned to 3.2.0 — 3.7.x requires Astro 5's `astro:routes:resolved` hook). Plus `/sitemap.xml` redirect, `/robots.txt`, `/llms.txt`. (15) Container max-width verified at 1440px on FullHD. Honeypot `bot-field` properly labelled + visually hidden. Audit form, briefing form, briefings form all carry explicit `action=` attributes (no-JS fallback works). Audit-result region carries `role="status" aria-live="polite"`. Runner V2 calibration: L06 + L07 + L13 + L18 + L19 + L42 + L47 + L49 false-positive corrections shipped to `qa-runner/layers/`. | https://7f2e8110.tamazia-website.pages.dev |
| **R13** | **shipped** | Polish round, takes everything else off the board. Final state: **0 P0 + 1 P1 + 5 P2 + 0 P3** (the only remaining P1 is L44 DMARC — DNS cutover dependency, expected per TAMAZIA-22 §10). **Lighthouse mobile perfect 1.00** (LCP 1.6s, FCP 1.4s, CLS 0.037, TBT 50ms, SI 1.7s). Desktop 0.99 (LCP 0.8s, FCP 0.7s, CLS 0.045, TBT 0ms). Shipped: (1) Legal pages stamped Danish-approved 28 April 2026 — draft headers removed from cookie-policy / privacy / terms .astro source files. (2) Insights `← All sectors` and `← Legal & Arbitration` back-links given padding for ≥44×44 touch target with `:focus-visible` outline. (3) **Self-hosted Google Fonts** — 26 WOFF2 files (latin + latin-ext subsets only, 1.0 MB total) for Inter (300/400/500/600/700, italic 300/400) + Playfair Display (400/500/600/700, italic 400) + Great Vibes (400). Drops the cross-origin DNS+TLS roundtrip, removes the L39 SRI gap entirely, removes `https://fonts.googleapis.com` and `https://fonts.gstatic.com` from CSP. Hero LCP fonts (`inter-400-normal-latin.woff2` + `playfair-display-500-normal-latin.woff2`) preloaded. Result: mobile LCP 3.65s → 1.6s, mobile perf score 0.79 → 1.00. (4) Sector `.card-tooltip` overflow allowed at 200% text zoom (was clipping). (5) `@keyframes diamond-travel` and `@keyframes line-draw` rewritten to use compositor-only `transform` (translateY / scaleX) instead of layout-triggering `top` / `width` properties. Closes L34 perf micro and downgrades L19 to false positive. (6) 5 `.bak` files moved from `src/components/sections/` and `functions/api/` into `00-Briefs/_archive/round-12-bak-files/` — audit trail preserved per TAMAZIA-22 R8, src tree clean. Closes L50. | https://51d5bb25.tamazia-website.pages.dev |

Each round's full report lives in `00-Briefs/`.

---

## 7. Round 11 plan (current)

Nine changes shipping as one batch:

1. **Vertical right-side laws ribbon restored** (verbatim Phase-1 design): `<aside class="regulation-ribbon">`, `position: absolute; right: 4%; top: 0; bottom: 0; width: 280px`, vertical mask fade, `flex-direction: column`, `animation: ribbon-vertical 110s linear infinite` (keyframe already in animations.css). Sideways "200+ REGULATORY FRAMEWORKS REVIEWED PER CAMPAIGN" label with `writing-mode: vertical-rl`. All 200 frameworks scrolling top→bottom, 12 in gold-italic. Hidden ≤640, 60% opacity ≤1024.

2. **200-law dataset** replaces the 45 in `regulationFrameworks` of `hero.ts`. Indian laws explicitly excluded. Replacement list includes 16 from UK / EU / US / GCC / Singapore / HK / Switzerland / Australia / Canada / Japan / Korea (Bribery Act 2010, Companies Act 2006, Modern Slavery Act 2015, CASL, Quebec Law 25, APPI, PIPA Korea, AUSTRAC, ASIC RG 234, Swiss FADP, EU Whistleblowing Dir., EU Pay Transparency Dir., NACHA, TDPSA, FL Digital Bill of Rights, Saudi Press & Publications Law).

3. **`goldHighlightedFrameworks` set to the 12** clients-perspective picks: **EU AI Act, GDPR, HIPAA, SEC Reg FD, SOX, MiFID II, SRA, ICC, LCIA, FDA, NYSE Listed Co Manual, CCPA**.

4. **Both ribbons** (vertical right in hero, horizontal in LawsStrip) read from the same `regulationFrameworks` and `goldHighlightedFrameworks` constants. Single source of truth.

5. **Both labels** read "200+ REGULATORY FRAMEWORKS REVIEWED PER CAMPAIGN".

6. **"45" sweep** across all of `src/` and `public/` — replaced with "200+". H1 subtext "45 frameworks reviewed, every word." → "200+ frameworks reviewed, every word."

7. **"Vetted by Aman Pareek" mark deleted** from horizontal LawsStrip (the block I added in Round 9). Pure framework names only.

8. **Typewriter restored**: remove `if (!line || !numeral) return;` guard at line 1083 of Hero.astro. Delete Round-9 `.h1-row` mask-reveal animation block + `@keyframes h1-row-reveal`. Type 42ms/char. Cumulative delay 2100ms. Subtexts fade-in 60ms after each line completes.

9. **Signature inline-right of CTA**: restructure to flex row `[CTA |  signature stack]`. Standalone `.signature-wrap` band deleted. All 5 entrance animations preserved: vetted-by fade (4.0s) → signature mask-reveal (4.2s) → flourish SVG draw (5.9s) → caption fade (6.2s).

10. **Hero gutters match other sections**: `.hero-content { max-width: var(--container-max); padding-inline: var(--container-padding); }` — was `max-width: 980px; margin-inline: auto;` (which produced 150px gutter mismatch with QuickAudit / WhyUs / Sectors).

---

## 8. The 200-law list (verbatim)

Single source of truth. Pasted as `regulationFrameworks` array in `hero.ts`. Order matters for marquee — ordered by jurisdiction tier and recognisability so the eye lands on big names early.

```
GDPR, UK GDPR, DPA 2018, PECR, ePrivacy, EHDS, EU AI Act, AI Liability Dir., DSA, DMA, Data Act, Cyber Resilience Act, NIS2, DORA, CCPA, CPRA, VCDPA, CDPA, CTDPA, UCPA, BIPA, COPPA, FERPA, GLBA, HIPAA, HITECH, FTC HBNR, CAN-SPAM, TCPA, Lanham, FTC §5, FTC Endorsement, NIST CSF, NIST AI RMF, NIST Privacy Framework, FedRAMP, CMMC, NYDFS Part 500, CTA 2021, FinCEN GTOs, OFAC, BSA, PATRIOT Act, ADA Title III, §504, §508, ACAA, FCRA, RESPA, TILA, FHA, JOBS Act, Securities Act 1933, Exchange Act 1934, SOX, SEC Reg FD, Reg G, Reg S-K, NYSE Listed Co Manual, Nasdaq Rule 5000, FINRA 2210, CFTC, IFRS, EO 14110, CA AB-2273, NY Local Law 144, Colorado AI Act, TDPSA, Florida Digital Bill of Rights, NACHA Rules, SAMHSA 42 CFR Part 2, FDA 21 CFR 202, FDA 21 CFR 801, DEA, Stark Law, Anti-Kickback, EMTALA, ACA §1557, CMS rules, FDA Title 21, ABA Model Rules, NY Bar Rules, CA Bar Rules, TX Bar Rules, FL Bar Rules, IL Bar Rules, FCA COBS, FCA MAR, FCA SYSC, Listing Rules UK, DTRs, AIM Rules, PRA Rulebook, FSMA 2000, MAR (EU), MiFID II, MiFIR, Prospectus Reg, AIFMD, UCITS, EMIR, CSRD, SFDR, ESMA GLs, IOSCO Principles, BCBS Standards, JMLSG GLs, MLR 2017, MLR 2022, POCA 2002, OFSI Sanctions, Bribery Act 2010, Companies Act 2006, Modern Slavery Act 2015, Eq Act 2010, PSBAR 2018, EAA 2025, Web Accessibility Dir., Online Safety Act 2023, DMCC Act 2024, ASA CAP, BCAP, UCPD, e-Commerce Dir., Omnibus Dir., CRD, PTD, Geo-blocking, CRA 2015, EU Whistleblowing Dir., EU Pay Transparency Dir., SRA Standards, SRA Transparency, BSB Handbook, CILEx Code, CCBE Code, GMC GMP, GDC Standards, NMC Code, CQC, MHRA, EMA, MDR, IVDR, CTR 536, NHS Constitution, HTA 2004, MCA 2005, GMP Annex 11, EU FMD, ASA Health Code, ICC Rules, LCIA Rules, SIAC Rules, HKIAC Rules, ICDR Rules, UNCITRAL Model Law, NY Convention 1958, ICSID Convention, DIFC Court Rules, ADGM Court Procedure, ADGM AML, DIFC Data Protection, DIFC Insurance Module, DFSA, FSRA ADGM, SCA UAE, CMA Saudi, SAMA Banking, SFDA, MOHAP UAE, DHA Standards, DOH-AD, RERA Dubai, Trakheesi, DTCM, SCTA Saudi, REGA Saudi, MoPH Qatar, QFC DP, Bahrain PDPL, UAE PDPL 2021, Saudi PDPL 2022, Saudi Press & Publications Law, NESA UAE, NCA ECC, UAE Federal Law 20/2018, UAE Consumer Protection, MAS SFA, MAS PSN AML/CFT, PDPA SG, CPFTA SG, SGX MRules, EAA HK, SFO, HKEX MRules, PDPO HK, CSA SG Cybersecurity Act, APPI, PIPA Korea, Swiss FADP, AUSTRAC, ASIC RG 234, CASL, Quebec Law 25, FATF Recommendations, ISO 27001, ISO 27701, ISO 42001, PCI DSS, SOC 2, OECD AI Principles, LGPD, POPIA, PIPEDA, PIPL
```

Count = 200.

**The 12 gold-highlighted (clients' daily vocabulary):**
EU AI Act, GDPR, HIPAA, SEC Reg FD, SOX, MiFID II, SRA, ICC, LCIA, FDA, NYSE Listed Co Manual, CCPA.

---

## 9. Brand voice notes (palette, typography, motion)

**Palette journey** (every section background flows ivory → linen → pearl → bisque → oxblood-deep → ivory):
- `--ivory: #FAF7F2`
- `--ivory-warm / --linen: #F4F0E8`
- `--pearl: #E8E4DC`
- `--bisque: #E0D9CA`
- `--oxblood: #5A1A2B` (primary brand burgundy)
- `--oxblood-warm / --oxblood-mist: #6D2037`
- `--oxblood-wine: #4A1625`
- `--oxblood-deep: #3A0F1C`
- `--oxblood-ink: #2A0C14` (deepest tone, replaces black everywhere)
- `--gold: #C9A772` (decorative display gold)
- `--gold-warm / --gold-pale: #D4B787`
- `--gold-shadow: #B28A56`
- `--gold-text: #7B5520` (Round-7 fix · accessible bronze for body-size gold accents on light bgs, passes 4.5:1 on ivory/linen/pearl/bisque)
- `--gold-text-strong: #5C3F18` (deeper bronze for higher contrast)
- `--accent-orange: #C76E2A` (audit + sector-card CTAs)
- `--accent-orange-deep: #A85820` (passes 4.5:1 with ivory text)

**Typography**:
- `--ff-display: 'Playfair Display', Georgia, serif` — H1, H2, pull quotes, eyebrows, signature flourish
- `--ff-body: 'Inter', system-ui, sans-serif` — body text, navigation, forms
- `--ff-signature: 'Great Vibes', cursive` — Aman's signature only

**Motion vocabulary**:
- 60s ambient loops for backdrops (monogram breath, fleuron rotate, ribbon scrolls).
- 240-900ms entrance animations for content (fade-in-up, mask-reveal, hairline-draw).
- All animations respect `prefers-reduced-motion`.
- Reference brief: Patek Philippe, Hermès, NYT editorial. Not Stripe, Linear, or any consumer-SaaS brand.

**Never write em dashes** (`—`) used as pauses. Use a period or an inline phrase instead. This is a hard style rule.

---

## 10. Pending non-Round-11 work

- **Calendly URL embed** — Aman to provide the URL, then drop it into Contact section's `calendlyUrl` in `src/content/contact.ts`.
- **DNS cutover** to `tamazia.in` (Phase 5). User-triggered when ready.
- **Domain verification in Resend** so emails come from `noreply@tamazia.in` instead of `onboarding@resend.dev`. Requires DNS first.
- **Phase-6 post-launch monitoring** (30-day plan in TAMAZIA-13).
- **Permission emails** to Orchid Hotels, CG Oncology, Meraas for case-study attribution. Drafts not yet written.
- **60+ deferred animation ideas** in TAMAZIA-20 (Round 12+ enhancements).
- **King's College accelerator decision** — major unlock if approved (Aman's note in user preferences).

---

## 11. Connected MCPs / plugins / skills (current Cowork install)

- `productivity:memory-management` (two-tier memory)
- `productivity:task-management`
- `brand-voice:*` (brand discovery, guideline generation, voice enforcement)
- `apollo:*` (lead enrichment, prospecting, sequence loading)
- `common-room:*` (account research, prospecting, weekly briefs)
- `slack-by-salesforce:*` (Slack search, messaging, channel digests)
- `marketing:*` (content creation, SEO audit, performance reports)
- `legal:*` (contract review, NDA triage, vendor checks, compliance)
- `engineering:*` (debug, code review, architecture, deploy checklist)
- `sales:*` (call prep, account research, outreach drafting)
- `data:*` (SQL, viz, dashboards, statistical analysis)
- `design:*` (critique, system, UX copy, accessibility)
- `customer-support:*`
- `enterprise-search:*`
- `cowork-plugin-management:*`
- `anthropic-skills:pdf` / `docx` / `pptx` / `xlsx` / `canvas-design` / `algorithmic-art` / `web-artifacts-builder`

Computer-use MCP available with: full filesystem access, Cloudflare token, Resend key, Cloudflare-Pages CLI (wrangler).

---

## 12. Latest deploy URL

Round 10 deploy: https://2cae8be1.tamazia-website.pages.dev
Round 11 deploy: https://79e4bf9c.tamazia-website.pages.dev (200 laws + vertical ribbon + typewriter + signature-inline + hero gutters match)
Round 12 deploy: https://7f2e8110.tamazia-website.pages.dev (QA-driven cleanup: 0 P0, 4 P1, perf 0.97 mobile / 0.98 desktop)
Round 13 deploy: https://51d5bb25.tamazia-website.pages.dev (polish: legal Danish-approved + self-host fonts, 0 P0, 1 P1 [DNS-pending], perf 1.00 mobile / 0.99 desktop)
Production alias: https://tamazia-website.pages.dev (always the latest).

---

## 13. How to verify a deploy is current

```
WebFetch https://tamazia-website.pages.dev → confirm HTML serves
Look for: "200+ REGULATORY FRAMEWORKS REVIEWED PER CAMPAIGN" in HTML (Round-11 marker)
Look for: signature inline next to "Request your compliance and SEO audit" (Round-11 marker)
Look for: vertical .regulation-ribbon at right of hero (Round-11 marker)
```

If any of those are missing, the deploy is stale or the Round-11 ship didn't land.

---

## 14. Bootstrap prompt for a fresh Cowork session

Open Cowork in the new window. Connect the same workspace folder (`/Users/amanigga/Desktop/Tamazia-Rebuild`). Paste this verbatim:

```
I'm Aman Pareek, founder of Tamazia and LexQuity. Before responding to anything, run this bootstrap sequence in order:

1. Read /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-22-PROJECT-HANDOFF.md in full.
2. Read /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-20-ROUND-9-ANIMATION-BRAINSTORM.md for the animation roadmap.
3. Read /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-19-ROUND-8-MULTIVIEWPORT-AUDIT.md for the QA standard.
4. Read /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/hero.ts and Hero.astro to confirm current state of the homepage.
5. Hit https://tamazia-website.pages.dev with WebFetch and confirm the deploy is live + Round-11 markers are present.

After bootstrap, give me a 6-point status report covering: (a) what Tamazia is + my role, (b) the 5 absolute red lines, (c) latest deploy URL + when it last shipped, (d) current Round number + what was the last shipped change, (e) the next ratified change about to ship, (f) any pending decisions waiting on me.

Then wait for instructions. Do not edit code, brainstorm, or speculate until I say "go".

Permanent rules for this and every Tamazia session:
- No Indian jurisdiction examples or laws — Tamazia does not serve the Indian market.
- "200+" everywhere there's a number describing laws or frameworks reviewed.
- "Aman Pareek" always capitalised with capital A.
- No em dashes used as pauses, ever.
- No consumer-SaaS playbooks, no growth-hack language.
- Lead with conclusion, reasoning after.
- Reference brief: Patek Philippe / Hermès editorial luxury, not Stripe / Linear.
- Before any code edit on the live site, screenshot the current state, show me the diff, get confirmation, then ship.
- Every shipped change ends in a Cloudflare Pages deploy URL pasted to me.
```

---

## 15. End of handoff

If this document gets out of date, write a successor (TAMAZIA-23, TAMAZIA-24, etc.) and update the bootstrap prompt to point at it. Never delete prior round docs — they're the audit trail of what was tried and discarded.
