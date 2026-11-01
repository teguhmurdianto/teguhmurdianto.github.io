---
status: accepted
---

# Astro, built to static HTML in CI

The site is built with Astro into plain static HTML, with JavaScript only where a part needs it, and the
build runs in a GitHub Action on every push to publish to GitHub Pages. Build output is never committed by
hand. The repo has already been Jekyll (2017–2020) and Gatsby (2020–2022, with built files committed to
`master`), and the Gatsby site was deleted in favour of one hand-written page. A build step nobody
automates is the failure to avoid.

## Considered Options

- **Client-rendered SPA (React):** rejected. The page would be empty without JavaScript, link previews and
  search would see nothing, and the React runtime would load before any text.
- **Next.js static export:** the owner's daily stack, but it still ships React to every page, which is
  more framework than a mostly-text site needs.
- **Gatsby:** tried here and dropped; releases have slowed.
- **11ty:** would work; Astro was preferred because it can still use React components where needed.
- **Plain files (the pilot):** can't keep content apart from layout or keep design tokens in one place.
