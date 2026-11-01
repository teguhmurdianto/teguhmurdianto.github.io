# First hosted page: Creative Toddler

Type: HITL · Zone: 🟡

## Parent

`docs/issues/v0/PRD.md`

## What to build

Add the snapshot intake (ADR-0003): given a source repo and a section path, it builds the source repo at its current commit, places the output under the section path, and writes the Hosted page record (source repo, commit, build command). It refuses a source repo with uncommitted changes, a build with no `index.html`, and a reserved path. It can also remove a Hosted page and its record. A check in the pre-deploy run confirms every record matches a folder and every folder has a record. Creative Toddler goes live at `/fun/creative-toddler/` with its F-01 entry.

The owner first commits the game's playable code in its own repo; today only its core logic is committed.

## Acceptance criteria

- [ ] Intake places a built folder under `fun/<page>/` and writes its record with the source commit
- [ ] Intake refuses a source repo with uncommitted changes and says why
- [ ] Intake refuses a build with no top-level `index.html` and a reserved path
- [ ] Removing a Hosted page deletes its folder and record
- [ ] The pre-deploy check fails when a record and a folder don't match
- [ ] `tmurdianto.com/fun/creative-toddler/` plays the game with all assets loading from relative paths
- [ ] The F-01 entry on the Home sheet links to it
- [ ] The README lists the add, update and remove steps

## Blocked by

- `02-pre-deploy-checks.md`
- Owner commits Creative Toddler's playable code in its source repo
