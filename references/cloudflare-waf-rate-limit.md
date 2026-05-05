# Cloudflare WAF + Rate Limit · Tamazia · Phase 7

Apply order at dash.cloudflare.com → tamazia.co.uk zone (account 4a3b271b5f1f4cbfc16c6e9e5e62451b).

## 1 · Rate-limiting rules (Security → WAF → Rate limiting rules)

### 1.1 contact + briefings receivers (anti-abuse)
- **Name**: form-receiver-rl
- **If incoming requests match**: `(http.request.uri.path eq "/api/contact") or (http.request.uri.path eq "/api/briefings") or (http.request.uri.path eq "/api/audit")`
- **Then**: Block · 1 minute · `mitigation duration: 1 minute`
- **With characteristics**: IP address
- **Threshold**: 5 requests per 1 minute
- **Counting expression**: same as If
- Notes: Honeypot + 2-second time-trap already filter spray bots. This catches per-IP burst (5 forms/minute is unreachable for legitimate users).

### 1.2 admin-submissions reader (defence-in-depth)
- **Name**: admin-rl
- **If**: `http.request.uri.path eq "/api/admin-submissions"`
- **Threshold**: 30 requests per 1 minute per IP
- **Action**: Managed Challenge

### 1.3 cal-webhook (rate cap on webhook surface)
- **Name**: cal-webhook-rl
- **If**: `http.request.uri.path eq "/api/cal-webhook"`
- **Threshold**: 60 requests per 1 minute per IP
- **Action**: Block 1 minute
- Note: Cal.com retries on failure but won't legitimately exceed 60/min. HMAC verification is the primary defence.

## 2 · WAF custom rules (Security → WAF → Custom rules)

### 2.1 Block known-bad UA fingerprints
- **Name**: block-spam-ua
- **If**: `(http.user_agent contains "ZGrab") or (http.user_agent contains "MJ12bot") or (http.user_agent contains "AhrefsBot" and not http.request.uri.path matches "^/(robots\\.txt|sitemap)") or (http.user_agent contains "SemrushBot") or (http.user_agent contains "DotBot") or (http.user_agent eq "")`
- **Action**: Block
- Note: AhrefsBot allowed on /robots.txt + /sitemap.xml only.

### 2.2 Block scrapers hitting receivers
- **Name**: block-scrapers-on-receivers
- **If**: `(http.request.uri.path matches "^/api/(contact|briefings|audit)") and ((cf.client.bot) or (http.user_agent contains "python-requests") or (http.user_agent contains "curl/") or (http.user_agent contains "Go-http-client"))`
- **Action**: Managed Challenge
- Note: Real form fills come from browsers. Scripted POSTs without Turnstile token are bait.

### 2.3 Geographic enforcement on /admin/*
- **Name**: admin-geo-fence
- **If**: `(http.request.uri.path matches "^/admin/") and not (ip.geoip.country in {"GB" "IN" "AE" "FR" "DE" "ES" "IT" "PT" "NL" "BE" "IE" "US"})`
- **Action**: Block
- Note: Operator-only paths. Adjust country list to match operator travel.

### 2.4 Method enforcement on receivers
- **Name**: receivers-methods
- **If**: `(http.request.uri.path matches "^/api/(contact|briefings|audit)") and not (http.request.method in {"POST" "OPTIONS"})`
- **Action**: Block
- Note: GET on receivers gets no useful response anyway, but blocking here saves a Worker invocation.

### 2.5 List-Unsubscribe POST allowlist
- **Name**: lu-post
- **If**: `(http.request.uri.path eq "/api/list-unsubscribe") and (http.request.method ne "POST" and http.request.method ne "GET")`
- **Action**: Block

## 3 · Managed rulesets (Security → WAF → Managed rules)

Enable at default sensitivity:
- **Cloudflare Managed Ruleset**: ON (Default)
- **Cloudflare OWASP Core Ruleset**: ON · Score threshold: Medium · Action: Managed Challenge
- **Cloudflare Free Managed Ruleset**: ON
- **Bot Fight Mode**: ON (Security → Bots)

## 4 · Page Rules (Caching → Page Rules)

### 4.1 KV-write surface no-cache
- URL: `tamazia.co.uk/api/*`
- Settings: Cache Level = Bypass

### 4.2 /admin/* bypass
- URL: `tamazia.co.uk/admin/*`
- Settings: Cache Level = Bypass · Always Use HTTPS = ON

## 5 · Verification

After applying, run from a fresh browser:
```
for i in $(seq 1 7); do
  curl -X POST -d '{"email":"abuse-test@example.com","name":"abuse"}' \
       -H "Content-Type: application/json" https://tamazia.co.uk/api/contact -i | head -1
done
```

Expected: first 5 return HTTP 200, requests 6 and 7 return HTTP 429 with the form-receiver-rl rule name in `cf-mitigated` header.

## 6 · Post-application audit

Post the screenshot of the rate limit rules tab back to references/screenshots/cf-rate-limit-applied-2026-05-XX.png and attach to verification gate.
