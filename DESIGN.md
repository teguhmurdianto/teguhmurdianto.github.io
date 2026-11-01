---
version: alpha
name: Poster
description: tmurdianto.com as a poster. A green field, one yellow band, very big type and a cut-out portrait with the text wrapping along its outline.
colors:
  primary: "#0E4D3F"
  on-primary: "#FFFFFF"
  secondary: "#FFC900"
  on-secondary: "#111111"
  neutral: "#FFFFFF"
  on-surface: "#111111"
  surface-soft: "#F1F3EF"
  neutral-dark: "#111111"
  on-surface-dark: "#FFFFFF"
  surface-soft-dark: "#23272A"
typography:
  headline-display: { fontFamily: "Archivo Black, sans-serif", fontSize: 72px, fontWeight: 400, lineHeight: 0.96, letterSpacing: -0.025em }
  headline-md: { fontFamily: "Archivo Black, sans-serif", fontSize: 24px, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.01em }
  body-md: { fontFamily: "Libre Franklin, sans-serif", fontSize: 17px, fontWeight: 400, lineHeight: 1.5 }
  label-md: { fontFamily: "Libre Franklin, sans-serif", fontSize: 17px, fontWeight: 600, lineHeight: 1.4 }
rounded: { none: 0px }
spacing: { xs: 6px, sm: 16px, md: 24px, lg: 48px, xl: 64px }
components:
  page: { backgroundColor: "{colors.neutral}", textColor: "{colors.on-surface}", typography: "{typography.body-md}" }
  hero: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.headline-display}" }
  band: { backgroundColor: "{colors.secondary}", textColor: "{colors.on-secondary}", typography: "{typography.label-md}" }
  block: { backgroundColor: "{colors.surface-soft}", textColor: "{colors.on-surface}", rounded: "{rounded.none}", padding: 24px }
  block-sun: { backgroundColor: "{colors.secondary}", textColor: "{colors.on-secondary}", rounded: "{rounded.none}", padding: 24px }
  block-green: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.none}", padding: 24px }
  footer: { backgroundColor: "{colors.on-surface}", textColor: "{colors.on-primary}", typography: "{typography.label-md}" }
  page-dark: { backgroundColor: "{colors.neutral-dark}", textColor: "{colors.on-surface-dark}" }
  block-dark: { backgroundColor: "{colors.surface-soft-dark}", textColor: "{colors.on-surface-dark}", rounded: "{rounded.none}", padding: 24px }
---

## Overview
The site reads like a poster, because the brand is one sentence: "I build the foundations teams depend
on." The Hero is one picture made of three things: the line, the band and the person. Everything below it
is short and quiet. It stays on one page.

Key characteristics:
- One idea in the Hero: the person stands across both colours and the text follows their outline.
- Very big type, one short sentence, no labels above it.
- Two colours, green and yellow. Boldness is spent in the Hero.
- Works without JavaScript. Fonts are served from this domain.

## Colors
- **Green** ({colors.primary}): the Hero field and the Fun block. White text only.
- **Yellow** ({colors.secondary}): the band and the Writing block. Ink text only.
- **Ink** ({colors.on-surface}): body text and the footer.
- **White** ({colors.neutral}): the page below the Hero. **Soft** ({colors.surface-soft}): Work blocks.
- **Dark mode** follows the device setting. The Hero keeps its colours; the page turns to
  {colors.neutral-dark} with {colors.surface-soft-dark} blocks.

## Typography
Two families. Archivo Black for the headline and Entry titles, Libre Franklin for everything else. The
headline scales with the screen so its line breaks hold on every phone. The nav and section headings are
the same size as body text; weight separates them.

## Layout
The Hero has no fixed height. Its parts are sized from the screen width, so no gap can open between the
headline and the portrait on any phone. Below it, one intro sentence, then Entries in a 12-column running
bond: rows split 7 and 5, then 5 and 7, with a 6px gap. On phones the blocks stack.

## Elevation & Depth
Flat. The one exception is the portrait's white outline, which cleans its cut edge against both colours.

## Shapes
Square corners everywhere ({rounded.none}). The only curve on the page is the person.

## Components
- **hero**: the green field with the nav, the headline and the portrait.
- **band**: the yellow field holding the About sentence, running behind the portrait.
- **Portrait** (structure, not a token): a greyscale cut-out floated right. Text wraps along its outline
  with `shape-outside`, and the whole figure stays inside the page. It uses the image's transparent
  right margin, never a negative margin, because the shape stretches to the image's margin box.
- **block**, **block-sun**, **block-green**: Entries in the running bond.
- **footer**: ink strip with a plain contact line, email and profile links, and the Version line.
- **page-dark**, **block-dark**: the page below the Hero in dark mode.
- **Hosted pages** under `/fun/` and similar keep their own look. The Home page links to them; it does not
  restyle them.

## Do's and Don'ts
- Do let the text touch the figure's outline.
- Do check every Hero change at 320, 375, 430, 985 and 1280 px.
- Don't crop the figure's arms to gain room for text.
- Don't add labels above the headline, section numbers, gradients, rounded cards or stock imagery.
- Don't add a third colour, or put white text on yellow.
- Don't load fonts or scripts from other origins (analytics is the one exception).
