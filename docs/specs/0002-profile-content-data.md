# 0002. Typed content modules in `content/`, checked at build time

**Date**: 2026-11-16
**Status**: Accepted

## Summary

Everything you write about yourself (name, title, bio, intro phrases, links, tech stack, roles, schools, projects) lives in a few small TypeScript files in `content/`, one per topic. Types catch typos when you run `pnpm typecheck`, and a content check inside `pnpm build` catches what types can't, such as a bad date, a third highlight, or a seventh project. The projects list may be empty, since Loc has no featured projects yet. If any rule fails, the build writes nothing and lists every problem at once. Sections only read this data, so changing a role or project never touches layout.

## Context

Spec 0001 left `content/profile.ts` as a starter with only `name` and `title`, and gave this feature the job of deciding the real shape and format. Ten planned sections (features 5 to 14) read from this data, and three outside sources (LeetCode, Credly, GitHub) need your usernames. A missing or misspelled field shows up as a blank or broken card on a public page that recruiters visit.

Forces:
- Node strips types without checking them, so `pnpm build` runs even when the content has a type error. Only `pnpm typecheck` (the commit hook and CI) catches type errors. Rules like "start before end" or "at most 6 projects" are not type errors at all.
- Loc has no featured projects yet, so the profile must ship with an empty projects list and add projects later without a code change.
- The project has no runtime dependencies, and `AGENTS.md` asks for `readonly` data typed with `as const satisfies`.
- Output must be deterministic, so no check may depend on the clock.
- The same text goes into Markdown, HTML, and SVG (typing intro, cards), and each needs different escaping.
- The repo is public. Every value in `content/`, including the email address, is public.

## Requirements

**User stories**:
- As Loc, I want one place to edit everything I say about myself, so that I never touch README layout.
- As Loc, I want a wrong edit (typo, bad date, too many items) to fail loudly before it reaches my profile, with every problem listed at once.
- As a section or source author, I want typed, checked data with one username per account, so that a button and a fetcher can never disagree.

**Acceptance criteria**:
- **AC-1**: `content/` holds `types.ts`, `profile.ts`, `stack.ts`, `experience.ts`, `education.ts`, `projects.ts`, and `index.ts`. The data files export `profile` (`as const satisfies Profile`), `stack` (`Stack`), `experience` (`readonly Role[]`), `education` (`readonly School[]`), and `projects` (`readonly Project[]`). `content/index.ts` imports them and exports `export const content = { profile, stack, experience, education, projects } as const satisfies Content`. `src/types.ts` imports `Content` with `import type` from `../content/types.ts`. The types match the *Data model sketch* below field for field, and `pnpm typecheck` passes.
- **AC-2**: Every planned section's data has a home in `Content`, as listed in *Section coverage* below. No feature from 5 to 14 needs a new content field to start building (it may still add one through `/architect`).
- **AC-3**: The files hold Loc's real content, collected at `/develop` (no sample or lorem text). `profile.name` is `"Loc Nguyen"`, `profile.title` is `"Cloud Developer"`, and `accounts.github` is `"nguyen-duc-loc"`, unless Loc changes them. `projects` is an empty list until Loc has projects to feature.
- **AC-4**: The placeholder section reads `content.profile`. With unchanged name and title, `pnpm build` produces a `README.md` byte identical to the current one, and `git status` is clean after it.
- **AC-5**: `pnpm build` runs `checkContent` before rendering. When any rule in *Key invariants* fails, the build exits non zero, prints `build failed: content check failed, nothing was written:` (the `build failed: ` prefix comes from the existing catch block in `src/build.ts`) followed by one `  - <path>: <problem>` line per problem, worded and pathed as in *Problem reporting*, and leaves `README.md` and `assets/generated/` untouched. `pnpm refresh` runs the same check first and stops before any fetch, with the same message under its own `refresh failed: ` prefix.
- **AC-6**: A content file with several broken rules reports all of them in one run, in the order defined in *Problem reporting*.
- **AC-7**: A misspelled or missing required field, or a wrong value type, in any content file fails `pnpm typecheck`.
- **AC-8**: `profileUrls(content.profile.accounts)` returns `https://github.com/<github>`, `https://www.linkedin.com/in/<linkedin>`, `https://leetcode.com/u/<leetcode>`, and `https://www.credly.com/users/<credly>`. `mailtoUrl(content.profile.email)` returns `mailto:<email>`. Sections and sources get usernames and URLs only through `content` and these helpers.

## Options considered

### Option 1: Typed TypeScript modules split by topic, plus a build time content check

One `as const satisfies` constant per topic file, joined in `content/index.ts`, and a pure `checkContent` that runs in `build`.

**Pros**: no parser and no dependency. Editor and `tsc` catch typos. Small diffs per section feature. The rules that types can't express are enforced on every build.
**Cons**: editing TypeScript is a little noisier than YAML (quotes, commas). Every rule is stated twice, once as a type and once as a runtime check.

### Option 2: One TypeScript file, types only

Grow the starter `content/profile.ts` and trust `tsc`.

**Pros**: the least code.
**Cons**: one long file that every section feature edits. A bad date or a seventh project reaches the live page on push, because Node doesn't type check and no rule checks values.

### Option 3: YAML file with a parser and a schema check

**Pros**: the nicest format to edit, with comments.
**Cons**: adds the first runtime dependency and a schema library or a hand written validator. You lose editor type feedback.

### Option 4: JSON file with a hand written validator

**Pros**: no dependency.
**Cons**: no comments and no type feedback while editing. The validator has to do all the work that types would do.

## Decision

**Chosen option**: Option 1: Typed TypeScript modules split by topic, plus a build time content check.

Content is plain text in typed `readonly` modules under `content/`. `src/content.ts` holds the pure `checkContent`, `profileUrls`, and `mailtoUrl`, and `build` refuses to write when the check fails.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for type stripping limits on the content modules.

## Rationale

The deciding force is that Node runs without type checking. Types alone (Option 2) protect only when the hook or CI runs, and they can't express counts, lengths, or date order. The content check closes that gap on every build, with the same "a failed guard writes nothing" behavior `build` already has for the README guards. TypeScript beats YAML and JSON (Options 3 and 4) because it keeps the zero runtime dependency rule and gives the editor feedback that spec 0001 chose TypeScript for. Splitting by topic keeps each section feature's change inside one file. The runner up is Option 2, which is acceptable only if you never push without the hook.

Plain text over inline Markdown: the same string goes into SVG, where Markdown doesn't render, and a stray `|` or `*` could break a table. Usernames over full URLs: the fetchers need the usernames, so storing them once means a button link and a fetcher can never disagree.

## Feature design

**Data model sketch** (all fields `readonly`, all arrays `readonly T[]`; `YearMonth` is `` `${number}-${number}` `` for editor hints, with the strict format enforced by `checkContent`. If `"2024-01"` does not satisfy that type under TypeScript 7, use `string` instead):

| Entity (file, type) | Field | Type | Required |
|---|---|---|---|
| Profile (`profile.ts`, `Profile`), exactly 1 | `name` | string | yes |
| | `title` | string | yes |
| | `location` | string, city and country | yes |
| | `bio` | string | yes |
| | `typingPhrases` | string[] | yes |
| | `accounts` | `Accounts` | yes |
| | `email` | string | yes |
| Accounts (inside Profile, `Accounts`), 1:1 | `github`, `linkedin`, `leetcode`, `credly` | string (username) | yes, all four |
| Stack (`stack.ts`, `Stack`), exactly 1 | `languages`, `frameworks`, `tools`, `cloud` | `StackItem[]`, 1 to 8 items each (spec 0005) | yes, all four |
| StackItem (`StackItem`), 1:N per category | `name` | string | yes |
| | `icon` | `IconName`, a key of the icon registry in `src/icons.ts` (superseded by [spec 0005](0005-tech-stack-cards.md); was a free string holding a Simple Icons slug) | optional (a brand with no icon, like AWS, shows as a name only chip, per spec 0005) |
| Role (`experience.ts`, `experience: Role[]`), 1:N | `company`, `title` | string | yes |
| | `start` | `YearMonth` | yes |
| | `end` | `YearMonth \| null` (`null` = current) | yes |
| | `highlights` | string[] | yes |
| | `location` | string | optional |
| | `companyUrl` | string (https) | optional |
| School (`education.ts`, `education: School[]`), 1:N | `school`, `degree` | string | yes |
| | `field` | string (field of study) | optional |
| | `start`, `end` | as Role | yes |
| | `note` | string (honors or GPA) | optional |
| Project (`projects.ts`, `projects: Project[]`), 0 to 6 | `name`, `description` | string | yes |
| | `tech` | string[] (free names, not linked to Stack) | yes |
| | `repoUrl`, `demoUrl` | string (https) | optional, at least one |

`Content` (`content/index.ts`) is `{ profile, stack, experience, education, projects }`. All types live in `content/types.ts`. Two jobs at the same company are two `Role` entries.

**Section coverage**:

| Feature | Reads |
|---|---|
| 5 Header and typing intro | `profile.name`, `profile.title`, `profile.typingPhrases` |
| 6 About me and contact links | `profile.bio`, `profile.location`, `profileUrls` (LinkedIn, Credly, LeetCode), `mailtoUrl`. GitHub gets no button |
| 7 Tech stack | `stack` |
| 8, 11 LeetCode | `accounts.leetcode` |
| 9 Timeline | `experience`, `education`, LinkedIn URL |
| 10 Credly | `accounts.credly` |
| 12, 13 GitHub | `accounts.github` |
| 14 Featured projects | `projects` (renders no section when the list is empty) |

**API surface** (module exports, no network):

| Export | Signature | Used by | Failure |
|---|---|---|---|
| `content` (`content/index.ts`) | `Content` constant | `build.ts`, source fetchers | type error at `pnpm typecheck` |
| `checkContent` (`src/content.ts`) | `(c: Content) => readonly string[]`, pure | `build.ts` before render, `refresh.ts` before any fetch | returns problem lines. The caller throws a plain `Error` with them, as the existing README guard does |
| `profileUrls` (`src/content.ts`) | `(a: Accounts) => { github, linkedin, leetcode, credly }` (strings) | sections | none (inputs already checked) |
| `mailtoUrl` (`src/content.ts`) | `(email: string) => string` | sections | none |
| `BuildContext` (`src/types.ts`) | `{ content: Content; snapshots }` (replaces `profile`) | every section | type error |

**Value sourcing**:

| Action | Value | Source |
|---|---|---|
| Content files | every personal value | Loc, collected by `/develop` (resume or LinkedIn text is fine) |
| Content files | `accounts.github` | `"nguyen-duc-loc"` (spec 0001 repo owner) |
| Content files | `name`, `title` | `"Loc Nguyen"`, `"Cloud Developer"` (spec 0001) |
| Content files | `email` | Loc, at `/develop`: an address he is happy to have public |
| `profileUrls` | the four URLs | derived from `accounts` with the fixed URL patterns in AC-8 |
| `checkContent` | each problem line | *Problem reporting* below (path, wording, order) |
| `build` | README name and title | `content.profile` |

**Key invariants** (`checkContent` enforces every one. Lengths count characters as code points, `[...s].length`):

| Applies to | Rule |
|---|---|
| Every text field (all strings except URLs, usernames, `icon`, dates, `email`) | not empty. No leading or trailing whitespace (`s !== s.trim()` fails). No line break (`\r`, `\n`, `\u2028`, `\u2029`). Composed Unicode form (`s === s.normalize("NFC")`), so pasted Vietnamese text keeps stable lengths and bytes. Plain text: Markdown and HTML characters are allowed, and sections escape them |
| Short text (`name`, `title`, `location`, `company`, role `title`, `school`, `degree`, `field`, stack `name`, project `name`, each `tech` name) | at most 80 characters |
| `bio` | at most 300 characters (aim for 1 to 3 sentences; the sentence count isn't checked) |
| `typingPhrases` | 2 to 5 items, each at most 40 characters, no duplicates |
| `accounts.github` | `^[A-Za-z0-9][A-Za-z0-9-]{0,38}$` |
| `accounts.linkedin` | `^[A-Za-z0-9-]{3,100}$` (use an ASCII custom profile URL) |
| `accounts.leetcode` | `^[A-Za-z0-9_-]+$` |
| `accounts.credly` | `^[A-Za-z0-9._-]+$` |
| `email` | `^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$` |
| Stack | each category has 1 to 8 items. Item `name` is unique across all categories. `icon`, when set, is a key of the icon registry in `src/icons.ts`, checked with `Object.hasOwn`. The count and `icon` rules are superseded by [spec 0005](0005-tech-stack-cards.md) (AC-6, AC-7); they were "at least 1 item" and `^[a-z0-9]+$` |
| `start`, `end` | match `^\d{4}-(0[1-9]\|1[0-2])$`. When `end` is set, `start <= end` (string comparison) |
| `experience` | at least 1 role. `highlights` has 1 or 2 items, each at most 120 characters |
| `education` | at least 1 school. `note` at most 120 characters |
| `projects` | 0 to 6 items (an empty list is valid). Names unique. `description` at most 120 characters. `tech` has 1 to 5 names, unique within the project. At least one of `repoUrl`, `demoUrl` |
| Every URL field | matches `^https://\S+$` and `URL.canParse` succeeds |
| Uniqueness (everywhere) | compares `s.toLowerCase()` |
| Dates and the clock | no "not in the future" rule, since that would make the build depend on today's date |
| Shape errors | not checked at run time. A missing list makes `checkContent` throw a `TypeError` before anything is written, which is accepted: `pnpm typecheck` (AC-7) owns shape |

**Problem reporting** (`checkContent` output, the contract for AC-5 and AC-6):
- Path: JS notation from the `content` root without the `content.` prefix, 0 based indexes (`experience[1].highlights[0]`). A count rule reports the list (`projects`). A duplicate reports the later item (`stack.tools[2].name`) and names the earlier one. Start after end reports `<entry>.end`. A project with no link reports `projects[i]`.
- Order: top level order `profile`, `stack`, `experience`, `education`, `projects`. Within an entity, fields in *Data model sketch* order (stack categories `languages`, `frameworks`, `tools`, `cloud`). A list level problem comes before its items' problems. Several problems on one field follow the order of the rule table above.
- Wording (fill in `N`, `M`, `K`, `<path>`, `<pattern>`): `must not be empty` · `must not start or end with whitespace` · `must not contain a line break` · `must be in NFC form` · `must be at most N characters (is M)` · `must have N to M items (has K)` (or `must have at least N items (has K)`, or `must have at most N items (has K)` when the list may be empty, as `projects` may) · `duplicate of <path>` · `must match <pattern>` · `must be an icon in src/icons.ts` (stack `icon`, from spec 0005) · `must be an https URL` · `start must not be after end` · `needs repoUrl or demoUrl`.

Contracts for the section features (written here, built there):
- Feature 9 sorts roles and schools newest `start` first. On a tie, a current entry (`end: null`) comes first, then the later `end`, then file order (stable sort). `end: null` displays as "Present". Feature 9 decides whether roles and schools share one timeline or show as two lists.
- Projects and each stack category render in file order.
- Feature 14 renders nothing (no heading, no empty state) when `projects` is empty, so the README never shows an empty Featured projects section.
- Every section escapes content text for where it lands: HTML entities in Markdown and HTML, XML entities in SVG, and Markdown special characters where text sits in Markdown.

**Security model**: The repo and every value in `content/` are public. The email is public on purpose, and Loc picks an address he accepts spam on. Never put a phone number, street address, or anything private in `content/`. `location` stays at city and country level. No secrets and no tokens.

**Configuration required**: none.

**Critical test scenarios**:
- Happy path: with real content, `pnpm typecheck` and `pnpm build` pass and `README.md` is byte identical, verifies **AC-1**, **AC-3**, **AC-4**.
- Failure case: add a third highlight to a role, set one `start` after its `end`, and add a temporary project whose `repoUrl` uses `http://`. `pnpm build` exits non zero, lists all three problems with their paths, and `git status` shows only the content edit. `pnpm refresh` with the same edit stops before any fetch, verifies **AC-5**, **AC-6**.
- Empty projects: with `projects` as `[]`, `pnpm build` passes and reports no problem for `projects`, verifies **AC-3**, **AC-5**.
- Typo: rename `highlights` to `highlight` in one role. `pnpm typecheck` fails, verifies **AC-7**.
- Links: `node -e` (or a short script) calling `profileUrls` on the real accounts prints the four expected URLs, verifies **AC-8**.
- Coverage: walk *Section coverage* against the scope rows 5 to 14, verifies **AC-2**.

## Build plan

Skateboard: the first milestone ships a complete, live content layer with the README unchanged, and the second adds the safety check on top. Each milestone leaves `main` green and shippable.

1. **Milestone 1: content modules with your real content, wired into build.**
   1. Ask Loc for his content (resume or LinkedIn paste, the public email, and the LinkedIn, LeetCode, and Credly usernames) and map it into the model. If a required item is missing or breaks a rule (for example a highlight over 120 characters, or a non ASCII LinkedIn slug), stop and ask Loc. Never invent content or loosen a rule to get past it, satisfies **AC-3**.
   2. Write `content/types.ts` with every type in the data model, and remove the `Profile` type from `content/profile.ts`. Confirm `"2024-01"` satisfies `YearMonth`, satisfies **AC-1**, **AC-7**.
   3. Write the five data files and `content/index.ts`, each as `as const satisfies`, satisfies **AC-1**, **AC-2**, **AC-3**.
   4. Change `BuildContext` to `{ content, snapshots }`, have `build.ts` import `content`, and have the placeholder section read `content.profile`. Confirm `README.md` is byte identical, satisfies **AC-4**.
2. **Milestone 2: content check and link helpers.**
   1. Add `src/content.ts` with `profileUrls` and `mailtoUrl`, satisfies **AC-8**.
   2. Add `checkContent` there, implementing every row of *Key invariants* and *Problem reporting*, satisfies **AC-5**, **AC-6**.
   3. Call it in `build` before rendering and in `refresh` before any fetch. On problems, throw a plain `Error` with `content check failed, nothing was written:` plus the list, before any file is touched or any request is sent, satisfies **AC-5**.
   4. Run the critical test scenarios by hand, then revert the broken edits, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**.

## Consequences

**Positive**:
- Every later section reads typed, checked, real data and never invents a field.
- A bad edit fails on the next build, locally or in CI, with every problem in one list.
- Usernames live once, shared by buttons and fetchers.

**Negative / tradeoffs**:
- Each rule exists twice (a type and a runtime check), and they can drift. A new field needs both.
- Editing TypeScript is slightly fussier than YAML.
- Limits like 120 character highlights may feel tight. Changing one is a small edit to `checkContent`, but it is a code change, not a content change.
- Each section must escape text itself until a shared helper exists.

**Neutral**:
- `content/profile.ts` changes shape, and the `Profile` type moves to `content/types.ts`.
- `refresh` checks content before it fetches, so a username that fails the check is never put into a request URL, and a bad edit stops the daily run before it does any network work. `build` still checks again, since it also runs on its own.

## Follow-up

- [ ] The first section that renders content text (feature 5 or 6) adds one shared escape helper (for example `src/escape.ts`) instead of each section writing its own.
- [x] Settled by [spec 0005](0005-tech-stack-cards.md): icons come from the registry in `src/icons.ts` (no `simple-icons` dependency), an item without `icon` is a name only chip, `icon` is typed as `IconName` and checked against the registry, and AWS has no slug. The original item: Feature 7 decides how a Simple Icons slug becomes a self contained, theme aware icon (and whether to add `simple-icons` as a dev dependency), how an item without `icon` looks, and may tighten the `icon` check to known slugs. Check then which cloud brands still have a slug.
- [ ] Features 6, 7, 9, and 14 each carry their own "edit the data, the README changes" check, which is the scope's done when line for this feature, proven per section.
- [ ] Scope feature 14 still says "three to six project cards". With projects allowed to be empty, `/scope` should reword it (zero to six, hidden when empty) or move it to Deferred until Loc has projects.
- [ ] Spec 0001 says `content/profile.ts` is a starter that feature 3 replaces. `/sync` should mark that settled by this spec.
