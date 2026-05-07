# Standard cold email footer · Wave 52

Auto-appended to every cold send via YAMM/Smartlead template.
Plain text, 4 lines, no images, no marketing language.

```
---
{{persona_name}} · Tamazia · 205 C1 Barking Wharf Sq, London IG11 7HZ
We help {{sector}} businesses meet UK regulatory and search compliance.
Reply STOP to remove you from this list permanently.
List-Unsubscribe: <mailto:unsubscribe@tamazia.co.uk?subject=unsubscribe>
```

## Per-recipient compliance log fields (auto-populated by n8n)

- recipient_email
- recipient_company
- source (e.g., "apollo·UK·hospitality")
- lawful_basis: "Art 6(1)(f) legitimate interests · LIA v1.0"
- date_acquired
- date_first_sent
- alias_used
- campaign_id

Stored in Cloudflare KV namespace `EMAIL_AUDIT_LOG`, retention 6 years
(UK Limitation Act 1980 default).
