# Contributing to Tamazia website

## Workflow

1. Branch from `main`.
2. Implement the change.
3. Run `npm run build && node patch-dist.js` locally. All 50 gates must pass.
4. Run `node --check functions/api/*.js functions/_lib/*.js`. All must syntax-check.
5. Commit with Wave NN convention.
6. Push. CI runs build + patch-dist + wrangler deploy.

## Wave naming

- `Wave NN.X · <area> · <action>` — e.g. `Wave 20a · Phase 8 · Tamazia Pvt Ltd + DSAR endpoints`.

## Code review

Self-review until external contributors join. Critical changes (CSP, KV schema, /legal/ pages) require Founder sign-off.

## Style

- British English.
- No em dashes.
- No "Subscribe" customer-facing.
- Function size ≤200 lines (split if longer).
- Functions return JSON with `{ ok, request_id, ...specifics }` or `{ error, reason }`.
- All KV writes use `expirationTtl`. No infinite-retention writes.

## Testing

Local syntax check is the floor. Live verification via `references/phase-7-final-verification.md` after deploy.

## Sub-processor changes

Adding a new sub-processor (e.g. enabling a new SaaS) requires:
1. Update `src/data/sub-processors.json`.
2. Notify subscribers per Article 28(2) — 30-day advance notice.
3. Add to `references/article-30-ropa.md`.
4. Re-deploy.
