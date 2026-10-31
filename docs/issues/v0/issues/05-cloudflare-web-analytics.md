# Cloudflare Web Analytics on the Home sheet

Type: HITL · Zone: 🟡

## Parent

`docs/issues/v0/PRD.md`

## What to build

Turn on Cloudflare Web Analytics for the Home sheet only. Update the Home sheet's header rules to allow its script and beacon; `/fun/*` stays without analytics.

## Acceptance criteria

- [ ] Visits to the Home sheet show in Cloudflare Web Analytics
- [ ] No analytics request is made from any `/fun/*` page
- [ ] The documented header rules and the post-deploy check include the change
- [ ] No cookie is set by the site

## Blocked by

- `04-security-headers-at-cloudflare.md`
