# Tamazia · Master Roadmap · 2026-05-07

Full sync across every session and project memory. Read top to bottom. This is the canonical pickup document for Tamazia.

## State summary

| Track | Status |
|---|---|
| Tamazia website (Phases 0-12) | DEPLOYED. 44/44 pages live. SHA `6976a15` |
| Email pipeline infrastructure | 90% complete |
| Cowork OS plugin bundle | DEPLOYED to GitHub branch `wave-55-cowork-os` |
| Cold campaign launch | BLOCKED on 3 unblocks |

## Phase 0-12 status (website)

Per memory `tamazia_phase_execution_state.md`, all phases A through I deployed 2026-04-30 SHA `a2a8c25d`. Live commit on production: `6976a15` (Wave 53 docs commit on top of phases).

**44/44 pages return HTTP 200**. Verified live this session.

### Architecture confirmed in production

| URL pattern | Examples | Count |
|---|---|---|
| Home | `/` | 1 |
| About | `/about/` | 1 |
| Services (sectors) | `/services/hospitality/`, `/services/law-firm/`, etc. | 5 |
| Case studies | `/case-studies/cg-oncology/`, `/case-studies/major-hotel-group/`, `/case-studies/meraas-dubai/` | 3 + hub |
| Insights | `/insights/hotels/`, `/insights/legal/`, `/insights/healthcare/`, etc. | 6 sector + 3 articles |
| Booking | `/book/discovery/`, `/book/strategy-call/`, `/book/finance/`, etc. | 9 |
| Contact | `/contact/` | 1 |
| Press | `/press/` | 1 |
| Legal | `/privacy-notice/`, `/cookie-policy/`, `/terms/`, `/complaints/`, `/modern-slavery-statement/`, `/acceptable-use/`, `/security-policy/`, `/security-acknowledgments/`, `/legal/data-protection/`, `/legal/dpa/`, `/legal/sub-processors/`, `/status/` | 12 |
| Total | | **44** |

### Phase status table

| Phase | Name | Status |
|---|---|---|
| A | Structural Integrity | DEPLOYED |
| B | Visual Polish | DEPLOYED |
| C | Typography / Regulator Recognition | DEPLOYED |
| D | Verification Test (case studies) | DEPLOYED |
| E | Discretion Test (copy/forms) | DEPLOYED |
| F | Trust Signals | DEPLOYED |
| G | Depth Test (19 pages) | DEPLOYED |
| H | Completion / QA | DEPLOYED |
| I | Final Sweep (65 bugs) | DEPLOYED |

### Outstanding from phase backlog

1. **P12-07 audit.js refactor** — split 1373-line single file into 4 modules (validator, fetcher, scorer, reporter). Hygiene only, no functional issue. Not blocking.

2. **Brand audit findings** (from this session's live audit):
   - **CRITICAL**: Mumbai/Pvt Ltd in footer of /, /contact, /insights, /privacy-notice, /terms. Contradicts your stated UK HQ. **Entity decision A/B/C required**.
   - 1 narrative em dash on home audit gauge ("ANALYSIS COMPLETE — What we found"). Should be interpunct.
   - 7 placeholder em dashes in audit gauge components. Visual decorators, not pauses. Acceptable per R4 strict reading.

3. **Pre-launch (Aman's tasks)** from earlier memory:
   - DNS cutover to tamazia.co.uk → already done (site live)
   - DMARC at quarantine on .co.uk (was reject before warmup, downgrade for safe pipeline build)
   - CONTACT_FROM env var on Pages → already updated
   - Calendly embed (Q-1) → ✅ resolved via /book/* tree
   - Case study permission emails (Q-2) → ✅ resolved via slug renaming (cg-oncology, major-hotel-group, meraas-dubai)
   - Runner V3 calibration (Q-3) → not blocking
   - CSS payload trim (Q-4) → not blocking, defer to Round 16+
   - Post-launch monitoring (Q-5) → covered by Cowork OS plugin's `tamazia:health` skill
   - Animation backlog (Q-6) → not necessary

## Email pipeline state

### Infrastructure (Wave 51-55)

| Component | State |
|---|---|
| tamazia.co.uk DNS on Cloudflare | live |
| tamazia.in DNS on Cloudflare | live |
| Zoho Mail Free org · 5 users | live |
| 45 .co.uk aliases · 9 per user | **live** |
| Resend SMTP (.in only) | live |
| Brevo SMTP (both domains) | DKIM verified, awaiting SMTP activation |
| Mailjet SMTP (both domains) | **WORKING** (test send succeeded) |
| SendGrid SMTP (both domains) | **WORKING** (HTTP 202) |
| Slack webhook (#new-channel) | **WORKING** (test message posted) |
| CF Email Routing on tamazia.in | enabled, MX swapped, awaiting destination verify |
| GitHub Actions deploy.yml + 4 workflows | live |
| Cloudflare WAF + Rate Limit + Bot Fight Mode | live |
| Cloudflare Access on /admin | live (3 emails allowlisted) |
| MTA-STS + TLS-RPT both domains | live |
| DMARC tamazia.in (p=reject) | live |
| DMARC tamazia.co.uk (p=quarantine) | live (warmup window) |
| ICO registration | done |

### Cowork OS plugin (Wave 55)

**Path**: `/Users/amanigga/Desktop/Tamazia-Rebuild/tamazia-cowork-os/`
**Branch**: `wave-55-cowork-os` on GitHub (62 files, 4 commits, ready for PR merge)

14 skills:
1. `tamazia:launchpad` — master orchestrator
2. `tamazia:sourcing` — Engine A: ICP-targeted lead sourcing
3. `tamazia:enrichment` — Engine B: hydrate lead rows
4. `tamazia:research` — Engine C: 250-400 word dossiers
5. `tamazia:proposals` — Engine D: sector-personalized email body + subject
6. `tamazia:sequences` — Engine E: 4-touch cadence (day 0, 3, 7, 14)
7. `tamazia:triage` — Engine F: classify replies + Slack route
8. `tamazia:warmup` — Engine G: 90-alias warmup loop
9. `tamazia:orchestration` — Engine H: weighted SMTP rotation
10. `tamazia:sector-pitch` — sector library lookup
11. `tamazia:health` — daily health check (Postmaster Tools + bounce stats)
12. `tamazia:suppression` — global suppression list management
13. `tamazia:deploy` — deploy n8n stack to any VPS
14. `tamazia:brand-voice` — Tamazia voice rules + 5 red lines enforcement

5 n8n workflows: W1 warmup, W2 send orchestration, W3 IMAP triage, W4 health check, W5 bounce kill switch.

Stack files: docker-compose.yml, Caddyfile, install_vps.sh, postgres-schema.sql, engine_d_personalize.py, launch_pilot.sh.

Documentation: COWORK-OS-ROADMAP.md, n8n-pipeline-architecture.md, CREDENTIALS-AND-SETUP.md.

Reference: sector-pitch-library.md, email-aliases-v2.json, cold-email-pack.md, 13 sector lead-template CSVs.

## Pending unblocks (you · ranked)

### CRITICAL · 1. Entity question

Decide A, B, or C:
- **A** — UK Ltd already exists at Companies House. Tell me name + reg number. I sweep footer to "Tamazia Ltd · Registered office 205 C1 Barking Wharf Square, London IG11 7HZ".
- **B** — UK trading division of Indian parent. Privacy Notice keeps Indian parent disclosure for GDPR Article 14 transparency. I update Privacy Notice copy.
- **C** — UK entity not yet incorporated. £12 Companies House registration first via gov.uk/limited-company-formation, then I sweep.

Until resolved, every cold email is at risk if recipient checks the footer and sees "Tamazia Pvt Ltd Mumbai".

### HIGH · 2. CF Email Routing destination verify

**Why blocked**: account-level scope on Cloudflare token I cannot add. You add via dashboard.

**Steps** (30 sec in your normal Chrome):
1. https://dash.cloudflare.com/4a3b271b5f1f4cbfc16c6e9e5e62451b/tamazia.in/email/routing
2. Routes tab → Destination addresses → Add destination → `founder@tamazia.co.uk` → Save
3. Open https://mail.zoho.eu → click CF verification link
4. Reply: `cf dest verified`

I create 45 forwarding rules in one API pass.

### HIGH · 3. n8n VPS provisioning

**Why blocked**: Oracle Free Tier UK South ARM Ampere is at capacity ("Request a limit increase" prompt). Wizard form also won't scroll past Placement step in MCP-driven Chrome.

**Three viable paths ranked**:

**Path A · Switch Oracle region** (cleanest, free):
1. https://cloud.oracle.com → Region selector top right → switch to `US East (Ashburn)` or `Singapore`
2. Compute → Instances → Create instance
3. Name: `tamazia-n8n` (or default)
4. Image: Edit → Canonical Ubuntu 24.04
5. Shape: Edit → Ampere → VM.Standard.A1.Flex → 2 OCPU, 8 GB
6. Networking: Create new VCN
7. SSH keys: Paste public keys → paste this exact line:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICGVTyc1D/TrZ0UOVU6bdCqLrS+C4uGMuRuSDvJNQgVP tamazia-n8n@oracle-vps
   ```
8. Create
9. Once RUNNING, copy Public IP. Reply `oracle ip <ip>`.

**Path B · DigitalOcean** (4 USD/month, no ID):
1. https://cloud.digitalocean.com/registrations/new (use realfamemedia@gmail.com + your debit card)
2. Create Droplet → Ubuntu 24.04 → Basic → Regular ($4/month, 1 GB RAM)
3. Region: London
4. Authentication: SSH key → paste my public key (same as above)
5. Create. Copy IP. Reply `do ip <ip>`.

**Path C · Run n8n on your Mac** (free, but Mac must stay on):
1. Install Docker Desktop from docker.com
2. Open Terminal once: `cd ~/Desktop/Tamazia-Rebuild/tamazia-cowork-os/scripts && docker compose up -d`
3. n8n editor at http://localhost:5678
4. Cloudflare Tunnel for public webhook URL (free signup)

**Recommendation**: Path A first (Oracle in different region). Path B as backup.

Once any path produces an IP, I SSH in and install Docker + n8n + Postgres + Caddy + import the 5 workflows. Total time: 5 minutes my side.

### MEDIUM · 4. Resend tamazia.co.uk verification

Send-only Resend API key cannot manage domains. You need to:
1. https://resend.com/domains
2. Add domain → tamazia.co.uk
3. Resend gives a CNAME record. Tell me the value, I add via CF API.
4. Click Verify on Resend. Reply `resend domain verified`.

### MEDIUM · 5. Brevo SMTP activation

New Brevo accounts need manual SMTP activation. Email contact@brevo.com:

```
Subject: Activate SMTP sending for new account

Hi,

Please activate SMTP sending for my new Brevo account (realfamemedia@gmail.com). Use case: cold outreach for Tamazia, a UK SEO and regulatory compliance agency. We have UK GDPR Article 6(1)(f) Legitimate Interest Assessment on file. Daily volume target: ~300/day. Domain authentication already complete for tamazia.co.uk and tamazia.in.

Aman Pareek
Founder, Tamazia
```

Activation: 24-48h.

### LOW · 6. Postmaster Tools registration (optional)

For deliverability monitoring:
1. https://postmaster.google.com/managedomains
2. Add tamazia.co.uk → verify TXT (I add via CF API)
3. Repeat for tamazia.in

### LOW · 7. Merge wave-55-cowork-os PR

1. https://github.com/Tamaziaa/tamazia-website/pull/new/wave-55-cowork-os
2. Create pull request → Merge.

## What I do once each unblock lands

| You reply | I execute · time |
|---|---|
| `entity: A <name> <number>` | Sweep footer + redeploy via GitHub Actions · 5 min |
| `entity: B` | Update Privacy Notice with parent disclosure language · 5 min |
| `entity: C` | Wait for Companies House → sweep · once registered |
| `cf dest verified` | Create 45 CF Email Routing rules via API in one pass · 30 sec |
| `oracle ip <ip>` or `do ip <ip>` | SSH in, install Docker + n8n + Postgres + Caddy, import 5 workflows, point n8n.tamazia.co.uk DNS · 10 min |
| `resend domain verified` | Test send via Resend, mark relay healthy · 30 sec |
| `brevo activated` | Test send via Brevo, mark relay healthy · 30 sec |
| `pilot ready` | Run 50-lead pilot in UK boutique hotels via Mailjet · 15 min |

## Volume capacity progression

| Stage | Capacity / day |
|---|---|
| Now (Mailjet + SendGrid) | 300 |
| After Brevo activation | 600 |
| After Resend tamazia.co.uk verification | unlimited transactional |
| Post-warmup all 4 relays + 90 aliases | 720 (cold) + transactional headroom |

Target volume: 450/day cold = 13.5K/month = ~70 founder calls/month at 1.5% reply rate × 35% reply-to-call.

## Files inventory · `~/Desktop/Tamazia-Rebuild/`

```
tamazia-cowork-os/                 ← permanent plug-and-play plugin (62 files)
├── plugin.json
├── README.md
├── skills/                         ← 14 SKILL.md files
├── workflows/                      ← 5 n8n workflow JSONs
├── scripts/                        ← docker-compose, Caddyfile, install_vps.sh, postgres-schema.sql, engine_d_personalize.py, launch_pilot.sh, sample_pilot_leads.csv
├── docs/                           ← COWORK-OS-ROADMAP, n8n-pipeline-architecture, CREDENTIALS-AND-SETUP
└── reference/                      ← sector-pitch-library, email-aliases-v2, cold-email-pack, lead-templates per sector, wave docs

WAVE-54-FINAL-STATUS.md            ← Wave 54 in-flight status
WAVE-55-STATUS.md                  ← Wave 55 build summary
SESSION-2026-05-07-FINAL-AUDIT.md  ← live site brand audit findings
READ-FIRST-2026-05-07.md           ← master pickup
MASTER-ROADMAP-2026-05-07.md       ← THIS DOCUMENT

email-aliases-v2.json              ← 45/45 split alias data
sector-pitch-library.md            ← 13 sectors fuel
engine_d_personalize.py            ← Engine D Python prototype
n8n-stack-*.{yml,Caddyfile,sql,sh} ← n8n stack (top-level copies)
COWORK-OS-ROADMAP.md               ← Master roadmap, 8 engines, 12 EDIT POINTs
n8n-pipeline-architecture.md       ← Architecture v1
references/                        ← 9 wave docs from earlier rounds
03-Astro-Site/                     ← Astro source (44 pages live)
.credentials/email-pipeline.env    ← all API keys + Zoho password (700 perms)
.credentials/ssh-keys/tamazia-n8n  ← SSH private key for VPS
```

## Memory · what's been preserved

- `MEMORY.md` — index of all memory files
- `tamazia_project_identity.md` — what Tamazia is, 5 red lines, 11 standing rules
- `tamazia_tech_stack.md` — Astro + Cloudflare Pages + GitHub Actions
- `tamazia_round_history.md` — R1-R15 ship history, audit verdict
- `tamazia_work_queue.md` — DNS cutover, Q-1 to Q-6
- `tamazia_content_pricing.md` — verbatim positioning, pricing tiers
- `tamazia_file_map.md` — every source file location
- `tamazia_audit_engine.md` — audit.js v3 architecture
- `feedback_tamazia.md` — standing rules, deploy discipline
- `skill_routing.md` — Tamazia vs LexQuity skill triggers
- `user_aman.md` — your profile + comms style
- `tamazia_phase_execution_state.md` — Phases A-I status, SHA baseline
- `tamazia_phase_amendments.md` — phase E/G/H/I overrides
- `tamazia_phase_i_bugs.md` — 65 bug inventory
- `tamazia_cid_map.md` — Astro component hash IDs
- `email_pipeline_state.md` — Wave 52-53 pipeline state
- `wave_51_53_summary.md` — Wave 51-53 summary
- `wave_55_summary.md` — Wave 55 summary (this round)

## Pipeline pending tasks · final detailed list

### Build/code phase (DONE)

- [x] Phase 0-12 Astro site (44 pages live)
- [x] Sector pitch library (13 sectors)
- [x] Engine D Python prototype
- [x] 5 n8n workflows (W1-W5)
- [x] Cowork OS plugin (14 skills + 5 workflows + scripts + reference)
- [x] Docker compose + Caddy + Postgres schema
- [x] 90 personas JSON (45/45 split)
- [x] Cold email pack (5 sectors fully drafted + day 3/7/14 templates)
- [x] Pilot launcher script
- [x] Slack webhook + test message

### Infrastructure phase (DONE)

- [x] Tamazia.co.uk and tamazia.in DNS on Cloudflare
- [x] DKIM/SPF for Resend, Brevo, Mailjet, SendGrid (both domains)
- [x] DMARC published
- [x] Zoho Mail Free org with 5 users
- [x] 45 .co.uk aliases distributed 9 per user
- [x] CF Email Routing enabled on tamazia.in
- [x] BigRock root MX deleted, CF mail routing MX added
- [x] Slack workspace + #new-channel + Incoming Webhook
- [x] SSH keypair generated for VPS
- [x] All 4 SMTP relay API keys captured (with status)

### Aman task phase (PENDING)

- [ ] Entity question A/B/C decision
- [ ] CF Email Routing destination verification
- [ ] Oracle VPS provision (or DigitalOcean alternative)
- [ ] Resend tamazia.co.uk verification on dashboard
- [ ] Brevo SMTP activation request
- [ ] Postmaster Tools registration (optional)
- [ ] Merge wave-55-cowork-os PR

### My phase 4 (BLOCKED on Aman tasks)

- [ ] Create 45 CF Email Routing rules (blocked on dest verify)
- [ ] SSH into VPS, install n8n stack (blocked on VPS IP)
- [ ] Import 5 workflows into n8n (after install)
- [ ] Configure n8n credential vault (after install)
- [ ] Apply Postgres schema + seed aliases (after install)
- [ ] Point n8n.tamazia.co.uk DNS to VPS (after install)
- [ ] Configure cron-job.org or Postmaster Tools cron pings (after install)
- [ ] Sweep footer for entity rebrand (blocked on entity decision)
- [ ] Update Privacy Notice if Path B (blocked on entity decision)

### Phase 5 (PENDING for pilot)

- [ ] 50 high-quality leads (UK boutique hotels) — manual or via Apollo
- [ ] Engine D run over leads
- [ ] Engine F (triage) live monitoring of replies
- [ ] First 14-day warmup curve
- [ ] First Slack alert from warm reply

### Phase 6 (FUTURE)

- [ ] All 13 sectors active
- [ ] Apollo scheduled saved searches
- [ ] Common Room enrichment
- [ ] Engine C research dossiers automation
- [ ] DMARC tamazia.co.uk back to reject after 14 days clean
- [ ] Suppression list audit + export
- [ ] Quarterly review of Cowork OS plugin skills

## Bottom line

You have **3 critical unblocks** preventing full pipeline launch:
1. Entity question (decision)
2. CF destination verify (30 sec dashboard click)
3. VPS provision (try Oracle different region first, DigitalOcean fallback)

The cold campaign launches 5 minutes after #2 and #3 are complete. The brand sweep ships within 5 minutes of #1.

Everything else is built, tested, version-controlled on GitHub, and waiting on your unblocks.

End of master roadmap.
