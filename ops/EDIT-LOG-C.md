# EDIT-LOG-C — MISSION C finish + adversarial audit (V2)
Branch `v4-p1-audit` (worktree `_v4-p1-audit`). Render + booking layer only. Audit ENGINE OFF-LIMITS.
Prices render ONLY from the single `PRICES` block in `audit-app.js` (mirror of `src/content/pricing.ts`).
FOUNDER-BLOCKED (CONTACT_PHONE, 5 Stripe links) stay conditional/omitted when env unset. No dashes, no we/our, credential exact.
Companion: `ops/EDIT-LOG-audit.md` (E0–E10 build) carries the same V2 rows.

## Changes this pass

### C7 — disclosure (DONE)
- **File:** `public/audit/audit-app.js:652`
- Replaced the E7-authored `addon-disclosure` paragraph with the EXACT OS-V4 C4 text (verbatim):
  "Figures shown for client engagements are drawn from verified analytics and are identified as such. Any figure labelled illustrative is a worked example, not a client result. Each solution commits to defined deliverables and to reach; commercial outcomes depend on factors outside any agency’s control and are not guaranteed. Full terms: /legal/service-terms."
- Only deviation from a literal copy: `agency's` → `agency’s` (curly apostrophe, matching the codebase's rendering convention for every apostrophe in client copy).
- Wrapper/class (`<p class="plan-sub addon-disclosure">`) preserved. Rendered as plain text (the path is not a clickable link, so no dead 404 button).
- Verified: render-sim shows the verbatim text in the DOM (`DISCLOSURE_FOUND=true`), old disclosure gone (`HAS_OLD_DISCLOSURE=false`), no dashes, no we/our in the block.

### C8 — oncology (FLAGGED, no code change)
- The build kept the LIVE hedged third-person version (audit-app.js:657-665): `+96%`, `Zero` (compliance incidents), "one of the factors contributing to shares closing 96% above the offer price", "Zero violations across the IPO window". This matches the locked `src/content/caseStudies.ts` (lines 24, 81-93).
- OS-V4 C6 alternative names "CG Oncology" with "shares nearly doubled at IPO" + a more absolute "zero compliance incidents". OS-V4 itself (line 296) flags those two as "your stated facts; keep them only where defensible."
- **Recommendation: keep the hedged version (safer default).** It is already vetted into the live site and uses defensible framing ("one of the factors"). The "nearly doubled" + absolute "zero compliance incidents" variant raises the substantiation bar without a clear evidentiary upside. Code left as-is per the task; awaiting founder decision.

## Bugs found (adversarial sweep C1–C10)

| # | Sev | File:line | Condition | Action |
|---|-----|-----------|-----------|--------|
| C-BUG1 | low | audit-app.js:978-979 | Exposure Report unlock/cover passed hardcoded `'£449'`/`'£750'` to `Commerce.startAddon` — the last display-price not sourced from `PRICES`; silent drift if pricing.ts changes. | FIXED → `gbpFmt(PRICES.exposureReport.monthlyCover/unlock)`. Backend charge unaffected (uses server-side Stripe price_id); `'Compliance Monitoring'` addon-name contract unchanged. |
| C-BUG2 | low (latent) | functions/api/stripe/checkout.js:48-52 | `addonKey()` resolves Website Remodelling / Instagram Presence to keys with NO `ADDON_CATALOGUE` entry. `addonPriceId()` returns null today (so they already fall back), but `ADDON_CATALOGUE[key].unit/.name` at lines 65/78 would throw a TypeError if a future `STRIPE_PRICE_MAP` override resolved a price for such a key. | FIXED → fall back when `!ADDON_CATALOGUE[key]` (mirrors the guard `intent.js:55` already uses). No behavior change today. |

## Flags (risky / out of scope — NOT changed)

| # | File | Finding | Why flagged |
|---|------|---------|-------------|
| C-FLAG3 | audit-app.js (136-139, 200, 718, 785, 789, 1204, 1307) | 5 "we" instances render in the DOM (confirmed via render-sim, `WE_OUR_IN_DOM=5`). | All PRE-EXISTING live engine copy, NONE in C1–C10 scope. Mass-rewriting locked live brand copy is risky (meaning/verbatim drift). Founder/Cowork copy call. |
| C-FLAG4 | src/pages/legal/ | `/legal/service-terms` page does not exist (only dpa, sub-processors, data-protection). | The C7 disclosure names it verbatim per OS-V4. Rendered as plain text, so no dead clickable link today, but the path needs a real page OR founder confirmation. |

## Verification
- Syntax: `jsc public/audit/audit-app.js` → `ReferenceError: Can't find variable: window` = clean parse (PASS). `jsc -m functions/api/stripe/checkout.js` parses clean.
- Render-sim (stubbed window/document/D/CH, jsc `load()`): the full IIFE executes end-to-end with no throw; 57.7k chars of HTML built; disclosure verbatim present; oncology hedged version present (`ONCOLOGY_NEARLY_DOUBLED=false`); 0 em/en dashes in DOM; no `tel:` leak with CONTACT_PHONE unset; Independent/fix-pack/Route-3 prices render from PRICES.
- Needs a live deploy to confirm: actual Cal.com iframe mount, PostHog network capture, Stripe checkout redirect (keys not live), and the cal-webhook → Neon `cal_bookings` write under a real booking.
