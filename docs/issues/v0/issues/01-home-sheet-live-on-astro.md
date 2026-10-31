# Home sheet live on Astro

Type: HITL · Zone: 🟡

## Parent

`docs/issues/v0/PRD.md`

## What to build

Replace the 2024 single page with the Home sheet built by Astro (ADR-0002) and deployed to GitHub Pages by a GitHub Action on push to `master` (ADR-0001). Entries live in a content collection with section, code, title, text and optional link (`CONTEXT.md`). One tokens stylesheet holds the Drawing Set values, and a parity test fails if it disagrees with `DESIGN.md`. The Home sheet carries the humanized copy, the four sections, the title block and the revision table. A not-found page is served for unknown paths. The owner switches the Pages source to GitHub Actions; the first push replaces the live page.

The unpushed pilot in the working tree is the reference for layout and copy, not for structure.

## Acceptance criteria

- [ ] Pushing to `master` builds the site in a GitHub Action and deploys it to GitHub Pages; no built site files are committed
- [ ] tmurdianto.com serves the Home sheet with the brand line, sections 01–04, title block and revision table
- [ ] Adding an entry to the content collection makes it appear in its section without editing layout
- [ ] The tokens parity test fails when a colour in the stylesheet differs from `DESIGN.md`
- [ ] The page works with JavaScript disabled, reads well at 375px with no sideways scroll, and follows the device's dark mode
- [ ] An unknown path returns the not-found page with a link home
- [ ] Page has a title, description and link-preview tags; headings, alt text and focus states are in place
- [ ] No GA4, GTM, address, phone or job-search wording is on the page
- [ ] All public copy has had a humanizer pass
- [ ] A repo `CLAUDE.md` points agents at `DESIGN.md` and `README.md` before any UI work
- [ ] One command runs a local preview of the built site before pushing

## Blocked by

None - can start immediately
