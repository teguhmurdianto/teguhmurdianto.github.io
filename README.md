# tmurdianto.com

Teguh Murdianto's personal site: a one-page Home page, built with [Astro](https://astro.build) into static
HTML. A GitHub Action builds it and publishes it to GitHub Pages on every push to `master`; the custom
domain is in `public/CNAME`. Why it is built this way: [`docs/adr/`](docs/adr/).

The look is defined in [`DESIGN.md`](DESIGN.md): a poster, with a green field, one yellow band, big type and a cut-out portrait. Read it before changing any page.
Terms (Home page, Hero, Section, Entry, Hosted page, Snapshot) are in [`CONTEXT.md`](CONTEXT.md).

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (Node 22.23.4 or later) |
| `npm run dev` | Live-reloading dev server |
| `npm run preview` | Build the site, then serve the built output locally; use this before pushing |
| `npm test` | Tokens parity test, built-site test and the check functions' tests |
| `npm run check` | The pre-deploy checks and the tests, as the Action runs them |

## Layout

| Path | What |
|---|---|
| `src/pages/` | The Home page (`index.astro`) and the not-found page (`404.astro`) |
| `src/layouts/Page.astro` | The frame every page shares: head and footer, with the contact links and the Version line |
| `src/content/entries/` | One markdown file per Entry; the collection schema is `src/content.config.ts` |
| `src/data/` | The Section list, the Web Analytics origins and token (`analytics.ts`), and the Version line (`version.ts`: the CI commit, else the local HEAD, else `dev`) |
| `src/styles/tokens.css` | Colours, font names and dark mode, matched to `DESIGN.md` by a test |
| `src/styles/site.css` | Layout, and the font files (from the Fontsource packages, served from this domain) |
| `public/` | Files served as they are: `CNAME`, `robots.txt`, the portrait (`portrait.webp`), and each Hosted page's Snapshot at `public/<section>/<page>/` |
| `scripts/check-site.ts` | The link, page-weight and hosted-page checks, and the live header and analytics checks |
| `scripts/intake.ts` | The Snapshot intake: add, update and remove a Hosted page |
| `src/data/hosted-pages.json` | The Hosted page record: source repo, commit and build command for each Snapshot |
| `docs/cloudflare-headers.md` | The Cloudflare header rules, word for word, with the steps to apply them |
| `docs/launch-checklist.md` | The live-site checks and owner tasks around the first deploy |
| `tests/` | Vitest: tokens parity, the built site, the checks, the intake, the Version line and the deploy workflow |

## Add an Entry

1. Add `src/content/entries/<name>.md` with `section` (`work`, `writing` or `fun`), `order` (a whole number
   above 0, unique, which sets where it sits in its group), `title` and an optional `link`. The body is the
   Entry's text.
2. Run `npm test`, then `npm run preview` and look at it at phone width and in dark mode.

## Hosted pages

A Hosted page is built in its own repo and arrives here as a Snapshot, under `public/<section>/<page>/` and
served at `/<section>/<page>/`. Each Snapshot has a line in `src/data/hosted-pages.json` saying which repo
and commit it came from.

- **Add or update:** commit everything in the Source repo, then run
  `npm run hosted:add -- <path to the Source repo> fun/<page>`. It builds that commit in a temporary clone
  with `npm ci && npm run build` (use `--build "<command>"` for another build), places the output and writes
  the record. Running it again on the same path replaces both.
- **Remove:** `npm run hosted:remove -- fun/<page>` deletes the folder and the record. Remove or change the
  page's Entry too, or `check:links` fails, and take its path out of `hosted-pages` in
  `docs/cloudflare-headers.md`, or the `verify` job fails on a 404 after the deploy.
- **Then:** add an Entry linking to `/fun/<page>/`, add its path to `hosted-pages` in
  `docs/cloudflare-headers.md`, run `npm run check`, then `npm run preview` and play it.
- **Refused:** a Source repo with uncommitted changes, a build with no top-level `dist/index.html`, and a path
  that is not `<section>/<page>` (a lowercase page name under `work`, `writing` or `fun`).
- A Source repo must build into `dist/` with a relative asset base, such as Vite's `base: './'`, to work under its folder. Submodules are not checked out. Another output folder needs the intake extended.
- A Hosted page keeps its own look, and carries no analytics.
- The `hosted-pages` rule covers `/fun/` only. A Hosted page under `work` or `writing` needs its own Cloudflare rule first, or the `owned-pages` policy blocks its scripts.

## Deploy

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds the site and deploys it. A pull
request to `master` runs the checks only and never deploys, and a manual run deploys only from `master`.
Built files are never committed. The
repository's Pages source must be set to GitHub Actions before the first merge, because the legacy source
would publish the repository's files as they are. `docs/launch-checklist.md` lists the checks and owner
tasks around the first deploy. To roll back, revert the commit and push.

## Security headers

GitHub Pages cannot send headers, so Cloudflare sets them with two Response Header Transform Rules. The rules
are written word for word in `docs/cloudflare-headers.md`, with the steps to apply them in the dashboard. The
`verify` job runs `npm run check:headers` after each deploy and fails when a live header differs from the docs.
Change a rule in the docs, the dashboard and, for the pages this repo builds, the meta policy in
`src/layouts/Page.astro` together.

## Analytics

The Home page, and only the Home page, loads the Cloudflare Web Analytics beacon (cookieless). `Page.astro`
adds it when a page passes `analytics`, using the site token in `src/data/analytics.ts`; the token is public, but
the build's tests fail while it is still `<<CF_BEACON_TOKEN>>`. `docs/cloudflare-headers.md` has the dashboard
steps. The `verify` job runs `npm run check:analytics` after each deploy.

## Checks

Before anything deploys, the `check` job in the Action runs `npm run check`. If any step fails, nothing is
deployed. Each step also runs on its own:

| Command | What it checks | A failure shows |
|---|---|---|
| `npm run check:design` | `DESIGN.md` lints with no errors | the lint error |
| `npm run check:types` | Astro's type check | the type error |
| `npm run check:hosted` | every Hosted page record has a folder and every Snapshot folder has a record | each mismatch by path |
| `npm run check:links` | builds, then every internal link and image resolves | each broken link and its page |
| `npm run check:weight` | builds, then the Home page and what it loads fit 150 KB | its size and the budget |
| `npm run check` | all of the above, then `npm test` | the first step that fails |
| `npm run check:headers` | fetches the live site; every header matches `docs/cloudflare-headers.md` | the path, the live value and the documented value |
| `npm run check:analytics` | fetches the live site; the Home page has the beacon and no Hosted page loads analytics | the page and what is wrong |

`check:headers` and `check:analytics` need the live site, so they are not part of `npm run check`. `npm run check` is this repo's own
script; `astro check` is only its type-check step. The link, weight and
hosted-page checks live in `scripts/check-site.ts`, which Node runs directly (Node 22.18 or later strips the types). The
budget is `WEIGHT_BUDGET` in that file, counted in raw bytes.

The link check reads quoted `href` and `src` values. It does not read `srcset`, `og:image`, CSS `url()` or
`<base>`, and it skips absolute URLs. The weight check
counts the Home page plus its same-origin stylesheets, images and scripts, and the files those stylesheets
load through `url()` (the fonts). Widen the link check when a page starts using the rest.

Public copy goes through a humanizer pass before it is published.

The fonts, Archivo Black and Libre Franklin, are licensed under the SIL Open Font License 1.1; the licence text is in their Fontsource packages.
