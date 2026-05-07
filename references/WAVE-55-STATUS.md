# Tamazia · Wave 55 · Cowork OS Build · 2026-05-07

## Major shipped this round

### Zoho Mail · 5 users + 45 aliases live

All 5 user mailboxes provisioned on Zoho Mail Free:
- `founder@tamazia.co.uk` (Aman, Super Admin) — 9 aliases (oliver, liam, arthur.russell, max.palmer, ethan, david, hugo.clark, leon, jackson.white)
- `hello@tamazia.co.uk` — 9 aliases (james.clark, lucas, theo, daniel.collins, logan, paul.morgan, louis, pablo.cooper, sebastian.reed)
- `sales@tamazia.co.uk` — 9 aliases (william.edwards, george.taylor, leo.harrison, samuel, owen, ben, luca.palmer, diego.roberts, archie.baker)
- `support@tamazia.co.uk` — 9 aliases (henry, jack.robinson, oscar, benjamin.wood, jacob.carter, felix, matteo.russell, asher.hughes, alfie.watson)
- `tamazia.hellohello@tamazia.co.uk` (display "Tamazia Legal", repurposed) — 9 aliases (noah, harry, charlie, mason.robinson, michael, finn, marco.carter, levi.thomas, freddie)

Total: 45 aliases on tamazia.co.uk side. Zoho admin password noted in credentials file.

Forwarding consolidation deferred — Zoho Mail Free requires per-user login to set forwarding rules. Workaround: use Zoho webmail "Streams" view for unified inbox visibility across the 5 mailboxes.

### Cowork OS plugin built

Plug-and-play installable bundle at [`tamazia-cowork-os/`](computer:///Users/amanigga/Desktop/Tamazia-Rebuild/tamazia-cowork-os/) on desktop:

- 14 skills (launchpad, sourcing, enrichment, research, proposals, sequences, triage, warmup, orchestration, sector-pitch, health, suppression, deploy, brand-voice)
- 5 n8n workflows (W1 warmup, W2 send orchestration, W3 triage, W4 health, W5 kill switch)
- Stack scripts (docker-compose, Caddyfile, postgres-schema, install_vps.sh, engine_d_personalize.py)
- Reference docs (sector pitch library, aliases JSON, Wave 51-53 docs)
- 39 files total, 256KB

Drop into Cowork plugin directory to install. Each skill is a single editable SKILL.md.

### Live-fire SMTP test

| Relay | Status | Daily cap |
|---|---|---|
| Mailjet | **WORKING** (test send oliver@ → founder@ succeeded) | 200/day |
| SendGrid | **WORKING** (HTTP 202 accepted) | 100/day |
| Brevo | Needs SMTP activation (email contact@brevo.com to unlock) | 300/day pending |
| Resend | Needs tamazia.co.uk domain verification on Resend dashboard | varies pending |

Working capacity right now: 300/day. Below the 450/day target but fine for the 50-lead pilot.

### Slack reply channel live

Webhook tested and functioning. Channel name: `#new-channel` (rename to `#tamazia-cold-replies` later in Slack admin).

### CF Email Routing on tamazia.in

Enabled. MX swapped from BigRock to CF. BigRock dummy mailboxes (5 of them, ~250KB total content) made obsolete. Awaiting Aman's destination address verification step then I create 45 forwarding rules in one API pass.

## Pending items · ranked by criticality

### 1. Brevo SMTP activation (your side)

Email contact@brevo.com from realfamemedia@gmail.com:

```
Subject: Activate SMTP sending for new account

Hi,

Please activate SMTP sending for my new Brevo account (realfamemedia@gmail.com). Use case: cold outreach for Tamazia, a UK SEO and regulatory compliance agency for hospitality, healthcare, real estate, and legal sectors. We have UK GDPR Article 6(1)(f) Legitimate Interest Assessment on file. Daily volume target: ~300/day. Domain authentication already complete for tamazia.co.uk and tamazia.in.

Aman Pareek
Founder, Tamazia
realfamemedia@gmail.com
```

Typical activation: 24-48h.

### 2. Resend tamazia.co.uk verification (your side)

Open https://resend.com/domains → Add domain → tamazia.co.uk → DKIM CNAME provided → I add to CF DNS via API → click Verify.

### 3. Oracle VPS provisioning (your side)

Resume from Create instance flow. Re-authenticate (session expired earlier). Steps in `WAVE-54-FINAL-STATUS.md`. Reply with public IP, I install n8n + Postgres + Caddy via SSH.

### 4. CF Email Routing destination verify (your side)

In your normal Chrome:
- https://dash.cloudflare.com/4a3b271b5f1f4cbfc16c6e9e5e62451b/tamazia.in/email/routing
- Routes tab → Destination addresses → Add destination → founder@tamazia.co.uk → Save
- Open mail.zoho.eu → click verification link from CF
- Reply `cf dest verified` and I create 45 routing rules in one API pass

### 5. Postmaster Tools registration (your side, optional)

For deliverability monitoring per domain:
- https://postmaster.google.com/managedomains → add tamazia.co.uk → verify via TXT record I add via CF API
- Repeat for tamazia.in
- Once verified, n8n W4 daily health check pulls from Postmaster Tools API

### 6. Zoho per-mailbox forwarding (your side, optional)

Cleanest unified inbox approach: log into hello@/sales@/support@/legal@ Zoho webmail one-by-one, configure forwarding to founder@. ~5 minutes total. Or skip and use Zoho webmail "Streams" view.

## Files snapshot · `~/Desktop/Tamazia-Rebuild/`

| File | Purpose |
|---|---|
| `tamazia-cowork-os/` | Cowork plugin bundle, 14 skills + 5 workflows |
| `email-aliases-v2.json` | 45/45 split aliases |
| `sector-pitch-library.md` | 13 sectors fuel for personalization |
| `engine_d_personalize.py` | Python prototype, runs locally |
| `n8n-stack-docker-compose.yml` | n8n + Postgres + Caddy stack |
| `n8n-stack-Caddyfile` | HTTPS proxy config |
| `n8n-install-vps.sh` | VPS bootstrap |
| `postgres-schema.sql` | Pipeline schema |
| `n8n-workflow-w1-warmup.json` | W1 warmup workflow |
| `COWORK-OS-ROADMAP.md` | Master roadmap, 8 engines, 12 EDIT POINTs |
| `n8n-pipeline-architecture.md` | Architecture v1 |
| `WAVE-54-FINAL-STATUS.md` | Earlier round status |
| `WAVE-55-STATUS.md` | This document |
| `references/` | 9 reference docs from origin/main |
| `.credentials/email-pipeline.env` | All API keys + relay status (700 perms, gitignored) |
| `.credentials/ssh-keys/tamazia-n8n` | SSH private key for VPS |

## What I do once each unblock lands

| You reply | I execute |
|---|---|
| `cf dest verified` | Create 45 CF Email Routing rules via API in one pass |
| `oracle ip <ip>` | SSH into VPS, install Docker + n8n + Postgres + Caddy, import 5 workflows, point n8n.tamazia.co.uk DNS to the IP |
| `brevo activated` | Test send via Brevo to verify, mark relay healthy in Postgres |
| `resend domain verified` | Test send via Resend to verify, mark relay healthy |
| `pilot ready` | Run 50-lead pilot in UK boutique hotels sector |

## Memory: what to remember about this session

- Zoho Mail Free has hard 5-user cap. We use exactly 5 (founder + hello + sales + support + tamazia.hellohello/Legal). Mid-stream user creation forces auto-fill collision on username field — solution: type Username AFTER Display Name + Last Name, NOT before.
- Brevo requires manual SMTP activation for new accounts. Plan for 24-48h delay.
- Resend's send-only API keys cannot manage domains; need full-access key from dashboard.
- Cloudflare dashboard SPA fails to render in MCP-driven Chrome (bot detection or session split). Workaround: API-driven for everything except destination verification, which Aman does in normal browser.
- Oracle Cloud session expires fast; require re-auth. Don't lose IP once provisioned.
- The Cowork OS plugin folder is the canonical "permanent skills" artifact. All future enhancements go there.

End of Wave 55.
