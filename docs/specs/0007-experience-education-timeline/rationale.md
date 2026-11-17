# 0007. Rationale: experience and education as two full width timeline cards, linked to LinkedIn

Decision record for [index.md](index.md). `/develop` does not need this file.

## Context

Feature 9 tells "the full story" for recruiters and hiring managers: where Loc worked, what he did, and where he studied. LinkedIn only shares this data with approved partners, so spec 0002 put it in `content/`: `Role` (company, title, start, end, 1 or 2 highlights of up to 120 characters, optional location and companyUrl) and `School` (school, degree, optional field, start, end, optional note). Spec 0002 also fixed the sort order (newest `start` first; on a tie, a current entry first, then the later `end`, then file order) and said `end: null` shows as "Present". It left one choice to this feature: one shared timeline, or two lists. Today the data holds 3 roles and 2 schools. The degree (Sep 2021 to Feb 2026) overlaps all three roles.

Forces:
- `docs/design.md` allows only text 20px or larger on a full width image, because a phone shows it at about 42% size. At 20px, a 120 character highlight can't fit on one line of an 850 wide card, so it must wrap. No helper wraps text today. `fitText` only shrinks or squeezes one line.
- Text width can't be measured at build time (fonts differ by OS). Every layout rule must work from the `0.6 × size` character estimate and stay byte identical on every build.
- A link inside an `<img>` SVG can't be clicked, so `companyUrl` can't work inside a card. GitHub follows the visitor's theme only through `<picture>`.
- The build rejects two sections writing the same asset file, and the About me section already writes `contact-linkedin-light.svg` and `contact-linkedin-dark.svg`.
- Output must not depend on the clock. A "4 mos" duration for the current role would change the README every month with no content edit.
- The motion inventory in `docs/design.md` lists the timeline as static.
- `checkContent` requires at least 1 role and 1 school, with no maximum, so a card could grow without limit.

## Options considered

### Option 1: Two full width SVG cards with a vertical rail

An `Experience` card and an `Education` card, each 850 wide, with a dot per entry on a vertical line, all text at 20px or larger, highlights wrapped.

**Pros**:
- Matches every other section and both themes, through the existing `card()` and color classes.
- Each list gets the full width, so wrapped highlights stay at 2 lines and readable on a phone.
- Two alt texts, one per list, each a manageable length.

**Cons**:
- Text can't be selected or translated, and the alt text must repeat every word.
- Needs a new wrap helper built on a character estimate, so lines end ragged and a little short on real fonts.

### Option 2: Markdown text (headings and bullet lists)

Real Markdown like About me: a heading per role, the dates, and bullets, with GitHub supplying the theme.

**Pros**:
- Selectable, translatable, and read natively by screen readers. No layout code.
- No wrap estimate: the browser wraps.

**Cons**:
- Looks plain and long next to the cards, and GitHub drops `style`, so there is no rail or dot.
- A hybrid (SVG header per entry, Markdown highlights) mixes two looks and doubles the markup.

### Option 3: One merged timeline

Roles and schools on one rail, sorted by date.

**Pros**:
- One story in one image.

**Cons**:
- The degree overlaps all three roles, so school and jobs interleave and the order looks jumbled.
- Spec 0002's sort compares only one entry type, so a merged sort needs new tie rules.

### Option 4: Two half cards side by side

Experience and Education as 400 wide cards in one row, at 14px.

**Pros**:
- Compact on desktop, both lists visible at once.

**Cons**:
- About 38 characters per line, so a highlight wraps to 4 lines and the cards end at very different heights.

## Rationale

The 20px floor on full width images is the force that decides the layout. At 20px only the full 850 width keeps a 120 character highlight to 2 lines. Half cards would run 4 lines per highlight. Two lists beat one merged rail because the degree overlaps every role, and recruiters read work and school as separate questions. SVG beats Markdown because every other section is a themed card, and the cost (no text selection) is covered by complete alt text.

Calls made in the spec:
- **Dates on the title row, right aligned**: keeps each entry to the fewest rows. A long title or school name shrinks or is squeezed in its 510px slot instead of wrapping (today only the 44 character university name is squeezed, by a few percent). Runner up: dates on their own row, which adds a row to every entry.
- **No card heading inside the SVG**: the `<h2>` above already names the list. Runner up: a heading in the card, which repeats it.
- **Reuse the contact LinkedIn files plus a guard**: the button looks exactly like the one in About me and writes no duplicate file. The new guard catches the one risk, a missing file. Runner up: a new `timeline-linkedin` pair, which duplicates identical SVGs.
- **One section for both lists**: the lists share the sort, dates, rail, and wrap code, and the button belongs after both. Runner up: two sections, which split shared code across files.
- **Caps of 6 roles and 4 schools**: keeps the experience card under about 1,200px tall. Runner up: no cap, which lets the card grow without limit.
