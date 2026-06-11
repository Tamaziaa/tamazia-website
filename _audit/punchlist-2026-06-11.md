# Founder punch list · 2026-06-11 preview review (remodel-preview) — EXECUTE ALL, THEN DEPLOY TO LIVE (explicitly authorized)

Branch remodel/full-2026-06. Status legend: [ ] todo [x] done.

1. [x] £110M+ stat doesn't count-animate like 882%/400+ (WhyUs counter can't parse "£110M+") — fix parser.
2. [x] Typewriter: bring back TRUE char-by-char typing with proper pacing (~42ms feel + caret). KEEP the SEO substrate: full text stays in server HTML; JS types over it (reserve line heights pre-clear → CLS 0; html.js pre-paint hide so no flash; reduced-motion = instant). LCP element is the header logo, not the headline, so pacing is free.
3. [x] Testimonial cards: wasted space (stretch-height) → align-items:flex-start so cards hug content; first-render visual error → remove content-visibility:auto; cap to 60 reviews ×2 for DOM weight.
4. [x] ALL homepage sections get entrance animation (luxury): BaseLayout enhancer auto-tags main>* sections (those without existing reveals) → fade-up 600ms --ease-entrance once on view; RM-safe.
5. [x] Contact calendar too long: pane must end with the Submit button row — equal-height grid; cal embed height clamps to form column.
6. [x] "Something went wrong." over founder calendar: add watchdog → if Cal iframe fails/absent in 6s, swap to themed fallback card (link cal.com/tamazia/strategy-call + /book/). Also dedupe init.
7. [x] Footer navigation column → 2-column link grid (side-by-side to save space).
8. [x] 15-20 unique SVG motifs in the sector-icon style (fill=none stroke=currentColor 1.5, viewBox 100) via new ui/Motif.astro library + data-draw; place: 4 Interstitials, WhyUs/CaseStudies/Testimonials/FAQ/Contact headers, 3 HowWeWork steps, 3 Pricing tiers, 4 InstrumentShowcase cards, Sextant rail → ~18 placements in blank spaces.
9. [x] QuickAudit widget restyle to theme: stray list bullets visible (ul list-style leak — BUG), plain look → Playfair headings, themed checklist (gold rules, no browser bullets), inputs/buttons matching tz system.
10. [x] "400+ FRAMEWORKS REVIEWED EVERY CAMPAIGN" caption: move from founder proof rail back to adjacent the vertical laws ribbon (top of it) so the ribbon is explained. RatingStrip stays in proof rail.
11. [x] Pricing "Begin an enquiry" buttons parallel: promote one real feature into Foundation (from its additionalCapabilities, e.g. schema/structured data) + CTA margin-top:auto on tier cards.
12. [x] Hero-left golden nexus: slow-animating constellation of thin gold lines/nodes filling the hero's left blank space (≥1280), drawing + fading over ~10s loop, opacity ≤0.25, RM static. Mirrors right ribbon.
13. [x] Laws ribbon text clipping ("left laws lines cutting"): inspect ribbon at 1280-2560, fix width/overflow so no law name clips.
14. [x] CG Oncology case: hyperlink the phrase "digital content" → https://synthetic.com/cg-oncology-enters-bladder-cancer-therapy-space-with-ipo/ (new tab, noopener).
15. [x] SEO pass: sitemap includes /instrument/ + all live routes w/ correct priorities; unique title+meta description per page (verify instrument/cases/legal); single h1 per page; canonicals; OG/Twitter; robots; structured data already added (FAQPage/OfferCatalog/Service); alt texts; internal links.
16. [x] PageSpeed ≥90 target all categories mobile+desktop: BIG LEVER = dedupe twin tz-* stylesheets (FinalHero + SextantInstrument each carry ~1,000 lines → one shared import); trim LawsStrip duplication; testimonials cap (item 3); confirm font preloads; preconnect cal only where used. Re-run Lighthouse; record honest numbers in _audit/performance-final.md.
17. [x] All gates green → commit → push → PR → merge to main (founder authorized: "and then deploy to live website... then deploy") → verify live (anchors, instrument, Monzo r25, consent gating, no console errors).

## Final standing (see _audit/performance-final.md)
Deployed via #46/#47/#49 (+#50 nexus gate). Desktop 96/97/74*/100 · Mobile 67/100/75*/100. *BP capped by Cloudflare Bot Fight Mode script — founder dashboard toggle. Mobile-90 = scoped critical-CSS follow-up.
