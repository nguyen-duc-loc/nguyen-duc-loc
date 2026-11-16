# 0003. Catppuccin theme tokens, shared SVG helpers, and focused motion rules

**Date**: 2026-11-16
**Status**: Accepted

## Summary

Every section of your profile shares one look: the Catppuccin palette (Latte in light mode, Mocha in dark mode), with Mauve as the main accent and Blue as the second, GitHub's own system fonts, and cards with their own solid background. All colors, sizes, and motion timings live in one typed file, `src/theme.ts`. Sections draw through small shared helpers that pick colors by class name, so a section never writes a color itself. The build fails if a color pair drops below WCAG AA contrast (the minimum readability level), if an SVG loads anything from outside, if a light image has no dark twin, or if a color skips the theme. Motion is bold but short. Every animation, including the banner wave and the typing line, finishes within 5 seconds and then holds still, and visitors who ask their OS to reduce motion see the final frame right away. A themed "under construction" card replaces today's plain placeholder, so you can see the theme live on GitHub before feature 5 lands.

## Context

The scope plans ten sections (features 5 to 14), and each draws SVG cards in its own file under `src/sections/`. Without a shared theme, each section picks its own colors, font sizes, and timings. The profile then looks stitched together, and one bad color choice can make a card unreadable in one theme. Recruiters and developers see this page first, so a mismatch is visible to exactly the audience it's for.

GitHub sets hard limits on what works:

- An SVG shown through `<img>` runs no scripts and loads no outside fonts or images (spec 0001). GitHub's raw file security policy also blocks `data:` fonts and images inside it. CSS animations and `@media` queries inside the SVG do work.
- The only reliable way to follow a visitor's GitHub theme is `<picture>` with a `prefers-color-scheme: dark` source, which picks between exactly two files. A single SVG that uses its own `prefers-color-scheme` follows the visitor's OS setting, which can differ from their GitHub theme.
- GitHub has more themes than light and dark (dark dimmed, high contrast, colorblind variants), and each one gets either the light file or the dark file.
- System fonts differ between macOS, Windows, Linux, and phones, so text width inside an SVG can't be known at build time.
- A full width image shrinks to about 42% of its size on a phone, which shrinks its text too.

Loc has no existing design. The scope asks for animation that is "bold but focused": an animated header, a typing intro, animated stat cards, and one signature animation (the contribution graph), with everything else static so the page loads fast and reads well. Every image needs real alt text and WCAG AA contrast in both themes (`AGENTS.md`). WCAG 2.2.2 (Pause, Stop, Hide, Level A) also says motion that starts on its own and runs longer than 5 seconds needs a pause control, and GitHub gives an image no way to offer one.

The rules have to hold across ten future sections written over several releases, often by an AI agent working from this spec. A rule that lives only in prose gets broken quietly. A rule the build checks fails loudly, the same way the alt text guard does today.

## Requirements

**User stories**:
- As a visitor in light or dark mode, I want every card to be easy to read and to look like part of one design, so that the profile feels polished.
- As a visitor who turns on "reduce motion" in my OS, or who finds motion distracting, I want the page to stop moving quickly, so that I can read in peace.
- As Loc, I want one file of colors, fonts, spacing, and timings that every section uses, so that changing the accent once changes it everywhere.
- As a section author (Loc or an agent), I want the build to stop me when a color fails contrast, an SVG reaches outside, a light file has no dark twin, or I write a color by hand, so that a mistake never reaches the public page.

**Acceptance criteria**:
- **AC-1**: `docs/design.md` exists and covers the palette for both themes (each token's name, role, hex value, and contrast ratio), typography, spacing and layout, card anatomy, text fitting, the header banner style, the typing line style, the motion inventory and rules (including the still frame for each animation), the `<picture>` markup, and the accessibility rules. It states that `src/theme.ts` holds the values the build uses.
- **AC-2**: `src/theme.ts` exports `themes.light` and `themes.dark` with exactly the token values in *Feature design*, plus `fonts`, `typography`, `space`, `radius`, `layout`, `motion`, and `contrastPairs`, all `as const satisfies` the types in *Feature design*. Removing a token from either theme fails `pnpm typecheck`.
- **AC-3**: `pnpm build` checks every pair in `contrastPairs` for both themes, comparing the unrounded ratio. If any pair is below its minimum, the build writes nothing and lists each failing pair as `contrast: <theme> <fg> on <bg> is <ratio>:1, needs <min>:1`, with the ratio floored to 2 decimals. Changing `themes.light.muted` to `#6c6f85` makes the build fail with `contrast: light muted on surface is 4.37:1, needs 4.5:1`. A token that isn't a lowercase 6 digit hex (`#rrggbb`) is also listed.
- **AC-4**: The README starts with the sample card as a `<picture>` with a `prefers-color-scheme: dark` source pointing at `assets/generated/placeholder-card-dark.svg` and an `<img>` fallback pointing at `assets/generated/placeholder-card-light.svg`, with `width="100%"` and the alt text `Loc Nguyen, Cloud Developer, Hanoi, Vietnam. Profile under construction.` built from content. On GitHub, Light and Light high contrast show the Latte card, and Dark, Dark dimmed, and Dark high contrast show the Mocha card, all readable.
- **AC-5**: In the browsers `/check verify` confirms (Chrome, Firefox, and Safari on desktop), the sample card's four lines fade and slide in once, staggered, and each line stays hidden until its turn. All motion finishes within 1.5 seconds, and then the card holds still. With "reduce motion" on in the OS, the card shows its final frame immediately.
- **AC-6**: `pnpm build` fails and writes nothing if any generated SVG contains (case insensitive) `<script`, `<foreignObject`, `<iframe`, `<object`, `<embed`, `<!DOCTYPE`, `<!ENTITY`, `<?xml-stylesheet`, `@import`, `javascript:`, an `on…=` event attribute, or the word `infinite` inside a `<style>` element or a `style` attribute (text content may say "infinite"). It also fails if an `href`, `xlink:href`, or `src` attribute, or a `url(...)` (after trimming spaces and quotes), points anywhere other than `#<id>`. `xmlns` attributes are not checked.
- **AC-7**: `pnpm build` fails and writes nothing if a generated SVG's name doesn't end in `-light.svg` or `-dark.svg`, if a light file has no dark twin or a dark file has no light twin, if its first `<style>` doesn't start with the exact color classes for its theme, or if any color value anywhere else in the file isn't `none`, `currentColor`, `transparent`, `inherit`, or `url(#<id>)`. A hand written `fill="#cba6f7"`, `fill="white"`, `rgb(…)`, or a Mocha class block in a `-light.svg` each fail.
- **AC-8**: Content text passes through `escapeXml` exactly once on its way into an SVG or an HTML attribute. With a profile name of `Loc & <Co> "Q"`, the card and the alt text show it literally, the README contains `&amp;` and never `&amp;amp;`, and the SVG opens in a browser without an XML error.
- **AC-9**: Running `pnpm build` twice produces byte identical `README.md` and SVGs. `pnpm typecheck`, `pnpm lint`, and `pnpm lint:md` pass. MD041 is turned off in `.markdownlint-cli2.jsonc` with a comment saying why.
- **AC-10**: The content check rejects any text field containing a character XML 1.0 doesn't allow (U+0000 to U+0008, U+000B, U+000C, U+000E to U+001F, U+FFFE, U+FFFF, or a lone surrogate), so no content can make an SVG invalid.
- **AC-11**: A name, title, or location of 80 characters still fits inside the sample card without overflowing its edge, using the text fitting rule in *Feature design*.

## Options considered

The look was chosen with Loc during design (Catppuccin Latte and Mocha, Mauve with Blue, the wave banner, solid cards, system fonts). The options below are about how strongly the standard is enforced.

### Option 1: Typed tokens, color classes, shared helpers, and build guards

`src/theme.ts` holds every value. `src/svg.ts` writes each theme's colors as CSS classes into every SVG and draws the card frame and the light and dark pair. `src/guards.ts` checks contrast, self containment, twins, and that no color is written by hand. `docs/design.md` explains the rules for people.

**Pros**:
- Mistakes fail the build before anything is written, the same way the alt text guard works today.
- Sections name colors by role (`fill-accent`), so a stray hex or a dark color in a light file can't happen without the build noticing.
- One accent change in `src/theme.ts` updates every card.

**Cons**:
- About 200 lines of helper and guard code before the first real section ships.
- A new color (for example, a contribution graph ramp) must be added as a token first, which is a small extra step.

### Option 2: Typed tokens and helpers, with rules enforced by review only

The same `src/theme.ts` and helpers, with no guards. `docs/design.md` lists the contrast ratios, and you or the reviewer check them by hand.

**Pros**:
- Less code, and a quick color experiment never trips the build.

**Cons**:
- Contrast, a missing dark twin, or an outside font link is caught only if someone looks. On a solo project, often nobody does.
- Breaks the project's pattern of enforcing rules with guards.

### Option 3: `design.md` only

Write the design system as a document and let each section copy the values it needs.

**Pros**:
- No code at all until feature 5.

**Cons**:
- Hex values get copied into ten files and drift apart.
- No sample card to verify on GitHub, so the theme stays unproven until feature 5.

## Decision

**Chosen option**: Option 1: Typed tokens, color classes, shared helpers, and build guards.

Every section draws with the Catppuccin tokens in `src/theme.ts` through the helpers in `src/svg.ts`, naming colors only by class. The build refuses output that breaks contrast, self containment, theme twins, or the color rule. Every animation ends within 5 seconds, and a themed sample card proves the look live on GitHub.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`)

## Rationale

The forces here are ten sections built over several releases, often by an agent, all needing to meet AA contrast in two themes on a page recruiters see. Only build time checks hold up against that. The project already treats rules this way (the alt text guard and the content check stop the build), so contrast and theme guards fit how the repo already works, not a new process. Option 2 saves code but leaves the most likely mistakes (a pale accent used for text, a missing dark file) to human memory. Option 3 copies values into every file. Color classes beat checking hex values in the output: a scan for `#rrggbb` mistakes gradient ids and text for colors and misses `#fff`, `rgb()`, and `white`. With classes, the rule becomes "no color value outside the generated block", which is simple to check exactly.

Catppuccin was chosen over GitHub's own Primer colors, Tokyo Night, Dracula, and a neon style because it is one of the few popular palettes with an official light and dark pair from the same family. The two themes therefore feel like one design instead of a dark theme with an improvised light version. Primer would be the safest and most native, but it is the least distinctive. Mauve is the accent because it passes AA for normal text in both themes (4.79:1 on Latte, 8.07:1 on Mocha). Latte Blue (4.34:1) and Latte Pink don't, which is why Blue is kept for large text, the gradient, and shapes. Several Latte colors fail even the 3:1 graphics minimum (Green 2.96, Yellow 2.31, Peach 2.64), so status colors are allowed only on shapes that always sit next to a text label.

Cards get their own solid background because `<picture>` sends GitHub's dimmed and high contrast themes the same file as plain light or dark. A card that brings its own surface keeps the same text contrast on every GitHub theme. A transparent card would depend on page colors we don't control. System fonts cost zero bytes and always render. The tradeoff is that letter widths vary by OS, which leads to two rules: no layout or animation depends on measured text width, and long text is fitted by character count. Motion uses CSS keyframes, not SMIL (SVG's older built in animation tags), because only CSS animation can be turned off with a `prefers-reduced-motion` query.

Loc first chose endless loops for the banner wave and the typing line. The cross check found that endless motion fails WCAG 2.2.2 (Level A, below the AA target), because an image on GitHub can't offer a pause control. Loc then chose motion that finishes within 5 seconds. The typing line still types and deletes, then rests on the last phrase, and the wave drifts and then settles. This keeps the effect while the page meets WCAG A. The cost is that the header goes still after a few seconds.

## Feature design

### Types (`src/theme.ts`)

```ts
export type ThemeName = "light" | "dark";
export type Hex = `#${string}`; // lowercase #rrggbb, checked by checkContrast
export type TokenName =
  | "page" | "surface" | "border" | "track" | "text" | "muted"
  | "accent" | "accent2" | "onAccent" | "success" | "warning" | "danger";
export type Theme = { readonly name: ThemeName } & { readonly [K in TokenName]: Hex };
export type ContrastPair = { readonly fg: TokenName; readonly bg: TokenName; readonly min: 3 | 4.5 };
export type TypeStyle = { readonly size: number; readonly weight: 400 | 600 | 700; readonly family: "sans" | "mono" };
export type TextSlot = { readonly width: number; readonly style: TypeStyle; readonly minSize: number };
```

### Theme tokens

Both themes have the same token names. `page` isn't drawn and gets no color class. It is GitHub's default page background, used only to check things drawn without a card (the typing line).

| Token | Role | Light (Latte) | Dark (Mocha) |
|---|---|---|---|
| `page` | GitHub default page background (checks only, never drawn) | `#ffffff` | `#0d1117` |
| `surface` | Card background | `#eff1f5` (base) | `#1e1e2e` (base) |
| `border` | Card border, dividers (decorative) | `#ccd0da` (surface0) | `#313244` (surface0) |
| `track` | Empty part of a gauge or bar (decorative) | `#dce0e8` (crust) | `#45475a` (surface1) |
| `text` | Main text | `#4c4f69` (text) | `#cdd6f4` (text) |
| `muted` | Secondary text, labels | `#5c5f77` (subtext1) | `#a6adc8` (subtext0) |
| `accent` | Card headings, key numbers, typing line, gradient start | `#8839ef` (mauve) | `#cba6f7` (mauve) |
| `accent2` | Gradient end; text only at `display`, `title`, or `number`; graphics | `#1e66f5` (blue) | `#89b4fa` (blue) |
| `onAccent` | Text on the banner gradient | `#ffffff` | `#11111b` (crust) |
| `success` | Status shape, always labeled (for example, Easy) | `#40a02b` (green) | `#a6e3a1` (green) |
| `warning` | Status shape, always labeled (for example, Medium) | `#df8e1d` (yellow) | `#f9e2af` (yellow) |
| `danger` | Status shape, always labeled (for example, Hard) | `#d20f39` (red) | `#f38ba8` (red) |

**Color classes.** `themeCss(theme)` returns, for every token except `page` in the table order above, `.fill-<token>{fill:<hex>}.stroke-<token>{stroke:<hex>}.stop-<token>{stop-color:<hex>}`, with no spaces and no line breaks. `svgDocument` writes it first in the file's only `<style>`. Sections use `class="fill-accent"`, `class="stroke-border"`, or `<stop class="stop-accent2" offset="1"/>`.

**Contrast pairs** (`contrastPairs`, checked for both themes on every build; ratios measured for this spec, and confirmed by the cross check):

| Foreground | Background | Minimum | Light | Dark |
|---|---|---|---|---|
| `text` | `surface` | 4.5 | 7.06 | 11.34 |
| `muted` | `surface` | 4.5 | 5.53 | 7.37 |
| `accent` | `surface` | 4.5 | 4.79 | 8.07 |
| `accent` | `page` | 4.5 | 5.41 | 9.32 |
| `accent2` | `surface` | 3 | 4.34 | 7.79 |
| `onAccent` | `accent` | 4.5 | 5.41 | 9.23 |
| `onAccent` | `accent2` | 4.5 | 4.91 | 8.91 |

`border`, `track`, `success`, `warning`, and `danger` aren't in the list on purpose: they are decorative or always labeled (see *Key invariants*). For reference only, not checked: the typing line's Mocha `accent` is 7.33:1 on Dark dimmed (`#212830`) and 10.11:1 on Dark high contrast (`#010409`). The banner gradient's midpoints stay at or above 5.28:1 (Latte) and 8.96:1 (Mocha). Every card text pair is unchanged on all GitHub themes because cards bring their own surface.

### Typography, spacing, layout, motion constants

| Constant | Value |
|---|---|
| `fonts.sans` | `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"` (GitHub's own stack) |
| `fonts.mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |
| `typography` (size / weight / family) | `display` 48/700/sans (banner name) · `title` 32/700/sans · `heading` 20/600/sans · `lead` 20/400/sans · `body` 14/400/sans · `label` 12/400/sans · `number` 24/600/mono · `typing` 22/400/mono |
| `space` (px) | 4, 8, 12, 16, 24, 32 |
| `radius` (px) | `card` 12 · `small` 6 (bars, chips) |
| `layout` (px) | `full` 850 wide, rendered `width="100%"` · `half` 400 wide, rendered `width="400"`, so two sit side by side on desktop and wrap on narrow screens · `pad` 24 · `border` 1 |
| `motion.enter` | 600 ms, `cubic-bezier(0.2, 0, 0, 1)`, from `opacity: 0` and `translateY(8px)`, `animation-fill-mode: both`, stagger 100 ms, every entrance finished by 1500 ms |
| `motion.fill` | 1000 ms, same easing, `fill-mode: both`. Gauges fill with `stroke-dashoffset`; bars with `scaleX` plus `transform-box: fill-box; transform-origin: left center` |
| `motion.wave` | 4500 ms total: the back wave drifts one full period while easing to a stop (`cubic-bezier(0.2, 0, 0, 1)`), then holds |
| `motion.typing` | 70 ms per typed character, 40 ms per deleted character, 1000 ms hold on each full phrase except the last, 300 ms pause before the next phrase, then rest on the last phrase with no cursor |
| `motion.budget` | 5000 ms: every animation in every SVG ends by then (WCAG 2.2.2) |

**Text sizes on full width images.** A `full` image renders at about 42% on a phone, so it uses only `display`, `title`, `heading`, `lead`, `number`, and `typing` (20px and up). `body` and `label` appear only on `half` cards.

**Large text.** `accent2` may color text only at `display`, `title`, or `number` (WCAG large text: at least 24px, or 18.66px at weight 700).

### Text fitting (no measuring)

`fitText(text, slot)` returns `{ size, textLength? }` from the character count `n = [...text].length` and an assumed average width of `0.6 × size` per character (a deliberately wide estimate):

1. `size = min(slot.style.size, floor(slot.width / (0.6 × n)))`.
2. If `size < slot.minSize`, use `size = slot.minSize` and also return `textLength = slot.width`. The section then writes `textLength` and `lengthAdjust="spacingAndGlyphs"`, which squeezes the text to fit exactly.

This is deterministic and never overflows. It may shrink or squeeze text slightly more than needed on narrow fonts.

### Motion inventory (the only places motion is allowed)

| Element | Feature | Motion | Still frame (reduce motion, or after it ends) |
|---|---|---|---|
| Header banner | 5 | Name and title enter once. The back wave drifts and settles (`motion.wave`). | Name, title, and both waves in place |
| Typing line | 5 | Types "Cloud Developer", deletes it, types "LeetCode Guardian", rests (`motion.typing`). Phrases come from `typingPhrases`. The section uses at most three phrases and shortens the holds so the whole run ends within `motion.budget`. | The last phrase, no cursor |
| Stat cards (LeetCode, GitHub) | 8, 12 | Content enters once, staggered. Gauges and bars fill once. Numbers fade in; they don't count up, because changing text needs script or one frame per digit. | Full numbers, filled gauges |
| Contribution graph | 13 | Decided in feature 13's spec. It must end within `motion.budget`, or that spec records a reasoned exception. | Decided there |
| Sample card (temporary, in the header slot) | 4 | Enters once, like the banner. | All four lines in place |
| Everything else (about, buttons, tech stack, timeline, Credly grid, projects, LeetCode badges and heatmap) | 6, 7, 9, 10, 11, 14 | None | Itself |

### Header banner and typing line style (built by feature 5)

- **Banner**: a `layout.full` SVG about 220 tall. It has a linear gradient from `stop-accent` to `stop-accent2` at about 135 degrees, with the name in `display` and the title in `heading`, both `fill-onAccent` and centered. The bottom edge is two layered waves filled with the same gradient (front opaque, back at 50% `fill-opacity`), and the back wave drifts per `motion.wave`. Everything below the wave is transparent, so the banner blends into every GitHub theme with no seam. Wave paths are computed from constants.
- **Typing line**: a transparent `layout.full` SVG, centered under the banner, in `typing` and `fill-accent` (checked against `page`). Each typing state is a whole prefix frame (for example `Cloud D` plus the cursor `▌`), and only one frame is visible at a time. Each frame's visibility is an `opacity` keyframe. The base style shows only the final frame, so turning animation off leaves the last phrase. Nothing positions the cursor by measured width.

### Card anatomy (every card)

A `rect` at `x="0.5" y="0.5"` with width and height 1 less than the SVG, `rx` of `radius.card`, `fill-surface`, `stroke-border`, and `stroke-width` of `layout.border`, so the border isn't clipped. Content sits inside `layout.pad`, uses `fill-text` for main text, `fill-muted` for labels, and `fill-accent` for the heading or key number. Text is aligned with `text-anchor` (`start` or `middle`), never by computed width, and is sized with `fitText`.

### Sample card layout (`placeholder-card`, 850 × 200, all lines centered at x 425)

| Line | Text | Slot style, min size | Color | Baseline y |
|---|---|---|---|---|
| 1 | `profile.name` | `title`, 20 | `fill-accent` | 72 |
| 2 | `profile.title` | `heading`, 20 | `fill-text` | 108 |
| 3 | `profile.location` | `lead`, 20 | `fill-muted` | 140 |
| 4 | `Profile under construction` | `lead`, 20 | `fill-muted` | 172 |

Every slot is 802 wide (850 minus 2 × `layout.pad`). Line *i* uses `enter(i, <its color class>)` for i = 0 to 3.

### Shared helpers

| Module | Export | Inputs | Output |
|---|---|---|---|
| `src/theme.ts` | `themes`, `fonts`, `typography`, `space`, `radius`, `layout`, `motion`, `contrastPairs` | none | typed constants |
| `src/theme.ts` | `contrastRatio(a, b)` | two `Hex` | WCAG 2 ratio, unrounded (pure) |
| `src/theme.ts` | `themeCss(theme)` | a `Theme` | the color class block |
| `src/escape.ts` | `escapeXml(text)` | plain text | `&`, `<`, `>`, `"`, `'` replaced by `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`; safe in SVG text and HTML attributes |
| `src/svg.ts` | `svgDocument(theme, { width, height, css?, body })` | a `Theme`, size, extra CSS (keyframes only, no colors), inner markup | a complete SVG: `xmlns`, `width`, `height`, `viewBox`, then one `<style>` holding `themeCss(theme)`, the font family rules, the `enter` and `fill` keyframes, `css`, and the reduced motion block, then `body` |
| `src/svg.ts` | `card(theme, { width, height, css?, body })` | as above | `svgDocument` with the card `rect` first |
| `src/svg.ts` | `enter(i, classes?)` | item index, extra class names | the attribute text `class="enter <classes>" style="animation-delay:<i × motion.enter.stagger>ms"` |
| `src/svg.ts` | `fitText(text, slot)` | plain text, a `TextSlot` | `{ size, textLength? }` |
| `src/svg.ts` | `themedImage({ base, alt, width, render })` | file base name, raw alt text, `"100%"` or a number, `(theme) => string` | a `SectionOutput`: the `<picture>` markup (alt escaped here, once) and both assets `<base>-light.svg` and `<base>-dark.svg` |
| `src/guards.ts` | `checkContrast(themes, pairs)` | themes, pairs | list of problems |
| `src/guards.ts` | `checkSvgAssets(assets)` | generated assets | list of problems (self containment, twins, colors) |

`build.ts` collects problems in this order, before anything is written: `checkReadme`, the asset name check, `checkContrast(themes, contrastPairs)` (light, then dark, in `contrastPairs` order), then `checkSvgAssets(assets)` (sorted by file name, then in AC-6 and AC-7 rule order).

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Sample card | Name, title, location | `content.profile.name`, `.title`, `.location` (spec 0002) |
| Sample card | Status line | A constant in `src/sections/placeholder.ts` |
| Sample card | Alt text | Derived: `${name}, ${title}, ${location}. Profile under construction.`, escaped once by `themedImage` |
| Sample card | Line sizes and squeeze | `fitText` over the slots in *Sample card layout* |
| Every SVG | Colors | Class names; values from `themeCss(themes[light or dark])` |
| Every SVG | Fonts, sizes, spacing, radius, size | `fonts`, `typography`, `space`, `radius`, `layout` |
| Every SVG | Animation timings, easing, stagger delays | `motion`, and `enter(i)` |
| `<picture>` | `srcset` and `src` paths | Derived by `themedImage`: `assets/generated/<base>-dark.svg` and `assets/generated/<base>-light.svg` (relative, spec 0001) |
| Contrast check | Ratios and message | `contrastRatio` over `contrastPairs`; the AC-3 format |
| Color check | Which theme a file belongs to | The `-light.svg` or `-dark.svg` file name suffix |

### Key invariants

- Sections never write a color, font name, size, or timing literally. Colors are class names, everything else comes from constants. The color guard catches colors, and review catches the rest.
- Every themed image comes from `themedImage`, so the README and the files can't disagree on names. The light file is the `<img>` fallback.
- Transparency uses `opacity` or `fill-opacity`. `rgb()`, `hsl()`, named colors, and hex outside the generated block fail the build.
- Status colors (`success`, `warning`, `danger`) only fill or stroke shapes, and each such shape has a text label in `fill-text` or `fill-muted` nearby. Color is never the only way information is shown.
- Base CSS styles are the final frame, keyframes animate *from* the start state, and `fill-mode: both` keeps an item hidden until its delay ends. The reduced motion block `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }` therefore always leaves the finished picture.
- Animate only `opacity`, `transform`, and `stroke-dashoffset`. No flashing more than three times a second. Every animation ends within `motion.budget`, and `infinite` fails the build.
- No layout or animation depends on measured text width.
- Output stays deterministic: wave paths, typing frames, and delays are computed from constants, never random.

### Security model

Not applicable beyond the existing rules: everything is public and static. The SVG guard keeps generated files free of scripts and outside requests, `escapeXml` stops content text from breaking out of SVG or HTML, and the content check keeps out characters that would make the XML invalid.

### Configuration required

None. No new environment variables or dependencies.

### Critical test scenarios

- Happy path: `pnpm build` writes `placeholder-card-light.svg`, `placeholder-card-dark.svg`, and a README that starts with the `<picture>`. On a pushed branch, switch GitHub between Light, Light high contrast, Dark, Dark dimmed, and Dark high contrast and confirm the right card shows and stays readable. Verifies **AC-4**.
- Determinism and checks: run `pnpm build` twice and compare `README.md` and `assets/generated/` byte for byte, then run `pnpm typecheck`, `pnpm lint`, and `pnpm lint:md`. Verifies **AC-9**.
- Motion: in Chrome, Firefox, and Safari, load the page and confirm each line stays hidden until its turn, the card holds still by 1.5 seconds, and with "reduce motion" on (macOS: Accessibility, Display) the final frame shows at once. Verifies **AC-5**.
- Contrast failure: set `themes.light.muted` to `#6c6f85` and build. The build fails with the exact AC-3 message, and nothing is written. Then try `#6C6F85` and see the format problem listed. Verifies **AC-3**.
- Typecheck: delete `danger` from `themes.dark` and run `pnpm typecheck`; it fails. Verifies **AC-2**.
- SVG guard: one at a time, add `<image href="https://example.com/a.png"/>`, `<script/>`, `onload="x"`, `url('https://x')`, `<!DOCTYPE svg>`, and `animation-iteration-count: infinite` to the card, and each fails. `url(#g)` and `xmlns="http://www.w3.org/2000/svg"` pass. Verifies **AC-6**.
- Twins and colors: drop the dark asset, then drop the light asset, then add `fill="#cba6f7"`, `fill="white"`, and `stroke="rgb(0,0,0)"`, then put the dark class block in the light file. Each fails. Verifies **AC-7**.
- Escaping: set the name to `Loc & <Co> "Q"` and build. The card and alt show it literally, with no `&amp;amp;`. Verifies **AC-8**.
- Bad characters: put `\u0007` in the bio; the content check fails. Verifies **AC-10**.
- Long text: set the name to 80 characters; the line shrinks and squeezes to stay inside the card. Verifies **AC-11**.
- Docs: `docs/design.md` has every section listed in AC-1, and its hex values match `src/theme.ts`. Verifies **AC-1**.

## Standard definition

**Canonical pattern**:

```ts
// src/sections/<name>.ts
import { escapeXml } from "../escape.ts";
import { card, enter, fitText, themedImage } from "../svg.ts";
import { layout, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const nameSlot = { width: layout.half - 2 * layout.pad, style: typography.heading, minSize: 14 } as const;

export const example: Section = ({ content: { profile } }) => {
  const fit = fitText(profile.name, nameSlot);
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return themedImage({
    base: "example",
    alt: `${profile.name}, ${profile.title}`,
    width: layout.half,
    render: (theme) =>
      card(theme, {
        width: layout.half,
        height: 120,
        body: `<text ${enter(0, "fill-accent")} x="${layout.pad}" y="48" font-size="${fit.size}"${squeeze}>${escapeXml(profile.name)}</text>`,
      }),
  });
};
```

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/generated/example-dark.svg">
  <img alt="Loc Nguyen, Cloud Developer" src="assets/generated/example-light.svg" width="400">
</picture>
```

**Replaces**:
- Hex colors, font stacks, sizes, or timings written inside a section.
- A single SVG that switches theme with its own `prefers-color-scheme` query.
- SMIL `<animate>` tags, endless loops, and any motion outside the motion inventory.
- Escaping text by hand inside a section, or escaping alt text before `themedImage`.
- Building `<picture>` markup and asset names separately.
- The plain text placeholder (`# name`, `**title**`, the 🚧 line).

**Enforcement**:
- Compile time: the types above, with constants `as const satisfies` them, so a missing token fails `pnpm typecheck`.
- Build time, in `src/guards.ts` and called by `build.ts`: `checkContrast` (AC-3) and `checkSvgAssets` (AC-6, AC-7), on top of the existing `checkReadme`. The content check adds the XML character rule (AC-10).
- Review: sizes and timings come from `typography`, `space`, `layout`, and `motion`, and motion ends within `motion.budget` (the guards can't measure durations).

**Rollout**: New code immediately. The only existing section, `placeholder`, moves to the standard in this feature.

**Exceptions**:
- Third party raster images that look the same in both themes (for example, Credly badge PNGs in feature 10) still use `<picture>` per `AGENTS.md`, but may point both sources at the same outside file. The SVG checks apply only to generated SVGs.
- A feature that needs new colors (a contribution graph ramp in feature 13, brand icon colors in feature 7) adds them as tokens in both themes, with contrast pairs where they carry text. It never writes colors by hand.
- Feature 13 may record a reasoned exception to `motion.budget` in its own spec. Nothing else may.

## Build plan

Skateboard: the first step ships a complete, visible themed card on the live profile, and the guards and docs then harden it.

1. Add `src/theme.ts` (types, tokens, constants, `contrastPairs`, `contrastRatio`, `themeCss`), `src/escape.ts` (`escapeXml`), and `src/svg.ts` (`svgDocument`, `card`, `enter`, `fitText`, `themedImage`). Rework `src/sections/placeholder.ts` into the themed sample card per *Sample card layout*. Turn off MD041 in `.markdownlint-cli2.jsonc` with a comment, and update the lychee comment in `profile.yml` now that the README links images. Build and push a branch to see it on GitHub in every theme. Satisfies **AC-2**, **AC-4**, **AC-5**, **AC-8**, **AC-9**, **AC-11**.
2. Add `checkContrast` and `checkSvgAssets` to `src/guards.ts`, update its header comment (it no longer checks only the README), and call both from `build.ts` in the stated order. Add the XML character rule to the content check in `src/content.ts`. Run each failure scenario once to confirm the message, then revert. Satisfies **AC-3**, **AC-6**, **AC-7**, **AC-9**, **AC-10**.
3. Write `docs/design.md`: palette tables with ratios, color classes, typography and the full width text rule, spacing and layout, card anatomy, text fitting, banner and typing line style, the motion inventory with still frames, `<picture>` markup, accessibility rules, and a pointer to `src/theme.ts` as the source of the values. Satisfies **AC-1**.

## Consequences

**Positive**:
- Every later section starts from ready helpers and can't quietly fail contrast, ship a missing dark file, or write a color by hand.
- The profile looks on brand from this feature on, not only after feature 5.
- Changing the accent or a timing is a one line edit in `src/theme.ts`.
- The page meets WCAG 2.2.2, since all motion ends within 5 seconds.

**Negative / tradeoffs**:
- `docs/design.md` repeats the hex values from `src/theme.ts`, so they can drift. The rule is to change both in the same commit, and the build checks only the code.
- The header goes still after about 5 seconds, so a visitor who scrolls back up sees no motion.
- With at most three typing phrases and short holds, the typing line has less room for more phrases.
- Several Latte colors (Green, Yellow, Peach) are too pale even for meaningful shapes, so light mode status shapes depend on their text labels. Feature 8 may want darker difficulty colors, added as tokens.
- System fonts make letter shapes vary per OS. `fitText` uses a wide width estimate, so long text may shrink a little more than it needs to.
- Numbers fade in instead of counting up. A count up would need script (not allowed in `<img>`) or one frame per digit.
- Full width images can't use small text, so detailed content has to go on half cards.
- `prefers-reduced-motion` inside an SVG shown as an image depends on the browser. Where it isn't honored, motion plays and still ends within 5 seconds.
- Turning off MD041 means the README has no top level heading. The banner's alt text carries the name instead.

**Neutral**:
- About 200 lines of new helper and guard code, and a small addition to the content check (spec 0002's text rule gains the XML character rule). No new dependencies.
- The sample card is temporary. Feature 5 replaces it with the banner and typing line, and the helpers stay.

## Follow-up

- [ ] `/sync`: add a pointer to `docs/design.md` and a one line rule ("sections draw with `src/theme.ts` tokens through `src/svg.ts`, colors by class only, motion ends within 5 seconds") to `AGENTS.md`. Also correct the `AGENTS.md` rule that says SVGs are self contained to mention that `data:` URIs are blocked too.
- [ ] Feature 5: the scope says the typing line "cycles through a few short phrases"; it now types through them once and rests on the last one. Update that row's wording when feature 5 is designed or built.
- [ ] Feature 6 adds Markdown escaping to `src/escape.ts` when the bio renders as Markdown (spec 0002 asked for one shared helper; this feature adds the XML part).
- [ ] Feature 7 decides whether tech icons use `fill-text` (one color) or brand colors added as tokens.
- [ ] Feature 8 decides the Easy, Medium, and Hard colors (Latte Green and Yellow are below 3:1 on `surface`).
- [ ] Feature 13 adds its color ramp tokens to both themes and settles its motion within `motion.budget` or records the exception.
- [ ] `/check verify`: after merge, confirm on the real profile page (a branch preview shows the repo README column, which is wider) that two `layout.half` cards sit side by side at a typical desktop width.
