# Design: GitHub profile README

The look every section shares, decided in [spec 0003](specs/0003-visual-theme-animation-style.md) and redesigned by [spec 0010](specs/0010-profile-redesign.md) (an assumed decision, not yet ratified).

**Where the values live.** `src/theme.ts` holds every color, font, size, spacing step, and timing the build uses. This file repeats them for people to read. When you change a value, change it in both places in the same commit. The build checks only `src/theme.ts`.

**How sections draw.** A section draws through the helpers in `src/svg.ts` (`themedImage`, `card`, `svgDocument`, `enter`, `fitText`, `textWidth`, `wrapLines`, `pillButton`, `sectionHeading`, `iconSvg`, `iconWidth`) and names colors only by class (`fill-accent`, `stroke-border`, `stop-accent2`). Brand logos and outside images bring their own colors as embedded images. A section never writes a hex value, a color name, a font name, a size, or a timing itself.

## Character

Looks like part of GitHub. Cards use GitHub's own Primer colors and type sizes, so they sit on the page like GitHub's own UI in both themes. Logos keep their real colors: brand icons in the brand's color, company and school logos as they are. Motion is bold but short: things arrive once, then hold still, so the page reads well.

## Palette

Both themes use GitHub's Primer colors, with the same token names. `success`, `warning`, and `danger` are LeetCode's own difficulty colors.

| Token | Role | Light | Dark |
|---|---|---|---|
| `page` | GitHub's default page background. Used only to check things drawn without a card (the typing line, the experience and education images, brand icons). Never drawn, and has no color class. | `#ffffff` | `#0d1117` |
| `surface` | Card background (Primer canvas subtle) | `#f6f8fa` | `#151b23` |
| `border` | Card border and dividers (decorative) | `#d1d9e0` | `#3d444d` |
| `track` | Empty part of a gauge or bar, a logo tile with no logo (decorative) | `#e6eaef` | `#262c36` |
| `text` | Main text | `#1f2328` | `#f0f6fc` |
| `muted` | Secondary text and labels | `#59636e` | `#9198a1` |
| `accent` | Timeline names, the LeetCode level, the typing line, generic heading icons, gradient start (Primer blue) | `#0969da` | `#4493f8` |
| `accent2` | Gradient end (Primer purple) | `#8250df` | `#ab7df8` |
| `onAccent` | Text on the banner gradient | `#ffffff` | `#0d1117` |
| `success` | Status shape, always labeled (Easy) | `#00af9b` | `#1cbaba` |
| `warning` | Status shape, always labeled (Medium) | `#ffb800` | `#ffb700` |
| `danger` | Status shape, always labeled (Hard) | `#ff2d55` | `#f63737` |
| `successText` | The `Easy` chip name: LeetCode's teal, darkened (light) so it reads as text on `track` | `#00705f` | `#1cbaba` |
| `warningText` | The `Med.` chip name, the same for LeetCode's yellow | `#805600` | `#ffb700` |
| `dangerText` | The `Hard` chip name, the same for LeetCode's red | `#c0262d` | `#ff6b6b` |
| `heat` | Heatmap cells: LeetCode's green, at four opacities | `#2cbb5d` | `#2cbb5d` |
| `leetcode` | The contest rating line and its last dot: LeetCode's orange | `#ffa116` | `#ffa116` |
| `honor` | The honors pill on the education image: its stars, text, border, and a 12% tint behind them | `#8a5c00` | `#e3b341` |
| `logoTile` | The white tile behind a company or school logo, in both themes, since logos are made for white | `#ffffff` | `#ffffff` |

### Brand logos

Brand logos are not drawn from tokens. Each is the brand's whole full color SVG file, vendored in `src/brands.ts` (spec 0010) and embedded as a `data:image/svg+xml;base64,` image, so it keeps its real colors in both themes. A brand has a `light` file and, when the light one would not read on a dark page, a `dark` file; `iconSvg` picks the file for the theme. See *Icon registry* for the list and sources.

### Contrast

`pnpm build` checks these pairs in both themes and fails if any pair falls below its minimum (WCAG AA). It also fails if a token isn't a lowercase `#rrggbb` value.

| Foreground | Background | Minimum | Light | Dark |
|---|---|---|---|---|
| `text` | `surface` | 4.5 | 14.83 | 15.90 |
| `muted` | `surface` | 4.5 | 5.74 | 5.94 |
| `accent` | `surface` | 4.5 | 4.87 | 5.58 |
| `accent` | `page` | 4.5 | 5.19 | 6.10 |
| `text` | `page` | 4.5 | 15.79 | 17.38 |
| `muted` | `page` | 4.5 | 6.11 | 6.49 |
| `accent2` | `surface` | 4.5 | 4.73 | 5.78 |
| `onAccent` | `accent` | 4.5 | 5.19 | 6.10 |
| `onAccent` | `accent2` | 4.5 | 5.04 | 6.32 |
| `text` | `track` | 4.5 | 13.07 | 12.89 |
| `successText` | `track` | 4.5 | 4.99 | 5.87 |
| `warningText` | `track` | 4.5 | 5.34 | 8.03 |
| `dangerText` | `track` | 4.5 | 4.88 | 5.05 |
| `honor` | `page` | 4.5 | 5.81 | 9.72 |

`border`, `track`, `success`, `warning`, `danger`, `heat`, `leetcode`, and `logoTile` aren't checked on purpose. They are decorative or always labeled. The honors pill draws `honor` text on a 12% `honor` tint, which still gives 4.90:1 (light) and 7.96:1 (dark).

### Color classes

Every SVG's only `<style>` starts with the color class block from `themeCss(theme)`. For each token except `page`, in the table order, it defines:

```css
.fill-<token>{fill:<hex>}.stroke-<token>{stroke:<hex>}.stop-<token>{stop-color:<hex>}
```

The build fails if an SVG uses a `fill-`, `stroke-`, or `stop-` class this block doesn't define.

Use `class="fill-accent"`, `class="stroke-border"`, or `<stop class="stop-accent2" offset="1"/>`. For transparency, use `opacity`, `fill-opacity`, or `stroke-opacity`. The only color values allowed anywhere else in an SVG are `none`, `currentColor`, `transparent`, `inherit`, and `url(#<id>)`.

**Adding a color.** A feature that needs a new color adds it as a token in both themes in `src/theme.ts`, with a contrast pair if it carries text. It never writes the color by hand. A new brand logo is a new file in `src/brands.ts`, not a color.

## Typography

System fonts only, because an SVG shown through `<img>` can't load web fonts.

| Family | Stack (GitHub's own) |
|---|---|
| `sans` | `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"` |
| `mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

Every SVG uses `sans` by default. Add the class `font-mono` to use `mono`; only the typing line does, so every card number reads in the same font as the text around it.

| Style | Size (px) | Weight | Family | Used for |
|---|---|---|---|---|
| `display` | 48 | 700 | sans | Banner name |
| `tagline` | 22 | 600 | sans | Banner title |
| `title` | 24 | 500 | sans | Big card numbers (solved, badge count, submissions) |
| `heading` | 16 | 600 | sans | Card headings, timeline names, badge name |
| `lead` | 14 | 400 | sans | Labels and body text on full width cards |
| `body` | 14 | 400 | sans | Body text on half cards |
| `label` | 12 | 400 | sans | Small labels on half cards |
| `typing` | 22 | 400 | mono | The typing line |
| `button` | 14 | 600 | sans | Contact button labels |
| `chip` | 13 | 600 | sans | Tech stack chip names |
| `strong` | 14 | 500 | sans | Emphasis inside LeetCode cards (chip counts, heatmap numbers) and the honors pill |
| `name` | 16 | 500 | sans | The most recent LeetCode badge's name |
| `stat` | 20 | 500 | sans | The four contest stat values (rating, level, ranking, attended) |

Write `font-size` and `font-weight` from these styles (through `fitText` for the size).

**Weight.** LeetCode numbers and names use medium (500), not bold, so they stand out without shouting (spec 0010).

**Card text size.** Card text stays near GitHub's own 14 to 16px, so cards read like the page around them on a desktop (spec 0010). A full width image shrinks to about 42% on a phone, so its text is small there; that trade off was chosen on purpose. Text never goes below 12px in the SVG.

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
| `stackChip.height` | 32 (the chip) |
| `stackChip.margin` | 2, transparent on every side, so a chip file is 36 tall |
| `stackChip.padX` | 10 (chip edge to icon, and name end to chip edge) |
| `stackChip.icon` | 18 (icon size) |
| `stackChip.iconGap` | 8 (icon to name) |

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

## Section headings

Every section starts with `sectionHeading({ key, title, icon })` (spec 0010): a left aligned `<h2>` holding one inline `<picture>` of the icon, a space, then the title as real text.

```html
<h2><picture><source media="(prefers-color-scheme: dark)" srcset="assets/generated/heading-experience-dark.svg"><img alt="" src="assets/generated/heading-experience-light.svg" width="24"></picture> Experience</h2>
```

The icon file is `heading-<key>-light.svg` and `-dark.svg`, 24 × 24 (GitHub draws an `<h2>` at 24px), with the icon filling it. Brand icons use their brand color, others `fill-accent`. The icon is decorative, so its `alt` is empty and a screen reader reads only the title. The README guard allows `alt=""` only on an image inside an `<h2>` that has its own text.

| Section | Key | Icon |
|---|---|---|
| About me | `about` | `person` |
| Experience | `experience` | `briefcase` |
| Education | `education` | `graduationcap` |
| Certifications | `certifications` | `award` |
| Tech stack | `stack` | `code` |
| LeetCode | `leetcode` | `leetcode` (brand) |

## Section order

Header banner, typing line, About me, Experience, Education, Certifications, Tech stack, LeetCode (spec 0010). The body of each section is left aligned like its heading.

## Header banner and typing line (built by feature 5)

**Banner.** A `layout.full` SVG about 220 tall. It has a linear gradient from `stop-accent` (blue) to `stop-accent2` (purple) at about 135 degrees. The name is in `display` and the title in `tagline`, both `fill-onAccent` and centered. The bottom edge is two layered waves filled with the same gradient: the front wave opaque, the back wave at 50% `fill-opacity`. The back wave drifts per `motion.wave`. Everything below the wave is transparent, so the banner blends into every GitHub theme with no seam. Wave paths are computed from constants.

**Typing line.** A transparent `layout.full` SVG, centered under the banner, in `typing` and `fill-accent` (checked against `page`). It types the greeting from `typingPhrases`, `Hi there 👋`, then rests on `Welcome to my GitHub` (no name, since the banner already shows it). Each typing state is a whole prefix frame (for example `Hi th` plus the cursor `▌`), and only one frame shows at a time. Its alt text is the phrases joined by spaces. Each frame's visibility is an `opacity` keyframe. The base style shows only the final frame, so turning animation off leaves the last phrase. Nothing places the cursor by measured width.

## About me (built by feature 6)

Decided in [spec 0004](specs/0004-about-contact-links.md), restyled by [spec 0010](specs/0010-profile-redesign.md). Right after the typing line, the README has, in order and separated by blank lines:

- the `about` section heading (see *Section headings*)
- `<p><i>“<bio>”</i></p>`: `profile.bio` as a quote, in curly quotation marks and italic, left aligned
- one `<p>` block holding the contact buttons: LinkedIn, Credly, LeetCode, Email, in that order. There is no GitHub button, since the visitor is already on GitHub.

The location is not shown (`profile.location` stays in content, unused). The bio is real text, so GitHub colors it for every theme and people can select and translate it. It passes through `escapeXml` once.

Each button is `<a href="URL">` wrapping the `<picture>` from `themedImage`, because a link inside an `<img>` SVG is dead. The button block has no blank lines inside it, so GitHub reads it as one HTML block. The line breaks between the `<a>` tags render as a single space, and each button's drawn 4px margin keeps the spacing even, across a row and between wrapped rows.

| Button | Icon | Label | Alt text | Link |
|---|---|---|---|---|
| LinkedIn | `linkedin` | `LinkedIn` | `LinkedIn profile` | `profileUrls(accounts).linkedin` |
| Credly | `credly` | `Credly` | `Credly badges` | `profileUrls(accounts).credly` |
| LeetCode | `leetcode` | `LeetCode` | `LeetCode profile` | `profileUrls(accounts).leetcode` |
| Email | `gmail` | `Email` | `Email <profile.email>` | `mailtoUrl(profile.email)` |

## Button anatomy

Every button is drawn by `pillButton(theme, { icon, label })` as a `contact-<name>-light.svg` and `contact-<name>-dark.svg` pair, 148 × 48:

- Everything outside the pill is transparent (`button.margin`, 4px on every side).
- The pill is a `rect` at `x="4.5" y="4.5"`, 139 × 39, `rx` of `radius.pill`, classes `fill-surface stroke-border`, and `stroke-width` of `layout.border`. It uses the same half pixel inset as `card()`.
- The icon and the label are centered together (spec 0010). The icon is 16 tall and `iconWidth(icon, 16)` wide (21 for the Gmail M). The label is sized by `fitText` in the slot left after `padX`, the icon, `gap`, and `padX`, with a 12px minimum, in the `button` style; its width is the `textWidth` estimate (or `textLength` when squeezed). The group is icon + 8 + label wide and starts at `margin + round((140 − group) / 2)`.
- The icon is `iconSvg(theme, icon, groupX, 16, 16, "fill-accent")`: the brand's own logo file for the theme.
- The label is in `fill-text` at `groupX + icon + 8`, y = 24, with `dominant-baseline="central"` and `text-anchor="start"`.
- Buttons have no animation.

Only About me shows buttons.

## Tech stack (built by feature 7)

Decided in [spec 0005](specs/0005-tech-stack-cards.md), made a table by [spec 0010](specs/0010-profile-redesign.md). After the Certifications table, the README has the `stack` section heading, a blank line, then one `<table>` with no blank lines inside. Each row is one category, in this order: Languages, Frameworks, Tools, Cloud. The left cell is the label in `<b>`. The right cell holds one chip per item in file order, one inline `<picture>` per line, so the chips wrap like words on a narrow screen. The cells are `<td width="10%">` and `<td width="90%">` (`tableColumns.stack`): GitHub sizes a table to its content, and a label wider than its 10% share pushes the table out to the README's full width, while the label column shrinks to the longest label.

Each chip is a `themedImage` with `inline: true` and `align: "middle"` (`<img align="middle">`, which GitHub keeps), so the chips sit centered in their row next to the label instead of resting on the text baseline, files `stack-<key>-light.svg` and `stack-<key>-dark.svg`, where `<key>` is the item's icon key, or its name in lowercase with every run of other characters as `-` for an item with no icon. Its alt text is the item name. No chip is a link, and nothing moves. Every stack `icon` must be a key of the icon registry: a wrong slug fails `pnpm typecheck` and the build. A category holds 1 to 8 items.

## Stack chip anatomy

Drawn by `svgDocument` (no card), `stackChip.height + 2 × margin` (36) tall. All values are in px.

- Name width is `min(160, textWidth(name, 13))`. The file is `2 × margin + 2 × padX + (iconWidth(icon, 18) + iconGap, when the item has an icon) + name width` wide, rendered at that `width`. The AWS logo is 30 wide, Go 48. Amazon Web Services is spelled out in content.
- The chip is a `rect` at (2.5, 2.5), `width − 5` × 31, `rx` of `radius.small`, classes `fill-surface stroke-border`, `stroke-width` of `layout.border`.
- With an icon: `iconSvg(theme, icon, 12, 9, 18, "fill-text")`, then the name at x = `12 + iconWidth + 8`. Without one: the name at x = 12.
- The name is in the `chip` style, `fill-text`, center y = 18, sized by `fitText` in its width with a 12px minimum.

## LeetCode (built by features 8 and 11)

Decided in [spec 0006](specs/0006-leetcode-stats-card.md), grown by [spec 0009](specs/0009-leetcode-badges-heatmap.md), and reshaped by [spec 0010](specs/0010-profile-redesign.md). Right after the Tech stack table, the README has the `leetcode` section heading, then these `<p>` blocks, separated by blank lines:

1. The contest card.
2. The summary row: the solved card and the badges card side by side in one image (spec 0010), so they always share a row.
3. The heatmap card.

No block has blank lines inside. Each image is a `themedImage` `<picture>` wrapped in `<a href>` to `profileUrls(accounts).leetcode`, so a click opens the LeetCode profile. The separate row of badge PNGs is gone: the badges card shows the featured badges itself.

| Image | Files | Width |
|---|---|---|
| Contest | `leetcode-contest-light.svg`, `leetcode-contest-dark.svg` | `width="100%"` (`layout.full`, 850 × 244) |
| Summary | `leetcode-summary-light.svg`, `leetcode-summary-dark.svg` | `width="100%"` (`layout.full`, 850 × 196: two 417 wide cards, 16 apart, `summaryRow`) |
| Heatmap | `leetcode-heatmap-light.svg`, `leetcode-heatmap-dark.svg` | `width="100%"` (`layout.full`, 850 × 196) |

**Embedded badge art.** Every LeetCode badge picture comes from the outside image store (see *Outside images*), requested by `leetcodeImages` in `src/sources/leetcode.ts` at a stored size about twice the drawn size (`BADGE_IMAGE`): the featured badges (144), the level badge (64), the most recent badge (96), and each month's Daily Coding Challenge badge inside the heatmap window (64, `monthlyBadges`, keyed by the `YYYY-MM` of `earnedOn`).

**Featured badges.** `featuredBadges(snapshot, 3)` in `src/sources/leetcode.ts`: the badge chosen on LeetCode (`activeBadgeId`) first, even a monthly one, then badges whose `category` isn't `DCC` (the monthly Daily Coding Challenge), newest `earnedOn` first, ties to the larger numeric `id`, never repeating the chosen badge. **Level badge.** `levelBadge(snapshot)`: the newest earned badge named like `contest.badge` (Guardian). **Most recent badge.** `mostRecentBadge(snapshot)`: the newest `earnedOn`, ties to the larger numeric `id`.

The data comes only from `data/snapshots/leetcode.json`, read through `parseLeetcodeSnapshot`. Numbers follow fixed rules, never the locale: the contest card and all alt text group integers with commas (`6,064`), the solved card prints plain digits like LeetCode (`2245/4114`), ratings are rounded with `Math.round`, and years are UTC.

Alt text states the same numbers a sighted visitor sees:

- Contest: `LeetCode contest rating 2,247, level Guardian, global ranking 6,064 of 892,590, 31 contests attended. Rating history: 1,565 in 2022 to 2,247 in 2024.` With no badge it drops `, level <badge>`. One contest reads `1 contest attended`. One history point reads `Rating history: 2,247 in 2024.`, and two points in the same year read `Rating history: 1,565 to 2,247 in 2024.`
- Summary: the solved text, a space, then the badges text.
  - Solved: `LeetCode problems solved: 2,245 of 4,114. Easy 661 of 976, Medium 1,170 of 2,148, Hard 414 of 990. 3 attempting.`
  - Badges: `LeetCode badges: 62 earned, featuring Guardian, Annual Badge 2026, 200 Days Badge 2026. Most recent: Oct LeetCoding Challenge, Oct 2026.` One badge reads `1 earned`. No badges reads `LeetCode badges: none earned yet.`
- Heatmap: `LeetCode submissions from Nov 18, 2025 to Nov 17, 2026: 640 submissions on 362 active days, max streak 292 days.` Singulars read `1 submission`, `1 active day`, and `max streak 1 day`. No submissions in the window reads `LeetCode submissions from <start> to <end>: no submissions.`

Dates use the fixed English month table in `src/dates.ts` (`MONTHS`, shared with the timeline) and are computed in UTC from `YYYY-MM-DD` strings: `<Mon YYYY>` for the most recent badge, `<Mon> <D>, <YYYY>` with no zero padding for the heatmap range.

Difficulty colors (Easy `success`, Medium `warning`, Hard `danger`) paint the arc and the check icon. The chip names use the `*Text` tokens, which are checked as text on `track`. The rating line and its last dot use the LeetCode orange (`stroke-leetcode`, `fill-leetcode`).

**Faint status track (a recorded exception).** The solved card's empty arc uses the segment's own status color at `stroke-opacity` 0.25 (`solvedCard.trackOpacity`) instead of `track`, as on LeetCode. Everywhere else, empty gauges and bars use `track`.

## Contest card anatomy

Drawn by `card()` at 850 × 244 (spec 0010: the Top % and the rating histogram are gone, and the chart spans the card). The values live in `contestCard`; the rest come from `layout`, `radius`, `typography`, and `motion`.

| Element | Geometry | Style |
|---|---|---|
| Stats columns | x and slot: Rating 24 / 120 (`ratingX`, `ratingSlot`), Level 208 / 150 (`levelX`, `levelSlot`), Global ranking 384 / 230 (`rankX`, `rankSlot`), Attended 640 / 120 (`attendedX`, `attendedSlot`) | |
| Level art | The level badge's stored image as an `<image href="data:…">` at (168, 30), 32 × 32 (`levelIconX`, `levelIconY`, `levelIcon`). When refresh has no image for it: `iconSvg(theme, "shield", 168, 30, 32, "fill-accent")` | |
| Labels | `Rating`, `Level`, `Global ranking`, `Attended`, center y = 32 (`labelY`), `text-anchor="start"` | `lead`, `fill-muted` |
| Values | Center y = 62 (`valueY`), each through `fitText` in its slot, min 14, all in `stat` (sans, so they match the labels) | Rating `fill-text`. Level `fill-accent`. Global ranking `fill-text`, the rank then a `fill-muted` `<tspan>` with `/` and the participants, one `fitText` over the whole string. Attended `fill-text` |
| Chart box | x 32 to 818 (`chartLeft`, `chartRight`), y 104 to 196 (`chartTop`, `chartBottom`) | |
| Chart x, y | Contests are spaced evenly by order, never by date: `x = 32 + i / (n − 1) × 786` (one point: x = 818), so a year with no contests takes no room. `y = 196 − (r − rMin) / span × 92`, where `span = rMax − rMin`, or 100 (`flatSpan`) with `rMin` lowered by 50 when all ratings are equal. Both are `toFixed(1)` | |
| Line | `path` `M x y L x y …` through every point; omitted with one point | `fill="none"`, `gauge stroke-leetcode`, `stroke-width` 2 (`lineWidth`), round joins and caps, `pathLength="1"`, `stroke-dasharray="1"`, `--gauge-empty:1` |
| Last point | `circle` r = 4 (`dotRadius`) at the last point | `fill-leetcode` |
| Last point label | Rect `textWidth(label, 14) + 2 × 8` wide (`tipPadX`), 24 tall (`tipHeight`), right edge at `dotX − 4 − 8` (`tipGap`), centered on `dotY`, `rx` of `radius.small`. Text: the last history rating, rounded and grouped, centered in the rect. It covers the end of the line on purpose | Rect `fill-surface stroke-border`, `stroke-width` of `layout.border`; text `lead` `fill-text` |
| Year labels | The UTC year under the first contest of each year, center y = 220 (`yearY`): the first at its x with `text-anchor="start"`, the rest centered on theirs. A year closer than 48 (`yearMinGap`) to the previous label is left out. One point: only its year, `end` anchored | `lead`, `fill-muted` |
| Year lines | A dashed `line` (`stroke-dasharray="4 4"`) from `chartTop` to `chartBottom` at every year label after the first | `stroke-border`, `stroke-width` of `layout.border` |

With a `null` badge, the level art and the Level column are left out, and the other columns keep their x positions.

## Solved card anatomy

The left card of the summary row: a frame like `card()`'s at (0, 0), 417 × 196. The values live in `solvedCard`. Arc coordinates are `toFixed(2)`.

| Element | Geometry | Style |
|---|---|---|
| Ring | Center (140, 107) (`cx`, `cy`), r = 80 (`radius`). θ in degrees clockwise from 12 o'clock: `x = cx + r·sin θ`, `y = cy − r·cos θ`. The arc spans 270° (`span`), from −135° to +135° | |
| Segments | Easy, Medium, Hard, with 6° (`segmentGap`) between them. Segment i spans `(270 − 2 × 6) × total_i / Σ total` | |
| Track | The full segment, `stroke-width` 6 (`stroke`), round caps | `fill="none"`, `stroke-<status>` at `stroke-opacity` 0.25 (`trackOpacity`) |
| Solved arc | From the segment start, `span_i × solved_i / total_i`; left out when solved is 0 | Same at full opacity, plus `gauge`, `pathLength="1"`, `stroke-dasharray="1"`, `--gauge-empty:1` |
| Solved number | One `<text>` at x = 140, baseline y = 112 (`numberBaseline`), `text-anchor="middle"`, `dominant-baseline="alphabetic"`: total solved, then a `<tspan>` with `/` and total questions | Number `title` `fill-text` via `fitText` in 96 (`numberSlot`, min 20); tspan `body` `fill-muted` |
| Solved row | `iconSvg(theme, "check", 108, 122, 14, "fill-success")` (`checkX`, `checkY`, `checkSize`), then `Solved` at x = 126 (`solvedX`), center y = 129 (`solvedY`) | `body`, `fill-text` |
| Attempting | `<n> Attempting` at x = 140, center y = 162 (`attemptingY`), in the arc's gap | `label`, `fill-muted`, `fitText` in 96 (`attemptingSlot`, min 12) |
| Chips | Drawn like LeetCode's: x = 281 (`chipX`), 112 × 44 (`chipWidth`, `chipHeight`), 8 apart (`chipGap`), the three centered on the card's height. `rx` of `radius.small`, no border | `fill-track` |
| Chip name | `Easy`, `Med.`, `Hard`, centered, center y = chip top + 14 (`chipLabelY`) | `label`, `fill-successText`, `fill-warningText`, `fill-dangerText` |
| Chip value | `<solved>/<total>`, plain digits, centered, center y = chip top + 31 (`chipValueY`), slot 96 (`chipValueSlot`) | `strong` via `fitText` (min 12), `fill-text` |

Text uses `dominant-baseline="central"`, except the solved number line.

## Badges card anatomy

The right card of the summary row, drawn like LeetCode's: a frame at x = 433, 417 × 196, with its body in a nested `<svg>` so its x values start at 0. The values live in `badgesCard`. Text uses `dominant-baseline="central"` and `text-anchor="start"`. Static: no animation class.

| Element | Geometry | Style |
|---|---|---|
| Heading | `Badges` at x = 24, center y = 30 (`headingY`) | `body`, `fill-muted` |
| Count | All badges, grouped (`62`), at x = 24, center y = 58 (`countY`) | `title`, `fill-text` |
| Badge art | The featured badges that have stored art, as `<image href="data:…">`. With three, the chosen badge sits in the middle at 76 px (`artLarge`) and the others at 60 px (`artSmall`), 20 apart (`artGap`), the row centered on x = 236 (`artCenterX`, pulled left if it would pass `pad`) and y = 88 (`artCenterY`) | |
| Most recent art | The most recent badge's stored art, 40 × 40 (`recentArt`) at x = 24, centered between the label and the name | |
| Most recent label | `Most Recent Badge` at x = 24 + 40 + 12 (`recentArtGap`), or 24 with no art, center y = 150 (`recentY`) | `label`, `fill-muted` |
| Badge name | The most recent badge's name at the label's x, center y = 170 (`nameY`), `fitText` in the rest of the card width, min 12 (`nameMin`), then squeezed with `textLength` | `name`, `fill-text` |

There is no LeetCode logo on the card. With no badges, the count reads `0` and `No badges yet` (`body`, `fill-muted`) sits at `recentY`, with no name. A badge whose art refresh couldn't store is left out.

## Heatmap card anatomy

Drawn by `card()` at 850 × 196 (`heatmap.height`), laid out like LeetCode's own (spec 0010). The values live in `heatmap`. All text is 12px or larger, with `dominant-baseline="central"`. Static: no animation class. Days are UTC (`Date.UTC`, `getUTCDay`), and the grid ends on the snapshot's `asOf`, so the build never reads the clock.

| Element | Geometry | Style |
|---|---|---|
| Window | The 365 days (`windowDays`) from `asOf − 364` to `asOf`. A day's count is its `calendar[]` entry, else 0 | |
| Summary, left | `<n> submissions in the past one year` (`1 submission …` for one) at x = 24, center y = 34 (`headY`), `text-anchor="start"`: the count in a `<tspan>` | Text `body` `fill-muted`; count `title` `fill-text` |
| Summary, right | `Total active days: <n>` then, `headGap` 24 later (`dx`), `Max streak: <n>`, one `<text>` ending at x = 826 (`text-anchor="end"`) | Text `body` `fill-muted`; numbers weight 500 (`strong`) `fill-text` |
| Stat values | From the `calendar[]` entries inside the window: the sum of counts, the number of entries, and the longest run of back to back dates. They can differ from LeetCode's page by a day, since its window is one day wider | |
| Blocks | One block per month the window touches (12 or 13), oldest on the left. A day's column is `floor((weekday(first day) + day offset) / 7)`, its row its weekday (Sunday 0). A block has `floor((weekday(first day) + days − 1) / 7) + 1` columns | |
| Cells | Step 11 (`cell` 9 + `cellGap` 2). Block b starts at `x0 + (columns before it) × 11 + b × 6` (`monthGap`). Cell at (block x + column × 11, 68 + row × 11) (`gridTop`), 9 × 9, `rx` 2 (`cellRadius`). Cells end at y = 143 | Level 0 `fill-track`. Levels 1 to 4 `fill-heat` with `fill-opacity` 0.3, 0.55, 0.8, 1 (`opacity1` to `opacity4`), always written |
| Grid x | Width `w = columns × 11 − 2 + (blocks − 1) × 6`, `x0 = 24 + floor((802 − w) / 2)`, so the grid is centered. The widest window (65 columns, 13 blocks) is 785 | |
| Levels | The highest k with `count ≥ level<k>Min`: 1, 2, 3, 5 (`level1Min` to `level4Min`). Count 0 is level 0 | |
| Month badges | When the month has its Daily Coding Challenge badge (`monthlyBadges`) and its art is stored, that art, 28 × 28 (`monthArt`), centered on the block and on y = 166 (`monthY`), in place of the month name, as on LeetCode: proof that every daily problem of that month was solved | |
| Month labels | Otherwise, the short month name at the block's center x, center y = 166 (`monthY`), `text-anchor="middle"`, only on blocks with at least 3 columns (`monthMinColumns`). Both end blocks can be the same month (two different years) | `lead`, `fill-muted` |

**Levels shown by color (a recorded exception).** The heatmap shows a day's level by its green opacity alone, as LeetCode does, with no legend (LeetCode shows none). The summary line and the alt text carry the numbers, so no information lives only in color. Everywhere else, color is never the only cue.

## Experience and education (built by feature 9)

Decided in [spec 0007](specs/0007-experience-education-timeline/index.md), reshaped by [spec 0010](specs/0010-profile-redesign.md). Right after About me, separated by blank lines, the README has:

- the `experience` section heading
- a `<p>` block holding the experience image
- the `education` section heading
- a `<p>` block holding the education image

No block has blank lines inside. Each image is a `themedImage` `<picture>` wrapped in `<a href>` to `profileUrls(accounts).linkedin`. The images are drawn on the page itself, with no card (spec 0010), so their text is checked against `page`.

| Card | Files | Width |
|---|---|---|
| Experience | `timeline-experience-light.svg`, `timeline-experience-dark.svg` | `width="100%"` (`layout.full`, 850 wide; 272 tall with three roles) |
| Education | `timeline-education-light.svg`, `timeline-education-dark.svg` | `width="100%"` (`layout.full`, 850 wide; 152 tall with two schools) |

Both lists sort newest `start` first. On a tie, a current entry (`end: null`) comes first, then the later `end`, then file order. Dates use a fixed English month table, never the locale or the clock: `May 2025`, `May 2025 – Present`, `Jan 2025 – May 2025` (space, en dash, space), or one month alone when `start` equals `end`. No duration is shown, so the output never changes with the date.

**Logos.** A role or school may name a `logo`: a PNG or JPEG file name in `assets/static/logos/` (lowercase letters, digits, and `-`, checked by `checkContent`). `pnpm build` reads only the files content names, as `data:image/png;base64,…` (or `image/jpeg`) URIs, and hands them to sections as `ctx.logos`, so sections never touch the file system. A named file that is missing fails the build. Logos are embedded in the SVG, so the card stays self contained. Keep a logo square, about 128 to 256px, and small (it is copied into both theme files).

| Entry | File | Source |
|---|---|---|
| Noventiq Vietnam | `noventiq.png` | Noventiq's own icon, supplied by the owner |
| CMC Telecom | `cmc-telecom.png` | The cloud mark of `CMC_logo_2018.png`, Wikimedia Commons, cropped and resized |
| FPT Software | `fpt-software.png` | `FPT_logo_2010.svg`, Wikimedia Commons, padded square and resized |
| VNU University of Engineering and Technology (`stars: 4` on its note) | `uet.png` | The emblem cut from the header logo on uet.vnu.edu.vn (`Logo1.png`) |
| Hong Quang High School | `hong-quang.png` | The school website's logo, resized to 144px |

Alt text carries every word the card shows, with ` to ` in place of the en dash:

- Experience: `Experience: ` then each role as `<title> at <company>[, <location>], <dates>. <highlight> <highlight>`.
- Education: `Education: ` then each school as `<degree>[, <field>] at <school>, <dates>.[ <note>[ (<n> stars)].]`.

Each highlight and note gets a final `.` unless it already ends in `.`, `!`, or `?`. Logos are not in the alt text: the company or school name already is. `companyUrl` is not shown: a link inside an `<img>` can't be clicked. The content check allows 1 to 6 roles and 1 to 4 schools.

## Timeline anatomy

Drawn by `svgDocument` at 850 wide, on the page with no card (spec 0010). All text is 12px or larger. The values live in `timelineCard`; the rest come from `layout` and `typography`. The images are static.

| Element | Geometry | Style |
|---|---|---|
| Logo tile | A `rect` at (1.5, entryTop + 0.5), 47 × 47 (`padX` 1, `logo` 48), `rx` 8 (`logoRadius`) | With a logo: `fill-logoTile stroke-border`. With none: `fill-track stroke-border` |
| Logo | `<image href="data:…">` at (5, entryTop + 4), 40 × 40 (`logoInset` 4), `preserveAspectRatio="xMidYMid meet"` | |
| Initial | With no logo: the first letter of the company or school, uppercased, centered in the tile, 20px weight 700 | `fill-muted` |
| Text column | x = 65 (`textX`) to x = 849 (`layout.full − padX`), 784 wide | |
| Row 0, left | Title or school name at x = 65, `text-anchor="start"`, `fitText` in a 568 slot (784 − `dateSlot` 200 − `titleGap` 16), min 12. Never wraps | `heading`, `fill-accent` |
| Row 0, right | Dates at x = 849, `text-anchor="end"`, `fitText` in 200 (`dateSlot`), min 12 | `lead`, `fill-muted` |
| Role row 1 | Company, then `<tspan class="fill-muted"> · <location></tspan>` when set, at x = 65, one `fitText` over the whole string in 784, min 12 | `lead`, `fill-text` |
| Role highlights | Per highlight: `•` at x = 65 on its first row, lines from `wrapLines` at x = 81 (`textX + bulletIndent` 16) in a 768 slot, min 12 | `•` `lead` `fill-muted`; text `lead` `fill-text` |
| School degree | `<degree>[, <field>]` lines from `wrapLines` at x = 65 in 784, min 12 | `lead`, `fill-text` |
| Honors pill | The note, one line, after `stars` ★ (14 px each, `starGap` 6). A pill at x = 65, 22 tall (`honorHeight`), fully rounded, `honorPadX` 10 inside, as wide as the stars plus the note at `0.56 × 14` per character (`honorCharWidth`); the note is pinned to that width with `textLength`, so the pill hugs it on every font | Pill `fill-honor stroke-honor`, `fill-opacity` 0.12; stars and note `strong` `fill-honor` |
| Rows | Row k center y = `entryTop + 12 + k × 24` (`lineHeight` 24), `dominant-baseline="central"` | |
| Entries | An entry's box is `max(rows × 24, 48)`, so the logo tile always fits. The first `entryTop` is 4 (`padY`). Each next one is the previous top + box + 24 (`entryGap`) | |
| Height | `8 + (all boxes) + 24 × (entries − 1)` | |

"Present" in the dates marks the current entry. Text `text`, `muted`, and `accent` on `page` are in the contrast table.

## Certifications (built by feature 10)

Decided in [spec 0008](specs/0008-credly-badge-grid.md), made a table by [spec 0010](specs/0010-profile-redesign.md). After the LinkedIn button block of *Experience and education*, separated by blank lines, the README has:

- the `certifications` section heading
- one `<table>`, one row per issuer: the issuer's name in `<b>` in a `<td width="25%">` on the left, so long names wrap, and its badges in a `<td width="75%">` on the right, one badge per line. The percent widths (`tableColumns.certifications`) make the table as wide as the README

No block has blank lines inside. Each badge comes from `outsideImage()` and is exactly one line:

```html
<a href="https://www.credly.com/badges/<id>"><picture><source media="(prefers-color-scheme: dark)" srcset="<imageUrl>"><img alt="<name>, issued by <issuer>" src="<imageUrl>" width="96"></picture></a>
```

- The image is Credly's own PNG (`imageUrl`, always on `images.credly.com/images/`), shown at 96px wide (`credlyGrid.badgeWidth`). Both sources point at the same file, there is no light `<source>`, and there is no `height`, so the PNG keeps its own shape. The PNGs are transparent, so they sit on either theme's page background.
- Alt text is `<name>, issued by <issuer>`. Pass it raw: `outsideImage` escapes `src` and `alt` once, and the section escapes the `href` and the issuer name once.
- The issuer name is Credly's `issuer` as given (for example `Amazon Web Services Training and Certification`).
- The section writes only its heading icon, and nothing in it moves.

Rows and badges follow one order:

1. Issuers with more badges first. Ties go by issuer name.
2. Within an issuer, by level: `Advanced`, `Intermediate`, `Foundational`, then any other level or none.
3. Then the newest `issuedOn` first, then name, then `id`.

Strings compare with JavaScript's `<`, never by locale. The build never reads the clock: refresh drops expired, hidden, and unaccepted badges before the snapshot is written.


## Icon registry

Every icon comes from one of two registries, and `IconName` covers both, so asking for a missing icon is a type error. Draw any icon with `iconSvg(theme, name, x, y, size, classes)`, `size` tall and `iconWidth(name, size)` wide.

**Glyphs** (`src/icons.ts`): one `path` on a 24 × 24 grid, hand drawn as one filled path, with holes cut by drawing them in the opposite direction, so no `fill-rule` is needed. No color, `fill`, `stroke`, or `transform`; `classes` paints it.

| Glyph | Drawing |
|---|---|
| `award` | a medal ring with its center cut out, over two ribbon tails |
| `briefcase` | a briefcase with its handle on top and a band across the middle cut out |
| `check` | a check mark as one filled stroke |
| `code` | angle brackets around a slash, as in `</>` |
| `graduationcap` | a mortarboard, its cap, and a tassel |
| `person` | a head and shoulders |
| `shield` | a shield outline, the inner shield cut out (the level fallback) |

**Brand logos** (`src/brands.ts`, spec 0010): each brand's whole full color SVG, embedded as a `data:image/svg+xml;base64,` image, so `classes` is not used. Files are cleaned when copied in (no XML declaration, comments, titles, or `id` attributes that nothing references), and `checkBrands` checks on every build that each is self contained (no script, event attribute, doctype, `@import`, or link other than `#<id>`). The SVG guard lets an SVG embed a `data:image/svg+xml` image only when it decodes to exactly one of these files. Width comes from the light file's `viewBox`.

| Brand | Light | Dark |
|---|---|---|
| `aws` | thesvg.org `amazon-web-services/light` | `amazon-web-services/dark` |
| `bash` | thesvg.org `bash/light` | `bash/dark` |
| `cplusplus` | thesvg.org `cplusplus` | same |
| `credly` | thesvg.org `credly` | same |
| `docker` | thesvg.org `docker` | same |
| `git` | thesvg.org `git` | same |
| `gmail` | thesvg.org `gmail` | same |
| `go` | thesvg.org `go/light`, in Go Blue `#00ADD8` from the Go brand book | same |
| `kubernetes` | thesvg.org `kubernetes` | same |
| `leetcode` | Wikimedia Commons `File:LeetCode_logo_white_no_text.svg` with its white stroke in black | the same file as is |
| `linkedin` | thesvg.org `linkedin` | same |
| `linux` | thesvg.org `linux` | same |
| `nextdotjs` | thesvg.org `nextdotjs` | its `mono` file in white |
| `react` | thesvg.org `react/light` | `react/dark` |
| `terraform` | thesvg.org `terraform` | same |
| `typescript` | thesvg.org `typescript` | same |

Brandfetch needs an API key for its logo CDN, so no file comes from it.

## Outside images

Spec 0010. LeetCode badge art is embedded in the SVGs, so it must be on disk at build time. A source may list the images its sections embed as `ImageRequest`s (`{ url, size }`, `src/images.ts`; `Source.images(snapshot)`). `pnpm refresh`, after the sources, runs `syncImages` (`src/sources/images.ts`): for each request it downloads the PNG (https only, at most 8 MB), shrinks it with `src/png.ts` to fit a `size` square (alpha weighted box averaging, centered on transparency), and writes `data/snapshots/images/<first 16 hex of SHA-256 of "<size> <url>">.png`. Files no request names are removed. A failed image is a warning, never a failed refresh. `pnpm build` reads the stored files for the same requests into `ctx.images`, keyed by `imageKey` (`"<size> <url>"`), as `data:image/png;base64,` URIs, and never fetches. A missing image is simply absent: the badges card and the heatmap leave it out, and the level falls back to the shield.

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
| Typing line | 5 | Types "Hi there 👋", deletes it, types "Welcome to my GitHub", then rests (`motion.typing`). Phrases come from `typingPhrases`. At most three phrases, with holds shortened so the whole run ends within `motion.budget`. | The last phrase, no cursor |
| Stat cards (LeetCode, GitHub) | 8, 12 | Content enters once, staggered. Gauges and bars fill once. Numbers fade in; they don't count up. LeetCode: the contest stats enter as `enter(0)` to `enter(3)` and the years and year lines as `enter(5)`; the history line draws once (`gauge`) from 0 ms; the last point and its label enter last (`enter(9)`, done at 1500 ms). On the solved card (in the summary row), the center number, the Solved row, Attempting, and the three chips enter as `enter(0)` to `enter(5)`, and the solved arcs fill once (`gauge`). | Full numbers, filled gauges, drawn line, full bars |
| Contribution graph | 13 | Decided in feature 13's spec. Ends within `motion.budget`, or that spec records a reasoned exception. | Decided there |
| Everything else (section headings, about, buttons, tech stack chips, timeline, Credly table, projects, LeetCode badges card and heatmap) | 6, 7, 9, 10, 11, 14 | None | Itself |

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

The light file is the `<img>` fallback. `inline: true` writes the same markup on one line with no spaces between tags, for table cells and headings.

**How GitHub picks the file.** GitHub wraps each `<picture>` in its own `<themed-picture>` element. When the visitor's GitHub theme mode is a single theme (Settings, Appearance), its script turns the dark `<source>` on for a dark theme and off for a light one, so the image follows the GitHub theme even when the OS differs. In "Sync with system" mode it changes nothing and the browser follows the OS, even if the visitor picked a dark day theme. No README markup can read that choice, so a visitor who wants the dark images on a light OS sets GitHub to a single dark theme. Never make a single SVG that switches theme with its own `prefers-color-scheme` query: that follows the OS setting, which can differ from the GitHub theme.

Third party images that look the same in both themes (for example, Credly badge PNGs) still use `<picture>`, and may point both sources at the same outside file. Draw them with `outsideImage()` (see *Certifications*).

## Accessibility

- Every image is an `<img>` with real alt text, inside `<picture>` with a light and a dark version. Markdown image syntax fails the build. The one exception is a section heading icon: it is decorative, so its `alt` is empty, and the guard allows that only inside an `<h2>` with its own text.
- Every text pair in the contrast table meets WCAG AA in both themes, and the build checks it.
- Color is never the only way to show information. Status shapes (`success`, `warning`, `danger`) only fill or stroke shapes, and each one has a text label nearby in `fill-text` or `fill-muted`. The one recorded exception is the LeetCode heatmap's levels (see *Heatmap card anatomy*).
- All motion ends within 5 seconds and respects reduce motion (see *Motion*).
- Content text passes through `escapeXml` exactly once on its way into an SVG or an HTML attribute. `themedImage` escapes alt text, so pass it raw. The content check also rejects characters XML doesn't allow.

## What the build checks

Before anything is written, `pnpm build` fails if:

- any contrast pair is below its minimum, or a token isn't lowercase `#rrggbb`;
- a generated SVG contains a script, an outside link, an event attribute, `@import`, a doctype or entity, or an endless animation (it may link only to `#<id>`, or embed a `data:image/png` or `data:image/jpeg` base64 image);
- an `<img>` has no alt text, or a blank one outside a section heading;
- content names a logo that isn't in `assets/static/logos/`;
- an SVG uses a `fill-`, `stroke-`, or `stop-` class that `themeCss` doesn't define;
- a vendored brand logo in `src/brands.ts` isn't self contained, or an SVG embeds a `data:image/svg+xml` image that isn't exactly one of them;
- a generated SVG's name doesn't end in `-light.svg` or `-dark.svg`, or it has no twin;
- an SVG's first `<style>` doesn't start with its own theme's color classes, or it writes a color anywhere else;
- the README names an `assets/generated/` file (in `src` or `srcset`) that no section writes.

Review covers what the build can't measure: sizes and timings come from `src/theme.ts`, and motion ends within `motion.budget`.
