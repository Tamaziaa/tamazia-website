# Animation inventory · baseline (P3, 2026-06-11)

42 keyframes across `src/styles/animations.css` (17) + `src/styles/animations-library.css` (25 categories), plus component-scoped transitions. Reduced-motion coverage: 32 locations, ≈100% of timed motion (blanket halt + named overrides + per-component disables).

## HIGH findings

| # | Finding | Evidence | Fix (milestone) |
|---|---|---|---|
| A1 | **Homepage has NO `<h1>`** — the hero headline renders as `<h2 class="tz-headline">` | `grep -c "<h1" dist/index.html` → 0 | M4: promote to `<h1>` (one per page), demote/sr-adjust elsewhere |
| A2 | **Typewriter types from EMPTY server HTML** — headline text exists only in `data-text` attributes; visible spans empty until JS runs; LCP element paints blank; crawlers see attribute text only | `grep -c "Outrank" dist/index.html` → 1 (the attribute) | M3/M4: server-render the full text inside the spans; JS progressively reveals over pre-rendered text (clip/opacity per char or honest fallback); reserve final height (no CLS); instant under reduced-motion + hidden tabs |
| A3 | **FAQ accordion animates `max-height`** — forces layout per frame | FAQ.astro:220,294,315,449 | M3: grid-template-rows 0fr→1fr wrapper (keep details/summary semantics), ≤300ms, `contain: layout` |
| A4 | **Typewriter runs on `setInterval(42ms)` innerHTML writes** — main-thread churn ~6s, IO-gated start (never fires in hidden tabs → blank-hero artifact) | FinalHero.astro:1234-1292 | M3: same substrate fix as A2; keep the effect, change the mechanism |

## Inventory (trigger | properties | compositor? | duration/easing | reduced-motion)

| Animation | Trigger | Properties | Compositor | Duration · easing | RM handling |
|---|---|---|---|---|---|
| FinalHero `data-reveal` (fade/slide/lift/rule) | IO threshold .18 | opacity, transform, filter(blur) | ✅ (filter = paint but tiny) | 720ms · cubic-bezier(.2,.7,.2,1) | disabled (FinalHero:179) |
| FinalHero H1 typewriter | IO threshold .25 → setInterval 42ms | innerHTML (layout) | ❌ | 42ms/char ≈ 4-6s total | instant text |
| Sextant dial needle + sector swap | setInterval 6500ms | transform: rotate | ✅ | 1100ms · cubic-bezier(.5,.05,.2,1) | stopped on hidden + RM |
| Sextant laws ribbon (vertical) | continuous | transform: translateY | ✅ | 240s linear (480s under RM) | slowed, not killed |
| LawsStrip marquee | continuous | transform: translateX | ✅ | 312s linear · pause on hover | duration ×1.5 (LawsStrip:93) |
| Testimonials marquee | continuous | transform: translateX | ✅ | 600s linear · pause on hover | per animations.css blanket |
| CaseStudies stat counters | IO + rAF | textContent | ❌ (text) | ~1.2s | instant values |
| CaseStudies fade-in-up | IO | opacity, transform | ✅ | 600ms · var(--ease-out) | disabled |
| Interstitial reveal | IO | transform: translateY | ✅ | 900ms · var(--ease-out) | disabled |
| FAQ accordion | click | border-color, transform (chevron), **max-height** | ❌ (A3) | 300-400ms · ease | disabled (FAQ:626) |
| Contact success-in | submit | opacity, translateY | ✅ | 480ms · cubic-bezier(.2,.8,.2,1) | blanket |
| Header hide/show | scroll + rAF | transform: translateY | ✅ | 300ms · ease | blanket |
| Back-to-top | scroll threshold | opacity, transform | ✅ | 400ms · var(--ease-out) | blanket |
| Monogram breath / fleuron / shimmer ambients | continuous | opacity, transform | ✅ | 8s-60s | killed by blanket halt |
| WhyUs `.anim-fade-up` | scoped | opacity, translateY | ✅ | 700ms · ease-out-expo | blanket |
| Hover micro (cards, buttons, socials) | hover | transform, box-shadow | ⚠️ box-shadow = paint | 150-300ms | n/a (hover) |

**Justified long-runners:** LawsStrip 312s + Testimonials 600s + Sextant ribbon 240s are ambient loops (translate-only, masked, paused on hover, RM-handled) — documented as intentional; not flagged.

## Sectors animated icons (the system M6 elevates)
Current: hand-drawn gold line SVGs per sector card; hover-state transforms (scale/rotate of sub-elements) via CSS transitions; no draw-on entrance, no IO trigger, no stagger; no per-icon RM override needed (hover-only). Quality: good base, below the Truekind/Stripe draw-on benchmark.
M6 spec (from benchmarks §4): static gold base + cloned path, `pathLength="1"`, dashoffset 1→0; in-view once (staggered 90-120ms/path, 600-900ms), hover redraw 300-400ms brighter gold; cubic-bezier(.2,1,.2,1); never animate fill; RM = drawn + 150ms opacity crossfade; no runtime deps.

## Compliance vs the remodel motion spec
- Durations: all interactive motion ≤900ms ✅; standardize to micro 150-200 / reveal 400-600 / page 600-800 in M3 (today's 720/900/1100 retune slightly).
- Easing: no `linear` on interactive motion ✅ (linear only on ambient marquees — correct); add `--ease-entrance: cubic-bezier(0.16,1,0.3,1)` token in M3.
- `will-change`: no global leaks found; spot-audit per component in M3.
- CLS risk: typewriter (A2) is the only flagged source — hero column height is content-driven during typing.
