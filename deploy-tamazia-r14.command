#!/bin/zsh --login
# Tamazia Round 14 deploy — double-click to run
# Builds the Astro site and deploys to Cloudflare Pages
# Uses zsh --login so ~/.zshrc / ~/.zprofile are sourced and node/npm are on PATH

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TAMAZIA · Round 14 Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  node: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "  npm:  $(npm --version 2>/dev/null || echo 'NOT FOUND')"
echo ""

SITE_DIR="$HOME/Desktop/Tamazia-Rebuild/03-Astro-Site"
BUILD_DIR="/tmp/cfdeploy"

echo "▸ Building Astro site..."
cd "$SITE_DIR"
npm run build 2>&1

echo ""
echo "▸ Patching dist/ with permanent CSS fixes..."
node "$SITE_DIR/patch-dist.js"

echo ""
echo "▸ Staging dist + functions for Cloudflare..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp -r "$SITE_DIR/dist/." "$BUILD_DIR/"
cp -r "$SITE_DIR/functions" "$BUILD_DIR/functions"

echo ""
echo "▸ Compiling Pages Functions to _worker.js..."
# wrangler pages deploy does NOT auto-compile functions/ for direct uploads.
# Must compile first, then copy to _worker.js, then deploy with --no-bundle.
npx wrangler pages functions build "$SITE_DIR/functions" \
  --outdir="$BUILD_DIR/_worker_build" \
  --project-directory="$BUILD_DIR"
cp "$BUILD_DIR/_worker_build/index.js" "$BUILD_DIR/_worker.js"

echo ""
echo "▸ Deploying to Cloudflare Pages..."
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" # Set in shell env or ~/.zshrc
export CLOUDFLARE_ACCOUNT_ID=4a3b271b5f1f4cbfc16c6e9e5e62451b

npx wrangler pages deploy "$BUILD_DIR" \
  --project-name=tamazia-website \
  --branch=main \
  --no-bundle \
  --commit-message="Deploy: ribbon fix, audit engine, compliance block"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Deploy complete. Live at:"
echo "  https://tamazia-website.pages.dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Press Enter to close..."
