# 0010 · Profile redesign: GitHub colors, new order, tables, logos

**Status**: Assumed
**Date**: 2026-11-18
**Authorized by**: Loc Nguyen, during /develop

## Owed decision

A redesign that replaces parts of earlier decisions: the Catppuccin palette of spec 0003, the card layouts of specs 0005 (tech stack), 0006 (contest card), 0007 (timeline), and 0008 (Credly grid), the section order, and the centered headings. Also how company and school logos reach a self contained SVG.

## Assumption built on

- **Theme switching stays as it is.** GitHub's own `<themed-picture>` script swaps the `<picture>` source to match the GitHub theme when the theme mode is a single theme (Light or Dark). In "Sync with system" mode GitHub leaves the choice to the browser, which follows the OS. No README markup can read GitHub's day or night theme choice, so the fix for a visitor is the GitHub setting, not the README.
- **Palette.** GitHub's Primer colors replace Catppuccin (`src/theme.ts`), so cards look like GitHub's own UI. `accent` is Primer blue, `accent2` Primer purple, and `success`, `warning`, `danger` are LeetCode's own difficulty colors.
- **Brand colors.** Brand icons are drawn in the brand's own color (`brandColors`, the `hex` of `simple-icons@16.38.0`, LinkedIn's brand blue for the hand drawn LinkedIn). A brand color under 1.5:1 against `page` or `surface` falls back to `text` (Next.js black on dark). The rating line uses the LeetCode orange.
- **Greeting.** The typing line types `Welcome to my GitHub profile`, then rests on `Hi there, I'm Loc 👋` (`content/profile.ts`).
- **Order.** Header, typing line, About me, Experience, Education, Certifications, Tech stack, LeetCode.
- **Headings.** Every section heading is a left aligned `<h2>` led by a 24px icon: `person`, `briefcase`, `graduationcap`, `award`, `code` (hand drawn) and `leetcode` (brand). The icon is decorative, so its `alt` is empty; the guard allows `alt=""` only inside an `<h2>` that has its own text.
- **Type sizes.** Card text drops to GitHub's own sizes: `lead` 14, `heading` 16, `title` 24, `number` 20 (was 20, 20, 32, 24). The banner title gets its own `tagline` style (22). On a phone a full width card shrinks to about 42%, so its text is smaller there than before; the owner chose this.
- **Tech stack.** An HTML table, one row per category: the label, then one chip per item (brand icon plus name), each chip its own small themed SVG.
- **Certifications.** An HTML table, one row per Credly `issuer` (the issuer name as Credly gives it), its badges at 96px on the right, in the spec 0008 order.
- **About me buttons.** The icon and label are centered together in the pill, with the brand color icon.
- **LeetCode contest card.** The Top % and the rating histogram are gone. The rating chart spans the card, and contests are spaced evenly by order, not by date, so years without contests leave no gap. Each year is labeled under its first contest, with a faint dashed line where it starts. The heatmap uses `success`.
- **Experience and education logos.** `logo` in `content/experience.ts` and `content/education.ts` names a PNG or JPEG in `assets/static/logos/`. `pnpm build` reads only the files content names and passes them to sections as `ctx.logos` (data URIs), so sections stay pure. The timeline draws each logo on a white tile (`logoTile`); an entry with no logo shows its initial. The rail and dots are gone. The SVG guard allows only `data:image/png` or `data:image/jpeg` base64 URIs besides `#id` links.
- **Logo sources.** Noventiq from the owner's file, CMC Telecom and FPT Software from Wikimedia Commons (cropped and resized), UET (the emblem cut from the header logo on uet.vnu.edu.vn) and Hong Quang High School from their own websites.

### Second round (same day)

- **About me.** The bio is a quote: `<p><i>“…”</i></p>`, left aligned. The location is no longer shown. The buttons are left aligned too.
- **Full color logos.** The icon registry gains layered icons: a brand's full color logo with its own `viewBox` and one path per color, painted by `fill-brand-<icon>-<layer>` (colors in `brandColors`, a too faint color falls back to `text`). LeetCode (orange, gray, black), Gmail (four color M), and AWS (letters and smile) are copied from Wikimedia Commons files, since Simple Icons 16.38.0 has no AWS and only one color LeetCode and Gmail. The Email button uses the Gmail logo, and AWS gets its logo in the tech stack.
- **Experience and education** are drawn on the page with no card; their text is checked against `page`. The LinkedIn button under them is gone.
- **Certifications.** The issuer cell is `<td width="140">`, so names wrap and the badges get the room. The Credly button under the table is gone.
- **LeetCode.** The contest level shows the level's own badge art (Guardian) and its name in `accent`. The solved card and the badges card share one full width image, so they always sit on one row. The badges card shows the featured badges' art (the chosen badge in the middle), like LeetCode's own page, so the separate badge row is gone. The difficulty chips are drawn like LeetCode's (a `track` tile, the colored name over the count), using new `successText`, `warningText`, `dangerText` tokens checked as text on `track`. The heatmap follows LeetCode's layout (a summary line, no legend) in LeetCode's green (`heat`).
- **Outside images.** A source may list image URLs its sections embed (`Source.images`). `pnpm refresh` downloads each, shrinks it to a 144 px PNG with a small built in PNG codec (`src/png.ts`, no dependency), and stores it in `data/snapshots/images/` by URL hash, which the daily bot already commits. `pnpm build` reads them into `ctx.images` and never fetches; a missing image falls back (the shield, or left out of the art row).
- **Guard.** An SVG that uses a `fill-`, `stroke-`, or `stop-` class `themeCss` doesn't define fails the build.

### Third round (same day)

- **Greeting.** The typing line types `Hi there 👋`, then rests on `Welcome to my GitHub` (no name: the banner shows it).
- **Brand logos are whole files.** Hand converted layered paths gave wrong logos in one theme or the other, so every brand logo is now its full color SVG, vendored in `src/brands.ts` from thesvg.org (with a `dark` file where the light one doesn't read on a dark page) and embedded as a `data:image/svg+xml` image. LeetCode keeps the Wikimedia Commons mark (thesvg.org has only a one color LeetCode). Go is thesvg.org's file in Go Blue. Brandfetch needs an API key, so nothing comes from it. This replaces the Simple Icons paths, the layered icons, and `brandColors`; `src/icons.ts` keeps only the hand drawn glyphs. The SVG guard allows a `data:image/svg+xml` image only when it is exactly one of the vendored files, and `checkBrands` checks those files.
- **Education.** The honors note is a gold pill (`honor` token) led by `stars` ★ (new optional content field, 1 to 5; High Distinction has 4).
- **LeetCode weights.** Emphasized numbers and names are medium (500), not bold.
- **LeetCode badges card.** No LeetCode logo. The most recent badge shows its own art beside its label and name.
- **Monthly badges.** Under the heatmap, each month with its Daily Coding Challenge badge shows that badge's art in place of the month name, as LeetCode does. Image requests now carry a size (`ImageRequest`), so each picture is stored at about twice its drawn size.
- **Tables.** Both tables use percent column widths (certifications 25/75, tech stack 10/90), which makes GitHub draw them as wide as the README; the certifications issuer column is wider.
- **Tech stack.** AWS is spelled out as Amazon Web Services.

### Fourth round

- **Chips and the honors pill are centered on any font.** Their text uses an alphabetic baseline at `center + 0.35 × size` instead of `dominant-baseline="central"`, and sits centered in a snug width estimate (`0.52 × size` per character), so a wider or narrower font keeps even padding. The pill text is never stretched with `textLength`. Chips use `<img align="middle">` so they sit centered in their table row.
- **Honors pill.** 26 px tall, bright gold (`honor` `#f5c518`) with dark brown text and stars (`onHonor`).
- **Contest stats** use the sans font at 20 px, like the labels.
- **Featured LeetCode badges are the most valuable**, not the one chosen on LeetCode: the contest level, the longest all time streak, the newest full year badge, then the rest by tier (`featuredBadges`).

## Code area

`src/theme.ts`, `src/svg.ts`, `src/icons.ts`, `src/brands.ts`, `src/images.ts`, `src/guards.ts`, `src/build.ts`, `src/refresh.ts`, `src/png.ts`, `src/content.ts`, `src/paths.ts`, `src/types.ts`, `src/readme.ts`, `src/sections/*`, `src/sources/leetcode.ts`, `src/sources/images.ts`, `content/*`, `assets/static/logos/`, `data/snapshots/images/`, `docs/design.md`

## Requirements

- AC-1: Every section heading is a left aligned `<h2>` with its icon before the title.
- AC-2: Sections appear in the order above.
- AC-3: No Catppuccin color remains in `src/theme.ts` or any generated SVG; brand icons use their brand color.
- AC-4: The tech stack and the certifications are tables, providers on the left.
- AC-5: The contest card has no Top or histogram, and contests are evenly spaced.
- AC-6: Each experience and education entry shows its logo, or its initial when it has none.
- AC-7: The contact pill icon and label are centered in the pill.
- AC-8: `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm lint:md` pass.
- AC-9: The bio shows as an italic quote, left aligned, with no location.
- AC-10: LeetCode, Gmail, and AWS show their full color logos.
- AC-11: Experience and education have no card and no LinkedIn button; certifications have no Credly button and a narrow issuer column.
- AC-12: The contest level shows the Guardian art in blue text; the solved and badges cards share one row, with badge art in the badges card; the heatmap is LeetCode green in LeetCode's layout.
- AC-13: Every brand logo shows its real colors in both themes.
- AC-14: High Distinction stands out with 4 stars; LeetCode emphasis is medium weight; the most recent badge and each month's challenge badge show their art; both tables fill the README width.

## Ratify

This decision was recorded by /develop, not deliberated. Run `/architect profile redesign` to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature `done`.
