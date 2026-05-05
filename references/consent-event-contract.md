# `tamazia:consent` event contract

Phase 6 · documented 2026-05-04.

## Schema

The `tamazia:consent` CustomEvent is dispatched on `window` whenever the cookie banner Accept or Reject button is clicked.

```ts
interface TamaziaConsentEvent extends CustomEvent {
  detail: {
    decision: 'granted' | 'denied';
    analytics: boolean;  // true if user accepted analytics
  };
}
```

## Storage

Persisted to `localStorage` under key `tamazia-cookie-consent`:

```json
{
  "v": 2,
  "analytics": true,
  "ad": false,
  "ts": 1746312345678
}
```

- `v` — schema version. Migration logic accepts legacy `'granted'`/`'denied'` strings and promotes silently.
- `analytics` — analytics_storage consent.
- `ad` — ad_storage consent. Permanently false per founder decision (no paid ads currently).
- `ts` — Date.now() timestamp at consent. Used for ICO 13-month sliding expiry.

## Consumers

Currently no internal consumers. The event exists so future plugins can react to consent without re-implementing localStorage parsing. New consumers MUST be listed here.

## Force re-consent

For QA, `?force-reconsent=1` query param clears `tamazia-cookie-consent` and reloads. Implemented in BaseLayout.

Last updated 2026-05-04.
