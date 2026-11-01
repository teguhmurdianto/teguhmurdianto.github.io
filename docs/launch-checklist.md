# Launch checklist

What to do around the first deploy. Most of it can only be checked on the live site, so nothing here is
ticked in advance. "Owner" means you; "CI" means the Action runs it.

## Before the merge

| Check | How | Who |
|---|---|---|
| Pages source is GitHub Actions | Repository settings > Pages > Source. The legacy source would publish the repository's files as they are. | Owner |
| The pull request is green | Open a pull request to `master`. It runs `npm run check` and nothing else. | CI |
| Phone check, light and dark | Open the Home page, the 404 page and `/fun/creative-toddler/` on a real phone, in both modes. Look at the Hero gap, the dark footer and the footer line. | Owner |
| Real iPhone check | Open the Home page in Safari on an iPhone. | Owner |

## At the first deploy

The `verify` job runs the two live checks below by itself after each deploy; run them by hand to see the output.

| Check | How | Who |
|---|---|---|
| Cloudflare headers match the documents | Paste the `owned-pages` and `hosted-pages` values from `docs/cloudflare-headers.md` into Transform Rules, then run `npm run check:headers`. | Owner |
| Email obfuscation is off | Cloudflare > Scrape Shield > Email Address Obfuscation. Off, so "Email me" stays a plain `mailto:` link. | Owner |
| Web Analytics is on the snippet setting | Choose "Enable with JS Snippet installation", so `/fun/*` loads no script. | Owner |
| Only the Home page loads analytics | Run `npm run check:analytics`. The Action runs it too, in the `verify` job. | CI |
| One visit shows in Web Analytics | Open the Home page, then look for the visit in the dashboard. | Owner |
| The old 2024 page and its photos are gone | Open the live site and the old photo addresses. None should load. | Owner |

## After the deploy

| Check | How | Who |
|---|---|---|
| Every contact link opens the right profile | Click Email me, LinkedIn, GitHub and GitLab on the live page. | Owner |
| The Writing entry links to the latest post | Compare `src/content/entries/blog.md` with the newest post on the blog. Update the link whenever you publish a new post. | Owner |
| Hashnode About page is fixed | The title and the years of experience on the blog's About page. | Owner |
| Creative Toddler works offline | The game's service worker (`sw.js`) pre-caches `./manifest.webmanifest` and `./icon.svg`, which are missing from its build, so offline use fails and the install icon is missing. Fix it in the game's own repo, then run `npm run hosted:add` again. Online play is unaffected. | Owner |

## Your calls

- Whether the Blog line ("Notes on building software, and on helping a team work well.") fits the newest post.
- Whether to show the commit date next to the Version line.
