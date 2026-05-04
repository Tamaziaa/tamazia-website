# Full Remaining Roadmap · 2026-05-05

Founder-mode end-to-end execution. Every previously-deferred item folds in. No "5-minute user task" exit hatch. If a task requires browser automation through Apps Script, Resend, JMRP, GitHub branch protection, Cal.com, GSC, GA4, Bing, NeverBounce, Hunter, Mail-Tester, IndexNow, Cloudflare WAF, or Cloudflare Rate Limit, I drive the UI directly.

## Wave 8 · Phase 3 closure (drive every "user task")

| ID | Item | Drive method |
| --- | --- | --- |
| W8-1 | Apps Script project · paste Code.gs · deploy as Web App | Chrome MCP @ script.google.com |
| W8-2 | Tamazia Form Submissions Sheet · create + bind to Apps Script | Chrome MCP @ docs.google.com/spreadsheets |
| W8-3 | Set SHEETS_WEBHOOK_URL + SHEETS_HMAC_SECRET on Cloudflare Pages env | Chrome MCP @ Cloudflare dashboard |
| W8-4 | Update functions/api/contact.js + briefings.js + audit.js to HMAC-sign + forward + KV fallback | repo edit |
| W8-5 | Add wrangler.toml KV namespace binding form_submissions | repo edit |
| W8-6 | Cloudflare Rate Limit rules · /api/contact + /api/briefings + /api/audit | Chrome MCP @ Cloudflare dashboard |
| W8-7 | Cloudflare WAF custom rule · empty UA + curl/scrapy/python-requests block | Chrome MCP @ Cloudflare dashboard |
| W8-8 | Cloudflare Turnstile · generate site keys + embed on /contact + /briefings | Chrome MCP @ Cloudflare dashboard + repo edit |
| W8-9 | Resend domain verify for tamazia.in · resend._domainkey + SPF amend | Chrome MCP @ Resend dashboard + Cloudflare DNS |
| W8-10 | iodef CAA record for tamazia.in | Chrome MCP @ Cloudflare DNS |
| W8-11 | Common Room enrichment block in alert email · Apps Script edit | Chrome MCP @ script.google.com |
| W8-12 | Watchdog Cron Trigger Worker · 6 endpoints / 15 min cadence | repo edit + Cloudflare Workers UI |
| W8-13 | Submission dashboard widget · Cowork artifact | mcp__cowork__create_artifact |
| W8-14 | Phase 3 14-level bug test · all 14 green | bash |

## Wave 9 · Phase 0 leftovers (drive every "user task")

| ID | Item | Drive method |
| --- | --- | --- |
| W9-1 | Branch protection on main · require PR + reviews + CI + signed commits | Chrome MCP @ github.com |
| W9-2 | Weekly automated backup workflow · push deploy.yml + weekly-backup.yml | new PAT with workflow scope |
| W9-3 | Lighthouse + Pa11y baseline workflow · push lighthouse.yml + pa11y.yml | same PAT |
| W9-4 | Old ghp_ PAT revoke | Chrome MCP @ github.com |
| W9-5 | .github/SECURITY.md + CONTRIBUTING.md + CODE_OF_CONDUCT.md | repo edit |
| W9-6 | .github/ISSUE_TEMPLATE/* + PULL_REQUEST_TEMPLATE.md | repo edit |
| W9-7 | LICENSE file (proprietary, all rights reserved) | repo edit |
| W9-8 | .github/dependabot.yml | repo edit |
| W9-9 | .github/CODEOWNERS | repo edit |
| W9-10 | .github/workflows/codeql.yml | repo edit |

## Wave 10 · Phase 2 carry-overs (drive every "user task")

| ID | Item | Drive method |
| --- | --- | --- |
| W10-1 | Gmail Send-As · 5 personas | Chrome MCP @ mail.google.com |
| W10-2 | YAMM connect + Reply-To template | Chrome MCP @ yamm.com / Sheets-side |
| W10-3 | Microsoft JMRP signup | Chrome MCP @ postmaster.live.com |
| W10-4 | Yahoo Sender Hub CFL signup | Chrome MCP @ sender.yahooinc.com |
| W10-5 | NeverBounce 1000 free credits | Chrome MCP @ neverbounce.com |
| W10-6 | Hunter 25/mo free | Chrome MCP @ hunter.io |
| W10-7 | ZeroBounce 100 free | Chrome MCP @ zerobounce.net |
| W10-8 | MTA-STS + TLS-RPT for tamazia.co.uk · enforce mode | repo + Cloudflare DNS + Pages custom domain |
| W10-9 | MTA-STS for tamazia.in · testing mode | repo + Cloudflare DNS |
| W10-10 | List-Unsubscribe RFC 8058 footer template in YAMM body | YAMM template edit |

## Wave 11 · Phase 5 (Cal.com integration)

| ID | Item | Drive method |
| --- | --- | --- |
| W11-1 | Cal.com signup if not yet done | Chrome MCP @ cal.com |
| W11-2 | "30-min strategy call" event type · founder@tamazia.co.uk routing | Chrome MCP @ cal.com |
| W11-3 | Cal.com embed on /briefings page | repo edit |
| W11-4 | booking_created webhook → /api/cal-webhook · forward to Sheets bookings tab | repo edit + Cal.com webhook UI |

## Wave 12 · Phase 6 (SEO + Analytics)

| ID | Item | Drive method |
| --- | --- | --- |
| W12-1 | GSC tamazia.co.uk property add + sitemap submit | Chrome MCP @ search.google.com |
| W12-2 | GSC tamazia.in property add + sitemap submit | Chrome MCP @ search.google.com |
| W12-3 | Cloudflare Web Analytics enable on tamazia.co.uk + token in <head> | Chrome MCP + repo edit |
| W12-4 | GA4 property create + Consent Mode v2 wiring | Chrome MCP @ analytics.google.com + repo edit |
| W12-5 | Bing Webmaster Tools verification TXT | Chrome MCP @ bing.com/webmasters + Cloudflare DNS |
| W12-6 | IndexNow key file at /public + Cloudflare Function on _redirects | repo edit |
| W12-7 | Cookie banner Consent Mode v2 events fire to gtag | repo edit |

## Wave 13 · Compliance + business identity

| ID | Item | Drive method |
| --- | --- | --- |
| W13-1 | ICO registration · £40/yr · Aman as data controller | Chrome MCP @ ico.org.uk |
| W13-2 | Article 14 indirect-data-collection notice template in repo | repo edit |
| W13-3 | DPA template (Standard Contractual Clauses + UK addendum) | repo edit |
| W13-4 | DPO assessment doc · why no DPO required (below threshold) | repo edit |
| W13-5 | Footer · company name + reg number + address visible | repo edit |
| W13-6 | Case study permission letters · Kamat + CG Oncology + Meraas | YAMM personalised email batch |

## Wave 14 · Phase 7 final verification

| ID | Item | Drive method |
| --- | --- | --- |
| W14-1 | 14-level bug test · 14/14 green | bash |
| W14-2 | Lighthouse score · all pages > 95 | Chrome MCP @ pagespeed.web.dev |
| W14-3 | Pa11y zero violations | local pa11y |
| W14-4 | DMARC dashboard at Postmark · zero failed sources for 7 days | Chrome MCP @ dmarc.postmarkapp.com |
| W14-5 | hstspreload.org submission | Chrome MCP @ hstspreload.org |
| W14-6 | Mail-tester.com test mail · score >= 9/10 | Chrome MCP @ mail-tester.com |
| W14-7 | securityheaders.com scan · A+ grade | Chrome MCP @ securityheaders.com |
| W14-8 | observatory.mozilla.org scan · A grade | Chrome MCP @ observatory.mozilla.org |

## Sprint C/D/E parking lot

These engines (Cowork OS, sourcing, enrichment, research, proposals, sequences, triage, single-command launch) are the next chapter, not perfection of phases 0-3. They depend on phases 0-3 being fully closed and the form pipeline being live. They live in their own roadmap documents and are tracked but excluded from the perfection scope here.

## Order of execution

Wave 8 first because it closes Phase 3 which is the active operational gap. Wave 9 next because branch protection prevents accidental rollbacks while later waves run. Wave 10 third because email reputation infrastructure benefits from being warmed before Sprint C outreach. Wave 11 + 12 + 13 in parallel where the UI permits. Wave 14 last as the gate.

## What success looks like

Aman wakes up tomorrow and the contact form on tamazia.co.uk delivers a Sheet row + auto-ack + alert email + KV mirror within 2 seconds. The 14-level bug test runs green. Lighthouse, Pa11y, securityheaders, and observatory all show top grades. Postmaster Tools dashboards show clean DMARC pass for the first synthetic test send. ICO registration receipt is in the inbox. GSC, GA4, Bing all verified with sitemap accepted. No items remain in any "user task" column anywhere in the repo.

Last updated 2026-05-05.
