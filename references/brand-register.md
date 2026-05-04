# Brand Register · 14 Deploy-Time Checks

`patch-dist.js` runs these against `dist/**/*.html` after every Astro build. Any failure aborts the deploy. None negotiable; they encode 15 rounds of brand decisions.

| # | Check | Source rule |
|---|---|---|
| 1 | `_tgcs` block injected into dist/index.html | R14 patch system |
| 2 | `#upsell-framing{color:#C9A772` token present | Audit upsell brand colour |
| 3 | `@keyframes ribbon-vertical` present | R11 vertical regulation ribbon |
| 4 | `.errors-table{display:none` present | Audit UX |
| 5 | `.gauge-card{` CSS present | R12 audit gauge styling |
| 6 | No em-dashes (—) in any HTML | R4 punctuation rule |
| 7 | No `Subscribe` string in any HTML | Phase E V-15: no subscribe flow exists |
| 8 | No `pages.dev` references in any HTML | Phase G G-G1: canonical is tamazia.co.uk |
| 9 | `200+` count >= 4 in dist/index.html | R2: ribbon, subline, paragraph, CTA |
| 10 | `Aman Pareek` capitalised in /about | R3: founder name capitalisation |
| 11 | No Indian regulators (IBC, TRAI, SEBI, RBI, DPDP, MeitY, IRDAI) | R1: no Indian jurisdiction |
| 12 | British English: no `inquiry` (only `enquiry`) | Phase E V-08 |
| 13 | No `NYSE: CGON` (correct ticker is `Nasdaq: CGON`) | Phase D PDB-G1 |
| 14 | No `Selected mandates` (correct phrase is `Verified mandates`) | Phase E V-04 |

## Adding a new check

1. Open `patch-dist.js` in repo root.
2. Add the check after the existing 14 using the `checkAcross` or `checkIndex` helper.
3. Test locally: `npm run build && node patch-dist.js`.
4. Commit. The next deploy enforces it.
