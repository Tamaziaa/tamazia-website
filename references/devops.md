# DevOps Reference

## Path map · Mac vs Cowork sandbox

| Mac path | Cowork sandbox path |
|---|---|
| `/Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/` | `/sessions/<session>/mnt/Tamazia-Rebuild/03-Astro-Site/` (legacy nested copy, stale) |
| `https://github.com/Tamaziaa/tamazia-website` (cloned to `/tmp/tw-fresh`) | Canonical source for deploys |

The Mac local copy under `Tamazia-Rebuild/03-Astro-Site/` is divergent from GitHub `main`. It was the local working dir during the original rebuild. Today the source of truth is the GitHub repo. Mac local can be ignored or sync'd via `git pull` from a fresh clone.

## Common Mac issues

### Stuck git index.lock

If git operations hang on Mac:

```sh
rm -f ~/Desktop/Tamazia-Rebuild/03-Astro-Site/.git/index.lock
```

A persistent zsh alias:

```sh
echo "alias unstuck='rm -f ~/Desktop/Tamazia-Rebuild/03-Astro-Site/.git/index.lock'" >> ~/.zshrc
source ~/.zshrc
```

### Permission denied on certain files

Some files in the Mac mount have restrictive permissions visible to Cowork sandbox. Use `chmod -R u+rw` to lift if needed.

## GitHub Actions deploy

All deploys go via `.github/workflows/deploy.yml`. Never use the legacy `deploy-tamazia-r14.command` shell script · it is not maintained and uses an older 6-step pipeline.

## Local dev server

```sh
cd /tmp/tw-fresh # or wherever the repo is cloned
npm install
npm run dev
```

Astro dev server runs on localhost:4321. Note: `_headers` and `_redirects` do NOT apply locally (Cloudflare-only). Use a preview deploy to test those.
