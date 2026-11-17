# 0006. LeetCode stats from the public GraphQL endpoint, drawn as a contest card and a solved card like the LeetCode profile page

**Date**: 2026-11-16
**Status**: Accepted

## Summary

Your LeetCode section looks like your LeetCode profile page, redrawn in the Catppuccin theme. A full width contest card shows your rating, level, global ranking, contests attended, a rating history line, and the "Top %" histogram. Below it, a half card shows the problems solved arc with Easy, Med., and Hard chips. The data comes from LeetCode's public GraphQL endpoint (one request, no token), which `pnpm refresh` saves to `data/snapshots/leetcode.json`. If LeetCode fails or returns something odd, the last good snapshot stays and the run turns red. The badges card and the heatmap from your screenshot belong to feature 11. They slot in beside and below these cards later, using the same source.

## Context

Feature 8 is the profile's highlight. Visitors see your LeetCode level (Guardian, top 0.72%) before anything else in Release 2 or 3. Loc gave a screenshot of the LeetCode profile page as the design source: contest stats, a rating line chart, the rating histogram, the solved arc with difficulty chips, a badges card, and a heatmap. The scope gives the badges card and the heatmap to feature 11.

Forces:
- This is the first real source for the spec 0001 contract (`Source` in `src/types.ts`). `build` never fetches, and a failed refresh must keep the last good snapshot. Whatever this source does sets the pattern for features 10 and 12.
- LeetCode has no official public API. Its website uses `https://leetcode.com/graphql`. On 2026-11-16, one combined POST from Node's `fetch`, with no token and no browser headers, returned HTTP 200 and about 4 KB holding everything the screenshot shows. Both a plain request and one with the repo's own `user-agent` header got through. An unknown username also returns HTTP 200, with an `errors` array and `matchedUser: null`. A query asking for a field that doesn't exist returns HTTP 400 with a JSON `errors` body. The endpoint can change shape without notice, and it sits behind Cloudflare, which can block datacenter IPs such as GitHub's runners.
- GitHub shows SVGs through `<img>`, which runs no scripts and loads no outside images. GitHub's file policy also blocks `data:` images, so LeetCode's Guardian badge PNG can't appear inside a card.
- `docs/design.md` rules: full width images may only use text 20px and up (a phone shows them at about 42%). `success`, `warning`, and `danger` only color shapes, each with a text label in `fill-text` or `fill-muted`. Latte yellow on a light card is too faint to read as text. Motion is limited to stat cards: content enters once, gauges and bars fill once, and everything ends within 5 seconds.
- Some numbers move daily. New users join every day, so the histogram counts change. The question totals change weekly. Spec 0001 already accepts up to one bot commit a day.
- Outside text reaching the README (the badge name) is untrusted. It goes into alt text and SVG text.

## Requirements

**User stories**:
- As a recruiter visiting Loc's profile, I want to see his contest rating, level, ranking, and problems solved at a glance, so that I can judge his problem solving strength in seconds.
- As a developer who knows LeetCode, I want the section to look like a LeetCode profile page, so that I read it the way I read LeetCode.
- As a screen reader user, I want each card's alt text to state the same numbers, so that I get what a sighted visitor sees.
- As Loc, I want the numbers to refresh on their own, and a LeetCode outage or API change to keep the last good cards and email me, so that my profile never shows broken or wrong stats.

**Acceptance criteria**:
- **AC-1**: Right after the Tech stack block, `README.md` contains `<h2 align="center">LeetCode</h2>`, a blank line, a `<p align="center">` block holding the contest card, a blank line, and a `<p align="center">` block holding the solved card. Neither block has blank lines inside. Each card is a `themedImage` `<picture>` wrapped in `<a href="https://leetcode.com/u/nguyenducloc">` (from `profileUrls(accounts).leetcode`). The contest card uses base `leetcode-contest` at `width="100%"`. The solved card uses base `leetcode-solved` at `width="400"`.
- **AC-2**: `src/sources/leetcode.ts` exports a `leetcode` source (`name: "leetcode"`, `sortKey: "startTime"`) registered in `src/sources/index.ts`. Its `fetch` sends exactly one POST to `https://leetcode.com/graphql` with the query and headers in *Request* below, and reads the username from `content.profile.accounts.leetcode`. `validate` maps the response to the snapshot in *Data model sketch*. `pnpm refresh` writes `data/snapshots/leetcode.json`, and the first snapshot is committed with the code.
- **AC-3**: `validate` throws a `ValidationError`, so refresh keeps the previous snapshot file byte for byte, reports `leetcode: validation failed` in `failed_sources` and the step summary, and the run ends red, when any of these happens: the response has a non empty `errors` array; `matchedUser`, `userContestRanking`, or `contestRatingHistogram` is `null` or missing; no history entry has `attended: true`; or any rule in *Data model sketch* fails. An HTTP error status, a timeout, or a body that isn't JSON (a Cloudflare challenge page) also keeps the snapshot, through the existing spec 0001 retry and reporting. On a 4xx with a JSON `errors` body (LeetCode's answer to a renamed or removed field), the `HttpError` message also carries `errors[0].message`, so the refresh log shows the GraphQL reason, while the run line still reads `leetcode: 400`.
- **AC-4**: `pnpm build` reads the snapshot only through `parseLeetcodeSnapshot`, which applies the same rules as `validate`. A hand edited or malformed `leetcode.json` fails the build with `leetcode snapshot: <path>: <problem>` and writes nothing. `parseLeetcodeSnapshot` throws `<path>: <problem>`, with paths written like `contest.globalRanking` or `history[3].rating`, and `(root): must be an object` for a root that isn't an object. The section adds the `leetcode snapshot: ` prefix. When `username` differs from `content.profile.accounts.leetcode` (ignoring case), the build fails with `leetcode snapshot is for <snapshot username>, but content has <content username>: run pnpm refresh` and writes nothing.
- **AC-5**: The solved card is drawn by `card()` at 400 × 196 and follows *Solved card anatomy*. It has a 270 degree arc split into Easy, Medium, and Hard segments. Each segment's length is in proportion to that difficulty's question total, and the solved part is drawn over a faint track. The center shows the total solved (`2245`) with `/4114`, a check icon with `Solved`, and `3 Attempting` in the arc's gap. Three chips on the right read `Easy 661/976`, `Med. 1170/2148`, and `Hard 414/990`, each with a colored dot. Status colors appear only on shapes: the arc, the chip dots, and the check icon (labeled `Solved`). Every word and number is in `fill-text` or `fill-muted`.
- **AC-6**: The contest card is drawn by `card()` at 850 × 300 and follows *Contest card anatomy*. The left pane has a stats row (Rating `2,247`, the shield icon with Level `Guardian`, Global ranking `6,064/892,590`, Attended `31`), then the rating history line with a dot and a `2,247` label at the last contest, and the first and last contest years under it. A divider separates the right pane, which shows Top `0.72%` over a histogram with one bar per bucket. The bucket holding the current rating is `fill-accent`, and every other bucket is `fill-track`. All text on this card is 20px or larger.
- **AC-7**: Numbers are formatted by fixed rules, never by locale. On the contest card and in all alt text, integers use comma grouping (`6,064`). The solved card's center and chips show plain digits like the screenshot (`2245/4114`, `1170/2148`). Ratings are rounded with `Math.round` (`2247.01` shows as `2,247`, `1564.633` as `1,565`). Top percentage is `toFixed(2)` plus `%` (`0.72%`). Years print as plain digits (`2024`).
- **AC-8**: The alt text is built from the snapshot and passed raw to `themedImage`. Contest card: `LeetCode contest rating 2,247, level Guardian, global ranking 6,064 of 892,590, top 0.72%, 31 contests attended. Rating history: 1,565 in 2022 to 2,247 in 2024.` Solved card: `LeetCode problems solved: 2,245 of 4,114. Easy 661 of 976, Medium 1,170 of 2,148, Hard 414 of 990. 3 attempting.` The variants in *Edge cases* apply when the badge is `null`, there is one history point, or both years match. With exactly one contest, the text reads `1 contest attended`.
- **AC-9**: Motion follows *Motion* below. Stats and labels enter once, staggered. The arc segments fill and the history line draws once (the `gauge` class with `pathLength="1"`). The histogram bars rise once (the new shared `rise` class). The last point and its label enter last. Everything ends by 1500 ms, nothing loops, and reduce motion shows the final frame.
- **AC-10**: Edge cases render as in *Edge cases*. A `null` badge hides the shield and the Level column. A single history point draws only the dot and label, with one year. When no bucket contains the rating, the last bucket starting at or below it is highlighted. A difficulty with 0 solved draws only its track.
- **AC-11**: `src/theme.ts` adds `contestCard` and `solvedCard` constants with every key in *Theme constants*, and the section writes no size, position, opacity, or timing of its own. `src/svg.ts` adds the `rise` animation class. `src/icons.ts` gains two hand drawn entries, `check` and `shield`, with the exact paths in *Icons*, kept in alphabetical key order. `docs/design.md` gains *LeetCode*, *Contest card anatomy*, and *Solved card anatomy* sections, the two icon rows, the `rise` class, the faint status track exception, and an updated motion inventory row, with the same values.
- **AC-12**: Every card SVG passes the existing build guards. On GitHub, in a light and a dark theme, both cards render, read clearly, and open the LeetCode profile when clicked. The contest card spans the page and the solved card sits centered below it, on desktop and on a phone width. `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md` pass, and a manual "Run workflow" on `main` fetches LeetCode from GitHub's runner and commits any snapshot change as `chore(refresh)`.

## Options considered

### Option 1: LeetCode's public GraphQL endpoint, snapshot committed, cards drawn by the build

`pnpm refresh` posts one GraphQL query to `leetcode.com/graphql`, validates the response, and saves it. The section draws both cards from the snapshot.

**Pros**:
- One request returns every value the screenshot shows (history, histogram, attempting), with no token.
- It fits the spec 0001 contract, so the last good card survives any failure.
- The cards use the Catppuccin classes and pass every build guard.

**Cons**:
- The endpoint is unofficial and can change fields without notice, which shows up as a red run until the query is fixed.
- Cloudflare may block GitHub's runner IPs. That has not been tested from Actions yet.

### Option 2: A community proxy API (such as alfa-leetcode-api), cards drawn by the build

A hosted wrapper turns LeetCode's GraphQL endpoint into plain REST endpoints. The build draws the same cards.

**Pros**:
- Simpler URLs, and the proxy owner tracks LeetCode's changes.
- It sometimes gets through when direct requests are blocked.

**Cons**:
- An extra party sits in the path. Free hosting sleeps or goes down, and the project can be abandoned.
- It still depends on the same unofficial endpoint, so it adds a failure point without removing one.
- Several calls are needed for the history and histogram.

### Option 3: A live card image service (such as LeetCard)

The README embeds an image URL that a third party renders on each view.

**Pros**:
- No fetcher, no snapshot, no drawing code.

**Cons**:
- It can't use the theme classes or pass the build guards, so it breaks `docs/design.md`.
- There is no last good copy. When the service is down, the card breaks.
- It doesn't match the profile page layout Loc asked for.

## Decision

**Chosen option**: Option 1: LeetCode's public GraphQL endpoint, snapshot committed, cards drawn by the build.

A new `leetcode` source fetches one GraphQL query into `data/snapshots/leetcode.json`. A new `leetcodeStats` section draws a full width contest card and a half width solved card from it, modeled on the LeetCode profile page and drawn with the theme helpers.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for `fetch` with `AbortSignal`, typed errors at the edge, and type stripping rules in the new source and section.

## Rationale

The deciding forces are the "last good version" rule and the design rules. Only a snapshot keeps a card alive when LeetCode fails, and only cards drawn by the build can follow the theme and pass the guards. That rules out Option 3. Option 2 keeps those benefits, but it puts a free hosted proxy in front of the same unofficial endpoint, so it adds a failure point and fixes nothing. Going direct keeps one moving part, and the probe on 2026-11-16 showed it returns everything needed in one request. If GitHub's runners turn out to be blocked, a proxy is the fallback (see Follow-up).

The layout follows the screenshot while keeping the design rules. Keeping all contest text at 20px and up means short labels (`Rating` instead of `Contest Rating`) and a wider left pane than LeetCode's. Difficulty colors stay on the arc and dots, with words in `fill-text` or `fill-muted`, because Latte yellow fails contrast as text. The shield is a hand drawn glyph, since the badge PNG can't load inside an SVG. The runner up, text only, was simpler but looked less like the page.

Validation is strict on purpose, and the same rules run when the snapshot is read. An unknown username returns HTTP 200 with partial data, so trusting the status alone would publish zeros. A renamed field returns HTTP 400, so the GraphQL message is kept in the error to make the fix quick. A `null` contest ranking is treated as a glitch rather than a "no contests" state, because Loc has 31 rated contests. Raw histogram counts are stored rather than rounded shares. The source stays a plain copy of the data, and the extra daily commit is already allowed by spec 0001. The runner up was storing shares rounded to 0.1%, which cuts commits but puts drawing logic in the source.

Spec 0001 left an open question for features 8, 10, and 12: should `pnpm lint:md` run before refresh commits? It is not needed here. Fetched data reaches `README.md` only as numbers this code formats and as the badge name, which must match `^[A-Za-z][A-Za-z ]{0,29}$` and is escaped once. A refresh can't produce new Markdown structure.

## Feature design

**Data model sketch** (`data/snapshots/leetcode.json`, written by `validate`, read by `parseLeetcodeSnapshot`; keys sorted by `serializeSnapshot`):

| Field | Type | API source | Rule (checked in `validate` and in `parseLeetcodeSnapshot`) |
|---|---|---|---|
| `username` | string | `matchedUser.username` | matches `^[A-Za-z0-9_-]+$` |
| `difficulties.easy`, `.medium`, `.hard` | `{ solved, total, attempting }`, integers | `solved`: `matchedUser.submitStatsGlobal.acSubmissionNum` (`Easy`, `Medium`, `Hard`); `total`: `allQuestionsCount`; `attempting`: `userProfileUserQuestionProgressV2.numFailedQuestions` (`EASY`, `MEDIUM`, `HARD`, matched ignoring case) | all three keys present; integers ≥ 0; `total` ≥ 1; `solved + attempting ≤ total`. The `All` rows are ignored (they are sums) |
| `contest.rating` | number, raw | `userContestRanking.rating` | finite, > 0 |
| `contest.globalRanking` | integer | `userContestRanking.globalRanking` | ≥ 1 and ≤ `totalParticipants` |
| `contest.totalParticipants` | integer | `userContestRanking.totalParticipants` | ≥ 1 |
| `contest.topPercentage` | number | `userContestRanking.topPercentage` | > 0 and ≤ 100 |
| `contest.attended` | integer | `userContestRanking.attendedContestsCount` | ≥ 1 |
| `contest.badge` | string or `null` | `userContestRanking.badge.name` (`badge` itself may be `null`) | `null`, or matches `^[A-Za-z][A-Za-z ]{0,29}$` |
| `history[]` | `{ startTime, rating }` | `userContestRankingHistory`, only entries with `attended: true`; `startTime` is `contest.startTime` (unix seconds) | 1 to 1000 entries; `startTime` an integer > 0, strictly increasing; `rating` finite > 0 |
| `histogram[]` | `{ ratingStart, ratingEnd, userCount }` | `contestRatingHistogram` | 1 to 40 buckets; integers; `ratingStart < ratingEnd`; `ratingStart` strictly increasing (sorted by `validate`); `userCount` ≥ 0 and at least one > 0 |

`validate` sorts `history` by `startTime` and `histogram` by `ratingStart`. The source `sortKey` (`startTime`) keeps `serializeSnapshot` sorting history. Histogram items have no `startTime`, so their validated order is kept. Nothing derived is stored. The `All` totals (4114 questions, 2245 solved) and total attempting (3) are sums computed when drawing. Feature 11 adds its fields (badges, calendar) to this same snapshot and query.

Today's snapshot, shortened:

```json
{
  "contest": { "attended": 31, "badge": "Guardian", "globalRanking": 6064, "rating": 2247.01, "topPercentage": 0.72, "totalParticipants": 892590 },
  "difficulties": {
    "easy": { "attempting": 0, "solved": 661, "total": 976 },
    "hard": { "attempting": 2, "solved": 414, "total": 990 },
    "medium": { "attempting": 1, "solved": 1170, "total": 2148 }
  },
  "histogram": [{ "ratingEnd": 1200, "ratingStart": 0, "userCount": 6224 }, "… 23 buckets, ending { 2250, 9950 }"],
  "history": [{ "rating": 1564.633, "startTime": 1665844200 }, "… 31 entries, ending { 2247.01, 1716690600 }"],
  "username": "nguyenducloc"
}
```

**Request** (`fetch`):
- `POST https://leetcode.com/graphql`, headers `content-type: application/json` and `user-agent: nguyen-duc-loc-profile (+https://github.com/nguyen-duc-loc/nguyen-duc-loc)`. There is no `referer` and no cookie. The 2026-11-16 probe sent this exact `user-agent`, and Node's default too, and both got through.
- `fetch` calls `fetch()` itself instead of `fetchJson`, so it can read the body on an error status. On a non 2xx response, it tries to parse the body as JSON and throws `new HttpError(status, url, detail)`, where `detail` is `errors[0].message` when present. `HttpError` in `src/sources/http.ts` gains that optional third argument, appended to the message as `: <detail>`. `status` is unchanged, so `isRetryable` and the `failed_sources` line work as before. On 2xx, it returns `response.json()`.
- Body `{ "query": QUERY, "variables": { "username": content.profile.accounts.leetcode } }`, where `QUERY` is a module constant:

```graphql
query leetcodeStats($username: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $username) { username submitStatsGlobal { acSubmissionNum { difficulty count } } }
  userProfileUserQuestionProgressV2(userSlug: $username) { numFailedQuestions { difficulty count } }
  userContestRanking(username: $username) { attendedContestsCount rating globalRanking totalParticipants topPercentage badge { name } }
  userContestRankingHistory(username: $username) { attended rating contest { startTime } }
  contestRatingHistogram { userCount ratingStart ratingEnd }
}
```

**Solved card anatomy** (400 × 196; new values in `solvedCard`; colors by class only):

| Element | Geometry | Style |
|---|---|---|
| card | `card()`, 400 × 196 (`2 × pad + 3 × chipHeight + 2 × chipGap` = 48 + 132 + 16) | |
| arc center, radius | `cx = 136`, `cy = 107`, `r = 80` (`solvedCard.radius`) | |
| arc span | 270°, from θ = −135° to +135°, θ measured clockwise from 12 o'clock (`x = cx + r·sin θ`, `y = cy − r·cos θ`), sweep flag 1, large arc flag 1 when a span is over 180° | |
| segments | Easy, Medium, Hard in that order. `solvedCard.segmentGap` = 6° between segments. Span of segment i = `(270 − 2 × 6) × total_i / Σ total` (today 61.2°, 134.7°, 62.1°) | |
| track (per segment) | full segment path | `fill="none"`, `class="stroke-<status>"`, `stroke-opacity` of `solvedCard.trackOpacity` (0.25), `stroke-width` of `solvedCard.stroke` (6), `stroke-linecap="round"`. This is a recorded exception, written into `docs/design.md`: the track uses the faint status color instead of `track`, as on LeetCode, and transparency uses `stroke-opacity` |
| solved arc (per segment) | from the segment start, clockwise, `span_i × solved_i / total_i`; omitted when `solved_i` is 0 | same as track at full opacity, plus `class="gauge stroke-<status>"`, `pathLength="1"`, `stroke-dasharray="1"`, `style="--gauge-empty:1"` |
| status token | Easy `success`, Medium `warning`, Hard `danger` | |
| solved number | one `<text>` at `x = cx`, baseline y = 112, `text-anchor="middle"`, `dominant-baseline="alphabetic"`: total solved, plain digits, then a `<tspan>` with `/` plus total questions on the same baseline | the number: `title` style, `fitText` over the number alone in an 88 slot (min 24), `fill-text`; the tspan: `body` size, `fill-muted`. Today the whole line is about 119 wide, inside the ring's inner width of about 154 at that height |
| solved label | `iconSvg("check", 104, 122, 14, "fill-success")`, then `Solved` at x = 122, center y = 129, `text-anchor="start"` | `body`, `fill-text` |
| attempting | `x = cx`, center y = 162, `text-anchor="middle"`: `<n> Attempting` | `label`, `fill-muted`, `fitText` in a 96 slot (min 12), so it stays inside the arc's gap (about x 80 to 193) |
| chips | x = 264, y = 24, 76, 128 (`pad + i × (chipHeight + chipGap)`), 112 × 44 (`solvedCard.chipWidth`, `chipHeight`), `chipGap` 8. Rect at (x + 0.5, y + 0.5), 111 × 43, `rx` of `radius.small` | `fill-surface stroke-border`, `stroke-width` of `layout.border` |
| chip dot | `circle` at (x + 16, y + 14), r = 4 | `fill-<status>` |
| chip label | `Easy`, `Med.`, `Hard` at x + 26, center y = y + 14 | `body`, `fill-muted` |
| chip value | `<solved>/<total>` (plain digits) at x + 12, center y = y + 31, slot 88 | `body` via `fitText` (min 12), `fill-text` |

All arc coordinates are rounded to 2 decimals with `toFixed(2)`. Text uses `dominant-baseline="central"`, except the solved number line. The numbers above are the `solvedCard` values in *Theme constants*.

**Contest card anatomy** (850 × 300, rendered at `width="100%"`; new values in `contestCard`; all text 20px or larger):

| Element | Geometry | Style |
|---|---|---|
| card | `card()`, 850 × 300 | |
| left pane, divider, right pane | left pane x 24 to 616; divider `line` at x = 640.5 from y = 24 to 276; right pane x 664 to 826 (162 wide) | divider `stroke-border`, `stroke-width` of `layout.border` |
| stats columns | x and slot: Rating 24 / 104 · Level text 192 / 120 (shield `iconSvg("shield", 144, 31, 40, "fill-accent2")`) · Global ranking 328 / 176 · Attended 520 / 96 | |
| stat labels | `Rating`, `Level`, `Global ranking`, `Attended`, center y = 34, `text-anchor="start"` | `lead`, `fill-muted` |
| stat values | center y = 68. Rating: rounded, grouped. Level: badge name. Global ranking: grouped rank plus a `<tspan class="fill-muted">` with `/` and grouped participants, one `fitText` over the whole string. Attended: integer | Rating `title` `fill-accent`; Level `number` `fill-accent2`; Global ranking and Attended `number` `fill-text`; all through `fitText` in their slot, min 20, except Level min 24 (`accent2` text must stay 24px or larger, so a long badge name is squeezed with `textLength` instead) |
| chart box | x 28 to 612, y 120 to 240 | |
| chart x | `28 + (t − t₀) / (t₁ − t₀) × 584` by `startTime`; with one point, x = 612 | |
| chart y | `240 − (r − rMin) / span × 120`, where `span = rMax − rMin`, or 100 with `rMin` lowered by 50 when all ratings are equal | |
| line | `path` `M x y L x y …` through every point, coordinates `toFixed(1)`; omitted with one point | `fill="none"`, `class="gauge stroke-accent"`, `stroke-width` 2, `stroke-linejoin="round"`, `stroke-linecap="round"`, `pathLength="1"`, `stroke-dasharray="1"`, `style="--gauge-empty:1"` |
| last point | `circle` at the last point, r = 5 | `fill-accent`, inside a `<g>` with `enter(9)` |
| last point label | the dot is at the line's last point (`toFixed(1)` coordinates). Rect: width `w = ceil(0.6 × 20 × chars) + 2 × tipPadX`, right edge at `dotX − dotRadius − tipGap` (597 today), so x = that edge − w, y = `dotY − tipHeight / 2`, height 28, `rx` of `radius.small`, `stroke-width` of `layout.border`, no half pixel inset. Text at the rect's center x, center y = `dotY`: last history rating, rounded and grouped. The label covers the end of the line on purpose | rect `fill-surface stroke-border`; text `lead`, `fill-text`, `text-anchor="middle"`; same `enter(9)` group |
| year labels | UTC year of the first `startTime` at x = 24 (`start`), of the last at x = 616 (`end`), center y = 266, plain digits. With one point, or when both years match, only one label: at x = 616 (`end`) with one point, at x = 24 (`start`) otherwise | `lead`, `fill-muted` |
| Top label, value | x = 664: `Top` at center y = 34, `<p>%` at center y = 68 | label `lead` `fill-muted`; value `title` `fill-accent` via `fitText` (slot 162, min 20) |
| histogram | `step = floor((162 + 2) / n)`, bar width `step − 2`, bar i at x = 664 + i × step; bottom y = 276; height `max(2, round(userCount / maxCount × 168))`; `rx` 1 (`contestCard.barRadius`) | the current bucket `fill-accent`, others `fill-track`, every bar `class="rise …"` |
| current bucket | the bucket with `ratingStart ≤ rating < ratingEnd`; else the last bucket with `ratingStart ≤ rating`; else none | |

**Theme constants** (`src/theme.ts`, each `as const satisfies { readonly [name: string]: number }`; every number in the two anatomy tables comes from these, `layout`, `radius`, `typography`, or `motion`):

| Constant | Keys and values |
|---|---|
| `solvedCard` | `cx` 136, `cy` 107, `radius` 80, `stroke` 6, `span` 270, `segmentGap` 6, `trackOpacity` 0.25, `numberBaseline` 112, `numberSlot` 88, `checkX` 104, `checkY` 122, `checkSize` 14, `solvedX` 122, `solvedY` 129, `attemptingY` 162, `attemptingSlot` 96, `chipX` 264, `chipWidth` 112, `chipHeight` 44, `chipGap` 8, `dotX` 16, `dotY` 14, `dotRadius` 4, `chipLabelX` 26, `chipLabelY` 14, `chipValueX` 12, `chipValueY` 31, `chipValueSlot` 88 |
| `contestCard` | `height` 300, `paneRight` 616, `dividerX` 640 (drawn at + 0.5), `rightX` 664, `rightWidth` 162, `labelY` 34, `valueY` 68, `ratingX` 24, `ratingSlot` 104, `levelIconX` 144, `levelIconY` 31, `levelIcon` 40, `levelX` 192, `levelSlot` 120, `rankX` 328, `rankSlot` 176, `attendedX` 520, `attendedSlot` 96, `chartLeft` 28, `chartRight` 612, `chartTop` 120, `chartBottom` 240, `flatSpan` 100, `lineWidth` 2, `dotRadius` 5, `tipGap` 10, `tipHeight` 28, `tipPadX` 8, `yearY` 266, `barsBottom` 276, `barsMaxHeight` 168, `barGap` 2, `barMinHeight` 2, `barRadius` 1 |

Values that follow from these (the solved card height 196, the chip y values, the chart width 584) are computed in the section, never written as new literals. The contest card width is `layout.full`, and the solved card width is `layout.half`.

**Icons** (`src/icons.ts`, `source: HAND_DRAWN`, one path on the 24 × 24 grid, no transform):
- `check`: a check mark as one filled stroke. `M20.3 5.3L9 16.6L3.7 11.3L2.3 12.7L9 19.4L21.7 6.7Z`
- `shield`: a shield outline, with the inner shield drawn in the opposite direction to cut it out. `M12 1L3 5V11C3 16.5 6.8 21.7 12 23C17.2 21.7 21 16.5 21 11V5ZM12 3.2L19 6.3V11C19 15.4 16.1 19.6 12 20.9C7.9 19.6 5 15.4 5 11V6.3Z`

**Motion** (both cards; all from `motion` and existing classes plus `rise`):
- `rise` is added to `BASE_CSS` in `src/svg.ts`: `.rise{animation:rise 1000ms <easing> both;transform-box:fill-box;transform-origin:center bottom}` and `@keyframes rise{from{transform:scaleY(0)}}`, with the duration from `motion.fill.duration`.
- Contest: stat column i (Rating 0, Level 1, Global ranking 2, Attended 3, Top 4) is a `<g>` with `enter(i)`, holding its label and value (and the shield for Level). Year labels are `enter(5)`. Line and bars start at 0 and run 1000 ms. The last point group is `enter(9)` and ends at 1500 ms.
- Solved: the center number `enter(0)`, the Solved row `enter(1)`, Attempting `enter(2)`, chips `enter(3)` to `enter(5)`. Solved arcs fill over 1000 ms.
- Base styles are the final frame. Nothing is `infinite`. Reduce motion shows the final frame.

**API surface** (module exports, no HTTP endpoints of our own):

| Export | Signature | Used by | Failure |
|---|---|---|---|
| `leetcode` (`src/sources/leetcode.ts`) | `Source<LeetcodeSnapshot>`; `fetch(signal)` POSTs the query and reads the error body on a non 2xx status; `validate(raw)` maps and checks | `src/sources/index.ts`, `refresh.ts` | `HttpError` (status), timeout or network `TypeError`, `SyntaxError` on a non JSON body, `ValidationError` (`errors` array, `null` objects, rule broken) |
| `parseLeetcodeSnapshot` (same file) | `(value: unknown) => LeetcodeSnapshot`, pure | `validate`, `src/sections/leetcode.ts` | `ValidationError` naming the path, for example `contest.globalRanking: must be ≤ totalParticipants` |
| `type LeetcodeSnapshot` (same file) | `readonly` object type matching the data model | section | none |
| `leetcodeStats` (`src/sections/leetcode.ts`) | `Section`, listed in `src/readme.ts` right after `techStack` | `renderReadme` | throws the AC-4 errors; `build` catches once |
| `contestCard`, `solvedCard` (`src/theme.ts`) | `as const satisfies { readonly [name: string]: number }` | section | type error |
| `rise` class (`src/svg.ts` `BASE_CSS`) | CSS | section | none |
| `icons.check`, `icons.shield` (`src/icons.ts`) | `Icon`, `source: HAND_DRAWN`, paths in *Icons* | `iconSvg` | type error on a wrong key |
| `HttpError` (`src/sources/http.ts`) | `constructor(status: number, url: string, detail?: string)`; message `HTTP <status> from <url>` plus `: <detail>` when given | `leetcode.fetch`, `refresh.ts` (unchanged) | none |

The section imports only `parseLeetcodeSnapshot` and the type from the source module. Module load does no I/O, so the section stays pure.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| fetch | username in the query | `content.profile.accounts.leetcode` (already pattern checked by `checkContent`, which `refresh` runs first) |
| fetch | URL, headers, query | constants in `src/sources/leetcode.ts` (decided here) |
| fetch | timeout and retry | `refresh.ts` (spec 0001: 15 s, one retry after 2 s on network errors, 5xx, or 429) |
| validate | every snapshot field | the API fields in *Data model sketch* |
| build | `leetcode.json` contents | `ctx.snapshots.get("leetcode")`, then `parseLeetcodeSnapshot` |
| build | username match | `snapshot.username` vs `content.profile.accounts.leetcode`, ignoring case |
| section | link target | `profileUrls(content.profile.accounts).leetcode` |
| section | heading `LeetCode`, labels `Rating`, `Level`, `Global ranking`, `Attended`, `Top`, `Solved`, `Attempting`, `Easy`, `Med.`, `Hard` | constants in `src/sections/leetcode.ts` (decided here) |
| section | total solved, total questions, total attempting | sums over `difficulties.easy`, `.medium`, `.hard` |
| section | segment spans and solved arcs | `difficulties.*.total` and `.solved`, through the anatomy formulas |
| section | rating, level, rank, participants, top %, attended | `snapshot.contest.*`, formatted per AC-7 |
| section | chart points | `snapshot.history[].startTime` and `.rating` |
| section | year labels | `new Date(startTime × 1000).getUTCFullYear()` of the first and last points (UTC, so it never depends on the machine) |
| section | last point label | the last history rating, rounded and grouped |
| section | histogram bars and highlight | `snapshot.histogram[]` and `contest.rating`, through the current bucket rule |
| section | comma grouping | a local pure `groupDigits(n)` that inserts `,` every three digits with a regex (no `Intl`, no locale) |
| section | sizes, positions, timings | `contestCard`, `solvedCard`, `layout`, `radius`, `typography`, `motion` in `src/theme.ts` |
| section | colors | color classes only (`fill-*`, `stroke-*`), opacity by `stroke-opacity` |
| section | alt text | the AC-8 templates, filled from the values above |
| section | asset base names | `leetcode-contest`, `leetcode-solved` |
| refresh | failure line | spec 0001 reporting (`leetcode: <status> \| timeout \| network error \| validation failed \| error`) |

**Key invariants**:
- `build` never contacts LeetCode. Only `refresh` does, and the snapshot changes only after a validated response.
- The same rules hold at write time (`validate`) and read time (`parseLeetcodeSnapshot`). A snapshot that passes one passes the other.
- `solved + attempting ≤ total` per difficulty, `globalRanking ≤ totalParticipants`, and history is strictly increasing by `startTime`, so no arc overflows, no bar is negative, and the line never folds back.
- Drawing depends only on the snapshot and constants, never on the clock, locale, or measured text. Output is the same on every build.
- Outside text reaches markup only as validated integers, the rounded rating, the formatted percentage, and the pattern checked badge name, each escaped once.
- Difficulty colors only fill or stroke shapes, and each has a text label nearby.

**Security model**: All data is public LeetCode profile data, read without a token. There are no secrets, no cookies, and no new workflow permissions. The User Agent names the repo, so LeetCode can see who is asking. Untrusted response text is limited to the badge name, which must match `^[A-Za-z][A-Za-z ]{0,29}$`, and is escaped by `themedImage` (alt) and `escapeXml` (SVG). The existing guards reject scripts, outside links, and event attributes in every SVG.

**Configuration required**: None. No environment variables, secrets, or workflow changes. The existing daily, manual, and push triggers cover this source.

**Edge cases**:
- `contest.badge` is `null`: no shield, no Level column. The Global ranking and Attended columns keep their x positions, and the alt text drops `, level <badge>`.
- One history point: no line, the dot and label at x = 612, one year label at x = 616 (`end`). Alt text reads `Rating history: 2,247 in 2024.`
- First and last contest in the same year: one year label. Alt text reads `Rating history: 1,565 to 2,247 in 2024.`
- All history ratings equal: the line is flat at y = 180 (the `span` fallback).
- Rating outside every bucket: the current bucket rule picks the last bucket at or below it, or none when the rating sits below the first bucket.
- A difficulty with 0 solved: track only. Solved equal to total: a full segment.
- Long numbers (rank 12,345 of 1,234,567): `fitText` shrinks within the slot, down to 20px, then squeezes with `textLength`.
- An unknown or renamed username: HTTP 200 with `errors`, so `ValidationError` and the last good snapshot stays. After changing `accounts.leetcode`, run `pnpm refresh` locally, or the build fails with the AC-4 mismatch message.
- Cloudflare block (403 or a challenge HTML page): no retry on 403, `SyntaxError` on the HTML. The snapshot stays and the run turns red each day it happens.
- LeetCode renames or removes a field: HTTP 400 with a JSON `errors` body (confirmed 2026-11-16), so `HttpError(400)` with the GraphQL message in the log, never retried. A field that turns `null` instead gives a `ValidationError` naming the path. Either way, fix the query and the mapping.

**Critical test scenarios**:
- Happy path: `pnpm refresh` writes `leetcode.json` with today's values. `pnpm build` writes the 4 `leetcode-*` SVGs, and the README shows the heading and both linked cards with the AC-8 alt text, verifies **AC-1**, **AC-2**, **AC-5**, **AC-6**, **AC-7**, **AC-8**.
- Renamed field: temporarily add a field that doesn't exist to `QUERY` and run `pnpm refresh`. It reports `leetcode: 400`, the log shows `Cannot query field …`, and `leetcode.json` is unchanged. Revert, verifies **AC-3**.
- Wrong username: set `accounts.leetcode` to `no-such-user-zz9q` and run `pnpm refresh`. It reports `leetcode: validation failed`, `leetcode.json` is unchanged, and then build fails with the mismatch message. Revert, verifies **AC-3**, **AC-4**.
- Hand edit: set `contest.globalRanking` above `totalParticipants` in `leetcode.json`. `pnpm build` fails naming that path and writes nothing. Revert, verifies **AC-4**.
- Edge rendering: temporarily set `badge` to `null` and keep one history entry. The cards match *Edge cases* and pass the guards. Revert, verifies **AC-10**.
- Motion: open both SVGs in a browser. Everything settles by 1.5 s, and with reduce motion on, the final frame shows at once, verifies **AC-9**.
- Design record: `contestCard` and `solvedCard` values match `docs/design.md`, the icons are alphabetical, and `rise` is documented, verifies **AC-11**.
- GitHub: both themes, desktop and phone width, links open the profile. A manual "Run workflow" on `main` refreshes from the runner, verifies **AC-12**.

## Build plan

Skateboard: each slice leaves the profile live and complete. The smallest whole is the source plus the solved card, then the contest card, then the docs and the check from GitHub's runner.

1. **Slice 1: source and solved card live.**
   1. `src/sources/http.ts`: the optional `detail` argument on `HttpError`. `src/sources/leetcode.ts`: the `QUERY` constant, `fetch` with the error body reading in *Request*, `parseLeetcodeSnapshot` with every rule in *Data model sketch*, and `validate` (check `errors`, map, sort, then parse), satisfies **AC-2**, **AC-3**.
   2. Register `leetcode` in `src/sources/index.ts`, run `pnpm refresh` locally, and commit `data/snapshots/leetcode.json` in the same commit as the source, satisfies **AC-2**.
   3. `solvedCard` in `src/theme.ts`, the hand drawn `check` icon in `src/icons.ts`, satisfies **AC-11**.
   4. `src/sections/leetcode.ts`: snapshot read with the username check, `groupDigits`, the solved card per *Solved card anatomy* with its motion, the heading and the second `<p>` block (the contest block comes in slice 2), and alt text; list `leetcodeStats` after `techStack` in `src/readme.ts`, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-7**, **AC-8**, **AC-9**, **AC-10**.
   5. Push, then trigger "Run workflow" on `main` once, to confirm GitHub's runner reaches `leetcode.com/graphql` before the contest card is built. On a 403 or a challenge page, stop and revisit with `/architect` (see Follow-up), satisfies **AC-12**.
2. **Slice 2: contest card live.**
   1. `contestCard` in `src/theme.ts`, the hand drawn `shield` icon, and the `rise` class in `src/svg.ts`. Adding `rise` to `BASE_CSS` changes every SVG under `assets/generated/`, so that commit regenerates them all, satisfies **AC-9**, **AC-11**.
   2. The contest card per *Contest card anatomy*: stats row, chart, last point label, year labels, divider, Top value, histogram with the current bucket, motion, and alt text, placed in the first `<p>` block, satisfies **AC-1**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**.
3. **Slice 3: design record and check from GitHub.**
   1. `docs/design.md`: the *LeetCode*, *Contest card anatomy*, and *Solved card anatomy* sections, the `check` and `shield` rows, `rise` under ready made classes, the faint status track exception, and the stat cards inventory row (line draws once, bars rise once), satisfies **AC-11**.
   2. Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm lint:md`, then push and trigger "Run workflow" on `main` again. Confirm both themes render on GitHub, satisfies **AC-12**.

## Consequences

**Positive**:
- The profile's highlight reads like the LeetCode page developers already know, in the shared theme.
- One request, no token, no new dependency, and no workflow change.
- An outage, a block, or an API change never breaks the cards. It keeps the last good snapshot and turns the run red.
- The source and section set the pattern features 10 and 12 follow: strict `validate`, the same parse on read, and a username match.

**Negative / tradeoffs**:
- The endpoint is unofficial. A LeetCode change means a red run every day until someone fixes the query, and the cards show stale numbers meanwhile.
- If Cloudflare blocks GitHub's runners, the scheduled refresh can't work from Actions at all (see Follow-up).
- Histogram counts change daily, so `main` gets about one `chore(refresh)` commit a day from this source alone.
- Labels are shorter and the stats row is roomier than LeetCode's, because of the 20px rule. On a phone, the contest card's 20px text shows at about 8px, and the histogram bars at about 2px wide.
- The contest card is the most complex SVG so far (paths from trigonometry and data scaled positions), so it is more code to review than earlier sections.
- Until feature 11 lands, the solved card sits alone in its row.

**Neutral**:
- Feature 11 extends this source and snapshot (badges, submission calendar), adds the badges half card into the second `<p>` block after the solved card, and adds the heatmap as a third block. The query grows, and the source stays one.
- The `rise` class becomes available to every section, and feature 12's bars may use it.
- Spec 0001's open question about running `pnpm lint:md` before refresh commits is answered "not needed" for this source (see Rationale). Features 10 and 12 answer it for theirs.

## Follow-up

- [ ] Slice 1 (task 1.5) confirms GitHub's runner can reach `leetcode.com/graphql`. If it gets a 403 or a challenge page on repeated runs, revisit with `/architect`. The fallback is a community proxy (Option 2) behind the same `validate`.
- [ ] Spec 0001's Follow-up item about `pnpm lint:md` before refresh commits: answered for LeetCode here. `/sync` may note it on that item, which stays open for features 10 and 12.
- [ ] Feature 11 (`/develop leetcode badges & heatmap`) builds on this source and layout, as in *Neutral*. Its badge images are LeetCode PNGs, which must load as their own `<img>` in the README (allowed by `docs/design.md` for third party images), never inside an SVG.
