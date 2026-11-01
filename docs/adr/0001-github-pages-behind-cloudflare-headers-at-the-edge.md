---
status: accepted
---

# GitHub Pages behind Cloudflare, with security headers set at Cloudflare

The site stays on GitHub Pages, deployed on push, with Cloudflare in front as a proxy (DNS already lives
there). GitHub Pages can't send custom response headers, so the security headers, including a stricter
policy for hosted pages under `/fun/`, are set by Cloudflare response-header rules matched on path (the
free plan allows 10 active rules, up to 30 headers each). We chose this over moving to Cloudflare Pages
because it keeps the deploy-on-push setup that already works; the only thing given up is per-branch
preview links, and a local preview covers that for a personal site.

## Consequences

- The header rules live in the Cloudflare dashboard, not in this repo. Their exact contents are written
  down in the repo docs, and a check after each deploy compares the live headers with them.
- Rollback is `git revert` and push.
