# Tamazia Cowork OS · Plug-and-play skill bundle

Permanent skill bundle for the Tamazia cold outreach pipeline. Each skill is self-contained, callable from Cowork chat, and editable any time.

## Install

Drop the entire `tamazia-cowork-os` folder into your Cowork plugins directory (typically `~/.claude/plugins/`).

After install, the skills appear under the `tamazia:` namespace.

## Skills

| Skill | What it does |
|---|---|
| `tamazia:launchpad` | Master orchestrator. Single entry point that runs the full pipeline end-to-end. |
| `tamazia:sourcing` | Engine A. Build ICP-targeted lead lists from Apollo, Common Room, Companies House, web. |
| `tamazia:enrichment` | Engine B. Hydrate lead rows with email, phone, title, LinkedIn, tech stack. |
| `tamazia:research` | Engine C. Produce a 250-400 word dossier per high-value lead. |
| `tamazia:proposals` | Engine D. Generate sector-personalized email body + subject from sector pitch library. |
| `tamazia:sequences` | Engine E. 4-touch cadence with day-3 reminder, day-7 value drop, day-14 breakup. |
| `tamazia:triage` | Engine F. Classify replies (warm/bounce/unsub/OOO/spam) and route. |
| `tamazia:warmup` | Engine G. 90-alias warmup loop with day-quota curve. |
| `tamazia:orchestration` | Engine H. Weighted SMTP relay rotation. |
| `tamazia:sector-pitch` | Look up regulatory hook + body template + pricing tier per sector. |
| `tamazia:health` | Daily health check across Postmaster Tools, bounce rates, spam folder placement. |
| `tamazia:suppression` | Manage suppression list (bounces, unsubscribes, role addresses). |
| `tamazia:deploy` | Deploy n8n stack to Oracle/DO/any-VPS via SSH + docker compose. |
| `tamazia:brand-voice` | Tamazia voice rules. No em dashes. 200+ frameworks. Patek/Hermès register. |

## Edit any skill

Each skill is a single `SKILL.md` file. Open in any editor. Save. Skill is updated.

## Architecture

```
Lead source (sourcing) → Enrichment → Research → Proposal generation
       ↓
Sequence dispatch → SMTP rotation → Outbound
       ↓
Reply (IMAP listener) → Triage → Slack/founder@
       ↓
Warmup loop runs in parallel · Health check daily · Suppression list global
```

## Edit points (matching COWORK-OS-ROADMAP.md)

A1, A2 (sourcing), B1 (enrichment), C1 (research), D1, D2 (proposals), E1, E2 (sequences), F1, F2 (triage), H1 (orchestration), Z1 (BigRock fate).

## Master inbox + reply channel

- founder@tamazia.co.uk (Zoho Mail Free) is the master inbox
- Slack #new-channel (rename to #tamazia-cold-replies) via incoming webhook is the warm-reply channel
