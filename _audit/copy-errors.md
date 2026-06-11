# Copy & factual error log · remodel 2026-06 (M1, appended through all milestones)

Every word-level finding, severity, and the fix applied. Founder mandate: "find errors anywhere even a single word".

## M1 fixes applied (2026-06-11, branch remodel/full-2026-06)

| # | Severity | File:line | Error | Fix |
|---|---|---|---|---|
| 1 | CRITICAL | src/pages/complaints.astro:16 | "Operated by Tamazia Ltd, an Indian private limited company with registered office in Mumbai, Maharashtra." — false entity claim contradicting England & Wales registration everywhere else | → "a private limited company registered in England and Wales" |
| 2 | CRITICAL | src/pages/legal/dpa.astro:109 | Governing-law clause invoked "the law of India for engagements with Indian clients" and "courts… of the relevant Indian state" — Tamazia serves UK/EU/UAE/USA only | → England & Wales law + exclusive jurisdiction, single clause |
| 3 | CRITICAL | src/pages/legal/data-protection.astro:30-37 | Claimed Tamazia is "a controller established outside the United Kingdom" requiring a UK Article-27 Representative — false for an England & Wales company; contradicted the footer (Article-27 line removed by founder 2026-06-10) | → merged into one "Establishment and representation" section: UK-established (no UK rep required); EU representative obligation stated correctly as in progress |
| 4 | HIGH | src/pages/privacy.astro:31,120 + src/pages/privacy-notice.astro:39,132 | Data-subject rights contact was `realfamemedia@gmail.com` (consumer Gmail on statutory privacy pages) | → dpo@tamazia.co.uk (4 instances) |
| 5 | HIGH | src/pages/terms.astro:129 | Terms questions contact was `realfamemedia@gmail.com` | → founder@tamazia.co.uk |
| 6 | HIGH | src/components/sections/Contact.astro:594,598 | Homepage contact-form error fallback: "Please email us at realfamemedia@gmail.com" (missed by every prior sweep — lives in a JS template string) | → founder@tamazia.co.uk (2 instances) |
| 7 | MEDIUM | src/content/footer.ts:62 | `cin: 'Registration in progress'` placeholder (founder: remove the line entirely) | → field deleted |
| 8 | MEDIUM | src/components/layout/Footer.astro:100 | Rendered text read "Tamazia Ltd · Registered office Registered in England and Wales · …" — doubled "Registered" from prefix + field value | → "Tamazia Ltd · Registered in England and Wales · …" |
| 9 | MEDIUM | src/pages/legal/data-protection.astro:80 | India listed as a processor location ("United States, India, and Singapore") — conflicts with the no-India entity and service posture | → "United States and Singapore" |
| 10 | MEDIUM | src/content/testimonials.ts:84 | "Definately recommend" misspelling | → "Definitely recommend" |
| 11 | MINOR | src/content/insights.ts:88 | "UAE/India destination clinics" in an in-prep article stub (Tamazia does not serve the Indian market) | → "UAE and Gulf destination clinics" |
| 12 | HYGIENE | complaints/terms/privacy/privacy-notice (`lastUpdated`), dpa/data-protection (`updated`) | Legal pages materially changed today carried stale review dates (28 April / 15 May 2026) | → '11 June 2026' (6 pages) |

## Systematic sweep results (clean)
- Misspelling battery (recieve/seperate/occured/accomodat/guarentee/priviledge/complienc/adress/buisness/sucess/acheive/concious/neccessar/occassion/untill/wich/thier/teh/publically/liason/wierd/alot/existant/maintainance/persue/relevent/responsability/transfered/truely/fullfil/targetting/benefitting…): **0 hits** in user-visible copy. ("enrolment" in dpa.astro:88 is correct British English.)
- Doubled-word regex (the the / and and / of of …): **0 hits**.
- "inquiry" (must be "enquiry"): **0 hits**.
- Double spaces inside sentences: **0 hits**.
- Em-dashes in source strings: only QuickAudit's JS-populated `>—<` placeholders (stripped by patch-dist safe-zones — known-safe).
- Dated claims: SRA "£7.2M in fines… in 2024" (insights article) is a historical editorial claim — kept.

## Deliberately NOT changed (logged for the founder's end review)
- caseStudies/insights Orchid case references to Mumbai/Pune/Goa hotel queries: factual details of a real (anonymised) Asia-Pacific engagement — the no-India rule concerns the ENTITY and target market, not client history. Kept.
- hero.ts CTA label "Run my free audit": founder-protected wording (2026-06-10 revert).
- footer.ts `icoRegistration` field still exists in data but is unrendered (Article-27 line removed from render 2026-06-10); field cleanup deferred to M2 content pass.

## Appendix — enforcement-claim sources (filled in M5)
(Sextant fine-entry verification sources land here.)
