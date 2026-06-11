# Production performance · final standing (2026-06-11, post #46-#52)

## Definitive measurement — identical production build, clean origin
Lighthouse against the production deployment's pages.dev alias (same build bytes as
tamazia.co.uk, but WITHOUT the zone's Bot Fight Mode challenge injection):

| | perf | a11y | best-practices | seo | LCP | TBT |
|---|---|---|---|---|---|---|
| **Desktop** | **94** | **100** | **100*** | **100** | 1.5s | **0ms** |
| **Mobile** | 83† | **100** | **100*** | **100** | 4.3s | **0ms** |

*BP measured 96→100 after PR #52 (CSP style-src nonce bug, Cal ui-call ordering,
manifest icon 404s — zero console errors, Playwright-verified Cal iframe boots themed).
CLS 0 throughout. The nexus paint-loop gate (#50) took main-thread TBT to 0ms.

## Why tamazia.co.uk PSI readings can show lower numbers
A/B on the SAME minute, SAME machine, SAME build: pages.dev desktop 94 vs custom
domain 62-68. The delta is Cloudflare **Bot Fight Mode** on the tamazia.co.uk zone:
its /cdn-cgi/challenge-platform script (a) logs console errors + deprecations that
capped BP at 74-75, and (b) under repeated automated visits escalates challenges
that inflate render delay (FCP 1.0s → 3-5s for bot-scored clients; Google's PSI
crawlers get bot-scored too on hot IPs). TTFB stayed 70-220ms — the site itself is fast.

**Founder action (1 minute): Cloudflare dashboard → tamazia.co.uk → Security → Bots
→ turn OFF "Bot Fight Mode".** Turnstile (form protection) is separate and stays.
After the toggle, the custom domain converges on the clean-origin numbers above.

## † Mobile perf 83 → 90+: the one remaining engineering lever
LCP phase breakdown on the clean origin: TTFB 524ms | render delay ~3.7s — the
render-blocking CSS chain (~61KB across 11 chunks) under PSI's slow-4G/4× CPU sim.
Scoped follow-up (0.5-1 day): critical-CSS split (inline hero-path CSS, defer the
rest) + DOM diet. Projected mobile 88-93. Field data (CrUX) on real devices already
reads far better than the lab sim.

## Journey (homepage)
Mobile perf 61 → 83 · LCP 6.9s → 4.3s · CLS 0.055 → 0 · TBT ~600ms → 0ms
Desktop perf 87 → 94 · a11y 94/97 → 100/100 · BP 74 → 100* · SEO 92 → 100/100
