# RENDER_RCA — Live Rendered-Report Failure Investigation (2026-06-29)

> Forensic root-cause of the "reports look like a worse, older generation" regression. Built from rendering ALL 60
> validation audits through the PRODUCTION render code (payloadToD + renderShell), not engine payload inspection.
> Method: _qa/qa_live.mjs (pulls real minted payloads from Neon, runs the production adapter + DOM checks).

## THE KEYSTONE FINDING — render adapter crashes on 100% of payloads (un-deployable)
`functions/audit/_adapter.js` `payloadToD()` had a TEMPORAL-DEAD-ZONE bug: `const bindingN = frameworks.length`
at line 984 referenced `const frameworks` declared at line 1056 (~70 lines later) -> throws
`ReferenceError: Cannot access 'frameworks' before initialization` on EVERY payload (verified: all 14 fixtures +
every live audit throw; `qa_render.mjs` was 14/14 failing).
- Introduced ~commit `ca55f37` ("D-1/D-2/D-3 honest framework counts"); every later render commit (#119 dedup,
  #120 penalty-basis, #122 enforcement-practice ranges, statutory-citation render) sits on top of the crash.
- The live audit function (`[[path]].js`) CATCHES the throw -> returns `errorShell(...)` 500. So any FRESH render of
  the current source 500s.
- BUT live audits return HTTP 200 (cache-busted, `cf-cache-status: DYNAMIC`) -> the DEPLOYED functions are an OLDER
  build from BEFORE the crash. Net architectural effect: **the entire legal-engine RENDER layer has been frozen at a
  pre-`ca55f37` build. Every render improvement since (honest counts, penalty basis, enforcement ranges, statutory
  citations, CAN-SPAM/CCPA dedup) exists in git but has NEVER reached production.** This is the dominant cause of
  "penalties disappearing / missing statutory citations / degraded vs previous generation."
- FIX (applied, verified): compute `bindingN` at 984 from `pointers` grouped by `actKey` (distinct binding count =
  `frameworks.length`) using only in-scope symbols. Fixture harness 14/14 throw -> 0 issues; rashidlaw renders
  (score 64, 5 frameworks, company "Rashid Law"). This unblocks deploying the whole render layer.

## DEFECT CLASSES (clustered by SUBSYSTEM, from the 60 rendered reports)
| Class | Symptom (rendered) | Examples | True origin (subsystem) | Fix type |
|-------|--------------------|----------|-------------------------|----------|
| R1 RENDER-CRASH | every fresh render 500s; prod stuck on old build | all | render adapter (TDZ) | FIXED (keystone) |
| R2 HTML-ENTITY LEAK | `Q&amp;A`, `Children&#x27;s`, `&#8211;` in user text | tollbrothers, wellingtonplace, ~50 SEO rows | (a) static label double-encoded in SEO check; (b) crawled evidence quotes carry raw entities; not decoded in adapter mapping | decode entities for display in payloadToD text fields |
| D1 WRONG COMPANY NAME | company = scraped page TITLE not the firm | socialandcocktail->"The Square Club", vogue->"14 Independent Brands...", wellingtonplace->"The Whitehall Clinic", tollbrothers->"New Construction Homes for Sale in New York..." | sourcing: lead.company holds the page <title>; render uses it verbatim | render-side clean-name heuristic + upstream sourcing fix |
| E1 SECTOR MISCLASS | visitlondon->tech, zainlegal->saas (it's legal) | engine detection on thin/ambiguous corpus | engine (firm-profile); some cache/fallback | already-improving; re-mint on fixed engine |
| E2 OVER-ATTACHED FW | children's-privacy framework on non-child firms | tollbrothers, wellingtonplace quotes | trigger gating (children's-code) OR it is the site's own policy text surfaced as evidence | verify trigger gating vs evidence-quote source |
| E3 JURISDICTION | tollbrothers (US homebuilder) -> UK | engine .com country resolution | HQ reconciliation (#186) + re-mint |
| H1 HARNESS ARTIFACT | "#app NOT BUILT (app.js threw)" on all 60 | qa_live passed empty `assets` so app.js not inlined (qa_render loads assets -> builds fine) | test harness, NOT a live defect | load assets in qa_live |

## BEFORE vs AFTER (why previous reports were better)
- BEFORE: live = a build that rendered (older engine but DEPLOYED + working render path).
- AFTER (intended): #119-122 + statute add penalty basis, enforcement ranges, statutory citations, dedup, honest
  counts. These NEVER deployed because the adapter crashes. So "after" never actually shipped — live silently stayed
  "before" while the engine kept improving, widening the gap between minted payload quality and rendered output.
- Compounding ENGINE/DATA issues (company name from page title, occasional sector miss, .com jurisdiction) make
  specific reports look wrong independent of the render freeze.

## HIGHEST-LEVERAGE SYSTEMIC FIXES (smallest set, largest class-elimination)
1. KEYSTONE TDZ fix (DONE) -> unfreezes the entire render layer; deploying it restores penalties/statutes/dedup live.
2. HTML-entity decode in payloadToD for all user-facing text (evidence quotes, issue labels) -> kills R2 everywhere.
3. Clean-company-name: render-side heuristic (when lead.company looks like a page title -> derive from domain/firm
   profile) + flag upstream sourcing -> kills D1 across all reports.
4. Re-mint validation set on fixed engine (E1/E3 already improved this program) + verify E2 children's-code trigger.
VALIDATION after batch: re-run qa_live (with assets loaded) on all 60 -> expect R1/R2/D1 = 0; spot-verify 3
sectors against live sites + law.
