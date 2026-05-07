# Tamazia · Read First · 2026-05-07

If you're returning to this project, start here. This is the master pickup document.

## What's live right now

### Email infrastructure (Wave 51-55)

| Component | Status |
|---|---|
| tamazia.co.uk DNS on Cloudflare | live |
| tamazia.in DNS on Cloudflare | live |
| Zoho Mail Free org · 5 users | live |
| 45 .co.uk aliases (9 per user) | live |
| Slack webhook for warm replies | live (channel: #new-channel) |
| Resend SMTP (tamazia.in only) | live |
| Mailjet SMTP (both domains) | **WORKING** |
| SendGrid SMTP (both domains) | **WORKING** |
| Brevo SMTP (both domains) | activation pending |
| CF Email Routing on tamazia.in | enabled, awaiting destination verify |

### Production website

44/44 pages return HTTP 200. Phase 0-12 deployed. Live commit: `6976a15`.

Brand audit findings (need your decision):
1. **Mumbai/Pvt Ltd in footer** of /, /contact, /insights, /privacy-notice, /terms — contradicts your stated UK HQ. The entity question. You pick A/B/C.
2. **1 narrative em dash on home** in audit gauge title "ANALYSIS COMPLETE — What we found". Should be interpunct ` · `.
3. **7 placeholder em dashes** in audit gauge components. Visual decorators, not pauses. Acceptable per R4 strict reading, but cleaner with interpunct.

### Cowork OS plugin · permanent skills bundle

[`/Users/amanigga/Desktop/Tamazia-Rebuild/tamazia-cowork-os/`](computer:///Users/amanigga/Desktop/Tamazia-Rebuild/tamazia-cowork-os/)

- 14 skills (launchpad, sourcing, enrichment, research, proposals, sequences, triage, warmup, orchestration, sector-pitch, health, suppression, deploy, brand-voice)
- 5 n8n workflows (W1-W5, importable JSON)
- Stack scripts (docker-compose, Caddyfile, postgres-schema, install_vps.sh, launch_pilot.sh, engine_d_personalize.py)
- Documentation (COWORK-OS-ROADMAP, n8n-pipeline-architecture, CREDENTIALS-AND-SETUP)
- Reference (sector-pitch-library, email-aliases-v2, cold-email-pack, 13 sector lead-template CSVs, wave docs)

49 files total. Drop into Cowork plugin directory to install. Each SKILL.md is a single editable file.

### GitHub branch · `wave-55-cowork-os`

Three commits pushed:
- `5c978f4` Cowork OS plugin + 45 Zoho aliases live + audit findings
- `ffc4489` Cold email pack + credentials doc + pilot launcher
- `4584f6d` 13 sector lead-template CSVs + schema doc

**PR URL**: https://github.com/Tamaziaa/tamazia-website/pull/new/wave-55-cowork-os

Merge to `main` via GitHub UI when ready. One click.

## What's pending (your side, ranked by criticality)

### 1. Entity question (CRITICAL · blocks rebrand)

Pick A, B, or C. Reply with the choice:
- A. UK Ltd already exists at Companies House. Tell me name + reg number. I sweep footer.
- B. UK trading division of Indian parent. Privacy Notice keeps Indian parent disclosure.
- C. UK entity not yet incorporated. £12 Companies House registration first via gov.uk/limited-company-formation, then I sweep footer.

### 2. CF Email Routing destination verify (30 sec, unlocks 45 routing rules)

In your normal Chrome (CF dashboard fails to load in MCP):
1. Open https://dash.cloudflare.com/4a3b271b5f1f4cbfc16c6e9e5e62451b/tamazia.in/email/routing
2. Routes tab → Destination addresses → Add destination → `founder@tamazia.co.uk` → Save
3. Open https://mail.zoho.eu → click Cloudflare verification link
4. Reply here: `cf dest verified`

I create 45 forwarding rules in one API pass.

### 3. Oracle VPS finish provisioning (90 sec, unlocks n8n)

1. Open https://cloud.oracle.com (re-auth if needed)
2. Compute → Instances → Create instance (or resume the partial create)
3. Image: Canonical Ubuntu 24.04
4. Shape: Ampere → VM.Standard.A1.Flex → 2 OCPU, 8 GB
5. SSH keys → paste public keys → paste this exact line:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICGVTyc1D/TrZ0UOVU6bdCqLrS+C4uGMuRuSDvJNQgVP tamazia-n8n@oracle-vps
```

6. Create
7. Once RUNNING, copy Public IP
8. Reply: `oracle ip <ip>`

I SSH in and install Docker + n8n + Postgres + Caddy + import 5 workflows + DNS A record `n8n.tamazia.co.uk`.

### 4. Brevo SMTP activation (24-48h human review)

Email contact@brevo.com from realfamemedia@gmail.com. Template in `cowork-os/docs/CREDENTIALS-AND-SETUP.md`. Reply `brevo activated` once unlocked.

### 5. Resend tamazia.co.uk verification (5 min)

resend.com/domains → Add domain → tamazia.co.uk → DKIM CNAME provided → I add via CF API → click Verify on Resend dashboard.

### 6. Postmaster Tools registration (optional, 5 min × 2 domains)

postmaster.google.com/managedomains → add tamazia.co.uk → verify TXT (I add via CF API). Repeat for tamazia.in.

### 7. Merge wave-55-cowork-os PR (1 click)

https://github.com/Tamaziaa/tamazia-website/pull/new/wave-55-cowork-os → Create pull request → Merge.

## What I do once each unblock lands

| You reply | I execute |
|---|---|
| `cf dest verified` | Create 45 CF Email Routing rules via API in one pass |
| `oracle ip <ip>` | SSH provision n8n stack, point n8n.tamazia.co.uk DNS, import 5 workflows |
| `brevo activated` | Test send via Brevo, mark relay healthy in Postgres |
| `resend domain verified` | Test send via Resend, mark relay healthy |
| `entity: A <name> <number>` | Sweep footer, redeploy |
| `entity: B` | Update Privacy Notice with parent disclosure language |
| `entity: C` | Wait for Companies House confirmation, then sweep |
| `pilot ready` | Run 50-lead pilot in UK boutique hotels via Mailjet |

## File inventory · `~/Desktop/Tamazia-Rebuild/`

Organisation:
- `tamazia-cowork-os/` — permanent plug-and-play plugin
- `WAVE-55-STATUS.md` — this round's full status
- `SESSION-2026-05-07-FINAL-AUDIT.md` — brand audit findings
- `READ-FIRST-2026-05-07.md` — this document
- `COWORK-OS-ROADMAP.md` — 8 engines + 12 EDIT POINTs (older but still canonical)
- `email-aliases-v2.json` — 45/45 split alias data
- `engine_d_personalize.py` — Engine D Python prototype
- `n8n-stack-*.{yml,Caddyfile,sql,sh}` — n8n stack files
- `references/` — 9 wave docs from earlier rounds
- `.credentials/email-pipeline.env` — all API keys (700 perms, gitignored)
- `.credentials/ssh-keys/tamazia-n8n` — SSH private key for VPS

## Sectors reference

13 sectors with full proposal decks at `proposals/Tamazia_Proposal_*.pptx`:
hospitality, law-firms, finance, real-estate, ipo, restaurants, executive, education, ecommerce, automotive, wellness, technology, events.

Each has subject + body + pricing + regulatory hook in `sector-pitch-library.md`.

## Volume capacity

Daily target: 450 cold sends · 90 aliases × 5/day post-warmup
Working capacity now: 300/day (Mailjet 200 + SendGrid 100)
After Brevo activates: +300/day = 600/day combined
After Resend tamazia.co.uk verifies: +unlimited transactional capacity

## End

Read this once. Execute the 7 pending items in your own time. Each one I take from there.
