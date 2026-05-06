# Changelog

All notable changes to Tamazia Pvt Ltd's website. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Phase 12 (in progress) · receivers polish (composite match, retry queue, reverse index, server-side request_id), admin overhaul (sort, mobile, formula guard, cursor pagination), Cal.com 5 event types + per-sector pages + consent gating, audit.js refactor, CSP nonce migration via Worker, a11y hardening (manifest, alt audit, lang gate), patch-dist gates 111-130.

## [1.0.0-phase-11] · 2026-05-05

### Added
- Phase 0-11 closure across 11 phases, ~140 tasks completed in code.
- 110 patch-dist build-time gates green.
- 13 API endpoints + 4 utility libraries.
- 53 pages (Astro static).
- 7 /legal/ + 5 statutory pages with Tamazia Pvt Ltd entity disclosure.
- HSTS preload + CSP + COOP/COEP/CORP + Permissions-Policy.
- Cookie banner Consent Mode v2 with explicit Reject (UK ICO equal-prominence).
- /api/dsar /api/erase /api/portability (UK GDPR Art 15/17/20).
- Email validator chain (ZeroBounce → Hunter → NeverBounce).
- Cloudflare Turnstile widget + server-side verifier.
- HMAC-SHA256 token signer (functions/_lib/dsar-token.js).
- RFC 4180 CSV utility (functions/_lib/csv.js).
- skip-to-main link, prefers-reduced-motion, prefers-contrast, forced-colors.
- /security.txt with security@ alias + 540-day Expires.

### Changed
- Tamazia Pvt Ltd entity restored (was: sole proprietor downgrade in Wave 19h).
- /admin/submissions/ login form replaces prompt(); X-Admin-Secret header-only.
- Cal.com webhook lifecycle from 4 to 11 events.
- Cal.com webhook KV bidirectional indexes.
- /api/health public minimal + admin-detailed (X-Admin-Secret gated).
- /admin/submissions/ ARIA grid + 200ms debounce + UTF-8 BOM CSV.

### Removed
- ABA membership references (7 source files) pending verification.
- Aspirational Pvt Ltd placeholder (now real entity).
- /admin/submissions/ URL ?key= path (CDN log leak fix).

### Fixed
- /api/erase parallel deletion + reverse index sweep + LEGAL_HOLD env flag.
- /api/portability filenameHash double-compute bug.
- /api/dsar _kv_key field leak (now explicit allowlist).
- Audit-log key entropy 32-bit → 64-bit.
- /admin/* _headers Content-Type:text/plain that broke HTML rendering.

### Security
- 110 patch-dist gates verify static surfaces.
- /api/admin-submissions per-access audit log to admin-access: KV.
- /api/list-unsubscribe HMAC-signed tokens (RFC 8058 + GET/POST).
- Body-size caps on all KV-writing endpoints.
- Honeypot fields + 30-min time-trap upper bound.
- email-bookings: reverse index for O(1) erasure of bookings by email.

## [Earlier]
See git log.
