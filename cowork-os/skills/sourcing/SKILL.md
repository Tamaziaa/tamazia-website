---
name: tamazia-sourcing
description: Engine A. Build ICP-targeted lead lists for Tamazia cold outreach. Triggers on "find leads", "build prospect list", "sourcing", "give me [N] [sector] companies", "Apollo search", "Companies House lookup". Outputs ranked rows with company, domain, sector, contact_first, contact_title, email if surfaced.
---

# Engine A · Sourcing

Three feed lines:

## 1. Manual high-quality (Cowork chat)

When Aman says "give me 20 UK boutique hotels with marketing director on LinkedIn", I run:
- Web search for the ICP
- Apollo MCP `prospect` skill if connected
- Common Room `prospect` skill if connected
- LinkedIn Sales Navigator (no MCP, use web search results only)

Return ranked CSV with: company, domain, contact_first, contact_last, contact_title, email (if available), city, source_url. Aman accepts/rejects per row.

## 2. Apollo scheduled (n8n W6)

Saved searches per sector run weekly via n8n cron. Default sectors active:
- UK boutique hotels (50-200 rooms)
- UK mid-market law firms (5-50 partners, SRA regulated)
- UK FCA-regulated wealth managers (£100M-£1B AUM)
- UK Dubai cross-border real estate developers
- UK pre-IPO tech companies (Series B-D, US/UK dual-list candidates)

Output goes to Postgres `leads` table marked `source=apollo_auto`.

## 3. Companies House dump

Filter by SIC code, founded last 24 months. Free. Useful for fresh signal.

UK SIC codes:
- 55100 Hotels (hospitality)
- 69101/69102 Solicitors (legal)
- 64191/66220 FCA-regulated (financial)
- 68310/68320 Real estate
- 86101/86220 Healthcare
- 56102/56103 F&B

## Output format (always JSONL)

```json
{"company":"The Standard London","domain":"standardhotels.com","sector":"hospitality","contact_first":"Marcus","contact_last":"Pemberton","contact_title":"Director of Marketing","email":"marcus@standardhotels.com","city":"London","source":"apollo","confidence":0.85}
```

## Quality bar

- Reject rows with: generic role addresses (info@, contact@), free-mail domains for B2B, no LinkedIn URL, low Apollo confidence
- Keep rows with: named decision-maker + direct work email + LinkedIn signal

## Edit point A1

Default ICP = UK boutique hotels (most validated per CG Oncology / Kamat case studies). Override per Aman.

## Edit point A2

Sector saved searches. Default 5 above. Add or remove via config.

## Sources

`sector-pitch-library.md` for sector definitions, `proposals/*.pptx` for ICP details per sector.
