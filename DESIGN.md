---
version: alpha
name: Drawing Set
description: tmurdianto.com as an engineer's drawing set. Off-white sheets, fine ink linework, a title block and revision table on every page, one blueprint-blue accent. Dark mode is the blueprint itself.
colors:
  primary: "#1F4E9C"
  on-primary: "#FFFFFF"
  neutral: "#F7F6F2"
  surface: "#FFFFFF"
  on-surface: "#1A1D21"
  secondary: "#5A6270"
  hairline: "#C9CDD2"
  sheet-dark: "#0E2A52"
  on-sheet-dark: "#EAF0F8"
  accent-dark: "#9CC3FF"
  hairline-dark: "#3D5C88"
  paper-dark: "#0A1F3D"
  secondary-dark: "#B4C3D8"
typography:
  headline-display: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: 40px, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.01em }
  headline-md: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: 20px, fontWeight: 600, lineHeight: 1.3 }
  body-md: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: 17px, fontWeight: 400, lineHeight: 1.6 }
  label-md: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12px, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.08em }
rounded: { none: 0px }
spacing: { xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 48px }
components:
  page: { backgroundColor: "{colors.neutral}", textColor: "{colors.on-surface}", typography: "{typography.body-md}" }
  sheet: { backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", rounded: "{rounded.none}", padding: 24px }
  sheet-label: { backgroundColor: "{colors.surface}", textColor: "{colors.secondary}", typography: "{typography.label-md}" }
  link: { backgroundColor: "{colors.surface}", textColor: "{colors.primary}" }
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label-md}", rounded: "{rounded.none}", padding: 12px }
  divider: { backgroundColor: "{colors.hairline}", height: 1px }
  page-dark: { backgroundColor: "{colors.sheet-dark}", textColor: "{colors.on-sheet-dark}" }
  link-dark: { backgroundColor: "{colors.sheet-dark}", textColor: "{colors.accent-dark}" }
  divider-dark: { backgroundColor: "{colors.hairline-dark}", height: 1px }
  paper-dark: { backgroundColor: "{colors.paper-dark}", textColor: "{colors.on-sheet-dark}" }
  sheet-label-dark: { backgroundColor: "{colors.sheet-dark}", textColor: "{colors.secondary-dark}", typography: "{typography.label-md}" }
---

## Overview
The site is a bound set of construction drawings, because the brand is "I build the foundations teams
depend on". Every page is a sheet in the same frame: a drawing title at the top, numbered sections, and a
title block with a revision table at the bottom. It reads as calm, exact and dependable. Nothing on a sheet
is decoration; if a mark doesn't carry information, it doesn't go on the sheet. The work leads; the person
appears in the title block and one small figure.

Key characteristics:
- One frame on every page. Nothing surprises.
- Structure is visible: hairline rules, a faint grid, numbered sections.
- One accent colour, used for links and marks only.
- Works without JavaScript. System fonts only; nothing loaded from another origin except analytics.

## Colors
- **Blueprint blue** ({colors.primary}): the only accent. Links, the one primary action, section marks.
  Never body text.
- **Paper** ({colors.neutral}): the page floor behind the sheet, with a faint grid.
- **Sheet** ({colors.surface}): the drawing sheet itself.
- **Ink** ({colors.on-surface}): all text and the sheet border. **Graphite** ({colors.secondary}): labels,
  dates and captions only.
- **Hairline** ({colors.hairline}): 1px rules and the background grid.
- **Dark mode** follows the device setting and turns the sheet into a blueprint: {colors.sheet-dark} sheet,
  {colors.on-sheet-dark} linework and text, {colors.secondary-dark} labels, {colors.accent-dark} links,
  {colors.hairline-dark} rules, on a {colors.paper-dark} floor.

## Typography
Two families. The system sans for reading; a monospace in small capitals for every label, code and date,
like the lettering on a drawing. Hierarchy comes from size, weight and the label lines, never from colour.
{typography.headline-display} is used once per page, for the drawing title.

## Layout
One sheet, max 880px wide, centred on the paper with {spacing.lg} around it (16px on phones). Sections stack
in a single column, each opened by a label line such as `01 / ABOUT` and a hairline rule. Spacing follows
the scale {spacing.xs} to {spacing.xl}; sections are separated by {spacing.xl}.

## Elevation & Depth
Flat. The sheet sits on the paper with a 1px ink border, never a shadow. Depth is shown by the frame and
rules only.

## Shapes
Square corners everywhere ({rounded.none}). Drawings don't round their frames.

## Components
- **page**: paper floor with a faint hairline grid.
- **sheet**: the white drawing area with a 1px ink border.
- **sheet-label**: monospace small-capital labels: section numbers, codes like `W-01`, dates, figure captions.
- **link**: blueprint blue, underlined on hover and focus.
- **button-primary**: square, filled blueprint blue; at most one per page.
- **divider**: a 1px hairline rule under each section label.
- **page-dark**, **paper-dark**, **sheet-label-dark**, **link-dark**, **divider-dark**: the same parts in blueprint mode.
- **Title block** (structure, not a token): a bordered grid at the foot of every sheet holding name,
  location, contact links and the revision table (`REV`, `DATE`, `NOTE`).
- **Hosted pages** under `/fun/` and similar keep their own look. The home sheet links to them; it does not
  restyle them.

## Do's and Don'ts
- Do date every page in its revision table when it changes.
- Do number sections and give work items a code (`W-01`).
- Don't add gradients, glows, shadows, rounded cards or stock imagery.
- Don't use more than one accent colour, or colour body text.
- Don't load fonts or scripts from other origins (analytics is the one exception).
