# Workflow PAT Rotation · Unblock 4 staged GitHub Actions workflows

Phase 0 carry-over.

## What this unblocks

Four workflow files are staged at `references/_pending-workflow-changes/`:
- `codeql.yml` — CodeQL static analysis on PR + weekly scan
- `lighthouse-pa11y.yml` — Lighthouse 90+ floor + Pa11y WCAG 2.1 AA gate
- `synthetic-check.yml` — post-deploy curl probe of /, /book/, /contact/, /api/health
- `weekly-backup.yml` — git bundle to GitHub Release every Sunday, 26-week retention

These cannot push from Cowork because the deploy bot's PAT lacks `workflow` scope.

## Procedure (5 minutes)

1. Open https://github.com/settings/tokens
2. Locate the `Tamazia-deploy-bot` PAT (created when GitHub Actions deploy was set up)
3. Click `Edit` → check the `workflow` scope (under `repo`)
4. Click `Update`
5. Open https://github.com/Tamaziaa/tamazia-website/settings/secrets/actions
6. Paste the unchanged token into `GH_DEPLOY_PAT` secret
7. Tell me you've done it. I push the 4 workflow files in one commit.

## Why two-step

GitHub PATs are immutable string values. Editing scope keeps the token value the same — the secret in Pages doesn't need updating. But the act of PAT update may take 60 seconds to propagate through GitHub's auth cache.

## Verification

After I push, all 4 workflows appear at https://github.com/Tamaziaa/tamazia-website/actions and run on the next push to main.

Last updated 2026-05-04.
