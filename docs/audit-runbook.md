# Audit page runbook

How the contract-driven audit page (`/audit/<slug>/<hash>`) is rendered, re-minted,
gated in CI, and cut over from the legacy Cloudflare Worker to this Pages app.

Scope: the **website** repo `Tamaziaa/tamazia-website` (this repo, Astro + Cloudflare
Pages Functions). The **engine** repo `Tamaziaa/tamazia-cowork-os` mints the payloads and
owns the legacy worker. They are separate repos on the same Cloudflare account / zone.

---

## 1. How the render pipe works

A request to `/audit/<slug>/<hash>` is served entirely by Cloudflare Pages Functions in
this repo. There is no client-side data fetch — the page ships fully formed.

```
GET /audit/<slug>/<hash>
        │
        ▼
functions/audit/[[path]].js   (onRequest — the Pages Function route)
        │  1. regex-match /audit/<slug>/<hash>  (sig is OPTIONAL on load — not verified)
        │  2. SELECT payload_json, domain, sector, country, lead_id, expires_at, company
        │     FROM audit_pages WHERE slug=$1 AND hash=$2     (via functions/api/_neon.js)
        │  3. honour expires_at (410 if past); 404 if no row; 503 if Neon errors
        ▼
functions/audit/_adapter.js   payloadToD(payload, { company, now, generated_at })
        │  Pure transform: the minted engine payload_json → the `D` view-model the page
        │  renders from. Enforces jurisdiction prefixing, competitor de-aggregation,
        │  keyword hygiene, the 10-dimension rubric, exposure waterfall, etc.
        ▼
functions/audit/_shell.js     renderShell(D)
        │  Emits the exact audit HTML shell. Injects the data as
        │  `<script>window.D = …</script>` (XSS-safe JSON), then loads, IN ORDER:
        │     1. window.D                      (the data)
        │     2. /audit/audit-charts.js        (chart primitives)
        │     3. /audit/audit-app.js           (builds the DOM into #app from window.D)
        │  <head> also carries the self-hosted @font-face block (see §2).
        ▼
text/html (200, cache-control public max-age=300)
+ best-effort PostHog `audit_opened` capture via context.waitUntil (never blocks)
```

Static assets (`audit.css`, `audit-charts.js`, `audit-app.js`, and `fonts/*.woff2`) live
under `public/audit/` and are copied verbatim to `dist/audit/` by the Astro build, then
served by Pages at `/audit/*`.

**Error path:** any failure renders `errorShell(title, message)` from `_shell.js` with the
appropriate status (404 / 410 / 500 / 503). The error shell uses the same fonts.

---

## 2. Self-hosted fonts

The production CSP (`public/_headers`) is `font-src 'self' data:` and does **not** allowlist
`fonts.googleapis.com` / `fonts.gstatic.com`. The old Google Fonts `<link>` in the shell
therefore could never load on the live page. Fonts are now self-hosted:

- **Files:** `public/audit/fonts/*.woff2` — 11 files, **latin subset**, downloaded from the
  Google Fonts CSS2 API. Three families, same weights/styles the old `<link>` requested:
  - **Fraunces** (`--serif`): 300, 400, 500, 600 + italic 400
  - **Newsreader** (`--body`): 300, 400, 500 + italic 400
  - **JetBrains Mono** (`--mono`): 400, 500
- **Shell:** `functions/audit/_shell.js` emits an inline `<style id="tz-fonts">` `@font-face`
  block (built by the `FONT_CSS` constant) pointing at `/audit/fonts/*.woff2`, with
  `font-display:swap` preserved. No `nonce` is needed — `style-src` includes `'unsafe-inline'`.
- **CSP:** unchanged — `font-src 'self'` already covers the same-origin woff2.
- **Caching:** `public/_headers` adds `/audit/fonts/* → Cache-Control: public, max-age=31536000, immutable`.

Because families/weights/styles and `font-display` match the old `<link>` exactly, the
render is pixel-identical once the fonts load (and degrades to the Georgia/monospace stack
during swap, as before).

### Re-fetching / changing the fonts

To regenerate the woff2 set (e.g. to add a weight), pull the latin `@font-face` blocks from
the CSS2 API with a browser User-Agent (so Google serves woff2, not ttf), download each
`src: url(...)`, and save under `public/audit/fonts/` using the `<slug>-<weight>[-italic].woff2`
naming. Then mirror the new file(s) in **both** the `FONT_CSS` list in `_shell.js` **and**
the expected-files list in patch-dist gate 132. Keep weights identical to `audit.css`
(`--serif/--body/--mono`) or the render will shift.

---

## 3. Re-minting a payload locally

Payloads are minted by the **engine** repo (`Tamaziaa/tamazia-cowork-os`), not here. A row in
Neon `audit_pages` holds `payload_json`; this Pages app only reads it. Re-mint when the engine
changes the payload contract or a site is re-scanned.

Prereqs (per the engine repo's session bootstrap):
- Node 20 + the engine repo checked out (the sandbox clone is typically `/tmp/eng`).
- `set -a; source COWORK-OS-EXECUTION/.env` (provides `NEON_URL`/`NEON_CONNECTION_STRING`,
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, PSI/PostHog keys, `TAMAZIA_HMAC_SECRET`).
- **pg8000** for DB access without libpq: `pip install --target /tmp/pylib pg8000 && export PYTHONPATH=/tmp/pylib`.
  The repo ships a drop-in `scripts/psql` bash shim that runs `scripts/lib/psql-shim.py`
  (pg8000 under the hood), so `psql "$NEON_URL" -tA -c "…"` works with no system Postgres.

**Build one payload to a file** (the `buildPayload` entry point — `_drv_mint.js` wraps it):

```bash
# from the engine repo root
node _drv_mint.js <domain> <sector> <country> /tmp/payload.json
# e.g. node _drv_mint.js streathers.co.uk law UK /tmp/payload.json
# prints {ok:true, pointers, compliance, seo, sov, dr, …}; writes the payload JSON to the outfile.
# (for a fast <44s single-brand local eval: `unset PAGESPEED_API_KEY` to skip the PSI call.)
```

`buildPayload({ domain, sector, country, env })` lives in
`src/skills/S025-audit-page-builder/scripts/build.js` and also exports `slugify`,
`generateHash`, and `signUrl({ slug, hash, lead_id, expSeconds })` (HMAC over
`slug|hash|lead_id|exp` using `TAMAZIA_HMAC_SECRET`; the sig is for email links only — page
load does not require it).

**Re-mint existing DB rows onto the current engine** (resumable, per-row fail-soft):

```bash
# from the engine repo root — re-mints rows whose payload is stale (generated_at older than cutoff)
node scripts/remint-audits.js [limit] [--since=ISO]
# target specific rows by hash:
REMINT_HASHES=YpHBx5lx,AbC123 node scripts/remint-audits.js
# It UPDATEs audit_pages.payload_json (jsonb), framework_version, generated_at=now() via the psql shim.
```

**Verify the render locally** against the freshly built payload, using this repo's adapter +
shell + jsdom (no deploy needed):

```bash
# from the rebuild root (canonical harnesses live in _tools/, jsdom installed there)
export PATH="$PWD/_tools/node/bin:$PATH"
node _tools/qa_render.mjs     # full-DOM render of every fixture · 0 issues required
node _tools/backtest.mjs      # ~70 checks/audit across structure, data, charts, rubric
```

To eyeball a specific payload, render it through `renderShell(payloadToD(payload, { company }))`
with `{ inline:true, assets }` (the harnesses show the pattern) and open the HTML.

After re-minting, smoke the live row: `curl -s https://tamazia.co.uk/audit/<slug>/<hash> | grep window.D`.

---

## 4. CI deploy-safety gates

`.github/workflows/deploy.yml` runs on push to `main`. The gates fail the build **before** any
deploy. Order: checkout → setup-node 20 → `npm install` → **gates** → build → patch-dist →
compile functions → deploy → post-deploy probes.

Pre-deploy gates (all must pass):

| Gate | Command | What it guards |
|------|---------|----------------|
| QA render | `node _qa/qa_render.mjs` | Full-DOM render of every fixture via jsdom — **0 issues required**. This is the real guard on the audit shell (incl. the font change). |
| Backtest | `node _qa/backtest.mjs --max-bugs=4` | ~70 checks/audit (structure, no-bad-values, data integrity, R1–R6 rubric, chart rendering). Regression guard — see baseline note below. |
| Functions build | `npx wrangler pages functions build functions/ --outdir=/tmp/fnbuild` | Catches the **relative-import failure class** that broke a past deploy — a bad import only surfaces when wrangler bundles `functions/`. |

Post-deploy (after `wrangler pages deploy`):
- **Existing synthetic check** (kept): asserts `/api/contact`, `/api/audit`, `/api/briefings`
  are not 404 and `/api/health` is 200.
- **Audit page probe** (added): if repo secrets `AUDIT_PROBE_SLUG` + `AUDIT_PROBE_HASH` are
  set, GET `https://tamazia-website.pages.dev/audit/<slug>/<hash>` and assert **200 + body
  contains `window.D`**. The page-load path matches on slug+hash only (sig optional), so no
  signing is needed. If the secrets are unset the probe is **skipped** (never blocks a deploy).
  Pin them to a known-good, non-expiring Neon row, e.g. `streathers-solicitors` / `YpHBx5lx`.

### Why the harnesses are vendored into `_qa/`

The canonical harnesses live **outside** this repo at the rebuild root
(`/Users/amanigga/Desktop/TAMAZIA-REBUILD/_tools/qa_render.mjs`, `backtest.mjs`) and read
fixtures from `../_audit_fixtures_real/`. CI checks out only `tamazia-website`, so those paths
do not exist in the runner. To make the gates genuinely runnable in CI, repo-local copies were
vendored:

- `_qa/qa_render.mjs`, `_qa/backtest.mjs` — same logic, but resolve every path relative to
  themselves (repo root = two levels up) and read a **frozen fixture snapshot** under
  `_qa/fixtures/` (10 base + 6 `_matrix`). They import the in-repo `functions/audit/_adapter.js`
  and `_shell.js` and read the in-repo `public/audit/*` assets.
- `jsdom` is a **devDependency** (so the existing `npm install` step provides it).
- Keep `_qa/*.mjs` in sync with the canonical `_tools/*.mjs` when the latter change.

### Backtest baseline (`--max-bugs`)

A small set of **known, pre-existing data-layer bugs** lives in `_adapter.js`/the engine and is
out of scope for shell/CI work. Today that is **4** failures, all `fixes-unique` (duplicate
remediation text) on `fenwick-law-us`, `legalconsultants-law-uae`, `thirdspace-gym-uk`, and the
`allbirds-com` matrix fixture. `--max-bugs=N` pins that baseline: the gate exits 0 when
`totalBugs <= N` and **fails on any NEW breakage** above it (e.g. a structure/render regression
from a shell change). As the adapter bug is fixed, **lower the number toward 0** in `deploy.yml`.

### patch-dist build gates

`patch-dist.js` (run after build) ends with two audit-asset gates:
- **Gate 131** — `dist/audit/` contains `audit.css` + `audit-charts.js` + `audit-app.js`.
- **Gate 132** — `dist/audit/fonts/` contains all 11 self-hosted woff2 files.

Either failing aborts the deploy (the dist/ is incomplete).

### Running the gates locally

```bash
cd /Users/amanigga/Desktop/TAMAZIA-REBUILD/tamazia-website
export PATH="/Users/amanigga/Desktop/TAMAZIA-REBUILD/_tools/node/bin:$PATH"   # Node 20
node _qa/qa_render.mjs                     # expect: 0 issues
node _qa/backtest.mjs --max-bugs=4         # expect: within baseline (exit 0)
npx wrangler pages functions build functions/ --outdir=/tmp/fnbuild
npm run build && node patch-dist.js        # expect: all 132 checks pass
```

---

## 5. Cutover: apex `/audit/*` → Pages (retire the legacy worker route)

**Today:** `tamazia.co.uk/audit/*` is intercepted by the legacy Cloudflare Worker
`tamazia-audit` (script `cloudflare/audit-worker-v14.js` in the engine repo, deployed by
`scripts/deploy-audit-worker-v14.sh`; sets response header `x-tamazia-audit: v20-live-v15-p5`).
The new Pages app already serves the identical route at `tamazia-website.pages.dev` and is the
apex's default origin — but the worker route shadows it on the apex.

**Goal:** delete the worker's `tamazia.co.uk/audit/*` route so apex `/audit/*` **falls through to
Pages** (this repo's `functions/audit/[[path]].js`). Keep the worker **script uploaded but
unrouted** so rollback is a single API call.

Zone: `tamazia.co.uk` = `ZONE_ID=a564b60458bb5eec33bbe7f13eb0e4e1`. Needs `CLOUDFLARE_API_TOKEN`
with Workers Routes edit on the zone.

### Pre-cutover checks
```bash
# 1. Pages already serves the new render on its own hostname:
curl -s https://tamazia-website.pages.dev/audit/streathers-solicitors/YpHBx5lx -o /dev/null -w '%{http_code}\n'   # 200
curl -s https://tamazia-website.pages.dev/audit/streathers-solicitors/YpHBx5lx | grep -c window.D                  # >=1

# 2. Confirm the apex is still on the OLD worker (header present = worker still routed):
curl -sI https://tamazia.co.uk/audit/streathers-solicitors/YpHBx5lx | grep -i x-tamazia-audit   # v20-live-v15-p5
```

### Cut over (delete the worker route)
```bash
ZONE_ID=a564b60458bb5eec33bbe7f13eb0e4e1
# find the route id whose pattern contains 'audit'
ROUTE_ID=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(next((r['id'] for r in d.get('result',[]) if 'audit' in r.get('pattern','')),''))")
echo "route id: $ROUTE_ID"
# delete it (DO NOT delete the worker script — only the route)
curl -s -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes/$ROUTE_ID" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('route_delete:',d.get('success'),d.get('errors'))"
```

### Post-cutover verification
```bash
# apex now served by Pages: the legacy worker header should be GONE, body still has window.D, status 200
curl -sI https://tamazia.co.uk/audit/streathers-solicitors/YpHBx5lx | grep -i x-tamazia-audit && echo "STILL ON WORKER" || echo "fell through to Pages (good)"
curl -s  https://tamazia.co.uk/audit/streathers-solicitors/YpHBx5lx -o /dev/null -w '%{http_code}\n'   # 200
curl -s  https://tamazia.co.uk/audit/streathers-solicitors/YpHBx5lx | grep -c window.D                  # >=1
```

### Rollback (instant — re-route the still-uploaded worker)
```bash
ZONE_ID=a564b60458bb5eec33bbe7f13eb0e4e1
curl -s -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"pattern":"tamazia.co.uk/audit/*","script":"tamazia-audit"}' \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('route_recreate:',d.get('success'),d.get('errors'))"
# (or just re-run scripts/deploy-audit-worker-v14.sh in the engine repo — it re-creates the route.)
```

Keep the `tamazia-audit` worker script in place until the Pages render has been the live apex
origin for a sustained period. Only after that should the worker script itself be considered for
deletion.
