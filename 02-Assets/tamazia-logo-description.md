# TAMAZIA LOGO · REFERENCE DESCRIPTION

**File to attach when uploading to Claude Design: the PNG Aman has provided.**
**This document describes the logo for any tool or prompt that needs it in text form.**

## Composition

Vertical lockup on a deep oxblood background.

**Mark (top, centred):** A stylised horse in mid-trot, body turned slightly right, tail flowing, all four legs rendered. The horse has subtle striping on the mane and tail (suggesting a thoroughbred or a minimal zebra stylisation). Executed in warm antique gold with clean flat vector finish, no gradient, no shadow.

**Wordmark (middle):** "TAMAZIA" in classical serif display caps, spaced generously, in the same warm antique gold. Letterforms carry delicate bracketed serifs. Horizontal hairline rules extend left and right of the wordmark like a section divider, reinforcing editorial gravitas.

**Ornament (bottom):** A small tri-petal lotus-style glyph centred between two thin gold hairlines, echoing the wordmark's rule treatment.

## Colour values (derived from the supplied logo)

- **Background:** deep oxblood, approximately `#5A1A2B` to `#6B1E2E` (confirms the `--oxblood` in the brief).
- **Foreground (horse, wordmark, rules, ornament):** warm antique gold, approximately `#C9A772` to `#D4B787` (brighter than the `--gold #B8965A` specified in the brief).

## Adjustment recommendation for brand system

The logo's gold reads slightly warmer/brighter than the gold specified in the brief palette. Two options:

1. **Adjust the brief's `--gold` to `#C9A772`** to match the logo exactly. Recommended. Single source of truth.
2. **Keep the brief's `#B8965A` for UI/micro detail** and let the logo remain a slightly brighter warm gold. Acceptable but creates micro-drift.

**Decision to confirm with Aman: update `--gold` in the brief to `#C9A772` and propagate through all files.**

## Usage rules for the new site

1. **Primary placement:** wordmark only (no horse mark) as the site-wide logo in header. 28px tall Playfair-matching weight.
2. **Footer placement:** full lockup (horse + wordmark + ornament), oversized at 96-128px tall, on obsidian.
3. **Favicon:** horse mark alone, cropped tight, rendered in gold on oxblood. 256×256, 64×64, 32×32, 16×16.
4. **Watermark pattern:** horse mark silhouette at 3% opacity, diagonal lattice at 120px intervals.
5. **Social sharing OG image:** horse + wordmark on oxblood, 1200×630.
6. **Minimum size:** 120px wide for wordmark; 48px tall for horse mark.
7. **Clear space:** 0.5x the height of the wordmark on all sides.
8. **Never:** stretch, recolour, drop-shadow, outline, gradient-fill, or place on busy backgrounds.
9. **Dark contexts:** use gold-on-oxblood (as supplied).
10. **Light contexts (rare):** use oxblood-on-ivory or gold-on-obsidian; never gold-on-ivory except on oversized display (24px+).

## Alt text for the logo

`Tamazia wordmark and horse mark, classical serif display caps in antique gold over deep oxblood. Symbol of the firm's international regulatory and search practice.`

## Files to produce (Claude Code task)

1. `tamazia-logo-full.svg` (vector reconstruction, horse + wordmark + ornament)
2. `tamazia-wordmark.svg` (wordmark only, for header)
3. `tamazia-mark.svg` (horse only, for favicon and watermark)
4. `favicon-256.png`, `favicon-64.png`, `favicon-32.png`, `favicon-16.png`
5. `og-image-1200x630.png` for social sharing
6. `apple-touch-icon-180.png`

All source PNGs derive from the original supplied by Aman.

— End of logo description —
