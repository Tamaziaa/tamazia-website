# Email Validators · API keys captured · 2026-05-05

Three free-tier email validators integrated. API keys held in `references/_secrets/email-validator-keys.txt` (gitignored).

| Service | Free tier | Key prefix | Purpose |
|---|---|---|---|
| **NeverBounce** | 0 credits initial · captcha-claim 1000 free | `private_72…ba59` | Pre-flight email validation in /api/contact, /api/briefings before persisting to KV |
| **Hunter** | 25 verifications/month free | `6c58…c18f` | Domain verification + email-finding for outbound prospecting |
| **ZeroBounce** | 5 credits free at signup, 100/month | `ed9e…9a86` | Master Key · email validation + scoring + email warmup |

## Wiring plan (Phase 7 follow-up)

- `/api/contact` and `/api/briefings`: pre-flight check via NeverBounce single-verify endpoint (low-volume, max 1000/month). On `invalid` or `disposable`, reject the form silently (HTTP 200 to avoid leaking validator presence).
- `/api/audit`: NeverBounce score ≥ 0.6 OR ZeroBounce status `valid` required.
- `/admin/funnels` Cowork artifact: surface validator status alongside KV records for ops visibility.
- Spam-mitigation 8-layer (task #30) lifts off this base.

## Bind these env vars at Cloudflare Pages Production when wiring lands

```
NEVERBOUNCE_API_KEY = (held in references/_secrets/email-validator-keys.txt)
HUNTER_API_KEY      = (held in references/_secrets/email-validator-keys.txt)
ZEROBOUNCE_API_KEY  = (held in references/_secrets/email-validator-keys.txt)
```

Last updated 2026-05-05.
