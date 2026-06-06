# BUILD-NOTES — Tamazia Audit Engine: Logic + UI/UX + Conversion Overhaul

## Architecture (plain language)
- **Render** (deployable, no re-mint): `functions/audit/_adapter.js` (payload→window.D, the brain/membrane), `public/audit/audit-app.js` (panes), `public/audit/audit-charts.js` (CH chart lib), `public/audit/audit.css`, `functions/audit/_commerce.js` (pricing/add-on catalogue), `_shell.js` (HTML shell).
- **Engine** (mints payload_json to Neon `audit_pages`, runs on a cron in cowork-os; NO MCP access at runtime): `cowork-os/src/...`.
- The report reads ONE `window.D` injected server-side. Most fixes land in the render (adapter + app + charts + commerce) and deploy without a re-mint.

## Data-source reality (Gate 3)
- Ahrefs MCP tools are available **to this session only**, not to the deployed cron engine. The live engine uses a £0 free-data stack (OpenPageRank DR, free SERP, Common Crawl, Bing volume, HF intent, PSI, geo-probe) — all REAL, just not Ahrefs-branded.
- DECISION TO BATCH: sustainable Ahrefs in production needs an Ahrefs **API key** wired into the engine. Until then: keep the real free-data layer; use Ahrefs MCP now to spot-verify DRs/keywords/Brand-Radar on fixtures.

## Status of the 7 logic gates (vs prior work)
- G1 Jurisdiction: detection DONE (markets.js + firm-profiler + membrane allow-set). GAP: live **jurisdiction selector** UI on the report → BUILDING.
- G2 Keyword↔brand: relevance + scale-awareness DONE. GAP: hard 20–50 position band → wiring.
- G3 Real-data provenance: real free-data DONE; Ahrefs key BATCHED.
- G4 Dedup/single-source: differentiateFixes DONE; verifying summary↔body once-each.
- G5 Provision merge by Act: framework grouping DONE (frameworkBars one box per framework).
- G6 AI-citation reality: GAP — engine **logos** (not text) + Brand-Radar figures → BUILDING.
- G7 Competitor authenticity: denylist/isRealCompetitor DONE.

## Headline gaps → this build
1. **5.10 Pricing & Conversion overhaul** (the money): £7,500 one-time fix box, 3 tiers w/ real bullets + 40% pilot (struck-through), Stripe-clean buy, compact hover-expand add-ons (9 from research, incl. GBP £650 / Reg Alerts £199 / YMYL £800/pc), interactive trajectory chart, cal.com×2, moving trusted-by strip, floating "Fix these now!" CTA, fixed left panel + pricing jump.
2. **G1 jurisdiction selector** (live re-filter regulatory layer, badge every finding).
3. **G6 AI engine logos** + real citation status.
4. **R5** purge em-dashes / hyphens-as-pause from all rendered copy.
5. **R1** one-page-open density on oversized sections (5.2 breaches 1/5, 5.3 nine exposures no-fix, 5.7 glossary tiny).

## Blockers (BATCHED, not halting)
- B1 Deploy/cutover: `.env` CF token is a personal account (no access to the business Pages project or `tamazia.co.uk` zone). Need the business `CF_API_TOKEN` (CI secret) or dashboard for cutover. Build is staged + green.
- B2 Ahrefs API key for the live engine (else keep free-data layer).
- B3 Real client logos (Orchid/Meraas/CG Oncology) are privacy-sensitive in a PUBLIC repo — using grey demo/watermark treatment pending founder OK.

## QA (Section 7) — run after each batch
124-check `_tools/backtest.mjs` + `_qa/` CI gates + visual screenshots. Zero em-dashes, one-page-open, real-data, dedup, jurisdiction badges, pricing acceptance list.

## DELIVERED THIS SESSION (evidence)
- R5 em-dash purge: 0 em dashes in _adapter.js, audit-charts.js, audit-app.js (verified by grep).
- G6 AI engine logos: engineGrid renders /audit/engine-logos/*.svg (8 brand SVGs created); fallback to grayscale on not-citing.
- G1 jurisdiction: every framework carries a visible `.jbadge` (UK/EU/US/UAE…); a `.jur-select` chip row appears when multi-jurisdiction and live-filters `.fw[data-jur]`.
- 5.10 conversion block (Agent A): £7,500 anchor box, 3 tiers (list struck + 40% pilot), 9 add-ons USP-led hover-expand, interactive trajectory chart, 2 Cal embeds, trusted-by marquee, floating "Fix these now!" CTA, one-page `.plan2`.
- Assets (Agent B): 8 AI-engine + 8 demo trusted-by SVGs, all valid XML.
- QA: `_tools/backtest.mjs` = 0 bugs / 22 audits / 124 checks; `_qa/qa_render.mjs` + `_qa/backtest.mjs --max-bugs=0` green; rendered-preview grep confirms fixbox/tier-tab/pilot/jbadge/eng-logo/tb-marquee/FAB all present. Build staged green (Astro build + 132 patch-dist checks + wrangler functions compile).

## REMAINING (routed — see batch)
- Section-density polish (5.2 compress breaches, 5.3 nine-exposures findings-only, 5.7 glossary tiny) — panes already tabbed/collapsible; deeper compression deferred.
- 5.1 annotated-screenshot pins; 5.5 hard 20–50 keyword band; 5.8 per-competitor differentiators — refinements.
- Ahrefs in the LIVE engine (API key); deploy + cutover (business CF token); Stripe price IDs + per-intent Cal events; real client logos.
