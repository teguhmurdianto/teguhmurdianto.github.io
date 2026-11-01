# Pre-deploy checks

Type: AFK · Zone: 🟡

## Parent

`docs/issues/v0/PRD.md`

## What to build

Before deploying, the GitHub Action checks the built site and stops on any failure: the `DESIGN.md` lint, Astro's build and type check, an internal link check, and a page-weight budget for the Home sheet.

## Acceptance criteria

- [ ] A `DESIGN.md` lint error fails the run and nothing is deployed
- [ ] A broken internal link fails the run and names the link
- [ ] A Home sheet over the weight budget fails the run and shows its size
- [ ] A clean build passes all checks and deploys
- [ ] Each check can be run locally with one command

## Blocked by

- `01-home-sheet-live-on-astro.md`
