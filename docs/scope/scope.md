# Scope: GitHub Profile README

An animated, theme aware GitHub profile README that shows who you are: a short intro, your tech stack, your work experience and education, your Credly certifications, your GitHub activity, and your LeetCode progress (the highlight). It is for recruiters, hiring managers, and other developers who visit your GitHub profile.

**Build approach:** Skateboard (ship the smallest complete profile people can visit first, then grow it release by release, keeping it live and shippable at every step).
**Workflow:** Alpha (after `/develop`, run `/check verify` to confirm the README renders on GitHub in light and dark mode and every card loads). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· Beta`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

**Planning notes (from your answers):**
- English only. No deadline, quality first.
- Every section adapts to the visitor's light or dark theme.
- Animation is bold but focused: animated header, typing intro, animated stat cards, one signature animation (the contribution graph). Everything else stays static so the page loads fast and reads well.
- Data freshness is a mix: live images where a reliable source exists, a scheduled refresh (an automated job that rebuilds images and commits them) where outside services are flaky. `/architect` picks which per section.
- LinkedIn does not offer work history or education to regular developers (only approved partners), so experience and education come from your own content data file, with a LinkedIn button linking to your full profile.
- Every image has alt text (a short text description for screen readers and for when an image fails to load).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Profile repo & build approach | Foundation | in-progress |
| 2 | Coding standards & tooling | Foundation | done |
| 3 | Profile content data | Foundation | done |
| 4 | Visual theme & animation style | Foundation | done |
| 5 | Animated header & typing intro | Release 1 | done |
| 6 | About me & contact links | Release 1 | done |
| 7 | Tech stack | Release 1 | done |
| 8 | LeetCode stats card | Release 1 | done |
| 9 | Experience & education timeline | Release 2 | done |
| 10 | Credly badge grid | Release 2 | done |
| 11 | LeetCode badges & heatmap | Release 2 | done |
| 12 | GitHub stats & streak | Release 3 | planned |
| 13 | Animated contribution graph | Release 3 | planned |
| 14 | Featured projects | Release 3 | planned |

## Foundations

### 1. Profile repo & build approach · in-progress
Set up the public repo named exactly like your GitHub username (GitHub only shows a profile README from that repo), and decide how the README is put together and kept fresh: written by hand, or generated from your content data, plus how scheduled refreshes run.
**Done when:** the decision is recorded in a spec, the repo shows a placeholder README on your GitHub profile, and the README can be rebuilt with one command (or one automated run).
spec [0001](../specs/0001-profile-repo-build-approach/index.md) · code in `src/`, `content/`, `.github/`
- [x] Decide the stack (spec): `/architect profile repo & build approach`
- [x] Scaffold from the decision: `/develop profile repo & build approach`
- [ ] Verify it: `/check verify profile repo & build approach`

### 2. Coding standards & tooling · done
Capture conventions for the repo (file layout, how to add a section, how refreshes commit), then install light checks such as markdown linting and broken link checks.
**Done when:** root `AGENTS.md` reflects the real setup, and the checks run clean locally and in the automated workflow.
code in `biome.json`, `.markdownlint-cli2.jsonc`, `lychee.toml`, `package.json`, `pnpm-workspace.yaml`, `.github/workflows/profile.yml`
- [x] Capture conventions + tooling choices: `/audit`

### 3. Profile content data · done
One source of truth for everything you write about yourself: bio, title, tech stack, work experience, education, featured projects, and profile links (LinkedIn, Credly, LeetCode, email). You edit this file, not the README.
**Done when:** the data shape covers every section in this plan, and changing a role or project in the data updates the README without touching layout.
spec [0002](../specs/0002-profile-content-data.md)
code in `content/`, `src/content.ts`, `src/types.ts`, `src/build.ts`, `src/refresh.ts`
- [x] Design it (spec): `/architect profile content data`
- [x] Build it: `/develop profile content data`
  - [x] Content modules with your real content, wired into build, README unchanged (AC-1, AC-2, AC-3, AC-4, AC-7)
  - [x] Content check and link helpers, run by build and refresh (AC-5, AC-6, AC-8)
- [x] Verify it: `/check verify profile content data`

### 4. Visual theme & animation style · done
The look every section shares: color palette for light and dark mode, fonts, section layout and spacing, the header banner style, and rules for when to animate and when to stay static.
**Done when:** a `design.md` covers palette (both themes), layout, card style, and animation rules, and a sample card looks right in both light and dark mode.
spec [0003](../specs/0003-visual-theme-animation-style.md) · design in [`docs/design.md`](../design.md)
code in `src/theme.ts`, `src/svg.ts`, `src/escape.ts`, `src/guards.ts`
- [x] Design it (spec): `/architect visual theme & animation style`
- [x] Build it: `/develop visual theme & animation style`
  - [x] Theme tokens, shared SVG helpers, and the themed sample card live on GitHub (AC-2, AC-4, AC-5, AC-8, AC-9, AC-11)
  - [x] Build guards for contrast, self contained SVGs, light and dark twins, colors, and XML safe content (AC-3, AC-6, AC-7, AC-10)
  - [x] `docs/design.md` written from the spec (AC-1)
- [x] Verify it: `/check verify visual theme & animation style`

## Release 1: A profile you can share

### 5. Animated header & typing intro · done
An animated banner with your name and title, and a typing line that types a few short phrases about you, then rests on the last one.
**Done when:** the banner and typing intro animate on your GitHub profile, look right in both themes, and have alt text.
design in [`docs/design.md`](../design.md) · code in `src/sections/header.ts`, `src/sections/typing.ts`, `src/readme.ts`
- [x] Build it: `/develop animated header & typing intro`

### 6. About me & contact links · done
A short bio and a row of badge style buttons for LinkedIn, Credly, LeetCode, and email.
**Done when:** the bio reads from your content data, and every button opens the right profile.
spec [0004](../specs/0004-about-contact-links.md) · design in [`docs/design.md`](../design.md) · code in `src/sections/about.ts`, `src/icons.ts`, `src/svg.ts`, `src/theme.ts`, `src/readme.ts`
- [x] Design it (spec): `/architect about me & contact links`
- [x] Build it: `/develop about me & contact links`
  - [x] About me heading, bio, and location live (AC-1, AC-7)
  - [x] Contact buttons: theme values, icon registry, pill buttons, linked row (AC-2, AC-3, AC-4, AC-5, AC-7)
  - [x] `docs/design.md` updated and every check run, including lychee in CI (AC-6, AC-7, AC-8)
- [x] Verify it: `/check verify about me & contact links`

### 7. Tech stack · done
Your languages, frameworks, tools, and cloud platforms as icons, grouped by category.
**Done when:** the icons come from your content data, are grouped and labeled, and stay readable in both themes.
spec [0005](../specs/0005-tech-stack-cards.md) · design in [`docs/design.md`](../design.md) · code in `src/sections/stack.ts`, `src/icons.ts`, `src/content.ts`, `content/types.ts`, `src/theme.ts`, `src/readme.ts`
- [x] Design it (spec): `/architect tech stack`
- [x] Build it: `/develop tech stack`
  - [x] Tech stack cards live: registry icons, typed slugs, theme sizes, four half cards wired into the README (AC-1, AC-2, AC-3, AC-4, AC-5, AC-8, AC-10)
  - [x] Content rules (registry check, 1 to 8 items), `docs/design.md` updated, and every check run, including both themes on GitHub (AC-6, AC-7, AC-9, AC-11)
- [x] Verify it: `/check verify tech stack`

### 8. LeetCode stats card · done
Your LeetCode highlight: a problems solved gauge (easy, medium, hard) and your contest rating and ranking, linked to your LeetCode profile.
**Done when:** the card shows current solved counts and contest rating, refreshes on its own, matches both themes, and keeps showing the last good version if a refresh fails.
spec [0006](../specs/0006-leetcode-stats-card.md) · design in [`docs/design.md`](../design.md) · code in `src/sources/leetcode.ts`, `src/sections/leetcode.ts`, `data/snapshots/leetcode.json`, `src/sources/http.ts`, `src/theme.ts`, `src/svg.ts`, `src/icons.ts`, `src/readme.ts`
- [x] Design it (spec): `/architect leetcode stats card`
- [x] Build it: `/develop leetcode stats card`
  - [x] LeetCode source, first snapshot, and the solved card live, plus one manual run from GitHub's runner (AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12)
  - [x] Contest card live: stats row, rating line, Top % histogram, `rise` class, shield icon (AC-1, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11)
  - [x] `docs/design.md` updated and every check run, including both themes on GitHub (AC-11, AC-12)
- [x] Verify it: `/check verify leetcode stats card`

## Release 2: Your full story

### 9. Experience & education timeline · done
A timeline of your roles and schools built from your content data (LinkedIn does not share this data with regular developers), with a LinkedIn button to the full profile.
**Done when:** each role shows company, title, dates, and one or two highlights; education shows school, degree, and dates; adding an entry to the data updates the timeline.
spec [0007](../specs/0007-experience-education-timeline/index.md) · design in [`docs/design.md`](../design.md)
code in `src/sections/timeline.ts`, `src/svg.ts` (`wrapLines`), `src/guards.ts` (`checkReadmeAssets`), `src/theme.ts` (`timelineCard`)
- [x] Design it (spec): `/architect experience & education timeline`
- [x] Build it: `/develop experience & education timeline`
  - [x] Both timeline cards live: theme values, `wrapLines`, sort and dates, rail and dots, alt text, linked cards under their headings (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-14, AC-15)
  - [x] LinkedIn button reusing the contact files, plus the README asset reference guard (AC-10, AC-11)
  - [x] Content caps, `docs/design.md` updated, and every check run, including both themes on GitHub (AC-12, AC-13, AC-15)
- [x] Verify it: `/check verify experience & education timeline`

### 10. Credly badge grid · done
Every Credly badge you have earned, shown as a grid of badge images, each linking to its Credly page, updated automatically when you earn a new one.
**Done when:** all current badges appear, a newly earned badge shows up after the next refresh with no manual edit, and a failed refresh keeps the last good grid.
spec [0008](../specs/0008-credly-badge-grid.md) · design in [`docs/design.md`](../design.md) · code in `src/sources/credly.ts`, `src/sections/credly.ts`, `data/snapshots/credly.json`, `src/sources/http.ts` (`USER_AGENT`), `src/content.ts` (`checkText`), `src/svg.ts` (`outsideImage`), `src/theme.ts` (`credlyGrid`), `src/readme.ts`
- [x] Design it (spec): `/architect credly badge grid`
- [x] Build it: `/develop credly badge grid`
  - [x] Credly source, first snapshot, and the badge grid live, plus one manual run from GitHub's runner (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9)
  - [x] See all button, `docs/design.md` updated, and every check run, including lychee in CI and both themes on GitHub (AC-7, AC-9)
- [x] Verify it: `/check verify credly badge grid`

### 11. LeetCode badges & heatmap · done
Grows the LeetCode section with your earned LeetCode badges and a submission heatmap (a calendar grid colored by how much you solved each day). Builds on the data source decided in feature 8.
**Done when:** badges and the heatmap show current data, match both themes, and refresh with the stats card.
spec [0009](../specs/0009-leetcode-badges-heatmap.md) · design in [`docs/design.md`](../design.md)
code in `src/sources/leetcode.ts`, `data/snapshots/leetcode.json`, `src/dates.ts`, `src/sections/leetcode.ts`, `src/sections/leetcode-badges.ts`, `src/sections/leetcode-heatmap.ts`, `src/sections/leetcode-text.ts`, `src/theme.ts` (`badgesCard`, `badgeRow`, `heatmap`)
- [x] Design it (spec): `/architect leetcode badges & heatmap`
- [x] Build it: `/develop leetcode badges & heatmap`
  - [x] LeetCode source extended (badges, active badge, calendar, `asOf`) and the new snapshot committed, with no change to the current output (AC-2, AC-3)
  - [x] Badges card beside the solved card and the badge image row live, with the month table moved to `src/dates.ts` (AC-1, AC-4, AC-5, AC-8, AC-9, AC-10)
  - [x] Heatmap card live: window, month blocks, levels, legend, and the three stats (AC-1, AC-6, AC-7, AC-8, AC-9, AC-10)
  - [x] `docs/design.md` updated and every check run, including lychee in CI, a manual run from GitHub's runner, and both themes on GitHub (AC-11, AC-12)
- [x] Verify it: `/check verify leetcode badges & heatmap`

## Release 3: Your work on GitHub

### 12. GitHub stats & streak · needs a decision
Your commit streak, top languages, and contribution stats as themed cards.
**Done when:** the cards show current numbers, match both themes, and still load if an outside card service is down or rate limited (refuses requests after too many).
- [ ] Design it (spec): `/architect github stats & streak`

### 13. Animated contribution graph · needs a decision
The signature animation: your GitHub contribution graph turned into an animation, regenerated on a schedule.
**Done when:** the animation shows your real contribution history, has a light and a dark version, and regenerates on schedule.
- [ ] Design it (spec): `/architect animated contribution graph`

### 14. Featured projects
Three to six project cards with a short description and tech used, each linking to the repo or live demo.
**Done when:** the cards read from your content data, links work, and the layout holds in both themes.
- [ ] Build it: `/develop featured projects`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Visitor counter**: shows how many people viewed your profile.
- **Second language greeting**: a short greeting line in a second language (for example, Vietnamese).
- **Schedule health check** (from spec 0001): about 60 days after launch, confirm GitHub has not disabled the scheduled workflow. If it has, switch the keepalive to the "enable workflow" API via `/architect`.

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on the profile repo feature), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
