# Verify: Profile repo & build approach · spec 0001 · updated 2026-11-16
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Visit github.com/nguyen-duc-loc (signed out, and in light and dark theme) → the README shows the header banner with "Loc Nguyen" and "Cloud Developer", then the typing line (the placeholder output was replaced by feature 5) → AC-1
- [ ] On GitHub, open the first commit → it already contains `README.md` → AC-1
- [ ] Edit only `title` in `content/profile.ts`, push without rebuilding → the push run commits `README.md` as `github-actions[bot]` with `chore(refresh): update generated profile`, and the profile shows the new title → AC-3 (title row of Value sourcing)
- [ ] Edit only `name` in `content/profile.ts`, push without rebuilding → the profile shows the new name → AC-3 (name row of Value sourcing)
- [ ] Actions tab, "Run workflow" on `main` with nothing changed → the run is green and creates no commit → AC-4
- [ ] `.github/workflows/profile.yml` has `cron: "17 19 * * *"` and no `timezone` key; the next scheduled run starts shortly after 19:17 UTC (02:17 in Vietnam), not near 02:17 UTC → AC-4 (schedule row of Value sourcing)
- [ ] "Run workflow" on a branch other than `main` → it builds and refreshes, and pushes nothing → AC-3 (main only rule)
- [ ] Open a PR that edits `src/sections/header.ts` without running `pnpm build` → the PR check fails at "Check the build changed nothing" and pushes nothing → AC-9
- [ ] Open a PR that edits a section and includes the rebuilt `README.md` → the PR check passes → AC-9
- [ ] Within a week, Dependabot opens grouped `chore(deps)` PRs for `github-actions` and `npm`, and the PR check runs on them → AC-7, AC-9
- [ ] Settings, Actions, General: default workflow permissions are "Read repository contents"; `main` has no branch protection or rulesets → Configuration required

## Commands
- [ ] Fresh clone: `pnpm install` then `pnpm build` → `git status --porcelain` is empty; run `pnpm build` again → still empty → AC-2
- [ ] Turn off the network, run `pnpm build` → it succeeds → AC-2
- [ ] Add `<img src="x.svg">` to a section, run `pnpm build` → it fails naming the tag, and `README.md` is unchanged; repeat with `alt="  "` and with `![x](x.png)` → AC-8
- [ ] `pnpm refresh` with the empty registry → prints `0 of 0 sources updated` and rebuilds; with `GITHUB_OUTPUT` set, it appends an empty `failed_sources=` line → AC-5 (end to end check waits for features 8, 10, 12)
- [ ] `node src/keepalive.ts --days 0` → rewrites `.github/last-refresh` with today's UTC date, `git log` shows no new commit → AC-6 (keepalive date row of Value sourcing)
- [ ] `node src/keepalive.ts --days 45` right after a commit → writes nothing → AC-6 (threshold row of Value sourcing)
- [ ] `node src/keepalive.ts --days 0` in a folder that is not a git repo → fails with a clear message → AC-6
- [ ] `grep -n 'uses:' .github/workflows/profile.yml` → every line is pinned to a 40 character SHA with a `# vX.Y.Z` comment; top level `permissions: {}`, job `contents: write` only → AC-7
- [ ] `grep -n '\${{' .github/workflows/profile.yml` → no match sits inside a `run:` script, only in `if:`, `env:`, or `with:` → AC-7 (security model)

## Acceptance-criteria coverage
- AC-1: profile visit, first commit check
- AC-2: fresh clone double build, offline build
- AC-3: title push, name push, non `main` manual run
- AC-4: manual run with no change, schedule listing
- AC-5: empty registry refresh (full check deferred to features 8, 10, 12)
- AC-6: keepalive `--days 0`, `--days 45`, outside git
- AC-7: SHA pins, permissions, no interpolation in `run:`, Dependabot PRs
- AC-8: alt text guard with three bad inputs
- AC-9: PR without rebuild fails, PR with rebuild passes, Dependabot PR check
