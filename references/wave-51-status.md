# Wave 51 status · operator action drive · 2026-05-06

## Completed in this session

### GitHub PAT scope rotation
- Sudo verification cleared (code 35267314 from realfamemedia@gmail.com inbox)
- Token `tamazia-deploy-phases` updated:
  - Actions: Read+Write
  - Administration: Read+Write
  - Workflows: Read+Write
  - Contents: Read+Write (already)
  - Metadata: Read-only (required, mandatory)

### Deferred workflows pushed
Commit `745dd8f` Wave 51:
- `.github/workflows/deploy.yml` updated · concurrency block + post-deploy synthetic check
- `.github/workflows/lighthouse-pa11y.yml` created
- `.github/workflows/synthetic-check.yml` created
- `.github/workflows/weekly-backup.yml` created
- `.github/workflows/codeql.yml` created

### Branch protection on main
Applied via API:
- `allow_force_pushes`: false
- `allow_deletions`: false
- `enforce_admins`: false (admin override allowed)
- `required_pull_request_reviews`: null (single-dev workflow)
- `required_status_checks`: null

### Live deploy verified
- `https://tamazia.co.uk/api/health` → 200
- `https://tamazia-website.pages.dev/api/health` → 200
- version: `745dd8f`
- KV: bound · Resend: configured · Cal webhook: configured

## Hard blocker · zone-holding Cloudflare login required

The remaining 6 tasks require the Cloudflare account that owns zones
`tamazia.co.uk` and `tamazia.in`. That zone-holding login is **not**
the same as the realfamemedia@gmail.com login currently in browser.

Verified: `curl /zones?per_page=50` against the new API token
`cfut_REDACTED` returns
`total=0` because the realfamemedia login owns 0 zones.

The zones are in a separate Cloudflare login (likely
amanpareek.pareek@gmail.com or a third email) that needs to be
either:
- A) logged into this browser tab, or
- B) used to mint a Cloudflare API token with Zone:DNS:Edit + Zone Settings:Edit + WAF:Edit + Bot Management:Edit, then that token pasted here

### Tasks blocked on zone access
1. DMARC reject move on `_dmarc.tamazia.co.uk` and `_dmarc.tamazia.in` (TXT update)
2. MTA-STS TXT records on `_mta-sts.tamazia.co.uk` and `_mta-sts.tamazia.in`
3. TLS-RPT TXT records on `_smtp._tls.tamazia.co.uk` and `_smtp._tls.tamazia.in`
4. Resend 3 records on tamazia.in (rs1._domainkey, rs2._domainkey, send)
5. Cloudflare WAF · 5 custom rules on tamazia.co.uk zone
6. Cloudflare Rate Limit · 3 rules on tamazia.co.uk zone
7. Cloudflare Bot Fight Mode toggle on tamazia.co.uk zone
8. Cloudflare Access policy on `/admin/*` (zone-level binding)

### Once unblocked

Run from this repo:
```
CF_TOKEN="<new-token-from-zone-account>"
ZONE_CO_UK=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=tamazia.co.uk" -H "Authorization: Bearer $CF_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['id'])")
ZONE_IN=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=tamazia.in" -H "Authorization: Bearer $CF_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['id'])")
# Then run scripts/cf-dns-bulk-apply.sh (to be created with the discovered IDs)
```

A bulk-apply script will be drafted once zone IDs are available so the
6 zone-side tasks complete in one round-trip.
