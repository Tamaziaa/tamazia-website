# Data Processing Agreement Template · 2026-05-05

This is the structural skeleton of the DPA Tamazia signs with EU/UK clients when we process personal data on their behalf. The template aligns with UK GDPR + Schedule 21 of the Data Protection Act 2018.

## When this applies

Tamazia signs a DPA when a client commissions services in which Tamazia receives, stores, or processes personal data of the client's own employees, customers, or prospects. Examples: SEO content audits that touch CRM exports, outreach campaigns that ingest a client's prospect list, regulatory briefings that reference named individuals.

## Structure

1. Parties and effective date
2. Definitions (incorporates UK GDPR definitions by reference)
3. Subject matter and duration
4. Nature and purpose of processing
5. Type of personal data and categories of data subject
6. Obligations of the processor (Tamazia)
   - Process only on documented instructions
   - Personnel confidentiality
   - Technical and organisational security measures (Annex A)
   - Sub-processors (Annex B + 30-day notification of changes)
   - Data subject rights assistance
   - Breach notification within 72 hours of awareness
   - DPIA assistance
   - Deletion or return at end of services
   - Audit rights (annual or upon request, with reasonable notice)
7. Obligations of the controller (Client)
   - Accuracy of data provided
   - Lawful basis for sharing
   - Data subject communications
8. International transfers
   - UK-EU adequacy decision relied upon for EEA processors
   - UK Addendum to Standard Contractual Clauses for non-adequate destinations
9. Liability and indemnity
10. Termination
11. Governing law and jurisdiction (England and Wales)

## Annex A · Security measures

- TLS 1.3 in transit, AES-256 at rest
- MFA on all administrator accounts
- Quarterly vulnerability scanning
- Annual penetration test
- Backup with 30-day retention
- Access logged and reviewed monthly

## Annex B · Sub-processors (current list as of 2026-05-05)

| Name | Service | Location |
| --- | --- | --- |
| Cloudflare Inc. | CDN, DNS, Pages, Functions, KV | UK / US / global edge |
| Resend | Transactional email | US |
| Google LLC | Gmail (until founder@tamazia.co.uk routed via CFER) | EU/US |
| Cloudflare Email Routing | Inbound email forwarding | global |
| Cal.com Inc. | Meeting booking infrastructure (strategy-call event) | US (DPF) |
| Google LLC (Analytics) | GA4 measurement (loaded on consent only) | US/EU (DPF) |
| Google LLC (Search Console) | Search-console verification only | US (DPF) |
| Microsoft Corporation (Bing Webmaster) | Search-console verification only | US (DPF) |
| ImprovMX | Backup MX (inbound failover) | EU |
| Postmark (ActiveCampaign) | DMARC report aggregation | US |

## How to use

When a client requests a DPA, Aman drafts a custom DPA from this template with the specifics of the engagement filled in. Danish (CLO) reviews. Both parties sign electronically.

Last updated 5 May 2026.
