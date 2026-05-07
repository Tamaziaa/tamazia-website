---
name: tamazia-sector-pitch
description: Look up regulatory hook + body template + pricing tier per sector. Triggers on "sector pitch for [hospitality/law/finance/etc]", "what's the pitch for X", "regulatory angle for Y".
---

# Sector Pitch Library

Reads `sector-pitch-library.md` from the project root. Returns structured entry:

```json
{
  "name": "Hotels and Hospitality",
  "icp": "independent properties, boutique groups, 50+ property international chains",
  "reg_hook": "ASA CAP Code · DMCCA 2024 · UK GDPR + PECR · Package Travel Regulations",
  "pain_stat": "15 to 25% OTA commission. 50% OTA cancellation rate vs 18.2% direct",
  "pricing": "Foundation £2,500 single property. Authority £4,500 boutique. Enterprise £9,500 international chain",
  "subject_options": [
    "The OTA tax {{company}} is paying every booking",
    "DMCCA 2024 enforcement is live. Your reviews page may be the exposure",
    "Compliance reviewed SEO for {{company}} {{property_type}}"
  ],
  "body_template": "..."
}
```

## 13 sectors covered

1. Hotels and Hospitality
2. Law Firms
3. Financial Services
4. Real Estate and Property
5. IPO and Pre IPO
6. Restaurants, Bars, F&B
7. Executive Personal Brand
8. Education
9. E Commerce and Luxury Retail
10. Automotive
11. Wellness and Fitness
12. Technology and SaaS
13. Events, Manufacturing and Other

## Sector aliases (fuzzy match)

- hotels, hospitality, hotel → Hotels and Hospitality
- law, legal, solicitors → Law Firms
- finance, financial, wealth → Financial Services
- real_estate, property, realestate → Real Estate and Property
- ipo, pre_ipo, listing → IPO and Pre IPO
- restaurant, fb, food, dining → Restaurants, Bars, F&B
- executive, epb, founder_brand → Executive Personal Brand
- education, edu, university, school → Education
- ecommerce, retail, dtc → E Commerce and Luxury Retail
- automotive, auto, dealership → Automotive
- wellness, fitness, gym → Wellness and Fitness
- tech, technology, saas → Technology and SaaS
- events, manufacturing, other → Events, Manufacturing and Other
