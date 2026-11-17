// LeetCode (spec 0006, docs/design.md "LeetCode", "Contest card anatomy", and "Solved card anatomy"): the
// LeetCode profile page redrawn in the theme. A half card shows the problems solved arc with Easy, Med., and Hard
// chips. Each card is a themed image linked to the LeetCode profile. Data comes only from the committed snapshot.

import { profileUrls } from "../content.ts";
import { escapeXml } from "../escape.ts";
import { type Difficulty, type LeetcodeSnapshot, parseLeetcodeSnapshot } from "../sources/leetcode.ts";
import { card, enter, type FitResult, fitText, iconSvg, themedImage } from "../svg.ts";
import { layout, radius, solvedCard, type TextSlot, type Theme, type TypeStyle, typography } from "../theme.ts";
import type { BuildContext, Section } from "../types.ts";

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

/** `6064` to `6,064`. Integers only. */
function groupDigits(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const f2 = (n: number): string => n.toFixed(2);

// --- Text ---

type Anchor = "start" | "middle" | "end";
type TextOptions = {
  readonly x: number;
  readonly y: number;
  readonly anchor: Anchor;
  readonly classes: string;
  readonly style: TypeStyle;
  /** From `fitText`. Omitted: the style's own size. */
  readonly fit?: FitResult;
  readonly baseline?: "central" | "alphabetic";
};

/** A `<text>` element. `inner` is markup: escape outside text before passing it. */
function textTag({ x, y, anchor, classes, style, fit, baseline = "central" }: TextOptions, inner: string): string {
  const size = fit?.size ?? style.size;
  const family = style.family === "mono" ? " font-mono" : "";
  const squeeze = fit?.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text class="${classes}${family}" x="${x}" y="${y}" dominant-baseline="${baseline}" text-anchor="${anchor}" font-size="${size}" font-weight="${style.weight}"${squeeze}>${inner}</text>`;
}

// --- Solved card ---

const solvedHeight = 2 * layout.pad + 3 * solvedCard.chipHeight + 2 * solvedCard.chipGap;

const numberSlot = { width: solvedCard.numberSlot, style: typography.title, minSize: 24 } as const satisfies TextSlot;
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
  const solved = themedImage({
    base: "leetcode-solved",
    alt: solvedAlt(snapshot),
    width: layout.half,
    render: (theme) => solvedCardSvg(theme, snapshot),
  });
  const linked = (markdown: string): string => `<a href="${href}">${markdown}</a>`;

  const markdown = [
    `<h2 align="center">${HEADING}</h2>`,
    ['<p align="center">', linked(solved.markdown), "</p>"].join("\n"),
  ].join("\n\n");
  return { markdown, assets: [...(solved.assets ?? [])] };
};
