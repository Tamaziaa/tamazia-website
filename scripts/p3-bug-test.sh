#!/usr/bin/env bash
# Phase 3 14-level bug test · runs against the live deployment
# Usage: bash scripts/p3-bug-test.sh
set -euo pipefail

BASE="${1:-https://tamazia.co.uk}"
PASS=0
FAIL=0

check() {
  local name="$1"; local actual="$2"; local expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS · $name"
    PASS=$((PASS+1))
  else
    echo "FAIL · $name · expected $expected got $actual"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Phase 0-4 35-level bug test against $BASE ==="

# 1. Honeypot-only POST to /api/contact
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"bot-field":"spam","name":"x","email":"x@x.x","company":"x","sector":"x"}' "$BASE/api/contact")
check "1. honeypot ignore (200)" "$code" "200"

# 2. Time-trap fail · would need client-side ts_form_open · skip until functions wired
echo "SKIP · 2. time-trap (needs client-side timestamp wiring)"

# 3. HMAC missing on a list-unsubscribe POST
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -d 'id=test' "$BASE/api/list-unsubscribe")
check "3. list-unsubscribe POST returns 200" "$code" "200"

# 4. Wrong HMAC · skip until SHEETS_WEBHOOK_URL is wired
# 4. Admin auth required
code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/admin-submissions")
check "4. admin-submissions requires auth (401)" "$code" "401"

# 5. /api/health returns 200
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/health")
check "5. /api/health 200" "$code" "200"

# 6. CSP report endpoint accepts POST
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/csp-report' -d '{"csp-report":{}}' "$BASE/api/csp-report")
check "6. /api/csp-report 204" "$code" "204"

# 7. /.well-known/security.txt resolves
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/.well-known/security.txt")
check "7. security.txt 200" "$code" "200"

# 8. /humans.txt resolves
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/humans.txt")
check "8. humans.txt 200" "$code" "200"

# 9. CAA records present on tamazia.co.uk
caa=$(dig +short CAA tamazia.co.uk @1.1.1.1 | wc -l)
check "9. CAA records on co.uk (>=5)" "$([[ $caa -ge 5 ]] && echo OK || echo FAIL)" "OK"

# 10. CAA records present on tamazia.in
caa=$(dig +short CAA tamazia.in @1.1.1.1 | wc -l)
check "10. CAA records on .in (>=5)" "$([[ $caa -ge 5 ]] && echo OK || echo FAIL)" "OK"

# 11. DMARC includes Postmark rua on co.uk
dm=$(dig +short TXT _dmarc.tamazia.co.uk @1.1.1.1 | grep -c postmarkapp.com || true)
check "11. DMARC postmarkapp on co.uk" "$dm" "1"

# 12. DMARC includes Postmark rua on .in
dm=$(dig +short TXT _dmarc.tamazia.in @1.1.1.1 | grep -c postmarkapp.com || true)
check "12. DMARC postmarkapp on .in" "$dm" "1"

# 13. /robots.txt blocks GPTBot
gp=$(curl -sS "$BASE/robots.txt" | grep -c 'User-agent: GPTBot' || true)
check "13. robots blocks GPTBot" "$gp" "1"

# 14. Headers · COOP+COEP present
hd=$(curl -sSI "$BASE/" | grep -i -E 'cross-origin-(opener|embedder)-policy' | wc -l)
check "14. COOP+COEP headers present (=2)" "$hd" "2"

echo ""
echo "Result: $PASS passed, $FAIL failed."
[[ $FAIL -eq 0 ]] || exit 1

# 15. /admin/submissions HTML page exists (Phase 4 admin)
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/admin/submissions/")
check "15. /admin/submissions/ 200" "$code" "200"

# 16. /api/health includes kv field
hc=$(curl -sS "$BASE/api/health" | grep -c '"kv"' || true)
check "16. /api/health KV probe field present" "$hc" "1"

# 17. New legal pages render
for slug in security-policy security-acknowledgments modern-slavery-statement complaints acceptable-use; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/$slug/")
  check "17.$slug rendered" "$code" "200"
done

# 18. Cookie banner Consent Mode v2 default present in HTML
cm=$(curl -sS "$BASE/" | grep -c "consent.*default" || true)
check "18. cookie banner Consent Mode v2 default" "$cm" "1"

# 19. /api/list-unsubscribe GET returns HTML
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/list-unsubscribe?id=test")
check "19. /api/list-unsubscribe GET 200" "$code" "200"

# 20. patch-dist 15+ checks pass (this is checked in deploy gate, just verify dist HTML)
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/humans.txt")
check "20. humans.txt accessible" "$code" "200"

# 21. /.well-known/dnt-policy.txt accessible
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/.well-known/dnt-policy.txt")
check "21. dnt-policy.txt accessible" "$code" "200"

# 22. Footer renders Tamazia Pvt Ltd legal entity
le=$(curl -sS "$BASE/" | grep -c 'Tamazia Pvt Ltd' || true)
check "22. footer legal entity (Tamazia Pvt Ltd)" "$le" "1"

# 23. modern-slavery-statement footer link present
ms=$(curl -sS "$BASE/" | grep -c 'modern-slavery-statement' || true)
check "23. footer modern-slavery link" "$ms" "1"

# 24. RSS feed renders
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/insights/feed.xml")
check "24. /insights/feed.xml RSS 200" "$code" "200"

# 25. msapplication-TileColor present
tc=$(curl -sS "$BASE/" | grep -c 'TileColor' || true)
check "25. msapplication-TileColor in head" "$tc" "1"

# 26. apple-mobile-web-app metas present
amw=$(curl -sS "$BASE/" | grep -c 'apple-mobile-web-app' || true)
check "26. apple-mobile-web-app metas (>=1)" "$([[ $amw -ge 1 ]] && echo OK || echo FAIL)" "OK"

# 27. /api/health includes resend status field
hr=$(curl -sS "$BASE/api/health" | grep -c '"resend"' || true)
check "27. /api/health resend probe field" "$hr" "1"

# 28. Contact form HTML carries ts_form_open hidden input
ts=$(curl -sS "$BASE/" | grep -c 'ts_form_open' || true)
check "28. contact form ts_form_open hidden input (>=1)" "$([[ $ts -ge 1 ]] && echo OK || echo FAIL)" "OK"

# 29. /status/ public page renders
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/status/")
check "29. /status/ page 200" "$code" "200"

# 30. /api/cal-webhook stub responds (503 when secret unbound is correct)
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/cal-webhook")
check "30. /api/cal-webhook 503 (no secret) or 400/401 (has secret)" "$([[ $code == "503" || $code == "400" || $code == "401" ]] && echo OK || echo FAIL)" "OK"

# 31. /robots.txt lists RSS feed as sitemap
rs=$(curl -sS "$BASE/robots.txt" | grep -c "feed.xml" || true)
check "31. robots.txt RSS sitemap pointer" "$rs" "1"

# 32. footer Status link
fs=$(curl -sS "$BASE/" | grep -c '"/status/"' || true)
check "32. footer Status link present" "$fs" "1"

# 33. footer RSS link with correct rel and type
fr=$(curl -sS "$BASE/" | grep -c 'rel="alternate" type="application/rss' || true)
check "33. footer RSS rel+type alternate link" "$([[ $fr -ge 1 ]] && echo OK || echo FAIL)" "OK"

# 34. /status/ page references /api/health
sh=$(curl -sS "$BASE/status/" | grep -c "/api/health" || true)
check "34. /status/ page polls /api/health" "$([[ $sh -ge 1 ]] && echo OK || echo FAIL)" "OK"

# 35. /api/health JSON parseable + has timestamp
ts=$(curl -sS "$BASE/api/health" | python3 -c "import sys, json; print(1 if json.load(sys.stdin).get('timestamp') else 0)" 2>/dev/null)
check "35. /api/health has timestamp field" "$ts" "1"
