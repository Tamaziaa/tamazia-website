---
name: tamazia-enrichment
description: Engine B. Hydrate lead rows with email, phone, title, LinkedIn, company size, funding, tech stack. Triggers on "enrich [lead]", "find email for [name] at [company]", "get contact details", "complete this lead row".
---

# Engine B · Enrichment

Cascade fallback chain:

1. **Apollo** `enrich-lead` MCP skill — primary
2. **Common Room** `contact-research` MCP skill — secondary
3. **Hunter / Snov / Findymail** API if keys available — tertiary
4. **Web search** for `<company> <role> linkedin email` + email pattern detection — fallback

## Email pattern detection

Common patterns:
- firstname.lastname@company.com
- f.lastname@company.com
- firstname@company.com (small companies)
- firstinitiallastname@company.com

Use Hunter's pattern detection or infer from existing known emails at the same company.

## Confidence scoring

Per field:
- Apollo verified: 0.95
- Common Room match: 0.85
- Web search confirmed: 0.7
- Pattern inference: 0.5

## Edit point B1

Default confidence threshold = 0.7. Rows below get flagged `enrichment_needed=true` for manual review.

## Output

Hydrated lead row with all fields populated + per-field confidence scores in `enrichment_meta` JSON.
