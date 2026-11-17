# Design: GitHub profile README

The look every section shares, decided in [spec 0003](specs/0003-visual-theme-animation-style.md).

**Where the values live.** `src/theme.ts` holds every color, font, size, spacing step, and timing the build uses. This file repeats them for people to read. When you change a value, change it in both places in the same commit. The build checks only `src/theme.ts`.

**How sections draw.** A section draws through the helpers in `src/svg.ts` (`themedImage`, `card`, `svgDocument`, `enter`, `fitText`, `wrapLines`, `pillButton`, `iconSvg`) and names colors only by class (`fill-accent`, `stroke-border`, `stop-accent2`). A section never writes a hex value, a color name, a font name, a size, or a timing itself.

## Character

Polished and easy to read in both themes. Catppuccin gives soft colors that still meet WCAG AA. Mauve is the main accent and Blue is the second. Motion is bold but short: things arrive once, then hold still, so the page reads well.

## Palette

Light mode uses Catppuccin Latte. Dark mode uses Catppuccin Mocha. Both themes have the same token names.

| Token | Role | Light (Latte) | Dark (Mocha) |
|---|---|---|---|
| `page` | GitHub's default page background. Used only to check things drawn without a card (the typing line). Never drawn, and has no color class. | `#ffffff` | `#0d1117` |
| `surface` | Card background | `#eff1f5` (base) | `#1e1e2e` (base) |
| `border` | Card border and dividers (decorative) | `#ccd0da` (surface0) | `#313244` (surface0) |
| `track` | Empty part of a gauge or bar (decorative) | `#dce0e8` (crust) | `#45475a` (surface1) |
| `text` | Main text | `#4c4f69` (text) | `#cdd6f4` (text) |
| `muted` | Secondary text and labels | `#5c5f77` (subtext1) | `#a6adc8` (subtext0) |
| `accent` | Card headings, key numbers, the typing line, gradient start | `#8839ef` (mauve) | `#cba6f7` (mauve) |
| `accent2` | Gradient end and graphics. Text only at `display`, `title`, or `number` size. | `#1e66f5` (blue) | `#89b4fa` (blue) |
| `onAccent` | Text on the banner gradient | `#ffffff` | `#11111b` (crust) |
| `success` | Status shape, always labeled (for example, Easy) | `#40a02b` (green) | `#a6e3a1` (green) |
| `warning` | Status shape, always labeled (for example, Medium) | `#df8e1d` (yellow) | `#f9e2af` (yellow) |
| `danger` | Status shape, always labeled (for example, Hard) | `#d20f39` (red) | `#f38ba8` (red) |

### Contrast

`pnpm build` checks these pairs in both themes and fails if any pair falls below its minimum (WCAG AA). It also fails if a token isn't a lowercase `#rrggbb` value.

| Foreground | Background | Minimum | Light | Dark |
|---|---|---|---|---|
| `text` | `surface` | 4.5 | 7.06 | 11.34 |
| `muted` | `surface` | 4.5 | 5.53 | 7.37 |
| `accent` | `surface` | 4.5 | 4.79 | 8.07 |
| `accent` | `page` | 4.5 | 5.41 | 9.32 |
| `accent2` | `surface` | 3 | 4.34 | 7.79 |
| `onAccent` | `accent` | 4.5 | 5.41 | 9.23 |
| `onAccent` | `accent2` | 4.5 | 4.91 | 8.91 |

`border`, `track`, `success`, `warning`, and `danger` aren't checked on purpose. They are decorative or always labeled.

For reference only (not checked): the typing line's Mocha `accent` is 7.33:1 on Dark dimmed (`#212830`) and 10.11:1 on Dark high contrast (`#010409`). The banner gradient's midpoints stay at or above 5.28:1 (Latte) and 8.96:1 (Mocha). Card text looks the same on every GitHub theme because cards bring their own `surface`.

### Color classes

Every SVG's only `<style>` starts with the color class block from `themeCss(theme)`. For each token except `page`, in the table order, it defines:

```css
.fill-<token>{fill:<hex>}.stroke-<token>{stroke:<hex>}.stop-<token>{stop-color:<hex>}
```

Use `class="fill-accent"`, `class="stroke-border"`, or `<stop class="stop-accent2" offset="1"/>`. For transparency, use `opacity`, `fill-opacity`, or `stroke-opacity`. The only color values allowed anywhere else in an SVG are `none`, `currentColor`, `transparent`, `inherit`, and `url(#<id>)`.

**Adding a color.** A feature that needs a new color (a contribution graph ramp, brand icon colors) adds it as a token in both themes in `src/theme.ts`, with a contrast pair if it carries text. It never writes the color by hand.

## Typography

System fonts only, because an SVG shown through `<img>` can't load web fonts.

| Family | Stack (GitHub's own) |
|---|---|
| `sans` | `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"` |
| `mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

Every SVG uses `sans` by default. Add the class `font-mono` to use `mono`.

| Style | Size (px) | Weight | Family | Used for |
|---|---|---|---|---|
| `display` | 48 | 700 | sans | Banner name |
| `title` | 32 | 700 | sans | Big card titles |
| `heading` | 20 | 600 | sans | Card headings, banner title |
| `lead` | 20 | 400 | sans | Lead lines on full width images |
| `body` | 14 | 400 | sans | Body text on half cards |
| `label` | 12 | 400 | sans | Labels on half cards |
| `number` | 24 | 600 | mono | Key numbers |
| `typing` | 22 | 400 | mono | The typing line |
| `button` | 14 | 600 | sans | Contact button labels |

Write `font-size` and `font-weight` from these styles (through `fitText` for the size).

**Text on full width images.** A full width image shrinks to about 42% on a phone, so it uses only `display`, `title`, `heading`, `lead`, `number`, and `typing` (20px and up). `body` and `label` appear only on half cards. `button` appears only on contact buttons, which render at their own fixed width and never shrink with the page.

**Large text.** `accent2` may color text only at `display`, `title`, or `number` size (WCAG large text: at least 24px, or 18.66px at weight 700).

## Spacing and layout

| Constant | Value |
|---|---|
| `space` | 4, 8, 12, 16, 24, 32 (px) |
| `radius.card` | 12 |
| `radius.small` | 6 (bars, chips) |
| `radius.pill` | 20 (contact buttons) |
| `layout.full` | 850 wide, rendered at `width="100%"` |
| `layout.half` | 400 wide, rendered at `width="400"`, so two sit side by side on desktop and wrap on narrow screens |
| `layout.pad` | 24 (inner padding of a card) |
| `layout.border` | 1 (card border width) |
| `button.width`, `button.height` | 140, 40 (the pill) |
| `button.margin` | 4, transparent on every side, so a button file is 148 × 48, rendered at `width="148"` |
| `button.padX` | 16 (pill edge to icon) |
| `button.icon` | 16 (icon size) |
| `button.gap` | 8 (icon to label) |
| `stackCard.columns` | 2 (chips per row in a tech stack card) |
| `stackCard.headingGap` | 16 (heading box to the first chip row) |
| `stackCard.chipHeight` | 32 |
| `stackCard.gapX`, `stackCard.gapY` | 16 (between the two columns), 8 (between chip rows) |
| `stackCard.chipPadX` | 12 (chip edge to icon, and text end to chip edge) |
| `stackCard.icon` | 16 (icon size) |
| `stackCard.iconGap` | 8 (icon to name) |

## Card anatomy

Every card is drawn by `card()`:

- A `rect` at `x="0.5" y="0.5"`, with width and height 1 less than the SVG, `rx` of `radius.card`, classes `fill-surface stroke-border`, and `stroke-width` of `layout.border`. The half pixel inset keeps the border from being clipped.
- Content sits inside `layout.pad`.
- Main text uses `fill-text`, labels use `fill-muted`, and the heading or key number uses `fill-accent`.
- Text is aligned with `text-anchor` (`start` or `middle`), never by a computed width, and sized with `fitText`.

## Text fitting

System fonts differ by OS, so text width can't be measured at build time. `fitText(text, slot)` estimates instead. It assumes each character is `0.6 × size` wide (a deliberately wide guess), where the character count is `[...text].length`:

1. `size = min(slot.style.size, floor(slot.width / (0.6 × count)))`.
2. If `size` is below `slot.minSize`, it uses `slot.minSize` and also returns `textLength = slot.width`. The section then writes `textLength` and `lengthAdjust="spacingAndGlyphs"`, which squeezes the text to fit exactly.

This never overflows and always gives the same result. On narrow fonts it may shrink or squeeze text a little more than needed.

**Wrapping body text.** `wrapLines(text, slot)` splits text that may run longer than one line, with the same estimate. A line holds at most `floor(slot.width / (0.6 × slot.style.size))` characters (counted as `[...line].length`). Words, split on runs of spaces, fill each line greedily. A word longer than a whole line goes on its own line. Each line comes back with its own `fitText(line, slot)` result, so an overlong word is squeezed with `textLength` and `lengthAdjust="spacingAndGlyphs"`. Text is never cut off and never ends in `…`. Lines end ragged, and a little short of the slot on most fonts.

## Header banner and typing line (built by feature 5)

**Banner.** A `layout.full` SVG about 220 tall. It has a linear gradient from `stop-accent` to `stop-accent2` at about 135 degrees. The name is in `display` and the title in `heading`, both `fill-onAccent` and centered. The bottom edge is two layered waves filled with the same gradient: the front wave opaque, the back wave at 50% `fill-opacity`. The back wave drifts per `motion.wave`. Everything below the wave is transparent, so the banner blends into every GitHub theme with no seam. Wave paths are computed from constants.

**Typing line.** A transparent `layout.full` SVG, centered under the banner, in `typing` and `fill-accent` (checked against `page`). Each typing state is a whole prefix frame (for example `Cloud D` plus the cursor `▌`), and only one frame shows at a time. Each frame's visibility is an `opacity` keyframe. The base style shows only the final frame, so turning animation off leaves the last phrase. Nothing places the cursor by measured width.

## About me (built by feature 6)

Decided in [spec 0004](specs/0004-about-contact-links.md). Right after the typing line, the README has, in order and separated by blank lines:

- `<h2 align="center">About me</h2>`
- `<p align="center">` with `profile.bio`
- `<p align="center">` with `📍 ` plus `profile.location`
- one `<p align="center">` block holding the contact buttons: LinkedIn, Credly, LeetCode, Email, in that order. There is no GitHub button, since the visitor is already on GitHub.

The heading, bio, and location are real Markdown text, so GitHub colors them for every theme and people can select and translate them. Bio and location pass through `escapeXml` once. GitHub drops `style` and keeps `align`, so the text is centered with `align`.

Each button is `<a href="URL">` wrapping the `<picture>` from `themedImage`, because a link inside an `<img>` SVG is dead. The button block has no blank lines inside it, so GitHub reads it as one HTML block. The line breaks between the `<a>` tags render as a single space, and each button's drawn 4px margin keeps the spacing even, across a row and between wrapped rows.

| Button | Label | Alt text | Link |
|---|---|---|---|
| LinkedIn | `LinkedIn` | `LinkedIn profile` | `profileUrls(accounts).linkedin` |
| Credly | `Credly` | `Credly badges` | `profileUrls(accounts).credly` |
| LeetCode | `LeetCode` | `LeetCode profile` | `profileUrls(accounts).leetcode` |
| Email | `Email` | `Email <profile.email>` | `mailtoUrl(profile.email)` |

## Button anatomy

Every button is drawn by `pillButton(theme, { icon, label })` as a `contact-<name>-light.svg` and `contact-<name>-dark.svg` pair, 148 × 48:

- Everything outside the pill is transparent (`button.margin`, 4px on every side).
- The pill is a `rect` at `x="4.5" y="4.5"`, 139 × 39, `rx` of `radius.pill`, classes `fill-surface stroke-border`, and `stroke-width` of `layout.border`. It uses the same half pixel inset as `card()`.
- The icon is `iconSvg(icon, 20, 16, 16, "fill-accent")`: x is `margin + padX`, and it is centered vertically.
- The label is in `fill-text` at x = 44 (`margin + padX + icon + gap`), y = 24, with `dominant-baseline="central"` and `text-anchor="start"`. It uses the `button` style, sized by `fitText` in an 84px slot (from the label start to `padX` before the pill's right edge) with a 12px minimum.
- Buttons have no animation.

Label `text` on `surface` and icon `accent` on `surface` are already in the contrast table, so buttons need no new pair. The timeline's LinkedIn button (feature 9) reuses the `contact-linkedin` files About me writes. It returns only the markup, so no file is written twice.

## Tech stack (built by feature 7)

Decided in [spec 0005](specs/0005-tech-stack-cards.md). Right after the About me contact buttons, the README has `<h2 align="center">Tech stack</h2>`, a blank line, then one `<p align="center">` block with no blank lines inside. The block holds four half cards from `themedImage`, in this order: Languages, Frameworks, Tools, Cloud. Their files are `stack-<category>-light.svg` and `stack-<category>-dark.svg`, rendered at `width="400"`, so two sit side by side on desktop and they stack on a phone. No card is a link.

Each card's alt text is `<Label>: <name>, <name>, …` with every item name in file order, for example `Languages: TypeScript, Go, C++, Bash`. Every stack `icon` must be a key of the icon registry: a wrong slug fails `pnpm typecheck` and the build. A category holds 1 to 8 items. Cards have no animation.

## Stack card anatomy

Every stack card is drawn by `card()` at `layout.half` (400) wide. All values are in px; the new ones live in `stackCard`.

- The heading is the category label at x = 24 (`layout.pad`), center y = 34 (`pad + 10`), in the `heading` style with `fill-accent`, `dominant-baseline="central"`, and `text-anchor="start"`. The heading box is 20 tall.
- Chips sit in 2 columns inside the 352 inner width, so each chip is 168 wide (`(352 − gapX) / columns`). They fill each row left to right, in file order. Chip i sits at x = `24 + (i mod 2) × 184`, y = `60 + floor(i / 2) × 40` (60 = `pad + 20 + headingGap`, 40 = `chipHeight + gapY`). Positions depend only on the index, never on text width.
- The chip is a `rect` at (x + 0.5, y + 0.5), 167 × 31, `rx` of `radius.small`, classes `fill-surface stroke-border`, and `stroke-width` of `layout.border`, the same half pixel inset as `card()`.
- With an icon: `iconSvg(icon, x + 12, y + 8, 16, "fill-accent")`, then the name at x + 36, center y = y + 16, in a 120px slot.
- Without an icon (AWS today): no icon and no placeholder. The name starts at x + 12 in a 144px slot.
- The name is in the `body` style with `fill-text`, sized by `fitText` with a 12px (`label` size) minimum. When squeezed it writes `textLength` and `lengthAdjust="spacingAndGlyphs"`.
- Every card has the same height, `76 + 40 × rows` (`2 × pad + 20 + headingGap + rows × 40 − gapY`), where `rows = ceil(n / 2)` and n is the item count of the largest category. Today Tools has 5 items, so every card is 196 tall; with the 8 item cap a card is at most 236 tall.

Name `text` on `surface` and icon `accent` on `surface` are already in the contrast table, so stack cards need no new pair.

## LeetCode (built by features 8 and 11)

Decided in [spec 0006](specs/0006-leetcode-stats-card.md) and grown by [spec 0009](specs/0009-leetcode-badges-heatmap.md). Right after the Tech stack block, the README has `<h2 align="center">LeetCode</h2>`, then these `<p align="center">` blocks, separated by blank lines:

1. The contest card.
2. The solved card, then the badges card on the next line, so they sit side by side on desktop and stack on a phone.
3. The badge row (left out when no badge qualifies).
4. The heatmap card.

No block has blank lines inside. Each card is a `themedImage` `<picture>` wrapped in `<a href>` to `profileUrls(accounts).leetcode`, so a click opens the LeetCode profile.

| Card | Files | Width |
|---|---|---|
| Contest | `leetcode-contest-light.svg`, `leetcode-contest-dark.svg` | `width="100%"` (`layout.full`, 850 × 300) |
| Solved | `leetcode-solved-light.svg`, `leetcode-solved-dark.svg` | `width="400"` (`layout.half`, 400 × 196) |
| Badges | `leetcode-badges-light.svg`, `leetcode-badges-dark.svg` | `width="400"` (`layout.half`, 400 × 196, the solved card's height) |
| Heatmap | `leetcode-heatmap-light.svg`, `leetcode-heatmap-dark.svg` | `width="100%"` (`layout.full`, 850 × 264) |

**Badge row.** Up to 8 badges (`badgeRow.max`): the badge chosen on LeetCode (`activeBadgeId`) first, even a monthly one, then badges whose `category` isn't `DCC` (the monthly Daily Coding Challenge), newest `earnedOn` first, ties to the larger numeric `id`, never repeating the chosen badge. Each badge is one line, like the Credly grid:

```html
<a href="https://leetcode.com/u/nguyenducloc"><picture><source media="(prefers-color-scheme: dark)" srcset="<icon>"><img alt="<name>, LeetCode badge earned <Mon YYYY>" src="<icon>" width="80"></picture></a>
```

The image is LeetCode's transparent PNG (never the GIF), on `assets.leetcode.com/` or `leetcode.com/static/`, at 80px wide (`badgeRow.width`). `outsideImage` escapes `src` and `alt` once, and the section escapes the `href` once.

The data comes only from `data/snapshots/leetcode.json`, read through `parseLeetcodeSnapshot`. Numbers follow fixed rules, never the locale: the contest card and all alt text group integers with commas (`6,064`), the solved card prints plain digits like LeetCode (`2245/4114`), ratings are rounded with `Math.round`, Top is `toFixed(2)` plus `%`, and years are UTC.

Alt text states the same numbers a sighted visitor sees:

- Contest: `LeetCode contest rating 2,247, level Guardian, global ranking 6,064 of 892,590, top 0.72%, 31 contests attended. Rating history: 1,565 in 2022 to 2,247 in 2024.` With no badge it drops `, level <badge>`. One contest reads `1 contest attended`. One history point reads `Rating history: 2,247 in 2024.`, and two points in the same year read `Rating history: 1,565 to 2,247 in 2024.`
- Solved: `LeetCode problems solved: 2,245 of 4,114. Easy 661 of 976, Medium 1,170 of 2,148, Hard 414 of 990. 3 attempting.`
- Badges: `LeetCode badges: 62 earned. Most recent: Oct LeetCoding Challenge, Oct 2026.` One badge reads `1 earned`. No badges reads `LeetCode badges: none earned yet.`
- Each row badge: `<name>, LeetCode badge earned <Mon YYYY>`, for example `Guardian, LeetCode badge earned May 2026`.
- Heatmap: `LeetCode submissions from Nov 18, 2025 to Nov 17, 2026: 640 submissions on 362 active days, max streak 292 days.` Singulars read `1 submission`, `1 active day`, and `max streak 1 day`. No submissions in the window reads `LeetCode submissions from <start> to <end>: no submissions.`

Dates use the fixed English month table in `src/dates.ts` (`MONTHS`, shared with the timeline) and are computed in UTC from `YYYY-MM-DD` strings: `<Mon YYYY>` for badges, `<Mon> <D>, <YYYY>` with no zero padding for the heatmap range.

Difficulty colors (Easy `success`, Medium `warning`, Hard `danger`) only paint shapes: the arc, the chip dots, and the check icon. Every word and number is `fill-text` or `fill-muted`, because Latte yellow is too faint to read as text.

**Faint status track (a recorded exception).** The solved card's empty arc uses the segment's own status color at `stroke-opacity` 0.25 (`solvedCard.trackOpacity`) instead of `track`, as on LeetCode. Everywhere else, empty gauges and bars use `track`.

## Contest card anatomy

Drawn by `card()` at 850 × 300. All text is 20px or larger. The values live in `contestCard`; the rest come from `layout`, `radius`, `typography`, and `motion`.

| Element | Geometry | Style |
|---|---|---|
| Panes | Left pane x 24 to 616 (`paneRight`). Divider `line` at x = 640.5 (`dividerX` + 0.5), y 24 to 276. Right pane x 664 (`rightX`) to 826, 162 wide (`rightWidth`) | Divider `stroke-border`, `stroke-width` of `layout.border` |
| Stats columns | x and slot: Rating 24 / 104 (`ratingX`, `ratingSlot`), Level 192 / 120 (`levelX`, `levelSlot`), Global ranking 328 / 176 (`rankX`, `rankSlot`), Attended 520 / 96 (`attendedX`, `attendedSlot`), Top 664 / 162 | |
| Shield | `iconSvg("shield", 144, 31, 40, "fill-accent2")` (`levelIconX`, `levelIconY`, `levelIcon`) | |
| Labels | `Rating`, `Level`, `Global ranking`, `Attended`, `Top`, center y = 34 (`labelY`), `text-anchor="start"` | `lead`, `fill-muted` |
| Values | Center y = 68 (`valueY`), each through `fitText` in its slot | Rating `title` `fill-accent` (min 20). Level `number` `fill-accent2` (min 24, so `accent2` text stays large). Global ranking `number` `fill-text`, the rank then a `fill-muted` `<tspan>` with `/` and the participants, one `fitText` over the whole string (min 20). Attended `number` `fill-text` (min 20). Top `title` `fill-accent` (min 20) |
| Chart box | x 28 to 612 (`chartLeft`, `chartRight`), y 120 to 240 (`chartTop`, `chartBottom`) | |
| Chart x, y | `x = 28 + (t − t₀) / (t₁ − t₀) × 584` by `startTime` (one point: x = 612). `y = 240 − (r − rMin) / span × 120`, where `span = rMax − rMin`, or 100 (`flatSpan`) with `rMin` lowered by 50 when all ratings are equal | |
| Line | `path` `M x y L x y …` through every point, `toFixed(1)`; omitted with one point | `fill="none"`, `gauge stroke-accent`, `stroke-width` 2 (`lineWidth`), round joins and caps, `pathLength="1"`, `stroke-dasharray="1"`, `--gauge-empty:1` |
| Last point | `circle` r = 5 (`dotRadius`) at the last point | `fill-accent` |
| Last point label | Rect `ceil(0.6 × 20 × chars) + 2 × 8` wide (`tipPadX`), 28 tall (`tipHeight`), right edge at `dotX − 5 − 10` (`tipGap`), centered on `dotY`, `rx` of `radius.small`. Text: the last history rating, rounded and grouped, centered in the rect. It covers the end of the line on purpose | Rect `fill-surface stroke-border`, `stroke-width` of `layout.border`; text `lead` `fill-text` |
| Year labels | UTC year of the first point at x = 24 (`start`) and of the last at x = 616 (`end`), center y = 266 (`yearY`). One point: only the last, at 616. Same year: only one, at 24 | `lead`, `fill-muted` |
| Histogram | `step = floor((162 + 2) / n)` (`barGap` 2), bar width `step − 2`, bar i at x = 664 + i × step, bottom y = 276 (`barsBottom`), height `max(2, round(userCount / maxCount × 168))` (`barMinHeight`, `barsMaxHeight`), `rx` 1 (`barRadius`) | `rise`; the current bucket `fill-accent`, others `fill-track` |
| Current bucket | The bucket with `ratingStart ≤ rating < ratingEnd`; else the last bucket with `ratingStart ≤ rating`; else none | |

With a `null` badge, the shield and the Level column are left out, and the other columns keep their x positions.

## Solved card anatomy

Drawn by `card()` at 400 × 196 (`2 × pad + 3 × chipHeight + 2 × chipGap`). The values live in `solvedCard`. Arc coordinates are `toFixed(2)`.

| Element | Geometry | Style |
|---|---|---|
| Ring | Center (136, 107) (`cx`, `cy`), r = 80 (`radius`). θ in degrees clockwise from 12 o'clock: `x = cx + r·sin θ`, `y = cy − r·cos θ`. The arc spans 270° (`span`), from −135° to +135° | |
| Segments | Easy, Medium, Hard, with 6° (`segmentGap`) between them. Segment i spans `(270 − 2 × 6) × total_i / Σ total` | |
| Track | The full segment, `stroke-width` 6 (`stroke`), round caps | `fill="none"`, `stroke-<status>` at `stroke-opacity` 0.25 (`trackOpacity`) |
| Solved arc | From the segment start, `span_i × solved_i / total_i`; left out when solved is 0 | Same at full opacity, plus `gauge`, `pathLength="1"`, `stroke-dasharray="1"`, `--gauge-empty:1` |
| Solved number | One `<text>` at x = 136, baseline y = 112 (`numberBaseline`), `text-anchor="middle"`, `dominant-baseline="alphabetic"`: total solved, then a `<tspan>` with `/` and total questions | Number `title` `fill-text` via `fitText` in 88 (`numberSlot`, min 24); tspan `body` `fill-muted` |
| Solved row | `iconSvg("check", 104, 122, 14, "fill-success")` (`checkX`, `checkY`, `checkSize`), then `Solved` at x = 122 (`solvedX`), center y = 129 (`solvedY`) | `body`, `fill-text` |
| Attempting | `<n> Attempting` at x = 136, center y = 162 (`attemptingY`), in the arc's gap | `label`, `fill-muted`, `fitText` in 96 (`attemptingSlot`, min 12) |
| Chips | x = 264 (`chipX`), y = 24, 76, 128 (`pad + i × (chipHeight + chipGap)`), 112 × 44 (`chipWidth`, `chipHeight`), `chipGap` 8. Rect at (x + 0.5, y + 0.5), 111 × 43, `rx` of `radius.small` | `fill-surface stroke-border`, `stroke-width` of `layout.border` |
| Chip dot | `circle` at (x + 16, y + 14) (`dotX`, `dotY`), r = 4 (`dotRadius`) | `fill-<status>` |
| Chip label | `Easy`, `Med.`, `Hard` at x + 26 (`chipLabelX`), center y = y + 14 (`chipLabelY`) | `body`, `fill-muted` |
| Chip value | `<solved>/<total>`, plain digits, at x + 12 (`chipValueX`), center y = y + 31 (`chipValueY`), slot 88 (`chipValueSlot`) | `body` via `fitText` (min 12), `fill-text` |

Text uses `dominant-baseline="central"`, except the solved number line.

## Badges card anatomy

Drawn by `card()` at 400 × 196, the solved card's height. The values live in `badgesCard`. Every text sits at x = 24 (`layout.pad`) with `dominant-baseline="central"` and `text-anchor="start"`. Static: no animation class.

| Element | Geometry | Style |
|---|---|---|
| Heading | `Badges`, center y = 34 (`headingY`) | `heading`, `fill-accent` |
| Icon | `iconSvg("leetcode", 352, 22, 24, "fill-accent")`: x = `layout.half − pad − icon`, y = `iconY`, size `icon` | |
| Count | All badges, grouped (`62`), center y = 74 (`countY`) | `title`, `fill-text` |
| Most recent label | `Most recent`, center y = 112 (`recentY`) | `body`, `fill-muted` |
| Badge name | The badge with the newest `earnedOn` (ties: larger numeric `id`), center y = 138 (`nameY`), `fitText` in 352 (`nameSlot`), min 14 (`nameMin`), then squeezed with `textLength` | `heading`, `fill-text` |
| Month | `<Mon YYYY>` of its `earnedOn`, center y = 164 (`monthY`) | `body`, `fill-muted` |

With no badges, the count reads `0` and `No badges yet` (`body`, `fill-muted`) sits at `recentY`, with no name or month.

## Heatmap card anatomy

Drawn by `card()` at 850 × 264 (`heatmap.height`). The values live in `heatmap`. All text is 20px or larger, with `dominant-baseline="central"`. Static: no animation class. Days are UTC (`Date.UTC`, `getUTCDay`), and the grid ends on the snapshot's `asOf`, so the build never reads the clock.

| Element | Geometry | Style |
|---|---|---|
| Window | The 365 days (`windowDays`) from `asOf − 364` to `asOf`. A day's count is its `calendar[]` entry, else 0 | |
| Stats | Labels at center y = 34 (`labelY`), values at center y = 68 (`valueY`), `text-anchor="start"`. Submissions (past year) at x 24, slot 300 (`submissionsX`, `submissionsSlot`). Active days at x 348, slot 220 (`activeX`, `activeSlot`). Max streak at x 592, slot 234 (`streakX`, `streakSlot`). Each label and value (`groupDigits(n)`, no unit) goes through `fitText` in its slot, min 20 | Labels `lead` `fill-muted`. Submissions value `title` `fill-accent`. Active days and Max streak values `number` `fill-text` |
| Stat values | From the `calendar[]` entries inside the window: the sum of counts, the number of entries, and the longest run of back to back dates. They can differ from LeetCode's page by a day, since its window is one day wider | |
| Blocks | One block per month the window touches (12 or 13), oldest on the left. A day's column is `floor((weekday(first day) + day offset) / 7)`, its row its weekday (Sunday 0). A block has `floor((weekday(first day) + days − 1) / 7) + 1` columns | |
| Cells | Step 11 (`cell` 9 + `cellGap` 2). Block b starts at `x0 + (columns before it) × 11 + b × 6` (`monthGap`). Cell at (block x + column × 11, 100 + row × 11) (`gridTop`), 9 × 9, `rx` 2 (`cellRadius`). Cells end at y = 175 | Level 0 `fill-track`. Levels 1 to 4 `fill-accent` with `fill-opacity` 0.25, 0.5, 0.75, 1 (`opacity1` to `opacity4`), always written |
| Grid x | Width `w = columns × 11 − 2 + (blocks − 1) × 6`, `x0 = 24 + floor((802 − w) / 2)`, so the grid is centered. The widest window (65 columns, 13 blocks) is 785 | |
| Levels | The highest k with `count ≥ level<k>Min`: 1, 2, 3, 5 (`level1Min` to `level4Min`). Count 0 is level 0 | |
| Month labels | The short month name at the block's center x, center y = 198 (`monthY`), `text-anchor="middle"`, only on blocks with at least 3 columns (`monthMinColumns`). Both end blocks can be the same month (two different years), and both get a label | `lead`, `fill-muted` |
| Legend | Center y = 230 (`legendY`). `More` ends at x = 826 (`text-anchor="end"`). Five cells, levels 0 to 4, at x = 717, 728, 739, 750, 761 and y = 225.5, the last one ending `legendGap` 8 plus `ceil(0.6 × 20 × 4)` left of 826. `Less` ends at x = 709 | Text `lead` `fill-muted`; cells as in *Cells* |

**Levels shown by color (a recorded exception).** The heatmap shows a day's level by its mauve opacity alone, as LeetCode does. The `Less` to `More` legend explains the ramp, and the three stats and the alt text carry the numbers, so no information lives only in color. Everywhere else, color is never the only cue.

## Experience and education (built by feature 9)

Decided in [spec 0007](specs/0007-experience-education-timeline/index.md). At the end of the README (after LeetCode), separated by blank lines, the README has:

- `<h2 align="center">Experience</h2>`
- a `<p align="center">` block holding the experience card
- `<h2 align="center">Education</h2>`
- a `<p align="center">` block holding the education card
- a `<p align="center">` block holding the LinkedIn button

No block has blank lines inside. Each card is a `themedImage` `<picture>` wrapped in `<a href>` to `profileUrls(accounts).linkedin`. The button is `<a href>` to the same URL around a `<picture>` of the existing `contact-linkedin-light.svg` and `contact-linkedin-dark.svg`, at `width="148"`, alt text `Full work history on LinkedIn`. `checkReadmeAssets` fails the build if those files ever stop being written.

| Card | Files | Width |
|---|---|---|
| Experience | `timeline-experience-light.svg`, `timeline-experience-dark.svg` | `width="100%"` (`layout.full`, 850 wide; 404 tall with three roles) |
| Education | `timeline-education-light.svg`, `timeline-education-dark.svg` | `width="100%"` (`layout.full`, 850 wide; 212 tall with two schools) |

Both lists sort newest `start` first. On a tie, a current entry (`end: null`) comes first, then the later `end`, then file order. Dates use a fixed English month table, never the locale or the clock: `May 2025`, `May 2025 – Present`, `Jan 2025 – May 2025` (space, en dash, space), or one month alone when `start` equals `end`. No duration is shown, so the output never changes with the date.

Alt text carries every word the card shows, with ` to ` in place of the en dash:

- Experience: `Experience: ` then each role as `<title> at <company>[, <location>], <dates>. <highlight> <highlight>`.
- Education: `Education: ` then each school as `<degree>[, <field>] at <school>, <dates>.[ <note>]`.

Each highlight and note gets a final `.` unless it already ends in `.`, `!`, or `?`. `companyUrl` is not shown: a link inside an `<img>` can't be clicked. The content check allows 1 to 6 roles and 1 to 4 schools, which keeps the experience card under about 1,200px tall.

## Timeline card anatomy

Drawn by `card()` at 850 wide. All text is 20px or larger. The values live in `timelineCard`; the rest come from `layout` and `typography`. The cards are static.

| Element | Geometry | Style |
|---|---|---|
| Rail | `line` at x = 40 (`railX`), from the first dot's center y to the last dot's center y. Left out with one entry | `stroke-border`, `stroke-width` 2 (`railWidth`) |
| Dot | `circle` at (40, row 0 center y), r = 7 (`dotRadius`), drawn after the rail | `stroke-width` 2 (`dotStroke`). Current: `fill-accent stroke-accent`. Past: `fill-surface stroke-accent` (a hollow ring). "Present" in the dates also marks the current entry, so color is never the only cue |
| Text column | x = 72 (`textX`) to x = 826 (`layout.full − layout.pad`), 754 wide | |
| Row 0, left | Title or school name at x = 72, `text-anchor="start"`, `fitText` in a 510 slot (754 − `dateSlot` 228 − `titleGap` 16), min 20. Never wraps | `heading`, `fill-accent` |
| Row 0, right | Dates at x = 826, `text-anchor="end"`, `fitText` in 228 (`dateSlot`), min 20 | `lead`, `fill-muted` |
| Role row 1 | Company, then `<tspan class="fill-muted"> · <location></tspan>` when set, at x = 72, one `fitText` over the whole string in 754, min 20 | `lead`, `fill-text` |
| Role highlights | Per highlight: `•` at x = 72 on its first row, lines from `wrapLines` at x = 92 (`textX + bulletIndent` 20) in a 734 slot (61 characters), min 20 | `•` `lead` `fill-muted`; text `lead` `fill-text` |
| School degree | `<degree>[, <field>]` lines from `wrapLines` at x = 72 in 754 (62 characters), min 20 | `lead`, `fill-text` |
| School note | Note lines from `wrapLines` at x = 72 in 754, min 20 | `lead`, `fill-accent` |
| Rows | Row k center y = `entryTop + 14 + k × 28` (`lineHeight` 28), `dominant-baseline="central"` | |
| Entries | The first `entryTop` is 24 (`layout.pad`). Each next one is the previous top + rows × 28 + 24 (`entryGap`) | |
| Height | `48 + 28 × (all rows) + 24 × (entries − 1)` | |

Text `text`, `muted`, and `accent` on `surface` are already in the contrast table, so the cards need no new pair.

## Certifications (built by feature 10)

Decided in [spec 0008](specs/0008-credly-badge-grid.md). After the LinkedIn button block of *Experience and education*, separated by blank lines, the README has:

- `<h2 align="center">Certifications</h2>`
- a `<p align="center">` block holding every badge from `data/snapshots/credly.json`, one badge per line
- a `<p align="center">` block holding the see all button

No block has blank lines inside. Each badge comes from `outsideImage()` and is exactly one line, with no spaces or line breaks between tags, so the badges wrap like inline images on a phone:

```html
<a href="https://www.credly.com/badges/<id>"><picture><source media="(prefers-color-scheme: dark)" srcset="<imageUrl>"><img alt="<name>, issued by <issuer>" src="<imageUrl>" width="110"></picture></a>
```

- The image is Credly's own PNG (`imageUrl`, always on `images.credly.com/images/`), shown at 110px wide (`credlyGrid.badgeWidth`). Both sources point at the same file, there is no light `<source>`, and there is no `height`, so the PNG keeps its own shape. The PNGs are transparent, so they sit on either theme's page background.
- Alt text is `<name>, issued by <issuer>`, for example `AWS Certified Cloud Practitioner, issued by Amazon Web Services Training and Certification`. Pass it raw: `outsideImage` escapes `src` and `alt` once, and the section escapes the `href` once.
- The section writes no assets, and nothing in it moves.

Badges are grouped by issuer through the order alone, with no per issuer line or label:

1. Issuers with more badges first. Ties go by issuer name.
2. Within an issuer, by level: `Advanced`, `Intermediate`, `Foundational`, then any other level or none.
3. Then the newest `issuedOn` first, then name, then `id`.

Strings compare with JavaScript's `<`, never by locale. The build never reads the clock: refresh drops expired, hidden, and unaccepted badges before the snapshot is written.

The see all button is `<a href>` to `profileUrls(accounts).credly` around a `<picture>` of the existing `contact-credly-light.svg` and `contact-credly-dark.svg`, at `width="148"`, alt text `All badges on Credly`. `checkReadmeAssets` fails the build if those files ever stop being written.

## Icon registry

Every icon on the profile comes from `src/icons.ts`. Each entry is one `path` on a 24 × 24 grid plus a `source`:

- `simple-icons@<version>` for a path copied from Simple Icons (CC0). Every copied entry shares one pinned release. Refreshing icons means copying every copied entry from the new release in the same commit.
- `hand drawn` for a glyph Simple Icons lacks, drawn as one filled path. Holes are cut by drawing them in the opposite direction, so no `fill-rule` is needed.

Entries hold path data only: no color, `fill`, `stroke`, or `transform`. One class paints the whole icon, and icons use `fill-accent`, never brand colors. Keys are Simple Icons slugs, or a plain name for a glyph Simple Icons doesn't cover. `IconName` is the set of keys, so asking for a missing icon is a type error. Draw an icon with `iconSvg(name, x, y, size, classes)`, which nests a `<svg viewBox="0 0 24 24">`.

| Icon | Source |
|---|---|
| `check` | hand drawn: a check mark as one filled stroke |
| `cplusplus` | `simple-icons@16.38.0` |
| `credly` | `simple-icons@16.38.0` |
| `docker` | `simple-icons@16.38.0` |
| `email` | hand drawn: an envelope with its flap cut out as a V |
| `git` | `simple-icons@16.38.0` |
| `gnubash` | `simple-icons@16.38.0` |
| `go` | `simple-icons@16.38.0` |
| `kubernetes` | `simple-icons@16.38.0` |
| `leetcode` | `simple-icons@16.38.0` |
| `linkedin` | hand drawn (Simple Icons 16.38.0 has no LinkedIn): a lowercase "in" cut out of a rounded square |
| `linux` | `simple-icons@16.38.0` |
| `nextdotjs` | `simple-icons@16.38.0` |
| `react` | `simple-icons@16.38.0` |
| `shield` | hand drawn: a shield outline, the inner shield cut out |
| `terraform` | `simple-icons@16.38.0` |
| `typescript` | `simple-icons@16.38.0` |

## Motion

### Timings

| Constant | Value |
|---|---|
| `motion.easing` | `cubic-bezier(0.2, 0, 0, 1)` |
| `motion.enter` | 600 ms, from `opacity: 0` and `translateY(8px)`, `animation-fill-mode: both`, 100 ms stagger, every entrance finished by 1500 ms |
| `motion.fill` | 1000 ms, same easing, `fill-mode: both` |
| `motion.wave` | 4500 ms total: the back wave drifts one full period while easing to a stop, then holds |
| `motion.typing` | 70 ms per typed character, 40 ms per deleted character, 1000 ms hold on each full phrase except the last, 300 ms pause before the next phrase, then rest on the last phrase with no cursor |
| `motion.budget` | 5000 ms: every animation in every SVG ends by then (WCAG 2.2.2) |

### Ready made animation classes

`svgDocument` puts these in every SVG:

- `enter`: fades and slides an item in. Use `enter(i, "<classes>")`, which also sets `animation-delay` to `i × 100 ms`.
- `grow`: a bar fills from its left edge with `scaleX`.
- `gauge`: a gauge fills with `stroke-dashoffset`. Set the custom property `--gauge-empty` on the element to the dash offset of an empty gauge.
- `rise`: a vertical bar fills from its bottom edge with `scaleY`, over `motion.fill`.

### Inventory (the only places motion is allowed)

| Element | Feature | Motion | Still frame (reduce motion on, or after it ends) |
|---|---|---|---|
| Header banner | 5 | Name and title enter once. The back wave drifts and settles (`motion.wave`). | Name, title, and both waves in place |
| Typing line | 5 | Types "Cloud Developer", deletes it, types "LeetCode Guardian", then rests (`motion.typing`). Phrases come from `typingPhrases`. At most three phrases, with holds shortened so the whole run ends within `motion.budget`. | The last phrase, no cursor |
| Stat cards (LeetCode, GitHub) | 8, 12 | Content enters once, staggered. Gauges and bars fill once. Numbers fade in; they don't count up. LeetCode: the contest stats enter as `enter(0)` to `enter(4)` and the years as `enter(5)`; the history line draws once (`gauge`) and the histogram bars rise once (`rise`), both from 0 ms; the last point and its label enter last (`enter(9)`, done at 1500 ms). On the solved card, the center number, the Solved row, Attempting, and the three chips enter as `enter(0)` to `enter(5)`, and the solved arcs fill once (`gauge`). | Full numbers, filled gauges, drawn line, full bars |
| Contribution graph | 13 | Decided in feature 13's spec. Ends within `motion.budget`, or that spec records a reasoned exception. | Decided there |
| Everything else (about, buttons, tech stack, timeline, Credly grid, projects, LeetCode badges and heatmap) | 6, 7, 9, 10, 11, 14 | None | Itself |

### Rules

- Base styles are the final frame. Keyframes animate from the start state, and `fill-mode: both` keeps an item hidden until its delay ends.
- Every SVG ends its `<style>` with `@media (prefers-reduced-motion: reduce){*{animation:none !important}}`, so a visitor who asks for less motion sees the finished picture right away.
- Animate only `opacity`, `transform`, and `stroke-dashoffset`. Use CSS animations, never SMIL `<animate>` tags.
- Nothing flashes more than three times a second.
- Every animation ends within `motion.budget`. `infinite` fails the build.
- No layout or animation depends on measured text width.
- Output stays the same on every build: wave paths, typing frames, and delays come from constants, never randomness.

## Themed images (`<picture>`)

GitHub follows the visitor's theme only through `<picture>`, so every themed image comes from `themedImage()`. It writes `<base>-light.svg` and `<base>-dark.svg` and this markup:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/generated/example-dark.svg">
  <img alt="Loc Nguyen, Cloud Developer" src="assets/generated/example-light.svg" width="400">
</picture>
```

The light file is the `<img>` fallback. GitHub's Light and Light high contrast themes get the light file. Dark, Dark dimmed, and Dark high contrast get the dark file. Never make a single SVG that switches theme with its own `prefers-color-scheme` query: that follows the OS setting, which can differ from the GitHub theme.

Third party images that look the same in both themes (for example, Credly badge PNGs) still use `<picture>`, and may point both sources at the same outside file. Draw them with `outsideImage()` (see *Certifications*).

## Accessibility

- Every image is an `<img>` with real alt text, inside `<picture>` with a light and a dark version. Markdown image syntax fails the build.
- Every text pair in the contrast table meets WCAG AA in both themes, and the build checks it.
- Color is never the only way to show information. Status shapes (`success`, `warning`, `danger`) only fill or stroke shapes, and each one has a text label nearby in `fill-text` or `fill-muted`. The one recorded exception is the LeetCode heatmap's levels (see *Heatmap card anatomy*).
- All motion ends within 5 seconds and respects reduce motion (see *Motion*).
- Content text passes through `escapeXml` exactly once on its way into an SVG or an HTML attribute. `themedImage` escapes alt text, so pass it raw. The content check also rejects characters XML doesn't allow.

## What the build checks

Before anything is written, `pnpm build` fails if:

- any contrast pair is below its minimum, or a token isn't lowercase `#rrggbb`;
- a generated SVG contains a script, an outside link, an event attribute, `@import`, a doctype or entity, or an endless animation (it may link only to `#<id>`);
- a generated SVG's name doesn't end in `-light.svg` or `-dark.svg`, or it has no twin;
- an SVG's first `<style>` doesn't start with its own theme's color classes, or it writes a color anywhere else;
- the README names an `assets/generated/` file (in `src` or `srcset`) that no section writes.

Review covers what the build can't measure: sizes and timings come from `src/theme.ts`, and motion ends within `motion.budget`.
