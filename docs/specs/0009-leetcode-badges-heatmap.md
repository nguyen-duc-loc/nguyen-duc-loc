# 0009. LeetCode badges card, badge row, and submission heatmap from the existing LeetCode source

**Date**: 2026-11-17
**Status**: In Progress

## Summary

Your LeetCode section grows three pieces, all from the same LeetCode request and snapshot as spec 0006. A badges half card sits beside the solved card and shows your badge count and your most recent badge. A row of up to 8 badge images follows: your chosen LeetCode badge first, then your newest badges, skipping the monthly Daily Coding Challenge ones. Last comes a full width heatmap of the past year, drawn like LeetCode's (one block per month, mauve cells), with submissions, active days, and max streak above it. Days are UTC because LeetCode groups them that way, and the grid ends on the date refresh ran, so the build never reads the clock.

## Context

Feature 11 finishes the LeetCode page that Loc gave as the design source in spec 0006: that spec drew the contest card and the solved card, and left the badges card and the heatmap for this feature, in the same source and snapshot.

Forces, from a live query on 2026-11-17:
- **Badges.** `matchedUser.badges` returns 62 badges. 41 are monthly Daily Coding Challenge badges (`category: "DCC"`). The other 21 are competition (Guardian), submission (365, 500, 1000 days), annual, quest, and study plan badges. `matchedUser.activeBadge` is the badge Loc chose to display on LeetCode (Guardian today).
- **Badge images.** Each badge has a PNG `icon` and an animated GIF. Most PNGs are 1080 × 1080 and 1 to 1.6 MB, and GitHub's image proxy (camo) passes them through without resizing. Some `icon` values are relative (`/static/images/badges/guardian.png`) and load from `https://leetcode.com`. The rest are absolute under `https://assets.leetcode.com/`. GitHub shows SVGs through `<img>`, which loads no outside images, so a badge image can never sit inside a generated SVG.
- **Calendar.** `matchedUser.userCalendar.submissionCalendar` is a JSON string that maps Unix seconds to a submission count, for LeetCode's rolling past year, which reaches one day further back than 365 days ending today (queried on 2026-11-17, it starts on 2025-11-17). Every key is a UTC midnight, so LeetCode has already grouped submissions into days by UTC. The API gives no time per submission, so the days can't be moved into another timezone. Today: 363 active days from 2025-11-17 to 2026-11-16, 642 submissions, at most 21 in a day, a median of 1, and a 90th percentile of 3. LeetCode's own `streak` (292) and `totalActiveDays` (363) match the values computed over its own wider window.
- **Determinism.** `build` never reads the clock (`AGENTS.md`), yet a past year grid needs a last day.
- **Design rules.** `docs/design.md` gives LeetCode badges and the heatmap no motion. Full width images use only text 20px and up. Colors come only from token classes. Spec 0006 Neutral planned the badges half card in the solved card's `<p>` block and the heatmap as its own block.
- **Untrusted text.** Badge names and icon URLs come from LeetCode and reach alt text, `src` attributes, and SVG text.
- **One source.** Spec 0006 keeps the last good snapshot for the whole source when anything in the response is wrong.

## Requirements

**User stories**:
- As a recruiter, I want to see Loc's LeetCode badges and how steadily he practices, so that I can judge his consistency, not only his totals.
- As a developer who knows LeetCode, I want the badges card and the heatmap to look like LeetCode's, so that I read them the way I read LeetCode.
- As a screen reader user, I want the badges and the heatmap described in alt text with the same numbers, so that I get what a sighted visitor sees.
- As Loc, I want badges and the heatmap to refresh with the stats cards and keep the last good version on a failure, so that my profile never shows broken data.

**Acceptance criteria**:
- **AC-1**: The LeetCode section in `README.md` reads, in order and separated by blank lines: the heading, the contest card block (unchanged), a `<p align="center">` block with the solved card and then the badges card, a `<p align="center">` block with the badge row, and a `<p align="center">` block with the heatmap card. No block has blank lines inside. The badges card (`leetcode-badges`, `width="400"`) and the heatmap card (`leetcode-heatmap`, `width="100%"`) are `themedImage` pictures wrapped in `<a href>` to `profileUrls(accounts).leetcode`. When no badge qualifies for the row, the row block is left out.
- **AC-2**: The `leetcode` source still sends exactly one POST. `QUERY` adds `badges { id displayName icon creationDate category }`, `activeBadge { id }`, and `userCalendar { submissionCalendar }` inside `matchedUser`. `fetch` returns `{ asOf, body }`, where `body` is the parsed JSON and `asOf` is the UTC date (`YYYY-MM-DD`) taken after the body is read. `validate` maps `body` and `asOf` into the snapshot in *Data model sketch*. The refreshed `data/snapshots/leetcode.json` is committed with the code.
- **AC-3**: Every rule in *Data model sketch* is checked by `parseLeetcodeSnapshot`, so it runs in `validate` and on read. If `badges`, `userCalendar`, or `submissionCalendar` is missing or `null`, if the `activeBadge` key is missing (its value may be `null`, which maps to `activeBadgeId: null`), if `submissionCalendar` isn't a string holding a JSON object, if a calendar key fails the *Calendar keys* rule, or if any rule fails, `validate` throws a `ValidationError`. Then refresh keeps the whole previous `leetcode.json` byte for byte, reports `leetcode: validation failed`, and the run ends red. A hand edited snapshot that breaks a rule fails `pnpm build` with `leetcode snapshot: <path>: <problem>`, for example `badges[3].icon: must be a LeetCode PNG URL`, and writes nothing.
- **AC-4**: The badge row holds up to 8 badges (`badgeRow.max`). The active badge comes first when `activeBadgeId` is set. The rest are badges whose `category` isn't `DCC`, newest `earnedOn` first, ties broken by the larger numeric `id`, with the active badge never repeated. Each badge is one line, `<a href="<leetcode profile>">` around `outsideImage({ src: icon, alt, width: 80 })`. Today the row reads Guardian, Annual Badge 2026, 200 Days Badge 2026, 100 Days Badge 2026, 2026 Offer Expedition Badge, 50 Days Badge 2026, 1000 Days Badge, Annual Badge 2025.
- **AC-5**: The badges card follows *Badges card anatomy*: 400 × 196 (the solved card's height), heading `Badges`, the LeetCode icon at the top right, the count of all badges (`62`), `Most recent`, the name of the badge with the newest `earnedOn` across all badges (ties: larger numeric `id`), and its month (`Oct 2026`). Today the most recent badge is `Oct LeetCoding Challenge`.
- **AC-6**: The heatmap card follows *Heatmap card anatomy*: 850 wide, the 365 days ending on `asOf`, one block per calendar month, a week per column, Sunday on the top row, and an empty column gap between months. A day's level comes from its count: 0 is `fill-track`, then 1, 2, 3 to 4, and 5 or more are `fill-accent` at `fill-opacity` 0.25, 0.5, 0.75, and 1. Short month names sit under every block that has at least 3 columns, and a `Less` to `More` legend sits at the bottom right.
- **AC-7**: Above the grid, three stats read `Submissions (past year)`, `Active days`, and `Max streak`. They are computed when drawing from the committed `calendar[]` entries inside the window: the sum of counts, the number of entries, and the longest run of back to back dates. Each value is `groupDigits(n)` with no unit. With `asOf` 2026-11-17 they read 640, 362, and 292. They can differ by a day's worth from LeetCode's page, whose window is one day wider.
- **AC-8**: Alt text, passed raw to `themedImage` or `outsideImage`:
  - Badges card: `LeetCode badges: 62 earned. Most recent: Oct LeetCoding Challenge, Oct 2026.`
  - Each row badge: `<name>, LeetCode badge earned <Mon YYYY>`, for example `Guardian, LeetCode badge earned May 2026`.
  - Heatmap: `LeetCode submissions from Nov 18, 2025 to Nov 17, 2026: 640 submissions on 362 active days, max streak 292 days.` The dates are the first window day (`asOf − 364` days) and `asOf`, written `<Mon> <D>, <YYYY>` with the UTC day and no zero padding (`Nov 7, 2026`).
  - The singular and zero variants in *Edge cases* apply.
- **AC-9**: Numbers and dates follow fixed rules, never the locale or the clock. Counts in alt text use comma grouping (`groupDigits`), and the cards show the same grouped digits. Dates use one fixed English short month table (`Jan` to `Dec`), moved from `src/sections/timeline.ts` into a new `src/dates.ts` export that both sections import, since sections never import from each other. Every date is computed in UTC from `YYYY-MM-DD` strings.
- **AC-10**: The edge cases in *Edge cases* render as described, and every variant passes the build guards.
- **AC-11**: `src/theme.ts` adds `badgesCard`, `badgeRow`, and `heatmap` with every key in *Theme constants*, and the new drawing code writes no size, position, opacity, or count threshold of its own. Neither card animates. `docs/design.md` gains the *LeetCode* additions, a *Badges card anatomy* section, and a *Heatmap card anatomy* section with the same values, plus a recorded note that heatmap levels are shown by color, with the legend and the alt text carrying the numbers.
- **AC-12**: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md` pass. On GitHub, in a light and a dark theme, on desktop and at phone width: the badges card sits beside the solved card on desktop and below it on a phone, the 8 badges fit one row on desktop, the heatmap spans the page, and every card and badge opens the LeetCode profile. Lychee in CI passes on the badge image URLs, or, if `leetcode.com/static/` fails only because it blocks automated clients, the failure is confirmed by opening an image by hand and one narrow, commented exclusion (`^https://leetcode\.com/static/images/badges/`) is added to `lychee.toml`. A manual "Run workflow" on `main` refreshes the new fields from GitHub's runner.

## Options considered

### Option 1: Extend the existing source, draw a badges card and a heatmap card, show badge PNGs as their own row

The query grows by three fields. The snapshot stores every badge and the active day calendar plus `asOf`. The section picks the badges and the window when it draws.

**Pros**:
- One request, one source, one snapshot. The spec 0006 failure rule covers the new fields with no new code paths.
- The cards follow the theme and pass the guards. The badge art still shows, as real LeetCode images.
- Changing the badge selection rule needs no refresh, because the snapshot is a plain copy.

**Cons**:
- About 9 MB of badge images on the profile page, since LeetCode serves 1080px PNGs.
- A broken badges or calendar field also freezes the stats cards until it's fixed.
- `asOf` changes every day, so the snapshot always changes. This adds no new commits, since the histogram already changes daily.

### Option 2: Only a badge image row and a heatmap, no badges card

The same data, but the badges appear only as PNGs, like the Credly grid.

**Pros**:
- One SVG card less to build and keep in sync with `docs/design.md`.

**Cons**:
- The solved card stays alone in its row, and the count and the most recent badge aren't shown anywhere.
- It looks less like the LeetCode page.

### Option 3: A separate `leetcode-activity` source for badges and the calendar

A second fetcher with its own snapshot, so a broken calendar never freezes the stats.

**Pros**:
- Failures stay apart: stats keep refreshing when badges break, and the reverse.

**Cons**:
- Two requests to an unofficial endpoint behind Cloudflare, which doubles the chance of a block.
- It breaks spec 0006's plan of one source and one query, and splits one LeetCode username check across two snapshots.

## Decision

**Chosen option**: Option 1: extend the existing source, draw a badges card and a heatmap card, and show the badge PNGs as their own row.

The `leetcode` source adds badges, the active badge, the submission calendar, and `asOf` to `data/snapshots/leetcode.json`. The `leetcodeStats` section draws a badges half card beside the solved card, a badge image row, and a full width heatmap card below.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for the `fetch` change, typed errors, and type stripping rules.

## Rationale

The deciding forces are spec 0006's single source rule and the guards. Option 3 buys separate failures, but it doubles the requests to an endpoint that Cloudflare may block. Both halves read the same profile and fail for the same reasons (a renamed field, a block), so separating them protects little. Option 2 saves one card but leaves the hole beside the solved card that spec 0006 planned to fill.

Badge selection pins the badge Loc chose on LeetCode, because it's his own pick of what matters. It skips monthly badges, which would otherwise fill every slot with near identical images. The cap of 8 keeps one desktop row and about 9 MB of images. The runner up, a hand picked list in `content/`, gives full control but goes stale the day a new badge lands. The count and "most recent" on the card include every badge, as LeetCode's card does, so the numbers are honest even though the row is curated.

The grid ends on `asOf`, the UTC date refresh read the response, so a day without a submission still shows as an empty cell, and the window is always exactly 365 days. Taking the date after the body is read means LeetCode's newest key can never be later than `asOf`. The runner up, ending on the newest calendar day, needs no new field but shifts the grid back on quiet days. UTC comes from LeetCode itself, so there is nothing to choose there.

Fixed levels (1, 2, 3 to 4, 5 or more) fit how Loc's days really spread (median 1, 90th percentile 3), and the legend means the same thing every day. Levels relative to the busiest day would let one 21 submission day push almost every cell into the faintest level. Mauve at four opacities keeps the profile's palette and adds no tokens. Green would clash with green meaning Easy on the solved card. Month blocks match the LeetCode page and keep this grid distinct from feature 13's GitHub style graph.

The stats are computed from the stored calendar, so they can never disagree with the grid. Over LeetCode's own window they equal LeetCode's numbers (2026-11-17 query). Over the grid's 365 day window they can be a day's worth lower, which is the honest count for what the grid shows.

Geometry is fixed, not fitted per day. Over every possible `asOf` from 2024 to 2039, the window spans 61 to 65 week columns and 12 or 13 months. A 9px cell with a 2px gap and an extra 6px between months fits 65 columns and 12 gaps in 785px, inside the 802px between the card's paddings. The heatmap therefore has the same height every day.

## Feature design

**Data model sketch** (new fields in `data/snapshots/leetcode.json`; the spec 0006 fields are unchanged; keys sorted by `serializeSnapshot`):

| Field | Type | API source | Rule (checked in `parseLeetcodeSnapshot`, so in `validate` and on read) |
|---|---|---|---|
| `asOf` | `YYYY-MM-DD` | `fetch`: `new Date().toISOString().slice(0, 10)` after `response.json()` resolves | A real date (see below) |
| `activeBadgeId` | string or `null` | `matchedUser.activeBadge.id`; `activeBadge` itself may be `null` | `null`, or the `id` of an entry in `badges[]` |
| `badges[]` | `{ id, name, icon, earnedOn, category }` | `matchedUser.badges` | 0 to 500 entries, sorted by `earnedOn` then numeric `id` (both ascending) |
| `badges[].id` | string | `id` | `^[0-9]{1,15}$`, unique |
| `badges[].name` | string | `displayName` | `^[A-Za-z0-9][A-Za-z0-9 .&'+:-]{0,59}$` |
| `badges[].icon` | string | `icon`; a value starting with `/` gets `https://leetcode.com` in front | matches `^https://(assets\.leetcode\.com/\|leetcode\.com/static/)[A-Za-z0-9_./%-]+\.png$` (no query, no fragment) |
| `badges[].earnedOn` | `YYYY-MM-DD` | `creationDate`, which must already match `^\d{4}-\d{2}-\d{2}$` and is stored unchanged | A real date, no later than `asOf` |
| `badges[].category` | string | `category` | `^[A-Z][A-Z_]{0,29}$` |
| `calendar[]` | `{ date, count }` | `JSON.parse(matchedUser.userCalendar.submissionCalendar)`; each key passes *Calendar keys*, then becomes the UTC date of `Number(k) × 1000`; entries with count 0 are dropped | 0 to 400 entries. `date` is a real date, strictly increasing, no later than `asOf`. `count` is an integer ≥ 1 |

**A real date** is a string matching `^\d{4}-\d{2}-\d{2}$` that comes back unchanged from `new Date(Date.UTC(y, m − 1, d)).toISOString().slice(0, 10)`. `asOf`, `earnedOn`, and `date` all use this one rule and fail with `<path>: must be a real date`.

**Calendar keys** are checked in the response mapping, before conversion, because the snapshot keeps only `date`: each key matches `^[0-9]{1,11}$` and `Number(k) % 86400 === 0`, else `calendar: key <k> must be a UTC midnight in unix seconds`. A bad key therefore throws a `ValidationError`, never a `RangeError`.

Relationships: `activeBadgeId` points at no more than one `badges[]` entry. `calendar[]` is read against `asOf`. Nothing derived is stored: the row selection, the most recent badge, the window, the levels, and the three stats are computed when drawing. `validate` sorts `badges` and `calendar`, which have no `startTime`, so `serializeSnapshot` keeps that order.

Today's snapshot additions, shortened:

```json
{
  "activeBadgeId": "10279006",
  "asOf": "2026-11-17",
  "badges": [
    { "category": "ANNUAL", "earnedOn": "2023-01-01", "icon": "https://leetcode.com/static/images/badges/2022/lg/2022-annual-50.png", "id": "1581298", "name": "50 Days Badge 2022" },
    "… 62 entries, ending",
    { "category": "DCC", "earnedOn": "2026-10-31", "icon": "https://leetcode.com/static/images/badges/dcc-2026-10.png", "id": "10949789", "name": "Oct LeetCoding Challenge" }
  ],
  "calendar": [{ "count": 2, "date": "2025-11-17" }, "… 363 entries, ending { 1, 2026-11-16 }"]
}
```

**State transitions**: none. The snapshot is replaced whole on each good refresh.

**Request** (changes to spec 0006 *Request*):
- `QUERY` keeps every field and adds, inside `matchedUser(username: $username)`: `badges { id displayName icon creationDate category } activeBadge { id } userCalendar { submissionCalendar }`. `userCalendar` takes no `year` argument, so LeetCode returns the rolling past year.
- `fetch` keeps its error body handling. On a 2xx it returns `{ asOf, body }`. `validate` first requires `raw` to be an object with a string `asOf`, then calls `mapResponse(raw.body)` (which keeps every spec 0006 check on `errors` and `data`), adds `asOf` to the mapped object, and ends with `parseLeetcodeSnapshot`.

**Badges card anatomy** (`card()` at 400 × 196, the same height as the solved card; values in `badgesCard`; text uses `dominant-baseline="central"` and `text-anchor="start"`; static):

| Element | Geometry | Style |
|---|---|---|
| Heading | `Badges` at x = 24, center y = 34 (`headingY`) | `heading`, `fill-accent` |
| Icon | `iconSvg("leetcode", 352, 22, 24, "fill-accent")`: x = `layout.half − pad − icon`, y = `iconY` 22, size `icon` 24 | |
| Count | All badges, grouped, at x = 24, center y = 74 (`countY`) | `title`, `fill-text` |
| Most recent label | `Most recent` at x = 24, center y = 112 (`recentY`) | `body`, `fill-muted` |
| Badge name | The most recent badge's name at x = 24, center y = 138 (`nameY`), `fitText` in 352 (`nameSlot`), min 14 (`nameMin`) | `heading`, `fill-text`; squeezed with `textLength` below 14 |
| Month | `<Mon YYYY>` of its `earnedOn` at x = 24, center y = 164 (`monthY`) | `body`, `fill-muted` |

**Badge row** (`<p align="center">`, one badge per line, nothing between the tags on a line):

```html
<a href="https://leetcode.com/u/nguyenducloc"><picture><source media="(prefers-color-scheme: dark)" srcset="<icon>"><img alt="<name>, LeetCode badge earned <Mon YYYY>" src="<icon>" width="80"></picture></a>
```

The PNGs are transparent, so they sit on either theme's page. `outsideImage` escapes `src` and `alt` once, and the section escapes the `href` once. The PNG is used, never the GIF, because badges don't move.

**Heatmap card anatomy** (`card()` at 850 × 264; values in `heatmap`; all text 20px or larger, `dominant-baseline="central"`; static):

| Element | Geometry | Style |
|---|---|---|
| Window | The 365 days (`windowDays`) from `asOf − 364` to `asOf`, in UTC. A day's count is its `calendar[]` entry, else 0 | |
| Stats | Labels at center y = 34 (`labelY`), values at center y = 68 (`valueY`), `text-anchor="start"`. Submissions (past year) at x 24, slot 300 (`submissionsX`, `submissionsSlot`). Active days at x 348, slot 220 (`activeX`, `activeSlot`). Max streak at x 592, slot 234 (`streakX`, `streakSlot`). Each label and each value (`groupDigits(n)`, no unit) goes through `fitText` in its slot, min 20 | Labels `lead` `fill-muted`. Submissions value `title` `fill-accent`. Active days and Max streak values `number` `fill-text` |
| Blocks | One block per month the window touches (12 or 13), oldest on the left. In a block, the first day's column is 0. A day's column is `floor((weekday(first day) + day offset) / 7)` and its row is its UTC weekday (Sunday 0). A block has `cols(b) = floor((weekday(first day) + days in block − 1) / 7) + 1` columns | |
| Cells | `step` = `cell + cellGap` = 11. Block b starts at `x0 + (cols(0) + … + cols(b − 1)) × 11 + b × 6` (`monthGap`). Cell at (block x + column × 11, `gridTop` 100 + row × 11), 9 × 9 (`cell`), `rx` 2 (`cellRadius`) | Level 0: `fill-track`. Levels 1 to 4: `fill-accent` with `fill-opacity` 0.25, 0.5, 0.75, 1 (`opacity1` to `opacity4`), always written, even `fill-opacity="1"` |
| Grid x | Grid width `w = columns × 11 − 2 + (blocks − 1) × 6`. `x0 = 24 + floor((802 − w) / 2)`, so the grid is centered. Today `w` = 752 | |
| Levels | Level = the highest k with `count ≥ level<k>Min`: `level1Min` 1, `level2Min` 2, `level3Min` 3, `level4Min` 5. Count 0 is level 0 | |
| Month labels | The fixed short month name at the block's center x, center y = 198 (`monthY`), `text-anchor="middle"`. Only blocks with at least 3 columns (`monthMinColumns`) get one | `lead`, `fill-muted` |
| Legend | Right aligned on center y = 230 (`legendY`). `More` ends at x = 826 (`text-anchor="end"`). Five 9 × 9 cells, levels 0 to 4 left to right, 11 apart, at y = `legendY − cell / 2` (225.5), the last one ending `legendGap` (8) plus `ceil(0.6 × 20 × 4)` (48) left of 826, so the cells start at x = 717, 728, 739, 750, 761. `Less` ends 8 left of the first cell (x = 709) | Text `lead` `fill-muted`; cells as in *Cells* |

`weekday`, months, and day offsets come from `Date.UTC` and `getUTCDay`, never local time. Grid height is `7 × 11 − 2` = 75, so cells end at y = 175.

**Theme constants** (`src/theme.ts`, each `as const satisfies { readonly [name: string]: number }`):

| Constant | Keys and values |
|---|---|
| `badgesCard` | `headingY` 34, `icon` 24, `iconY` 22, `countY` 74, `recentY` 112, `nameY` 138, `nameSlot` 352, `nameMin` 14, `monthY` 164 |
| `badgeRow` | `max` 8, `width` 80 |
| `heatmap` | `height` 264, `windowDays` 365, `labelY` 34, `valueY` 68, `submissionsX` 24, `submissionsSlot` 300, `activeX` 348, `activeSlot` 220, `streakX` 592, `streakSlot` 234, `gridTop` 100, `cell` 9, `cellGap` 2, `cellRadius` 2, `monthGap` 6, `monthY` 198, `monthMinColumns` 3, `legendY` 230, `legendGap` 8, `level1Min` 1, `level2Min` 2, `level3Min` 3, `level4Min` 5, `opacity1` 0.25, `opacity2` 0.5, `opacity3` 0.75, `opacity4` 1 |

The badges card's height is the solved card's computed height. Its width is `layout.half`, and the heatmap's width is `layout.full`.

**API surface** (module exports; no HTTP endpoints of our own):

| Export | Signature | Used by | Failure |
|---|---|---|---|
| `leetcode.fetch` (`src/sources/leetcode.ts`) | `(signal) => Promise<{ asOf: string; body: unknown }>`, one POST | `refresh.ts` | as spec 0006 |
| `leetcode.validate` | `(raw: unknown) => LeetcodeSnapshot`; reads `raw.asOf` and `raw.body` | `refresh.ts` | `ValidationError` (AC-3) |
| `parseLeetcodeSnapshot` | `(value: unknown) => LeetcodeSnapshot`, pure, with the new fields | `validate`, the section | `ValidationError` naming the path |
| `type LeetcodeSnapshot` | gains `asOf`, `activeBadgeId`, `badges`, `calendar`, all `readonly` | section | none |
| `leetcodeStats` (`src/sections/leetcode.ts`) | the existing `Section`, now also writing `leetcode-badges` and `leetcode-heatmap` and the row block | `renderReadme` | AC-3 errors; `build` catches once |
| `badgesCard`, `badgeRow`, `heatmap` (`src/theme.ts`) | number constants | section | type error |

`leetcodeStats` stays the only LeetCode section, because the badges card shares the solved card's `<p>` block. The drawing may live in helper modules beside it that export pure functions and aren't listed in `src/readme.ts`.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| fetch | added query fields | `QUERY` constant (decided here) |
| fetch | `asOf` | UTC date of the runner's clock after the body is read (decided here) |
| validate | `badges[]`, `activeBadgeId`, `calendar[]` | the API fields in *Data model sketch* |
| validate | absolute icon URL | `icon`, with `https://leetcode.com` added in front of a leading `/` |
| validate | calendar dates | each key × 1000 through `toISOString().slice(0, 10)` |
| section | badge count | `badges.length`, grouped |
| section | most recent badge, its month | newest `earnedOn`, ties by larger numeric `id`; month from the `src/dates.ts` month table |
| section | badge row and order | AC-4 rule over `badges[]` and `activeBadgeId`, capped by `badgeRow.max` |
| section | row image `src`, `alt`, `width` | `badges[].icon`; AC-8 template with `name` and `earnedOn`; `badgeRow.width` |
| section | window days | `asOf` and `heatmap.windowDays`, in UTC |
| section | cell level | the day's count against `level1Min` to `level4Min` |
| section | cell positions, month blocks, label visibility | the anatomy formulas and `heatmap` constants |
| section | submissions, active days, max streak | sum, count, and longest consecutive run of `calendar[]` inside the window |
| section | alt text dates | `asOf − 364` days and `asOf` via `Date.UTC`, `<Mon> <D>, <YYYY>` with the `src/dates.ts` month table, UTC day without zero padding |
| section | labels `Badges`, `Most recent`, `Submissions (past year)`, `Active days`, `Max streak`, `Less`, `More` | constants in the section (decided here) |
| section | link targets | `profileUrls(content.profile.accounts).leetcode` |
| section | asset base names | `leetcode-badges`, `leetcode-heatmap` |
| section | colors | `fill-accent`, `fill-track`, `fill-text`, `fill-muted`, plus `fill-opacity` from `heatmap` |

**Key invariants**:
- One request and one snapshot for every LeetCode card. A refresh either replaces the whole snapshot or keeps the old one.
- No `calendar[]` date and no `earnedOn` is later than `asOf`, so the grid never shows a future day.
- The window is always 365 days and the card always 850 × 264, so the layout never depends on the data or the clock.
- The three stats and the grid read the same window from the same entries, so they never disagree.
- Outside text reaches output only as a pattern checked badge name and a host checked PNG URL, each escaped once.

**Security model**: Public LeetCode data, read without a token. No secrets and no new workflow permissions. The new untrusted values are badge names (pattern checked, escaped by `outsideImage`, `themedImage`, and `escapeXml`) and icon URLs (only `https` PNGs under `assets.leetcode.com/` or `leetcode.com/static/`, with no query or fragment). GitHub proxies those images through camo, so a visitor's browser never contacts LeetCode directly. The existing guards still check every generated SVG, and no SVG references an outside image.

**Configuration required**: None.

**Edge cases**:
- `activeBadgeId` is `null`: the row is just the newest badges that aren't monthly, up to 8.
- The active badge is a `DCC` badge: it still comes first.
- Fewer than 8 badges qualify: the row shows the ones that do. None qualify: the row block is left out.
- No badges at all: the card shows `0`, and `No badges yet` in `body` `fill-muted` at `recentY`, with no name or month. Alt text: `LeetCode badges: none earned yet.`
- One badge: alt reads `1 earned`.
- A long badge name: `fitText` shrinks it to 14px, then squeezes it with `textLength`.
- No submissions in the window: every cell is `fill-track`, all three stats read `0`. Alt: `LeetCode submissions from <start> to <end>: no submissions.`
- Singulars: `1 submission`, `1 active day`, `max streak 1 day`.
- A month block with 1 or 2 columns (the window starts or ends near a month edge): drawn, but unlabeled.
- `calendar[]` entries older than the window: ignored when drawing, still stored. LeetCode's window is one day wider, so its oldest day is usually one of these.
- Both end blocks can be the same month with 3 or more columns (today: `Nov` at both ends). Both get the label, which is correct, since each is a different year's November.
- LeetCode's `activeBadge` names a badge missing from `badges[]`: validation fails and the last good snapshot stays, like the name and URL pattern risks (see Follow-up).
- A badge name with a character outside the pattern, or an icon on another host or format: validation fails and the last good snapshot stays (see Follow-up).
- Refresh near UTC midnight: `asOf` is read after the response, so LeetCode's newest key is never later than it.

**Critical test scenarios**:
- Happy path: `pnpm refresh` writes the new fields, and `pnpm build` writes the 4 new SVGs and the row. The README matches AC-1, the row matches AC-4's list, the badges card reads `62` and `Oct LeetCoding Challenge`, the stats read the AC-7 values for the committed `asOf`, and the alt text matches AC-8. Verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
- Broken field: temporarily change `displayName` to a field that doesn't exist in `QUERY`. Refresh reports `leetcode: 400` and `leetcode.json` stays the same. Revert. Verifies **AC-3**.
- Hand edit: set one `badges[].icon` to `https://example.com/x.png`, then a `calendar[]` date after `asOf`. Each fails `pnpm build` naming the path. Revert. Verifies **AC-3**.
- Edges: temporarily set `activeBadgeId` to `null`, empty `badges`, and empty `calendar`. The output matches *Edge cases*, the row block disappears, and the guards pass. Revert. Verifies **AC-10**.
- Layout: set `asOf` to `2028-08-01`, which gives the widest grid (65 columns, 13 blocks, 785px). The grid stays inside the card, centered. Verifies **AC-6**, **AC-10**.
- Design record: `badgesCard`, `badgeRow`, and `heatmap` match `docs/design.md`, and neither SVG has an animation class. Verifies **AC-11**.
- GitHub: both themes, desktop and phone width, links, and a manual "Run workflow". Verifies **AC-12**.

## Build plan

Skateboard: each slice leaves the live profile complete. The data comes first and changes no output, then the badges pieces, then the heatmap, then the record and the check from GitHub.

1. **Slice 1: the data.**
   1. `src/sources/leetcode.ts`: the added `QUERY` fields, `fetch` returning `{ asOf, body }`, the icon URL resolving and calendar mapping in the response mapping, every new rule in `parseLeetcodeSnapshot`, and the sorting of `badges` and `calendar`, satisfies **AC-2**, **AC-3**.
   2. Run `pnpm refresh`, then `pnpm build`. The README and SVGs stay byte for byte the same. Commit `data/snapshots/leetcode.json` with the source, satisfies **AC-2**.
2. **Slice 2: badges live.**
   1. `badgesCard` and `badgeRow` in `src/theme.ts`, satisfies **AC-11**.
   2. Move the month table into `src/dates.ts` and import it in `src/sections/timeline.ts` (the timeline output stays byte for byte the same), satisfies **AC-9**.
   3. The badges card per *Badges card anatomy*, added to the solved card's block, and the badge row block after it, with alt text and the edge cases, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-8**, **AC-9**, **AC-10**.
3. **Slice 3: heatmap live.**
   1. `heatmap` in `src/theme.ts`, satisfies **AC-11**.
   2. The heatmap card per *Heatmap card anatomy*: the window, blocks, levels, month labels, legend, three stats, alt text, and the edge cases, as the last LeetCode block, satisfies **AC-1**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**.
4. **Slice 4: design record and check from GitHub.**
   1. `docs/design.md`: the *LeetCode* layout additions, *Badges card anatomy*, *Heatmap card anatomy*, and the note on levels shown by color, satisfies **AC-11**.
   2. Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md`. Push, check lychee in CI (add the one commented `leetcode.com/static/` exclusion only if it fails just for automation), trigger "Run workflow" on `main`, and check both themes on desktop and phone width, satisfies **AC-12**.

## Consequences

**Positive**:
- The LeetCode section now matches the whole LeetCode page Loc used as the design source.
- No new request, source, dependency, token, or workflow change.
- A failure on any LeetCode field keeps every LeetCode card at its last good version.

**Negative / tradeoffs**:
- The badge row adds about 9 MB of images, since LeetCode's PNGs are 1080px and GitHub doesn't resize them. On a slow phone, they load last.
- A broken badge or calendar field also stops the contest and solved cards from refreshing, until the query or rules are fixed.
- The badge name pattern is strict. A future badge with an accent or a symbol outside it turns the run red until the pattern is widened.
- Heatmap cells show at about 4px on a phone, so the grid reads as a texture there. The three stats and the alt text carry the numbers.
- Heatmap levels are shown by color alone. The legend explains them, and the alt text and stats state the totals. This is recorded as an exception to "color is never the only way" in `docs/design.md`.
- `leetcode.json` grows from about 4 KB to about 40 KB, and its daily diff now always includes `asOf` and the newest calendar day.

**Neutral**:
- The heatmap's level and opacity constants are local to `heatmap`. Feature 13 decides its own ramp and may reuse or replace them.
- `leetcodeStats` grows. Splitting the drawing into helper modules is left to the build.

## Follow-up

- [ ] If a refresh fails on a badge name, an icon URL, or an `activeBadge` missing from `badges`, widen the pattern in `parseLeetcodeSnapshot` with an `/architect` update to this spec, not a quick edit.
- [ ] Spec 0006's Follow-up item for feature 11 is covered by this spec. `/sync` may tick it.
