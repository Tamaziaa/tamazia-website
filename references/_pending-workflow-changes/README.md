# Pending Workflow Changes (need PAT with `workflow` scope)

The current GitHub PAT used for code pushes does not include the `workflow`
scope. This blocks modifications to `.github/workflows/*.yml`.

Two pending changes are queued in this folder until the PAT is upgraded:

1. `deploy.yml-post-deploy-check.txt` · post-deploy synthetic check that curls
   /api/contact /api/audit /api/briefings /api/health and fails the build on
   404. Catches silent function-deploy regressions.

2. `weekly-backup.yml` · Sunday 02:00 UTC cron that creates a release tag with
   a sources zip. Free, durable, restorable. No active maintenance needed.

## How to apply

Option A · upgrade the PAT scope at github.com/settings/tokens (add `workflow`
scope to the fine-grained token), then merge these into `.github/workflows/`.

Option B · paste the contents directly via the GitHub web editor at
github.com/Tamaziaa/tamazia-website. Use the "edit file" pencil for deploy.yml
and "Add file -> Create new file" for weekly-backup.yml.
