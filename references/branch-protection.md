# Branch Protection · `main` runbook

Phase 0 carry-over · founder decision recorded 2026-05-04.

## Settings to apply at github.com/Tamaziaa/tamazia-website/settings/branches

Rule pattern `main`:
- [x] Require a pull request before merging
  - Required approving reviews: 0 (solo repo; auto-approve OK via owner merge)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require approval of the most recent reviewable push
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required checks:
    - `Compile Cloudflare Functions` (deploy.yml step)
    - `patch-dist verification` (deploy.yml step)
- [ ] Require signed commits — disabled (overhead vs risk on solo repo)
- [x] Require linear history
- [x] Require deployments to succeed before merging — bind to `production` env once defined
- [x] Lock branch — disabled (would block direct pushes)
- [x] Do not allow bypassing the above settings — applies to admins
- [x] Restrict who can push to matching branches — only @aman (sole maintainer)
- [x] Allow force pushes — disabled
- [x] Allow deletions — disabled

## Why these settings

We are a solo repo today, but every PR-bypass mistake compounds in audit. Required PR workflow for `main` plus required status checks means even a "fix typo" commit cannot ship if the deploy build fails. Linear history keeps the changelog readable for investors auditing engineering rigour pre-Series A.

Signed commits are deferred. The overhead of GPG/SSH key rotation across machines + Cowork sandbox commits + bot commits would create more friction than it prevents bypass.

## Verification post-config

`gh api repos/Tamaziaa/tamazia-website/branches/main/protection` should return the rules above. Re-run after every quarterly review.

## Source of truth

Last updated 2026-05-04 by Cowork session.
