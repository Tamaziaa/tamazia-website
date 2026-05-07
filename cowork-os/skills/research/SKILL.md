---
name: tamazia-research
description: Engine C. Produce 250-400 word dossier per high-value lead. Triggers on "research [company]", "dossier on [lead]", "call prep for [meeting]", "tell me about [prospect]".
---

# Engine C · Research

Used in two places:
1. Seed personalisation merge fields beyond name/title/company
2. Aman's call prep when a warm reply lands

## Inputs

Lead row, optional Cowork connectors (Common Room, Apollo company API, web search, company website fetch)

## Dossier structure

```
COMPANY: [name] · [sector] · [HQ city]

RECENT NEWS (last 60 days)
- [3-5 bullets, dated, with source URL]

REGULATORY STACK
- [list of regulators that apply per sector]
- [recent enforcement signals affecting this company or peers]

FUNDING / EXEC SIGNALS
- Last raise: [date, amount, lead investor]
- Recent exec changes: [list]
- IPO signals: [if any]

TAMAZIA HOOKS
- [2-3 sector-pitch-library hooks tailored to this lead]
- e.g., "their reviews page violates DMCCA 2024 rule X" — only if verified

OPENER VARIANTS
1. [25-word sentence variant A, sector-anchored]
2. [25-word sentence variant B, news-anchored]
```

## Edit point C1

Trigger threshold: companies above £20M revenue OR £5M+ funding raised in last 24 months. Override per sector.

## Storage

Save to Postgres `leads.research_dossier` field. Pull into Engine D personalisation when present.
