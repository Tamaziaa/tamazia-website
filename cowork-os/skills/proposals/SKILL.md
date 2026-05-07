---
name: tamazia-proposals
description: Engine D. Generate sector-personalized email body + subject from sector pitch library. Triggers on "draft outreach to [lead]", "personalize for [company]", "Engine D run", "create email for this lead".
---

# Engine D · Proposals

Inputs: lead row + (optional) Engine C dossier + sector-pitch-library entry

Outputs: subject + 150-180 word body + chosen alias + recommended pricing tier

## Implementation

Python prototype: `engine_d_personalize.py` on Aman's desktop. Call:
```
python3 engine_d_personalize.py --lead lead.json
```
or batch:
```
python3 engine_d_personalize.py --batch leads.csv --out drafts.jsonl
```

## Subject cycling

3 subject options per sector. Deterministic pick by SHA1 hash of lead.id. Prevents pattern detection across the 90-alias estate.

## Merge fields

- `{{company}}` — required, falls back to "[your company]"
- `{{contact_first}}` — required, falls back to "there"
- `{{contact_title}}` — optional, used in personalised opener
- `{{city}}` — optional, defaults to company city
- `{{property_type|product_line|programme|specialism}}` — sector-specific token

## Voice rules (HARD)

- No em dashes, ever. Period or interpunct only
- "200+" frameworks (never bare "200")
- "Aman Pareek" capitalised
- Patek Philippe / Hermès institutional editorial register
- Compliance footer: ICO registration + LIA reference

## Attachment policy (Edit Point D2)

Default: NO attachment on first cold touch (deliverability hit). Attach the sector PPTX deck only on warm replies asking for more info.

## Tone toggle (Edit Point D1)

Per sector. Default = sector deck register. Soft-touch override available (e.g., for Wellness sector).
