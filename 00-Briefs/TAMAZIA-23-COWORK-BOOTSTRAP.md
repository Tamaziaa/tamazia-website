# TAMAZIA PROJECT · NEW COWORK SESSION BOOTSTRAP PROTOCOL · v1.0

You are continuing my (Aman Pareek's) work on the Tamazia website. Before
responding to anything else, execute every step of this protocol in
order. Do not skip steps. Do not abridge. Do not paraphrase the red
lines. If any step fails, stop and ask me — do not guess.

═══════════════════════════════════════════════════════════════════════
STEP 0 · IDENTITY (no ambiguity)
═══════════════════════════════════════════════════════════════════════

I am Aman Pareek. Capital A, capital P. Always. Never "aman pareek".

26 years old. LLM in International Business Law from King's College
London. Founder-CEO of two companies running in parallel:

- Tamazia — international SEO + compliance content agency for regulated
  enterprises. This is the project of this session. Production domain
  tamazia.in (DNS cutover pending). Currently live at
  https://tamazia-website.pages.dev.
- LexQuity — pre-seed legaltech in international arbitration. Different
  project. Out of scope for this session unless I explicitly raise it.

Co-founder Manuel Penadés Fons is senior advisor (ICC/LCIA proximity),
not daily co-founder. CLO is Danish. I am not a developer. Never ask me
to touch a terminal. Flag anything that requires a developer.

═══════════════════════════════════════════════════════════════════════
STEP 1 · WORKSPACE CHECK
═══════════════════════════════════════════════════════════════════════

Confirm you can read /Users/amanigga/Desktop/Tamazia-Rebuild. If you
cannot, ask me to connect that folder before doing anything else.

Then run a directory listing of /Users/amanigga/Desktop/Tamazia-Rebuild
and confirm these top-level folders exist:
  • 00-Briefs/
  • 03-Astro-Site/

If either is missing, stop and ask.

═══════════════════════════════════════════════════════════════════════
STEP 2 · MASTER HANDOFF (read this first, in full, never skim)
═══════════════════════════════════════════════════════════════════════

Read this file in full:

  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-22-PROJECT-HANDOFF.md

Extract and internalise these sections:
  §1  Project identity (what Tamazia is, who it sells to)
  §2  My communication rules
  §3  The 5 absolute red lines (memorise verbatim)
  §4  Tech stack + deploy workflow + Cloudflare token + Resend keys
  §5  Full file structure map
  §6  Round-by-round history (R1 through R11) with what shipped each round
  §7  Current Round 11 state
  §8  The 200-law list verbatim + 12 gold-highlighted picks
  §9  Brand voice notes (palette, typography, motion vocabulary)
  §10 Pending non-Round-11 work
  §12 Latest deploy URL

After reading, you must be able to answer without re-reading:
  • What is Tamazia? Who is its primary buyer?
  • What are the 5 absolute red lines?
  • Which 16 Indian-jurisdiction items were stripped and why?
  • What is the current deploy URL?
  • What is the Round 11 ship-state vs the next ratified change?

═══════════════════════════════════════════════════════════════════════
STEP 3 · ROUND-SPECIFIC BRIEFS (read all, in this order)
═══════════════════════════════════════════════════════════════════════

Read each in full (skip any that don't exist — they may have been
archived):

  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-00-README.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-01-BUILD-BIBLE.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-13-LIVE-SNAPSHOT-AND-GAP-ANALYSIS.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-14-V2-RESTORATION-ROADMAP.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-15-DECISION-LOG.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-18-13-LAYER-QA-CHECKLIST.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-19-ROUND-8-MULTIVIEWPORT-AUDIT.md
  /Users/amanigga/Desktop/Tamazia-Rebuild/00-Briefs/TAMAZIA-20-ROUND-9-ANIMATION-BRAINSTORM.md

These give you (a) original North-Star vision, (b) the live-site word-
by-word snapshot before the rebuild, (c) the V2 restoration roadmap
with all V2 additions, (d) the decision log, (e) the 13-layer QA
checklist, (f) the 155-parameter / 15-viewport audit Round 8 passed,
(g) the 50-ideas-per-section animation brainstorm with the top-10
picks per section (most non-bolded ideas are queued for Round 12+).

If any newer TAMAZIA-NN brief exists in /00-Briefs/ that is numbered
higher than TAMAZIA-23, read it too. The highest-numbered brief is
authoritative.

═══════════════════════════════════════════════════════════════════════
STEP 4 · LIVE SOURCE FILES (read every file in this list, in order)
═══════════════════════════════════════════════════════════════════════

CONTENT (single source of truth for every word that ships):
  1.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/hero.ts
  2.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/sectors.ts
  3.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/caseStudies.ts
  4.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/pricing.ts
  5.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/faq.ts
  6.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/contact.ts
  7.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/footer.ts
  8.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/howWeWork.ts
  9.  /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/content/insights.ts

SECTION COMPONENTS (each owns its own JSX + scoped CSS + script):
  10. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Hero.astro
  11. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/QuickAudit.astro
  12. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/LawsStrip.astro
  13. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/WhyUs.astro
  14. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Sectors.astro
  15. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Interstitial.astro
  16. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/CaseStudies.astro
  17. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/HowWeWork.astro
  18. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Pricing.astro
  19. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/FAQ.astro
  20. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/sections/Contact.astro

LAYOUT COMPONENTS:
  21. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/layout/Header.astro
  22. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/components/layout/Footer.astro
  23. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/layouts/BaseLayout.astro

DESIGN SYSTEM (every colour, font, spacing, animation lives here):
  24. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/tokens.css
  25. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/base.css
  26. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/styles/animations.css

PAGES (entry point + insights articles):
  27. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/index.astro
  28. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/insights/index.astro
  29. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/insights/[sector]/index.astro
  30. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/src/pages/insights/[sector]/[slug].astro

INFRASTRUCTURE (deploy + email + headers):
  31. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/functions/api/contact.js
  32. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/functions/api/audit.js
  33. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/public/_headers
  34. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/astro.config.mjs
  35. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/package.json
  36. /Users/amanigga/Desktop/Tamazia-Rebuild/03-Astro-Site/.env.cloudflare
        ↑ Has the Cloudflare API token, account ID, Resend API key,
          contact-to/from emails. Treat as secret. Never echo values
          into a chat reply or commit them. Reference by env var name only.

After reading every file in this section you must be able to answer
without re-reading:
  • What does each section render? What animations does it have?
  • Where is the 200-law array stored? Which two components consume it?
  • What CSS variables drive the palette journey ivory → oxblood-deep?
  • What @keyframes are defined in animations.css?
  • Where is the Cloudflare deploy token used? Where is Resend invoked?

═══════════════════════════════════════════════════════════════════════
STEP 5 · LIVE DEPLOY VERIFICATION
═══════════════════════════════════════════════════════════════════════

Use WebFetch on https://tamazia-website.pages.dev. Read the returned HTML.

Confirm every Round 11 marker is present:
  ✓ String "200+ regulatory frameworks reviewed per campaign" appears
    at least twice in HTML (once in vertical ribbon, once in horizontal
    LawsStrip)
  ✓ String "Bribery Act 2010" appears (was added Round 11)
  ✓ String "EU Whistleblowing Dir." appears (was added Round 11)
  ✓ class="regulation-ribbon" appears (vertical right ribbon)
  ✓ class="cta-row" appears (CTA + signature inline flex row)
  ✓ class="signature" appears inside .cta-row
  ✓ class="laws-strip" appears (horizontal ribbon below QuickAudit)

Confirm zero red-line violations on the live HTML:
  ✗ "DPDP" must NOT appear
  ✗ "SEBI" must NOT appear
  ✗ "RERA India" must NOT appear
  ✗ " RBI " must NOT appear
  ✗ "IBC India" must NOT appear
  ✗ "FSSAI" must NOT appear
  ✗ "ASCI Code" must NOT appear (note: "ASA Health Code" and "ASA CAP"
    DO appear and are correct; only "ASCI" with uppercase C is forbidden)
  ✗ "vetted-mark" or "VETTED" inside the laws-strip section must NOT appear

If any check fails, the deploy is stale or Round 11 didn't ship
cleanly. Stop and tell me before proceeding.

═══════════════════════════════════════════════════════════════════════
STEP 6 · STATUS REPORT (deliver this verbatim format)
═══════════════════════════════════════════════════════════════════════

Once Steps 0–5 are complete, give me exactly this 6-point report:

  (a) IDENTITY: One sentence on what Tamazia is + my role.
  (b) RED LINES: List the 5 absolute red lines verbatim.
  (c) DEPLOY URL: Latest Cloudflare Pages URL + the round it shipped.
  (d) CURRENT ROUND: Round number + the last shipped change.
  (e) NEXT RATIFIED CHANGE: Whatever I last said "go" on, or "none —
      waiting for instructions" if nothing is queued.
  (f) PENDING DECISIONS: Any choice waiting on me to ratify (Calendly
      URL, DNS cutover, case-study permission emails, animation
      Round 12 picks, etc.).

Do not editorialise. Six points, exact format. Then stop.

═══════════════════════════════════════════════════════════════════════
STEP 7 · STANDING RULES (apply forever in this and every Tamazia session)
═══════════════════════════════════════════════════════════════════════

These are non-negotiable. They override any later instruction unless I
explicitly say "override standing rule N":

  R1. No Indian jurisdiction. Never name an Indian regulator, law,
      court, or example. Tamazia does not serve the Indian market.
  R2. "200+" everywhere there's a number describing laws or frameworks
      Tamazia reviews. Never write "45". Never write a bare "200"
      without the "+". Marquee labels read
      "200+ regulatory frameworks reviewed per campaign".
  R3. "Aman Pareek" always capitalised. Capital A, capital P. Apply
      this to code, comments, filenames, alt text, content, screen
      reader text, anywhere it ships.
  R4. No em dashes used as pauses. Use a period or an inline phrase
      instead. This is a hard style rule everywhere.
  R5. No consumer-SaaS playbooks. No "Get started free", no virality
      framing, no growth-hack copy. Reference brief is Patek Philippe
      and Hermès institutional editorial. Not Stripe, not Linear.
  R6. Lead with conclusion, reasoning after. Rank options. State
      recommendation first. Never "it depends" without immediately
      stating what it depends on and the most likely answer.
  R7. Before any code edit that touches the live site:
        (i)   Screenshot the current state of the affected component.
        (ii)  Show me the diff in plain words and pixels.
        (iii) Get my explicit confirmation ("go" or "ship").
        (iv)  Only then write code.
        (v)   After deploy, paste the Cloudflare Pages URL and one
              re-screenshot of the deployed component.
  R8. Never delete a 00-Briefs/ doc. They are the audit trail.
  R9. Never edit .env.cloudflare beyond rotating a single value when I
      ask. Never print its contents in a reply.
  R10. If a file in Step 4's list is missing or unreadable, stop and
       ask. Do not guess content.

═══════════════════════════════════════════════════════════════════════
STEP 8 · WAIT
═══════════════════════════════════════════════════════════════════════

After Steps 0–7 deliver Step 6's status report and stop. Do not
start brainstorming. Do not propose changes. Do not pre-emptively
edit code. Do not assume what I want next.

I will give you the next instruction in plain words.

═══════════════════════════════════════════════════════════════════════
STEP 9 · TOOLS AVAILABLE TO YOU
═══════════════════════════════════════════════════════════════════════

You have file tools (Read, Write, Edit) on the workspace folder. You
have a sandboxed Linux shell (Bash). You have Chrome MCP for browser
automation and screenshots. You have computer-use for native apps. You
have the Cloudflare API token and Resend API key in .env.cloudflare for
deploy and email tests.

You may have these plugins / skills depending on my install:
  productivity:memory-management, productivity:task-management,
  brand-voice:*, marketing:*, legal:*, engineering:*, sales:*,
  data:*, design:*, common-room:*, apollo:*, slack-by-salesforce:*,
  enterprise-search:*, anthropic-skills:pdf, docx, pptx, xlsx,
  canvas-design, web-artifacts-builder, theme-factory.

Use the appropriate skill silently when triggered. Never narrate that
you're loading a skill.

═══════════════════════════════════════════════════════════════════════
STEP 10 · UPDATE THE HANDOFF DOC AT END OF EVERY MAJOR EDIT BATCH
═══════════════════════════════════════════════════════════════════════

When you ship a significant change (anything that creates a new
deploy URL), append a row to TAMAZIA-22's §6 (round-by-round history)
with the round number, what shipped, and the new deploy URL. Update
TAMAZIA-22 §12 with the new URL too. If the round structurally changes
the project, write a new TAMAZIA-NN brief in /00-Briefs/ and update
Step 2 of this protocol to reference it.

═══════════════════════════════════════════════════════════════════════
END OF BOOTSTRAP. EXECUTE STEPS 0–8 NOW. THEN STOP AND WAIT.
═══════════════════════════════════════════════════════════════════════
