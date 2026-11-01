# PRD: tmurdianto.com v0

Status: intake (grill-me, 2026-10-31); design settled (grill-with-docs, 2026-10-31). Terms follow
`CONTEXT.md`; hard-to-reverse decisions are ADR-0001 to ADR-0003 in `docs/adr/`.

## Problem Statement

The live tmurdianto.com is a single hand-edited page last changed in March 2024. Its title and years of
experience are out of date, its background image comes from a service that now fails, its manifest is
broken, and it embeds the same photo twice in a 1.3 MB page. It says nothing about how Teguh works.

Teguh also wants the domain to be more than one page: a home where he can publish anything he builds,
such as the Creative Toddler game, without rebuilding the site each time. Today there is no structure for
that: no shared look, no way to add a page, no checks before it goes live, and no record of why the site
is built the way it is.

## Solution

Rebuild tmurdianto.com as Teguh's branded home and as a host for any page he makes.

- The home page carries the agreed brand: **"I build the foundations teams depend on."** It opens on
  a portrait-led Hero, then shows the work, the writing and the fun pages on one page.
- Every page Teguh owns follows one design system, `DESIGN.md` ("Poster": green and yellow fields, big
  type, and text that wraps along the portrait's outline).
- Hosted pages, such as games and tools built in their own repos, are published under a section path
  (`/fun/creative-toddler/`) and keep their own look.
- Adding a page is a short, documented routine with checks before anything goes live.
- How the site is built, deployed and checked is decided once, recorded as ADRs, and followed.

## User Stories

### Visitors
1. As a visitor, I want to see in one line what Teguh does, so that I know within seconds whether this is relevant to me.
2. As a visitor, I want proof of the work rather than adjectives, so that I can judge it myself.
3. As a visitor, I want to reach Teguh's writing, so that I can see how he thinks.
4. As a visitor, I want to find and play the pages he has built, such as Creative Toddler, so that I can see what he makes for fun.
5. As a visitor, I want ways to contact him (email, LinkedIn, GitHub, GitLab), so that I can reach out.
6. As a visitor on a phone, I want the site to read well at phone width with no sideways scrolling, so that I can browse anywhere.
7. As a visitor whose device is in dark mode, I want the site to follow it, so that it is comfortable to read.
8. As a visitor on a slow connection, I want pages to load fast, so that I don't give up.
9. As a visitor without JavaScript, I want the home page to work fully, so that nothing is hidden from me.
10. As a visitor using a screen reader or keyboard, I want sensible headings, labels, alt text and focus states, so that I can use the site.
11. As a visitor who follows a broken or old link, I want a clear not-found page with a way home, so that I'm not stuck.
12. As a visitor sharing a link, I want a proper title and description in the preview, so that the link makes sense to others.
13. As a recruiter or hiring manager, I want to see current facts (14 years, the current role), so that what I read matches the CV.
14. As a parent opening Creative Toddler, I want it free of ads and trackers, so that it is safe for a small child.

### Teguh as owner
15. As the owner, I want one design system for every page I own, so that the site looks consistent without effort.
16. As the owner, I want to add a new page in a few documented steps, so that publishing doesn't mean rebuilding the site.
17. As the owner, I want a hosted page to keep its own look, so that a game isn't forced into the brand style.
18. As the owner, I want a hosted page's source to stay in its own repo, so that each project keeps one concern.
19. As the owner, I want to update a hosted page by rebuilding from its source, so that the copy on the site never drifts.
20. As the owner, I want a list of every hosted page and where it comes from, so that I know what is published.
21. As the owner, I want to remove a page cleanly, so that nothing dead stays online.
22. As the owner, I want the home page's sections and entries kept in one obvious place, so that editing content doesn't mean editing layout.
23. As the owner, I want the design tokens to live in one place, so that the stylesheet and `DESIGN.md` never disagree.
24. As the owner, I want checks before anything goes live (design lint, broken links, security policy, page weight), so that mistakes are caught early.
25. As the owner, I want every public line of copy to pass a humanizer review, so that it reads like me.
26. As the owner, I want each page to show when it last changed, so that staleness is visible.
27. As the owner, I want deploys to be repeatable and reversible, so that a bad change can be undone fast.
28. As the owner, I want to preview a change before it goes live, so that I can check it in a browser.
29. As the owner, I want to decide what analytics, if any, the site uses, so that visitor privacy matches my values.
30. As the owner, I want no analytics on hosted pages unless I choose it per page, so that a toddler game stays tracker-free.
31. As the owner, I want the domain to keep working during the switch, so that links on my profiles never break.
32. As the owner, I want the reasons behind the stack and hosting recorded, so that I or an agent can change them later with full context.
33. As the owner, I want agents working in this repo to follow the design system and conventions, so that their output matches the site.
34. As the owner, I want old personal details (address, phone, job-search status) never to appear, so that the site is safe to share.
35. As the owner, I want the existing blog at blog.tmurdianto.com to stay reachable, so that writing keeps working while I decide its future.

## Implementation Decisions

### Already decided
- **Brand and copy** come from the agreed brand (vault, 2026-10-31). Copy is British English, plain and
  first person, and goes through a humanizer pass before it is published.
- **Look**: `DESIGN.md` "Poster", chosen by the owner from prototypes at phone and desktop width. Hosted pages keep their own look.
- **URL shape**: hosted pages live under a section path; the first is `/fun/creative-toddler/`.
- **Public safety**: no employer internals, client details, personal contact details beyond email, or
  job-search signals. Creative Toddler is shown only as a game built with agentic AI.
- **Domain and DNS**: `tmurdianto.com` stays; DNS is already on Cloudflare.
- **Tracker**: local markdown under `docs/issues/`, no Jira.

### Settled in grill-with-docs (2026-10-31)

| # | Decision | Outcome | Pilot's answer (not binding) |
|---|---|---|---|
| O1 | Host | ✅ GitHub Pages behind Cloudflare, headers at Cloudflare (ADR-0001) | — |
| O2 | Site stack | ✅ Astro, static HTML built in a GitHub Action (ADR-0002) | — |
| O3 | How hosted pages get in | ✅ Snapshot from a recorded commit, placed under `fun/<page>/`; refuses a dirty source repo (ADR-0003) | — |
| O4 | Content model | ✅ Entries as an Astro content collection (section, order, title, text, link) rendered into the Home page; hosted pages keep a separate record (source repo, commit, build command) | — |
| O5 | Design tokens | ✅ One tokens stylesheet, with a parity test against `DESIGN.md` (precedent: any-web-cloudflared slice 17) | — |
| O6 | Checks before deploy | ✅ In the GitHub Action, before deploy: `DESIGN.md` lint, Astro build and type check, internal link check, page weight budget, every hosted-page record matches its folder. After deploy: live headers compared with the documented Cloudflare rules. Humanizer pass stays an agent step before commit | — |
| O7 | Deploy and rollback | ✅ Astro's GitHub Pages workflow (`withastro/action` + `actions/deploy-pages`) on push to `master`; Pages source set to GitHub Actions; rollback by `git revert` | — |
| O8 | Analytics | ✅ Cloudflare Web Analytics on the Home page only (cookieless); GA4 and GTM removed; never on hosted pages | — |
| O9 | Blog | ✅ Keep Hashnode at `blog.`; the Writing entry links the latest post until Teguh fixes the stale Hashnode About page (owner launch task, outside this repo) | — |
| O10 | Vocabulary | ✅ Home page, Hero, Section, Entry, Hosted page, Snapshot, Source repo, Last changed line (`CONTEXT.md`) | — |

### Modules (shape depends on O2–O5)
- **Site shell**: the page frame (head, nav, footer) shared by every owned page.
- **Content source**: where sections and entries are defined, separate from layout.
- **Design tokens**: one source for colours, type and spacing, matched to `DESIGN.md`.
- **Hosted-page intake**: takes a built folder from a source repo and places it under its path, with a
  record of its source and version.
- **Checks**: design lint, links, security policy and page weight, run before deploy.
- **Deploy**: publishes the site and can roll back.

The deepest candidates for isolated tests are hosted-page intake (input: a built folder and a path;
output: a placed page and an updated record) and the checks (input: a built site; output: pass or a list
of findings).

**Expected zone exposure**

| Zone | Applies? |
|---|---|
| 🟢 Green | Yes: copy, styles, docs, static pages |
| 🟡 Amber | Yes: build and deploy pipeline, hosted-page intake, CI |
| 🔴 Red | No, provided analytics stays free of personal data and no forms are added |
| ⬛ Black | No |

Highest zone: 🟡 Amber.

## Testing Decisions

- Tests check behaviour seen from outside: what a visitor gets at a URL, and what the owner gets from a
  routine. They do not check how the files are produced.
- **Hosted-page intake**: placing a folder puts it at the right path, keeps its relative assets working,
  records its source, and refuses a folder with no `index.html` or a reserved path.
- **Checks**: a broken link, a CSP violation, a lint error or an oversized page each fails the check.
- **Built site**: every page in the content source appears on the home page; the not-found page is served
  for unknown paths.
- **Prior art**: Creative Toddler's test-first suite (Vitest, 100 tests) and the any-web-cloudflared
  checks (parity test between `DESIGN.md` and the shared tokens; the `add` command for hand-made apps).

## Out of Scope

- A blog engine or moving existing posts off Hashnode (O9 only decides direction).
- Private pages behind a login; any-web-cloudflared already covers that.
- Forms, comments, accounts or anything that stores visitor data.
- Fixing hosted pages' own bugs (Creative Toddler's install icon 404 belongs to its repo).
- Rewriting Teguh's other public profiles; this site may link to them only.

## Further Notes

- Brand, evidence and design principles live in Teguh's private notes; only the public-safe parts reach this repo.
- Live site facts at intake: last changed 2024-03-02; GA4 and GTM both loaded; background image service returning 503.
- Creative Toddler runs from a sub-path with relative assets.

## Reframe check (grill, 2026-10-31)

- **Essential:** a branded home that states what Teguh does, and a cheap, checked way to publish any page
  he builds. **Accidental:** Hashnode, GitHub Pages and the old single page.
- **Analogy:** any-web-cloudflared already has a Hub and Hand-made Apps (`awc add`), which publish
  folders as private apps on Cloudflare Pages behind Access. tmurdianto.com is the public counterpart.
  Reusing `awc add` for snapshots was considered and not adopted: different host, different audience,
  and one concern per repo. The snapshot intake here stays small and separate.
