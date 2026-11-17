# Verify: Experience & education timeline · spec 0007 · updated 2026-11-17
_Steps derived from spec 0007 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Open github.com/nguyen-duc-loc in a light and a dark GitHub theme, on desktop and on a phone → the README ends with the Experience heading, the experience card, the Education heading, the education card, and the LinkedIn button, in that order → AC-1
- [x] In both themes on both screens → every word in both cards is readable, nothing runs past a card edge, and no title or school name overlaps its dates → AC-13
- [x] Look at the experience card → Noventiq Vietnam is first with a filled dot and `May 2025 – Present`; CMC Telecom and FPT Software follow with hollow dots → AC-2, AC-6
- [x] Look at each role → title (accent), dates on the right (muted), company with ` · Hanoi, Vietnam` (muted) on one line, then the bullet highlights wrapped at the same indent → AC-3
- [x] Look at the education card → the university name is squeezed but whole, the degree and field are on one row, `High Distinction` is in the accent color, and no text ends in `…` → AC-4, AC-7
- [x] Click the experience card, the education card, and the LinkedIn button under them → each opens `https://www.linkedin.com/in/nguyenducloc404` → AC-10

## Commands
- [x] `pnpm typecheck && pnpm lint && pnpm build && pnpm lint:md` → all pass → AC-13
- [x] Run `pnpm build` a second time, then `git status --short` → no changes → AC-13
- [x] `head -1 assets/generated/timeline-experience-light.svg assets/generated/timeline-education-light.svg` → heights 404 and 212 → AC-8
- [x] `grep -c 'class="[^"]*\(enter\|grow\|gauge\|rise\)' assets/generated/timeline-*.svg` → 0 for every file → AC-13
- [x] `grep -o 'font-size="[0-9]*"' assets/generated/timeline-*.svg | sort -u` → only `font-size="20"` → AC-7
- [x] Read the experience `alt` in `README.md` → starts `Experience: Junior Solutions Sales at Noventiq Vietnam, Hanoi, Vietnam, May 2025 to Present. Advise customers on Amazon Web Services (AWS) solutions in my first full time role. Cloud Engineer at …` → AC-9
- [x] Read the education `alt` in `README.md` → `Education: Engineer's degree, Computer Networks and Data Communications at VNU University of Engineering and Technology, Sep 2021 to Feb 2026. High Distinction. High school diploma at Hong Quang High School, Sep 2018 to Jul 2021.` → AC-9
- [x] Temporarily set FPT Software `end: null`, run `pnpm build` → its dot is filled, its dates read `Jun 2024 – Present`, and it stays last (sorted by `start`); restore → AC-2, AC-5, AC-6
- [x] Temporarily set CMC Telecom `start` and `end` to `2025-01`, run `pnpm build` → its dates read `Jan 2025` alone; restore → AC-5
- [x] Temporarily give CMC Telecom and FPT Software `start: "2025-05"` with ends `2025-08` and `2025-06`, run `pnpm build` → order is Noventiq (current), CMC (later end), FPT; restore → AC-2
- [x] Temporarily put a 70 character word in a highlight, run `pnpm build` → the word sits on its own line with `textLength="734"` and nothing ends in `…`; restore → AC-7
- [x] Temporarily add a fourth role, run `pnpm build` with no change under `src/` → the card grows by its rows × 28 + 24 and the alt text includes the role; restore → AC-8, AC-14
- [x] Temporarily add a seventh role, run `pnpm build` → fails with `experience: must have 1 to 6 items (has 7)` and writes nothing; restore → AC-12
- [x] Temporarily add a fifth school, run `pnpm build` → fails with `education: must have 1 to 4 items (has 5)` and writes nothing; restore → AC-12
- [x] Temporarily rename the About me button base to `contacts-${icon}`, run `pnpm build` → fails with `README references a missing generated asset: contact-linkedin-dark.svg` (and the light file) and writes nothing; restore → AC-11
- [x] `git ls-files assets/generated | grep -c linkedin` → 2 (only About me writes the button files) → AC-10
- [x] Read `src/theme.ts` `timelineCard` and `docs/design.md` "Timeline card anatomy" → the same values; `docs/design.md` lists `wrapLines` in "How sections draw" and "Text fitting" → AC-15

## Value sourcing
- [x] Change a role's `title`, `company`, `location`, or a highlight in `content/experience.ts`, run `pnpm build` → the card and its alt text show the new text → Value sourcing: `content.experience[i]`
- [x] Change a school's `school`, `degree`, `field`, or `note` in `content/education.ts` → the card and its alt text show the new text; remove `field` or `note` → that part disappears from both → Value sourcing: `content.education[i]`
- [x] Reorder the entries in `content/experience.ts` → the card order does not change → Value sourcing: spec 0002 sort contract
- [x] Set a role's `start` to `2025-12` → it reads `Dec 2025`; set it to `2025-01` → `Jan 2025` (month table, year as written) → Value sourcing: month table and `YYYY` part
- [x] Run `pnpm build` with the system clock or `LANG` changed (for example `LANG=vi_VN.UTF-8 pnpm build`) → output is byte identical → Value sourcing: no clock, no locale
- [x] Set `end: null` on a past role → its dates read `Present` and its dot fills; set it back → hollow again → Value sourcing: `end === null`
- [x] Lengthen FPT Software's one line highlight to 120 characters → it wraps to 2 lines and the card grows by 28 → Value sourcing: `wrapLines`, `fitText`, and card height from row count
- [x] Change `profile.accounts.linkedin` → every card link and the button link change to the new URL → Value sourcing: `profileUrls(accounts).linkedin`
- [x] Check the button `<img>` in `README.md` → `src="assets/generated/contact-linkedin-light.svg"` and `width="148"` → Value sourcing: About me files, `button.width + 2 × button.margin`

## Acceptance-criteria coverage
- AC-1: UI step 1 · AC-2: UI step 3, sort commands, reorder step · AC-3: UI step 4 · AC-4: UI step 5 · AC-5: date commands, month table step · AC-6: UI step 3, current role commands · AC-7: UI step 5, font size and long word commands · AC-8: height and fourth role commands · AC-9: both alt text commands · AC-10: UI step 6, LinkedIn file count · AC-11: rename command · AC-12: seventh role and fifth school commands · AC-13: UI step 2, check suite, second build, animation class count · AC-14: fourth role command, content edit steps · AC-15: theme and design doc step
