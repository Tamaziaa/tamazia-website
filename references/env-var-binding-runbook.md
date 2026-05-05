# Operator runbook · env-var binding at Cloudflare Pages

**Status as of Wave 31**: env_present 5/16. CAL_WEBHOOK_SECRET is bound (cal-webhook returns 401 not 503).

**Still unbound at runtime**:
1. RESEND_API_KEY
2. ADMIN_SECRET
3. FORM_SUBMISSIONS (the KV namespace itself)
4. CONTACT_FROM
5. CONTACT_TO
6. INDEXNOW_KEY
7. SHEETS_WEBHOOK_URL
8. SHEETS_HMAC_SECRET
9. DSAR_SIGNING_SECRET
10. TURNSTILE_SECRET_KEY
11. ZEROBOUNCE_API_KEY / HUNTER_API_KEY / NEVERBOUNCE_API_KEY (3 validators)

## Root cause hypothesis

CF Pages Settings has separate environments:
- **Production** (branch=main · what `tamazia.co.uk` serves)
- **Preview** (other branches · `*.tamazia-website.pages.dev`)

If secrets are bound only to Preview environment, Production deploys read them as undefined.

## Fix · 8-minute runbook

1. Go to https://dash.cloudflare.com/4a3b271b5f1f4cbfc16c6e9e5e62451b/pages/view/tamazia-website
2. Click **Settings** tab
3. Click **Environment variables** sub-section
4. Toggle the environment to **Production** (top right of the page)
5. For each missing variable, click **Add variable** and:
   - **Variable name**: paste the variable name
   - **Value**: paste the value from `references/_secrets/` (or the dashboard generator)
   - **Type**: tick **Secret** (encrypted, not visible after save)
   - Click **Save**
6. Verify all 11 variables are listed under Production
7. Trigger a fresh deploy: https://github.com/Tamaziaa/tamazia-website/actions/workflows/deploy.yml → Run workflow → main → Run
8. Wait ~35s for deploy to complete
9. Verify: `curl -s -H "X-Admin-Secret: $ADMIN_SECRET" https://tamazia.co.uk/api/health | python3 -m json.tool`
   Expected: `env_present` shows true for all 16 variables.

## KV namespace binding (special case)

FORM_SUBMISSIONS is a KV namespace, not a Secret.

1. CF Pages → Settings → Functions → KV namespace bindings
2. **Variable name**: `FORM_SUBMISSIONS`
3. **KV namespace**: select from dropdown (or create new at `tamazia-form-submissions`)
4. Save

Note: KV bindings are environment-scoped. Production binding required.

## Verification curls (post-rebind)

```
# Cal webhook · expect 401 (HMAC reject, currently 401 ✓)
curl -s -i -X POST https://tamazia.co.uk/api/cal-webhook -H 'Content-Type: application/json' -d '{}' | head -3

# /api/health admin · all true
curl -s -H "X-Admin-Secret: $ADMIN_SECRET" https://tamazia.co.uk/api/health | python3 -m json.tool

# /api/contact · accept submission
curl -s -X POST https://tamazia.co.uk/api/contact \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"verify@tamazia.co.uk\",\"name\":\"verify\",\"ts_form_open\":$(($(date +%s%3N)-3000))}"

# /api/admin-submissions · authenticated read
curl -s -H "X-Admin-Secret: $ADMIN_SECRET" "https://tamazia.co.uk/api/admin-submissions?tab=contact&limit=5" | python3 -m json.tool

# /api/dsar · POST email (verifies validator + token mint)
curl -s -X POST https://tamazia.co.uk/api/dsar \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@tamazia.co.uk"}'
```

## Acceptance criteria

- /api/health admin shows env_present 16/16 true
- /api/cal-webhook returns 401 (already verified Wave 31)
- /api/contact returns `{"ok":true,"request_id":"..."}` (currently silently dropping)
- /api/admin-submissions with X-Admin-Secret returns submissions array
- /api/dsar POST returns `{"ok":true,"message":"..."}` (currently 503)

When all 5 pass, Phase 3 is fully live. Phase 5/7/8/9/10 become fully functional simultaneously.
