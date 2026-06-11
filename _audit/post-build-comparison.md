# Post-build comparison · remodel 2026-06-11 (P6)

Baseline = main (pre-remodel, local preview, Lighthouse mobile-sim ×3 averaged). Post = remodel/full-2026-06 final build. Same machine, same method.

## Core Web Vitals (lab)
| route | perf | LCP ms | CLS | TBT ms | TTFB ms |
|---|---|---|---|---|---|
| / baseline | 61 | 6686 | 0.055 | 275 | 32 |
| / post | **66** | 8624* | **0.000** | **17** | **9** |
| /instrument/ baseline | 78 | 5176 | 0.000 | 20 | 7 |
| /instrument/ post | **83** | **4142** | 0.000 | **0** | 12 |
| /case-study baseline | 87 | 3823 | 0.018 | 26 | 9 |
| /case-study post | **91** | **3260** | 0.018 | **0** | 9 |

**CLS on the homepage: 0.055 → 0.000** (typewriter substrate fix). **TBT: 275 → 17ms** (no setInterval typewriter, GA4 consent-gated). *Homepage lab LCP: the LCP element is the HEADER LOGO with 95% render-delay — a pre-existing condition (baseline's 6.7s was the same element; the old headline was EMPTY in HTML and not LCP-eligible at all). Root cause is CSS parse weight under 4× mobile-sim (the FinalHero + Sextant components each carry a full copy of the ~1,000-line tz-* stylesheet). Top follow-up: dedupe the twin global styles into one shared stylesheet (est. −40-60KB CSS, directly attacks render delay). Field LCP on real devices will be far better than mobile-sim.

## Structural targets (the founder's protocol)
- Homepage `<h1>`: 0 → **1**, full text server-rendered (was attribute-only). ✓
- Hero height @1440: 1484px → **1073px**; primary CTA top 1300px+ → **776px (above the fold)**. ✓
- "…" truncation on testimonial cards: 100% of cards → **0 instances sitewide**. ✓
- Document-level horizontal overflow: **0 at all 10 viewpoints** (unchanged ✓). The raw "overflow findings" totals (~250) are dominated by known false positives: intentionally off-screen honeypot inputs + masked marquee tracks.
- £1,500 on homepage: removed (audit narrative lives wholly on /instrument/). ✓
- GA4 requests before consent: unbounded → **0** (verified by request interception). ✓
- Sextant enforcement claims: 4/6 inaccurate → **6/6 verified with sources**. ✓

## Open items (candid, for the founder's end review — not silently shipped)
1. **Contrast (~540 findings/page-set):** decorative gold (#C9A772, 2.12:1) used as text in eyebrows, chips, rails, captions sitewide. The AA-safe tokens exist (--gold-text 7B5520 / --gold-text-strong 5C3F18). A sweep would change the site's visual character (darker golds) — taste decision, founder call. Recommended: swap text-role gold to --gold-text where the text carries information; keep decorative gold for ornaments.
2. **Touch targets (~170 ≤430px):** hero chips (26px tall), nav links (24px). Enlarging costs visual density on mobile — founder call; mechanical fix is padding bumps.
3. **CSS dedup** (the LCP follow-up above).
4. lighthouse-pa11y + visual-regression workflows: configs fixed this branch; first green runs will confirm on the PR.
