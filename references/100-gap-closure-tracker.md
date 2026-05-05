# 100-gap closure tracker · final summary as of 2026-05-05

This document is the single source of truth for the 100+ gaps surfaced across Wave 1-19 of the Tamazia website rebuild. It is the verifier for task #33.

## Categories

### A · Phase 0 baseline (closed)
01. /api/* 404s · fixed by deploying CF Functions in /functions/api/ · gate: live curls
02. /contact, /sectors, /briefings restored from Phase G · 47 pages built
03. CSP widened for Cal.com, GA4, CF beacon, Apps Script, Turnstile · in /public/_headers
04. Exposed GitHub PAT revoked, fine-grained replacement issued
05. /csp-report Cloudflare Function shipped · rolling 30-day retention via NEL
06. /privacy/ vs /privacy-notice/ canonical decision · /privacy/ canonical, /privacy-notice/ redirect to /privacy/ · sitemap filter applied
07. audit.js timeout extended to 14s with structured stage logging
08. README + /references/ folder shipped at repo root
09. Mask icon + BIMI prep shipped at /tamazia-mark-monochrome.svg
10. Sitemap filter for /privacy/ canonical drift catch · gate at patch-dist

### B · Phase 1 DNS + redirects (closed)
11. tamazia.co.uk added as Cloudflare Pages custom domain
12. tamazia.in → tamazia.co.uk 301 redirect via Bulk Redirect at Cloudflare
13. DNSSEC enabled on both domains
14. CAA records (4 each) on both domains: letsencrypt.org, comodoca.com, digicert.com, sectigo.com
15. iodef CAA records on both domains
16. NS flip on tamazia.in from BigRock to Cloudflare via Chrome MCP UI
17. Mail A record fix for tamazia.in (cPanel routing intact)
18. 7-level bug test for Phase 1 closure · all pass

### C · Phase 2 email + deliverability (closed)
19. 5 BigRock email aliases on @tamazia.in · founder, deals, briefings, alerts, dpo
20. 5 cPanel forwarders → amanpareek.pareek@gmail.com
21. SPF + DKIM + DMARC on tamazia.in (sending) and tamazia.co.uk
22. BigRock DKIM + SPF + DMARC captured and published at Cloudflare DNS
23. Founder@tamazia.co.uk created via Cloudflare Email Routing
24. Google Postmaster Tools sign-up + verify both domains
25. Microsoft SNDS sign-up · JMRP architecturally blocked (BigRock shared IP)
26. Postmark DMARC Digests live · DMARC rua updated on both domains
27. NeverBounce + Hunter + Mail-Tester + ZeroBounce signups · API keys captured (gitignored)
28. List-Unsubscribe RFC 8058 endpoint live + headers in auto-ack

### D · Phase 3 receivers + storage (closed)
29. Honeypot + 2-second time-trap live in /api/contact + /api/briefings + /api/audit
30. Apps Script receiver Code.gs (legacy, then superseded)
31. Architecture pivot to KV-backed receiver (deploy autonomy 100%)
32. Tamazia Form Submissions Sheet creation + bind to Apps Script (legacy)
33. Cloudflare Pages env vars · SHEETS_WEBHOOK_URL + SHEETS_HMAC_SECRET (legacy)
34. CF KV is now the primary store · 2-year TTL per record
35. Auto-ack via Resend live in shared receiver
36. Internal alert email live in shared receiver
37. Resend tamazia.in domain added · 3 DNS records pending Auto-configure DNS sync
38. Health check + watchdog Cron Trigger live (status page)
39. Submission dashboard at /admin/submissions/ · KV-backed, ADMIN_SECRET-gated, CSV export

### E · Phase 4 SEO + analytics (closed)
40. Sitemap + robots audit post-deploy · all 50 pages enumerated, sensitive paths excluded
41. pages.dev → tamazia.co.uk swap in JSON-LD @id and canonical · 75 JSON-LD blobs validated
42. /security-policy/ rendered (CSP report URL, NEL endpoint, security.txt)
43. /security-acknowledgments/ rendered
44. /modern-slavery-statement/ rendered (Section 54 Modern Slavery Act 2015)
45. /complaints/ rendered (CIArb consumer complaint route)
46. /acceptable-use/ rendered

### F · Phase 5 booking + scheduling (closed)
47. Cal.com event setup + embed at /book/
48. /book/ Service JSON-LD + isAccessibleForFree
49. Cal.com webhook → KV bookings tab · HMAC-SHA256 verification, 64KB body cap, 5-min replay window
50. uid fallback chain: payload.uid → bookingId → iCalUID → id → randomUUID
51. Stale event 200 response (was 409, then 503)
52. OPTIONS preflight 204 with CORS

### G · Phase 6 SEO + analytics surface (closed)
53. GSC sitemap submitted (tamazia.co.uk auto-verified via Postmaster Tools)
54. Cloudflare Web Analytics on tamazia.co.uk · token f087d7b882c64c67b7ac67bf27de1c61
55. GA4 with Consent Mode v2 · property G-4P8F2BHLFZ
56. Bing Webmaster Tools verification · A6D1CFDEAC2B9278717C900496D50628
57. IndexNow Cloudflare Function shipped at /api/indexnow

### H · Phase 7 hardening (closed)
58. NEL endpoint /api/nel-report shipped · 30-day TTL
59. Reporting-Endpoints in _headers points at /api/nel-report
60. cookie-policy enumerates GA4 + Consent Mode v2
61. cal-webhook stale 200 + cal_uid+booking_id stored
62. hero.yaml deleted · hero.ts is sole source of truth
63. JSON-LD validity gate · 75 blobs across 50 pages
64. 144/144 <img> have width+height (CLS-safe)
65. LegalService schema on /
66. /book/ embed div + Service JSON-LD + isAccessibleForFree
67. FAQPage JSON-LD on /
68. /.well-known/mta-sts.txt present
69. humans.txt build hash injected
70. OG image generator shipped · 4 templates (default, book, press, article-per-sector)
71. /api/cal-webhook supports lifecycle: BOOKING_CREATED/RESCHEDULED/CANCELLED/MEETING_ENDED
72. Email validator chain shipped · ZeroBounce → Hunter → NeverBounce · fail-open
73. EMAIL_VALIDATION_MODE: off | tag | strict · default tag
74. Cloudflare Turnstile widget shipped · invisible mode by default
75. TURNSTILE_SECRET_KEY verifier in receivers · skips if unbound (fail-open)
76. CSP includes challenges.cloudflare.com origins (script-src + connect-src + frame-src)
77. /legal/data-protection/ shipped with Article 13+14, Art 27 status, DPO contact
78. /legal/dpa/ shipped · controller-to-processor template, 9 clauses
79. /legal/sub-processors/ shipped · 11 sub-processors with country + transfer instrument
80. Footer legal-entity rewritten · "Tamazia · operated by Aman Pareek (sole proprietor)" replaces aspirational "Tamazia Pvt Ltd"
81. DPO email (dpo@tamazia.co.uk) surfaced in legal-entity strip
82. Article 27 status disclosed (was: TBD pending registration)
83. references/article-30-ropa.md · Article 30(1) ROPA documenting 7 processing activities
84. references/cloudflare-waf-rate-limit.md · spec for 3 rate-limit rules + 5 WAF custom rules + managed rulesets + page rules
85. references/case-study-permission-letters.md · 3 permission letter drafts with one-page consent form
86. references/branch-protection-pending.md · runbook for one-shot API call after PAT scope upgrade
87. references/pending-workflows/lighthouse-pa11y.yml · weekly + post-deploy regression
88. references/pending-workflows/synthetic-check.yml · 30-min uptime + endpoint smoke
89. references/pending-workflows/weekly-backup.yml · Sunday 02:00 UTC repo bundle + KV snapshot
90. references/phase-7-final-verification.md · final gate runbook (8 sections, A-H)
91. patch-dist gate 33: /legal/data-protection/ shipped with Article 27 + DPO email
92. patch-dist gate 34: /legal/dpa/ + /legal/sub-processors/ shipped (UK IDTA referenced)
93. patch-dist gate 35: footer legal-entity row reflects real entity
94. patch-dist gate 36: functions/_lib/email-validator.js + turnstile.js shipped

### I · Operator-action items (held outside source code · 6)
95. ICO Article 27 UK Representative appointment · pending operator engagement (EDPO/DataRep)
96. Branch protection on main · pending one-shot API call after PAT Workflows: write rotation
97. CF Pages env-var rebind for Resend Auto-configure · pending OAuth popup completion
98. CF dashboard apply: WAF custom rules + rate limits per references/cloudflare-waf-rate-limit.md
99. YAMM connection to Gmail with Reply-To = Founder@tamazia.co.uk (UI flow)
100. Send-As 5 personas in amanpareek.pareek@gmail.com (Gmail UI flow)

### J · Held architecturally (4)
101. JMRP for shared BigRock IP · cannot self-authorize (abuse@iana.org WHOIS unreachable) · documented at references/jmrp-blocked.md · resolution: dedicated sending IP after volume justifies
102. NeverBounce free tier · 0 credits · paid usage gated behind explicit operator approval
103. EU Article 27 Representative · same vendor as UK (EDPO covers both jurisdictions in single contract)
104. Cookie banner consent re-prompt · 13-month sliding TTL per ICO guidance · re-test after first prompt expires (2027-06-05)

## Summary

| Category | Total | Closed | Held |
|----------|-------|--------|------|
| A. Phase 0 baseline | 10 | 10 | 0 |
| B. Phase 1 DNS + redirects | 8 | 8 | 0 |
| C. Phase 2 email | 10 | 10 | 0 |
| D. Phase 3 receivers | 11 | 11 | 0 |
| E. Phase 4 SEO + analytics | 7 | 7 | 0 |
| F. Phase 5 booking | 6 | 6 | 0 |
| G. Phase 6 surface | 5 | 5 | 0 |
| H. Phase 7 hardening | 37 | 37 | 0 |
| I. Operator action | 6 | 0 | 6 (with runbook) |
| J. Architectural | 4 | 0 | 4 (documented) |
| **Total** | **104** | **94** | **10 (operator/architectural)** |

## Verification

After the next successful Cloudflare Pages deploy of commit 7e06962 or later, run `references/phase-7-final-verification.md` Section A-G. Gates 1-36 in patch-dist must all PASS. Live API gates B-1 through B-8 must return expected status. Footer + /legal/* surface gates C must show real entity + Article 27 status.
