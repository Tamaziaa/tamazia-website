# Branch protection · pending PAT scope upgrade

Current PAT (fine-grained) has: contents/repo (RW), pull-requests (RW), issues (RW), metadata (R).
Missing: **Administration (RW)** — required to call PUT /repos/.../branches/main/protection.

## Operator action (5 minutes)

1. Go to https://github.com/settings/personal-access-tokens
2. Edit the PAT named "tamazia-website" (or rotate)
3. Under **Repository permissions**, set **Administration → Read and write**
4. Save · the token value remains the same (or copy the new one if rotated)
5. Re-run: `git push` should still work · then run:

```
PAT="<paste fresh value>"
curl -X PUT \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Tamaziaa/tamazia-website/branches/main/protection \
  -d '{
    "required_status_checks": {"strict": true, "contexts": ["Deploy to Cloudflare Pages"]},
    "enforce_admins": false,
    "required_pull_request_reviews": null,
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_linear_history": false
  }'
```

Expected: HTTP 200 with the protection rule body.

## Why protection matters

- `allow_force_pushes: false` prevents history-rewriting incidents
- `allow_deletions: false` prevents accidental branch deletion
- Status check contexts make Cloudflare deploy success a merge gate
- `enforce_admins: false` lets Aman override if the deploy is wedged

## Verification post-application

```
curl -s https://api.github.com/repos/Tamaziaa/tamazia-website/branches/main/protection \
  -H "Authorization: Bearer $PAT" | python3 -m json.tool | head -20
```
