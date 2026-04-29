# TAMAZIA-31 · Next-Session Bootstrap Protocol v2

**Successor to TAMAZIA-23. This is the master bootstrap any new Cowork session must follow before doing anything else.**
**Authored:** 28 April 2026, end of Round 13.

═══════════════════════════════════════════════════════════════════════
WHAT THIS DOC IS FOR
═══════════════════════════════════════════════════════════════════════

When Aman Pareek opens a new Cowork session for Tamazia, he pastes the prompt
in §13 of this document. That prompt instructs the new Claude session to read
this entire file, then read the documents this file points at, in order. By
the time the new Claude reaches §12 it knows everything the previous Claude
knew, plus exactly where work was paused.

═══════════════════════════════════════════════════════════════════════
§1 · IDENTITY (no ambiguity)
═══════════════════════════════════════════════════════════════════════

Aman Pareek (capital A, capital P — never lowercase, anywhere). 26 years old.
LLM in International Business Law, King's College London. Specialism: business
law and international arbitration.

**Two companies, distinct, do not conflate:**
- **Tamazia** — international SEO + compliance content agency for regulated
  enterprises. Aman is **sole entrepreneur**. No co-founders. This project.
- **LexQuity** — pre-seed legaltech in international arbitration. Aman + Aditya
  (dev) + Danish (CLO) + Manuel Penadés Fons (senior advisor, ICC/LCIA
  proximity). Different project. Out of scope for this session unless Aman
  raises it.

Aman is not a developer. Never ask him to touch a terminal. Flag anything
that requires a developer explicitly.

═══════════════════════════════════════════════════════════════════════
§2 · WORKSPACE CHECK (now handles either mount mode)
═══════════════════════════════════════════════════════════════════════

Aman may have mounted the workspace at one of two levels. Detect which:

  **Mode A · Desktop mounted (preferred — gives access to all Tamazia + LexQuity work)**
    Path that exists: /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/
    Sibling folders also visible: LexQuity, tamazia, Ohotel blogs, Documents,
    Subject Notes LLM, SEO, ARB, Screenshots, etc.
    Action: enumerate every sibling folder under /Users/amanigga/Desktop/ and
    note which ones have Tamazia in the name or contain Tamazia assets.
    Save the inventory to /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/_LOCAL-DESKTOP-INDEX.md
    so future sessions know what other folders exist beyond Tamazia-Rebuild.

  **Mode B · Tamazia-Rebuild mounted directly (narrower — website project only)**
    Path that exists: ./00-Briefs/  (no /Users/amanigga/Desktop/ prefix needed)
    Action: proceed with website-only context. Tell Aman the new session
    cannot see his other Tamazia folders. If he needs access to Ohotel blogs,
    older tamazia folder, Subject Notes, etc., he should re-mount Desktop.

  **Mode C · Neither mounted**
    Action: tell Aman:
    "I need access to your Tamazia files. In Cowork, click the folder icon
     in the left sidebar and select your Desktop folder. Mounting Desktop
     gives me access to Tamazia-Rebuild plus every other Tamazia folder
     you've got there. If you only want the website project, pick
     Desktop → Tamazia-Rebuild instead."
    Wait for confirmation before continuing.

After mount is confirmed, verify these required paths exist:
  • /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/
  • /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/
  • /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/
  • /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/_archive/round-12-bak-files/   ← created in R13

If the mount mode is A (Desktop), additionally inventory and report:
  • Every folder name under /Users/amanigga/Desktop/ that contains
    "tamazia", "ohotel", "client", "asset", "logo", "SEO", "blog",
    "screenshot", "subject notes", or that you can reasonably infer is
    related to Tamazia work (e.g., a folder named after a known sector or
    client). List these in the §12 status report part (e) so Aman can see
    you've situated yourself in the broader workspace.

═══════════════════════════════════════════════════════════════════════
§3 · MASTER HANDOFF (read in full, in this order)
═══════════════════════════════════════════════════════════════════════

Read each of these in full. Do not skim.

  1. /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-22-PROJECT-HANDOFF.md
     ← The persistent project bible. §6 has the round-by-round history through R13.
       §12 has the latest deploy URL.

  2. /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-30-ROUND-13-FINAL.md
     ← The most recent milestone. Tells you the current state: 0 P0, 1 P1
       (DMARC DNS-pending), Lighthouse mobile 1.00, desktop 0.99.

  3. /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-29-ROUND-12-MILESTONE.md
     ← The Round-12 milestone right before R13. Useful for context on what
       was just shipped.

  4. /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-28-ROUND-12-BUG-BACKLOG.md
     ← The original 13-P0 backlog that R12 + R13 cleared. Shows the audit
       methodology and the runner output structure.

  5. /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-26-50-LAYER-FINAL.md
     ← The 50-layer × 5-viewport spec the runner enforces.

  6. This file (TAMAZIA-31) — for §11 "what's pending right now" and §12 "the
     standing rules".

If any TAMAZIA-NN brief numbered higher than 31 exists in /00-Briefs/, read it
too — the highest-numbered brief is authoritative.

═══════════════════════════════════════════════════════════════════════
§4 · LIVE SOURCE FILES (read every file in this list, in order)
═══════════════════════════════════════════════════════════════════════

CONTENT (single source of truth for every word that ships):
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/hero.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/sectors.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/caseStudies.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/pricing.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/faq.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/contact.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/footer.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/howWeWork.ts
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/insights.ts

SECTION COMPONENTS:
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Hero.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/QuickAudit.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/LawsStrip.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/WhyUs.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Sectors.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Interstitial.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/CaseStudies.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/HowWeWork.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Pricing.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/FAQ.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Contact.astro

LAYOUT + LEGAL PAGES:
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/layout/Header.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/layout/Footer.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/layouts/BaseLayout.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/index.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/404.astro            ← R12 ship
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/cookie-policy.astro  ← R12 ship, Danish-approved 28 Apr 2026
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/privacy.astro        ← R12 ship, Danish-approved 28 Apr 2026
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/terms.astro          ← R12 ship, Danish-approved 28 Apr 2026
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/insights/index.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/insights/[sector]/index.astro
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/insights/[sector]/[slug].astro

DESIGN SYSTEM:
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/tokens.css
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/base.css
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/animations.css
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/global.css
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/fonts.css           ← R13 ship, 26 self-hosted @font-face

INFRASTRUCTURE:
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/functions/api/contact.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/functions/api/audit.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/functions/api/briefings.js     ← R12 ship
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/public/_headers                ← R12 + R13 CSP work
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/public/_redirects              ← R13 sitemap.xml rewrite
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/public/robots.txt              ← R12 ship
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/public/llms.txt                ← R12 ship
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/astro.config.mjs
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/package.json                   ← @astrojs/sitemap pinned to 3.2.0
   /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/.env.cloudflare                ← Treat as secret. Never echo. Reference by env var name only.

═══════════════════════════════════════════════════════════════════════
§5 · QA RUNNER STATE (read these to know what's been built)
═══════════════════════════════════════════════════════════════════════

The runner lives at /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/

Architecture (read once each):
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/README.md
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit.js               ← original (kept for reference)
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit-once.js          ← site-once + per-route layers
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit-route.js         ← per-page layers across 5 viewports
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit-perf.js          ← Lighthouse runner
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit-merge.js         ← merges all chunks → master-report.md
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit-smoke.js         ← single-viewport smoke test
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/audit-route.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/lib/axe-runner.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/lib/lighthouse-runner.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/viewports.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/package.json

50 layer files (one .js per layer):
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/layers/L01..L50-*.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/layers/_TEMPLATE.js
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/layers/PENDING.md      ← obsolete; kept for archive

Latest run reports:
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/reports/r13-final-1777375820/master-report.md
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/reports/r13-final-1777375820/perf/lhr-_-mobile.json
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/qa-runner/reports/r13-final-1777375820/perf/lhr-_-desktop.json

═══════════════════════════════════════════════════════════════════════
§6 · CURRENT LIVE STATE (what is shipped right now)
═══════════════════════════════════════════════════════════════════════

Production alias: https://tamazia-website.pages.dev
Round 13 deploy: https://51d5bb25.tamazia-website.pages.dev

Audit verdict (run r13-final-1777375820, 28 April 2026):
  • Total checks: 889
  • PASS: 256 · FAIL: 11 · SKIP: 622 · ERROR: 0
  • P0: 0 · P1: 1 (DMARC, DNS-only) · P2: 5 · P3: 0
  • Lighthouse mobile perfect 1.00 · desktop 0.99 · zero CWV violations
  • Mobile LCP 1.6s · FCP 1.4s · CLS 0.037 · TBT 50ms
  • Desktop LCP 0.8s · FCP 0.7s · CLS 0.045 · TBT 0ms

The site is production-ready. The only outstanding gate is DNS cutover.

Verify Round-13 markers are live by hitting https://tamazia-website.pages.dev with WebFetch. Confirm:
  ✓ String "200+ regulatory frameworks reviewed per campaign" appears at least twice
  ✓ class="cta-row" appears
  ✓ class="signature" appears inside .cta-row
  ✓ class="laws-strip" appears
  ✓ class="regulation-ribbon" appears
  ✓ Real `<link rel="preload" as="font"` for `/fonts/inter-400-normal-latin.woff2` (R13 marker)
  ✓ NO occurrence of `fonts.googleapis.com` (R13 marker — fonts are self-hosted)
  ✓ /cookie-policy returns 200 with title "Cookie Policy · Tamazia"
  ✓ /privacy returns 200 with title "Privacy Notice · Tamazia"
  ✓ /terms returns 200 with title "Terms of Service · Tamazia"
  ✓ /sitemap.xml returns 200 (transparent rewrite to /sitemap-index.xml)
  ✓ /robots.txt returns 200
  ✓ /llms.txt returns 200
  ✓ /api/briefings POST with `{"email":"qa+test@example.com"}` returns 200 OK

If any check fails, the deploy regressed since R13 ship — stop and tell Aman.

═══════════════════════════════════════════════════════════════════════
§7 · FIVE ABSOLUTE RED LINES (memorise verbatim)
═══════════════════════════════════════════════════════════════════════

  R1. **No Indian jurisdiction.** Never name an Indian regulator, law, court,
      or example anywhere on the site or in any artefact. Tamazia does not
      serve the Indian market.
  R2. **"200+" everywhere.** Marquee labels read "200+ regulatory frameworks
      reviewed per campaign". H1 subtext "200+ frameworks reviewed, every
      word." Never "45". Never bare "200".
  R3. **"Aman Pareek" always capitalised.** Capital A, capital P. Code,
      comments, alt text, screen reader text — anywhere it ships.
  R4. **No em dashes used as pauses.** Period or inline phrase instead. Hard
      style rule everywhere.
  R5. **No consumer-SaaS playbooks.** No "Get started free", no virality
      framing, no growth-hack copy. Reference brief: Patek Philippe and
      Hermès institutional editorial. Not Stripe, not Linear.

═══════════════════════════════════════════════════════════════════════
§8 · STANDING RULES (apply forever in every Tamazia session)
═══════════════════════════════════════════════════════════════════════

  R6. **Lead with conclusion, reasoning after.** Rank options. State
      recommendation first. Never "it depends" without immediately stating
      what it depends on and the most likely answer.
  R7. **Before any code edit that touches the live site:**
        (i)   Screenshot the current state of the affected component.
        (ii)  Show Aman the diff in plain words and pixels.
        (iii) Get explicit confirmation ("go" or "ship").
        (iv)  Only then write code.
        (v)   After deploy, paste the Cloudflare Pages URL and one
              re-screenshot of the deployed component.
  R8. **Never delete a 00-Briefs/ doc.** Audit trail. Move to 00-Briefs/_archive/
      if needed.
  R9. **Never edit .env.cloudflare beyond rotating a single value when Aman
      asks.** Never print its contents in a reply.
  R10. **If a file in §4 is missing or unreadable, stop and ask.** Do not
       guess content.
  R11. **Run the QA runner before declaring any ship done.** The runner is
       the gate. P0 = 0 + P1 only L44 (DMARC) is the production-ready signal.

═══════════════════════════════════════════════════════════════════════
§9 · TECH STACK + DEPLOY WORKFLOW (verbatim)
═══════════════════════════════════════════════════════════════════════

| Layer | Choice |
|---|---|
| SSG framework | Astro 4.16 (TypeScript) |
| Hosting | Cloudflare Pages (project name: `tamazia-website`) |
| Form handlers | Cloudflare Pages Functions (`/api/contact`, `/api/audit`, `/api/briefings`) |
| Email | Resend API (key in `.env.cloudflare`) |
| Fonts | Self-hosted, `/public/fonts/*.woff2` (Round 13) |
| Sitemap | `@astrojs/sitemap` pinned to 3.2.0 (3.7.x breaks on Astro 4) |
| Live domain | `https://tamazia-website.pages.dev` (Cloudflare); cutover to `tamazia.in` PENDING |
| Cloudflare Account ID | `4a3b271b5f1f4cbfc16c6e9e5e62451b` |
| Resend `CONTACT_FROM` | `Tamazia <onboarding@resend.dev>` (will switch to `noreply@tamazia.in` when DNS verified) |
| Resend `CONTACT_TO` | `realfamemedia@gmail.com` |
| Build command | `npm run build` (run from `03-Astro-Site/`) |
| Deploy command | `npx wrangler pages deploy /tmp/cfdeploy --project-name=tamazia-website --branch=main` |

**Sandbox build workaround** (the macOS-mounted folder has restrictive perms):
  Copy 03-Astro-Site to /tmp/tamazia-build, build there, deploy from there:
  ```
  cp -r /sessions/<id>/mnt/Tamazia-Rebuild/03-Astro-Site/* /tmp/tamazia-build/
  cd /tmp/tamazia-build && npx astro build
  rm -rf /tmp/cfdeploy && mkdir -p /tmp/cfdeploy
  cp -r /tmp/tamazia-build/dist/* /tmp/cfdeploy/
  cp -r /tmp/tamazia-build/functions /tmp/cfdeploy/
  TOKEN=$(grep '^CF_API_TOKEN=' .../03-Astro-Site/.env.cloudflare | cut -d= -f2)
  ACCOUNT=$(grep '^CF_ACCOUNT_ID=' .../03-Astro-Site/.env.cloudflare | cut -d= -f2)
  CLOUDFLARE_API_TOKEN="$TOKEN" CLOUDFLARE_ACCOUNT_ID="$ACCOUNT" \
    npx wrangler pages deploy /tmp/cfdeploy --project-name=tamazia-website \
    --branch=main --commit-message="..." --commit-dirty=true
  ```

**Sandbox runner install workaround** (45s bash timeout vs ~3min default Playwright install):
  ```
  cd 00-Briefs/qa-runner && npm install --no-audit --no-fund
  # Chunked Chromium (~192MB)
  curl -L -C - -o /tmp/chromium-1217.zip \
    "https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1217/chromium-linux-arm64.zip"
  unzip -q -o /tmp/chromium-1217.zip -d $HOME/.cache/ms-playwright/chromium-1217
  touch $HOME/.cache/ms-playwright/chromium-1217/INSTALLATION_COMPLETE
  # Headless-shell variant (~108MB)
  curl -L -C - -o /tmp/headless-shell-1217.zip \
    "https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1217/chromium-headless-shell-linux-arm64.zip"
  unzip -q -o /tmp/headless-shell-1217.zip -d $HOME/.cache/ms-playwright/chromium_headless_shell-1217
  touch $HOME/.cache/ms-playwright/chromium_headless_shell-1217/INSTALLATION_COMPLETE
  ```
  Replace `1217` with whatever version Playwright reports if it changes.

**Run the audit (chunked, fits 45s sandbox windows):**
  ```
  RUN_ID="run-$(date +%s)"
  cd 00-Briefs/qa-runner
  BASE_URL=https://tamazia-website.pages.dev RUN_ID=$RUN_ID node audit-once.js
  for r in / /insights/ /insights/legal/ /insights/legal/sra-transparency-2026/; do
    BASE_URL=https://tamazia-website.pages.dev ROUTE=$r RUN_ID=$RUN_ID node audit-route.js
  done
  BASE_URL=https://tamazia-website.pages.dev ROUTE=/ FORM_FACTOR=mobile RUN_ID=$RUN_ID node audit-perf.js
  BASE_URL=https://tamazia-website.pages.dev ROUTE=/ FORM_FACTOR=desktop RUN_ID=$RUN_ID node audit-perf.js
  RUN_ID=$RUN_ID node audit-merge.js
  cat reports/$RUN_ID/master-report.md
  ```

═══════════════════════════════════════════════════════════════════════
§10 · COMMUNICATION RULES (Aman's permanent preferences)
═══════════════════════════════════════════════════════════════════════

  • Direct, fast, no formality. Aman types with intentional typos in input;
    output stays precise and clean.
  • Never validate without evidence. Challenge is the service.
  • Lead with conclusion, reasoning after.
  • Rank options. State recommendation first.
  • No unsolicited frameworks (no SWOT, no Porter's, etc.).
  • Never say "it depends" without immediately stating what it depends on.
  • Resource constraint is permanent. Prioritisation beats comprehensiveness.
  • Never assume Aman wants encouragement. Accuracy only.
  • No em dashes or hyphens used as pauses. Ever.
  • No preamble, no filler, no "Great question!"
  • Audience-register rules — ask which audience before drafting if not specified:
    - Investors / sovereign wealth funds: precise, data-backed, zero fluff.
    - Co-founders: direct, no ambiguity, documented. (LexQuity only — Aman is
      sole on Tamazia.)
    - Tamazia international clients (UAE, UK, USA): commercially credible,
      outcome-focused.
    - Arbitration practitioners + institutions: formal, peer-level.

═══════════════════════════════════════════════════════════════════════
§11 · WHAT'S PENDING RIGHT NOW (the actual work queue)
═══════════════════════════════════════════════════════════════════════

**Hard blocker (only one):**

  P-1. **DNS cutover to tamazia.in.** Aman's responsibility, not the runner's.
       Steps:
       (a) Point apex `tamazia.in` and `www.tamazia.in` at Cloudflare Pages
           (project `tamazia-website`).
       (b) In Resend dashboard, verify `tamazia.in` as sender domain.
           Publish the SPF TXT and DKIM CNAME records Resend gives.
       (c) Add DMARC TXT at `_dmarc.tamazia.in`. Suggested starter:
             `v=DMARC1; p=none; rua=mailto:realfamemedia@gmail.com`
           Tighten to `quarantine` after a week of clean reports.
       (d) Switch the `CONTACT_FROM` env var in Cloudflare Pages → Settings
           from `Tamazia <onboarding@resend.dev>` to
           `Tamazia <noreply@tamazia.in>`.
       (e) Tell new Claude session "DNS done" and we re-run the audit
           against `https://tamazia.in`. Expect L44 → PASS, P0=0, P1=0.

**Once DNS is done, queued work (no hurry, all defensible):**

  Q-1. Calendly URL embed. Aman provides the URL → drop into
       `src/content/contact.ts` `calendlyUrl`. One-line change.

  Q-2. Case-study permission emails to Orchid Hotels, CG Oncology, Meraas.
       Drafts not yet written. Best practice: confirm attribution in writing
       before pointing real clients at tamazia.in.

  Q-3. Runner V3 calibration (closes 3 of the 5 P2 false positives):
       - L17 exclude `<label class="sr-only">` (sr-only is supposed to clip)
       - L17 fix the timing race that flags .card-tooltip after my R13 fix
       - L19 weight by animation-duration (3s ambient ≠ flash)
       Estimated 30 minutes of work, no Tamazia source changes.

  Q-4. CSS payload trim (closes L28 if you ever care about <100KB).
       126KB now; Astro per-component scoped CSS is the source. Round 14.

  Q-5. TAMAZIA-13 Phase-6 30-day post-launch monitoring. Mostly automated
       already — weekly runner re-runs.

  Q-6. TAMAZIA-20's 60+ deferred animation ideas. Round 14+ enhancements.
       Not necessary to ship.

**Out of scope for this thread (Aman's other priorities):**

  • LexQuity $1M pre-seed raise (Aman's #1 priority overall)
  • LexQuity demo build (Aditya's domain)
  • King's College accelerator decision (external)
  • Tamazia international content build-out (UK / EU / USA / Middle East)

═══════════════════════════════════════════════════════════════════════
§12 · STATUS REPORT (deliver this verbatim format after §3–§6)
═══════════════════════════════════════════════════════════════════════

Once you've read everything in §3–§6 and run the live verification in §6,
deliver this exact 8-point report:

  (a) IDENTITY: One sentence on what Tamazia is + Aman's role.
  (b) MOUNT MODE: A (Desktop), B (Tamazia-Rebuild only), or C (nothing).
      If A, name the sibling Tamazia-related folders you found. If B, note
      that Aman's other Tamazia folders are not visible this session.
  (c) RED LINES: List the 5 absolute red lines verbatim.
  (d) DEPLOY URL: Latest Cloudflare Pages URL + the round it shipped.
  (e) CURRENT ROUND: Round number + the last shipped change.
  (f) CURRENT AUDIT VERDICT: P0/P1/P2/P3 counts + Lighthouse mobile + desktop
      perfScore + LCP from the latest runner report. State the run ID.
  (g) THE ONE HARD BLOCKER: DNS cutover (or "DNS done" if Aman has confirmed).
  (h) QUEUED WORK: Q-1 through Q-6 from §11, ranked by your call.
  (i) PENDING DECISIONS: anything waiting on Aman to ratify.

Do not editorialise. Eight points, exact format. Then stop and wait.

═══════════════════════════════════════════════════════════════════════
§13 · THE PROMPT TO PASTE INTO THE NEW COWORK SESSION
═══════════════════════════════════════════════════════════════════════

When Aman opens a fresh Cowork session, he should mount **Desktop** as the
workspace root (left sidebar → folder icon → select `/Users/amanigga/Desktop`).
This gives the new session access to Tamazia-Rebuild PLUS every other
Tamazia + LexQuity + client folder Aman has there. If Aman only wants the
website project, mounting Tamazia-Rebuild directly works too — the bootstrap
in §2 handles either mode.

Once mounted, paste this verbatim:

```
I'm Aman Pareek, founder and sole entrepreneur of Tamazia (LexQuity is a
separate company — different team, do not conflate). Before responding to
anything else, execute every step of this bootstrap in order. Do not skip
steps. Do not abridge.

1. Verify what's mounted. There are three possible mount modes:
   - Mode A: /Users/amanigga/Desktop is mounted (PREFERRED — gives you
     access to all 50+ Tamazia + LexQuity folders I have on Desktop).
   - Mode B: only /Users/amanigga/Desktop/Tamazia-Rebuild is mounted (narrow
     — website project only).
   - Mode C: neither is mounted — ask me to connect one. Recommend Mode A
     (mount Desktop) so you see everything.

2. Read this file in full:
   /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-31-NEXT-SESSION-BOOTSTRAP.md

3. Execute the protocol it defines:
   - §2 mount detection + (if Mode A) inventory my sibling Tamazia folders
     and write that inventory to 00-Briefs/_LOCAL-DESKTOP-INDEX.md
   - §3 master handoff reads
   - §4 source files
   - §5 runner state
   - §6 live deploy verification

4. Deliver the §12 status report — exactly 9 points (a–i), no editorialising.
   In point (b) you must state which mount mode is active and, if Mode A,
   list every sibling Tamazia-related folder you found on my Desktop.

5. Then stop and wait for my instruction.

Standing rules I expect you to honour from this session forward (these are
detailed in §7, §8, §10 of TAMAZIA-31):

- No Indian jurisdiction examples or laws — Tamazia does not serve India.
- "200+" everywhere there's a number describing laws or frameworks reviewed.
- "Aman Pareek" always capitalised. Capital A, capital P.
- No em dashes used as pauses. Period or inline phrase.
- No consumer-SaaS playbooks. Reference brief: Patek Philippe / Hermès.
- Lead with conclusion, reasoning after.
- Before any code edit on the live site: screenshot, show diff, get my "go",
  then ship.
- Run the QA runner before declaring any ship done.
- Never edit .env.cloudflare or echo its contents.
- Treat all of /00-Briefs/ as audit trail — never delete; archive to
  /00-Briefs/_archive/ if anything needs to move.
- The Tamazia-Rebuild folder is the source of truth for every Tamazia-website
  decision. Other Desktop folders (Ohotel blogs, tamazia, Subject Notes LLM,
  client logo folders, etc.) are reference assets I may point you at for
  separate work streams (client deliverables, content reference, sector
  intelligence). Read what's already in /00-Briefs/ before asking me to
  repeat anything.
```

═══════════════════════════════════════════════════════════════════════
§14 · END
═══════════════════════════════════════════════════════════════════════

If Round 14 happens, append a §6 row to TAMAZIA-22 with the new deploy URL,
write a TAMAZIA-32-ROUND-14-FINAL.md milestone, and update §3 of THIS file
to reference the new milestone as the most recent.

If anything in §4 or §5 changes structurally (file moved, runner refactored,
new layer file added, sandbox workaround changes), update §4/§5/§9 here so
the next session doesn't go off a stale map.
