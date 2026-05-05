# Changelog

All notable changes to Tamazia website. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- README, CLAUDE.md, SECURITY.md, CONTRIBUTING.md, CHANGELOG.md at repo root.
- /api/dsar (UK GDPR Art 15), /api/erase (Art 17), /api/portability (Art 20).
- Confirmation pages: /erased/, /unsubscribed/, /dsar-confirm/.
- functions/_lib/dsar-token.js (HMAC-SHA256 signer).
- functions/_lib/email-validator.js (ZeroBounce → Hunter → NeverBounce chain).
- functions/_lib/turnstile.js (siteverify).
- /legal/data-protection/, /legal/dpa/, /legal/sub-processors/.
- Cloudflare Turnstile widget (TurnstileWidget.astro) + verifier.
- patch-dist gates expanded from 14 to 50.
- 7-level bug test runbook.

### Changed
- Tamazia Pvt Ltd entity restored throughout (was: sole proprietor in Wave 19h).
- /admin/submissions/ login form replaces prompt(); in-memory key only.
- Cal.com webhook lifecycle extended to 11 events.
- Cal.com webhook KV bidirectional indexes (cal-uid, cal-bid, cal-ical, email-bookings).
- Cookie banner v2 schema with 13-month sliding TTL.
- Footer legal-entity row includes DPO contact + Article 27 status.

### Deprecated
- Apps Script Code.gs receiver (architecturally retired in W8-1).

### Removed
- Aspirational Pvt Ltd from old footer placeholder.
- Bogus Content-Type: text/plain on /admin/* in _headers.

### Fixed
- /admin/* path block in _headers no longer breaks HTML rendering.
- Cookie banner v2 schema migration handles legacy 'granted'/'denied' string.
- Sitemap excludes /erased/, /unsubscribed/, /dsar-confirm/, /admin/, /api/.

### Security
- HSTS preload (max-age=63072000; includeSubDomains; preload).
- CSP report-to → /api/csp-report.
- NEL → /api/nel-report (5% sample, 30-day TTL).
- Permissions-Policy denies 26 features.
- COOP same-origin, COEP credentialless, CORP same-site.
- Body-size cap 64KB on all KV-writing endpoints.
- Email validator chain on all 3 receivers (contact, briefings, audit).
- Turnstile verification on all 3 receivers (off-by-default until site key set).

## [Phase 7 closure · 2026-05-04]
Wave 19g through 19j.

## [Phase 6 · 2026-05-04 13:07 UTC]
Wave 19c · Bing Webmaster verification baked.
Wave 19 · GA4 G-4P8F2BHLFZ + CF Web Analytics token.

## [Earlier]
See git log.
