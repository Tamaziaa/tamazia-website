# Cross-account constraint · KV binding blocker

## What

Cloudflare Pages project `tamazia-website` lives on account `4a3b271b5f1f4cbfc16c6e9e5e62451b`.

Cloudflare DNS for tamazia.co.uk and tamazia.in lives on account `78c7941714fccce82e777108db054961` (Amanpareek.pareek@gmail.com).

KV namespace `form_submissions` was created on account 78c7941... (id: `037cc1f9506a4ec2a9338d11e3cf1480`).

KV bindings only work when the namespace and the consuming Pages project are on the same account. Across accounts, Cloudflare returns "Unauthorized" when trying to bind.

## Symptoms

The wrangler.toml binding for `FORM_SUBMISSIONS` resolves at deploy time only if the Pages account also owns a namespace with the matching ID. Currently the Pages account has no KV namespace named `form_submissions` and `Amanpareek.pareek@gmail.com` does not have KV-create permission on that account.

## Resolution paths

Path A · Recreate KV on the Pages account (needs Aman to log in to the user/email that owns 4a3b271...). 2-minute UI task once logged in. Update wrangler.toml namespace id to the new namespace id from that account. Push. Deploy. Done.

Path B · Transfer Pages ownership to account 78c7941... via Cloudflare support ticket. ~2 day SLA.

Path C · Accept the constraint. The form pipeline still fires Resend alert + auto-ack without KV. KV is the "nice-to-have" history layer. Form submissions land in Aman's Gmail with full data; the dashboard at /admin/submissions returns "kv_unbound_safe_to_send" until KV binds. Defer KV to when Path A or B completes.

Path C is the recommended interim state. Forms work end-to-end without KV. The shared receiver's defensive `if (env.FORM_SUBMISSIONS)` guard skips KV write and still fires email side-effects.

## Re-enable when ready

When account access is sorted:

1. On Pages account (4a3b271...) create KV namespace named `form_submissions`
2. Copy the namespace ID
3. Pages → Settings → Functions → KV namespace bindings: add `FORM_SUBMISSIONS = (id)`
4. Trigger Pages redeploy

Ten minutes total.

## What was created on 78c7941... (orphaned but parked)

- KV namespace `form_submissions`, id `037cc1f9506a4ec2a9338d11e3cf1480`
- Available for use by any future Worker on account 78c7941...

## Decision logged

5 May 2026 · accept the cross-account constraint as a blocker for KV. Pivot to Path C interim. Aman to address Path A in next operational session.
