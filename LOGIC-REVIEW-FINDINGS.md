# Logic-review findings (3 lenses: CEO/buyer · skeptic-partner · editor)

Consolidated + de-duplicated from 3 parallel review agents over psiharley / altamimi / psiloaf.
Triage: **[R]** render/copy fix (this repo) · **[E]** engine/data fix (cowork-os + re-mint) · **[V]** verify vs real render first (suspected `textContent`-dump artifact).

---

## A. CRITICAL — credibility-killers (fix before any prospect sees it)

1. **[R] Leaked internal sales notes in client copy.** Remove entirely:
   - `_adapter.js:1511` `upsellProof: 'Selling to an existing client is 60–70%… optimal add-on 51–100% of the core retainer.'`
   - "loss-leader every budget holder approves without escalation", "below the discretionary approval threshold", "8.9% of a core retainer".
   - "Share prices fall 35% after a reputational crisis" → shown to PRIVATE firms. (`audit-app.js:333`, `_adapter.js:1522`, `_commerce.js:61`)
   - Cold-email add-on: "The same engine that found you as a client" → admits automated outreach inside the trust doc.
   - "Logos shown are illustrative placeholders" → admitting fake logos is worse than none. Remove placeholder logos.
2. **[R] £-exposure framing contradicts its own disclaimer.** Verdict says "£207k/£5.1M sitting on your live site / you are carrying" but footer says "statutory maximum ceilings, not predictions." Fix: drop the summed aggregate as a headline; lead with the **count of evidenced breaches**; show £ only per-item labelled "max statutory penalty," never "your exposure sitting on your site." (`audit-app.js:483`, verdict copy, `_adapter.js`)
3. **[E] Jurisdiction/profiling breaks on non-UK + wrong-sector firms.** altamimi (UAE, largest ME firm) gets UK keywords ("law firms wembley", "canary wharf"), UK competitors (kiddrapinet.co.uk), and the UK GDPR glossary. Loaf (premium furniture) gets Tesco/Sainsbury/Asda + "retail store". The keyword/competitor/glossary spine ignores detected jurisdiction+sector (regulatory is correct). **Biggest single credibility loss.**
4. **[R] "close the 0 criticals" / "0 highest-severity findings closed first".** When criticals=0 the plan/Fix-Sprint copy prints literal "0". Conditional copy needed (pivot to high-severity/ranking gaps). (`audit-app.js:406,466`)
5. **[R] "named 100 of 2 runs"** (GEO repeatability) — nonsensical ratio render bug. Fix to "named in N of 2 runs".
6. **[E] Mis-mapped evidence quotes.** psiloaf: the SAME EEA-transfer sentence is the "live error" evidence for EU Accessibility Act, DSA, Whistleblower AND Modern Slavery. If no real quote, show "not found on inspected pages" — never paste an irrelevant one.
7. **[E] Mis-applied frameworks (no trigger facts).** FCA CONC (consumer credit) on a furniture retailer (£840k, 5 "crit"); MSA/UKCA without turnover/product triggers; EU Whistleblower Directive (an internal-channel obligation) flagged from a website scan. Gate each behind its real trigger.
8. **[E] Fabricated/inconsistent £ bands.** ASA priced "£250k" (ASA has NO fining power); repeated round £250k/£420k across unrelated regimes; same GDPR Art.13 line = £67k (harley) vs £1.7M (loaf). Use real statutory maxima; consistent methodology; no £ for non-monetary regimes.

## B. RENDER / COPY (this repo — I fix)

9. **Grade framing.** "10/100 · F-" reads as a scam on an established firm. Re-scope label to "Web compliance & visibility" (what it actually measures), not a verdict on the whole firm.
10. **Boilerplate "why this framework matters"** — "for a firm selling trust, its absence … avoidable compliance and credibility breach" repeats ~8×. Replace with the specific requirement+consequence, or drop.
11. **Boilerplate fix line** — "Tamazia ships/provisions/configures/engineers the control this finding flags…" repeated (6× in one FCA box). Collapse same-framework fixes into one real remedy; one verb.
12. **Repetition tic** — "on your live site right now/today" 15×; "no reliable information" 5–6× in competitors; "the gap compounds" 3×; trajectory numbers 5×; "realistic, not a hope"; "8 weeks" 3–4×. State each once.
13. **Unsourced stats** — "AI visitors convert 4.4–23× organic", "55% of UK SERPs", "31%/44%/18%", "38% of 2024 reports". Source inline or soften/remove. (`_adapter.js:1189,1317`; `audit-app.js:329`)
14. **"£25,000+ consultancy quote" anchor** — unsubstantiated (and ironically the kind of comparative claim the report flags under CMA/ASA). Remove or substantiate. (`audit-app.js:417-418`)
15. **Security-headers "a regulator reads as negligence"** — overreach for Referrer/Permissions-Policy. Reframe as "enterprise security-review red flags". (`audit-app.js:151`)
16. **Jargon glossed too late / not at all** — LCP/INP/CLS/TBT, schema, E-E-A-T, SCCs, NAP, YMYL, DOM, "drip-pricing", "soft opt-in". Gloss on first use; "measured live on your DOM" → "on your actual pages".
17. **Duplicate keyword table** in both SEO and GEO; GEO header "rank 20–50 for" but rows say "Not ranking". Show once; fix header.
18. **4 identical UAE "screened, no breach" framework boxes** — collapse to one grouped line.
19. **Inconsistent terminology** — breach/gap/finding/loophole/error used interchangeably; "£" vs "GBP"; "×" vs "times"; Title vs sentence case. Standardise.
20. **"prosecution-grade re-scan", "evidence-locked"** — undefined intensifiers. Define or cut.
21. **Tier recommendation** — "Authority (multi-location)" recommended to a single-location clinic. Match firm footprint.
22. **"403 rules" vs "118 frameworks" vs "132"** — flagship count inconsistent. One canonical number.

## C. ENGINE / DATA (cowork-os — flag; fix where feasible + re-mint)

- #3 jurisdiction/sector profiling (keyword + competitor + glossary). #6 evidence mapping. #7 framework applicability gating. #8 £-band methodology. 
- Mismatched fixes: GEO schema/Wikidata fix under a DPA/GDPR breach; GDC complaints → data-protection fix.
- PSI lab-vs-field unreconciled: audit list shows "LCP 30.7s / interactive 82.1s" vs CWV "LCP 2.7s/3.1s" — label lab vs field (partly my new PSI render — verify).
- Per-engine readiness "Copilot 96" while "not citing" — explain or collapse to "cited 0/8 engines".
- Future-dated/unverifiable enforcement citations (doorstep-canvasser £130k; "DUAA 5 Feb 2026"; "38% of 2024 reports") — source/verify.

## D. VERIFY vs real render first (likely dump artifacts, NOT bugs)

- "Wall of fused tokens / no whitespace" in verdict/overview/regulatory ("79FINDINGS Critical18", "Links Are CrawlableLinks are crawlable"). The dump used `textContent` (strips inter-element spacing); the CSS-spaced live render is almost certainly fine. **Visual overseer confirms.**
- Doubled finding title ("Right now: X / ② What it means X") — verify whether the title truly repeats in the body or it's the badge+title adjacency in textContent.
