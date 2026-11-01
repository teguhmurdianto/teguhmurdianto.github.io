# Cloudflare header rules

GitHub Pages cannot send custom response headers, so Cloudflare sets them (ADR-0001). The rules live in the
Cloudflare dashboard, so this file is the record of them, word for word. `npm run check:headers` fetches the
live site and fails when a header differs from what is written here, and `tests/built-site.test.ts` checks
this file against the built site.

In each rule below, `expression` decides which requests the rule applies to, and `paths` lists the pages
`check:headers` fetches to prove it.

Each rule is a **Response Header Transform Rule** (Rules > Transform Rules > Modify Response Header), with each
header set by **Set static**. The free plan allows 10 rules of up to 30 headers each; this file uses two.

```yaml
rules:
  - name: owned-pages
    expression: 'http.host eq "tmurdianto.com" and not starts_with(http.request.uri.path, "/fun/")'
    paths: [/]
    headers:
      Content-Security-Policy: "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; script-src https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff
      Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
      Strict-Transport-Security: max-age=86400
  - name: hosted-pages
    expression: 'http.host eq "tmurdianto.com" and starts_with(http.request.uri.path, "/fun/")'
    paths: [/fun/creative-toddler/]
    headers:
      Content-Security-Policy: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' data: blob:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      Referrer-Policy: no-referrer
      X-Content-Type-Options: nosniff
      Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
      Strict-Transport-Security: max-age=86400
```

## Why these values

- **Pages this repo builds (`owned-pages`).** The Home page and the not-found page load only their own
  stylesheet, fonts and portrait, so the policy starts from `default-src 'none'` and allows `'self'` for styles,
  images and fonts. The one script is the Cloudflare Web Analytics beacon on the Home page, so `script-src` allows
  only `https://static.cloudflareinsights.com`. `connect-src` allows `https://cloudflareinsights.com`, because a
  snippet that carries only a token reports to `https://cloudflareinsights.com/cdn-cgi/rum`, and `'self'`, because
  Cloudflare's docs give this domain's `/cdn-cgi/rum` for proxied sites. The not-found page loads no script, and
  its own meta policy allows none. The beacon sets no cookie and uses no local storage, per Cloudflare's docs.
- **Analytics only on the Home page.** Cloudflare's automatic setup would inject the beacon into every page,
  including `/fun/*`. Set the site to "Enable with JS Snippet installation" (see below) so only the Home page,
  where the code places it, loads it. `npm run check:analytics` checks the live Home page for the beacon (with a
  real token and no rewritten email link) and every `hosted-pages` path for none. It matches the word
  `cloudflareinsights` anywhere in a Hosted page, so a Hosted page must not mention it.
- **Hosted pages (`hosted-pages`).** `/fun/*` allows no third-party origins and no analytics. Its policy carries
  every directive of Creative Toddler's own policy, which the page also sets in a meta tag. When a game needs
  more, add the directive here and in the game's own policy, then add the page's path to `paths`.
- **Both rules** deny framing (`frame-ancestors 'none'`), stop MIME sniffing and switch off device features the
  site never uses.
- **`Strict-Transport-Security`** is one day, with no `includeSubDomains` or `preload`, so it cannot lock out
  `blog.tmurdianto.com` or outlast a mistake. Raise `max-age` here and in the dashboard once HTTPS has proved
  stable.
- **The meta policy in `src/layouts/Page.astro` stays** as a second layer. A mistake in a rule here then
  cannot remove all protection.
- **Matching on the host** keeps both rules off `blog.tmurdianto.com` and any other subdomain.

## Apply the rules

1. In the Cloudflare dashboard, open the `tmurdianto.com` zone, then Rules > Transform Rules > Modify Response
   Header > Create rule.
2. Name it `owned-pages`. Choose Edit expression and paste the `expression` above. Under Modify response header, add
   one **Set static** entry for each header listed, with the value written above.
3. Repeat for `hosted-pages`.
4. Run `npm run check:headers`, or re-run the `verify` job of the last deploy.

## Set up Web Analytics

1. In the Cloudflare dashboard, open Web Analytics, then Manage site for `tmurdianto.com`. Choose
   "Enable with JS Snippet installation" (not the automatic setup).
2. Copy the `token` from the snippet into `beaconToken` in `src/data/analytics.ts`. It is not a secret.
3. Under the zone's Scrape Shield, turn off Email Address Obfuscation. When it is on, Cloudflare rewrites the
   `mailto:` links and adds a script that the policy above blocks, which breaks the "Email me" link;
   `npm run check:analytics` fails when it sees that.
4. After a deploy, run `npm run check:analytics`, then open the Home page once and look for the visit in
   Web Analytics.

If the dashboard rejects `starts_with()` on the free plan, use `http.request.uri.path wildcard "/fun/*"` and
`not http.request.uri.path wildcard "/fun/*"` instead, and change the two `expression` lines above and the
matching expectations in `tests/built-site.test.ts` to match.

## Add a Hosted page

Add its path, such as `/fun/new-game/`, to the `paths` of `hosted-pages`. The dashboard needs no change: the
rule already matches everything under `/fun/`.

## Change a rule

Change this file, the dashboard rule and, for `owned-pages`, the meta policy in `src/layouts/Page.astro` together.
`npm test` fails if this file and the built site disagree, and `npm run check:headers` fails if the dashboard
and this file do.
