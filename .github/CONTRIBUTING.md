# Contributing to tamazia-website

This is a private repo. Tamazia team members and approved contractors only.

## Branch policy

`main` is protected. All work happens on a feature branch and merges through a pull request with at least one review. The deploy gate (`patch-dist.js`) must pass before merge.

## Commit conventions

- Subject line less than 60 characters
- Imperative mood ("Add", "Fix", not "Added", "Fixed")
- Body separated by blank line, hard-wrapped at 72
- No em-dashes (deploy gate enforces)
- No Indian regulators (deploy gate enforces · we operate UK/EU/UAE/US, not India domestic)

## Pre-flight check

Before pushing:

1. `npm run build` succeeds
2. `node patch-dist.js` 14 checks all green
3. `bash scripts/p3-bug-test.sh` against your preview deployment

## Sensitive material

Never commit secrets. `.env*` is in `.gitignore`. If you accidentally commit one, rotate it within 24 hours and force-push the branch with the secret removed.
