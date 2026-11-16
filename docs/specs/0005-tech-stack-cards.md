# 0005. Tech stack as four half cards of icon chips, with stack icons typed against the icon registry

**Date**: 2026-11-16
**Status**: In Progress

## Summary

The Tech stack section shows your stack as four small cards (Languages, Frameworks, Tools, Cloud), two side by side on desktop and stacked on phones. Each card lists its items as chips (small rounded boxes with an icon and a name) in two columns. An item with no icon, like AWS today, gets the same chip with just its name. Every stack icon must exist in `src/icons.ts`: a wrong slug (the short icon name Simple Icons uses, like `typescript`) fails both `pnpm typecheck` and the build, so a typo can never reach your profile.

## Context

Feature 7 is the third section a visitor sees, right after About me. It answers "what does Loc work with?" at a glance, for recruiters skimming and developers checking for overlap. Spec 0002 already defines the data: `content.stack` holds four categories (`languages`, `frameworks`, `tools`, `cloud`), each a list of items with a `name` and an optional `icon` slug, rendered in file order. Today that is 12 items: 4 languages, 2 frameworks, 5 tools, and 1 cloud item (AWS, with no icon). Spec 0002 left three things to this feature: how a slug becomes a self contained, theme aware icon, how an item without an icon looks, and whether to tighten the `icon` check to known slugs.

Forces:
- Spec 0004 already settled where icons come from: one registry, `src/icons.ts`, with path data copied from one pinned Simple Icons release (`simple-icons@16.38.0`), painted with `fill-accent`, and hand drawn when a brand is missing. All 11 slugs in `content/stack.ts` exist in that release. AWS does not (Simple Icons dropped it).
- `docs/design.md` sets the sizes text may use. A full width image shrinks to about 42% on a phone, so it may only use text 20px and up. Half cards (400 wide, rendered at `width="400"`) may use `body` (14px) and `label` (12px). The motion inventory says the tech stack has no animation.
- An SVG shown through `<img>` can't hold a working link, and GitHub follows the visitor's theme only through `<picture>` with a light and a dark file.
- `StackItem.icon` is a free `string` today, checked only against `^[a-z0-9]+$`. The registry's `IconName` type only accepts known keys, so a section can't pass a stack slug to `iconSvg` without either a type change or a runtime narrowing. Node strips types without checking them, so a type alone protects only when the commit hook or CI runs.
- `content.stack` has no upper limit per category. Any layout that keeps cards the same height grows every card when one category grows.
- Output must be byte identical on every build, and sections may not write sizes, colors, or fonts themselves: those come from `src/theme.ts`.

## Requirements

**User stories**:
- As a recruiter visiting Loc's profile, I want to see his languages, frameworks, tools, and cloud platforms grouped and labeled, so that I can match him to a role in a few seconds.
- As a screen reader user, I want each group announced with its items, so that I get the same list a sighted visitor sees.
- As Loc, I want to add, remove, or reorder a stack item in `content/stack.ts` and see the README update, and I want a misspelled icon slug to fail before it reaches my profile.

**Acceptance criteria**:
- **AC-1**: Right after the About me contact buttons, `README.md` contains `<h2 align="center">Tech stack</h2>`, then a blank line, then one `<p align="center">` block with no blank lines inside. The block holds four `<picture>` elements from `themedImage`, in this order: Languages, Frameworks, Tools, Cloud. Each uses the base `stack-<category>` (`stack-languages`, `stack-frameworks`, `stack-tools`, `stack-cloud`), so the files are `stack-<category>-light.svg` and `stack-<category>-dark.svg`, rendered at `width="400"`. No card is wrapped in a link.
- **AC-2**: Each card is drawn by `card()` at `layout.half` (400) wide. It shows its category label (`Languages`, `Frameworks`, `Tools`, `Cloud`) in the `heading` style with `fill-accent`, then one chip per item in file order, laid out in two columns, filling each row left to right before starting the next. Geometry follows *Stack card anatomy* below. Each chip is a `fill-surface stroke-border` rect with `radius.small`, holding a 16px icon in `fill-accent` and the item name in the `body` style with `fill-text`, sized by `fitText` with a 12px minimum.
- **AC-3**: An item without `icon` (AWS today) gets the same chip with no icon and no placeholder glyph. Its name starts where the icon would start, and its text slot is wider by the icon and gap (144px instead of 120px).
- **AC-4**: All four cards have the same height: `76 + 40 × rows` px, where `rows = ceil(n / 2)` and `n` is the item count of the largest category. With today's content (Tools has 5 items) that is 3 rows, so every card is 196 tall.
- **AC-5**: Each card's alt text is `<Label>: <name>, <name>, …` with every item name in file order, for example `Languages: TypeScript, Go, C++, Bash` and `Cloud: AWS`. It is built from `content.stack` and passed raw to `themedImage`, which escapes it. Item names in the SVG pass through `escapeXml` exactly once.
- **AC-6**: `StackItem.icon` in `content/types.ts` is typed as `IconName` (`import type` from `../src/icons.ts`), so a slug that isn't in the registry fails `pnpm typecheck`. `checkContent` also checks it at build time: an `icon` that isn't a key of the registry reports `stack.<category>[i].icon: must be an icon in src/icons.ts`. This replaces the old `^[a-z0-9]+$` pattern check, in the same position in the report order.
- **AC-7**: `checkContent` reports `stack.<category>: must have 1 to 8 items (has K)` when a category has more than 8 items (or none), replacing the old "at least 1" message for stack categories. The build then writes nothing, as for every content problem.
- **AC-8**: `src/icons.ts` gains 11 entries, one per slug used in `content/stack.ts` (`cplusplus`, `docker`, `git`, `gnubash`, `go`, `kubernetes`, `linux`, `nextdotjs`, `react`, `terraform`, `typescript`). Each path is copied unchanged from `simple-icons@16.38.0` with `source: SIMPLE_ICONS`, holds path data only (no color, fill, stroke, or transform), and entries stay in alphabetical key order.
- **AC-9**: The cards have no animation. Every card SVG passes the existing build guards (self contained, light and dark twins, color classes only). On GitHub, in both a light and a dark theme, the four cards show two per row on desktop and one per row on a phone, every name is readable, and no text or chip overflows its card. `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md` pass, and a second `pnpm build` leaves `git status` clean.
- **AC-10**: Adding, removing, or reordering an item in `content/stack.ts` (using an icon already in the registry, or no icon) and running `pnpm build` changes the cards, their alt text, and their height as defined above, with no change under `src/`.
- **AC-11**: `src/theme.ts` adds a `stackCard` constant holding the sizes in *Stack card anatomy*, and the section reads every size from it, `layout`, `radius`, and `typography`. `docs/design.md` gains a *Tech stack* section, a *Stack card anatomy* section, and the 11 new rows in the icon registry table, with the same values.

## Options considered

### Option 1: Four half cards, one per category, with chips in two columns

Each category is its own 400 wide card, so two sit side by side on desktop and stack on phones. The label is the card heading. Items are icon plus name chips in a two column grid.

**Pros**:
- Uses the existing half card size, where 14px names are allowed, so names stay readable on every screen.
- Each card gets its own alt text, so a screen reader hears one group at a time.
- Reuses `card()`, `iconSvg`, and `fitText` with no new helper.

**Cons**:
- Labels are drawn inside the SVG, so they can't be selected or translated.
- Equal heights leave empty space in short categories (Cloud has one chip in a 3 row card).
- Four image pairs (8 files) instead of one.

### Option 2: One full width card with a row per category

A single 850 wide card, a label column on the left, and the chips for each category in one row.

**Pros**:
- One image and one alt text for the whole section.
- Every category lines up in a single table like layout.

**Cons**:
- Full width text must be 20px or larger. Five tools plus a label column don't fit in 850px at that size, so names get squeezed.
- A category with many items needs a second row, which breaks the one row per category idea.

### Option 3: Markdown labels with a pill per item

Each category label is real Markdown text, followed by one `pillButton` image per item.

**Pros**:
- Labels are real text: selectable, translatable, themed by GitHub.
- Pills wrap naturally on any screen width.

**Cons**:
- 12 image pairs today (24 files), one more per new item.
- The pills look exactly like the contact buttons above them, but they aren't links, which confuses visitors.

### Option 4: Icons only, names in alt text

A compact grid of icons with no visible names.

**Pros**:
- Smallest and most visual.

**Cons**:
- Fails the scope's "grouped and labeled": a visitor has to recognize every logo.
- AWS has no icon, so it would vanish.

## Decision

**Chosen option**: Option 1: Four half cards, one per category, with chips in two columns.

The section draws four equal height half cards of icon chips from `content.stack`, an item without an icon shows as a name only chip, and `StackItem.icon` is typed as `IconName` and checked against the registry at build time.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for the type only import from `content/types.ts` into `src/icons.ts` under type stripping.

## Rationale

The deciding force is readability on phones. Only half cards may use 14px text, and a phone shows a full width image at about 42% of its size, so Option 2 either squeezes names or overflows. Option 1 keeps every name at 14px with room to spare: a 168px chip leaves a 120px text slot, and `Kubernetes` (10 characters) fits without squeezing. Option 3 has real text labels, which is its real advantage, but it makes pills that look clickable and aren't, right under the contact buttons that are. Option 4 fails the scope outright. The runner up is Option 3, worth revisiting only if selectable labels ever matter more than a clean grid.

Equal card heights keep the two by two grid lined up on desktop, where a ragged pair is the most visible flaw. The cost is empty space in short categories, so a cap of 8 items per category (4 rows) keeps that cost bounded: one long category can never stretch all four cards. The runner up was matching heights per pair, which saves space but makes the two rows differ.

A name only chip for AWS is the simplest honest choice. It keeps the chip outline, so the grid stays even, and it needs no hand drawn glyph to maintain. A drawn AWS logo would carry the brand risk that made Simple Icons drop it. Fallback glyphs per category were the runner up: they look more finished, but add four icons for one item.

Typing `icon` as `IconName` makes a misspelled slug an editor and `pnpm typecheck` error, and the build time check covers the case where Node runs without type checking. That is the same "each rule twice" pattern spec 0002 uses everywhere. Keeping `string` with only a runtime check (the runner up) loses the editor error and forces the section to narrow the type itself. The type import goes from `content/types.ts` to `src/icons.ts`, which imports nothing from `content/`, so there is no import cycle.

## Feature design

**Data model sketch** (changes to spec 0002's model only):

| Entity (file, type) | Field | Type | Required | Change |
|---|---|---|---|---|
| StackItem (`content/types.ts`, `StackItem`) | `name` | string | yes | unchanged |
| | `icon` | `IconName` (a key of `icons` in `src/icons.ts`) | optional | was `string` |
| Stack (`content/types.ts`, `Stack`) | `languages`, `frameworks`, `tools`, `cloud` | `StackItem[]` | yes, 1 to 8 items each | was at least 1, no maximum |
| Icon registry (`src/icons.ts`, `icons`) | 11 new keys (AC-8) | `Icon` (`path`, `source`) | n/a | added |

**Stack card anatomy** (all values in px; the `stackCard` constant in `src/theme.ts` holds the new ones, the rest come from existing tokens):

| Constant | Value | Notes |
|---|---|---|
| `stackCard.columns` | 2 | chips per row |
| `stackCard.headingGap` | 16 | from the heading box (20 tall) to the first chip row |
| `stackCard.chipHeight` | 32 | |
| `stackCard.gapX` | 16 | between the two columns |
| `stackCard.gapY` | 8 | between chip rows |
| `stackCard.chipPadX` | 12 | chip edge to icon, and text end to chip edge |
| `stackCard.icon` | 16 | icon size |
| `stackCard.iconGap` | 8 | icon to name |
| card width | `layout.half` (400) | |
| inner width | 352 | `layout.half − 2 × layout.pad` |
| chip width | 168 | `(352 − gapX) / columns` |
| heading | x = 24, center y = 34 | `layout.pad`, `pad + 10`; `dominant-baseline="central"`, `text-anchor="start"`, `heading` style (fixed label, no `fitText` needed) |
| chip at index i | x = `24 + (i mod 2) × 184`, y = `60 + floor(i / 2) × 40` | 184 = chip width + `gapX`; 60 = `pad + 20 + headingGap`; 40 = `chipHeight + gapY` |
| chip rect | at (x + 0.5, y + 0.5), 167 × 31, `rx` of `radius.small`, `fill-surface stroke-border`, `stroke-width` of `layout.border` | the same half pixel inset as `card()` |
| icon | `iconSvg(icon, x + 12, y + 8, 16, "fill-accent")` | vertically centered |
| name, with icon | x = x + 36, center y = y + 16, slot 120 | `body` style, `fill-text`, `fitText` minimum 12; writes `textLength` and `lengthAdjust="spacingAndGlyphs"` when squeezed |
| name, without icon | x = x + 12, center y = y + 16, slot 144 | same style |
| card height | `76 + 40 × rows` | `2 × pad + 20 + headingGap + rows × 40 − gapY`; `rows = ceil(max category count / 2)`, shared by all four cards |

**API surface** (module exports, no network):

| Export | Signature | Used by | Failure |
|---|---|---|---|
| `techStack` (`src/sections/stack.ts`) | `Section`, pure `(ctx: BuildContext) => SectionOutput` | `src/readme.ts`, listed right after `about` | none: inputs already checked by `checkContent` |
| `stackCard` (`src/theme.ts`) | `as const satisfies { readonly [name: string]: number }` constant | `src/sections/stack.ts` | type error |
| `icons` (`src/icons.ts`) | existing registry, 11 new keys | `iconSvg`, `content/types.ts` (type only), `src/content.ts` | type error on an unknown key |
| `checkContent` (`src/content.ts`) | existing; stack rules changed per AC-6 and AC-7 | `build.ts`, `refresh.ts` | returns problem lines |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| `techStack` | section heading `Tech stack` | constant in `src/sections/stack.ts` (decided here) |
| `techStack` | category labels `Languages`, `Frameworks`, `Tools`, `Cloud` | constants in `src/sections/stack.ts`, one per key of `Stack`, in the order `languages`, `frameworks`, `tools`, `cloud` (decided here) |
| `techStack` | card order | the same category order (spec 0002's stack category order) |
| `techStack` | item names and their order | `content.stack.<category>[i].name`, file order (spec 0002) |
| `techStack` | icon path for an item | `icons[item.icon].path` through `iconSvg` |
| `techStack` | whether a chip has an icon | `item.icon === undefined` |
| `techStack` | rows and card height | derived: `ceil(max(len(languages), len(frameworks), len(tools), len(cloud)) / 2)`, then the height formula above |
| `techStack` | every size and position | `stackCard`, `layout`, `radius`, `typography` in `src/theme.ts` |
| `techStack` | colors | color classes only (`fill-surface`, `stroke-border`, `fill-accent`, `fill-text`) |
| `techStack` | alt text | derived: label, `": "`, names joined with `", "` |
| `techStack` | asset base names | `stack-` plus the category key |
| `checkContent` | the icon problem line | `stack.<category>[i].icon: must be an icon in src/icons.ts` (decided here) |
| `checkContent` | the count problem line | spec 0002's wording, `must have 1 to 8 items (has K)` |
| `src/icons.ts` | the 11 new paths | copied from `simple-icons@16.38.0`, `icons/<slug>.svg`, the single `path` `d` value |

**Key invariants**:
- Every stack category has 1 to 8 items, so a card has 1 to 4 chip rows and is at most 236 tall.
- Every stack `icon` is a key of `icons` (type and `checkContent`, checked with `Object.hasOwn`, so `toString` or `constructor` can never pass).
- All four cards share one height. Chips never move based on measured text width: positions depend only on the item index.
- Names never overflow a chip: `fitText` shrinks or squeezes them into the slot (item names are at most 80 characters, per spec 0002).
- Every copied icon in the registry comes from the same pinned release (spec 0004).
- No animation in any card SVG. Output is the same on every build.

**Security model**: Nothing private. Every value in `content/stack.ts` is public, and the section only reads it. Names reach the SVG through `escapeXml` once, and alt text through `themedImage`. The existing build guards reject scripts, outside links, and event attributes in every generated SVG.

**Edge cases**:
- A category with 1 item (Cloud today): one chip in the top left, the rest of the shared height empty.
- An odd count: the last chip sits alone in the left column.
- More than 8 items in a category, or none: `checkContent` fails the build (AC-7), nothing is written.
- A slug with no registry entry: `pnpm typecheck` fails, and `pnpm build` fails with the AC-6 line. To add an icon, copy its path from `simple-icons@16.38.0` into `src/icons.ts` first.
- A brand Simple Icons lacks: leave `icon` out and the item shows as a name only chip.
- A long name: `fitText` shrinks it to 12px, then squeezes it with `textLength`.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: with today's content, `pnpm build` writes 8 `stack-*` SVGs, and the README shows the heading and four cards in order with the expected alt text, each card 196 tall, verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**.
- No icon: the Cloud card shows an AWS chip with its name at x + 12 and no icon element, verifies **AC-3**.
- Wrong slug: change `docker` to `dokcer`. `pnpm typecheck` fails on `content/stack.ts`, and `pnpm build` prints `stack.tools[1].icon: must be an icon in src/icons.ts` and writes nothing, verifies **AC-6**.
- Too many items: add 4 temporary tools (9 in total). `pnpm build` prints `stack.tools: must have 1 to 8 items (has 9)` and writes nothing. Then revert, verifies **AC-7**.
- Registry: every new entry's `path` matches the `d` value of the same slug in `simple-icons@16.38.0`, verifies **AC-8**.
- Data drives layout: move Kubernetes to the front of Tools and remove Linux. Rebuild: the Tools card order and alt text change, and since the largest category now has 4 items, every card drops to 2 rows and 156 tall. Only `content/` changed. Then revert, verifies **AC-10**.
- Both themes on GitHub: open the profile in light and dark themes and on a phone width, verifies **AC-9**.
- Design record: `stackCard` values in `src/theme.ts` match `docs/design.md`, verifies **AC-11**.

## Build plan

Skateboard: the first milestone puts the complete Tech stack section live with real icons, and the second hardens the content check and records the design. Each milestone leaves `main` green and shippable.

1. **Milestone 1: Tech stack cards live.**
   1. Copy the 11 paths from `simple-icons@16.38.0` into `src/icons.ts` with `source: SIMPLE_ICONS`, in alphabetical key order, satisfies **AC-8**.
   2. Change `StackItem.icon` to `IconName` with an `import type` from `../src/icons.ts`, and confirm `pnpm typecheck` passes on the current content, satisfies **AC-6**.
   3. Add the `stackCard` constant to `src/theme.ts`, satisfies **AC-11**.
   4. Write `src/sections/stack.ts` (`techStack`): the heading, the shared row count, one `card()` per category with its chips (with and without icon), and the alt text, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**.
   5. List `techStack` right after `about` in `src/readme.ts`, run `pnpm build`, and check the README markup and file names, satisfies **AC-1**, **AC-10**.
2. **Milestone 2: content rules, design record, and every check.**
   1. In `checkContent`, replace the `STACK_ICON` pattern check with the registry check, and change the stack category count to 1 to 8, satisfies **AC-6**, **AC-7**.
   2. Update `docs/design.md`: a *Tech stack* section, *Stack card anatomy*, and the 11 icon registry rows, satisfies **AC-11**.
   3. Run the critical test scenarios by hand, revert the broken edits, run every check twice, and view the profile on GitHub in a light and a dark theme and at phone width, satisfies **AC-6**, **AC-7**, **AC-9**, **AC-10**.

## Consequences

**Positive**:
- The stack reads cleanly on desktop and phones, and every name stays at a readable size.
- A typo in an icon slug fails in the editor, in `pnpm typecheck`, and in the build.
- Adding a stack item is a content edit, plus copying one icon path when the brand is new.

**Negative / tradeoffs**:
- Category labels live inside the SVG, so they can't be selected or translated.
- Short categories show empty space, since all four cards share the tallest card's height.
- A new brand icon is a code change in `src/icons.ts`, not just a content edit.
- `content/types.ts` now depends on `src/icons.ts` for a type, so content and code are a little more tied together.
- The 8 item cap is a new content rule. Raising it is a small edit to `checkContent`, but every card then grows with it.

**Neutral**:
- 8 new generated files in `assets/generated/`.
- The `^[a-z0-9]+$` stack icon pattern goes away, replaced by the registry check.
- Keys like `email` and `linkedin` become valid stack icons. That is harmless, and no rule blocks it.

## Follow-up

- [x] Spec 0002's *Key invariants* still say a stack category needs "at least 1 item" and `icon` matches `^[a-z0-9]+$`, and its follow up item for feature 7 is now settled by this spec. Done: spec 0002 now marks its stack count and `icon` rules, its `StackItem.icon` type, and that follow up item as superseded here.
- [ ] Two 400 wide cards side by side rely on GitHub's profile README column being at least 804px wide, as spec 0003 assumed for half cards. `/check verify` should confirm the two by two grid on a common desktop width.
