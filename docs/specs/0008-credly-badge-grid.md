# 0008. Credly badges from the public badges JSON, shown as a grid of linked Credly images grouped by issuer

**Date**: 2026-11-17
**Status**: Accepted

## Summary

A new Certifications section, placed after Education, shows every active Credly badge you hold. Each badge is Credly's own image at 110px, linked to its badge page, and a "see all" button follows the grid. `pnpm refresh` reads Credly's public badges JSON (no token) and saves a small snapshot. Expired badges are left out at that point, so the build never reads the clock. The README points straight at Credly's image files, so no images are stored in this repo. If Credly fails or returns nothing, the last good snapshot stays and the workflow run fails in CI, just like LeetCode.

## Context

Feature 10 has to show every badge, pick up a newly earned one on the next refresh with no manual edit, and keep the last good grid when a refresh fails. The username already lives in `content.profile.accounts.credly` (spec 0002), and spec 0001's `Source` contract plus the spec 0006 pattern (strict `validate`, the same `parse<Name>Snapshot` on read, a username match) already cover the fetch and the fallback.

Forces:
- Credly's official API is for issuing organizations and needs their credentials. The public profile page loads its data from `https://www.credly.com/users/<username>/badges.json`, which answers without a token. On 2026-11-17 it returned HTTP 200 with 9 badges for `nguyenducloc` (5 AWS, 2 Google Cloud, 1 issued by IBM, 1 by The Linux Foundation). Every entry has `id`, `state`, `public`, `issued_at_date`, `expires_at_date`, `image_url`, `badge_template.name`, `badge_template.level`, and `issuer.entities[]`. Pages hold 48 badges (`metadata.per`, which ignores `?per=`), and `metadata` gives `total_count` and `total_pages`. The endpoint is undocumented and can change without notice.
- Each badge has a public page at `https://www.credly.com/badges/<id>` (HTTP 200 to plain `curl`).
- Badge art is a PNG at `images.credly.com/images/<uuid>/<file>`, 45 to 57 KB each, and can be up to 1600 × 1600. The CDN has a resize path (`/size/WxH/`), but sizes exist only when something has already generated them: `340x340` returned 200 for 6 of the 9 badges and a 302 redirect for the other 3, and other sizes were less consistent. The original URL returned 200 for all 9.
- GitHub shows README SVGs through `<img>`, which loads no outside images, and GitHub blocks `data:` images (spec 0006). A PNG can't be put inside a generated card. An `<img>` in the README itself may point at an outside URL. GitHub proxies and caches it, and `docs/design.md` already allows a third party PNG inside `<picture>` with both sources pointing at the same file.
- An image can't hold a clickable link inside it, so each badge needs its own `<img>` to link to its own page.
- Credly text reaching the README (badge names, issuer names, URLs) is untrusted. It lands in HTML attributes.
- Output must be deterministic (`AGENTS.md`), so anything that depends on today's date can't run in `build`.

## Requirements

**User stories**:
- As a recruiter visiting Loc's profile, I want to see his active certifications at a glance, grouped by vendor, so that I can tell which clouds and tools he is certified in.
- As a recruiter, I want each badge to open its Credly page, so that I can check that it is real.
- As a screen reader user, I want each badge's alt text to give its name and issuer, so that I get what a sighted visitor sees.
- As Loc, I want a newly earned badge to appear on its own and an expired one to drop off on its own, and a Credly outage to keep the last good grid, so that I never edit the grid by hand.

**Acceptance criteria**:
- **AC-1**: `src/sources/credly.ts` exports a `credly` source (`name: "credly"`, `sortKey: "id"`) registered in `src/sources/index.ts` after `leetcode`. Its `fetch` sends one `GET <profileUrls(accounts).credly>/badges.json` (no query string, the form verified on 2026-11-17) with the shared `USER_AGENT` header and no token, and returns `{ username, body }`. Only page 1 is read. `pnpm refresh` writes `data/snapshots/credly.json`, and the first snapshot is committed with the code.
- **AC-2**: `validate` first checks every `data[]` entry has a string `state`, a boolean `public`, and an `expires_at_date` that is `null` or a real `YYYY-MM-DD` date. It then keeps only entries with `state: "accepted"` and `public: true` whose `expires_at_date` is `null` or on or after the refresh run's UTC date, and maps each kept entry to the snapshot in *Data model sketch*. Entries it drops get no further checks. Nothing volatile (`updated_at`, `last_updated_at`, `accepted_at`, earner fields) is stored, so a refresh with unchanged Credly data leaves `credly.json` byte for byte the same.
- **AC-3**: `validate` throws a `ValidationError`, so refresh keeps the previous `credly.json` byte for byte, reports `credly: validation failed` in `failed_sources` and the step summary, and the "Fail on failed sources" step fails the CI run (spec 0001), when any of these happens: `metadata.total_pages` is not `1` (message `metadata.total_pages: must be 1, Credly now pages the badges: raise the limit in src/sources/credly.ts`); `data.length` differs from `metadata.total_count`; an entry fails the AC-2 checks; two kept entries share an `id`; zero badges remain after filtering; or any rule in *Data model sketch* fails. An HTTP error, a timeout, or a body that isn't JSON also keeps the snapshot, through the existing spec 0001 retry and reporting.
- **AC-4**: `pnpm build` reads the snapshot only through `parseCredlySnapshot`, which applies every rule in *Data model sketch* and never reads the clock. A hand edited or malformed `credly.json` fails the build with `credly snapshot: <path>: <problem>` and writes nothing, with paths like `badges[3].imageUrl`. When `username` differs from `content.profile.accounts.credly` (ignoring case), the build fails with `credly snapshot is for <snapshot username>, but content has <content username>: run pnpm refresh` and writes nothing.
- **AC-5**: After the timeline section's LinkedIn button block, `README.md` contains `<h2 align="center">Certifications</h2>`, a blank line, a `<p align="center">` block holding every badge from the snapshot, a blank line, and a `<p align="center">` block holding the see all button. Neither block has blank lines inside. Each badge is exactly one line: `<a href="https://www.credly.com/badges/<id>"><picture><source media="(prefers-color-scheme: dark)" srcset="<imageUrl>"><img alt="<name>, issued by <issuer>" src="<imageUrl>" width="110"></picture></a>`, with no line breaks or spaces between tags, no light `<source>`, and no `height`. Every attribute value is passed through `escapeXml` once. The section writes no assets.
- **AC-6**: Badges are grouped by issuer, by order only: all badges share the one wrapping block, with no per issuer line or label. Issuers with more badges come first, and ties go by issuer name. Within an issuer, the order is by level (`Advanced`, `Intermediate`, `Foundational`, then any other value or `null`), then newest `issuedOn` first, then name, then `id`. Strings compare with JavaScript's `<` (UTF-16 code units, as in `src/sections/timeline.ts` and `src/snapshots.ts`), never by locale. With today's data, the order is: Solutions Architect Professional, Solutions Architect Associate, Developer Associate, AI Practitioner, Cloud Practitioner (AWS); Professional Cloud Developer, Associate Cloud Engineer (Google Cloud); Terraform Associate (IBM Professional Certification); FinOps Certified Engineer (The Linux Foundation).
- **AC-7**: The see all button is `<a href="<profileUrls(accounts).credly>">` around a `<picture>` of the existing `contact-credly-light.svg` and `contact-credly-dark.svg` at `width="148"`, with alt text `All badges on Credly`. The section emits only the markup (as `timeline` does with the LinkedIn button), and `checkReadmeAssets` fails the build if those files stop being written.
- **AC-8**: When Credly lists a new badge, the next successful refresh adds it to `credly.json`, and the build places it in the grid by the AC-6 order, with no edit to `content/` or `src/`. A badge whose expiry date has passed drops out on the first successful refresh after that date.
- **AC-9**: `docs/design.md` gains a *Certifications (built by feature 10)* section with the AC-5 markup, the AC-6 order, the alt text format, and the 110px width, and `src/theme.ts` holds that width. `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm lint:md` pass. Lychee in CI passes on the new badge pages and image URLs, or, if Credly fails only because of automation, the failure is confirmed by opening the link by hand and one narrow, commented exclusion is added to `lychee.toml`. On GitHub, in a light and a dark theme, at desktop and phone width, every badge shows, stays readable on the dark background (the PNGs are transparent), wraps cleanly, and opens its Credly page, and a manual "Run workflow" on `main` fetches Credly from GitHub's runner.

## Options considered

### Option 1: A hand kept badge list in `content/`

You add each badge (name, id, image URL) to a content file, and the section draws the grid from it. No fetch.

**Pros**:
- Nothing outside can break the refresh, and it needs no new source.

**Cons**:
- It fails the scope: a new badge needs a manual edit, and expired badges stay until you remove them.

### Option 2: Public badges JSON, README images pointing straight at Credly's PNGs

`pnpm refresh` reads the badges JSON into a snapshot. The section writes one linked `<picture>` per badge, with both sources set to Credly's `image_url`.

**Pros**:
- New and expired badges are handled with no edit. Failures keep the last good snapshot through the existing contract.
- No binary files in the repo and no new asset kind. `docs/design.md` already allows this.
- Each badge links to its own page.

**Cons**:
- The images load from Credly's CDN through GitHub's proxy each time someone views the page. A CDN outage that outlasts GitHub's cache shows a broken image with alt text, and a failed refresh can't prevent that.
- Full size PNGs: about 450 KB in total for 9 badges, shown at 110px.

### Option 3: Public badges JSON, PNGs downloaded by refresh and committed

Refresh also downloads each PNG into the repo, and the README points at the local copies.

**Pros**:
- The grid survives a Credly CDN outage too.

**Cons**:
- Binary files in history, rewritten whenever Credly changes the art.
- A new kind of snapshot that isn't JSON, and changes to the `Source` contract, `build`, and the guards (`build` copies files it never wrote today).
- Still full size PNGs, since the repo has no image resizing and no runtime dependencies.

### Option 4: Public badges JSON, one generated SVG per badge with the PNG embedded

Each badge becomes a light and dark SVG pair holding the PNG as base64.

**Pros**:
- Self contained images in `assets/generated/`.

**Cons**:
- GitHub blocks `data:` images (spec 0006), so the badges would render blank.
- 18 files of about 60 KB each for identical light and dark content.

## Decision

**Chosen option**: Option 2: public badges JSON, README images pointing straight at Credly's PNGs.

`pnpm refresh` saves your active, public, accepted Credly badges to `data/snapshots/credly.json`, and the build draws them as a centered grid of linked Credly images grouped by issuer, followed by the existing Credly pill as a see all button.

**Implementation skills**: `node` (`mcollina/skills`, `.kiro/skills/node/`), for `fetch` with `AbortSignal`, typed errors at the edge, and type stripping rules in the new source and section.

## Rationale

The scope wants a new badge to appear with no manual edit, which rules out Option 1. The badges JSON is the only token free source with every field the grid needs. It fits spec 0001's contract unchanged, so the "last good grid" requirement comes from code that already exists and already works for LeetCode. Option 4 can't render on GitHub at all.

Option 3 protects against one more failure (Credly's image CDN going down), but it costs binary files in history and changes to the source contract, `build`, and the guards, all for a CDN that serves Credly's own profile pages and sits behind GitHub's proxy cache. Option 2 accepts that rarer risk and keeps the feature to one source file, one section file, and a small helper. If a CDN outage ever actually breaks the grid, Option 3 can be added later without changing the snapshot.

The full size `image_url` is used because the resize path is not reliable (3 of 9 badges had no `340x340` copy). Only page 1 (48 badges) is read: with 9 badges, a second page is years away, and paging code could not be tested against real data today. If Credly ever reports more than one page, the refresh fails with a message that says to raise the limit, and the last good grid stays meanwhile. The expiry filter runs in `validate` with the refresh run's UTC date, so the snapshot holds only active badges and `build` stays a pure function of the snapshot. A badge stays visible for at most one day after it expires (until the next daily refresh). Zero badges fails validation, because an empty answer from a profile that had 9 is far more likely a Credly glitch than real data.

Spec 0001 left open whether `pnpm lint:md` should run before refresh commits. It is not needed for this source. Credly text reaches the README only inside escaped attribute values (alt text, `href`, `src`), and the URLs must match fixed patterns, so a refresh can't produce new Markdown structure.

## Feature design

**Data model sketch** (`data/snapshots/credly.json`, written by `validate`, read by `parseCredlySnapshot`; keys sorted and `badges` sorted by `id` through `serializeSnapshot`):

| Field | Type | API source | Rule (checked in `validate` and in `parseCredlySnapshot`) |
|---|---|---|---|
| `username` | string | the username `fetch` used (`content.profile.accounts.credly`) | matches `^[A-Za-z0-9._-]+$` |
| `badges[]` | array of badge objects | `data[]` of page 1, after the AC-2 checks and filter | 1 to 48 entries (one page); `id` unique |
| `badges[].id` | string | `data[].id` | lowercase UUID, `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` |
| `badges[].name` | string | `data[].badge_template.name` | `checkText(path, value, 120)` from `src/content.ts`: not empty, no leading or trailing whitespace, no line break, only characters XML allows and no lone surrogate, NFC, at most 120 code points |
| `badges[].issuer` | string | `data[].issuer.entities[]`: the `entity.name` of the first entry with `primary: true`, else of the first entry. A missing, empty, or non array `entities` fails at `badges[i].issuer` | `checkText(path, value, 100)` |
| `badges[].level` | string or `null` | `data[].badge_template.level`; `mapResponse` turns a missing value, `null`, or `""` into `null` | `null`, or matches `^[A-Za-z][A-Za-z ]{0,29}$` |
| `badges[].issuedOn` | string | `data[].issued_at_date` | `YYYY-MM-DD`, a real calendar date |
| `badges[].expiresOn` | string or `null` | `data[].expires_at_date`; missing fails (AC-2), `null` means it never expires | `null`, or a real `YYYY-MM-DD` date on or after `issuedOn` |
| `badges[].imageUrl` | string | `data[].image_url` | matches `^https://images\.credly\.com/images/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,64}$` |

There is one entity (badge) with no relationships. Nothing derived is stored: the badge page URL, the order, and the alt text are computed when building. The snapshot changes only when a badge is added, expires, is renamed, or gets new art or dates (for example, earning the AWS Professional moved the Cloud Practitioner's expiry to 2029-11-09).

Today's snapshot, shortened:

```json
{
  "badges": [
    {
      "expiresOn": "2029-11-09",
      "id": "0be55577-3faf-47f8-a01d-8f87b02fb49b",
      "imageUrl": "https://images.credly.com/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png",
      "issuedOn": "2025-02-28",
      "issuer": "Amazon Web Services Training and Certification",
      "level": "Foundational",
      "name": "AWS Certified Cloud Practitioner"
    },
    "… 9 badges, sorted by id"
  ],
  "username": "nguyenducloc"
}
```

**Request** (`fetch`):
- `GET https://www.credly.com/users/<accounts.credly>/badges.json`, the base from `profileUrls(content.profile.accounts).credly`, through `fetchJson` with headers `accept: application/json` and `user-agent: <USER_AGENT>`. No query string, no cookie, no token.
- `USER_AGENT` moves from `src/sources/leetcode.ts` to an export in `src/sources/http.ts`, and both sources import it.
- `fetch` doesn't judge the body. It returns `{ username, body }`, and `validate` reports every problem as a `ValidationError`.
- The request uses the `AbortSignal` from `refresh.ts` (15 s), and a retry calls `fetch` again with a fresh signal.

**API surface** (module exports, no HTTP endpoints of our own):

| Export | Signature | Used by | Failure |
|---|---|---|---|
| `credly` (`src/sources/credly.ts`) | `Source<CredlySnapshot>`; `fetch(signal)` per *Request*; `validate(raw)` calls `mapResponse(raw, todayUtc())`, then `parseCredlySnapshot` | `src/sources/index.ts`, `refresh.ts` | `HttpError`, timeout or network `TypeError`, `SyntaxError` on a non JSON body, `ValidationError` (AC-3) |
| `mapResponse` (same file, named export so verify scripts can call it) | `(raw: unknown, today: string) => unknown`, pure; checks `total_pages` and `total_count`, runs the AC-2 checks and filter, and maps | `validate`, verify scripts | `ValidationError` |
| `parseCredlySnapshot` (same file) | `(value: unknown) => CredlySnapshot`, pure, no clock | `validate`, `src/sections/credly.ts` | `ValidationError` as `<path>: <problem>`, `(root): must be an object` |
| `type CredlySnapshot` (same file) | `readonly` object type matching the data model | section | none |
| `USER_AGENT` (`src/sources/http.ts`) | string constant, the value now in `leetcode.ts` | both sources | none |
| `checkText` (`src/content.ts`, now exported, unchanged) | `(path: string, text: string, max: number) => string[]` | `checkContent`, `parseCredlySnapshot` (throws a `ValidationError` with the first problem) | none |
| `outsideImage` (`src/svg.ts`) | `({ src, alt, width }: { readonly src: string; readonly alt: string; readonly width: number }) => string`; returns exactly `<picture><source media="(prefers-color-scheme: dark)" srcset="SRC"><img alt="ALT" src="SRC" width="WIDTH"></picture>` on one line, with `src` and `alt` escaped once by `escapeXml` | section | none |
| `credlyGrid` (`src/theme.ts`) | `{ badgeWidth: 110 } as const satisfies { readonly [name: string]: number }` | section | type error |
| `credlyBadges` (`src/sections/credly.ts`) | `Section`, listed in `src/readme.ts` right after `timeline` | `renderReadme` | throws the AC-4 errors; `build` catches once |

The section imports only `parseCredlySnapshot` and the type from the source module. Module load does no I/O.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| fetch | username and base URL | `profileUrls(content.profile.accounts).credly` (pattern checked by `checkContent`, which `refresh` runs first) |
| fetch | `/badges.json`, headers | constants in `src/sources/credly.ts`; `USER_AGENT` from `src/sources/http.ts` (decided here) |
| fetch | timeout and retry | `refresh.ts` (spec 0001: 15 s, one retry after 2 s on network errors, 5xx, or 429) |
| validate | page and count checks | `metadata.total_pages` (must be 1) and `metadata.total_count` (must equal `data.length`) |
| validate | today's date for the expiry filter | `new Date().toISOString().slice(0, 10)` (UTC), read once in `validate` and passed into `mapResponse` |
| validate | every snapshot field | the API fields in *Data model sketch* |
| build | `credly.json` contents | `ctx.snapshots.get("credly")`, then `parseCredlySnapshot` |
| build | username match | `snapshot.username` vs `content.profile.accounts.credly`, ignoring case |
| section | heading `Certifications` | constant in `src/sections/credly.ts` (decided here) |
| section | badge link | `https://www.credly.com/badges/` plus `id` (constant prefix, decided here), passed through `escapeXml` once |
| section | image `src` and `srcset` | `badges[].imageUrl`, escaped by `outsideImage` |
| section | image width | `credlyGrid.badgeWidth` (110) |
| section | alt text | `<name>, issued by <issuer>`, passed raw to `outsideImage` |
| section | issuer order | badge count per `issuer`, descending, then `issuer` by `<` |
| section | order within an issuer | the level rank constant `["Advanced", "Intermediate", "Foundational"]` (any other value or `null` ranks after), then `issuedOn` descending, then `name`, then `id`, all by `<` |
| section | see all link | `profileUrls(content.profile.accounts).credly`, passed through `escapeXml` once |
| section | see all button files, width, alt | `themedImage` markup only for base `contact-credly` with `render: (theme) => pillButton(theme, { icon: "credly", label: "Credly" })` (its assets are dropped), width `button.width + 2 * button.margin` (148), constant `All badges on Credly` |
| refresh | failure line | spec 0001 reporting (`credly: <status> \| timeout \| network error \| validation failed \| error`) |

**Key invariants**:
- `build` never contacts Credly. Only `refresh` does, and the snapshot changes only after a validated response.
- `validate` and `parseCredlySnapshot` apply the same field rules. Only `validate` runs the raw response checks (page count, `total_count`, AC-2 entry checks) and the expiry filter. A snapshot that passes one passes the other.
- The snapshot always holds 1 to 48 badges with unique ids, so the grid is never empty.
- The build output depends only on the snapshot, content, and constants, never on the clock or locale.
- Every URL in the grid matches a fixed Credly pattern, and every attribute value is escaped exactly once.
- Each `assets/generated/` file is still written by exactly one section: this section writes none.

**Security model**: All data is public Credly profile data, read without a token. There are no secrets, no cookies, and no new workflow permissions. Untrusted text (name, issuer) is limited by length and character rules and escaped by `outsideImage`. Image URLs must be on `images.credly.com/images/`, and badge links are built from a checked UUID, so a changed response can't point the README at another host or inject markup. The browser loads the PNGs through GitHub's image proxy, so visitors never connect to Credly directly.

**Configuration required**: None. No environment variables, secrets, or workflow changes. The existing daily, manual, and push triggers cover this source.

**Edge cases**:
- Credly returns an HTML page (a bot check) instead of JSON: `SyntaxError`, reported as `credly: error`, not retried. The snapshot stays and the CI run fails.
- A wrong or renamed username: Credly answers with a 4xx (`HttpError`, not retried) or a 200 with an empty `data` (the zero badge rule). Either way the snapshot stays. After changing `accounts.credly`, run `pnpm refresh` locally, or the build fails with the AC-4 mismatch message.
- All badges expired or hidden: zero remain, so `ValidationError` and the last good grid stays (see Follow-up if this ever becomes real).
- More than 48 badges (Credly reports `total_pages` of 2 or more): `ValidationError` with the AC-3 "raise the limit" message, and the last good grid stays. Supporting more pages then needs a small spec update.
- A badge with no level, or a new level name: it sorts after `Foundational` within its issuer, and nothing fails.
- A badge earned twice (renewed with a new `id`): both show while both are active. The expired one drops out after its expiry.
- A name with `&`, quotes, or an en dash (`AWS Certified Solutions Architect – Professional`): escaped once, shown as is.
- Credly's CDN unreachable while the API works: the snapshot is fine, and the README shows alt text for uncached images until the CDN recovers (accepted in Consequences).
- A badge that expires today is still shown. It drops out on the first refresh after its expiry date.

**Critical test scenarios** (there is no test suite yet, so the `mapResponse` and `validate` checks run as an uncommitted scratch script during `/check verify`, using a copy of a real response saved to a temp file):
- Happy path: `pnpm refresh` writes `credly.json` with the 9 badges. `pnpm build` adds the heading, the 9 linked badges in the AC-6 order with the AC-5 markup and alt text, and the see all button, and writes no new asset, verifies **AC-1**, **AC-2**, **AC-5**, **AC-6**, **AC-7**.
- No churn: run `pnpm refresh` twice. The second run leaves `credly.json` unchanged, verifies **AC-2**.
- Expiry filter: call `mapResponse` with a recorded response and `today` set to `2028-06-17`. The Developer Associate (expires 2028-06-16) and the badges expiring earlier are gone, and the rest remain, verifies **AC-2**, **AC-8**.
- Wrong username: set `accounts.credly` to `no-such-user-zz9q` and run `pnpm refresh`. It reports a credly failure, `credly.json` is unchanged, and then build fails with the mismatch message. Revert, verifies **AC-3**, **AC-4**.
- Empty answer: call `validate` with a saved response whose `data` is `[]` and `total_count` is `0`. It throws the zero badge error, verifies **AC-3**.
- Second page: call `validate` with a saved response whose `metadata.total_pages` is `2`. It throws the "raise the limit" message, verifies **AC-3**.
- Malformed entry: call `mapResponse` with one entry's `expires_at_date` set to `"2028-13-40"`, and again with `issuer.entities` set to `[]`. Both throw, naming the entry, verifies **AC-2**, **AC-3**.
- Hand edit: set one `imageUrl` to `https://example.com/x.png` in `credly.json`. `pnpm build` fails naming `badges[<i>].imageUrl` and writes nothing. Revert, verifies **AC-4**.
- New badge: add a copy of one badge with a new UUID and an `issuedOn` of today to `credly.json`. The build places it first among that issuer's badges at its level, with no other edit. Revert, verifies **AC-8**.
- GitHub: both themes, desktop and phone width, every badge opens its page, lychee passes in CI, and a manual "Run workflow" on `main` refreshes Credly from the runner, verifies **AC-9**.

## Build plan

Skateboard: the smallest whole is the source plus the grid live on the profile. The button, the design record, and the checks from GitHub follow in the second slice.

1. **Slice 1: source, first snapshot, and the badge grid live.**
   1. Move `USER_AGENT` into `src/sources/http.ts` and import it in `leetcode.ts`, and export `checkText` from `src/content.ts` (no behavior change for either), satisfies **AC-1**, **AC-4**.
   2. `src/sources/credly.ts`: `fetch` per *Request*, `mapResponse` (page and count checks, AC-2 entry checks, filter, mapping, issuer pick, level to `null`), `parseCredlySnapshot` with every rule in *Data model sketch*, and `validate`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
   3. Register `credly` in `src/sources/index.ts` after `leetcode`, run `pnpm refresh` locally, and commit `data/snapshots/credly.json` in the same commit as the source, satisfies **AC-1**.
   4. `outsideImage` in `src/svg.ts` and `credlyGrid` in `src/theme.ts`, satisfies **AC-5**.
   5. `src/sections/credly.ts`: snapshot read with the username check, the AC-6 sort, the heading and badge block with alt text; list `credlyBadges` after `timeline` in `src/readme.ts`, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-8**.
   6. Push, then trigger "Run workflow" on `main` once, to confirm GitHub's runner reaches `credly.com` and the badges render. On a block or a challenge page, stop and revisit with `/architect` (see Follow-up), satisfies **AC-9**.
2. **Slice 2: see all button, design record, and every check.**
   1. The see all button block, reusing the `contact-credly` markup only, satisfies **AC-7**.
   2. `docs/design.md`: the *Certifications (built by feature 10)* section, satisfies **AC-9**.
   3. Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm lint:md`, then push and check lychee in CI (add one commented exclusion to `lychee.toml` only if Credly fails just for automation). Confirm both themes and a phone width on GitHub, satisfies **AC-9**.

## Consequences

**Positive**:
- New and expired badges update on their own, and a failed refresh keeps the last good grid through the existing contract.
- One new source, one section, and a small helper. No binary files, no new dependency, no workflow change.
- Each badge links to proof on Credly, which recruiters can check in one click.

**Negative / tradeoffs**:
- The endpoint is undocumented. A Credly change means a red run every day until the mapping is fixed, and the grid shows the last good badges meanwhile.
- Images load from Credly's CDN at view time, so a long CDN outage shows alt text instead of badges, and refresh can't prevent it.
- About 450 KB of full size PNGs for 9 badges shown at 110px, since the CDN's resized copies are not reliable.
- An expired badge stays visible for up to one day, until the next daily refresh.
- Lychee now checks 18 more Credly URLs on every push, which adds a little CI time and one more site that could start blocking automation. It runs only on your pushes and pull requests, so a badge URL added by a bot refresh commit is first checked on your next push.
- Only one page (48 badges) is read. Going past that fails the refresh until the source learns to page.
- Grouping by issuer count means a new issuer with more badges can reorder whole groups, which is intended but may surprise you.

**Neutral**:
- `USER_AGENT` moves into `src/sources/http.ts`, and feature 12's source can import it too. `checkText` becomes a shared export of `src/content.ts`, so outside text and content text follow the same rules.
- `outsideImage` is available to feature 11 for LeetCode's badge PNGs, which spec 0006 says must load as their own `<img>`.
- Spec 0001's open question about `pnpm lint:md` before refresh commits is answered "not needed" for Credly (see Rationale).

## Follow-up

- [ ] Slice 1 (task 1.6) confirms GitHub's runner can reach `credly.com`. If it gets a 403 or a challenge page on repeated runs, revisit with `/architect`.
- [ ] Spec 0001's Follow-up item about `pnpm lint:md` before refresh commits: answered for Credly here. `/sync` may note it on that item, which stays open for feature 12.
- [ ] If Credly's image CDN ever breaks the grid for real, revisit with `/architect` to commit local copies (Option 3). The snapshot shape doesn't need to change.
- [ ] If you ever hold zero active badges, the zero badge rule (AC-3) will keep showing the last ones. Revisit with `/architect` to drop the section instead.
