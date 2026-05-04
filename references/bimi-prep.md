# BIMI Preparation Reference

BIMI (Brand Indicators for Message Identification) shows the Tamazia logo
beside the sender name in Gmail, Yahoo, Apple Mail, Fastmail. Activates only
after DMARC reaches `p=reject` (Phase 2, day 60+).

## Pre-requisites

- DMARC at `p=quarantine pct=100` for at least 30 days, then `p=reject pct=100`.
- BIMI-compliant SVG Tiny PS logo (square, no scripts, no animations).
- Optional · VMC (Verified Mark Certificate) for Gmail's "verified blue tick".
  Costs ~£1300/year via DigiCert or Entrust. Skip until revenue justifies.

## SVG requirements (BIMI Tiny PS profile)

- Format: SVG 1.2 Tiny Portable Secure (PS).
- viewBox: must be square (e.g. `0 0 64 64`).
- No external references, no scripts, no animation, no text elements.
- Single colour or solid fill, no gradients in the strict spec (some
  validators tolerate gradients).
- Stripped of metadata, comments, hidden elements.
- File size: under 32KB (BIMI inspector recommendation).

## DNS records (when ready)

```
_bimi.tamazia.in. TXT "v=BIMI1; l=https://tamazia.co.uk/bimi-logo.svg;"
```

For VMC: add `; a=https://tamazia.co.uk/bimi.pem` (URL of VMC bundle).

## Validators

- https://bimigroup.org/bimi-generator/
- https://mxtoolbox.com/bimi.aspx
- Gmail does not honour BIMI without proper DMARC AND a verified record.
