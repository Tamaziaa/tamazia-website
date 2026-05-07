# Legitimate Interest Assessment · B2B cold email · Wave 52

UK GDPR Article 6(1)(f) requires a documented Legitimate Interest Assessment
(LIA) for processing personal data on the basis of "legitimate interests"
without consent. This file is Tamazia's LIA for B2B cold outreach.

## Purpose test

**What is the legitimate interest?** Promoting Tamazia's regulatory compliance
and SEO services to UK and international businesses that face the specific
problems we solve (ICO compliance gaps, SRA transparency obligations, FCA
regulatory exposure, hospitality/healthcare/real estate sector compliance).

**Is the interest legitimate?** Yes. The ICO's own guidance (Direct Marketing
Code, July 2024) explicitly recognises B2B legitimate interest as a valid
lawful basis for sending unsolicited commercial communications to corporate
subscribers (registered companies, LLPs), provided the messaging is relevant
to the recipient's professional role.

## Necessity test

**Is the processing necessary?** Yes. Without contact data (email + role),
we cannot reach decision-makers at target organisations who may benefit
from our services. The only feasible alternative (mass advertising or
inbound-only) is materially less effective and would not enable us to
serve the target market.

**Could a less intrusive method work?** Inbound only (no cold outreach)
would not enable a UK-headquartered agency at our scale to reach senior
in-house counsel and operations leads at target firms. Cold outreach is
necessary.

## Balancing test

**Recipient impact:**
- Receiving an unsolicited but relevant B2B email at a corporate address
- Effort to opt out (one click via List-Unsubscribe header, or one-line reply)
- No further contact after opt-out (technical suppression list enforces)

**Mitigations:**
1. Targeted: only senior decision-makers at firms with documented relevance
2. Plain-text emails, no tracking pixels, no aggressive volumes
3. List-Unsubscribe header on every cold send (RFC 8058 compliant)
4. Opt-out honoured permanently via central KV-backed suppression list
5. Founder identity disclosed (Tamazia, IG11 7HZ London)
6. No personal email addresses targeted (gmail.com, hotmail.com, etc filtered out)
7. No targeting of sole traders or sub-5-employee firms (PECR sensitive)
8. ZeroBounce/NeverBounce pre-validation, no scattergun sending

**Recipient expectations:** Senior business decision-makers at registered
UK and international companies routinely receive B2B vendor outreach. The
expectation of receiving such emails at a corporate address is industry-standard.

**Conclusion:** Tamazia's legitimate interest in growing the business and
the recipient's reasonable expectation of receiving relevant B2B outreach,
combined with the technical mitigations above, make this lawful basis
appropriate. The balancing test favours processing.

## Records to maintain

For every cold-emailed recipient:
- Source of contact (Apollo, LinkedIn Sales Nav, Companies House, public website)
- Date contact data was acquired
- Lawful basis claimed (Article 6(1)(f) legitimate interests)
- Date of first contact
- Date of last contact
- Opt-out date if any

n8n maintains this audit log in Cloudflare KV alongside the suppression list.

## Review cadence

This LIA is reviewed every 12 months by founder@tamazia.co.uk. Next review:
2027-05-06.

## Document control

Version 1.0 · Author: Aman Pareek · 2026-05-06
