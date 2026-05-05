# Article 30 UK GDPR · Records of Processing Activities

Maintained by: Aman Pareek, Data Controller. Last reviewed 5 May 2026.

This document is the controller's record of processing activities under Article 30(1) UK GDPR. It is not published. A copy is provided to a supervisory authority on request under Article 30(4).

## 1 · Contact form receiver

| Field | Value |
|-------|-------|
| Purpose | Receipt of business enquiries from prospective clients |
| Controller | Aman Pareek (sole proprietor), trading as Tamazia, India |
| DPO contact | dpo@tamazia.co.uk |
| Categories of data subjects | Visitors to tamazia.co.uk who submit the form |
| Categories of personal data | Name, email, company, role, country, message text, request ID, truncated IP, country derived from IP, user agent, referer |
| Recipients | Aman Pareek (alert email), Cloudflare KV (storage), Resend (auto-acknowledgement), ZeroBounce/Hunter/NeverBounce (validation) |
| International transfers | Cloudflare and Resend (US) under UK IDTA + EU SCC; ZeroBounce/NeverBounce (US) under UK IDTA + EU SCC; Hunter (FR) within EEA |
| Retention | 24 months in KV, then auto-delete by TTL |
| Technical and organisational measures | TLS 1.2+, HMAC verification on webhooks, honeypot + 2-second time trap, rate limiting at the edge, IP truncation before persistence, optional Turnstile invisible challenge, optional email validator (off/tag/strict modes) |
| Lawful basis | Article 6(1)(b) where contract steps are requested; Article 6(1)(f) for general business enquiries |

## 2 · Briefings list

| Field | Value |
|-------|-------|
| Purpose | Quarterly regulatory briefing newsletter |
| Categories of data subjects | Visitors who subscribe via the footer briefings form |
| Categories of personal data | Email address, request ID, truncated IP, country, opt-in timestamp, unsubscribe timestamp |
| Recipients | Cloudflare KV, Resend (transactional ack only — newsletters not sent until volume justifies) |
| Retention | Active subscription + 13 months after unsubscribe (evidence of consent withdrawal) |
| Lawful basis | Article 6(1)(a) consent; PECR Reg 22 soft-opt-in not relied on |
| Withdrawal | One-click unsubscribe via List-Unsubscribe header (RFC 8058) and per-email link |

## 3 · Audit form

| Field | Value |
|-------|-------|
| Purpose | Free SEO audit for prospective clients |
| Categories of personal data | URL submitted (may identify a business), email, company, country, request ID, IP truncated, audit results |
| Retention | 24 months in KV |
| Lawful basis | Article 6(1)(b) — pre-contractual measure at the data subject's request |

## 4 · Booking and meeting management

| Field | Value |
|-------|-------|
| Purpose | Schedule strategy calls and discovery meetings |
| Categories of personal data | Name, email, scheduling preferences, meeting notes, recording where consented |
| Recipients | Cal.com (US/DE), Cloudflare KV (booking metadata), Aman Pareek (host) |
| Retention | Engagement + 7 years for tax records |
| Lawful basis | Article 6(1)(b) |

## 5 · NEL + CSP violation reports

| Field | Value |
|-------|-------|
| Purpose | Browser-reported network errors and CSP violations for security monitoring |
| Categories of personal data | Truncated IP, user agent, the URL on which the error occurred |
| Recipients | Cloudflare KV |
| Retention | 30 days then TTL |
| Lawful basis | Article 6(1)(f) legitimate interest in network security |

## 6 · Outbound research-led contact

| Field | Value |
|-------|-------|
| Purpose | Cold outreach to senior commercial decision-makers within target sectors |
| Categories of personal data | Public-register name, business email, role title, employer, business country, recorded LinkedIn handle, public statements relevant to the outreach context |
| Recipients | Aman Pareek; Apollo / ZoomInfo / Hunter / Common Room as enrichment sources |
| International transfers | Apollo, ZoomInfo (US) under UK IDTA + EU SCC; Hunter (FR) within EEA |
| Retention | 36 months from last interaction |
| Lawful basis | Article 6(1)(f) legitimate interest in B2B prospecting; balanced against the data subject's reasonable expectation given the role title; Article 21 right to object honoured at first request |
| Article 14 disclosure | Provided in the email signature line of every outbound message and at /legal/data-protection/ |
| Marketing channel | Email only; PECR Reg 22 not relied on (recipient is a corporate subscriber) |

## 7 · Form Submissions admin dashboard

| Field | Value |
|-------|-------|
| Purpose | Operator review of inbound enquiries |
| Recipients | Aman Pareek (sole proprietor) only — not shared |
| Authentication | Cloudflare Access OR ADMIN_SECRET (to migrate to CF Access in Sprint C) |
| Retention | Same as source data |
| Logging | Each request to /api/admin-submissions logged with truncated IP and timestamp |
