// LeetCode submission heatmap (spec 0009, redrawn like LeetCode's by spec 0010; docs/design.md "Heatmap card
// anatomy"): a static full width card with a one line summary (the submission count on the left, active days and
// max streak on the right) over a past year grid, one block per month, a week per column, Sunday on top.
// Days are UTC and the window ends on the snapshot's `asOf`, so the build never reads the clock. Not a section:
// `src/sections/leetcode.ts` places it. Pure: the monthly badge art comes from `ctx.images`.

import { dateOfDay, dayNumber, formatDay, MONTHS, weekdayOfDay } from "../dates.ts";
import { imageKey } from "../images.ts";
import { BADGE_IMAGE, type LeetcodeSnapshot, monthlyBadges } from "../sources/leetcode.ts";
import { card } from "../svg.ts";
import { heatmap as hm, layout, type Theme, typography } from "../theme.ts";
import type { BuildContext } from "../types.ts";
import { badgeImage } from "./leetcode-badges.ts";
import { groupDigits, textTag } from "./leetcode-text.ts";

const SUBMISSIONS = " submissions in the past one year";
const ONE_SUBMISSION = " submission in the past one year";
const ACTIVE = "Total active days: ";
const STREAK = "Max streak: ";
const DAYS_PER_WEEK = 7;

const step = hm.cell + hm.cellGap;
const levelMins = [hm.level1Min, hm.level2Min, hm.level3Min, hm.level4Min] as const;
const opacities = [hm.opacity1, hm.opacity2, hm.opacity3, hm.opacity4] as const;

type Day = { readonly day: number; readonly count: number };

export type HeatmapStats = { readonly submissions: number; readonly active: number; readonly streak: number };

type Window = { readonly first: number; readonly last: number; readonly days: readonly Day[] };

/** The `windowDays` ending on `asOf`, each with its `calendar[]` count or 0. */
function windowOf({ asOf, calendar }: LeetcodeSnapshot): Window {
  const last = dayNumber(asOf);
  const first = last - (hm.windowDays - 1);
  const counts = new Map(calendar.map(({ date, count }) => [dayNumber(date), count]));
  const days = Array.from({ length: hm.windowDays }, (_, i) => ({
    day: first + i,
    count: counts.get(first + i) ?? 0,
  }));
  return { first, last, days };
}

/** Sum, entries, and longest back to back run of the `calendar[]` entries inside the window (AC-7). */
export function heatmapStats(snapshot: LeetcodeSnapshot): HeatmapStats {
  const { first, last } = windowOf(snapshot);
  const dated = snapshot.calendar.map(({ date, count }) => ({ day: dayNumber(date), count }));
  const entries = dated.filter(({ day }) => day >= first && day <= last);
  let streak = 0;
  let run = 0;
  entries.forEach(({ day }, i) => {
    run = i > 0 && day === entries[i - 1].day + 1 ? run + 1 : 1;
    streak = Math.max(streak, run);
  });
  return { submissions: entries.reduce((sum, { count }) => sum + count, 0), active: entries.length, streak };
}

/** 0 for no submissions, else the highest k with `count ≥ level<k>Min`. */
function levelOf(count: number): number {
  return levelMins.reduce((level, min, i) => (count >= min ? i + 1 : level), 0);
}

function cell(x: number, y: number, level: number): string {
  const paint = level === 0 ? 'class="fill-track"' : `class="fill-heat" fill-opacity="${opacities[level - 1]}"`;
  return `<rect x="${x}" y="${y}" width="${hm.cell}" height="${hm.cell}" rx="${hm.cellRadius}" ${paint}/>`;
}

type Block = {
  /** `YYYY-MM`. */
  readonly key: string;
  readonly month: number;
  readonly offset: number;
  readonly days: readonly Day[];
  readonly cols: number;
};

/** The window split into calendar months, oldest first, each with its weekday offset and column count. */
function blocksOf(days: readonly Day[]): readonly Block[] {
  const months: Day[][] = [];
  days.forEach((entry, i) => {
    const month = dateOfDay(entry.day).slice(0, 7);
    if (i === 0 || month !== dateOfDay(days[i - 1].day).slice(0, 7)) months.push([]);
    months[months.length - 1].push(entry);
  });
  return months.map((monthDays) => {
    const offset = weekdayOfDay(monthDays[0].day);
    return {
      key: dateOfDay(monthDays[0].day).slice(0, 7),
      month: Number(dateOfDay(monthDays[0].day).slice(5, 7)) - 1,
      offset,
      days: monthDays,
      cols: Math.floor((offset + monthDays.length - 1) / DAYS_PER_WEEK) + 1,
    };
  });
}

/** Each month's stored badge art, keyed by `YYYY-MM`. */
function monthArtOf(snapshot: LeetcodeSnapshot, images: BuildContext["images"]): ReadonlyMap<string, string> {
  const art = new Map<string, string>();
  for (const [month, badge] of monthlyBadges(snapshot)) {
    const href = images.get(imageKey({ url: badge.icon, size: BADGE_IMAGE.monthly }));
    if (href !== undefined) art.set(month, href);
  }
  return art;
}

function grid(days: readonly Day[], monthArt: ReadonlyMap<string, string>): string {
  const blocks = blocksOf(days);
  const columns = blocks.reduce((sum, { cols }) => sum + cols, 0);
  const width = columns * step - hm.cellGap + (blocks.length - 1) * hm.monthGap;
  const x0 = layout.pad + Math.floor((layout.full - 2 * layout.pad - width) / 2);
  let before = 0;
  return blocks
    .flatMap((block, b) => {
      const blockX = x0 + before * step + b * hm.monthGap;
      before += block.cols;
      const cells = block.days.map(({ count }, k) => {
        const col = Math.floor((block.offset + k) / DAYS_PER_WEEK);
        const row = (block.offset + k) % DAYS_PER_WEEK;
        return cell(blockX + col * step, hm.gridTop + row * step, levelOf(count));
      });
      const center = blockX + (block.cols * step - hm.cellGap) / 2;
      // The month's Daily Coding Challenge badge stands in for its name, as on LeetCode (spec 0010).
      const art = monthArt.get(block.key);
      if (art !== undefined)
        return [...cells, badgeImage(art, center - hm.monthArt / 2, hm.monthY - hm.monthArt / 2, hm.monthArt)];
      if (block.cols < hm.monthMinColumns) return cells;
      const label = textTag(
        { x: center, y: hm.monthY, anchor: "middle", classes: "fill-muted", style: typography.lead },
        MONTHS[block.month],
      );
      return [...cells, label];
    })
    .join("\n");
}

/** `641 submissions in the past one year` on the left; `Total active days: 364   Max streak: 292` on the right. */
function summary(values: HeatmapStats): string {
  const { title, body, strong } = typography;
  const count = `<tspan class="fill-text" font-size="${title.size}" font-weight="${title.weight}">${groupDigits(values.submissions)}</tspan>`;
  const left = textTag(
    { x: layout.pad, y: hm.headY, anchor: "start", classes: "fill-muted", style: body },
    `${count}${values.submissions === 1 ? ONE_SUBMISSION : SUBMISSIONS}`,
  );
  const number = (n: number): string =>
    `<tspan class="fill-text" font-weight="${strong.weight}">${groupDigits(n)}</tspan>`;
  const gap = `<tspan dx="${hm.headGap}">${STREAK}</tspan>`;
  const right = textTag(
    { x: layout.full - layout.pad, y: hm.headY, anchor: "end", classes: "fill-muted", style: body },
    `${ACTIVE}${number(values.active)}${gap}${number(values.streak)}`,
  );
  return `${left}\n${right}`;
}

export function heatmapCardSvg(theme: Theme, snapshot: LeetcodeSnapshot, images: BuildContext["images"]): string {
  const days = windowOf(snapshot).days;
  const body = [summary(heatmapStats(snapshot)), grid(days, monthArtOf(snapshot, images))].join("\n");
  return card(theme, { width: layout.full, height: hm.height, body });
}

const plural = (n: number, one: string, many: string): string => `${groupDigits(n)} ${n === 1 ? one : many}`;

export function heatmapAlt(snapshot: LeetcodeSnapshot): string {
  const { first, last } = windowOf(snapshot);
  const range = `LeetCode submissions from ${formatDay(dateOfDay(first))} to ${formatDay(dateOfDay(last))}`;
  const { submissions, active, streak } = heatmapStats(snapshot);
  if (submissions === 0) return `${range}: no submissions.`;
  return `${range}: ${plural(submissions, "submission", "submissions")} on ${plural(active, "active day", "active days")}, max streak ${plural(streak, "day", "days")}.`;
}
