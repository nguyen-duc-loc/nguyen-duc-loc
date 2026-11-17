// Experience and education (spec 0007, docs/design.md "Experience and education" and "Timeline card anatomy"):
// two static full width cards, newest entry first, each with a vertical rail and a dot per entry (filled for a
// current entry, hollow for a past one). Both cards link to LinkedIn, which holds the full history. Everything
// comes from content/, so adding an entry there updates the cards with no code change.

import type { Role, School, YearMonth } from "../../content/types.ts";
import { profileUrls } from "../content.ts";
import { escapeXml } from "../escape.ts";
import { card, type FitResult, fitText, pillButton, themedImage, wrapLines } from "../svg.ts";
import { button, layout, type TextSlot, type Theme, type TypeStyle, timelineCard, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const EXPERIENCE_HEADING = "Experience";
const EDUCATION_HEADING = "Education";
/** Reuses the About me LinkedIn pill files (spec 0004), so this section writes no button asset. */
const BUTTON_BASE = "contact-linkedin";
const BUTTON_ALT = "Full work history on LinkedIn";
const MIN_SIZE = 20;

// --- Sort (spec 0002): newest start first; on a tie, current first, then the later end, then file order ---

type Dated = { readonly start: YearMonth; readonly end: YearMonth | null };

const compareDesc = (a: string, b: string): number => (a === b ? 0 : a < b ? 1 : -1);

function newestFirst<T extends Dated>(entries: readonly T[]): readonly T[] {
  return entries.toSorted((a, b) => {
    if (a.start !== b.start) return compareDesc(a.start, b.start);
    if (a.end === b.end) return 0;
    if (a.end === null) return -1;
    if (b.end === null) return 1;
    return compareDesc(a.end, b.end);
  });
}

// --- Dates (AC-5): a fixed English month table, never the locale or the clock ---

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const satisfies readonly string[];

const CARD_SEPARATOR = " \u2013 ";
const ALT_SEPARATOR = " to ";
const PRESENT = "Present";

/** `2025-05` to `May 2025`. The format is already checked by `checkContent`. */
function formatMonth(value: YearMonth): string {
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function formatRange({ start, end }: Dated, separator: string): string {
  if (end === null) return `${formatMonth(start)}${separator}${PRESENT}`;
  if (start === end) return formatMonth(start);
  return `${formatMonth(start)}${separator}${formatMonth(end)}`;
}

// --- Text ---

type TextOptions = {
  readonly x: number;
  readonly y: number;
  readonly anchor: "start" | "end";
  readonly classes: string;
  readonly style: TypeStyle;
  readonly fit?: FitResult;
};

/** A `<text>` element centered on its row. `inner` is markup: escape content text before passing it. */
function textTag({ x, y, anchor, classes, style, fit }: TextOptions, inner: string): string {
  const size = fit?.size ?? style.size;
  const squeeze = fit?.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text class="${classes}" x="${x}" y="${y}" dominant-baseline="central" text-anchor="${anchor}" font-size="${size}" font-weight="${style.weight}"${squeeze}>${inner}</text>`;
}

// --- Layout (AC-3, AC-4, AC-8) ---

const { textX, bulletIndent, dateSlot, titleGap, lineHeight, entryGap } = timelineCard;
const textRight = layout.full - layout.pad;
const columnWidth = textRight - textX;

const slot = (width: number, style: TypeStyle): TextSlot => ({ width, style, minSize: MIN_SIZE });
const nameSlot = slot(columnWidth - dateSlot - titleGap, typography.heading);
const datesSlot = slot(dateSlot, typography.lead);
const columnSlot = slot(columnWidth, typography.lead);
const highlightSlot = slot(columnWidth - bulletIndent, typography.lead);

/** One row of an entry, drawn at its center y. */
type Row = (y: number) => string;

type Entry = { readonly current: boolean; readonly rows: readonly Row[] };

function nameRow(name: string, dated: Dated): Row {
  const dates = formatRange(dated, CARD_SEPARATOR);
  return (y) =>
    [
      textTag(
        {
          x: textX,
          y,
          anchor: "start",
          classes: "fill-accent",
          style: typography.heading,
          fit: fitText(name, nameSlot),
        },
        escapeXml(name),
      ),
      textTag(
        {
          x: textRight,
          y,
          anchor: "end",
          classes: "fill-muted",
          style: typography.lead,
          fit: fitText(dates, datesSlot),
        },
        escapeXml(dates),
      ),
    ].join("\n");
}

/** Body text wrapped to `width` at `x`, one row per line. */
function wrappedRows(text: string, x: number, textSlot: TextSlot, classes: string): readonly Row[] {
  return wrapLines(text, textSlot).map(
    (line) => (y) =>
      textTag({ x, y, anchor: "start", classes, style: typography.lead, fit: line.fit }, escapeXml(line.text)),
  );
}

function roleEntry(role: Role): Entry {
  const companyText = role.location === undefined ? role.company : `${role.company} · ${role.location}`;
  const location =
    role.location === undefined
      ? ""
      : `<tspan class="fill-muted" dominant-baseline="central"> · ${escapeXml(role.location)}</tspan>`;
  const companyRow: Row = (y) =>
    textTag(
      {
        x: textX,
        y,
        anchor: "start",
        classes: "fill-text",
        style: typography.lead,
        fit: fitText(companyText, columnSlot),
      },
      `${escapeXml(role.company)}${location}`,
    );
  const highlightRows = role.highlights.flatMap((highlight) =>
    wrappedRows(highlight, textX + bulletIndent, highlightSlot, "fill-text").map(
      (row, i): Row =>
        i > 0
          ? row
          : (y) =>
              [
                textTag({ x: textX, y, anchor: "start", classes: "fill-muted", style: typography.lead }, "•"),
                row(y),
              ].join("\n"),
    ),
  );
  return { current: role.end === null, rows: [nameRow(role.title, role), companyRow, ...highlightRows] };
}

function schoolEntry(school: School): Entry {
  const degree = school.field === undefined ? school.degree : `${school.degree}, ${school.field}`;
  const noteRows = school.note === undefined ? [] : wrappedRows(school.note, textX, columnSlot, "fill-accent");
  return {
    current: school.end === null,
    rows: [nameRow(school.school, school), ...wrappedRows(degree, textX, columnSlot, "fill-text"), ...noteRows],
  };
}

/** The top y of each entry, then the card height (AC-8). */
function entryTops(entries: readonly Entry[]): { readonly tops: readonly number[]; readonly height: number } {
  const entryHeight = (entry: Entry): number => entry.rows.length * lineHeight + entryGap;
  const tops = entries.map((_entry, i) =>
    entries.slice(0, i).reduce<number>((top, previous) => top + entryHeight(previous), layout.pad),
  );
  const rows = entries.reduce((sum, entry) => sum + entry.rows.length, 0);
  return { tops, height: 2 * layout.pad + lineHeight * rows + entryGap * (entries.length - 1) };
}

/** The rail, then each entry's dot and rows (AC-6). Static: no animation class. */
function timelineSvg(theme: Theme, entries: readonly Entry[]): string {
  const { railX, railWidth, dotRadius, dotStroke } = timelineCard;
  const { tops, height } = entryTops(entries);
  const rowY = (top: number, k: number): number => top + lineHeight / 2 + k * lineHeight;
  const firstDot = rowY(tops[0], 0);
  const lastDot = rowY(tops[tops.length - 1], 0);
  const rail =
    entries.length > 1
      ? [
          `<line x1="${railX}" y1="${firstDot}" x2="${railX}" y2="${lastDot}" class="stroke-border" stroke-width="${railWidth}"/>`,
        ]
      : [];
  const drawn = entries.flatMap((entry, i) => {
    const top = tops[i];
    const fill = entry.current ? "fill-accent" : "fill-surface";
    return [
      `<circle cx="${railX}" cy="${rowY(top, 0)}" r="${dotRadius}" class="${fill} stroke-accent" stroke-width="${dotStroke}"/>`,
      ...entry.rows.map((row, k) => row(rowY(top, k))),
    ];
  });
  return card(theme, { width: layout.full, height, body: [...rail, ...drawn].join("\n") });
}

// --- Alt text (AC-9): every word the card shows, built from the same content ---

/** Adds a final `.` unless the text already ends a sentence. */
const sentence = (text: string): string => (/[.!?]$/.test(text) ? text : `${text}.`);

function roleAlt(role: Role): string {
  const place = role.location === undefined ? role.company : `${role.company}, ${role.location}`;
  const head = `${role.title} at ${place}, ${formatRange(role, ALT_SEPARATOR)}.`;
  return [head, ...role.highlights.map(sentence)].join(" ");
}

function schoolAlt(school: School): string {
  const degree = school.field === undefined ? school.degree : `${school.degree}, ${school.field}`;
  const head = `${degree} at ${school.school}, ${formatRange(school, ALT_SEPARATOR)}.`;
  return school.note === undefined ? head : `${head} ${sentence(school.note)}`;
}

// --- Section (AC-1, AC-10) ---

export const timeline: Section = ({ content }) => {
  const href = escapeXml(profileUrls(content.profile.accounts).linkedin);
  const roles = newestFirst(content.experience);
  const schools = newestFirst(content.education);

  const experience = themedImage({
    base: "timeline-experience",
    alt: `${EXPERIENCE_HEADING}: ${roles.map(roleAlt).join(" ")}`,
    width: "100%",
    render: (theme) => timelineSvg(theme, roles.map(roleEntry)),
  });
  const education = themedImage({
    base: "timeline-education",
    alt: `${EDUCATION_HEADING}: ${schools.map(schoolAlt).join(" ")}`,
    width: "100%",
    render: (theme) => timelineSvg(theme, schools.map(schoolEntry)),
  });
  // Only the markup: the files come from `about`, and `checkReadmeAssets` fails the build if they ever go missing.
  const { markdown: buttonMarkdown } = themedImage({
    base: BUTTON_BASE,
    alt: BUTTON_ALT,
    width: button.width + 2 * button.margin,
    render: (theme) => pillButton(theme, { icon: "linkedin", label: "LinkedIn" }),
  });
  const linked = (markdown: string): string => `<a href="${href}">${markdown}</a>`;
  const block = (markdown: string): string => ['<p align="center">', markdown, "</p>"].join("\n");

  const markdown = [
    `<h2 align="center">${EXPERIENCE_HEADING}</h2>`,
    block(linked(experience.markdown)),
    `<h2 align="center">${EDUCATION_HEADING}</h2>`,
    block(linked(education.markdown)),
    block(linked(buttonMarkdown)),
  ].join("\n\n");
  return { markdown, assets: [...(experience.assets ?? []), ...(education.assets ?? [])] };
};
