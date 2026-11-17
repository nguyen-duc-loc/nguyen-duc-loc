# 0007. Experience and education as two full width timeline cards, linked to LinkedIn

**Date**: 2026-11-17
**Status**: In Progress

## Summary

Your work history and schools show at the end of the README as two cards drawn as SVG images (vector images the build writes), one under an `Experience` heading and one under an `Education` heading. Each card has a vertical line with a dot per entry, newest first. The current entry gets a filled dot, and past entries get hollow dots. Both cards link to your LinkedIn profile, and a LinkedIn button sits under them. Everything comes from `content/experience.ts` and `content/education.ts`, so adding an entry there updates the cards with no code change.

## Requirements

**User stories**:
- As a recruiter on Loc's profile, I want to see each role's title, company, dates, and what he did, and each school's degree and dates, so that I can judge his background without leaving GitHub.
- As a screen reader user, I want each card's alt text to carry every word the card shows, so that I get the same history a sighted visitor sees.
- As Loc, I want to add or edit a role or school in `content/` and see the README update, and I want the build to stop me if a list grows past what the card was designed for.

**Acceptance criteria**:
- **AC-1**: `src/sections/timeline.ts` exports one section, `timeline`, listed last in `src/readme.ts` (after `leetcodeStats`). Its Markdown is, separated by blank lines: `<h2 align="center">Experience</h2>`, a `<p align="center">` block holding the experience card, `<h2 align="center">Education</h2>`, a `<p align="center">` block holding the education card, and a `<p align="center">` block holding the LinkedIn button. No block has a blank line inside. Each card is a `themedImage` `<picture>` with base `timeline-experience` or `timeline-education` (files `timeline-<list>-light.svg` and `timeline-<list>-dark.svg`), rendered at `width="100%"`.
- **AC-2**: Both lists use the spec 0002 sort: newest `start` first; on a tie, an entry with `end: null` first, then the later `end`, then file order (stable sort). The sort is a pure function shared by both lists. The content files stay in any order.
- **AC-3**: Each role is drawn as, from top to bottom: (1) the title at `textX` in the `heading` style with `fill-accent`, and on the same row the dates right aligned at x = 826 (`text-anchor="end"`) in the `lead` style with `fill-muted`; (2) the company in `lead` with `fill-text`, followed, when `location` is set, by a `fill-muted` `<tspan>` holding ` · ` plus the location; (3) each highlight in file order, a `•` in `fill-muted` at `textX` and the text in `lead` with `fill-text` at `textX + bulletIndent`, wrapped by `wrapLines`, with continuation lines at the same indent. `companyUrl` is not drawn.
- **AC-4**: Each school is drawn as: (1) the school name in `heading` with `fill-accent`, and the dates on the same row as in AC-3; (2) the degree, plus `, ` and the field when `field` is set, in `lead` with `fill-text` at `textX`, wrapped by `wrapLines`; (3) when `note` is set, the note in `lead` with `fill-accent` at `textX`, wrapped by `wrapLines`.
- **AC-5**: Dates are formatted by pure functions with a fixed English month table (`Jan` `Feb` `Mar` `Apr` `May` `Jun` `Jul` `Aug` `Sep` `Oct` `Nov` `Dec`), never `Intl`, `toLocaleString`, or the clock. A month reads `May 2025`. A range reads `May 2025 – Present` when `end` is `null`, `Jun 2024` alone when `start` equals `end`, and `Jan 2025 – May 2025` otherwise. The separator is a space, an en dash (U+2013), and a space. No duration is shown.
- **AC-6**: Each card has a vertical rail: a `line` at x = `railX` from the first entry's dot center to the last entry's dot center, `stroke-border`, `stroke-width` of `railWidth`. A card with one entry has no rail. Each entry has a `circle` at (`railX`, center of its first row), r = `dotRadius`, `stroke-width` of `dotStroke`, drawn after the rail. A current entry (`end: null`) uses `fill-accent stroke-accent`. A past entry uses `fill-surface stroke-accent` (a hollow ring). The word "Present" in the dates always marks the current entry too, so color is never the only cue.
- **AC-7**: `src/svg.ts` gains `wrapLines(text, slot)`, a pure helper that splits `text` on runs of spaces and fills lines greedily, where a line holds at most `floor(slot.width × 5 / (3 × slot.style.size))` characters, counted as `[...line].length` (the same estimate as `fitText`). A word longer than a whole line goes on its own line. It returns each line with its `fitText(line, slot)` result, so an overlong word is squeezed with `textLength` and `lengthAdjust="spacingAndGlyphs"`. Titles, company rows, and school names never wrap: each is one `fitText` call in its slot with a 20px minimum. No text anywhere is cut off or ends in `…`, and every text in both cards is 20px or larger.
- **AC-8**: Rows are `lineHeight` apart, with text centered on each row (`dominant-baseline="central"`). Row k of an entry has center y = `entryTop + lineHeight / 2 + k × lineHeight`. The first entry's top is `layout.pad`, and each next entry starts `entryGap` below the previous entry's last row. A card is `2 × layout.pad + lineHeight × (all rows) + entryGap × (entries − 1)` tall. With today's content the experience card has 11 rows (4, 4, 3) and is 404 tall, and the education card has 5 rows (3, 2) and is 212 tall.
- **AC-9**: Alt text is built from content and passed raw to `themedImage`. Experience: `Experience: ` followed by each role in sorted order as `<title> at <company>[, <location>], <dates>. <highlight> <highlight>`, joined by spaces. Education: `Education: ` followed by each school as `<degree>[, <field>] at <school>, <dates>.[ <note>]`, joined by spaces. In alt text, dates use ` to ` instead of the en dash (`May 2025 to Present`). Each highlight and note gets a final `.` unless it already ends in `.`, `!`, or `?`. Example: `Experience: Junior Solutions Sales at Noventiq Vietnam, Hanoi, Vietnam, May 2025 to Present. Advise customers on Amazon Web Services (AWS) solutions in my first full time role. Cloud Engineer at …`. Content text in the SVGs passes through `escapeXml` exactly once.
- **AC-10**: Both card `<picture>` elements are wrapped in `<a href>` to `profileUrls(accounts).linkedin`, the way the LeetCode cards link to LeetCode. The button block holds one `<a href>` to the same URL wrapping a `<picture>` that points at the existing `contact-linkedin-light.svg` and `contact-linkedin-dark.svg` (rendered at `width="148"`, alt text `Full work history on LinkedIn`). The timeline section returns no button asset, so no file is written twice.
- **AC-11**: `src/guards.ts` gains `checkReadmeAssets(readme, assets)`, run by `build` with the other guards: every `assets/generated/<file>` named in a `src` or `srcset` attribute of `README.md` must be in the generated asset list, else it reports `README references a missing generated asset: <file>` and nothing is written. Removing the About me LinkedIn button would then fail the build instead of showing a broken image.
- **AC-12**: `checkContent` reports `experience: must have 1 to 6 items (has K)` and `education: must have 1 to 4 items (has K)`, replacing the "at least 1" messages for these two lists, in the same report position. The build then writes nothing, as for every content problem.
- **AC-13**: The cards have no animation and use no `enter`, `grow`, `gauge`, or `rise` class. Both SVG pairs pass the existing guards. On GitHub, in a light and a dark theme, on desktop and on a phone, every word is readable, no text overflows its card or overlaps the dates, and every link opens the LinkedIn profile. `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md` pass, and a second `pnpm build` leaves `git status` clean.
- **AC-14**: Adding, removing, or editing a role or school in `content/` (within the rules) and running `pnpm build` changes the cards, their alt text, and their height as defined above, with no change under `src/`.
- **AC-15**: `src/theme.ts` adds a `timelineCard` constant holding every size in *Timeline card anatomy*, and the section reads every size from it, `layout`, and `typography`. `docs/design.md` gains an *Experience and education* section, a *Timeline card anatomy* section, a `wrapLines` entry in *How sections draw* and *Text fitting*, and replaces the line "Feature 9's LinkedIn button reuses `pillButton`" with the file reuse in AC-10, with the same values.

## Decision

**Chosen option**: Option 1: Two full width SVG cards with a vertical rail.

The timeline is two static full width cards (Experience, then Education) at the end of the README, drawn from `content/` with a new `wrapLines` helper, both linked to LinkedIn, with the existing LinkedIn pill under them.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for type stripping rules and pure module style in the new section and helper.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch** (no change to `content/types.ts`; spec 0002 owns it):

| Entity | Fields read | Rules added here |
|---|---|---|
| `Role` (`content.experience`, 1:N) | `title`, `company`, `location?`, `start`, `end` (`null` = current), `highlights` (1 to 2) | list has 1 to 6 items |
| `School` (`content.education`, 1:N) | `school`, `degree`, `field?`, `start`, `end`, `note?` | list has 1 to 4 items |

`Role.companyUrl` stays in the type and the content check, unused by this section.

**Timeline card anatomy** (both cards; drawn by `card()` at `layout.full` 850 wide, rendered at `width="100%"`; new values in `timelineCard`; colors by class only):

| Element | Geometry | Style |
|---|---|---|
| Rail | `line` at x = 40 (`railX`), from the first dot's center y to the last dot's center y. Omitted with one entry | `stroke-border`, `stroke-width` 2 (`railWidth`) |
| Dot | `circle` at (40, row 0 center y), r = 7 (`dotRadius`), drawn after the rail | `stroke-width` 2 (`dotStroke`). Current: `fill-accent stroke-accent`. Past: `fill-surface stroke-accent` |
| Text column | Starts at x = 72 (`textX`), ends at x = 826 (`layout.full − layout.pad`), 754 wide | |
| Row 0, left | Title or school name at x = 72, `text-anchor="start"`, `fitText` in a 510 slot (754 − `dateSlot` 228 − `titleGap` 16), min 20 | `heading`, `fill-accent` |
| Row 0, right | Dates at x = 826, `text-anchor="end"`, `fitText` in 228 (`dateSlot`), min 20 | `lead`, `fill-muted` |
| Role row 1 | Company, then `<tspan class="fill-muted"> · <location></tspan>` when set, at x = 72, one `fitText` over the whole string in 754, min 20 | `lead`, `fill-text` |
| Role highlight rows | Per highlight: `•` at x = 72 on its first row, lines from `wrapLines` at x = 92 (`textX + bulletIndent` 20) in a 734 slot (61 characters), min 20 | `•` `lead` `fill-muted`; text `lead` `fill-text` |
| School degree rows | `<degree>[, <field>]` lines from `wrapLines` at x = 72 in 754 (62 characters), min 20 | `lead`, `fill-text` |
| School note rows | Note lines from `wrapLines` at x = 72 in 754, min 20 | `lead`, `fill-accent` |
| Rows | Row k center y = `entryTop + 14 + k × 28` (`lineHeight` 28), `dominant-baseline="central"` | |
| Entries | First `entryTop` = 24 (`layout.pad`). Next `entryTop` = previous top + rows × 28 + 24 (`entryGap`) | |
| Height | `48 + 28 × (all rows) + 24 × (entries − 1)` | |

A squeezed line writes `textLength` and `lengthAdjust="spacingAndGlyphs"`, as in every other card. `timelineCard` is `{ railX: 40, railWidth: 2, dotRadius: 7, dotStroke: 2, textX: 72, bulletIndent: 20, dateSlot: 228, titleGap: 16, lineHeight: 28, entryGap: 24 } as const satisfies { readonly [name: string]: number }`.

Colors: `text`, `muted`, and `accent` on `surface` are already in the contrast table, so the cards need no new pair or token.

**Module surface** (no HTTP endpoints):

| Export | Where | Signature | Notes |
|---|---|---|---|
| `timeline` | `src/sections/timeline.ts` | `Section` | The only export of the section file |
| `wrapLines` | `src/svg.ts` | `(text: string, slot: TextSlot) => readonly { readonly text: string; readonly fit: FitResult }[]` | Pure. Uses the `TextSlot` type `fitText` already takes |
| `checkReadmeAssets` | `src/guards.ts` | `(readme: string, assets: readonly GeneratedAsset[]) => string[]` | Called in `build` after `checkReadme` |
| `timelineCard` | `src/theme.ts` | constant | Values above |

Date formatting, the sort, row layout, and alt text are module private functions in `src/sections/timeline.ts`. The README markup per card is `<a href="<linkedin url>">` plus the `themedImage` markdown plus `</a>`, with the URL passed through `escapeXml`, as in `src/sections/about.ts`. The button markup comes from `themedImage({ base: "contact-linkedin", alt: "Full work history on LinkedIn", width: 148, render: (theme) => pillButton(theme, { icon: "linkedin", label: "LinkedIn" }) })` with its `assets` dropped.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Experience card | Title, company, location, highlights | `content.experience[i]` |
| Experience card | Order of roles | Spec 0002 sort contract, on `start` and `end` |
| Both cards | Month text (`May`) | Fixed month table in `timeline.ts`, from the `MM` part of `YearMonth` |
| Both cards | Year text | The `YYYY` part of `YearMonth`, as written |
| Both cards | "Present" | `end === null` |
| Both cards | Single month vs range | `start === end` (string compare) |
| Both cards | Current vs past dot | `end === null` |
| Education card | School, degree, field, note | `content.education[i]` |
| Both cards | Wrapped lines and font size | `wrapLines` and `fitText` on the text, slot widths from `timelineCard` and `layout` |
| Both cards | Card height | Derived from the row count and `timelineCard` (AC-8) |
| Both cards | Alt text | Derived from the same content and dates (AC-9) |
| Card links and button | LinkedIn URL | `profileUrls(content.profile.accounts).linkedin` (spec 0002) |
| Button | Image files | The `contact-linkedin` pair written by `about` (spec 0004) |
| Button | Rendered width 148 | `button.width + 2 × button.margin` |

**Key invariants**:
- The section is pure: it reads only `ctx.content`, never the clock, the locale, the network, or the file system.
- Every text in both cards is 20px or larger, and every size comes from `src/theme.ts`.
- Text is never cut off: it wraps (body text) or shrinks and squeezes (single line text).
- Every file the README names exists in the generated assets (enforced by `checkReadmeAssets`).
- The same content gives byte identical output.

**Security model**: All content is public and written by Loc. There are no secrets, no new permissions, and no outside data. Content text is escaped once (`escapeXml` in SVG and in the `href`, `themedImage` for alt). The existing guards reject scripts, outside links, and event attributes in every SVG.

**Configuration required**: None.

**Edge cases**:
- One role or one school: no rail, one dot.
- No `location`: row 1 shows only the company. No `field`: the degree alone. No `note`: no note rows.
- Several current entries: each gets a filled dot. The sort orders them by `start`.
- A word longer than a line (for example a URL in a highlight): its own line, squeezed to the slot.
- A title or school name over 42 characters: squeezed in its 510 slot. It never collides with the dates.
- Text with characters XML forbids: already rejected by `checkContent`.

**Critical test scenarios**:
- Happy path: `pnpm build` with today's content writes four `timeline-*` SVGs, the README ends with the two headings, the two linked cards, and the button block; cards are 404 and 212 tall, verifies **AC-1**, **AC-3**, **AC-4**, **AC-8**, **AC-10**.
- Sort and dates: temporarily give FPT Software `end: null` and a role `start` equal to `end`. The current entries get filled dots and come first by `start`, and the single month shows alone, verifies **AC-2**, **AC-5**, **AC-6**.
- Wrapping: a temporary highlight with a 70 character word builds, the word sits on its own squeezed line, and nothing ends in `…`, verifies **AC-7**.
- Caps: a seventh role makes the build fail with `experience: must have 1 to 6 items (has 7)` and write nothing, verifies **AC-12**.
- Missing file: renaming the About me LinkedIn base makes the build fail with `README references a missing generated asset: contact-linkedin-light.svg`, verifies **AC-11**.
- Alt text: the experience alt text matches AC-9 word for word with today's content, verifies **AC-9**.
- GitHub: light and dark themes, desktop and phone, every link opens LinkedIn, verifies **AC-13**.
- Content edit: add a role and rebuild with no `src/` change, verifies **AC-14**.

## Build plan

Skateboard: the first milestone ships the whole timeline readable on GitHub; later milestones add the button and the safety rules.

1. **Milestone 1: both timeline cards live.**
   1. Add `timelineCard` to `src/theme.ts`, satisfies **AC-15**.
   2. Add `wrapLines` to `src/svg.ts`, satisfies **AC-7**.
   3. Write `src/sections/timeline.ts`: the sort, date formatting, role and school rows, rail and dots, height, alt text, and the two linked cards under their headings, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-8**, **AC-9**, **AC-10**.
   4. Append `timeline` to `sections` in `src/readme.ts` and run `pnpm build`, satisfies **AC-1**, **AC-14**.
2. **Milestone 2: LinkedIn button and the asset reference guard.**
   1. Add the button block reusing the `contact-linkedin` files, satisfies **AC-10**.
   2. Add `checkReadmeAssets` to `src/guards.ts` and call it in `build`, satisfies **AC-11**.
3. **Milestone 3: content caps, design doc, and every check.**
   1. Change the `experience` and `education` counts in `checkContent` to 1 to 6 and 1 to 4, satisfies **AC-12**.
   2. Update `docs/design.md` per AC-15, satisfies **AC-15**.
   3. Run `pnpm typecheck`, `pnpm lint`, `pnpm build` twice, and `pnpm lint:md`, then check both themes on desktop and phone on GitHub, satisfies **AC-13**.

## Consequences

**Positive**:
- The whole history is on the profile, drawn in the same theme as every other card.
- `wrapLines` is reusable by later cards with long text (featured projects descriptions, feature 14).
- The new guard protects every section from pointing at a file that no section writes.

**Negative / tradeoffs**:
- Card text can't be selected, searched with the browser's find, or translated. Alt text carries it for screen readers only.
- The character estimate is wide, so wrapped lines end short of the card edge on most fonts, and long names may be squeezed when they would fit.
- The timeline depends on About me keeping its LinkedIn button files. The guard makes that a build failure, not a silent broken image.
- 20px text makes the cards tall: 404px for three roles, about 1,200px at the 6 role cap.
- `companyUrl` exists in the content but shows nowhere.

**Neutral**:
- The timeline sits at the end of the README until features 10 to 14 add sections. Their specs decide whether they go before or after it.
- Four new generated SVG files. No new token, icon, dependency, or snapshot.
