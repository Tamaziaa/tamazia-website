# TAMAZIA-31 — Dist Patch Protocol & Edit Sanctity Rules

**Status:** Live and enforced from Round 14 onwards  
**Last updated:** 2026-04-29

---

## The Root Problem (Why Edits Kept Breaking)

`deploy-tamazia-r14.command` runs `npm run build` as its **first step**.  
Astro's build completely regenerates `dist/` from source.  
Any manual edits made directly to `dist/` files are silently destroyed every deploy.  
This is why the ribbon fix, form fix, gold colour, and every other manual patch regressed.

---

## The Three-File Permanent Prevention System

### 1. `tgcs-master.css`
**Location:** `03-Astro-Site/tgcs-master.css`  
**Purpose:** Single source of truth for ALL CSS that cannot survive the Astro build.  
Unscoped CSS — overrides Astro's hashed component styles. Use `#id` selectors or `!important` where Astro scoped specificity wins.

**How to add a new CSS patch:**
1. Open `tgcs-master.css`
2. Add the rule with a comment explaining what it fixes and why
3. That's it — the patch will inject on next deploy automatically

**Never edit `dist/index.html` CSS directly.** It gets overwritten on every build.

---

### 2. `patch-dist.js`
**Location:** `03-Astro-Site/patch-dist.js`  
**Purpose:** Node script that runs after `npm run build`, reads `tgcs-master.css`, minifies it, and injects it as the `<style id="_tgcs">` block in `dist/index.html`.

**Self-verifying:** Runs 6 checks after injection and exits non-zero if any fail:
- `_tgcs` block present
- `#upsell-framing` gold colour (`#C9A772`)
- `@keyframes ribbon-vertical` present
- `.errors-table{display:none}` present
- `.gauge-card` present
- No em dashes in dist HTML

If verification fails, the deploy script stops before Wrangler runs — so a broken patch never goes live.

**To run manually:**
```
cd ~/Desktop/Tamazia-Rebuild/03-Astro-Site
node patch-dist.js
```

---

### 3. `deploy-tamazia-r14.command`
**Location:** `~/Desktop/deploy-tamazia-r14.command`  
**Modified step order (critical):**
```
1. npm run build          ← Astro regenerates dist/ from source
2. node patch-dist.js     ← Injects tgcs-master.css, verifies, fails fast
3. cp dist/ → /tmp/cfdeploy
4. npx wrangler deploy    ← Only runs if patch passed
```

---

## Rules for Editing the Site Going Forward

### CSS changes that affect dynamically-created elements (JS-injected content)
→ Edit `tgcs-master.css` only. Never touch `dist/`.

### CSS changes to Astro components (static sections: Hero, LawsStrip, WhyUs, etc.)
→ Edit the `.astro` source file in `src/components/sections/`.  
→ The build compiles it with a scoped hash — changes survive deploys correctly.  
→ **Exception:** If the scoped hash causes specificity issues, fall back to `tgcs-master.css` with an unscoped override.

### Backend / audit logic changes
→ Edit `functions/api/audit.js` directly. This file is not touched by the Astro build.  
→ Wrangler deploys it from `/tmp/cfdeploy/functions/` alongside `dist/`.

### Static HTML placeholders in `dist/index.html`
→ Do NOT edit. They reset on every build.  
→ If you need a different default placeholder, edit the `.astro` source component.

### Deploying
→ Always use `deploy-tamazia-r14.command`. Never run `npm run build` alone and then edit `dist/` manually — that sequence is the regression pattern.

### CRITICAL: Functions must be compiled before deploy
`wrangler pages deploy` does NOT auto-process the `functions/` directory for direct uploads (only Git-connected builds get that). Without this step, Cloudflare deletes all existing functions and the API returns 405.

The correct sequence (now baked into deploy-tamazia-r14.command):
```
1. npm run build
2. node patch-dist.js
3. cp dist/ + functions/ → /tmp/cfdeploy/
4. wrangler pages functions build functions/ --outdir=/tmp/cfdeploy/_worker_build
5. cp /tmp/cfdeploy/_worker_build/index.js → /tmp/cfdeploy/_worker.js
6. wrangler pages deploy /tmp/cfdeploy/ --no-bundle
```
Step 4-5 is what was missing. Without it, `npm run build` + `wrangler pages deploy` silently drops all serverless functions.

---

## What Each File Controls (Quick Reference)

| What you want to change | Where to edit |
|---|---|
| Regulation ribbon animation / layout | `src/components/sections/Hero.astro` |
| Laws strip (horizontal marquee) | `src/components/sections/LawsStrip.astro` |
| Audit result cards, form, gauge CSS | `tgcs-master.css` |
| Upsell card gold colour | `tgcs-master.css` → `#upsell-framing` |
| Ribbon vertical keyframe (permanent) | `tgcs-master.css` → `@keyframes ribbon-vertical` |
| Audit logic, findings, compliance text | `functions/api/audit.js` |
| Em dash rule (strictly none, use ` · `) | `functions/api/audit.js` |
| Upsell headline / body copy | `functions/api/audit.js` → `buildUpsell()` |
| Compliance block text | `functions/api/audit.js` → `buildComplianceShort()` |
| CSS variables (--gold, --oxblood, etc.) | `src/styles/` Astro source → compiles into `cookie-policy.BRSzyVdL.css` |

---

## Current Finalised Patches in tgcs-master.css

| Patch | Rule | Reason |
|---|---|---|
| Gauge cards | `.gauge-card{…}` | JS-injected, not in Astro source |
| Metrics grid | `.metrics-grid{…}` | JS-injected |
| Audit form layout | `.audit-form{…}` | Scoped CSS specificity override |
| Finding cards | `.finding-card{…}` | JS-injected |
| Errors table hide | `.errors-table{display:none!important}` | Replaced by finding cards |
| Upsell framing gold | `#upsell-framing{color:#C9A772!important}` | `--gold-text-strong` resolves to dark brown #5C3F18 |
| Ribbon keyframe | `@keyframes ribbon-vertical{…}` | Cookie-policy.css dependency is fragile |

---

## Regression Prevention Checklist (Before Every Deploy)

- [ ] Run `node patch-dist.js` — all 6 checks green?
- [ ] No `—` characters anywhere in `dist/index.html` or `audit.js`?
- [ ] Ribbon CSS in `Hero.astro` has no `width: 100%` on `.ribbon-column`?
- [ ] `tgcs-master.css` has both `#upsell-framing` gold and `@keyframes ribbon-vertical`?
- [ ] `deploy-tamazia-r14.command` has `node patch-dist.js` between build and staging?
