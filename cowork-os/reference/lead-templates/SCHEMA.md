# Lead row schema

Required fields:
- `id` — unique identifier (e.g. `PILOT-001`, `HSP-2026-001`)
- `company` — legal name
- `domain` — primary website domain
- `sector` — one of: hospitality, law, finance, real_estate, ipo, restaurants, executive, education, ecommerce, automotive, wellness, technology, events
- `contact_first` — first name
- `contact_title` — role/title
- `email` — verified work email

Optional but recommended:
- `contact_last` — last name
- `phone` — direct or main
- `city` — for geo-targeting
- `linkedin_url` — for warm research
- `product_line` — sector-specific (property_type for hotels, programme for education, specialism for law)
- `funding_stage` — Seed, Series A, B, C, D, Pre-IPO
- `arr_or_revenue_band` — <1M, 1-5M, 5-20M, 20-100M, 100M+
- `recent_news` — 1-2 sentence hook
- `regulatory_exposure` — specific framework violation hypothesis
- `confidence` — 0-1 enrichment score

## Example row

```csv
id,company,domain,sector,contact_first,contact_last,contact_title,email,phone,city,linkedin_url,product_line,funding_stage,arr_or_revenue_band,recent_news,regulatory_exposure,confidence
PILOT-001,The Standard London,standardhotels.com,hospitality,Marcus,Pemberton,Director of Marketing,marcus@standardhotels.com,+44 20 7906 1100,London,linkedin.com/in/marcuspemberton,boutique luxury,Established,20-100M,2025 expansion to Bankside,DMCCA review compliance gap on pricing pages,0.85
```

## Engine D consumes these fields

Engine D's merge fields use:
- `{{company}}` — `company`
- `{{contact_first}}` — `contact_first`
- `{{contact_title}}` — `contact_title`
- `{{city}}` — `city` (defaults to company city)
- `{{property_type|product_line|programme|specialism}}` — `product_line`

Engine C dossier injects `recent_news` and `regulatory_exposure` into day 7 value drop.

## Source priorities

| Source | Confidence floor | Notes |
|---|---|---|
| Apollo verified email | 0.9 | Best |
| Common Room match | 0.85 | |
| LinkedIn Sales Nav export | 0.75 | |
| Web research + pattern detection | 0.6 | Risky for free-mail B2B |
| Cold guess | 0.4 | Reject |
