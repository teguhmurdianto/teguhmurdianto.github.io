# Poster design on the Home page

Type: HITL · Zone: 🟢

## Parent

`docs/issues/v0/PRD.md`

## What to build

Replace the Drawing Set look with the Poster design in `DESIGN.md`. The owner chose it from working prototypes at phone and desktop width.

The Home page opens on the Hero: a green field with the brand line, a yellow band with one About sentence, and the portrait standing across both. The headline and the sentence wrap along the portrait's outline. Below the Hero, one short intro sentence leads into Work and into Writing and Fun, set as a running bond of Entries, then a compact footer. There is one page and no section nav.

Everything built for the drawing frame goes: the title block, the Revision table, section numbers, Entry codes, the Fig. caption, the bordered sheet and its grid floor. One "Last changed" line in the footer keeps story 26. The role line moves to the footer and keeps story 13.

## Acceptance criteria

- [ ] At 320, 375, 430, 985 and 1280 px wide the Hero shows the whole figure, including both arms, with no sideways scroll and no clipped text
- [ ] The headline and the About sentence wrap along the portrait's outline, and with images off they still read as plain text
- [ ] The portrait has a clean white outline and meets the base of the Hero
- [ ] Archivo Black and Libre Franklin are served from this domain; nothing loads from another origin
- [ ] The Home page, its fonts and its portrait stay within the 150 KB budget, and `check:weight` counts files loaded from the stylesheet
- [ ] The owned-pages policy in `docs/cloudflare-headers.md` allows `font-src 'self'`, and the tests match it
- [ ] Entries sort by an `order` field; `code` and section numbers are gone from data, markup and tests
- [ ] The not-found page uses the same design and links home
- [ ] Dark mode follows the device, and the owner approves it from screenshots
- [ ] Visible focus, reduced motion and heading order hold; every text and background pair meets WCAG AA
- [ ] `DESIGN.md` lints with 0 errors, and the tokens parity test covers the new colours
- [ ] The term sweep leaves no "Home sheet", "Drawing Set", "title block" or "Revision" in `README.md`, tests, code or open issues
- [ ] All new public copy has had a `/humanizer` pass
- [ ] The owner signs off the built page on a real phone before it merges

## Blocked by

- `04-security-headers-at-cloudflare.md`
