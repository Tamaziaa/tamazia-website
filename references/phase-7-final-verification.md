# Phase 7 · Final verification gate · Tamazia

Run this gate AFTER the next successful CF Pages deploy that includes the wave-19g + wave-19h pushes.

## A · Static deploy gates (32 + 4 new)

```
cd /tmp/tw-fresh
npm run build && node patch-dist.js
```
Expected: 36 PASS rows, no FAIL, exit 0.

Gates 33-36 cover the new compliance surfaces:
- 33 /legal/data-protection/ shipped with Article 27 + DPO email
- 34 /legal/dpa/ + /legal/sub-processors/ shipped (UK IDTA referenced)
- 35 footer legal-entity row reflects real entity (no aspirational "Pvt Ltd")
- 36 functions/_lib/email-validator.js + turnstile.js shipped

## B · Live API gates (8 endpoints)

```
# Health (env vars must be true after deploy + secret rebind)
curl -s https://tamazia.co.uk/api/health | python3 -m json.tool
# Expected: env_present.{RESEND_API_KEY, CAL_WEBHOOK_SECRET, INDEXNOW_KEY, ADMIN_SECRET} all true

# Cal webhook (must require HMAC, not unbound)
curl -s -i -X POST https://tamazia.co.uk/api/cal-webhook -H 'Content-Type: application/json' -d '{}' | head -3
# Expected: 401 invalid_signature (NOT 503 webhook_secret_unbound)

# Contact receiver with Turnstile (no token → 403 if TURNSTILE_SECRET_KEY bound, else passes)
curl -s -X POST https://tamazia.co.uk/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@tamazia.co.uk","name":"verification","ts_form_open":'$((($(date +%s%3N))-3000))',"company":"verify"}'
# Expected: {"ok":true,"request_id":"..."} OR {"error":"challenge_required"}

# Briefings receiver
curl -s -X POST https://tamazia.co.uk/api/briefings \
  -H 'Content-Type: application/json' \
  -d '{"email":"briefings-verify@tamazia.co.uk","ts_form_open":'$((($(date +%s%3N))-3000))'}'

# IndexNow
curl -s "https://tamazia.co.uk/api/indexnow?key=$INDEXNOW_KEY&url=https://tamazia.co.uk/"

# CSP report
curl -s -i -X POST https://tamazia.co.uk/api/csp-report -d '{"csp-report":{"violated-directive":"script-src"}}' | head -3
# Expected: 204

# NEL endpoint
curl -s -i -X POST https://tamazia.co.uk/api/nel-report -d '[]' -H 'Content-Type: application/reports+json' | head -3
# Expected: 204

# Admin submissions (auth-gated)
curl -s "https://tamazia.co.uk/api/admin-submissions?key=$ADMIN_SECRET&tab=contact&limit=5"
# Expected: {"count":N,"submissions":[...]}
```

## C · Footer + legal page surface

```
curl -s https://tamazia.co.uk/ | grep -c "Tamazia · operated by Aman Pareek (sole proprietor)"
# Expected: ≥ 1

curl -s https://tamazia.co.uk/ | grep -o "Article 27 UK Representative" | head -1
# Expected: Article 27 UK Representative

curl -s -o /dev/null -w "%{http_code}" https://tamazia.co.uk/legal/data-protection/
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" https://tamazia.co.uk/legal/dpa/
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" https://tamazia.co.uk/legal/sub-processors/
# Expected: 200
```

## D · DNS surface

```
# MTA-STS
dig +short TXT _mta-sts.tamazia.co.uk
# Expected: "v=STSv1; id=20260504"

# TLS-RPT  (pending DNS publish from earlier wave)
dig +short TXT _smtp._tls.tamazia.co.uk
# Expected: "v=TLSRPTv1; rua=mailto:tls-rpt@tamazia.co.uk"

# DMARC
dig +short TXT _dmarc.tamazia.co.uk
# Expected: v=DMARC1; p=quarantine; rua=mailto:...; ruf=mailto:...

# DKIM (Resend selector)
dig +short TXT resend._domainkey.tamazia.in

# SPF
dig +short TXT tamazia.co.uk | grep "v=spf1"
```

## E · Analytics + SEO

```
# Bing verify
curl -s https://tamazia.co.uk/ | grep -o 'msvalidate.01" content="[A-F0-9]*' | head -1

# GA4 + CF beacon (build-time tokens baked)
curl -s https://tamazia.co.uk/ | grep -o "G-4P8F2BHLFZ" | head -1
curl -s https://tamazia.co.uk/ | grep -o "f087d7b882c64c67b7ac67bf27de1c61" | head -1

# Sitemap
curl -s https://tamazia.co.uk/sitemap-index.xml | head -3

# robots.txt
curl -s https://tamazia.co.uk/robots.txt | head -5
```

## F · Lighthouse + Pa11y baseline

The CI workflow at references/pending-workflows/lighthouse-pa11y.yml runs weekly + post-deploy. Manually running:

```
npm install -g @lhci/cli@0.13.x pa11y-ci@3
lhci collect --url=https://tamazia.co.uk/ --url=https://tamazia.co.uk/contact/ --url=https://tamazia.co.uk/book/ --numberOfRuns=2
```

Targets:
- Performance ≥ 85 (mobile)
- Accessibility ≥ 95 (WCAG 2.1 AA)
- SEO ≥ 95
- Best Practices ≥ 90
- Pa11y errors ≤ 5

## G · Cookie consent flow

1. Open https://tamazia.co.uk/ in private window. Banner should appear.
2. DevTools → Application → Local Storage → tamazia-cookie-consent should be null.
3. DevTools → Network: GA4 / cloudflareinsights should NOT load.
4. Click "Accept all" on banner. Local Storage should now hold `{analytics:true, ts:<unix-ms>}`.
5. Reload page. GA4 should now load (page_view event fires).
6. Local Storage → manually edit ts to a value 14 months ago. Reload. Banner should re-appear.

## H · ICO / DPO / DPA surfaces (operational, not deploy-gated)

| Item | Status | Operator action |
|------|--------|-----------------|
| ICO registration (UK) | N/A — Indian sole prop, no UK establishment | Article 27 representative pending |
| Article 27 UK Rep | Pending | Engage EDPO or DataRep (£300-900/yr) |
| Article 27 EU Rep | Pending | Engage EDPO (covers both jurisdictions) |
| DPO contact | Live · dpo@tamazia.co.uk | CF Email Routing already created |
| DPA template | Live at /legal/dpa/ | Sign with each client at engagement |
| Sub-processors page | Live at /legal/sub-processors/ | Update when adding processor |
| Article 30 ROPA | Maintained internally | Build-and-store at references/ropa.md (NEXT) |
| Cookie banner | Live, Consent Mode v2 | Re-tested in section G |

## Sign-off

When all of A-G return PASS, mark task #83 (W14: Phase 7 final verification gate) as completed and the next phase begins.
