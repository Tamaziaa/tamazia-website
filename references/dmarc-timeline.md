# DMARC Progression Timeline · Tamazia 2026

Founder decision recorded 2026-05-04. Both domains (tamazia.co.uk, tamazia.in) progress in lockstep.

## Stage 1 · Monitor only · 2026-05-04 → 2026-05-18

`v=DMARC1; p=none; rua=mailto:dmarc-reports@tamazia.co.uk, mailto:re+...@dmarc.postmarkapp.com`

Postmark DMARC Digests aggregate weekly. Acceptance criteria for promotion: zero failed-auth from legitimate Tamazia sending IPs across the 14-day window. Weekly review every Monday.

## Stage 2 · Quarantine · 2026-05-18 → 2026-06-17

`v=DMARC1; p=quarantine; pct=100; rua=...; ruf=...`

Failed-auth mail goes to recipient spam folder. 30-day window. Acceptance criteria for promotion: zero legitimate-sender quarantine reports in Postmark Digests.

## Stage 3 · Reject · 2026-06-17 onwards

`v=DMARC1; p=reject; pct=100; rua=...; ruf=...; sp=reject; adkim=s; aspf=s`

Failed-auth mail is bounced. Strict alignment for both DKIM and SPF.

## Calendar entries

- **2026-05-18** — promote .co.uk and .in to `p=quarantine`. Edit at Cloudflare DNS → tamazia.co.uk → `_dmarc` TXT and tamazia.in → `_dmarc` TXT.
- **2026-06-17** — promote both to `p=reject` if Stage 2 clean.

## Rollback procedure

If Postmark Digests reports a legitimate-sender failed-auth incident at any stage, immediately revert to the previous stage. Do NOT advance through stages without 14 clean days at each level.

## Source of truth

Postmark Digests: `https://dmarc.postmarkapp.com/digests` (Aman's account)
Stage progression decisions: this file. Every change requires a commit referencing this doc.

Last updated 2026-05-04.
