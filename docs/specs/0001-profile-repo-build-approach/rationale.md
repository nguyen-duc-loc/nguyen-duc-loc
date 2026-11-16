# 0001. Rationale: profile repo and build approach

Decision record for [index.md](index.md). `/develop` does not need this file.

## Context

GitHub shows a profile README only from a public repo whose name exactly matches the username (`nguyen-duc-loc/nguyen-duc-loc`). The scope plans 14 features across three releases: an animated header, LeetCode, Credly, and GitHub stats cards, a timeline built from personal data, and an animated contribution graph. All of it must work in light and dark themes, have alt text, and keep showing the last good version when an outside service fails.

The forces that shaped the choice:
- **Data drives layout.** The scope says changing a role or project in the data must update the README without touching layout. A hand edited README cannot meet that.
- **Outside sources are flaky.** LeetCode and Credly have no stable official API for this use. Public card services rate limit or go down. A failure must never show a broken image.
- **Freshness versus noise.** The data changes slowly (days, not minutes). GitHub's Camo proxy caches external images, so an external URL can show stale data. Committed images linked by relative path don't go through it.
- **GitHub Actions limits.** Scheduled runs can be delayed or dropped at busy times. In public repos they are disabled after 60 days without repository activity. Pushes made with `GITHUB_TOKEN` don't trigger other workflows.
- **Team and cost.** This is one person and a public repo, so the solution has to be free, need no servers, and be something you can fix in ten minutes a year from now.
- **Tools on hand.** Node.js, Python, `gh`, and Docker are all installed locally. You chose pnpm.

Without a decision, every later feature would have to invent its own way to render and refresh, and the profile would end up a patchwork of external card URLs with no shared failure handling.

## Options considered

### Option 1: Generated README, TypeScript on Node.js 26, committed snapshots, one Actions workflow (chosen)

A TypeScript program builds the whole README and its SVGs from a content data file plus committed JSON snapshots of each outside source. One workflow refreshes on a schedule and builds on push, then commits the changes.

**Pros**: data and layout stay fully separate · keeps the last good version automatically (the snapshot) · offline, deterministic build · no Camo staleness · one place for shared rules (alt text, themes) · no build step thanks to type stripping
**Cons**: you own the code for every card (no free cards from third parties) · bot commits in history · Node's type stripping limits which TypeScript features you can use

### Option 2: Hand written README with marker blocks filled in by scripts

You write `README.md` yourself. Small scripts or marketplace actions replace content between `<!-- x:start -->` and `<!-- x:end -->` comments.

**Pros**: the README layout is visible and editable as plain Markdown · many existing actions fill marker blocks · less code at the start
**Cons**: layout and data are mixed together, which fails the scope's "change data without touching layout" rule · each marker action handles failure its own way · the timeline and projects still need a generator anyway

### Option 3: Same pipeline as Option 1, written in Python

A Python generator (with Jinja templates or f-strings) runs in Actions through `setup-python`.

**Pros**: Python is installed and well suited to scripting · a mature ecosystem for templating and HTTP
**Cons**: no type checking of the data without extra tools (mypy plus a schema library) · two runtimes if any Node based SVG tool is used later · the dependency setup in CI is a little heavier

### Option 4: Hand written README using only live third party card services

The README links directly to hosted card services for GitHub stats, LeetCode, and streaks. There is no generator and no workflow.

**Pros**: almost no code · cards update live · fastest to first render
**Cons**: no "last good version". A down or rate limited service shows a broken image, which fails the scope's done criteria for features 8, 10, and 12 · Camo caching makes "live" stale anyway · no Credly or timeline support · the theme and style are out of your control

## Rationale

Option 1 is the only option that meets two scope rules together: "data drives layout" and "keep the last good version when a refresh fails". Option 2 fails the first and Option 4 fails the second. Splitting the work into a networked `refresh` and an offline `build` is what makes the failure rule cheap. The snapshot file is the last good version, so no extra cache or state store is needed.

TypeScript was chosen over Python (Option 3) because the content data becomes a typed object. A typo in a role or a missing field fails `pnpm typecheck` instead of rendering a blank card on the live profile. Node 26 runs `.ts` directly, so there is still no compile step. The engineer chose pnpm over the recommended npm. That is fine. It costs one extra setup action in CI, and the pnpm action landscape is in flux (see Follow-up in `index.md`).

Committing images and linking them by relative path avoids Camo staleness. Each data change also produces a commit, which is activity that may keep the schedule alive. Committing only real changes keeps history readable. The 45 day keepalive commit covers quiet periods. A daily call to GitHub's "enable workflow" API was also considered: it makes no commits, but it needs `actions: write` and is no better confirmed, so the commit stays and the API call is the documented fallback. Whether bot commits count as activity is unconfirmed, so this is flagged rather than assumed. SHA pinning, `permissions: {}`, `persist-credentials: false`, and passing values through `env:` follow the installed `github-actions-hardening` skill, because this job can write to the repo. A pull request check was added after the cross check, so Dependabot updates are type checked and built before you merge them.

## References

**Project sources**:
- `docs/scope/scope.md`: the planning notes (theme aware, alt text, mixed freshness, last good version) and the Skateboard approach
- Installed skills: `node` (type stripping rules), `github-actions-hardening` (SHA pinning, least privilege), `dependabot` (pnpm uses the `npm` ecosystem)

**Practices & standards**:
- Keeping the last good version (serve stale data on failure)
- Deterministic builds (the same input gives the same output, so diffs are meaningful)
- Least privilege tokens and pinned dependencies for CI supply chain safety

**Links** (web verified during the landscape check on 2026-11-16):
- Node.js release schedule: https://github.com/nodejs/Release
- Node.js TypeScript (type stripping): https://nodejs.org/api/typescript.html
- actions/checkout: https://github.com/actions/checkout
- actions/setup-node: https://github.com/actions/setup-node
- Events that trigger workflows (schedule, 60 day rule): https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GITHUB_TOKEN behavior: https://docs.github.com/en/actions/concepts/security/github_token
- GitHub MCP Server: https://github.com/github/github-mcp-server

### Landscape check evidence (2026-11-16)

- Node 26 has been Active LTS since 2026-10-28. Node 24 is in Maintenance. Type stripping is stable and on by default in Node 26.
- `actions/checkout` and `actions/setup-node` are at v7. Since setup-node v6, pnpm caching needs `cache: pnpm`.
- Scheduled workflows run every 5 minutes at most often, support an IANA `timezone` key, run from the default branch, can be delayed or dropped under load, and are disabled after 60 days without activity in public repos. Whether bot commits count as activity is not documented.
- Events caused by `GITHUB_TOKEN` don't start new workflow runs (except `workflow_dispatch` and `repository_dispatch`).
- The pnpm current major is 12. Whether `pnpm/action-setup` (v6) or `pnpm/setup` supports it is unverified.
