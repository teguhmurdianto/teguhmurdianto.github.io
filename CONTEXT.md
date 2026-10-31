# tmurdianto.com

Teguh Murdianto's personal site: a branded home page and a host for pages he builds elsewhere.

## Language

**Home sheet**:
The home page, drawn as one sheet in the Drawing Set design.
_Avoid_: landing page, index

**Section**:
A numbered part of the home sheet that groups entries: Work, Writing or Fun.
_Avoid_: category, tab

**Entry**:
One item listed in a section, with a code such as `F-01`, a title, a line of text and an optional link.
_Avoid_: card, post, item

**Hosted page**:
A page built in another repo and served on this domain under a section path, keeping its own look.
_Avoid_: app, embed, sub-site

**Snapshot**:
The built output of a hosted page's source repo at one recorded commit, placed under its section path.
_Avoid_: copy, export, vendored build

**Source repo**:
The repo a hosted page is built from; it owns the page's code.
_Avoid_: upstream, origin project

**Revision**:
A dated line in a sheet's revision table saying what changed.
_Avoid_: changelog entry, version

## Relationships

- The **Home sheet** has three **Sections**; each **Section** has zero or more **Entries**.
- A **Hosted page** is built from exactly one **Source repo** and is live as exactly one **Snapshot**.
- A **Hosted page** is listed on the **Home sheet** by one **Entry**; an **Entry** may also link elsewhere.
- Every change to a sheet adds a **Revision**.

## Example dialogue

> **Dev:** "Teguh fixed a bug in Creative Toddler. Do we redeploy the site?"
> **Owner:** "Only once I take a new **Snapshot** from its **Source repo**. The **Entry** on the **Home
> sheet** stays the same; the **Revision** table gets a line."

## Flagged ambiguities

- "page" covered both the **Home sheet** and a **Hosted page**: resolved, they are distinct.
