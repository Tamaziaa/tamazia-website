# Email suppression list · central authority · Wave 52

## What this is

Single source of truth for every recipient email address that must NEVER be sent
to from any of Tamazia's 90 sending aliases. All sending paths (YAMM, Smartlead,
n8n, future engines) check this list before send.

## What goes in

- Hard bounces (5xx SMTP rejection)
- Soft bounces after 3 consecutive failures
- Unsubscribe link clicks (RFC 8058 endpoint already live)
- Reply-based unsubscribes (parsed by n8n: "unsubscribe", "remove me", "stop")
- Spam complaints (Postmaster, JMRP, Yahoo CFL feedback loops)
- Manual blocklist (e.g., competitors, current clients, employees of competitors)

## Where it lives

Cloudflare KV namespace: `EMAIL_SUPPRESSIONS` (to be created in Wave 52)
- Key: SHA-256 of lowercase email address
- Value: `{ reason, source_alias, timestamp_iso, never_expire }`

## Pre-send check protocol

Every cold send via any tool must:
1. Hash the recipient address
2. Query KV namespace for the hash
3. If found: log skip, increment skipped counter on the campaign
4. If not found: proceed to send

## Persistence

Suppression entries never expire. Once on the list, always on the list.
Manual override requires founder@ confirmation in writing.

## n8n routing

n8n maintains the suppression list as the operational backbone:
- Reads bounces from founder@ Zoho IMAP every 15 min
- Updates KV via Cloudflare API
- Posts daily report to Slack of new suppressions

## Compliance role

PECR Reg 22(2) and UK GDPR Art 21(2) require us to honour opt-outs immediately
and permanently. This list is the technical implementation of that legal duty.
