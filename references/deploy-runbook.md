# Deploy Runbook

## How deploys work

`git push origin main` triggers `.github/workflows/deploy.yml`. The workflow runs:

1. `npm ci` · install dependencies from package-lock.json.
2. `npm run build` · Astro builds dist/.
3. `node patch-dist.js` · injects tgcs-master.css into dist/index.html and runs 14 brand-register verification checks across all dist HTML files. Exits non-zero on any failure, aborting the deploy.
4. `npx wrangler pages functions build` · compiles `functions/api/*.js` into `dist/_worker_build/index.js`.
5. `cp dist/_worker_build/index.js dist/_worker.js`.
6. `npx wrangler pages deploy dist/ --project-name=tamazia-website --branch=main` · ships to Cloudflare Pages.

Total time: ~50 seconds.

## Required GitHub Actions secrets

- `CF_API_TOKEN` · Cloudflare API token, scope: Pages deploy on the tamazia-website project.
- `CF_ACCOUNT_ID` · `4a3b271b5f1f4cbfc16c6e9e5e62451b`.

## Required Cloudflare Pages env vars

See [`env-vars.md`](env-vars.md).

## If a deploy fails

1. Open the failed run at `https://github.com/Tamaziaa/tamazia-website/actions`.
2. Click into the failed step. Most failures are at `Run patch-dist` · check the "FAIL" line for which check tripped.
3. Common patch-dist failures:
   - `12. British English · no inquiry` · grep source for `inquiry`, replace with `enquiry`.
   - `7. no Subscribe` · grep for any "Subscribe" CTA text, remove or rephrase.
   - `8. no pages.dev` · grep for hard-coded preview URLs in JSON-LD or canonical tags.
   - `13. no NYSE: CGON` · CGON ticker is Nasdaq, not NYSE.
   - `14. no Selected mandates` · phrase is "Verified mandates".
4. Fix in source, commit, push. The fix re-runs the workflow.

## Manual trigger

If no commit is needed but you want to redeploy:
1. https://github.com/Tamaziaa/tamazia-website/actions/workflows/deploy.yml
2. Click "Run workflow" (top right).
3. Branch: main. Click "Run workflow".

## Rollback

Bad deploy in production:
1. `git revert <bad-commit-sha>` and push. Workflow auto-deploys the revert.
2. Or, in Cloudflare Pages dashboard → Deployments → find the last good one → "Rollback to this deployment".
