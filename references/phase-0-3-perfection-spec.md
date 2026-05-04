# Phase 0/1/2/3 Perfection Spec · 2026-05-04

Founder-mode perfection sweep. Every Phase 0/1/2 carry-over folds in. Every gap genuinely uncovered during the audit appears here. Execution proceeds in 7 waves with backtest-first protocol.

## Backtest protocol applied to every change

1. Read current state
2. State the hypothesis (what's broken / missing / unsafe)
3. Cite the standard or evidence (RFC, browser docs, vendor docs, observed behaviour)
4. Implement the smallest viable change
5. Verify on the live site or via dig/curl/lighthouse/headers
6. Note in the gap log if anything new surfaced

## Wave 1 · Repository security hygiene

| Item | Reason | Spec |
| --- | --- | --- |
| /.well-known/security.txt | RFC 9116 · standard channel for vulnerability reports | Contact founder@tamazia.co.uk, Expires 2027-05-04, Preferred-Languages en, Canonical https://tamazia.co.uk/.well-known/security.txt |
| /humans.txt | Signals real human team, micro-trust | Names of Aman + Manuel + Danish + advisors |
| /.well-known/change-password | RFC 8615 · password manager UX | redirects to /privacy/ since no auth on site |
| Cross-Origin-Opener-Policy header | mitigates XS-Leaks | same-origin |
| Cross-Origin-Embedder-Policy header | enables SharedArrayBuffer + tighter isolation | credentialless |
| Cross-Origin-Resource-Policy header | prevents resource theft | same-site |
| Permissions-Policy header (full) | modern Feature-Policy replacement | camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=() |
| HSTS preload submission | force HTTPS at browser level | submit to hstspreload.org after 7 days clean |
| Subresource Integrity on CDN scripts | tamper detection on third-party JS | SHA-384 hashes for any external script |
| CSP report-only mirror | catch unintended violations | csp-report-only header pointing to /csp-report |
| .gitignore audit | ensure .env.cloudflare not tracked | grep + verify |
| /.well-known/dnt-policy.txt | EFF Do Not Track honour signal | one-line per spec |

## Wave 2 · SEO and crawl hygiene

| Item | Reason | Spec |
| --- | --- | --- |
| AI training opt-out in robots.txt | block GPTBot/ClaudeBot/CCBot/anthropic-ai/PerplexityBot/Google-Extended | Disallow each explicitly |
| noindex on /api/* in robots | prevent function endpoints surfacing in SERPs | Disallow already there, add explicit X-Robots-Tag header in functions |
| sitemap lastmod per URL | helps crawlers prioritise | Astro sitemap config supports this |
| FAQ schema on /sectors/aesthetic-clinics | rich result eligibility | when content lands |
| Organization schema with full address | Knowledge Graph eligibility | UK Companies House registered office TBD |
| Breadcrumb schema on every inner page | enhances SERP visibility | Astro middleware |
| og:locale + og:site_name on every page | proper OG enrichment | en_GB + Tamazia |
| hreflang declaration | en-GB self-reference | x-default + en-GB |
| canonical link rel | already present, audit consistency | dist scan |
| 404 page custom design | brand-aligned not Cloudflare default | src/pages/404.astro |
| 500 page custom design | same | _redirects fallback rule |

## Wave 3 · Compliance + legal pages

| Item | Reason | Spec |
| --- | --- | --- |
| Cookie banner with Consent Mode v2 | UK GDPR + Google enforcement | minimal banner, 4 categories, denied-by-default |
| /privacy/ full content | Art. 13 UK GDPR data subject rights detail | rewrite with all 8 rights enumerated, lawful bases, retention, transfers, DPO contact |
| /terms-of-service/ | every B2B site needs this | mirror standard SaaS ToS adapted to services |
| /acceptable-use/ | governance signal | one-page AUP |
| /cookie-policy/ | separate from privacy, what each cookie does | one-page list |
| /modern-slavery-statement/ | UK Modern Slavery Act signal even below £36M | one-page statement |
| /complaints/ | ICO signpost | one-page with email + ICO escalation path |
| ICO registration | fee from £40/yr · Aman is data controller | website footer link to certificate |
| Footer · company name + reg number + address + VAT if applicable | UK Companies Act 2006 s.82 + Companies (Trading Disclosures) Regs 2008 | Tamazia Pvt Ltd · CIN · Indian registered office (until UK Ltd incorporated) |
| DPO contact | founder@tamazia.co.uk explicitly named | same |
| Data Controller identification on /privacy/ | Art. 13(1)(a) UK GDPR | full legal name + address |

## Wave 4 · Phase 0/1 carry-overs

| Item | Status | Action |
| --- | --- | --- |
| CAA records on tamazia.in | UI-only deferred | Drive Cloudflare UI now, 4 records: 0 issue letsencrypt.org, 0 issue google.com, 0 issuewild ; (none), 0 iodef mailto:founder@tamazia.co.uk |
| CAA records on tamazia.co.uk | UI-only deferred | Same 4 records |
| Branch protection on main | needs PAT with admin scope | Stage YAML in references/_pending-workflow-changes/, document the 30-second user task |
| Weekly backup workflow | workflow PAT scope needed | Stage in references/_pending-workflow-changes/ |
| Lighthouse + Pa11y baseline | workflow scope | Stage |
| Sitemap filter for /privacy/ canonical drift | already done in Phase 0 | verify |
| /csp-report endpoint | already done | verify post-deploy |
| Branch dependabot config | new gap | add .github/dependabot.yml, stage |
| CodeQL scanning workflow | new gap | stage |
| Secret scanning verification | GitHub built-in but unconfirmed | document verification path |

## Wave 5 · Phase 2 carry-overs and email reputation

| Item | Status | Action |
| --- | --- | --- |
| Microsoft JMRP signup | not started | drive postmaster.live.com signup, capture FBL setup |
| Yahoo Sender Hub (CFL) | not started | sender.yahooinc.com Complaint Feedback Loop · accepts both .in and .co.uk |
| AOL Postmaster | shut down 2017 | skip |
| List-Unsubscribe RFC 8058 template | not done | both mailto + URL + One-Click POST endpoint at /api/list-unsubscribe |
| MTA-STS + TLS-RPT for tamazia.co.uk | deferred | reactivate · MX is Cloudflare with valid certs · enforce mode benefits us |
| MTA-STS for tamazia.in | deferred | testing mode only since BigRock cert chain less predictable |
| BIMI prep | done · placeholder doc | revisit when revenue justifies VMC £1k/yr |
| NeverBounce 1000 free | not done | signup, store API key |
| Hunter 25/mo free | not done | signup, store API key |
| ZeroBounce 100 free | not done | signup, store API key |
| Mail-Tester | free per-test | bookmark · no signup needed |
| dmarcian | done · pivoted to Postmark | leave |
| Yahoo SDA / Comcast SNDS | shared IP at BigRock makes IP-based dashboards low value | skip with reasoning |
| Resend domain verification for tamazia.in | needed before Phase 3 auto-ack | add resend._domainkey + amend SPF |
| Reply-To strategy doc | done | verify |

## Wave 6 · Phase 3 build (12 sub-items)

Already documented in references/phase-3-roadmap.md. Augmented here with newly surfaced gaps:

| Sub-item | Augmentation |
| --- | --- |
| 3-1 Sheet | add Apps Script daily archive to a separate tab to prevent the working tabs from blowing past 5M cell cap |
| 3-2 Apps Script receiver | add request dedupe by hash(email + intent + 24h window) so a duplicate-click visitor doesn't double-fire |
| 3-3 CF Functions | add structured logging via console.log JSON so CF logs are queryable |
| 3-4 Rate limit | also add IP geo-blocking for tier-1 spam origins (.ru, .cn, .ng, .ph, .id) configurable via env |
| 3-5 Bot defences | add Cloudflare WAF managed challenge for known bot user agents + ASN block list |
| 3-6 Auto-ack | render persona-aware copy (which of the 5 personas signed off · default founder@) |
| 3-7 Internal alert | add a "tamazia.co.uk reply trigger" Gmail filter pre-built so all auto-acks are auto-archived in inbox |
| 3-8 Resend wiring | add SES-style sandbox-to-production gate · wait for Resend to verify DKIM before flipping a feature flag |
| 3-9 Watchdog | extend to probe 6 endpoints (homepage, contact, briefings, audit, sitemap, /.well-known/security.txt) |
| 3-10 Dashboard | render via mcp__cowork__create_artifact so user can re-open without context |
| 3-11 KV redundancy | also write to R2 daily compressed snapshot for long-term audit |
| 3-12 Bug test | extend to 14 levels (see below) |

## Wave 7 · Phase 0-3 final 14-level bug test

Replacing the planned 7-level test with 14 levels since perfection is the goal.

1. Honeypot-only POST → 200 silent ignore
2. Time-trap fail → 200 silent ignore
3. HMAC missing → 401
4. HMAC wrong → 403
5. Apps Script down → 502 + KV write + retry succeeds
6. Sheet write fail → error tab + alert email
7. Auto-ack idempotency on duplicate request_id → 1 ack only
8. CSP violation triggers /csp-report POST and Sheet errors-tab row
9. /.well-known/security.txt resolves with valid Expires header in future
10. CAA query returns letsencrypt + google + iodef on both domains
11. DMARC record query returns Postmark rua first, gmail second
12. Postmaster Tools dashboards show data within 7 days of test send
13. List-Unsubscribe One-Click POST returns 200 with no body
14. /api/health returns 200 with all 6 endpoints ok and SHEETS_WEBHOOK_URL probe passing

## Genuine gap log (italicised additions appear at end of each wave)

Started empty. Will populate during execution.
