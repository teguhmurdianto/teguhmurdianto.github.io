# tmurdianto.com

- Read `DESIGN.md` before any UI work and follow it; `README.md` has the layout, commands and how to add an Entry.
- Public copy goes through `/humanizer` before it is committed. British English.
- The site is built by Astro in CI; never commit `dist/`. Run `npm run check` and `npm run preview` before pushing.
- Colours change in `DESIGN.md` and `src/styles/tokens.css` together; `tests/tokens-parity.test.ts` fails if they differ.
- Personal git identity for this repo: `Teguh Murdianto <murdianto1561@gmail.com>`.
