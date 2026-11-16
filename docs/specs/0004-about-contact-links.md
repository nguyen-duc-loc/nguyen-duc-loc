# 0004. About me as centered Markdown, contact links as generated SVG pill buttons, icons in a shared registry

**Date**: 2026-11-16
**Status**: Proposed

## Summary

The About me section shows your bio and location as real Markdown text, centered under the typing intro, so people can read, select, and translate it, and GitHub colors it for every theme. Below it sit four contact buttons (LinkedIn, Credly, LeetCode, Email). Each one is a small Catppuccin pill drawn by the build as its own light and dark SVG and wrapped in a link, because an image can't hold a clickable link inside it. Icons come from one shared file, `src/icons.ts`, that copies path data (the shape outline an SVG draws) from Simple Icons and hand draws whatever Simple Icons lacks. Feature 7 adds its tech stack icons to that same file.

## Context

Feature 6 is the second thing a visitor sees, right after the banner and the typing line. It has to say who Loc is in a sentence and give recruiters a one click way to reach him. Spec 0002 already names every value: `profile.bio`, `profile.location`, `profileUrls(accounts)` for LinkedIn, Credly, and LeetCode, and `mailtoUrl(email)`. GitHub gets no button, since the visitor is already on GitHub. What was open is how these show on the page.

Forces:
- GitHub renders a README through a strict HTML sanitizer. It drops `style`, `class`, and `margin`, and keeps `align`, `<picture>`, `<img>`, and `<a href>`. An SVG shown through `<img>` is a flat picture: any link inside it is dead. A clickable button must therefore be its own image wrapped in `<a href>`.
- GitHub follows the visitor's theme only through `<picture>` with a light and a dark source (spec 0003). Text in Markdown follows the theme by itself.
- The design system (spec 0003, `docs/design.md`) says this section has no motion, every SVG is self contained and names colors only by class, and every image has real alt text. The build checks all of this.
- `AGENTS.md` keeps the project at zero runtime dependencies and output that is byte identical on every build.
- Feature 7 (tech stack) needs many brand icons, and spec 0002 left it to decide how a Simple Icons slug becomes an icon. Whatever feature 6 does with its four icons sets the pattern feature 7 inherits, so the two should share one source.
- `docs/design.md` has no button style and no section text style yet. Without a decision, `/develop` would invent sizes, radius, and weights outside `src/theme.ts`.

## Requirements

**User stories**:
- As a recruiter visiting Loc's profile, I want a short bio and one click buttons to his LinkedIn, Credly, LeetCode, and email, so that I can learn more or reach him right away.
- As a screen reader user, I want the bio as real text and each button to announce where it goes, so that I get the same information.
- As Loc, I want to change my bio, location, or a username in `content/` and see the README update, with no layout code to touch.
- As the author of feature 7, I want one icon source with a fixed shape, so that the tech stack icons look and work like the contact icons.

**Acceptance criteria**:
- **AC-1**: Right after the typing intro, `README.md` contains, in order and separated by blank lines: `<h2 align="center">About me</h2>`, then `<p align="center">` holding `profile.bio`, then `<p align="center">` holding `📍 ` plus `profile.location`, then the centered button row. Bio and location each pass through `escapeXml` exactly once.
- **AC-2**: The button row is one `<p align="center">` block with four buttons in this order: LinkedIn, Credly, LeetCode, Email. Each button is `<a href="URL">` wrapping the `<picture>` from `themedImage`. The URLs are `profileUrls(accounts).linkedin`, `.credly`, `.leetcode`, and `mailtoUrl(profile.email)`. There is no GitHub button.
- **AC-3**: Each button is a light and dark SVG pair, `contact-<name>-light.svg` and `contact-<name>-dark.svg`, 148 × 48, rendered at `width="148"`. Inside a transparent 4px margin, it draws a 140 × 40 pill (`radius.pill`) with `fill-surface stroke-border` and `layout.border` stroke, a 16px icon in `fill-accent`, and the label in `fill-text` with the `button` text style (14px, weight 600). The labels are `LinkedIn`, `Credly`, `LeetCode`, `Email`. The buttons have no animation, and every button SVG passes `checkSvgAssets`.
- **AC-4**: The button alt texts are `LinkedIn profile`, `Credly badges`, `LeetCode profile`, and `Email <profile.email>` (for example `Email nguyenducloc404@gmail.com`).
- **AC-5**: `src/icons.ts` exports one icon registry. Each entry has a single `path` on a 24 × 24 grid and a `source` that is either `simple-icons@<version>` (the pinned release the path was copied from) or `hand drawn`. Entries contain no color. The four contact icons (`linkedin`, `credly`, `leetcode`, `email`) come from Simple Icons when that release has the brand, and are hand drawn otherwise. `email` is always hand drawn (an envelope). Asking for a name that isn't in the registry is a type error.
- **AC-6**: `src/theme.ts` adds `radius.pill` (20), `typography.button` (14, 600, sans), and a `button` constant holding the button sizes. `docs/design.md` documents the About section, the button anatomy, and the icon registry with the same values. No section writes a size, color, or font itself.
- **AC-7**: Changing `profile.bio`, `profile.location`, `profile.email`, or any of the three usernames in `content/` and running `pnpm build` changes the README (and the email button's alt text) with no change under `src/`. Two builds in a row produce byte identical output.
- **AC-8**: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md` pass. Lychee in CI passes on the four new links, or, if Credly or the `mailto:` link fails only because of automation, the failure is confirmed by opening the link by hand and one narrow exclusion with a comment is added to `lychee.toml`.

## Options considered

### Option 1: Markdown text plus generated SVG pill buttons, icons vendored in `src/icons.ts`

The bio and location are centered HTML paragraphs. Each button is drawn by the build through `src/svg.ts` as a themed SVG pair and wrapped in `<a href>`. Icon path data is copied into a typed registry in the repo.

**Pros**:
- Matches the Catppuccin look in both themes and passes the existing build checks unchanged.
- No outside service at view time, and no new dependency.
- Real text for the bio, which is better for screen readers, copy, translation, and search.
- One icon shape that feature 7 reuses.

**Cons**:
- Eight SVG files for four buttons, plus the work of drawing a button.
- Icon paths are copied by hand, so a brand redesign means copying again.
- Text width is estimated, not measured, so a label could look slightly off center on some fonts.

### Option 2: shields.io badges

Each button is a `for-the-badge` image from shields.io with a Simple Icons logo, wrapped in a link.

**Pros**:
- Almost no code, and a look many profiles use.
- shields.io keeps the logos current.

**Cons**:
- shields.io colors, not Catppuccin, in both themes. The row never matches the cards.
- The page depends on an outside service each time someone views it. If shields.io is slow or down, the buttons show as broken images.
- Logos follow shields.io's copy of Simple Icons. A brand removed there disappears from your profile with no warning.

### Option 3: Everything as one SVG card

The bio, location, and a row of drawn buttons sit inside one themed card.

**Pros**:
- The most consistent look with the later cards.

**Cons**:
- The buttons can't be clicked, because links inside an `<img>` SVG are dead. This fails the scope's "every button opens the right profile".
- The bio lives in an image, so its text has to be repeated in the alt text, and people can't select it.

### Option 4: `simple-icons` as a dev dependency instead of vendored paths

The same as Option 1, but the build reads icon paths by slug from the `simple-icons` package.

**Pros**:
- Feature 7 can add icons with no copying.
- The package could also check that each `stack` icon slug is real.

**Cons**:
- A large package for a handful of icons, and the project's first dependency the build reads at run time.
- A version bump can quietly change or remove an icon and change the output.
- Brands it lacks still need hand drawn glyphs, so a local registry is needed anyway.

## Decision

**Chosen option**: Option 1: Markdown text plus generated SVG pill buttons, icons vendored in `src/icons.ts`.

About me is centered Markdown text, each contact link is its own themed SVG pill wrapped in `<a href>`, and every icon on the profile comes from the one `src/icons.ts` registry.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for the type stripping limits on the new modules.

## Rationale

The deciding force is GitHub's sanitizer plus the image link rule. A clickable, themed button must be a separate `<picture>` inside `<a href>`, which rules out Option 3. Between drawing the buttons and using shields.io (Option 2), drawing wins on the forces in Context: Catppuccin in both themes, no outside service between a recruiter and your contact links, and the existing build checks guard the result. Option 2 is the runner up. It would be fine on a profile that doesn't care about matching the theme, but here it would be the one part of the page in someone else's colors.

The bio stays real text because it is the most important sentence on the page for a person and for a screen reader, and Markdown text follows every GitHub theme for free. Centering it with `align` matches the banner and typing line above it. GitHub keeps `align` and drops `style`, which is also why the button spacing is drawn into each SVG as a 4px transparent margin.

Vendoring icons (over Option 4) keeps the zero dependency rule and keeps output fixed until you choose to copy a new path. The pinned `source` line on each entry makes a later refresh traceable. The registry is a type, so feature 7 extends it instead of starting a second pattern. Icons in a single `accent` color reuse the checked contrast pairs. Brand colors would need new tokens in both themes, and several are hard to read on the Mocha surface.

## Feature design

**Data model sketch**: no change to `content/`. This feature reads only what spec 0002 defined.

| Value | Type | Where it lives | Required |
|---|---|---|---|
| `profile.bio` | string, at most 300 characters | `content/profile.ts` (spec 0002) | yes |
| `profile.location` | string, city and country | `content/profile.ts` (spec 0002) | yes |
| `profile.accounts.linkedin`, `.credly`, `.leetcode` | username | `content/profile.ts` (spec 0002) | yes |
| `profile.email` | public address | `content/profile.ts` (spec 0002) | yes |
| Button list (name, label, alt, URL getter), in order | `readonly` constant | `src/sections/about.ts` | yes, exactly 4 |
| `Icon` | `{ readonly path: string; readonly source: string }` | `src/icons.ts` | yes |
| `icons` | `as const satisfies Record<string, Icon>`, keys are Simple Icons slugs, or a plain name for hand drawn glyphs (`email`) | `src/icons.ts` | the 4 contact icons now, feature 7 adds more |
| `IconName` | `keyof typeof icons` | `src/icons.ts` | yes |

New theme values in `src/theme.ts` (and repeated in `docs/design.md`):

| Constant | Value |
|---|---|
| `radius.pill` | 20 |
| `typography.button` | `{ size: 14, weight: 600, family: "sans" }` |
| `button.width`, `button.height` | 140, 40 (the pill) |
| `button.margin` | 4 (transparent, on every side, so the file is 148 × 48) |
| `button.padX` | 16 (pill edge to icon) |
| `button.icon` | 16 |
| `button.gap` | 8 (icon to label) |

**State transitions**: none. The section is static and has no motion.

**API surface** (module exports, all pure, no I/O):

| Export | Signature | Used by | Failure |
|---|---|---|---|
| `about` (`src/sections/about.ts`) | `Section`, `(ctx) => SectionOutput` | `src/readme.ts`, listed right after `typingIntro` | none (content already checked) |
| `icons`, `IconName`, `Icon` (`src/icons.ts`) | registry constant and its types | `iconSvg`, feature 7 | unknown name is a type error |
| `iconSvg` (`src/svg.ts`) | `(name: IconName, x: number, y: number, size: number, classes: string) => string`: a nested `<svg x y width height viewBox="0 0 24 24">` with one `<path class=classes d=path/>` | `pillButton`, feature 7 | none |
| `pillButton` (`src/svg.ts`) | `(theme: Theme, { icon: IconName; label: string }) => string`: a full SVG document via `svgDocument` | the `about` section, later feature 9's LinkedIn button | none |

Button geometry, all from `button` and `layout` in `src/theme.ts`:
- File: `width = button.width + 2 × margin` (148), `height = button.height + 2 × margin` (48). Everything outside the pill is transparent.
- Pill: `<rect x="4.5" y="4.5" width="139" height="39" rx="20">` (`margin + 0.5`, size minus 1, the same half pixel inset as `card()`), classes `fill-surface stroke-border`, `stroke-width` of `layout.border`.
- Icon: `iconSvg(icon, margin + padX, margin + (height − icon) / 2, icon, "fill-accent")`, so x = 20, y = 16.
- Label: `<text class="fill-text" x="44" y="24" dominant-baseline="central" text-anchor="start">`, x = `margin + padX + icon + gap`. Size and squeeze come from `fitText(label, { width: 84, style: typography.button, minSize: 12 })`, where 84 runs from the label start to `padX` before the pill's right edge. `font-weight` is 600.

README markup (the section returns exactly this shape; picture lines come from `themedImage`):

```html
<h2 align="center">About me</h2>

<p align="center">BIO</p>

<p align="center">📍 LOCATION</p>

<p align="center">
<a href="LINKEDIN_URL"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/generated/contact-linkedin-dark.svg">
  <img alt="LinkedIn profile" src="assets/generated/contact-linkedin-light.svg" width="148">
</picture></a>
<a href="CREDLY_URL">…</a>
<a href="LEETCODE_URL">…</a>
<a href="MAILTO_URL">…</a>
</p>
```

The button block has no blank lines inside it, so GitHub reads it as one HTML block and doesn't parse it as Markdown. That is also why the bio and location need only `escapeXml`, not Markdown escaping. The line breaks between the `<a>` tags render as a single space, and the drawn 4px margins give the buttons even spacing across rows and between them.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| `about` | heading text `About me` | constant in `src/sections/about.ts` (decided here) |
| `about` | bio paragraph | `content.profile.bio`, through `escapeXml` |
| `about` | location line | constant `📍 ` plus `content.profile.location`, through `escapeXml` |
| `about` | button order | constant list in `src/sections/about.ts`: LinkedIn, Credly, LeetCode, Email (decided here) |
| `about` | LinkedIn, Credly, LeetCode URLs | `profileUrls(content.profile.accounts)` (spec 0002, AC-8) |
| `about` | email URL | `mailtoUrl(content.profile.email)` (spec 0002, AC-8) |
| `about` | labels | constants `LinkedIn`, `Credly`, `LeetCode`, `Email` (decided here) |
| `about` | alt texts | constants `LinkedIn profile`, `Credly badges`, `LeetCode profile`; `Email ` plus `content.profile.email`. `themedImage` escapes them |
| `about` | asset names | `contact-` plus the icon name, then `-light.svg` and `-dark.svg` via `themedImage` |
| `pillButton` | colors | classes `fill-surface`, `stroke-border`, `fill-accent`, `fill-text` from `themeCss` (spec 0003) |
| `pillButton` | sizes, radius, weight | `button`, `radius.pill`, `typography.button`, `layout.border` in `src/theme.ts` (decided here) |
| `pillButton` | label font size, squeeze | `fitText` (spec 0003) |
| `iconSvg` | path data | `icons[name].path` in `src/icons.ts` |
| `src/icons.ts` | each Simple Icons path and the `<version>` in its `source` | copied by `/develop` from the latest Simple Icons release on the day of the build, the same version for every copied icon |
| `src/icons.ts` | hand drawn glyphs | drawn by `/develop` as one filled path on the 24 grid: an envelope for `email`, and for any contact brand the pinned Simple Icons release lacks, a simple recognizable mark (LinkedIn: the lowercase "in" cut out of a rounded square; Credly: a plain badge, a circle with two ribbon tails below it) |

**Key invariants**:
- Exactly four buttons, in the fixed order, and no GitHub button.
- Every content value is escaped exactly once on its way into HTML or SVG.
- Every button SVG has a light and dark twin, names colors only by class, and has no animation. `checkSvgAssets` enforces this.
- Icon entries hold path data only: no `fill`, no `stroke`, no color, no `transform`. One path per icon, so one class colors it.
- All copied Simple Icons entries share one pinned version. Refreshing icons means copying every copied entry from the new version in the same commit.
- No layout depends on measured text width. Labels are placed with `text-anchor="start"` at a fixed x and sized by `fitText`.
- No new contrast pair is needed. Label `text` on `surface` and icon `accent` on `surface` are already checked.

**Security model**: everything shown is public by design (spec 0002). The email address is public on purpose, as Loc chose in spec 0002. The section adds no secrets, tokens, or outside requests. Links are built only from checked usernames through `profileUrls` and `mailtoUrl`, so no raw URL from content reaches an `href`.

**Configuration required**: none.

**Critical test scenarios**:
- Happy path: `pnpm build`, then view the profile on GitHub in Light, Dark, and Dark dimmed. The heading, bio, and location are centered under the typing line, and the four pills show in order with readable labels and icons. Each one opens the right page, and Email opens a mail client. Verifies **AC-1**, **AC-2**, **AC-3**.
- Screen reader or alt check: inspect the README HTML. Each `<a>` wraps an `<img>` whose alt matches AC-4. Verifies **AC-4**.
- Escaping: temporarily set `bio` to `Tom & Jerry <3 "quotes"`. The README holds `Tom &amp; Jerry &lt;3 &quot;quotes&quot;`, GitHub shows the original text, then revert. Verifies **AC-1**.
- Data drives layout: temporarily change `location` and `accounts.credly`. The README location line and Credly `href` change, and `git diff` shows no change under `src/`, then revert. Verifies **AC-7**.
- Determinism: run `pnpm build` twice, and `git status` is clean after the second run. Verifies **AC-7**.
- Guards: `pnpm build` passes `checkSvgAssets` with the eight new SVGs, and adding a hex color to an icon path makes it fail, then revert. Verifies **AC-3**, **AC-5**.
- Typed icons: call `iconSvg("nope", …)` in a scratch edit and `pnpm typecheck` fails, then revert. Verifies **AC-5**.
- Tooling: `pnpm typecheck`, `pnpm lint`, `pnpm lint:md` pass locally, and CI lychee passes or the AC-8 exclusion path is followed. Verifies **AC-6**, **AC-8**.

## Build plan

Skateboard: the first milestone ships a complete, readable About me section with the bio live on your profile. The second adds the buttons. The third writes the design rules down and runs every check. Each milestone leaves `main` green and shippable.

1. **Milestone 1: About me text live.**
   1. Add `src/sections/about.ts` with the `about` section rendering the centered heading, bio, and location as in *README markup*, escaped through `escapeXml`. Append it after `typingIntro` in `src/readme.ts`, satisfies **AC-1**, **AC-7**.
   2. Run `pnpm build` and `pnpm lint:md`, and check the escaping scenario, satisfies **AC-1**, **AC-8**.
2. **Milestone 2: contact buttons.**
   1. Add `radius.pill`, `typography.button`, and the `button` constant to `src/theme.ts`, satisfies **AC-3**, **AC-6**.
   2. Add `src/icons.ts` with the `Icon` type, the registry, and `IconName`. Copy `leetcode`, plus `linkedin` and `credly` if the latest Simple Icons release has them, from that release and record `simple-icons@<version>`. Hand draw the rest and `email`, satisfies **AC-5**.
   3. Add `iconSvg` and `pillButton` to `src/svg.ts` with the geometry above, satisfies **AC-3**, **AC-5**.
   4. Add the button list and row to the `about` section: `themedImage` per button, wrapped in `<a href>`, with the URLs from `profileUrls` and `mailtoUrl` and the alt texts from AC-4, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-7**.
3. **Milestone 3: design rules and checks.**
   1. Update `docs/design.md`: add the About me section, button anatomy, and icon registry, add the new constants to the type and spacing tables, and leave the motion inventory row for about and buttons as "None", satisfies **AC-6**.
   2. Run every critical test scenario, push, and confirm the lychee result in CI. If Credly or `mailto:` fails only because of automation, open it by hand and add one commented exclusion to `lychee.toml`, satisfies **AC-7**, **AC-8**.

## Consequences

**Positive**:
- Recruiters get a readable bio and four one click contact links that match the profile's theme.
- The buttons depend on nothing outside the repo at view time.
- Features 7 and 9 inherit a ready icon registry and a reusable `pillButton`.

**Negative / tradeoffs**:
- Eight new SVG files under `assets/generated/` for four buttons.
- Icon paths are copied by hand. When a brand changes its logo, the profile keeps the old one until someone copies again.
- Hand drawn marks for brands Simple Icons lacks are approximations of real trademarks. Using a brand's mark to link to your own profile is normal use, but they won't be pixel exact.
- Label width is estimated (spec 0003 `fitText`), so on a narrow font a label may sit slightly left of the pill's visual center.
- The centered `<h2>` is HTML, so markdownlint's heading rules don't see it, and GitHub may not give it the same anchor link as a `##` heading.

**Neutral**:
- `src/theme.ts` and `docs/design.md` grow by one radius, one text style, and one button constant, changed together as spec 0003 requires.
- Lychee may need its first exclusion, only if CI shows it is needed.

## Follow-up

- [ ] Feature 7 adds its icons to `src/icons.ts` from the same pinned Simple Icons version (or bumps every copied entry together) and decides whether the `stack` content check should accept only `IconName` keys. This settles the spec 0002 follow up about turning a slug into an icon.
- [ ] Feature 9's "LinkedIn button to the full profile" reuses `pillButton` and the `linkedin` icon instead of a new style.
- [ ] If CI lychee flags Credly or the `mailto:` link, add one narrow, commented exclusion to `lychee.toml` (AC-8).
- [ ] `/sync` after the build: record in `AGENTS.md` that every icon comes from `src/icons.ts`, and that clickable images are a `themedImage` wrapped in `<a href>`.
