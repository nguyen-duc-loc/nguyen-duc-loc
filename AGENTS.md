# nguyen-duc-loc (GitHub profile README)

A generated GitHub profile README. `pnpm build` turns `content/` plus `data/snapshots/` into `README.md` and `assets/generated/`, and a daily GitHub Actions run refreshes outside data and commits the result.

## Stack

- **Language / Runtime**: TypeScript 7 on Node.js 26, run directly with `node file.ts` (type stripping, no compile step)
- **Framework**: none. Each section is a plain TypeScript function that returns a Markdown or SVG string
- **Key dependencies**: no runtime dependencies (built in `fetch` and `node:fs`); dev only `typescript`, `@types/node`; automation in `.github/workflows/profile.yml`
- **Package manager**: pnpm, pinned in `package.json` `packageManager`, lockfile committed

Decided in [spec 0001](docs/specs/0001-profile-repo-build-approach/index.md).

## Build approach

**Skateboard**: ship the smallest complete profile people can visit first, then grow it release by release, keeping it live and shippable at every step.

## Commands

```bash
pnpm install
pnpm build      # offline: content/ + data/snapshots/ -> README.md, assets/generated/
pnpm refresh    # fetch every source in src/sources/index.ts, then build
pnpm typecheck  # tsc --noEmit (Node strips types without checking them)
pnpm lint       # biome check: format, lint, import order (biome check --write fixes)
pnpm lint:md    # markdownlint on README.md
lychee README.md  # optional link check, needs lychee installed (brew install lychee)
# Test: no suite yet; the gate is typecheck + Biome + /check verify
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title/index.md`.

## Rules

- Never edit `README.md` or `assets/generated/` by hand. Only `pnpm build` writes them; change `content/` or `src/` instead.
- Functional style. A section is a pure function `(ctx: BuildContext) => SectionOutput` in `src/sections/<name>.ts`, listed in order in `src/readme.ts`. Sections never touch the network or file system; data is `readonly`, typed with `as const satisfies`; module level values are constants only. I/O lives only in the entry scripts (`build.ts`, `refresh.ts`, `keepalive.ts`) and `src/sources/`.
- Outside data: one fetcher per source in `src/sources/<name>.ts` following the `Source` contract in `src/types.ts`, registered in `src/sources/index.ts`, with its first snapshot committed to `data/snapshots/<name>.json`. `build` never fetches.
- Output is deterministic: no timestamps, random IDs, or unsorted keys; LF line endings and exactly one trailing newline.
- `strict` types, no `any`. Stay inside Node's type stripping subset: `.ts` import extensions, `import type`, no enums, namespaces, parameter properties, or decorators.
- Errors: expected failures at the edges throw typed errors (`HttpError`, `ValidationError` in `src/sources/http.ts`); each entry script catches once and sets `process.exitCode`.
- Named exports only. Folders grouped by role (`src/sections/`, `src/sources/`, `content/`).
- Accessibility: every image is an `<img>` with real `alt` text inside `<picture>` with light and dark versions (Markdown `![]()` is rejected by `src/guards.ts`), WCAG AA contrast in both themes, SVGs self contained (no external fonts or images).
- Conventional commits (`feat:`, `fix(ci):`, `docs(spec):`). Reserved for automation: `chore(refresh)`, `chore(keepalive)`, `chore(deps)`.
- Workflow safety: actions pinned by SHA, no `${{ }}` inside `run:` (pass values through `env:`), never force push, keep `main` free of branch protection (the bot pushes to it).

## Tooling

Chosen here and installed (config in `biome.json`, `.markdownlint-cli2.jsonc`, `lychee.toml`):
- Lint and format: Biome (`biome check` locally, `biome ci` in CI). Biome skips Markdown (markdownlint covers it), `data/snapshots/`, `assets/generated/`, `.kiro/`, and `skills-lock.json`, so it never reformats bot written output.
- Before commit: `simple-git-hooks` runs Biome check on staged files and `pnpm typecheck`. The `prepare` script installs the hook; CI sets `SKIP_INSTALL_SIMPLE_GIT_HOOKS` so bot commits skip it.
- CI (`profile.yml`): `biome ci` after typecheck; after build, markdownlint and lychee check `README.md` in a separate read only `readme` job, on push and pull requests only (never the scheduled refresh), and lychee accepts LinkedIn's status 999.
- Dependencies: pnpm refuses packages published less than a day ago (minimum release age). Pick an older version instead of adding exclusions. A new dependency with an install script needs an `allowBuilds` entry in `pnpm-workspace.yaml`. Biome is pinned exactly, since its formatting changes between versions.
- Tests: none at the Alpha tier. When `/test` adds them, use `node --test`.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Agent skills

- [node](.kiro/skills/node/): `mcollina/skills`, Node.js and native TypeScript (type stripping) practices
- [octocat](.kiro/skills/octocat/): `mcollina/skills`, git and GitHub operations through the `gh` CLI
- [github-actions-hardening](.kiro/skills/github-actions-hardening/): `github/awesome-copilot`, security review of `.github/workflows/`
- [dependabot](.kiro/skills/dependabot/): `github/awesome-copilot`, `.github/dependabot.yml` and Dependabot PRs

MCP servers: github-mcp-server (recommended, connect it with your `gh` login in your Kiro MCP settings)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
