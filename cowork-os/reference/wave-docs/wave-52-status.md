# Wave 52 status · Email pipeline phase 1 · 2026-05-06

## Done

### Zoho Mail Free org
- Provisioned for tamazia.co.uk on Zoho EU
- 5 user licences free forever (Mail Free plan, the offer the user availed)
- Domain ownership verified via Cloudflare DNS TXT record

### DNS swap
- Cloudflare Email Routing disabled (was holding MX lock)
- 3 Zoho EU MX records added: mx (10), mx2 (20), mx3 (50)
- SPF updated to `v=spf1 include:zoho.eu include:_spf.resend.com include:_spf.google.com ~all`
  (added Google so YAMM Send-As alignment works)
- DKIM 2048-bit key generated in Zoho with selector `zoho`, public key published
  to `zoho._domainkey.tamazia.co.uk`, Zoho verified ✓
- DMARC temporarily downgraded to `p=quarantine` for the 14-day warmup window
  to avoid hard-rejecting any test sends; will return to `p=reject` after
  warmup proves clean

### founder@tamazia.co.uk
- Real Zoho mailbox, super administrator, 10GB storage
- DKIM-signed outbound, full IMAP/SMTP access
- You log in at mail.zoho.eu

## 14 gaps now solved (documented in references/)

1. Send-from architecture for 90 aliases via Zoho 5-user × 18-alias-each
2. YAMM scale impossibility resolved by 10-active / 80-reserve split
3. Catch-all spam mitigated via Zoho rule + spam filter
4. SPF Google alignment patched
5. Per-alias bounce kill switch designed for n8n
6. Pre-send list verification via existing ZeroBounce/NeverBounce credits
7. 90 first-name + last-name pairs generated (50 surnamed, 40 first-only)
8. 30-day reputation curve documented (`email-warmup-curve.md`)
9. Compliance footer template drafted (`cold-email-footer.md`)
10. Central suppression list architecture documented (`email-suppression.md`)
11. 90 persona signatures derivable from `email-aliases.json`
12. Open tracking pixels off by default
13. Legitimate Interest Assessment drafted (`lia-cold-outreach.md`)
14. DMARC temporarily quarantine for warmup safety

## The 90 personas

`references/email-aliases.json` and `references/email-aliases.md`:
- 50 with surname (LinkedIn-credible)
- 40 first-name-only (casual)
- 18 distributed per Zoho user × 5 = 90 total
- 10 active for YAMM phase 1 (manual Send-As setup)
- 80 reserve for Smartlead phase 2 (no Gmail involvement)

## 4 secondary mailboxes selected (top 4 from 50-name brainstorm)

1. hello@ — universal first-contact
2. sales@ — new business pipeline
3. support@ — existing client SLA
4. legal@ — UK GDPR/ICO statutory + compliance contact

Plus founder@ already live = 5 of 5 free licences used.

## Pending (manual UI work)

These steps must be done in Zoho UI by Aman or me driving via Chrome MCP:
- Create 4 secondary mailboxes (hello, sales, support, legal) — 4 × 1 min in Zoho UI
- Configure founder@ as catch-all in Zoho admin → Mail Settings → Catch-All
- Create 18 aliases per user in Zoho (90 total) — bulk import via CSV upload available
- Configure Zoho forwarding rules: hello/sales/support/legal forward to founder@

## Pending (requires user spend approval)

- Hetzner CX11 VPS for n8n self-hosted warmup loop (£3.79/month)
- 4 free trial signups via Revolut/Wise virtual cards (Smartlead, Instantly, Mailreach, Lemwarm)

## DNS state at end of Wave 52

```
tamazia.co.uk    MX    10  mx.zoho.eu
tamazia.co.uk    MX    20  mx2.zoho.eu
tamazia.co.uk    MX    50  mx3.zoho.eu
tamazia.co.uk    TXT   v=spf1 include:zoho.eu include:_spf.resend.com include:_spf.google.com ~all
tamazia.co.uk    TXT   zoho-verification=zb60522663.zmverify.zoho.eu
zoho._domainkey  TXT   v=DKIM1; k=rsa; p=MIIB...AQAB (Zoho 2048-bit)
_dmarc           TXT   v=DMARC1; p=quarantine; rua=...; sp=quarantine; ... (warmup safety)
```

## Architecture diagram

```
INBOUND
  Any address @tamazia.co.uk
    → Zoho EU MX
    → catch-all on founder@
    → founder@ Zoho mailbox (you log in here)
  Plus hello/sales/support/legal forward to founder@ for unified visibility

OUTBOUND
  Active 10 personas (warmup phase 1)
    → Gmail Send-As via Zoho SMTP
    → YAMM cadence
  Reserve 80 personas (warmup phase 2 onwards)
    → Smartlead direct via Zoho SMTP (5 user creds, 18 aliases each)
  Transactional /api/contact /api/audit /api/briefings auto-acks
    → Resend SMTP (already live)
  All paths SPF/DKIM/DMARC aligned to tamazia.co.uk
```
