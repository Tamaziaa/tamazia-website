# Tamazia · Cowork OS Master Roadmap · 2026-05-06

This document sequences every engine in the Cowork OS stack, plots dependencies, marks the points where you give edits, and gives a critical-path order. Read top to bottom. Each section ends with **EDIT POINT** markers where you tell me what to change.

## Architecture at a glance

Eight engines. Five are full-stack (run inside n8n on the Oracle VPS). Three are Cowork-chat assisted (you and I work them together in real time).

```
SOURCING → ENRICHMENT → RESEARCH → PROPOSALS → SEQUENCES → TRIAGE
   (A)        (B)         (C)         (D)         (E)        (F)
                                                    ↑
                                              WARMUP (G)
                                              ORCHESTRATION (H)
```

A, B, C populate the lead database. D personalises proposals. E dispatches sequences. F handles replies. G keeps aliases warm. H rotates SMTP relays.

## Dependency graph

```
INFRASTRUCTURE
├── Oracle VPS (replaces Hetzner)
│   └── n8n + Postgres + Caddy
├── Zoho Mail (90 aliases, 4 secondary mailboxes)
└── 4 free SMTP relays (Resend, Brevo, Mailjet, SendGrid) DONE

ENGINES IN ORDER OF BUILD
1. G WARMUP        depends on: aliases live, Postgres seeded
2. H ORCHESTRATION depends on: G live, all SMTP relay credentials in vault
3. F TRIAGE        depends on: master inbox catch-all, Slack webhook
4. E SEQUENCES     depends on: D ready, leads in queue
5. D PROPOSALS     depends on: sector pitch library DONE, leads enriched
6. A SOURCING      independent, can start any time
7. B ENRICHMENT    depends on: A producing rows, Apollo MCP plugged in
8. C RESEARCH      depends on: B output, Common Room or web search
```

## Engine specs

### Engine A · Sourcing

What it does: produces a stream of qualified leads matching ICPs across the 13 sectors. Output: rows with `company`, `domain`, `sector`, optional `contact_name` and `contact_email` if surfaced.

How it runs: hybrid. Cowork chat is the high-quality producer (you describe an ICP, I run web search + Apollo MCP + Common Room MCP, return ranked rows, you accept or reject). n8n is the bulk producer (scheduled job pulls from Apollo via API every Monday for the configured ICP filters).

Three feed lines:
1. **Cowork chat manual.** "Aman, give me 20 UK boutique hotels with marketing director on LinkedIn." I produce a ranked CSV. You accept. Goes to Postgres.
2. **Apollo scheduled.** Saved searches per sector run weekly. New rows enter Postgres marked `source=apollo_auto`.
3. **Companies House dump.** UK company filings filtered by SIC code (hospitality, finance, real estate, healthcare). Surface companies founded in last 24 months. Free.

EDIT POINT A1: which ICP gets built first. Recommended: UK boutique hotels (your most validated segment per the case studies).

EDIT POINT A2: which sector saved searches you want active in Apollo. Default is your top 5: hospitality, healthcare, real estate, legal, financial services.

### Engine B · Enrichment

What it does: takes a lead row with company + domain, returns full contact card with email, phone, title, LinkedIn, company size, funding, tech stack.

How it runs: Apollo MCP is the primary path (already plugged into Cowork via the apollo plugin). Common Room MCP is the secondary path. ZoomInfo MCP is available but is paid and requires a contract, deferred.

Fallback chain:
1. Apollo `enrich-lead` skill on the lead row
2. If incomplete, Common Room `contact-research` 
3. If still incomplete, web search for `<company> <role> linkedin email` and apply email pattern detection

Output: lead row hydrated. Confidence score on each field. Rows below confidence threshold flagged for Cowork chat review.

EDIT POINT B1: confidence threshold. Default is 0.7. If you want stricter, raise it. Stricter = fewer rows but higher quality.

### Engine C · Research

What it does: produces a one-pager research dossier per high-value lead. Used in two places: (1) to seed the personalisation merge fields beyond name/title/company, and (2) for your call prep when a warm reply lands.

How it runs: Cowork chat is the producer. When a lead is marked `research_needed=true` (either by Engine B's flag for high-value rows or by you in Cowork), I pull from web search, Common Room, Apollo company data, and the company's own site. Output: 250-400 word dossier, structured.

Dossier structure: 
- Recent news, last 60 days
- Stack of regulators that apply (the heart of Tamazia's edge)
- Recent funding, exec changes, IPO signals
- Pain hooks specific to this lead (e.g., "they ran a CG Oncology-style raise last year", "their reviews page violates DMCCA 2024")
- Two opener sentence variants for the cold email

EDIT POINT C1: which lead value tier triggers research. Default: companies above £20M revenue or £5M+ funding raised in last 24 months.

### Engine D · Proposals

What it does: produces a sector-tailored proposal email body and (optional) full deck attachment from the 13 PPTX templates in `proposals/`.

How it runs: Python prototype next session, then bolted into n8n. Inputs:
- Lead row (company, sector, contact_first, contact_title, city, product_line)
- Engine C dossier if available
- Sector pitch library entry from `sector-pitch-library.md`

Output:
- Subject line (1 of 3 sector options, cycled to avoid pattern detection)
- Body (150-180 words, sector template with merge fields filled, optional Engine C insertion line)
- Attachment policy (default: no attachment on first send; attach the sector PPTX only on warm replies that ask for more)

EDIT POINT D1: tone toggle per sector. Default is the proposal deck register. If you want a softer first-touch tone for a specific sector, tell me which.

EDIT POINT D2: attachment policy. Default: no PPTX on cold first touch (deliverability hit). Attach on reply ask. Override per sector if you disagree.

### Engine E · Sequences

What it does: dispatches multi-touch sequences. Cold one ✗ Reminder at day three ✗ Value drop at day seven ✗ Breakup at day fourteen.

How it runs: n8n W2 (send orchestration) plus W3 (suppression listener) plus W4 (health check). Each lead enters a sequence and progresses unless they reply, unsubscribe, or bounce. State machine in Postgres `sequences` table.

Default cadence per lead:
1. Day 0: cold (Engine D body, sector subject A)
2. Day 3: reminder (4 lines, references the original send)
3. Day 7: value drop (one specific compliance audit insight from Engine C)
4. Day 14: breakup ("closing your file" framing)

Per-alias daily cap: 5 cold sends + 3 follow-ups = 8 outbound max per alias per day post-warmup. Across 90 aliases that is 720/day capacity; we will not reach it.

EDIT POINT E1: cadence change. If you want 2-touch instead of 4-touch, say so.

EDIT POINT E2: per-sector send hours. Default: 0900-1700 UK time. Hospitality might warrant 0700-1100 specifically. Tell me your sector preferences.

### Engine F · Triage

What it does: classifies every reply as warm, bounce, unsubscribe, out-of-office, or spam, and routes accordingly.

How it runs: n8n W3. IMAP listener on founder@tamazia.co.uk every 5 minutes. Classifier uses heuristics first (subject patterns, sender domain, common bounce signatures), then `cowork.askClaude(prompt, message)` for the ambiguous middle 20%.

Routing matrix:
- **Warm reply** → Slack `#tamazia-cold-replies` with full thread, alias used, sector, lead context, my draft reply suggestion. You read on phone, ask me in Cowork to refine, paste the final via Zoho mobile or webmail.
- **Hard bounce** → suppression list, immediate halt across all aliases for that recipient
- **Soft bounce** → log, retry once after 24h
- **Unsubscribe** (text or RFC 8058 List-Unsubscribe) → suppression, confirmation email, lead row marked
- **Out of office** → log, sequence pauses for the OOO date if parseable
- **Spam complaint** → kill the alias used, escalate severity HIGH alert

EDIT POINT F1: routing target. Default Slack. Confirm or fall back to founder@ with prefix.

EDIT POINT F2: classifier model. Default Haiku via askClaude for ambiguous middle. If you want Opus on warm replies for higher quality drafts, say so (costs more per call).

### Engine G · Warmup

What it does: keeps every alias's sender reputation healthy. Inter-alias mail at realistic cadence with jitter so reputation builds against tamazia.co.uk and tamazia.in DKIM identities before cold sending stresses them.

How it runs: n8n W1, already specified in `n8n-pipeline-architecture.md`. 30-minute cron 0700-2200 UK. Day budget per alias scales: day 1-3 send 2, day 4-7 send 5, day 8-14 send 8, day 15+ send 10. Reads warmup corpus from a 500-line text file.

Status: spec done. Builds the moment Oracle VPS is provisioned and aliases are live in Zoho.

### Engine H · Orchestration

What it does: route every send to the right SMTP relay based on health, daily quota, and per-alias affinity.

How it runs: n8n W2. Pre-send check selects relay by (1) is healthy (no recent 429 or bounce burst), (2) under daily quota, (3) has best affinity to the alias's day budget. Round-robin within tied scores.

Default scoring:
- Resend: weight 4 (highest reputation)
- Brevo: weight 3
- Mailjet: weight 2
- SendGrid: weight 1 (newest, lowest free cap)

EDIT POINT H1: weights. If you want SendGrid weighted higher because of its IP reputation in your sector, tell me.

## Zoho approach: precise plan

Free tier supports 5 users × 30 aliases each = 150 alias capacity. We need 45 on tamazia.co.uk (post 45/45 split correction).

Distribution after correction:
- founder@tamazia.co.uk: 9 aliases (current super admin user)
- hello@tamazia.co.uk: 9 aliases
- sales@tamazia.co.uk: 9 aliases
- support@tamazia.co.uk: 9 aliases
- legal@tamazia.co.uk: 9 aliases
- Total: 45 aliases on tamazia.co.uk

Sequence:
1. I drive Chrome to Zoho admin → Add User → create hello@, sales@, support@, legal@ (4 secondary mailboxes, 5-6 min each)
2. For each user, Aliases section → bulk add 9 aliases per user (paste from regenerated JSON)
3. Mail Settings → forwarding: hello/sales/support/legal each forward all incoming to founder@tamazia.co.uk
4. Verify by sending test mail to one alias, confirm it lands in founder@

Total UI time: ~25 min. I drive, you approve any 2FA prompts.

For the 45 on tamazia.in, the path depends on EDIT POINT below.

EDIT POINT Z1: BigRock fate. Tell me whether to (A) preserve BigRock and use cPanel forwarders for the 45 .in personas, (B) migrate tamazia.in to CF Email Routing (kills BigRock mail but cleanest pipeline), or (C) spin up a second Zoho org for tamazia.in (most consistent with .co.uk, but two admin panels).

## Critical-path build order

Phased so each phase ends with a working slice you can sanity-check.

### Phase 1 · Foundation (this week)

1. ✅ 4 SMTP relays verified (DONE)
2. ✅ Sector pitch library (DONE)
3. ✅ Architecture specs (DONE)
4. ⏳ Regenerate 45/45 aliases JSON
5. ⏳ Decide Z1 (BigRock fate)
6. ⏳ Decide Hetzner replacement (Oracle vs DO)
7. ⏳ Slack webhook URL or fallback
8. ⏳ Provision Oracle VPS, install Docker + n8n + Postgres + Caddy
9. ⏳ Drive Chrome to Zoho, create 4 secondary mailboxes, 90 aliases (45 on each domain after Z1)

Phase 1 ends with: VPS up, aliases live, replies route to Slack.

### Phase 2 · Warmup loop (next 14 days)

1. Import W1 warmup workflow into n8n
2. Seed Postgres aliases table from regenerated JSON
3. Drop in 500-line warmup corpus
4. Start W1 with day-1 quota of 2 inter-alias sends per alias
5. Monitor daily via W4 health check
6. Watch DMARC reports for the next 14 days

Phase 2 ends with: 90 aliases at warmup day 15, ready for cold.

### Phase 3 · Outbound (post-warmup, day 15+)

1. Build Engine D Python prototype (this session, next step)
2. Convert to n8n custom function for W2
3. Build Engine F triage classifier
4. Wire Slack webhook into Engine F
5. Run a 50-lead pilot in one sector (recommended: UK boutique hotels, your validated segment)
6. Review reply quality with you in Cowork chat
7. Iterate on Engine D body templates based on actual reply rate

Phase 3 ends with: validated cold campaign generating warm replies.

### Phase 4 · Scale (post-pilot)

1. Activate all 13 sectors progressively
2. Add Engine A Apollo scheduled searches per sector
3. Add Engine B enrichment cascade
4. Add Engine C research dossiers for high-value rows
5. Activate Engine E full 4-touch sequences
6. Tune Engine H orchestration weights based on actual deliverability data

Phase 4 ends with: 450/day cold sends across 13 sectors generating predictable founder calls.

## What you do vs. what I do

| Step | You | Me |
|---|---|---|
| Decide Hetzner alternative | choose Oracle or DO | execute provisioning |
| Decide Z1 (BigRock fate) | choose A/B/C | execute |
| Provide Slack webhook | 90 sec setup | plumb into Engine F |
| Hetzner ID verification | not needed if Oracle | n/a |
| Confirm sector priority | tell me hotels first or other | execute pilot |
| Approve 4-touch cadence | yes/no | tune E1 |
| Approve attachment policy | yes/no | tune D2 |
| Read warm replies | yes, on phone | route via F |
| Draft warm reply text | tell me the angle in Cowork | I draft, you paste-send |

I am the executor. You are the editor.

## Edit points summary (number these in your response)

- A1 first ICP for sourcing
- A2 sector saved searches
- B1 enrichment confidence threshold
- C1 research trigger value tier
- D1 sector tone toggle
- D2 attachment policy
- E1 cadence touches
- E2 per-sector send hours
- F1 reply routing target
- F2 triage classifier model
- H1 SMTP relay weights
- Z1 BigRock fate

Reply with `edit X1: <your call>` per line. Anything you don't address, I default per the values above.

End of roadmap.
