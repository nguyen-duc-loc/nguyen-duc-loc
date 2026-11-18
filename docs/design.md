# Design: GitHub profile README

The look every section shares, decided in [spec 0003](specs/0003-visual-theme-animation-style.md) and redesigned by [spec 0010](specs/0010-profile-redesign.md) (an assumed decision, not yet ratified).

**Where the values live.** `src/theme.ts` holds every color, font, size, spacing step, and timing the build uses. This file repeats them for people to read. When you change a value, change it in both places in the same commit. The build checks only `src/theme.ts`.

**How sections draw.** A section draws through the helpers in `src/svg.ts` (`themedImage`, `card`, `svgDocument`, `enter`, `fitText`, `textWidth`, `wrapLines`, `pillButton`, `sectionHeading`, `iconSvg`, `iconClass`) and names colors only by class (`fill-accent`, `stroke-border`, `stop-accent2`, `fill-brand-leetcode`). A section never writes a hex value, a color name, a font name, a size, or a timing itself.

## Character

Looks like part of GitHub. Cards use GitHub's own Primer colors and type sizes, so they sit on the page like GitHub's own UI in both themes. Logos keep their real colors: brand icons in the brand's color, company and school logos as they are. Motion is bold but short: things arrive once, then hold still, so the page reads well.

## Palette

Both themes use GitHub's Primer colors, with the same token names. `success`, `warning`, and `danger` are LeetCode's own difficulty colors.

| Token | Role | Light | Dark |
|---|---|---|---|
| `page` | GitHub's default page background. Used only to check things drawn without a card (the typing line, brand icons). Never drawn, and has no color class. | `#ffffff` | `#0d1117` |
| `surface` | Card background (Primer canvas subtle) | `#f6f8fa` | `#151b23` |
| `border` | Card border and dividers (decorative) | `#d1d9e0` | `#3d444d` |
| `track` | Empty part of a gauge or bar, a logo tile with no logo (decorative) | `#e6eaef` | `#262c36` |
| `text` | Main text | `#1f2328` | `#f0f6fc` |
| `muted` | Secondary text and labels | `#59636e` | `#9198a1` |
| `accent` | Timeline names, the typing line, generic heading icons, gradient start (Primer blue) | `#0969da` | `#4493f8` |
| `accent2` | Gradient end, the LeetCode level (Primer purple) | `#8250df` | `#ab7df8` |
| `onAccent` | Text on the banner gradient | `#ffffff` | `#0d1117` |
| `success` | Status shape, always labeled (Easy), and the heatmap cells | `#00af9b` | `#1cbaba` |
| `warning` | Status shape, always labeled (Medium) | `#ffb800` | `#ffb700` |
| `danger` | Status shape, always labeled (Hard) | `#ff2d55` | `#f63737` |
| `logoTile` | The white tile behind a company or school logo, in both themes, since logos are made for white | `#ffffff` | `#ffffff` |

### Brand colors

`brandColors` in `src/theme.ts` holds each brand icon's own color: the `hex` of the pinned Simple Icons release (`simple-icons@16.38.0`), and LinkedIn's brand blue `#0a66c2` for the hand drawn LinkedIn. `brandColor(theme, brand)` returns it, unless it is under `brandMinContrast` (1.5:1) against the theme's `page` or `surface`, where it would vanish; then it returns the theme's `text`. Today that swaps Linux to `text` in light mode and Next.js to `text` in dark mode. Brand icons always sit next to their name, so they are decorative and have no contrast pair.

| Brand | Color | Brand | Color |
|---|---|---|---|
| `cplusplus` | `#00599c` | `leetcode` | `#ffa116` |
| `credly` | `#ff6b00` | `linkedin` | `#0a66c2` |
| `docker` | `#2496ed` | `linux` | `#fcc624` |
| `git` | `#f03c2e` | `nextdotjs` | `#000000` |
| `gnubash` | `#4eaa25` | `react` | `#61dafb` |
| `go` | `#00add8` | `terraform` | `#844fba` |
| `kubernetes` | `#326ce5` | `typescript` | `#3178c6` |

### Contrast

`pnpm build` checks these pairs in both themes and fails if any pair falls below its minimum (WCAG AA). It also fails if a token isn't a lowercase `#rrggbb` value.

| Foreground | Background | Minimum | Light | Dark |
|---|---|---|---|---|
| `text` | `surface` | 4.5 | 14.83 | 15.90 |
| `muted` | `surface` | 4.5 | 5.74 | 5.94 |
| `accent` | `surface` | 4.5 | 4.87 | 5.58 |
| `accent` | `page` | 4.5 | 5.19 | 6.10 |
| `accent2` | `surface` | 4.5 | 4.73 | 5.78 |
| `onAccent` | `accent` | 4.5 | 5.19 | 6.10 |
| `onAccent` | `accent2` | 4.5 | 5.04 | 6.32 |

`border`, `track`, `success`, `warning`, `danger`, and `logoTile` aren't checked on purpose. They are decorative or always labeled.

### Color classes

Every SVG's only `<style>` starts with the color class block from `themeCss(theme)`. For each token except `page`, in the table order, it defines:

```css
.fill-<token>{fill:<hex>}.stroke-<token>{stroke:<hex>}.stop-<token>{stop-color:<hex>}
```

Then, for each brand in key order, `.fill-brand-<brand>{fill:<hex>}.stroke-brand-<brand>{stroke:<hex>}` with the color from `brandColor(theme, brand)`.

Use `class="fill-accent"`, `class="stroke-border"`, or `<stop class="stop-accent2" offset="1"/>`. Draw an icon through `iconClass(icon, fallback)`, which gives `fill-brand-<icon>` for a brand and the fallback token class otherwise. For transparency, use `opacity`, `fill-opacity`, or `stroke-opacity`. The only color values allowed anywhere else in an SVG are `none`, `currentColor`, `transparent`, `inherit`, and `url(#<id>)`.

**Adding a color.** A feature that needs a new color adds it as a token in both themes, or a brand in `brandColors`, in `src/theme.ts`, with a contrast pair if it carries text. It never writes the color by hand.

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
| `tagline` | 22 | 600 | sans | Banner title |
| `title` | 24 | 700 | sans | Big card numbers (rating, solved, badge count, submissions) |
| `heading` | 16 | 600 | sans | Card headings, timeline names, badge name |
| `lead` | 14 | 400 | sans | Labels and body text on full width cards |
| `body` | 14 | 400 | sans | Body text on half cards |
| `label` | 12 | 400 | sans | Small labels on half cards |
| `number` | 20 | 600 | mono | Key numbers |
| `typing` | 22 | 400 | mono | The typing line |
| `button` | 14 | 600 | sans | Contact button labels |
| `chip` | 13 | 600 | sans | Tech stack chip names |

Write `font-size` and `font-weight` from these styles (through `fitText` for the size).

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

Header banner, typing line, About me, Experience, Education, Certifications, Tech stack, LeetCode (spec 0010). The body of each section is left aligned like its heading, except About me, which keeps its centered bio, location, and buttons.

## Header banner and typing line (built by feature 5)

**Banner.** A `layout.full` SVG about 220 tall. It has a linear gradient from `stop-accent` (blue) to `stop-accent2` (purple) at about 135 degrees. The name is in `display` and the title in `tagline`, both `fill-onAccent` and centered. The bottom edge is two layered waves filled with the same gradient: the front wave opaque, the back wave at 50% `fill-opacity`. The back wave drifts per `motion.wave`. Everything below the wave is transparent, so the banner blends into every GitHub theme with no seam. Wave paths are computed from constants.

**Typing line.** A transparent `layout.full` SVG, centered under the banner, in `typing` and `fill-accent` (checked against `page`). It types the greeting from `typingPhrases` and rests on the last phrase, `Hi there, I'm Loc 👋`. Each typing state is a whole prefix frame (for example `Hi th` plus the cursor `▌`), and only one frame shows at a time. Its alt text is the phrases joined by spaces. Each frame's visibility is an `opacity` keyframe. The base style shows only the final frame, so turning animation off leaves the last phrase. Nothing places the cursor by measured width.

## About me (built by feature 6)

Decided in [spec 0004](specs/0004-about-contact-links.md). Right after the typing line, the README has, in order and separated by blank lines:

- the `about` section heading (see *Section headings*)
- `<p align="center">` with `profile.bio`
- `<p align="center">` with `📍 ` plus `profile.location`
- one `<p align="center">` block holding the contact buttons: LinkedIn, Credly, LeetCode, Email, in that order. There is no GitHub button, since the visitor is already on GitHub.

The bio and location are real Markdown text, so GitHub colors them for every theme and people can select and translate them. Bio and location pass through `escapeXml` once. GitHub drops `style` and keeps `align`, so the text is centered with `align`.

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
- The icon and the label are centered together (spec 0010). The label is sized by `fitText` in an 84px slot with a 12px minimum, in the `button` style; its width is the `textWidth` estimate (or `textLength` when squeezed). The group is 16 + 8 + label width wide and starts at `margin + round((140 − group) / 2)`.
- The icon is `iconSvg(icon, groupX, 16, 16, iconClass(icon, "fill-accent"))`: LinkedIn, Credly, and LeetCode in their brand colors, Email in `accent`.
- The label is in `fill-text` at `groupX + 24`, y = 24, with `dominant-baseline="central"` and `text-anchor="start"`.
- Buttons have no animation.

The timeline's LinkedIn button and the Certifications Credly button reuse the `contact-*` files About me writes. They return only the markup, so no file is written twice.

## Tech stack (built by feature 7)

Decided in [spec 0005](specs/0005-tech-stack-cards.md), made a table by [spec 0010](specs/0010-profile-redesign.md). After the Certifications see all button, the README has the `stack` section heading, a blank line, then one `<table>` with no blank lines inside. Each row is one category, in this order: Languages, Frameworks, Tools, Cloud. The left cell is the label in `<b>`. The right cell holds one chip per item in file order, one inline `<picture>` per line, so the chips wrap like words on a narrow screen.

Each chip is a `themedImage` with `inline: true`, files `stack-<key>-light.svg` and `stack-<key>-dark.svg`, where `<key>` is the item's icon key, or its name in lowercase with every run of other characters as `-` (AWS is `stack-aws`). Its alt text is the item name. No chip is a link, and nothing moves. Every stack `icon` must be a key of the icon registry: a wrong slug fails `pnpm typecheck` and the build. A category holds 1 to 8 items.

## Stack chip anatomy

Drawn by `svgDocument` (no card), `stackChip.height + 2 × margin` (36) tall. All values are in px.

- Name width is `min(160, textWidth(name, 13))`. The file is `2 × margin + 2 × padX + (icon + iconGap, when the item has an icon) + name width` wide, rendered at that `width`.
- The chip is a `rect` at (2.5, 2.5), `width − 5` × 31, `rx` of `radius.small`, classes `fill-surface stroke-border`, `stroke-width` of `layout.border`.
- With an icon: `iconSvg(icon, 12, 9, 18, iconClass(icon, "fill-text"))`, then the name at x = 38. Without one (AWS today): the name at x = 12.
- The name is in the `chip` style, `fill-text`, center y = 18, sized by `fitText` in its width with a 12px minimum.

## LeetCode (built by features 8 and 11)

Decided in [spec 0006](specs/0006-leetcode-stats-card.md), grown by [spec 0009](specs/0009-leetcode-badges-heatmap.md), and reshaped by [spec 0010](specs/0010-profile-redesign.md). Right after the Tech stack table, the README has the `leetcode` section heading, then these `<p>` blocks, separated by blank lines:

1. The contest card.
2. The solved card, then the badges card on the next line, so they sit side by side on desktop and stack on a phone.
3. The badge row (left out when no badge qualifies).
4. The heatmap card.

No block has blank lines inside. Each card is a `themedImage` `<picture>` wrapped in `<a href>` to `profileUrls(accounts).leetcode`, so a click opens the LeetCode profile.

| Card | Files | Width |
|---|---|---|
| Contest | `leetcode-contest-light.svg`, `leetcode-contest-dark.svg` | `width="100%"` (`layout.full`, 850 × 244) |
| Solved | `leetcode-solved-light.svg`, `leetcode-solved-dark.svg` | `width="400"` (`layout.half`, 400 × 196) |
| Badges | `leetcode-badges-light.svg`, `leetcode-badges-dark.svg` | `width="400"` (`layout.half`, 400 × 196, the solved card's height) |
| Heatmap | `leetcode-heatmap-light.svg`, `leetcode-heatmap-dark.svg` | `width="100%"` (`layout.full`, 850 × 232) |

**Badge row.** Up to 8 badges (`badgeRow.max`): the badge chosen on LeetCode (`activeBadgeId`) first, even a monthly one, then badges whose `category` isn't `DCC` (the monthly Daily Coding Challenge), newest `earnedOn` first, ties to the larger numeric `id`, never repeating the chosen badge. Each badge is one line, like the Credly grid:

```html
<a href="https://leetcode.com/u/nguyenducloc"><picture><source media="(prefers-color-scheme: dark)" srcset="<icon>"><img alt="<name>, LeetCode badge earned <Mon YYYY>" src="<icon>" width="80"></picture></a>
```

The image is LeetCode's transparent PNG (never the GIF), on `assets.leetcode.com/` or `leetcode.com/static/`, at 80px wide (`badgeRow.width`). `outsideImage` escapes `src` and `alt` once, and the section escapes the `href` once.

The data comes only from `data/snapshots/leetcode.json`, read through `parseLeetcodeSnapshot`. Numbers follow fixed rules, never the locale: the contest card and all alt text group integers with commas (`6,064`), the solved card prints plain digits like LeetCode (`2245/4114`), ratings are rounded with `Math.round`, and years are UTC.

Alt text states the same numbers a sighted visitor sees:

- Contest: `LeetCode contest rating 2,247, level Guardian, global ranking 6,064 of 892,590, 31 contests attended. Rating history: 1,565 in 2022 to 2,247 in 2024.` With no badge it drops `, level <badge>`. One contest reads `1 contest attended`. One history point reads `Rating history: 2,247 in 2024.`, and two points in the same year read `Rating history: 1,565 to 2,247 in 2024.`
- Solved: `LeetCode problems solved: 2,245 of 4,114. Easy 661 of 976, Medium 1,170 of 2,148, Hard 414 of 990. 3 attempting.`
- Badges: `LeetCode badges: 62 earned. Most recent: Oct LeetCoding Challenge, Oct 2026.` One badge reads `1 earned`. No badges reads `LeetCode badges: none earned yet.`
- Each row badge: `<name>, LeetCode badge earned <Mon YYYY>`, for example `Guardian, LeetCode badge earned May 2026`.
- Heatmap: `LeetCode submissions from Nov 18, 2025 to Nov 17, 2026: 640 submissions on 362 active days, max streak 292 days.` Singulars read `1 submission`, `1 active day`, and `max streak 1 day`. No submissions in the window reads `LeetCode submissions from <start> to <end>: no submissions.`

Dates use the fixed English month table in `src/dates.ts` (`MONTHS`, shared with the timeline) and are computed in UTC from `YYYY-MM-DD` strings: `<Mon YYYY>` for badges, `<Mon> <D>, <YYYY>` with no zero padding for the heatmap range.

Difficulty colors (Easy `success`, Medium `warning`, Hard `danger`) only paint shapes: the arc, the chip dots, and the check icon. Every word and number is `fill-text` or `fill-muted`, because LeetCode's yellow is too faint to read as text. The rating line and its last dot use the LeetCode brand orange (`stroke-brand-leetcode`, `fill-brand-leetcode`).

**Faint status track (a recorded exception).** The solved card's empty arc uses the segment's own status color at `stroke-opacity` 0.25 (`solvedCard.trackOpacity`) instead of `track`, as on LeetCode. Everywhere else, empty gauges and bars use `track`.

## Contest card anatomy

Drawn by `card()` at 850 × 244 (spec 0010: the Top % and the rating histogram are gone, and the chart spans the card). The values live in `contestCard`; the rest come from `layout`, `radius`, `typography`, and `motion`.

| Element | Geometry | Style |
|---|---|---|
| Stats columns | x and slot: Rating 24 / 120 (`ratingX`, `ratingSlot`), Level 208 / 150 (`levelX`, `levelSlot`), Global ranking 384 / 230 (`rankX`, `rankSlot`), Attended 640 / 120 (`attendedX`, `attendedSlot`) | |
| Shield | `iconSvg("shield", 168, 30, 32, "fill-accent2")` (`levelIconX`, `levelIconY`, `levelIcon`) | |
| Labels | `Rating`, `Level`, `Global ranking`, `Attended`, center y = 32 (`labelY`), `text-anchor="start"` | `lead`, `fill-muted` |
| Values | Center y = 62 (`valueY`), each through `fitText` in its slot, min 14 | Rating `title` `fill-text`. Level `number` `fill-accent2`. Global ranking `number` `fill-text`, the rank then a `fill-muted` `<tspan>` with `/` and the participants, one `fitText` over the whole string. Attended `number` `fill-text` |
| Chart box | x 32 to 818 (`chartLeft`, `chartRight`), y 104 to 196 (`chartTop`, `chartBottom`) | |
| Chart x, y | Contests are spaced evenly by order, never by date: `x = 32 + i / (n − 1) × 786` (one point: x = 818), so a year with no contests takes no room. `y = 196 − (r − rMin) / span × 92`, where `span = rMax − rMin`, or 100 (`flatSpan`) with `rMin` lowered by 50 when all ratings are equal. Both are `toFixed(1)` | |
| Line | `path` `M x y L x y …` through every point; omitted with one point | `fill="none"`, `gauge stroke-brand-leetcode`, `stroke-width` 2 (`lineWidth`), round joins and caps, `pathLength="1"`, `stroke-dasharray="1"`, `--gauge-empty:1` |
| Last point | `circle` r = 4 (`dotRadius`) at the last point | `fill-brand-leetcode` |
| Last point label | Rect `textWidth(label, 14) + 2 × 8` wide (`tipPadX`), 24 tall (`tipHeight`), right edge at `dotX − 4 − 8` (`tipGap`), centered on `dotY`, `rx` of `radius.small`. Text: the last history rating, rounded and grouped, centered in the rect. It covers the end of the line on purpose | Rect `fill-surface stroke-border`, `stroke-width` of `layout.border`; text `lead` `fill-text` |
| Year labels | The UTC year under the first contest of each year, center y = 220 (`yearY`): the first at its x with `text-anchor="start"`, the rest centered on theirs. A year closer than 48 (`yearMinGap`) to the previous label is left out. One point: only its year, `end` anchored | `lead`, `fill-muted` |
| Year lines | A dashed `line` (`stroke-dasharray="4 4"`) from `chartTop` to `chartBottom` at every year label after the first | `stroke-border`, `stroke-width` of `layout.border` |

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
| Heading | `Badges`, center y = 32 (`headingY`) | `heading`, `fill-accent` |
| Icon | `iconSvg("leetcode", 356, 22, 20, "fill-accent")`: x = `layout.half − pad − icon`, y = `iconY`, size `icon` | |
| Count | All badges, grouped (`62`), center y = 66 (`countY`) | `title`, `fill-text` |
| Most recent label | `Most recent`, center y = 104 (`recentY`) | `body`, `fill-muted` |
| Badge name | The badge with the newest `earnedOn` (ties: larger numeric `id`), center y = 128 (`nameY`), `fitText` in 352 (`nameSlot`), min 12 (`nameMin`), then squeezed with `textLength` | `heading`, `fill-text` |
| Month | `<Mon YYYY>` of its `earnedOn`, center y = 152 (`monthY`) | `body`, `fill-muted` |

With no badges, the count reads `0` and `No badges yet` (`body`, `fill-muted`) sits at `recentY`, with no name or month.

## Heatmap card anatomy

Drawn by `card()` at 850 × 232 (`heatmap.height`). The values live in `heatmap`. All text is 12px or larger, with `dominant-baseline="central"`. Static: no animation class. Days are UTC (`Date.UTC`, `getUTCDay`), and the grid ends on the snapshot's `asOf`, so the build never reads the clock.

| Element | Geometry | Style |
|---|---|---|
| Window | The 365 days (`windowDays`) from `asOf − 364` to `asOf`. A day's count is its `calendar[]` entry, else 0 | |
| Stats | Labels at center y = 32 (`labelY`), values at center y = 62 (`valueY`), `text-anchor="start"`. Submissions (past year) at x 24, slot 300 (`submissionsX`, `submissionsSlot`). Active days at x 348, slot 220 (`activeX`, `activeSlot`). Max streak at x 592, slot 234 (`streakX`, `streakSlot`). Each label and value (`groupDigits(n)`, no unit) goes through `fitText` in its slot, min 12 | Labels `lead` `fill-muted`. Submissions value `title` `fill-text`. Active days and Max streak values `number` `fill-text` |
| Stat values | From the `calendar[]` entries inside the window: the sum of counts, the number of entries, and the longest run of back to back dates. They can differ from LeetCode's page by a day, since its window is one day wider | |
| Blocks | One block per month the window touches (12 or 13), oldest on the left. A day's column is `floor((weekday(first day) + day offset) / 7)`, its row its weekday (Sunday 0). A block has `floor((weekday(first day) + days − 1) / 7) + 1` columns | |
| Cells | Step 11 (`cell` 9 + `cellGap` 2). Block b starts at `x0 + (columns before it) × 11 + b × 6` (`monthGap`). Cell at (block x + column × 11, 92 + row × 11) (`gridTop`), 9 × 9, `rx` 2 (`cellRadius`). Cells end at y = 167 | Level 0 `fill-track`. Levels 1 to 4 `fill-success` with `fill-opacity` 0.25, 0.5, 0.75, 1 (`opacity1` to `opacity4`), always written |
| Grid x | Width `w = columns × 11 − 2 + (blocks − 1) × 6`, `x0 = 24 + floor((802 − w) / 2)`, so the grid is centered. The widest window (65 columns, 13 blocks) is 785 | |
| Levels | The highest k with `count ≥ level<k>Min`: 1, 2, 3, 5 (`level1Min` to `level4Min`). Count 0 is level 0 | |
| Month labels | The short month name at the block's center x, center y = 182 (`monthY`), `text-anchor="middle"`, only on blocks with at least 3 columns (`monthMinColumns`). Both end blocks can be the same month (two different years), and both get a label | `lead`, `fill-muted` |
| Legend | Center y = 208 (`legendY`). `More` ends at x = 826 (`text-anchor="end"`). Five cells, levels 0 to 4, ending `legendGap` 8 plus `textWidth("More", 14)` left of 826, at y = 203.5. `Less` ends `legendGap` left of the first cell | Text `lead` `fill-muted`; cells as in *Cells* |

**Levels shown by color (a recorded exception).** The heatmap shows a day's level by its `success` opacity alone, as LeetCode does. The `Less` to `More` legend explains the ramp, and the three stats and the alt text carry the numbers, so no information lives only in color. Everywhere else, color is never the only cue.

## Experience and education (built by feature 9)

Decided in [spec 0007](specs/0007-experience-education-timeline/index.md), reshaped by [spec 0010](specs/0010-profile-redesign.md). Right after About me, separated by blank lines, the README has:

- the `experience` section heading
- a `<p>` block holding the experience card
- the `education` section heading
- a `<p>` block holding the education card
- a `<p>` block holding the LinkedIn button

No block has blank lines inside. Each card is a `themedImage` `<picture>` wrapped in `<a href>` to `profileUrls(accounts).linkedin`. The button is `<a href>` to the same URL around a `<picture>` of the existing `contact-linkedin-light.svg` and `contact-linkedin-dark.svg`, at `width="148"`, alt text `Full work history on LinkedIn`. `checkReadmeAssets` fails the build if those files ever stop being written.

| Card | Files | Width |
|---|---|---|
| Experience | `timeline-experience-light.svg`, `timeline-experience-dark.svg` | `width="100%"` (`layout.full`, 850 wide; 312 tall with three roles) |
| Education | `timeline-education-light.svg`, `timeline-education-dark.svg` | `width="100%"` (`layout.full`, 850 wide; 192 tall with two schools) |

Both lists sort newest `start` first. On a tie, a current entry (`end: null`) comes first, then the later `end`, then file order. Dates use a fixed English month table, never the locale or the clock: `May 2025`, `May 2025 – Present`, `Jan 2025 – May 2025` (space, en dash, space), or one month alone when `start` equals `end`. No duration is shown, so the output never changes with the date.

**Logos.** A role or school may name a `logo`: a PNG or JPEG file name in `assets/static/logos/` (lowercase letters, digits, and `-`, checked by `checkContent`). `pnpm build` reads only the files content names, as `data:image/png;base64,…` (or `image/jpeg`) URIs, and hands them to sections as `ctx.logos`, so sections never touch the file system. A named file that is missing fails the build. Logos are embedded in the SVG, so the card stays self contained. Keep a logo square, about 128 to 256px, and small (it is copied into both theme files).

| Entry | File | Source |
|---|---|---|
| Noventiq Vietnam | `noventiq.png` | Noventiq's own icon, supplied by the owner |
| CMC Telecom | `cmc-telecom.png` | The cloud mark of `CMC_logo_2018.png`, Wikimedia Commons, cropped and resized |
| FPT Software | `fpt-software.png` | `FPT_logo_2010.svg`, Wikimedia Commons, padded square and resized |
| VNU University of Engineering and Technology | `uet.png` | The school website's site icon |
| Hong Quang High School | `hong-quang.png` | The school website's logo, resized to 144px |

Alt text carries every word the card shows, with ` to ` in place of the en dash:

- Experience: `Experience: ` then each role as `<title> at <company>[, <location>], <dates>. <highlight> <highlight>`.
- Education: `Education: ` then each school as `<degree>[, <field>] at <school>, <dates>.[ <note>]`.

Each highlight and note gets a final `.` unless it already ends in `.`, `!`, or `?`. Logos are not in the alt text: the company or school name already is. `companyUrl` is not shown: a link inside an `<img>` can't be clicked. The content check allows 1 to 6 roles and 1 to 4 schools.

## Timeline card anatomy

Drawn by `card()` at 850 wide. All text is 12px or larger. The values live in `timelineCard`; the rest come from `layout` and `typography`. The cards are static.

| Element | Geometry | Style |
|---|---|---|
| Logo tile | A `rect` at (24.5, entryTop + 0.5), 47 × 47 (`logo` 48), `rx` 8 (`logoRadius`) | With a logo: `fill-logoTile stroke-border`. With none: `fill-track stroke-border` |
| Logo | `<image href="data:…">` at (28, entryTop + 4), 40 × 40 (`logoInset` 4), `preserveAspectRatio="xMidYMid meet"` | |
| Initial | With no logo: the first letter of the company or school, uppercased, centered in the tile, 20px weight 700 | `fill-muted` |
| Text column | x = 88 (`textX`) to x = 826 (`layout.full − layout.pad`), 738 wide | |
| Row 0, left | Title or school name at x = 88, `text-anchor="start"`, `fitText` in a 522 slot (738 − `dateSlot` 200 − `titleGap` 16), min 12. Never wraps | `heading`, `fill-accent` |
| Row 0, right | Dates at x = 826, `text-anchor="end"`, `fitText` in 200 (`dateSlot`), min 12 | `lead`, `fill-muted` |
| Role row 1 | Company, then `<tspan class="fill-muted"> · <location></tspan>` when set, at x = 88, one `fitText` over the whole string in 738, min 12 | `lead`, `fill-text` |
| Role highlights | Per highlight: `•` at x = 88 on its first row, lines from `wrapLines` at x = 104 (`textX + bulletIndent` 16) in a 722 slot, min 12 | `•` `lead` `fill-muted`; text `lead` `fill-text` |
| School degree | `<degree>[, <field>]` lines from `wrapLines` at x = 88 in 738, min 12 | `lead`, `fill-text` |
| School note | Note lines from `wrapLines` at x = 88 in 738, min 12 | `lead`, `fill-accent` |
| Rows | Row k center y = `entryTop + 12 + k × 24` (`lineHeight` 24), `dominant-baseline="central"` | |
| Entries | An entry's box is `max(rows × 24, 48)`, so the logo tile always fits. The first `entryTop` is 24 (`layout.pad`). Each next one is the previous top + box + 24 (`entryGap`) | |
| Height | `48 + (all boxes) + 24 × (entries − 1)` | |

"Present" in the dates marks the current entry. Text `text`, `muted`, and `accent` on `surface` are already in the contrast table, so the cards need no new pair.

## Certifications (built by feature 10)

Decided in [spec 0008](specs/0008-credly-badge-grid.md), made a table by [spec 0010](specs/0010-profile-redesign.md). After the LinkedIn button block of *Experience and education*, separated by blank lines, the README has:

- the `certifications` section heading
- one `<table>`, one row per issuer: the issuer's name in `<b>` on the left, its badges on the right, one badge per line
- a `<p>` block holding the see all button

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

The see all button is `<a href>` to `profileUrls(accounts).credly` around a `<picture>` of the existing `contact-credly-light.svg` and `contact-credly-dark.svg`, at `width="148"`, alt text `All badges on Credly`. `checkReadmeAssets` fails the build if those files ever stop being written.

## Icon registry

Every icon on the profile comes from `src/icons.ts`. Each entry is one `path` on a 24 × 24 grid plus a `source`:

- `simple-icons@<version>` for a path copied from Simple Icons (CC0). Every copied entry shares one pinned release. Refreshing icons means copying every copied entry from the new release in the same commit.
- `hand drawn` for a glyph Simple Icons lacks, drawn as one filled path. Holes are cut by drawing them in the opposite direction, so no `fill-rule` is needed.

Entries hold path data only: no color, `fill`, `stroke`, or `transform`. One class paints the whole icon: `iconClass(icon, fallback)` picks the brand's own color class for a brand in `brandColors` (see *Brand colors*), and the fallback token class (usually `fill-accent`) for any other icon. Keys are Simple Icons slugs, or a plain name for a glyph Simple Icons doesn't cover. `IconName` is the set of keys, so asking for a missing icon is a type error. Draw an icon with `iconSvg(name, x, y, size, classes)`, which nests a `<svg viewBox="0 0 24 24">`.

| Icon | Source |
|---|---|
| `award` | hand drawn: a medal ring with its center cut out, over two ribbon tails |
| `briefcase` | hand drawn: a briefcase with its handle on top and a band across the middle cut out |
| `check` | hand drawn: a check mark as one filled stroke |
| `code` | hand drawn: angle brackets around a slash, as in `</>` |
| `cplusplus` | `simple-icons@16.38.0` |
| `credly` | `simple-icons@16.38.0` |
| `docker` | `simple-icons@16.38.0` |
| `email` | hand drawn: an envelope with its flap cut out as a V |
| `git` | `simple-icons@16.38.0` |
| `gnubash` | `simple-icons@16.38.0` |
| `go` | `simple-icons@16.38.0` |
| `graduationcap` | hand drawn: a mortarboard, its cap, and a tassel |
| `kubernetes` | `simple-icons@16.38.0` |
| `leetcode` | `simple-icons@16.38.0` |
| `linkedin` | hand drawn (Simple Icons 16.38.0 has no LinkedIn): a lowercase "in" cut out of a rounded square |
| `linux` | `simple-icons@16.38.0` |
| `nextdotjs` | `simple-icons@16.38.0` |
| `person` | hand drawn: a head and shoulders |
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
| Typing line | 5 | Types "Welcome to my GitHub profile", deletes it, types "Hi there, I'm Loc 👋", then rests (`motion.typing`). Phrases come from `typingPhrases`. At most three phrases, with holds shortened so the whole run ends within `motion.budget`. | The last phrase, no cursor |
| Stat cards (LeetCode, GitHub) | 8, 12 | Content enters once, staggered. Gauges and bars fill once. Numbers fade in; they don't count up. LeetCode: the contest stats enter as `enter(0)` to `enter(3)` and the years and year lines as `enter(5)`; the history line draws once (`gauge`) from 0 ms; the last point and its label enter last (`enter(9)`, done at 1500 ms). On the solved card, the center number, the Solved row, Attempting, and the three chips enter as `enter(0)` to `enter(5)`, and the solved arcs fill once (`gauge`). | Full numbers, filled gauges, drawn line, full bars |
| Contribution graph | 13 | Decided in feature 13's spec. Ends within `motion.budget`, or that spec records a reasoned exception. | Decided there |
| Everything else (section headings, about, buttons, tech stack chips, timeline, Credly table, projects, LeetCode badges and heatmap) | 6, 7, 9, 10, 11, 14 | None | Itself |

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
- a generated SVG's name doesn't end in `-light.svg` or `-dark.svg`, or it has no twin;
- an SVG's first `<style>` doesn't start with its own theme's color classes, or it writes a color anywhere else;
- the README names an `assets/generated/` file (in `src` or `srcset`) that no section writes.

Review covers what the build can't measure: sizes and timings come from `src/theme.ts`, and motion ends within `motion.budget`.
