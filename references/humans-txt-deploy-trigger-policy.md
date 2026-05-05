# humans.txt.deploy-trigger · purpose and use

## Purpose
This file is a workaround used during periods when the GitHub Actions runner pool is stuck. Touching the file (`echo "$(date)" > public/humans.txt.deploy-trigger`) creates a content change that forces a fresh deploy push, but the file itself is gitignored so it doesn't pollute the repo.

## When to use
- Runner pool stuck for >10 minutes
- Need to force a redeploy without making a code change
- Want to refresh the humans.txt build hash without code change

## When not to use
- Production hot-fix (use a real commit instead)
- Routine deploys (push code change normally)

## Cleanup
The file is gitignored. It can be left in place locally; it never enters git.

## Phase 11 history
First created during Wave 19e to force-trigger queued runs. Documented in Wave 32.
