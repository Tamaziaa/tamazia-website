---
name: tamazia-suppression
description: Manage suppression list (bounces, unsubscribes, role addresses). Triggers on "suppress [email]", "check suppression", "suppression list", "is [email] suppressed".
---

# Suppression List

Postgres `suppression` table. Global across all 90 aliases.

## Sources

- Hard bounces (Engine F)
- Unsubscribes (Engine F + RFC 8058 List-Unsubscribe)
- Spam complaints (Engine F)
- Manual flag (Aman or via Cowork chat)
- Role address detection (info@, contact@, no-reply@) — auto-suppress before send

## Schema

```sql
CREATE TABLE suppression (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(64),
  suppressed_at TIMESTAMP DEFAULT NOW(),
  source_send_id INT REFERENCES sends(id)
);
```

## Pre-send check

Every send via W2 first runs:
```sql
SELECT 1 FROM suppression WHERE email = $1 LIMIT 1;
```

If hit, send is dropped, reason logged.

## Confirmation

On unsubscribe, Engine F sends confirmation within 60 minutes:
```
Subject: Confirming unsubscribe from Tamazia

This is to confirm that {{email}} has been suppressed across all 90 aliases. 
You will receive no further outreach from Tamazia.

If this was an error, reply RESUBSCRIBE.
```

## Audit

Suppression list export available as CSV via Cowork chat: "export suppression list".
