## What this PR changes

(One-paragraph summary)

## Why

(One-paragraph rationale · link issues if any)

## Pre-flight checklist

- [ ] `npm run build` succeeds locally or in preview deploy
- [ ] `patch-dist.js` 14 checks all green in CI
- [ ] No secrets committed (no `.env*` in diff)
- [ ] No em-dashes (deploy gate enforces)
- [ ] No Indian regulators (deploy gate enforces)
- [ ] If touching `_headers`, CSP, or robots.txt, the change is documented in `references/`
- [ ] If touching `functions/api/`, the 14-level bug test still passes against preview
