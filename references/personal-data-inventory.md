# Personal data inventory · Tamazia Pvt Ltd

This document inventories every field of personal data stored across Tamazia systems.
Maintained by the Data Controller. Reviewed quarterly. UK GDPR Article 30 record of processing.

## Inventory

### 1 · Cloudflare KV `FORM_SUBMISSIONS` namespace

| Field | Source | Type | Lawful basis | Retention |
|---|---|---|---|---|
| email | form input | identification | Art 6(1)(b)/(f) | 24 months |
| name | form input | identification | Art 6(1)(b)/(f) | 24 months |
| company | form input | employment | Art 6(1)(b)/(f) | 24 months |
| role | form input | employment | Art 6(1)(b)/(f) | 24 months |
| country | form input | identification | Art 6(1)(b)/(f) | 24 months |
| intent_text | form input | message content | Art 6(1)(b)/(f) | 24 months |
| ip_country | CF header | technical | Art 6(1)(f) security | 24 months |
| ip_truncated | CF header (last octet redacted) | technical | Art 6(1)(f) security | 24 months |
| ua | request header | technical | Art 6(1)(f) security | 24 months |
| referer | request header | technical | Art 6(1)(f) attribution | 24 months |
| utm_source / utm_medium / utm_campaign | form input | marketing | Art 6(1)(f) attribution | 24 months |
| email_validation | server-derived | data quality | Art 6(1)(f) | 24 months |
| request_id | server-generated | identifier | Art 6(1)(f) | 24 months |
| submitted_at | server-stamp | timestamp | Art 6(1)(f) | 24 months |

### 2 · Cloudflare KV `bookings:` namespace

| Field | Source | Type | Lawful basis | Retention |
|---|---|---|---|---|
| cal_uid + cal_booking_id + cal_ical_uid | Cal.com webhook | identifier | Art 6(1)(b) | 24 months · 7yr for tax |
| cal_event_type | Cal.com payload | service info | Art 6(1)(b) | 24 months |
| cal_start_time + cal_end_time | Cal.com payload | timestamp | Art 6(1)(b) | 24 months |
| attendees[].name | Cal.com payload | identification | Art 6(1)(b) | 24 months |
| attendees[].email | Cal.com payload | identification | Art 6(1)(b) | 24 months |
| notes | Cal.com payload (smart-truncated) | message content | Art 6(1)(b) | 24 months |

### 3 · Cloudflare KV audit-log namespaces

| Namespace | Purpose | PII | Retention |
|---|---|---|---|
| admin-access: | per-access log of /api/admin-submissions | IP truncated, UA, tab | 1 year |
| erase-log: | UK GDPR Art 17 evidence | email_hash 64-bit, count, timestamp | 7 years |
| unsub-log: | List-Unsubscribe evidence | email_hash, request_id, method | 13 months |
| csp: | CSP violation reports | none beyond CF normal | 30 days |
| nel: | Network Error Logging | IP truncated | 30 days |
| indexnow-daily: | rate-limit counter | none | 36 hours |

### 4 · Reverse indexes (no additional PII)

| Namespace | Maps from | Maps to | Retention |
|---|---|---|---|
| cal-uid: | Cal.com uid | bookings: KV key | 24 months |
| cal-bid: | Cal.com bookingId | bookings: KV key | 24 months |
| cal-ical: | Cal.com iCalUID | bookings: KV key | 24 months |
| email-bookings: | email | list of bookings: KV keys | 24 months |

### 5 · Resend (transactional email vendor)

Recipients of transactional email · email address stored on Resend's side per their privacy policy.

### 6 · Cal.com (booking platform)

Attendee name, email, time zone stored on Cal.com side. Tamazia receives via webhook.

### 7 · GA4 (consent-gated)

User pseudonymous identifier (_ga cookie) + page_view events. Consent-gated. Data lives in GA4 property.

### 8 · Cloudflare Web Analytics (cookieless)

Aggregate traffic patterns. No personal data per Cloudflare's privacy posture.

## Subject access request response template

When DSAR is fired, /api/dsar searches namespaces 1, 2, and the 4 reverse indexes for matching email. Returns JSON to data subject.

When erasure is fired, /api/erase deletes from namespaces 1, 2, and Phase-2-sweep reverse indexes. Audit log entry persists in namespace 3 (erase-log) for 7 years.

## Review cadence

Quarterly review. Last reviewed: 2026-05-05. Next review: 2026-08-05.
