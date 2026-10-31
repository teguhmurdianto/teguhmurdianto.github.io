# Security headers at Cloudflare

Type: HITL · Zone: 🟡

## Parent

`docs/issues/v0/PRD.md`

## What to build

Set the site's security headers with Cloudflare response-header rules (ADR-0001): one set for the Home sheet and a stricter set for `/fun/*` that allows no third-party origins. The exact rules are written in the repo docs. After each deploy, a check fetches the live site and compares its headers with the written rules.

## Acceptance criteria

- [ ] The Home sheet responds with the documented Content-Security-Policy and other security headers
- [ ] `/fun/*` responses carry the stricter policy and Creative Toddler still runs under it
- [ ] The rules are written in the repo docs, word for word
- [ ] The post-deploy check fails when a live header differs from the docs
- [ ] The rules fit within the free plan's 10 active rules

## Blocked by

- `03-first-hosted-page-creative-toddler.md`
