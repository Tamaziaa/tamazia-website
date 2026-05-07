---
name: tamazia-triage
description: Engine F. Classify replies (warm/bounce/unsubscribe/OOO/spam) and route. Triggers on "what came in?", "check replies", "triage inbox", "sort founder@", "process this email".
---

# Engine F · Triage

n8n W3 IMAP listener on founder@tamazia.co.uk every 5 minutes.

## Classifier (heuristics first, askClaude for ambiguous middle 20%)

| Classification | Heuristic | Action |
|---|---|---|
| Hard bounce | `MAILER-DAEMON` sender, `5xx` SMTP code | Suppress recipient, halt across all aliases |
| Soft bounce | `4xx` SMTP code | Log, retry once after 24h |
| Unsubscribe | `UNSUBSCRIBE` in subject/body, RFC 8058 List-Unsubscribe header | Suppress, send confirmation, mark lead |
| Out of office | "out of office", "vacation", "automatic reply" | Pause sequence to OOO date if parseable |
| Spam complaint | Sender reports as spam, abuse@ in headers | Disable alias, severity HIGH alert |
| Warm reply | None of above, contains substantive prose | Route to Slack #tamazia-cold-replies |
| Warmup reply | From another tamazia alias, kind=warmup | Archive silently |

## Slack format for warm replies

```
:incoming_envelope: *Warm reply from {{contact_first}} at {{company}}*

*Original send*: {{alias_used}} → {{recipient}} on {{sent_date}}
*Sector*: {{sector}}
*Subject*: {{original_subject}}

> {{reply_body_first_300_chars}}

*My draft suggestion*:
{{askClaude_draft}}

*Open thread*: <{{zoho_message_url}}|View in Zoho>
*Lead context*: {{company}} · {{contact_title}} · {{city}}
```

## Aman's flow

1. Slack push notification on phone
2. Read warm reply on Slack
3. Open Cowork chat: "draft reply to {{company}} thread"
4. I draft using sector context + original send + reply nuance
5. Aman pastes via Zoho mobile or webmail
6. Lead status moves to `qualified` in Postgres

## Edit point F1

Default routing target = Slack #tamazia-cold-replies. Fallback = founder@ with `[WARM REPLY]` subject prefix.

## Edit point F2

Default classifier model = Haiku via askClaude. Opus override available for higher-quality drafts at higher cost.
