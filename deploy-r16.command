#!/bin/zsh --login
# Tamazia · Round 16 deploy (overhaul wave: engine law-accuracy + crawler, render B/C/D, pricing 3-routes).
# Fixes the stale paths/account in deploy-tamazia-r14.command. Double-click to run.
#
# ONE-TIME: this needs your Cloudflare Pages API token. Either:
#   (a) export CLOUDFLARE_API_TOKEN=... in your ~/.zshrc, OR
#   (b) run:  CLOUDFLARE_API_TOKEN=xxxxxxxx ./deploy-r16.command
set -e

SITE_DIR="/Users/amanigga/Desktop/TAMAZIA-REBUILD/tamazia-website"   # the REAL site (r14's 03-Astro-Site is stale)
BUILD_DIR="/tmp/cfdeploy_r16"
export PATH="/Users/amanigga/Desktop/TAMAZIA-REBUILD/_tools/node/bin:$PATH"
cd "$SITE_DIR"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "✘ CLOUDFLARE_API_TOKEN is not set. Set it in ~/.zshrc or prefix this command. Aborting."; exit 1
fi
unset CLOUDFLARE_ACCOUNT_ID   # r14's hard-coded 4a3b271b… is STALE; let wrangler use the token's own account (78c794…)

echo "▸ Building Astro site (regenerates dist/audit/* from public/audit/*)…"
npm run build 2>&1 | tail -3
[ -f patch-dist.js ] && node patch-dist.js >/dev/null 2>&1 || true

echo "▸ KV cross-account workaround (comment the FORM_SUBMISSIONS namespace for the deploy only)…"
cp wrangler.toml /tmp/wrangler.r16.bak
sed -i '' 's/^\[\[kv_namespaces\]\]/# [[kv_namespaces]]/; s/^binding = "FORM_SUBMISSIONS"/# binding = "FORM_SUBMISSIONS"/; s/^id = "7c7537a8d5ad444491a92aa16c4abce0"/# id = "7c7537a8d5ad444491a92aa16c4abce0"/' wrangler.toml

echo "▸ Staging dist + compiling Pages Functions → _worker.js (advanced mode)…"
rm -rf "$BUILD_DIR" && mkdir -p "$BUILD_DIR"
cp -r "$SITE_DIR/dist/." "$BUILD_DIR/"
cp -r "$SITE_DIR/functions" "$BUILD_DIR/functions"
npx wrangler pages functions build "$SITE_DIR/functions" --outdir="$BUILD_DIR/_wb" --project-directory="$BUILD_DIR"
cp "$BUILD_DIR/_wb/index.js" "$BUILD_DIR/_worker.js"
rm -rf "$BUILD_DIR/_wb" "$BUILD_DIR/functions"

echo "▸ Deploying to Cloudflare Pages (project tamazia-website, branch main)…"
npx wrangler pages deploy "$BUILD_DIR" \
  --project-name=tamazia-website --branch=main --no-bundle \
  --commit-message="overhaul: engine law-accuracy+crawler, render B/C/D, pricing 3-routes (r16)"

echo "▸ Restoring wrangler.toml (KV namespace)…"
cp /tmp/wrangler.r16.bak wrangler.toml

echo ""
echo "✓ Deploy complete. The 5 audit links now render the new B/C/D experience:"
echo "  https://tamazia.co.uk/audit/mishcon-de-reya/…  (+ harley, monzo, knight-frank, gymshark)"
read -p "Press Enter to close…"
