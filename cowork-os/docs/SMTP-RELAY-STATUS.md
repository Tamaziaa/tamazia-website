# SMTP Relay Status · 2026-05-07

| Relay | tamazia.co.uk | tamazia.in | Daily cap | Test send | Status |
|---|---|---|---|---|---|
| Resend | verified | verified (Wave 51) | unlimited transactional | 5 aliases tested 2026-05-07 | **WORKING** |
| Mailjet | verified | verified | 200/day per domain | oliver→founder verified | **WORKING** |
| SendGrid | verified | verified | 100/day shared | HTTP 202 accepted | **WORKING** |
| Brevo | verified | verified | 300/day per domain | not tested | activation pending |

## Aliases tested via Resend (one per Zoho user)

- `oliver@tamazia.co.uk` (founder mailbox) → SUCCESS
- `james.clark@tamazia.co.uk` (hello mailbox) → SUCCESS
- `william.edwards@tamazia.co.uk` (sales mailbox) → SUCCESS
- `henry@tamazia.co.uk` (support mailbox) → SUCCESS
- `noah@tamazia.co.uk` (legal mailbox) → SUCCESS

All 5 returned unique Resend message IDs. DKIM, SPF, alias chain validated end to end.

## Working capacity

300/day cold via Mailjet + SendGrid + Resend headroom. Brevo activation adds another 600/day when approved.

