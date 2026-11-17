// LeetCode submission heatmap (spec 0009, docs/design.md "Heatmap card anatomy"): a static full width card with
// three stats over a past year grid drawn like LeetCode's, one block per month, a week per column, Sunday on top.
// Days are UTC and the window ends on the snapshot's `asOf`, so the build never reads the clock. Not a section:
// `src/sections/leetcode.ts` places it. Pure.

import { dateOfDay, dayNumber, formatDay, MONTHS, weekdayOfDay } from "../dates.ts";
import type { LeetcodeSnapshot } from "../sources/leetcode.ts";
import { card, fitText } from "../svg.ts";
import { heatmap as hm, layout, type TextSlot, type Theme, typography } from "../theme.ts";
import { groupDigits, textTag } from "./leetcode-text.ts";

const LABELS = { submissions: "Submissions (past year)", active: "Active days", streak: "Max streak" } as const;
const LESS = "Less";
const MORE = "More";
const DAYS_PER_WEEK = 7;
/** Every heatmap text is at least this size (full width images use 20px and up). */
const MIN_TEXT = 20;

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
  const paint = level === 0 ? 'class="fill-track"' : `class="fill-accent" fill-opacity="${opacities[level - 1]}"`;
  return `<rect x="${x}" y="${y}" width="${hm.cell}" height="${hm.cell}" rx="${hm.cellRadius}" ${paint}/>`;
}

type Block = { readonly month: number; readonly offset: number; readonly days: readonly Day[]; readonly cols: number };

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
      month: Number(dateOfDay(monthDays[0].day).slice(5, 7)) - 1,
      offset,
      days: monthDays,
      cols: Math.floor((offset + monthDays.length - 1) / DAYS_PER_WEEK) + 1,
    };
  });
}

/** Character width estimate `0.6 × size`, in integers so the result never depends on float rounding. */
const textWidth = (text: string, size: number): number => Math.ceil((3 * size * [...text].length) / 5);

function grid(days: readonly Day[]): string {
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
      if (block.cols < hm.monthMinColumns) return cells;
      const center = blockX + (block.cols * step - hm.cellGap) / 2;
      const label = textTag(
        { x: center, y: hm.monthY, anchor: "middle", classes: "fill-muted", style: typography.lead },
        MONTHS[block.month],
      );
      return [...cells, label];
    })
    .join("\n");
}

function legend(): string {
  const { lead } = typography;
  const right = layout.full - layout.pad;
  const lastEnd = right - hm.legendGap - textWidth(MORE, lead.size);
  const firstX = lastEnd - hm.cell - opacities.length * step;
  const y = hm.legendY - hm.cell / 2;
  const cells = Array.from({ length: opacities.length + 1 }, (_, level) => cell(firstX + level * step, y, level));
  const text = (x: number, inner: string): string =>
    textTag({ x, y: hm.legendY, anchor: "end", classes: "fill-muted", style: lead }, inner);
  return [text(firstX - hm.legendGap, LESS), ...cells, text(right, MORE)].join("\n");
}

function stats(values: HeatmapStats): string {
  const stat = (x: number, width: number, label: string, value: number, classes: string, style: TextSlot["style"]) => {
    const labelSlot = { width, style: typography.lead, minSize: MIN_TEXT } as const satisfies TextSlot;
    const valueSlot = { width, style, minSize: MIN_TEXT } as const satisfies TextSlot;
    const shown = groupDigits(value);
    return [
      textTag(
        {
          x,
          y: hm.labelY,
          anchor: "start",
          classes: "fill-muted",
          style: labelSlot.style,
          fit: fitText(label, labelSlot),
        },
        label,
      ),
      textTag({ x, y: hm.valueY, anchor: "start", classes, style, fit: fitText(shown, valueSlot) }, shown),
    ].join("\n");
  };
  return [
    stat(hm.submissionsX, hm.submissionsSlot, LABELS.submissions, values.submissions, "fill-accent", typography.title),
    stat(hm.activeX, hm.activeSlot, LABELS.active, values.active, "fill-text", typography.number),
    stat(hm.streakX, hm.streakSlot, LABELS.streak, values.streak, "fill-text", typography.number),
  ].join("\n");
}

export function heatmapCardSvg(theme: Theme, snapshot: LeetcodeSnapshot): string {
  const body = [stats(heatmapStats(snapshot)), grid(windowOf(snapshot).days), legend()].join("\n");
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
