# tmurdianto.com

Teguh Murdianto's personal site: a branded home page and a host for pages he builds elsewhere.

## Language

**Home page**:
The page at `/`, built in the Poster design.
_Avoid_: landing page, index

**Hero**:
The top of the Home page: the brand line, one About sentence and the portrait.
_Avoid_: banner, header

**Section**:
A group of Entries on the Home page: Work, Writing or Fun.
_Avoid_: category, tab

**Entry**:
One item listed in a Section, with a title, a line of text and an optional link.
_Avoid_: card, post, item

**Hosted page**:
A page built in another repo and served on this domain under a section path, keeping its own look.
_Avoid_: app, embed, sub-site

**Snapshot**:
The built output of a hosted page's source repo at one recorded commit, placed under its section path.
_Avoid_: copy, export, vendored build

**Hosted page record**:
The line in `src/data/hosted-pages.json` saying which Source repo, commit and build command a Snapshot came from.
_Avoid_: manifest, lockfile

**Source repo**:
The repo a hosted page is built from; it owns the page's code.
_Avoid_: upstream, origin project

**Version line**:
The short commit hash in the footer of every page, showing which commit the site was built from.
_Avoid_: changelog, release, last changed

## Relationships

- The **Home page** has one **Hero** and three **Sections**; each **Section** has zero or more **Entries**.
- A **Hosted page** is built from exactly one **Source repo** and is live as exactly one **Snapshot**.
- A **Hosted page** is listed on the **Home page** by one **Entry**; an **Entry** may also link elsewhere.
- The build sets the **Version line**; nobody edits it by hand.

## Example dialogue

> **Dev:** "Teguh fixed a bug in Creative Toddler. Do we redeploy the site?"
> **Owner:** "Only once I take a new **Snapshot** from its **Source repo**. The **Entry** on the **Home
> page** stays the same; the **Version line** moves on at the next deploy."

## Flagged ambiguities

- "page" covered both the **Home page** and a **Hosted page**: resolved, they are distinct.
