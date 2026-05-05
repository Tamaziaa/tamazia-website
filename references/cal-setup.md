# Cal.com Setup · 30-min Strategy Call

Phase 5 · auto-driven 2026-05-04 by Cowork session via Chrome MCP.

## Account

- Account: `founder@tamazia.co.uk` (verified via Cloudflare Email Routing catch-all → amanpareek.pareek@gmail.com).
- Username slug: `tamazia` → public profile lives at `https://cal.com/tamazia`.
- Display name: `Aman Pareek`.
- Plan: Free (sufficient through Phase 7; upgrade to Teams only if a second host is added).

## Event type · 30-min Strategy Call

| Field | Value |
|---|---|
| ID | `5590717` |
| Title | `30-min Strategy Call` |
| Slug | `strategy-call` |
| Public URL | `https://cal.com/tamazia/strategy-call` |
| Duration | 30 minutes |
| Description | "Direct line to Aman Pareek, founder of Tamazia. 30 minutes. We map your growth picture, the scope of work that fits, and the shape of an engagement. No deck, no sales motion. Bring the question that is keeping you up at night." |
| Location | Cal Video (default) |
| Active | Yes |

## Embed location

- Page: `/book/` (`src/pages/book.astro`).
- Style: HTML iframe inline embed.
- Element: `<div id="my-cal-inline-strategy-call">`.
- Brand colour (light): `#5A1A2B` (Tamazia burgundy).
- Brand colour (dark): `#C9A772` (Tamazia gold).
- Layout: Month view.
- Hide event-type details: false.

The site nav and CTAs across `/contact`, `/services`, `/case-studies`, and the hero band link to `/book/`.

## Webhook · booking lifecycle

Configured at Cal.com → Event Types → 30-min Strategy Call → Webhooks.

| Field | Value |
|---|---|
| Subscriber URL | `https://tamazia.co.uk/api/cal-webhook` |
| Status | Enabled |
| Triggers | `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED` |
| Payload version | `2021-10-20` |
| Secret | `CAL_WEBHOOK_SECRET` (HMAC-SHA256, configured at Cloudflare Pages env var; matching value held in Cal.com webhook config) |

## Function · `functions/api/cal-webhook.js`

Verifies `x-cal-signature-256` (HMAC-SHA256 of raw body using `CAL_WEBHOOK_SECRET`) before any side effects. On valid signature:

1. Parses payload, extracts attendee and booking metadata.
2. Idempotently writes `bookings:cal:<uid>` to KV namespace `FORM_SUBMISSIONS` with 2-year TTL (matches contact-form retention).
3. Allows `BOOKING_RESCHEDULED` and `BOOKING_CANCELLED` to overwrite the existing record (same uid, lifecycle update).
4. Fires fire-and-forget Resend alert to `ALERT_TO` for visibility.
5. Returns 200 with `{ ok, request_id, event }`.

Failure modes returned:
- 401 if signature missing or mismatched.
- 400 if body is not valid JSON.
- 405 for non-POST methods.
- 503 if `CAL_WEBHOOK_SECRET` env var is unbound.

## Deploy-time wiring (Cloudflare Pages)

This requires a hands-on step from Aman because Cloudflare Pages env vars cannot be set programmatically by the deploy workflow on the current account split. From the Pages dashboard:

1. Pages → tamazia-website → Settings → Environment variables → Production.
2. Add `CAL_WEBHOOK_SECRET` with the value set at Cal.com.
3. Add `FORM_SUBMISSIONS` KV binding (already documented in `_pending-cross-account-fix.md`).
4. Trigger a new deploy.

Until the env var is bound, `/api/cal-webhook` returns 503 `webhook_secret_unbound` and Cal.com retries for up to 30 days.

## Verification · post-deploy smoke test

1. From Cal.com webhook config, click `Ping test` → expect 401 (test request lacks valid signature). That confirms the endpoint is alive and the signature gate works.
2. Book a real test slot at `https://tamazia.co.uk/book/`. Confirmation email arrives via Cal.com. Internal alert arrives via Resend within seconds.
3. Inspect the KV record at Cloudflare → Workers & Pages → KV → `FORM_SUBMISSIONS` → search `bookings:cal:` to see the persisted JSON.

## Source of truth

Last updated 2026-05-04 by Cowork session.
