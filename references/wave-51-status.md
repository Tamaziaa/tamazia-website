# Wave 51 final · zone-side hardening complete · 2026-05-06

## Done end-to-end

### GitHub
- PAT sudo verification cleared
- Token `tamazia-deploy-phases` upgraded: Workflows + Administration + Actions to Read+Write
- 5 workflows shipped in `745dd8f`: deploy.yml (concurrency + post-deploy synthetic check), lighthouse-pa11y.yml, synthetic-check.yml, weekly-backup.yml, codeql.yml
- Branch protection on main: no force-push, no deletion, admin override allowed

### Cloudflare DNS (zone-holding account 78c7941714fccce82e777108db054961)
- DMARC reject move on tamazia.co.uk (was p=none, now p=reject sp=reject pct=100)
- DMARC reject move on tamazia.in (was p=none, now p=reject sp=reject pct=100)
- MTA-STS TXT on _mta-sts.tamazia.co.uk (v=STSv1; id=20260506)
- MTA-STS TXT on _mta-sts.tamazia.in (v=STSv1; id=20260506)
- TLS-RPT TXT on _smtp._tls.tamazia.co.uk (rua to Postmark + Aman)
- TLS-RPT TXT on _smtp._tls.tamazia.in (rua to Postmark + Aman)
- Resend tamazia.in records auto-published earlier; domain Verified May 5

### Cloudflare WAF · 5 custom rules on tamazia.co.uk zone
1. Block known bad bots and scanners (sqlmap, nikto, masscan, nmap, acunetix, dirbuster, gobuster, wpscan, empty UA)
2. Managed challenge for /admin/ and /api/admin from non-allowlist countries (allow GB IN US AE DE FR NL IE ES IT)
3. Block WordPress/PHP probe paths (we are not WordPress)
4. Managed challenge for POST to forms with empty or short user-agent
5. Block content scrapers (AhrefsBot, SemrushBot, DotBot, MJ12bot, PetalBot, DataForSeoBot)

### Cloudflare Rate Limit · free-tier ceiling
- 1 rule (free max): 5 POSTs / 10s per IP across /api/contact /api/briefings /api/audit /api/dsar /api/erase /api/portability /api/admin

### Cloudflare Bot Fight Mode
- Toggled ON via UI (free tier, JS detections enabled)

### Cloudflare Access policy on /admin
- Zero Trust Free plan provisioned (50 seats, $0/seat/month)
- Team domain: tamazia-pvt-ltd.cloudflareaccess.com
- Application: "Tamazia Admin Dashboard" id=e4ab6f71-08d4-4d76-ba37-b22777477d93 protecting tamazia.co.uk/admin
- Policy: id=12cd08bf-6f4e-4aa1-af62-e7867fea766e allow-listing amanpareek.pareek@gmail.com, realfamemedia@gmail.com, founder@tamazia.co.uk
- Session duration: 24h

## Live verification
- /api/health on tamazia.co.uk returns 200, version 745dd8f
- KV bound, Resend configured, Cal webhook configured, all 16 env vars present
- Forms tested live (/api/contact returns request_id JSON)
- 130 patch-dist gates passing on every deploy
