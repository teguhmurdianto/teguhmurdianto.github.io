# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `docs/issues/`.

## Conventions

- One feature per directory: `docs/issues/<feature-slug>/`
- The PRD is `docs/issues/<feature-slug>/PRD.md`
- Implementation issues are `docs/issues/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `docs/issues/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.
