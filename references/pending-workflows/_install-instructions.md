# Pending workflow files · install instructions

These three workflow YAMLs cannot be pushed by the current fine-grained PAT (no `workflow` scope). They live here in `references/pending-workflows/` until either the PAT is rotated with `Workflows: write` permission OR they are committed via the GitHub web UI directly (file → add new → paste).

## Files

| File | Purpose | Closes task |
|------|---------|-------------|
| `lighthouse-pa11y.yml` | Weekly + post-deploy Lighthouse + Pa11y baseline | #43 |
| `synthetic-check.yml` | Every-30-min post-deploy uptime + endpoint smoke | #35 |
| `weekly-backup.yml` | Sunday 02:00 UTC repo bundle + KV snapshots | #41 |

## Install via GitHub web UI (no PAT change required)

1. Go to https://github.com/Tamaziaa/tamazia-website/tree/main/.github/workflows
2. Click **Add file → Create new file**
3. Filename: `lighthouse-pa11y.yml` (or one of the others)
4. Paste contents from this folder
5. Commit message: "Wave 19j · post-deploy Lighthouse+Pa11y"
6. Branch: `main` · commit directly
7. Repeat for `synthetic-check.yml` and `weekly-backup.yml`

After all 3 are committed, run them once manually via Actions tab → workflow → Run workflow to seed initial data.

## Install via PAT rotation

1. Go to https://github.com/settings/personal-access-tokens
2. Edit the existing PAT or create new one with **Repository permissions → Workflows: Read and write**
3. From the sandbox: `git push` will then accept these files normally

After rotating, copy the three YAML files into `.github/workflows/`:
```
cp references/pending-workflows/{lighthouse-pa11y,synthetic-check,weekly-backup}.yml .github/workflows/
git add .github/workflows/{lighthouse-pa11y,synthetic-check,weekly-backup}.yml
git commit -m "Wave 19j · enable Lighthouse, synthetic, backup workflows"
git push
```
