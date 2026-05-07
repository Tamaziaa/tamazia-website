---
name: tamazia-sequences
description: Engine E. Multi-touch cadence for cold sequences. Day 0 cold, day 3 reminder, day 7 value drop, day 14 breakup. Triggers on "send sequence", "follow up", "schedule cadence", "drip campaign".
---

# Engine E · Sequences

State machine in Postgres `sequences` table.

## Default 4-touch cadence

```
Day 0  · cold (Engine D body, sector subject A)
Day 3  · reminder (4 lines, references original send + reciprocity hook)
Day 7  · value drop (one specific compliance audit insight from Engine C)
Day 14 · breakup ("closing your file" framing, leaves door open)
```

## Per-alias daily cap

5 cold sends + 3 follow-ups = 8 outbound max per alias per day post-warmup.

Across 90 aliases that is 720/day capacity; we will not reach it.

## Exit conditions

- Lead replies (warm/bounce/unsub) → sequence stops, Engine F takes over
- Suppression list hit → sequence stops permanently
- Day 14 breakup sent → sequence marked `completed`
- Master kill switch active → all sequences pause

## Edit point E1

Cadence touches. Default 4. Override per sector or globally.

## Edit point E2

Per-sector send hours. Default 0900-1700 UK. Override:
- Hospitality: 0700-1100 (catch them before busy season)
- IPO: 0900-1100 (before market opens)
- Wellness: 1000-1500
- F&B: 1100-1400

## Reminder template (day 3)

```
Subject: Re: [original subject]

{{contact_first}},

Forwarding in case the original landed below the fold.

The compliance audit I mentioned is yours either way. Forty five minutes by phone whenever fits your week.

Aman
```

## Value drop template (day 7)

```
Subject: One specific {{regulatory_hook}} flag we found at {{company}}

{{contact_first}},

We ran the {{company}} content through our DMCCA / SRA / FCA / RERA review. Found one specific exposure: [{{insight from Engine C}}].

Not a sales pitch. The audit is yours regardless.

Aman
```

## Breakup template (day 14)

```
Subject: Closing your file at Tamazia

{{contact_first}},

Closing the file. Three touches without a reply tells me the timing isn't right.

If the {{regulatory_hook}} angle becomes urgent for {{company}}, the line stays open.

Aman
```
