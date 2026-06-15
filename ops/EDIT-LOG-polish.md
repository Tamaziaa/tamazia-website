# EDIT LOG — v4-polish (four founder-directed website fixes)

Worktree: `_v4-polish` (branch `v4-polish`), off `tamazia-website` main `4d31d7c`. NO MERGE — coordinator
merges after review. Audit ENGINE off-limits (presentation/render only). No Node/npm on PATH locally;
JS syntax-checked with the macOS JavaScriptCore `jsc` helper (a static-`import` "import call expects one
or two arguments" error, or a runtime `ReferenceError: window` after a full clean parse, = PASS = parsed
clean). Render behaviour proven with small `jsc` render-sim harnesses + grep over the rendered strings.

One logical commit per fix.

---

## FIX 1 · CONTACT_PHONE = `+44 7778243657` renders in the audit founder block + the site contact pane

**Why it was missing:** `public/audit/audit-app.js:739-741` renders the founder phone line ONLY when
`CONTACT_PHONE` (from `window.D.contactPhone`) is a non-empty string, else it emits `''` (no placeholder).
`window.D.contactPhone` is fed by `functions/audit/[[path]].js` from `env.CONTACT_PHONE`, which was unset,
so the phone was omitted. The site contact pane carried the founder email/credential but no phone at all.

**Changes**
- `wrangler.toml` [vars]: added `CONTACT_PHONE = "+44 7778243657"` — the committed config the Pages build
  reads, so the audit Function gets it at runtime without a dashboard secret.
- `functions/audit/[[path]].js`:
  - Added `const CONTACT_PHONE_DEFAULT = '+44 7778243657';` (top of file) and changed
    `contactPhone: env.CONTACT_PHONE || ''` → `contactPhone: env.CONTACT_PHONE || CONTACT_PHONE_DEFAULT`.
    Belt-and-braces: the number renders even if the env var is ever unset (directive: "set a sensible
    default constant so it shows without a secret").
- `src/content/contact.ts`: added `founderEmail: 'founder@tamazia.co.uk'` + `founderPhone: '+44 7778243657'`
  (single source for the site contact pane).
- `src/components/sections/Contact.astro`: destructured `founderEmail`/`founderPhone`, derived
  `telHref` (digits+`+` only), and rendered a `.contact-direct` row in the booking pane (below the
  canonical `FounderLink`, above the calendar) — "A direct line to the founder." + `mailto:` + `tel:`.
  Added scoped CSS (`.contact-direct*`), mirroring the audit founder block's email+phone+calendar layout.
  Note: `format-detection: telephone=no` is set site-wide in BaseLayout, so the explicit `tel:` here is
  intentional and not auto-linked elsewhere.

**Verification**
- `jsc functions/audit/[[path]].js` → only the static-`import` arity message (PASS); import-stripped
  re-check parsed clean with zero output (no SyntaxError).
- Render-sim of the exact `founderSession()` phone branch:
  - with `contactPhone='+44 7778243657'` → emits `<a ... href="tel:+447778243657">+44 7778243657</a>`
    beside `<a ... href="mailto:founder@tamazia.co.uk">founder@tamazia.co.uk</a>`. tel link / number /
    email all assert `true`.
  - with `contactPhone=''` → no `tel:` link (confirms the prior omission was the root cause).

---

## FIX 2 · LinkedIn = `https://www.linkedin.com/in/amanpareekk/` — CONFIRMED, no change needed

Audited every LinkedIn URL in `src/`. ALL eight occurrences are the exact founder profile, none is a
company URL:
- `src/config/social.ts:13` `LINKEDIN_URL` (single source) ✅
- `src/content/footer.ts:27` ✅
- `src/components/atoms/FounderLink.astro:22` (canonical founder treatment) ✅
- `src/components/sections/FinalHero.astro:239` (live homepage hero founder pill) ✅
- `src/layouts/BaseLayout.astro:76,91` (Organization + Person `sameAs` schema) ✅
- `src/components/schema/ArticleSchema.astro:38` (`sameAs`) ✅

Header.astro and Footer.astro both `import { socialLinks } from '../../config/social'` and render
`s.href` — single-sourced from `social.ts`, so they inherit the correct URL.

Proofs:
- `grep -rniE "linkedin\.com/company" src functions public` → NONE (no company URL anywhere).
- `grep -rniE "linkedin\.com/in/" ... | grep -vi amanpareekk` → NONE (no divergent personal handle).

No code change required. Logged for the per-fix trace.

---

## FIX 3 · Remove ALL client case studies from the AUDIT page

Founder: "dont mention anything about our three case studies on the audit." Scope is "on the audit"
only — the website's own `/case-studies` pages + `src/content/caseStudies.ts` (Orchid, Meraas,
hospitality group) are EXPLICITLY out of scope and were NOT touched.

**What the audit actually contained:** exactly ONE named-client case study — the CG Oncology / Nasdaq
CGON proof block in `public/audit/audit-app.js` (the `planAndPricing()` tail): a `<div class="subhead">`
heading "The same compliance standard, on the largest regulatory stage" + a `.cgon-proof` card with the
`+96% / Zero` stat tiles, the "CG Oncology · Nasdaq: CGON · Healthcare IPO, USA" meta, the SEC Reg FD
body paragraph, and the "Verified per SEC filings" line. (Orchid/Meraas/882/480% never appeared in the
audit render — they live only in website content files.)

**Changes (`public/audit/audit-app.js`)**
- Deleted the entire CG Oncology heading + `.cgon-proof` card (was lines ~656–665). `trustedStrip()`
  (generic demo/placeholder marks, NOT real clients) is retained above it; the founder section + booking
  + packages below are untouched. No `.cgon*` CSS existed (the block was inline-styled), so nothing was
  orphaned.
- Rephrased the Enterprise tier feature bullet that obliquely referenced the same client:
  `'The compliance standard applied to a Nasdaq-listed company, every jurisdiction'`
  → `'IPO-grade compliance review applied to every asset, across every jurisdiction'`. Keeps the package
  capability (packages stay) while removing the named-engagement allusion.

**Verification**
- `jsc public/audit/audit-app.js` → full file parses clean (1376 lines), runtime `window` ReferenceError
  only (PASS).
- `grep -rniE "cg oncology|cgon|nasdaq|share price at ipo|compliance incidents|orchid|meraas|ipo window|882|480%"`
  over the ENTIRE audit render path (audit-app.js, audit-charts.js, _adapter.js, _commerce.js, _shell.js)
  → ZERO matches (exit 1). No case-study text remains in the audit DOM, including comment nodes.
- The only SEC-Reg-FD string anywhere is `_adapter.js` `US_SEC_REG_FD: 'SEC Regulation FD'` — a
  regulatory FRAMEWORK label in the engine catalogue (audit engine, off-limits), not client copy. Kept.
- Directive note "480% metric tile stays as a headline stat": the 480% figure never existed in the audit
  (it lives in website `whyUs.ts`/`pricing.ts`), so nothing to preserve here; website left untouched.
