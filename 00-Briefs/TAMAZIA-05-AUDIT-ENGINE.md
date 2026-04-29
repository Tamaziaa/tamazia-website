# TAMAZIA · QUICK AUDIT ENGINE · FULL SPEC
**Claude Code implementation spec.**
**Supersedes the v1 report engine spec.**
**Zero external paid services at launch. All free-tier APIs.**
**Target P95 response time: under 2.5 seconds.**

---

## 00 · WHAT THIS IS

A single active conversion instrument embedded below the hero on tamazia.in. Visitor enters a URL **or** a commercial keyword. Engine returns a branded report card in 2 to 3 seconds containing three headline metrics, one editorial observation, a sector-specific compliance snippet, and a primary CTA to book the full audit. Secondary conversion pathway via PDF opt-in.

Positioned as a lead instrument, not a free tool. Visual register is FT Markets Alert / Bloomberg Terminal, never Neil Patel / Ubersuggest.

---

## 01 · INPUT HANDLING

### Brainstorm (15 ideas)
1. URL-only input.
2. URL OR keyword input (dual pathway).
3. URL + sector dropdown (rejected - friction).
4. Pre-filled example `try: cliffordchance.com` faded on focus.
5. Placeholder text only, no pre-fill.
6. Autocomplete suggestions from popular searches (rejected - creepy for B2B).
7. Input detects format automatically (URL vs keyword vs mixed).
8. Rejects obviously garbage input (special chars, very short queries).
9. Accepts international characters (law firm names in Arabic, Chinese).
10. Paste detection + auto-format (strip http/https, trailing slashes).
11. Single input with mode toggle (URL mode | keyword mode) (rejected - too clicky).
12. Auto-suggests "your-company.com" based on browsing history (rejected - privacy).
13. Auto-infers sector from URL/keyword for tailored output.
14. Locale detection: European user → £, UAE user → AED-aware output.
15. Multi-input (up to 3 URLs for small competitor set). Phase 2.

### Curated picks
2, 4, 7, 8, 9, 10, 13, 14.

### Implementation

**Frontend input component:**
- Single text input, 480px wide, 56px tall, gold hairline underline.
- Placeholder: `yourdomain.com  ·  or  ·  primary keyword`.
- On focus: placeholder fades, shows example hint in very-faint gold italic: `try: cliffordchance.com` (replace on any keystroke).
- Paste handler: strips `http://`, `https://`, trailing slashes, whitespace.
- Submit via Enter key or button click.

**Input classifier (runs client-side before submission):**
- If matches regex `/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i` OR starts with `http` → URL mode.
- Else → keyword mode.
- Garbage filter: reject strings < 3 characters, or strings that are only special characters.
- Client-side locale inference: browser locale sets default currency for pricing snippets.

---

## 02 · BACKEND ENGINES (ALL FREE TIER AT LAUNCH)

### For URL audits

**Brainstorm of possible APIs (15):**
1. Google PageSpeed Insights API (LCP, INP, CLS, Lighthouse scores) - FREE unlimited.
2. Mozilla Observatory API (security headers, HTTPS grade) - FREE.
3. Direct HTML fetch (meta, schema, regulatory sniff) - self-hosted.
4. Wave Accessibility API (free tier).
5. Chrome UX Report (CrUX) API - FREE.
6. Cloudflare Radar API - FREE domain intelligence.
7. HTTP Archive (httparchive.org) - FREE historical data.
8. WhoisXMLAPI - 1000/month free.
9. Hunter.io Domain Verifier - free tier.
10. WayBack Machine availability API - FREE.
11. Built With (rejected - paid only for full data).
12. Ahrefs free backlink checker (rejected - paid).
13. SEMrush free snapshot (rejected - paid).
14. Serper.dev (paid but affordable).
15. Direct DuckDuckGo Instant Answer (some backlink hints) - FREE.

### Curated picks for URL audit
1, 2, 3, 5, 6, 10.

### Implementation plan
Parallel fetch five endpoints per URL audit, aggregate results into three metrics.

**Engine 1 · Google PageSpeed Insights API**
Endpoint: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`
Returns: Core Web Vitals (LCP, INP, CLS) + Lighthouse category scores (Performance, Accessibility, Best Practices, SEO).
Timeout: 3s.
Fallback: if API errors, use Chrome UX Report (CrUX) as secondary.

**Engine 2 · Mozilla Observatory**
Endpoint: `https://http-observatory.security.mozilla.org/api/v1/analyze?host={DOMAIN}` (POST with rescan=false).
Returns: HTTPS grade (A+ to F), CSP detection, HSTS presence, X-Frame-Options, etc.
Timeout: 2s.

**Engine 3 · Chrome UX Report (CrUX)**
Endpoint: `https://chromeuxreport.googleapis.com/v1/records:queryRecord` (POST).
Returns: real-world field data for LCP/INP/CLS from Chrome users.
Timeout: 2s.
Use as secondary validation of PSI lab scores.

**Engine 4 · Cloudflare Radar**
Endpoint: `https://api.cloudflare.com/client/v4/radar/ranking/top` (or similar) for domain traffic rank.
Use to infer whether the user is auditing a major brand (trigger founder alert if top-10k).

**Engine 5 · Direct HTML fetch (server-side)**
Fetch homepage HTML, parse with cheerio/BeautifulSoup equivalent. Extract:
- Meta title length (50–60 optimal), meta description length (155–160 optimal), canonical presence, robots meta, OG tags, Twitter Card tags, schema.org JSON-LD (count + types).
- H1 count (should be 1), H2 count, internal link density.
- Privacy policy link (scan footer for `/privacy`, `/privacy-policy`, `/cookie-policy` links).
- Cookie banner (scan for known cookie banner libraries: OneTrust, Complianz, Cookiebot, CookieYes, TrustArc).
- Contact info completeness (footer address, phone, email detection).
- Language/locale declarations (`<html lang>`, `hreflang` links).
- Sector inference (keyword density classification).

**Engine 6 · Wayback Machine**
Endpoint: `https://archive.org/wayback/available?url={URL}`
Returns: most recent snapshot date. Used to gauge site stability (if last archive > 3 months, flag as potentially stale content strategy).

### For keyword audits

**Brainstorm of possible APIs (15):**
1. Google Autocomplete (suggestion endpoint) - FREE.
2. Google Trends (unofficial API / SerpApi) - paid.
3. SerpApi 100 free/month.
4. Serper.dev free tier 2500 requests/month.
5. ValueSerp free tier 100/month.
6. DataForSEO (paid).
7. Direct SERP scrape via Puppeteer (legally grey).
8. DuckDuckGo Instant Answer API - FREE.
9. Bing Web Search API - 1000/month free.
10. SearXNG self-hosted - FREE.
11. Wikipedia API for entity disambiguation - FREE.
12. Commercial intent classifier (rule-based, self-hosted) - FREE.
13. People Also Ask scraper (PAA) - against TOS.
14. Featured snippet detector via SERP snapshot - paid.
15. Simulated AI Overview query to Claude API (paid per query, ~$0.003).

### Curated picks for keyword audit
1, 4 (or 5 fallback), 10, 11, 12, 15 (optional if Aman has budget for Claude API).

### Keyword audit data flow
1. Google Autocomplete for volume signal bucket.
2. Commercial intent classifier (rules):
   - `how to` / `what is` / `why` → informational.
   - `best` / `review` / `compare` → commercial.
   - `buy` / `price` / `book` / `request` / `hire` → transactional.
   - Brand name → navigational.
3. Serper.dev free tier OR SearXNG for top 5 SERP results.
4. Wikipedia API for entity type disambiguation (distinguishes "Meraas" the developer from "Meraas" the place).
5. Featured snippet detection from SERP scrape.
6. People Also Ask via SERP scrape.
7. AI Overview presence: quick Claude API call with prompt "Would Google's AI Overview likely appear for query '{keyword}' and what would it say in one sentence?" — optional, toggled off unless budget approved.

### Sector inference (both URL and keyword)

Rule-based classifier using a curated keyword dictionary:
- **Legal:** SRA, solicitor, barrister, law firm, chambers, partner, counsel, litigation, legal, advocate.
- **Healthcare:** clinic, hospital, medical, doctor, surgeon, GP, healthcare, HIPAA, dental, cosmetic.
- **Hospitality:** hotel, resort, suite, concierge, boutique, hospitality, villa, spa.
- **Real Estate:** property, real estate, developer, broker, estate, RERA, IPO, listing.
- **Finance:** wealth, asset management, FCA, investment, private bank, family office, fund.
- **F&B:** restaurant, michelin, bar, pub, dining, menu, cuisine, chef.
- **Education:** school, university, college, tuition, admission.
- **Other:** fallback.

Match confidence: if >30% match density → sector flagged. If ambiguous → show generic compliance snippet.

---

## 03 · COMPLIANCE SNIPPET LIBRARY

### Brainstorm (15 ideas)
1. Per-sector static text snippets for each flagged weakness.
2. Templated sentences with parameter slots (e.g. `{domain}`, `{regulator}`).
3. AI-generated open-ended observations (rejected at launch - hallucination risk).
4. Inline citation links to specific regulatory rule text.
5. Severity indicator (low/medium/high) with gold/amber/oxblood dot.
6. Example "good" reference from a peer in same sector.
7. Regulatory body name prefix: "MHRA flags:", "SRA flags:", etc.
8. Jargon-free summary + optional "see full rule" expandable.
9. Video or audio snippet (rejected - not brand-appropriate).
10. Image example (rejected - too retail).
11. One-sentence observation, no more.
12. "Next steps" bulleted list (rejected - too busy in a card).
13. Two variant lengths: short for the card, longer for emailed PDF.
14. Expiration date (e.g. "valid against regulations as at April 2026").
15. Link to Tamazia case study demonstrating the fix.

### Curated picks
1, 2, 4, 5, 7, 8, 11, 13, 14.

### Implementation

Maintain a JSON library of ~80 compliance snippets organised by sector × issue type. Each snippet:
```json
{
  "id": "legal-sra-transparency-missing",
  "sector": "legal",
  "severity": "high",
  "regulator": "SRA",
  "short": "SRA Transparency Rules 2018 require fee information for certain practice areas. Not detected on common footer/pricing paths.",
  "long": "The SRA Transparency Rules 2018 require publication of price and service information for conveyancing, probate, immigration, employment tribunals, motoring offences, and licensing applications. The current site does not expose this information at conventional locations. The risk is regulatory challenge plus loss of trust signal in search.",
  "citation": "SRA Transparency Rules 2018 r.2.1-r.2.4",
  "citation_url": "https://www.sra.org.uk/solicitors/standards-regulations/transparency-rules/",
  "fix_category": "On-page regulatory compliance",
  "valid_until": "2027-04-01"
}
```

Selection logic: given sector + detected issues, return top 1 snippet (severity-weighted). Display:
- Small pill `DETECTED SECTOR: LEGAL`
- Regulator prefix in gold `SRA FLAGS:`
- Short text in Inter 14px ink
- Citation chip `SRA TRANSPARENCY RULES 2018 r.2.1-2.4` with hover tooltip for full citation

If no confident sector match: skip sector-specific snippet and show a generic: `Regulatory readiness assessment is sector-dependent. Full audit confirms scope against your specific framework.`

---

## 04 · RESULT CARD CONTENTS (final visual spec)

### For URL audits

**Header row:**
- Playfair 22px ink: `Preliminary finding for [user domain]`
- Right-aligned pill: `ANALYSIS COMPLETE` Inter 11px caps 0.15em ivory on oxblood 1px gold, 8px padding.

**Three-metric grid (stacks on mobile):**
1. **Core Web Vitals** — Freight Big Pro 64px gold numeral (e.g. `2.4s` for LCP). Inter 11px caps 0.15em ink `CORE WEB VITALS · LCP`. Gold status dot (green ≤ 2.5s, amber 2.5–4s, red > 4s).
2. **Meta & Schema Readiness** — Freight Big Pro 64px gold numeral (e.g. `8/12`). Inter 11px caps `META & SCHEMA READINESS`. Tooltip on hover reveals the 12 checks and which passed.
3. **Regulatory Readiness** — Freight Big Pro 64px gold numeral (e.g. `62`). Inter 11px caps `REGULATORY READINESS / 100`. Colour weighting: 0–40 red, 41–70 amber, 71–100 gold.

**Editorial observation:**
- Playfair italic 18px ink, max-width 720px centred.
- 2px gold hairline corner brackets (top-left + bottom-right, 32px legs).
- Templated from a library of ~20 observation variants, selected by metric combination.

Example variants:
- All three strong: "Technical foundation is solid. Growth ceiling determined by AI-search and content strategy."
- Technical strong, regulatory weak: "Technical foundation is solid. Regulatory content exposure is the exposed flank."
- Technical weak, regulatory strong: "Site loads slowly and under-indexes key signals. High-priority technical audit recommended."
- All weak: "Systemic re-engineering recommended. A full compliance and SEO audit is the correct next step."
- Mixed: "Gaps visible across technical and regulatory lines. Ranking currently leaves revenue on the table."

**Sector compliance snippet:**
- Small pill `DETECTED SECTOR: [HEALTHCARE]` Inter 11px caps 0.1em.
- Regulator prefix Playfair italic 14px gold: `MHRA FLAGS:`
- Snippet text Inter 14px ink, 2 lines max.
- Citation chip Inter 11px caps gold hairline pill with tooltip.

**Primary CTA:** oxblood filled, 1px gold border, Inter 13px caps 0.1em ivory: `REQUEST YOUR FULL COMPLIANCE AND SEO AUDIT`. 56px tall, full-card width. Click scrolls to contact form with domain pre-filled, sector pre-selected, and audit summary injected as context in the "primary outcome" field.

**Secondary opt-in:** Inter 13px italic ink-muted with gold hairline checkbox: `☐ Email me the findings as a PDF.` Capture email field reveals on check.

**Confidentiality:** Inter italic 13px ink-muted centred: `Findings belong to you whether you proceed or not.`

### For keyword audits

Same layout, different metrics:
1. **Search Intent** — `TRANSACTIONAL` / `COMMERCIAL` / `NAVIGATIONAL` / `INFORMATIONAL` with short descriptor.
2. **Commercial Magnitude** — `LOW` / `MID` / `HIGH` / `VERY HIGH` (bucket from Autocomplete + Trends).
3. **SERP Ownership** — `3 OF 5` gold numeral, Inter caps caption "TOP SERP OWNED BY PEER-GRADE DOMAINS" or "NOT OWNED BY PEER-GRADE DOMAINS." Tooltip lists the top 5 domains.

Observation example (keyword = "private oncology clinic london"):
"Transactional intent. Top 3 results owned by HCA Healthcare (UK), The Harley Street Clinic, and Cromwell Hospital. Your domain not present. Displacement strategy requires E-E-A-T authority build plus local schema."

Sector snippet: inferred sector compliance relevance.

CTA identical.

---

## 05 · CONVERSION MECHANICS

### Brainstorm (15 ideas on converting these audits into full-audit bookings)
1. Primary CTA button at bottom of card (selected).
2. Scroll to contact form pre-filled with domain/keyword + audit summary (selected).
3. PDF email opt-in as secondary capture (selected).
4. Founder alert when high-value domain audits (selected).
5. Social proof injected into CTA: "Request your full audit. Our CGON client saw +96% at IPO." (selected, variant).
6. Urgency cue: "Each findings report is reviewed by the founder within 12 hours." (selected).
7. Limited-time discount (rejected - off-brand).
8. Free consult call prompt (rejected - redundant with Calendly).
9. Competitor comparison tab (Phase 2).
10. Save-report link (Phase 2).
11. Share-report link (rejected - not B2B behaviour).
12. Retarget pixel placement (privacy-friendly: Plausible or no pixel at all).
13. Follow-up email sequence (Phase 2 with consent).
14. Direct founder calendar link in the CTA area (micro text link).
15. Auto-trigger chatbot (rejected - off-brand).

### Curated picks
1, 2, 3, 4, 5, 6, 14.

### Founder alert logic

Trigger when any of these conditions met:
- Domain matches Tamazia's top-100 client target list (see `TAMAZIA-03-CLIENT-TARGETS.md`).
- Domain TLD suggests a major brand (e.g. `.group`, known listed-company suffixes).
- Domain Cloudflare Radar rank < 100,000 (top global websites).
- Email on PDF opt-in matches a corporate domain (not gmail.com, not yahoo.com) that correlates to one of the top-100 companies.

On trigger, Netlify function sends an email via Resend (free tier, 3k/month) or Postmark to Aman with:
- Domain audited
- Timestamp
- Metrics returned
- Sector inferred
- IP geolocation (city + country)
- Referrer URL
- Subject line: `[Tamazia Quick Audit] High-value audit: [domain]`
- Body: formatted data dump + direct link to reply to the auditor if email captured.

### Lead qualification

Every audit is logged to the Netlify Analytics with these fields:
- input
- input_type (URL | keyword)
- sector_inferred
- metrics_returned
- timestamp
- email (if PDF opt-in)
- country (geoIP)
- user_agent

Dashboard (Phase 2): simple Netlify site with password access for Aman showing audit frequency, top domains audited, conversion rate from audit → contact form submission.

---

## 06 · TECHNICAL ARCHITECTURE

### Frontend
- Astro component `QuickAudit.astro` in the homepage.
- Vanilla JS for three states (empty, loading, result). No framework.
- State machine pattern: `idle → submitting → loading → result_url | result_keyword | error`.
- CSS from brand system. Container queries for result card responsiveness.
- ARIA: `aria-live="polite"` on status region.

### Backend
- Netlify Edge Function `netlify/edge-functions/audit.ts` (lower cold-start than standard functions).
- Free tier: 3M edge function invocations per month.
- Function:
  1. Parses input, classifies URL/keyword.
  2. Parallel `Promise.all` across 3–5 API calls (timeout each at 2.5s with `Promise.race`).
  3. Aggregates into metrics object.
  4. Selects observation from template library.
  5. Fetches compliance snippet from JSON library.
  6. Packages and returns JSON.
  7. Logs to Netlify Analytics (async, non-blocking).
  8. Conditionally triggers founder alert.

### Cache layer
- Upstash Redis (free tier 10k/day) OR Cloudflare Workers KV.
- Key: hashed normalised input.
- TTL: 5 minutes for URL audits (site can change), 1 hour for keyword audits (SERP changes slower).
- Reduces load on Google PSI and protects against abuse.

### Rate limiting
- Per IP: 20 requests/hour.
- Per session: 5 requests/minute.
- Exceeded: graceful 429 response with branded Playfair message and Calendly link.

### PDF generation (Phase 2)
- Puppeteer in a Netlify function generating branded PDF from HTML template.
- Storage: Netlify's Blobs or Cloudflare R2 free tier.
- Email via Resend free tier.

### Error handling
- Any API failing: return partial result with a note "Full analysis requires the complete audit."
- Visitor experience never degrades below a usable minimum.
- Error observations: "Analysis partial. Request the full audit for complete findings."

---

## 07 · SAMPLE AUDIT (for "View a sample audit" link)

Pre-rendered sample report for `cliffordchance.com`, shown in a modal overlay when the link is clicked. Demonstrates the format without requiring the user to submit anything. Reinforces brand standard.

Sample content:
- `PRELIMINARY FINDING FOR CLIFFORDCHANCE.COM`
- LCP: `2.1s` (green)
- Meta & Schema: `10/12`
- Regulatory Readiness: `88 / 100`
- Observation: `Technical foundation exceeds the magic-circle peer average. Meta and schema gaps are the narrow opening for a competitor to overtake by 8%.`
- Sector pill: `DETECTED SECTOR: LEGAL`
- Regulator: `SRA FLAGS:` Low. `Transparency rules compliance detected via price publication footprint.`
- CTA: `REQUEST YOUR FULL COMPLIANCE AND SEO AUDIT`

Below the sample, a small line: `Sample pre-rendered for demonstration. Live audits return your domain's actual metrics.`

---

## 08 · POTENTIAL FAILURE MODES AND MITIGATIONS

| # | Failure | Likelihood | Mitigation |
|---|---------|------------|------------|
| 1 | Google PSI rate-limits | Low | Cloudflare Workers KV cache, CrUX fallback. |
| 2 | Target site blocks our fetch (CORS/Cloudflare) | Medium | Graceful partial result, continue with PSI + Observatory only. |
| 3 | Cold-start latency > 3s | Low | Edge function (not standard), pre-warm via scheduled ping every 5 min. |
| 4 | Garbage input (emoji, special chars) | Medium | Client-side validation rejects before submit. |
| 5 | Cost overrun on optional Claude API | Low if disabled | Flag-gated, disabled at launch. |
| 6 | Compliance snippet inaccuracy | Medium | All snippets marked "valid as at [date]", library reviewed quarterly by Aman. |
| 7 | Scraper blocking (for keyword SERP) | Medium | Use Serper.dev free tier + SearXNG fallback. |
| 8 | Sector mis-inference | Medium | Confidence threshold; show generic snippet if < 30% match. |

---

## 09 · MEASUREMENT

Post-launch metrics to track (Netlify Analytics + custom):
- Audit submission rate (audits per homepage visit).
- CTA conversion rate (audit → contact form submission).
- PDF opt-in rate.
- Founder alert trigger rate.
- Average response time (P50, P95, P99).
- Top 20 audited domains per week.
- Top 20 audited keywords per week.
- Sector distribution of audits.
- Geographic distribution.

Target at 30 days post-launch: at least 5% of homepage visitors run an audit, at least 15% of audit runners click through to contact form.

---

## 10 · CLAUDE CODE HANDOFF CHECKLIST

Claude Code implements:
- [ ] `QuickAudit.astro` component (frontend).
- [ ] `audit.ts` Netlify Edge Function (backend).
- [ ] Compliance snippet JSON library.
- [ ] Observation template library.
- [ ] Sector classifier rule set.
- [ ] Commercial intent classifier.
- [ ] Cache integration (Upstash or Workers KV).
- [ ] Rate limiting middleware.
- [ ] Founder alert via Resend integration.
- [ ] ARIA + keyboard navigation.
- [ ] Mobile responsive behaviour via container queries.
- [ ] Error states.
- [ ] Sample audit modal.

Deferred to Phase 2:
- [ ] PDF generation + email delivery.
- [ ] Competitor comparison tab.
- [ ] Historical tracking.
- [ ] Admin analytics dashboard.

Estimated Claude Code implementation: 12 to 16 hours from spec to Netlify staging.

— End of audit engine spec —
