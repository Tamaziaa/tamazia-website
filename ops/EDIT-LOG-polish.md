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

---

## FIX 4 · Remove every "we"/"our"/"us" from rendered audit + the named website copy

Rule: never we/our/us in user-facing copy (code comments are fine). Rephrased to third-person /
imperative, meaning preserved, NO em/en dashes introduced, credential strings untouched.

### Scope decision (important for the coordinator)
The directive enumerates the spots to fix and forbids touching the website `/case-studies` pages.
A LITERAL site-wide "zero we/our/us" is NOT achievable or intended, because:
1. `src/content/testimonials.ts` is ~60 genuine CLIENT quotes ("Our hotel…", "We'd tried two agencies…").
   These are third-party voices, not Tamazia's; rewriting them would falsify testimonials. LEFT AS-IS.
2. `src/content/caseStudies.ts` + `/case-studies` pages (Orchid/Meraas/etc.) contain "we/our" but are
   EXPLICITLY out of scope per Fix 3. LEFT AS-IS.
3. The legal pages (privacy, terms, complaints, modern-slavery, security, cookie-policy), FAQ, sectors
   body copy, QuickAudit, services/[sector] etc. carry ~100+ first-person sentences. Rewriting all of
   them is a far larger pass than four founder fixes and risks legal-copy accuracy.
So this fix = (a) the AUDIT DOM made fully first-person-free (the whole render path, not just the listed
lines), and (b) the directive's named WEBSITE spots. The broader site first-person surface is flagged
below for a separate, scoped decision.

### AUDIT render path (now ZERO prose we/our/us)
- `public/audit/audit-app.js`: regulatory headline fallback (~136) + paragraph (~137); reg-sub "every
  breach evidenced" (~139); keyword urgent note "…have been filtered out" (~200); verdict bullet "buyer
  queries probed" (~718); hero subhead "Every metric behind your score" (~785); waterfall meta "not just
  a sum of ceilings" (~789); commerce modal heading "Share a few details about the firm" (~1137); two
  error toasts (~1204, ~1307).
- `functions/audit/_adapter.js` (render adapter = presentation, NOT the scanning/scoring engine — it only
  shapes display strings): `absenceLine` finding text x3 (~334/337/340); `regulatoryHeadline` x3 branches
  (~946/948/949) → "All 400+ active frameworks were screened…"; SCAN fallback `action` x2 (~1065/1066);
  framework `why` (~1084); one code comment de-"we"-ed (~193).
- `functions/audit/_commerce.js`: Cold Email Outreach addon USP (~45) → "Sources 30,000 …".
- `public/audit/audit-charts.js`: exposure-waterfall note (~342) → "Overlapping … ceilings are collapsed…".
- `functions/audit/[[path]].js`: 500-error message (~80) → "The Tamazia team has been notified."

### WEBSITE (directive's named spots)
- `src/components/sections/Contact.astro`: two error toasts (~628/632) "email us" → "email
  founder@tamazia.co.uk".
- `src/components/sections/FinalHero.astro` (the LIVE homepage hero — `Hero.astro`/`hero.ts` is NOT
  imported by index.astro): "Ours is run by one" → "Tamazia is run by one" (~199); "Every campaign
  executed through us" → "Every campaign Tamazia runs" (~203); founder blockquote "We onboard" →
  "Tamazia onboards" (~234).
- `src/content/hero.ts` (canonical content source; fixed for consistency even though its component is
  unused): `positioningLine` (~43) and `complianceParagraph` (~58) matched to the FinalHero rephrasings.

### Verification
- `jsc` parse of every edited JS file → only static-`import`/`export` arity errors or runtime `window`
  ReferenceError after a full clean parse (PASS). Import/export-stripped re-checks of audit-app.js and
  _adapter.js parsed clean (no SyntaxError), validating the edited lines.
- FULL audit render-path sweep (audit-app.js, audit-charts.js, _adapter.js, _commerce.js, _shell.js,
  [[path]].js) for prose `we/our/ours/we're/we've/we'll/we'd` and standalone first-person `us`, excluding
  code comments and the `class="us"`/`class="ut"` CSS hooks → ZERO. The only `us`-substring hits left in
  `_adapter.js` are TLD/jurisdiction codes (`us:`/`'US'`) and a dead `us:` data key (the render reads
  `a.usp`, not `a.us`) — none is first-person prose.
- Named website files (FinalHero, Contact, hero.ts) → ZERO prose we/our/us; remaining matches are
  `/* … */` code comments and the `(US)` country code, both allowed.
- Dash check: no em-dash/en-dash introduced in any rephrased string.

### FLAGGED for a separate coordinator decision (NOT done here — out of the four-fix scope)
Tamazia-voice "we/our" still present in: legal pages (`src/pages/privacy*.astro`, `terms.astro`,
`complaints.astro`, `modern-slavery-statement.astro`, `security-*.astro`, `cookie-policy.astro`),
`src/content/faq.ts`, `src/content/sectors.ts`, `src/content/insights.ts`, `src/content/booking.ts`,
`src/components/sections/QuickAudit.astro`, `SextantInstrument.astro`, `InstrumentAudit.astro`,
`InstrumentShowcase.astro`, `Testimonials.astro` heading, `src/pages/services/*`, `src/pages/book.astro`,
`src/pages/status.astro`, `404.astro`, `sectors.astro`. CLIENT testimonials (`testimonials.ts`) and the
`/case-studies` content are deliberately excluded from any future purge.
