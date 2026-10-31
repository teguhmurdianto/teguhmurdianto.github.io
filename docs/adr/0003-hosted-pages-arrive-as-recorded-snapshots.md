---
status: accepted
---

# Hosted pages arrive as recorded snapshots

A hosted page, such as a game built in its own repo, is published by building its source repo at a named
commit and committing the output under its section path (`fun/<page>/`), together with a record of the
source repo, commit and build command. The intake refuses a source repo with uncommitted changes, so what
is live always matches a commit. This is the one place built files are committed, which ADR-0002 otherwise
forbids. We chose it over having CI build every source repo, because source repos may be private or local
with no remote, and one broken page must never block the site's deploy. We also rejected deploying each
page separately, because GitHub Pages would serve it at `/<repo>`, not under a section path.
