# Design: GitHub profile README

The look every section shares, decided in [spec 0003](specs/0003-visual-theme-animation-style.md).

**Where the values live.** `src/theme.ts` holds every color, font, size, spacing step, and timing the build uses. This file repeats them for people to read. When you change a value, change it in both places in the same commit. The build checks only `src/theme.ts`.

**How sections draw.** A section draws through the helpers in `src/svg.ts` (`themedImage`, `card`, `svgDocument`, `enter`, `fitText`, `pillButton`, `iconSvg`) and names colors only by class (`fill-accent`, `stroke-border`, `stop-accent2`). A section never writes a hex value, a color name, a font name, a size, or a timing itself.

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

Use `class="fill-accent"`, `class="stroke-border"`, or `<stop class="stop-accent2" offset="1"/>`. For transparency, use `opacity` or `fill-opacity`. The only color values allowed anywhere else in an SVG are `none`, `currentColor`, `transparent`, `inherit`, and `url(#<id>)`.

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

Label `text` on `surface` and icon `accent` on `surface` are already in the contrast table, so buttons need no new pair. Feature 9's LinkedIn button reuses `pillButton`.

## Icon registry

Every icon on the profile comes from `src/icons.ts`. Each entry is one `path` on a 24 × 24 grid plus a `source`:

- `simple-icons@<version>` for a path copied from Simple Icons (CC0). Every copied entry shares one pinned release. Refreshing icons means copying every copied entry from the new release in the same commit.
- `hand drawn` for a glyph Simple Icons lacks, drawn as one filled path. Holes are cut by drawing them in the opposite direction, so no `fill-rule` is needed.

Entries hold path data only: no color, `fill`, `stroke`, or `transform`. One class paints the whole icon, and icons use `fill-accent`, never brand colors. Keys are Simple Icons slugs, or a plain name for a glyph Simple Icons doesn't cover. `IconName` is the set of keys, so asking for a missing icon is a type error. Draw an icon with `iconSvg(name, x, y, size, classes)`, which nests a `<svg viewBox="0 0 24 24">`.

| Icon | Source |
|---|---|
| `credly` | `simple-icons@16.38.0` |
| `email` | hand drawn: an envelope with its flap cut out as a V |
| `leetcode` | `simple-icons@16.38.0` |
| `linkedin` | hand drawn (Simple Icons 16.38.0 has no LinkedIn): a lowercase "in" cut out of a rounded square |

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

### Inventory (the only places motion is allowed)

| Element | Feature | Motion | Still frame (reduce motion on, or after it ends) |
|---|---|---|---|
| Header banner | 5 | Name and title enter once. The back wave drifts and settles (`motion.wave`). | Name, title, and both waves in place |
| Typing line | 5 | Types "Cloud Developer", deletes it, types "LeetCode Guardian", then rests (`motion.typing`). Phrases come from `typingPhrases`. At most three phrases, with holds shortened so the whole run ends within `motion.budget`. | The last phrase, no cursor |
| Stat cards (LeetCode, GitHub) | 8, 12 | Content enters once, staggered. Gauges and bars fill once. Numbers fade in; they don't count up. | Full numbers, filled gauges |
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

Third party images that look the same in both themes (for example, Credly badge PNGs) still use `<picture>`, and may point both sources at the same outside file.

## Accessibility

- Every image is an `<img>` with real alt text, inside `<picture>` with a light and a dark version. Markdown image syntax fails the build.
- Every text pair in the contrast table meets WCAG AA in both themes, and the build checks it.
- Color is never the only way to show information. Status shapes (`success`, `warning`, `danger`) only fill or stroke shapes, and each one has a text label nearby in `fill-text` or `fill-muted`.
- All motion ends within 5 seconds and respects reduce motion (see *Motion*).
- Content text passes through `escapeXml` exactly once on its way into an SVG or an HTML attribute. `themedImage` escapes alt text, so pass it raw. The content check also rejects characters XML doesn't allow.

## What the build checks

Before anything is written, `pnpm build` fails if:

- any contrast pair is below its minimum, or a token isn't lowercase `#rrggbb`;
- a generated SVG contains a script, an outside link, an event attribute, `@import`, a doctype or entity, or an endless animation (it may link only to `#<id>`);
- a generated SVG's name doesn't end in `-light.svg` or `-dark.svg`, or it has no twin;
- an SVG's first `<style>` doesn't start with its own theme's color classes, or it writes a color anywhere else.

Review covers what the build can't measure: sizes and timings come from `src/theme.ts`, and motion ends within `motion.budget`.
