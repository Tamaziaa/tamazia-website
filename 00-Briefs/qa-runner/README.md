# Tamazia QA Runner · 50-layer × 5-viewport

**Purpose:** automate the full audit defined in TAMAZIA-26. Single command. Repeatable. Saves a dated report + screenshots so you can compare runs.

**You do not write code. You run one command. Claude wrote the rest.**

---

## How to use (zero developer skills required)

1. Open Terminal (Cmd+Space → type "Terminal" → Enter).
2. Copy-paste these three commands one at a time, pressing Enter after each:

```
cd ~/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner
npm install
npm run audit
```

That's it. The first run takes ~3 minutes because it downloads the headless browser. Every later run takes 2–4 minutes.

When it finishes:
- A new folder appears at `00-Briefs/qa-runner/reports/<timestamp>/`
- Inside: `report.md` (the bug list), `screenshots/` (one PNG per viewport per layer), `lighthouse.json` (raw data).
- Open `report.md` in Cursor, Sublime, or any text editor.

---

## What it tests

50 layers, defined in TAMAZIA-26-50-LAYER-FINAL.md.
At 5 viewports: 360×800, 390×844, 768×1024, 1366×768, 1920×1080.
Plus reduced-motion + forced-colors variant runs at boundary viewports.

Total: ~650 atomic checks per run.

## What it does NOT test (intentional)

- Real-user network conditions (4G slow throttle is approximated, not real)
- Email deliverability (SPF/DKIM/DMARC requires DNS lookup not in scope of this runner; check separately at https://mxtoolbox.com)
- Manual eye-pass at each viewport (the runner takes screenshots; you decide if anything looks ugly)

## How to add a new check

Open `layers/L51-yourcheck.js` (template provided). Copy the structure of any existing layer file. The runner auto-discovers all `L*.js` files in `layers/`.

## Files

- `package.json` — dependency list (Playwright + Lighthouse only)
- `audit.js` — orchestrator
- `viewports.js` — the 5 viewport definitions
- `layers/` — one file per layer (L01.js through L50.js); each exports `{ id, name, severity, run(page, ctx) }`
- `report-template.md` — markdown skeleton for the output
- `reports/` — generated reports (gitignored)

## When to run it

- Before every deploy
- After any code change you want to verify
- Weekly even if no changes (third-party services like Google Fonts can break things)
- Before showing the site to an investor / client (always)
