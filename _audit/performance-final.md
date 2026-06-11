# Production performance · final standing (2026-06-11, post PR #46/#47/#49)

Lighthouse (same engine as PageSpeed Insights) against https://tamazia.co.uk, ×2 averaged.

| | perf | a11y | best-practices | seo | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| **Desktop** | **96** | **97** | 74* | **100** | 1.0-1.3s | 0.001 | 20-30ms |
| **Mobile** | 67† | **100** | 75* | **100** | 4.0s (was 6.9s) | 0 | 280ms |

Journey: homepage mobile perf 61 (pre-remodel) → 65 → 67-77; desktop 87 → 94 → **96**. LCP element fixed twice (empty-h2 → banner → hero paragraph). CLS 0.055 → **0**.

## * Best-Practices 74/75 — Cloudflare-injected, one dashboard toggle
The ONLY failing BP audits are console errors + deprecation warnings from Cloudflare's own bot-challenge script (`/cdn-cgi/challenge-platform/.../main.js`), which Cloudflare injects into every page. Not present in the repo; not fixable from code.
**Founder action (1 minute): Cloudflare dashboard → tamazia.co.uk → Security → Bots → turn OFF "Bot Fight Mode".** Forms stay protected (Turnstile is separate). Expected effect: BP ≈ 96+ on both form factors.

## † Mobile performance 67 — what remains and the scoped fix
Shipped levers: dead-CSS dedup (-788 lines), animations library 15.5KB→1.2KB, banner deferred + shrunk (it WAS the LCP element), marquee DOM 200→80 cards, typewriter substrate (no innerHTML churn), nexus paint-loop gated (PR #50; stroke-dashoffset repaints continuously — 40s main-thread in traces).
Remaining bound: ~61KB compressed CSS across 11 render-blocking chunks + large DOM under Lighthouse's slow-4G/4× simulation. Reaching mobile-90 needs the **critical-CSS split** (hero-only inline CSS + deferred rest, DOM diet ~30%): scoped follow-up, est. 0.5-1 day, projected mobile perf 88-93. Real-device field data (CrUX) will read considerably better than the lab sim throughout.
