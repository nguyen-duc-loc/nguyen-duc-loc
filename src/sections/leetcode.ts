// LeetCode (specs 0006, 0009, and 0010, docs/design.md "LeetCode" and its card anatomy sections): the LeetCode
// profile page redrawn in the theme. A full width contest card (stats row, rating history line) sits above
// a half card with the problems solved arc and Easy, Med., and Hard chips, and the badges half card beside it. A
// row of badge PNGs and a full width submission heatmap follow. Each card and badge links to the LeetCode profile.
// Data comes only from the committed snapshot; the badges and heatmap drawing live in `leetcode-badges.ts` and
// `leetcode-heatmap.ts`.

import { profileUrls } from "../content.ts";
import { escapeXml } from "../escape.ts";
import { type Difficulty, type LeetcodeSnapshot, parseLeetcodeSnapshot } from "../sources/leetcode.ts";
import { card, enter, fitText, iconSvg, sectionHeading, textWidth, themedImage } from "../svg.ts";
import { contestCard, layout, radius, solvedCard, type TextSlot, type Theme, typography } from "../theme.ts";
import type { BuildContext, Section } from "../types.ts";
import { badgeRowLines, badgesAlt, badgesCardSvg } from "./leetcode-badges.ts";
import { heatmapAlt, heatmapCardSvg } from "./leetcode-heatmap.ts";
import { type Anchor, groupDigits, textTag } from "./leetcode-text.ts";

const HEADING = "LeetCode";
const SOURCE = "leetcode";

type Status = "success" | "warning" | "danger";
type DifficultyLabel = {
  readonly key: Difficulty;
  /** Chip text. */
  readonly label: string;
  /** Alt text. */
  readonly name: string;
  readonly status: Status;
};

/** Arc and chip order. Status colors only paint shapes; every word stays `fill-text` or `fill-muted`. */
const difficulties = [
  { key: "easy", label: "Easy", name: "Easy", status: "success" },
  { key: "medium", label: "Med.", name: "Medium", status: "warning" },
  { key: "hard", label: "Hard", name: "Hard", status: "danger" },
] as const satisfies readonly DifficultyLabel[];

// --- Formatting (AC-7): fixed rules, never the locale ---

const f2 = (n: number): string => n.toFixed(2);

// --- Solved card ---

const solvedHeight = 2 * layout.pad + 3 * solvedCard.chipHeight + 2 * solvedCard.chipGap;

const numberSlot = { width: solvedCard.numberSlot, style: typography.title, minSize: 20 } as const satisfies TextSlot;
const attemptingSlot = {
  width: solvedCard.attemptingSlot,
  style: typography.label,
  minSize: typography.label.size,
} as const satisfies TextSlot;
const chipValueSlot = {
  width: solvedCard.chipValueSlot,
  style: typography.body,
  minSize: typography.label.size,
} as const satisfies TextSlot;

/** A point on the ring, θ in degrees clockwise from 12 o'clock. */
function ringPoint(deg: number): string {
  const { cx, cy, radius: r } = solvedCard;
  const rad = (deg * Math.PI) / 180;
  return `${f2(cx + r * Math.sin(rad))} ${f2(cy - r * Math.cos(rad))}`;
}

/** A clockwise arc on the ring from `from` for `span` degrees. */
function arcPath(from: number, span: number): string {
  const r = solvedCard.radius;
  const large = span > 180 ? 1 : 0;
  return `M${ringPoint(from)} A${r} ${r} 0 ${large} 1 ${ringPoint(from + span)}`;
}

type Segment = { readonly from: number; readonly span: number };

/** Easy, Medium, Hard spans in proportion to each total, with `segmentGap` between them, over `solvedCard.span`. */
function segments(snapshot: LeetcodeSnapshot): readonly Segment[] {
  const { span, segmentGap } = solvedCard;
  const totals = difficulties.map(({ key }) => snapshot.difficulties[key].total);
  const sum = totals.reduce((a, b) => a + b, 0);
  const usable = span - (totals.length - 1) * segmentGap;
  const spans = totals.map((total) => (usable * total) / sum);
  return spans.map((s, i) => ({
    from: -span / 2 + spans.slice(0, i).reduce((a, b) => a + b, 0) + i * segmentGap,
    span: s,
  }));
}

function arcs(snapshot: LeetcodeSnapshot): string {
  const stroke = `stroke-width="${solvedCard.stroke}" stroke-linecap="round"`;
  return segments(snapshot)
    .flatMap(({ from, span }, i) => {
      const { key, status } = difficulties[i];
      const { solved, total } = snapshot.difficulties[key];
      const track = `<path d="${arcPath(from, span)}" fill="none" class="stroke-${status}" stroke-opacity="${solvedCard.trackOpacity}" ${stroke}/>`;
      if (solved === 0) return [track];
      const fill = `<path d="${arcPath(from, (span * solved) / total)}" fill="none" class="gauge stroke-${status}" ${stroke} pathLength="1" stroke-dasharray="1" style="--gauge-empty:1"/>`;
      return [track, fill];
    })
    .join("\n");
}

type Totals = { readonly solved: number; readonly total: number; readonly attempting: number };

function totalsOf(snapshot: LeetcodeSnapshot): Totals {
  const rows = difficulties.map(({ key }) => snapshot.difficulties[key]);
  const sum = (pick: (row: Totals) => number): number => rows.reduce((acc, row) => acc + pick(row), 0);
  return { solved: sum((r) => r.solved), total: sum((r) => r.total), attempting: sum((r) => r.attempting) };
}

function solvedCenter(totals: Totals): string {
  const { cx, numberBaseline, checkX, checkY, checkSize, solvedX, solvedY, attemptingY } = solvedCard;
  const solved = String(totals.solved);
  const { body } = typography;
  const tail = `<tspan class="fill-muted" font-size="${body.size}" font-weight="${body.weight}">/${totals.total}</tspan>`;
  const number = textTag(
    {
      x: cx,
      y: numberBaseline,
      anchor: "middle",
      classes: "fill-text",
      style: typography.title,
      fit: fitText(solved, numberSlot),
      baseline: "alphabetic",
    },
    `${solved}${tail}`,
  );
  const label = textTag({ x: solvedX, y: solvedY, anchor: "start", classes: "fill-text", style: body }, "Solved");
  const attempting = `${totals.attempting} Attempting`;
  const attemptingText = textTag(
    {
      x: cx,
      y: attemptingY,
      anchor: "middle",
      classes: "fill-muted",
      style: typography.label,
      fit: fitText(attempting, attemptingSlot),
    },
    attempting,
  );
  return [
    `<g ${enter(0)}>${number}</g>`,
    `<g ${enter(1)}>${iconSvg("check", checkX, checkY, checkSize, "fill-success")}${label}</g>`,
    `<g ${enter(2)}>${attemptingText}</g>`,
  ].join("\n");
}

function chips(snapshot: LeetcodeSnapshot): string {
  const { chipX: x, chipWidth, chipHeight, chipGap, dotX, dotY, dotRadius, chipLabelX, chipLabelY } = solvedCard;
  const { chipValueX, chipValueY } = solvedCard;
  return difficulties
    .map(({ key, label, status }, i) => {
      const y = layout.pad + i * (chipHeight + chipGap);
      const { solved, total } = snapshot.difficulties[key];
      const value = `${solved}/${total}`;
      return [
        `<g ${enter(3 + i)}>`,
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="${chipWidth - 1}" height="${chipHeight - 1}" rx="${radius.small}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
        `<circle cx="${x + dotX}" cy="${y + dotY}" r="${dotRadius}" class="fill-${status}"/>`,
        textTag(
          { x: x + chipLabelX, y: y + chipLabelY, anchor: "start", classes: "fill-muted", style: typography.body },
          label,
        ),
        textTag(
          {
            x: x + chipValueX,
            y: y + chipValueY,
            anchor: "start",
            classes: "fill-text",
            style: typography.body,
            fit: fitText(value, chipValueSlot),
          },
          value,
        ),
        "</g>",
      ].join("\n");
    })
    .join("\n");
}

function solvedCardSvg(theme: Theme, snapshot: LeetcodeSnapshot): string {
  const body = [arcs(snapshot), solvedCenter(totalsOf(snapshot)), chips(snapshot)].join("\n");
  return card(theme, { width: layout.half, height: solvedHeight, body });
}

function solvedAlt(snapshot: LeetcodeSnapshot): string {
  const totals = totalsOf(snapshot);
  const rows = difficulties.map(({ key, name }) => {
    const { solved, total } = snapshot.difficulties[key];
    return `${name} ${groupDigits(solved)} of ${groupDigits(total)}`;
  });
  return `LeetCode problems solved: ${groupDigits(totals.solved)} of ${groupDigits(totals.total)}. ${rows.join(", ")}. ${groupDigits(totals.attempting)} attempting.`;
}

// --- Contest card ---

const cc = contestCard;
/** Stat values never go below this size. */
const VALUE_MIN = 14;

const ratingSlot = { width: cc.ratingSlot, style: typography.title, minSize: VALUE_MIN } as const satisfies TextSlot;
const levelSlot = { width: cc.levelSlot, style: typography.number, minSize: VALUE_MIN } as const satisfies TextSlot;
const rankSlot = { width: cc.rankSlot, style: typography.number, minSize: VALUE_MIN } as const satisfies TextSlot;
const attendedSlot = {
  width: cc.attendedSlot,
  style: typography.number,
  minSize: VALUE_MIN,
} as const satisfies TextSlot;

const formatRating = (rating: number): string => groupDigits(Math.round(rating));
const utcYear = (startTime: number): number => new Date(startTime * 1000).getUTCFullYear();

function statLabel(x: number, label: string): string {
  return textTag({ x, y: cc.labelY, anchor: "start", classes: "fill-muted", style: typography.lead }, label);
}

/** `plain` sizes the text; `inner` is the markup (defaults to `plain`, escaped). */
function statValue(x: number, slot: TextSlot, classes: string, plain: string, inner = escapeXml(plain)): string {
  return textTag({ x, y: cc.valueY, anchor: "start", classes, style: slot.style, fit: fitText(plain, slot) }, inner);
}

function contestStats({ contest }: LeetcodeSnapshot): string {
  const rank = groupDigits(contest.globalRanking);
  const participants = groupDigits(contest.totalParticipants);
  const level =
    contest.badge === null
      ? []
      : [
          `<g ${enter(1)}>`,
          iconSvg("shield", cc.levelIconX, cc.levelIconY, cc.levelIcon, "fill-accent2"),
          statLabel(cc.levelX, "Level"),
          statValue(cc.levelX, levelSlot, "fill-accent2", contest.badge),
          "</g>",
        ];
  return [
    `<g ${enter(0)}>`,
    statLabel(cc.ratingX, "Rating"),
    statValue(cc.ratingX, ratingSlot, "fill-text", formatRating(contest.rating)),
    "</g>",
    ...level,
    `<g ${enter(2)}>`,
    statLabel(cc.rankX, "Global ranking"),
    statValue(
      cc.rankX,
      rankSlot,
      "fill-text",
      `${rank}/${participants}`,
      `${rank}<tspan class="fill-muted">/${participants}</tspan>`,
    ),
    "</g>",
    `<g ${enter(3)}>`,
    statLabel(cc.attendedX, "Attended"),
    statValue(cc.attendedX, attendedSlot, "fill-text", String(contest.attended)),
    "</g>",
  ].join("\n");
}

type Point = { readonly x: number; readonly y: number };

/**
 * History points scaled into the chart box. Contests are spaced evenly by their order, never by date, so a long
 * break between two contests takes the same room as any other step (spec 0010). One point sits at the right edge.
 */
function chartPoints(history: LeetcodeSnapshot["history"]): readonly Point[] {
  const ratings = history.map((h) => h.rating);
  const max = Math.max(...ratings);
  const min = Math.min(...ratings);
  const flat = max === min;
  const span = flat ? cc.flatSpan : max - min;
  const floor = flat ? min - cc.flatSpan / 2 : min;
  const last = history.length - 1;
  return history.map(({ rating }, i) => {
    const x = last === 0 ? cc.chartRight : cc.chartLeft + (i / last) * (cc.chartRight - cc.chartLeft);
    const y = cc.chartBottom - ((rating - floor) / span) * (cc.chartBottom - cc.chartTop);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });
}

type YearMark = { readonly x: number; readonly year: number };

/** The first contest of each year, left to right, dropping a year that would sit closer than `yearMinGap`. */
function yearMarks(history: LeetcodeSnapshot["history"], points: readonly Point[]): readonly YearMark[] {
  const marks: YearMark[] = [];
  history.forEach(({ startTime }, i) => {
    const year = utcYear(startTime);
    if (i > 0 && year === utcYear(history[i - 1].startTime)) return;
    const previous = marks.at(-1);
    if (previous !== undefined && points[i].x - previous.x < cc.yearMinGap) return;
    marks.push({ x: points[i].x, year });
  });
  return marks;
}

function ratingChart(history: LeetcodeSnapshot["history"]): string {
  const points = chartPoints(history);
  const line =
    points.length === 1
      ? []
      : [
          `<path d="${points.map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ")}" fill="none" class="gauge stroke-brand-leetcode" stroke-width="${cc.lineWidth}" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dasharray="1" style="--gauge-empty:1"/>`,
        ];

  // The last point and its label: the label sits left of the dot and covers the end of the line on purpose.
  const last = points[points.length - 1];
  const label = formatRating(history[history.length - 1].rating);
  const { lead } = typography;
  const width = textWidth(label, lead.size) + 2 * cc.tipPadX;
  const tipX = last.x - cc.dotRadius - cc.tipGap - width;
  const tip = [
    `<g ${enter(9)}>`,
    `<circle cx="${last.x}" cy="${last.y}" r="${cc.dotRadius}" class="fill-brand-leetcode"/>`,
    `<rect x="${tipX.toFixed(1)}" y="${(last.y - cc.tipHeight / 2).toFixed(1)}" width="${width}" height="${cc.tipHeight}" rx="${radius.small}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
    textTag(
      { x: Number((tipX + width / 2).toFixed(1)), y: last.y, anchor: "middle", classes: "fill-text", style: lead },
      label,
    ),
    "</g>",
  ];

  // A year label under the first contest of each year, with a faint line up through the chart where a year starts.
  const marks = yearMarks(history, points);
  const years = marks.map(({ x, year }, i) => {
    const anchor: Anchor = points.length === 1 ? "end" : i === 0 ? "start" : "middle";
    const rule =
      i === 0
        ? ""
        : `<line x1="${x}" y1="${cc.chartTop}" x2="${x}" y2="${cc.chartBottom}" class="stroke-border" stroke-width="${layout.border}" stroke-dasharray="4 4"/>`;
    const text = textTag({ x, y: cc.yearY, anchor, classes: "fill-muted", style: lead }, String(year));
    return `${rule}${text}`;
  });

  return [`<g ${enter(5)}>${years.join("")}</g>`, ...line, ...tip].join("\n");
}

function contestCardSvg(theme: Theme, snapshot: LeetcodeSnapshot): string {
  const body = [contestStats(snapshot), ratingChart(snapshot.history)].join("\n");
  return card(theme, { width: layout.full, height: cc.height, body });
}

function contestAlt({ contest, history }: LeetcodeSnapshot): string {
  const level = contest.badge === null ? "" : `, level ${contest.badge}`;
  const attended = contest.attended === 1 ? "1 contest attended" : `${groupDigits(contest.attended)} contests attended`;
  const first = history[0];
  const last = history[history.length - 1];
  const [firstYear, lastYear] = [utcYear(first.startTime), utcYear(last.startTime)];
  const trend =
    history.length === 1
      ? `${formatRating(last.rating)} in ${lastYear}`
      : firstYear === lastYear
        ? `${formatRating(first.rating)} to ${formatRating(last.rating)} in ${lastYear}`
        : `${formatRating(first.rating)} in ${firstYear} to ${formatRating(last.rating)} in ${lastYear}`;
  return [
    `LeetCode contest rating ${formatRating(contest.rating)}${level},`,
    `global ranking ${groupDigits(contest.globalRanking)} of ${groupDigits(contest.totalParticipants)},`,
    `${attended}.`,
    `Rating history: ${trend}.`,
  ].join(" ");
}

// --- Section ---

function readLeetcode({ content, snapshots }: BuildContext): LeetcodeSnapshot {
  let snapshot: LeetcodeSnapshot;
  try {
    snapshot = parseLeetcodeSnapshot(snapshots.get(SOURCE));
  } catch (error) {
    throw new Error(`leetcode snapshot: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  const expected = content.profile.accounts.leetcode;
  if (snapshot.username.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`leetcode snapshot is for ${snapshot.username}, but content has ${expected}: run pnpm refresh`);
  }
  return snapshot;
}

export const leetcodeStats: Section = (ctx) => {
  const snapshot = readLeetcode(ctx);
  const href = escapeXml(profileUrls(ctx.content.profile.accounts).leetcode);
  const contest = themedImage({
    base: "leetcode-contest",
    alt: contestAlt(snapshot),
    width: "100%",
    render: (theme) => contestCardSvg(theme, snapshot),
  });
  const solved = themedImage({
    base: "leetcode-solved",
    alt: solvedAlt(snapshot),
    width: layout.half,
    render: (theme) => solvedCardSvg(theme, snapshot),
  });
  const badges = themedImage({
    base: "leetcode-badges",
    alt: badgesAlt(snapshot),
    width: layout.half,
    render: (theme) => badgesCardSvg(theme, snapshot, solvedHeight),
  });
  const heatmap = themedImage({
    base: "leetcode-heatmap",
    alt: heatmapAlt(snapshot),
    width: "100%",
    render: (theme) => heatmapCardSvg(theme, snapshot),
  });
  const linked = (markdown: string): string => `<a href="${href}">${markdown}</a>`;
  const block = (lines: readonly string[]): string => ["<p>", ...lines, "</p>"].join("\n");
  const row = badgeRowLines(snapshot, href);
  const heading = sectionHeading({ key: "leetcode", title: HEADING, icon: "leetcode" });

  const markdown = [
    heading.markdown,
    block([linked(contest.markdown)]),
    block([linked(solved.markdown), linked(badges.markdown)]),
    ...(row.length === 0 ? [] : [block(row)]),
    block([linked(heatmap.markdown)]),
  ].join("\n\n");
  const assets = [heading, contest, solved, badges, heatmap].flatMap((image) => image.assets ?? []);
  return { markdown, assets };
};
