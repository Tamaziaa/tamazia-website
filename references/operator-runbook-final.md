# Operator runbook · final · Tamazia Pvt Ltd

15-20 minutes total. Do these in order.

## 1 · GitHub PAT scope rotation (5 min)

You're already in the verification flow. Steps:
1. Check inbox at realfamemedia@gmail.com for a code from GitHub.
2. Paste the 8-character code in the open browser tab and click Verify.
3. After verification, on the PAT edit page that loads:
   - Find **Repository permissions** section.
   - Set **Workflows** → Read and write
   - Set **Administration** → Read and write
   - Set **Actions** → Read and write
   - Click **Update token** at the bottom.
4. Reply "verified" in chat. I then push the deploy.yml concurrency block + 3 workflow YAMLs and apply branch protection in 30 seconds.

## 2 · Cloudflare DNS records (10 min)

You need to be logged into the Cloudflare account that holds tamazia.co.uk and tamazia.in zones.

### 2a · DMARC reject move on tamazia.co.uk

DNS → tamazia.co.uk → Records → find `_dmarc` TXT record → Edit. Replace value:

```
v=DMARC1; p=reject; rua=mailto:tamazia.co.uk@dmarc.report-uri.com,mailto:rua@dmarc.postmarkapp.com; ruf=mailto:rua@dmarc.postmarkapp.com; fo=1; adkim=r; aspf=r; pct=100
```

Save. Same change on `_dmarc.tamazia.in` TXT.

### 2b · MTA-STS TXT record on tamazia.co.uk

DNS → tamazia.co.uk → Records → Add record:
- **Type**: TXT
- **Name**: `_mta-sts`
- **Content**: `v=STSv1; id=20260504`
- **TTL**: Auto
- Save.

### 2c · TLS-RPT TXT records on both domains

DNS → tamazia.co.uk → Records → Add record:
- **Type**: TXT
- **Name**: `_smtp._tls`
- **Content**: `v=TLSRPTv1; rua=mailto:tls-rpt@tamazia.co.uk`
- Save.

Same on tamazia.in:
- **Type**: TXT
- **Name**: `_smtp._tls`
- **Content**: `v=TLSRPTv1; rua=mailto:tls-rpt@tamazia.in`
- Save.

### 2d · Resend 3 records on tamazia.in

The 3 records to add (Resend dashboard already shows verified, but if any are missing add them):

- **Type**: TXT, **Name**: `send`, **Content**: `v=spf1 include:amazonses.com ~all`
- **Type**: TXT, **Name**: `resend._domainkey`, **Content**: (Resend gives a long DKIM public key starting with `p=MIGfMA0...` — copy from resend.com/domains/tamazia.in)
- **Type**: MX, **Name**: `send`, **Priority**: 10, **Content**: `feedback-smtp.eu-west-1.amazonses.com`

To check if these are already there (auto-configured Wave 19): https://resend.com/domains/8ee66c30-ccc4-4d3e-b6d4-ad90013a8e31 — if domain shows green "Verified" you're done.

## 3 · Cloudflare WAF custom rules (5 min)

Log into the zone account → Security → WAF → Custom rules → Create rule.

Apply 5 rules per `references/cloudflare-waf-rate-limit.md`. Briefly:

**Rule 1 · block-spam-ua**
- Expression: `(http.user_agent contains "ZGrab") or (http.user_agent contains "MJ12bot") or (http.user_agent eq "")`
- Action: Block

**Rule 2 · block-scrapers-on-receivers**
- Expression: `(http.request.uri.path matches "^/api/(contact|briefings|audit)") and (http.user_agent contains "python-requests" or http.user_agent contains "curl/" or http.user_agent contains "Go-http-client")`
- Action: Managed Challenge

**Rule 3 · admin-geo-fence**
- Expression: `(http.request.uri.path matches "^/admin/") and not (ip.geoip.country in {"GB" "IN" "AE" "FR" "DE" "ES" "IT" "PT" "NL" "BE" "IE" "US"})`
- Action: Block

**Rule 4 · receivers-methods**
- Expression: `(http.request.uri.path matches "^/api/(contact|briefings|audit)") and not (http.request.method in {"POST" "OPTIONS"})`
- Action: Block

**Rule 5 · lu-post**
- Expression: `(http.request.uri.path eq "/api/list-unsubscribe") and (http.request.method ne "POST" and http.request.method ne "GET")`
- Action: Block

## 4 · Cloudflare Rate Limit rules (3 min)

Same zone account → Security → WAF → Rate limiting rules → Create rule.

**Rule 1 · form-receiver-rl**
- If: `(http.request.uri.path eq "/api/contact") or (http.request.uri.path eq "/api/briefings") or (http.request.uri.path eq "/api/audit")`
- Threshold: 5 requests per 1 minute per IP
- Action: Block 1 minute

**Rule 2 · admin-rl**
- If: `http.request.uri.path eq "/api/admin-submissions"`
- Threshold: 30 per 1 minute per IP
- Action: Managed Challenge

**Rule 3 · cal-webhook-rl**
- If: `http.request.uri.path eq "/api/cal-webhook"`
- Threshold: 60 per 1 minute per IP
- Action: Block 1 minute

## 5 · Cloudflare Bot Fight Mode (1 min)

Security → Bots → Bot Fight Mode → toggle ON. Save.

## 6 · Cloudflare Access policy on /admin/* (3 min)

Zero Trust → Access → Applications → Add an application → Self-hosted.

- **Application name**: Tamazia admin
- **Application domain**: tamazia.co.uk/admin/*
- **Identity providers**: Email (One-time PIN)
- **Policies → Add a policy**:
  - Action: Allow
  - Include: Emails: `realfamemedia@gmail.com`, `founder@tamazia.co.uk`
- Save.

## Verification

After each section, run from any terminal:

```
# DMARC
dig +short TXT _dmarc.tamazia.co.uk | grep "p=reject"

# MTA-STS
dig +short TXT _mta-sts.tamazia.co.uk | grep "v=STSv1"

# TLS-RPT
dig +short TXT _smtp._tls.tamazia.co.uk | grep "v=TLSRPTv1"

# Resend SPF
dig +short TXT send.tamazia.in | grep "v=spf1.*amazonses"

# WAF rules trigger test
for i in $(seq 1 7); do
  curl -X POST -d '{"email":"abuse-test@example.com"}' \
       -H "Content-Type: application/json" https://tamazia.co.uk/api/contact -i | head -1
done
# Expected: first 5 return 200, 6 and 7 return 429
```

Reply with results in chat. I then close out the verification gates.
