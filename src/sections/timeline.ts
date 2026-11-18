// Experience and education (spec 0007, reshaped by spec 0010; docs/design.md "Experience and education" and
// "Timeline card anatomy"): two static full width images drawn on the page (no card), newest entry first, each
// entry led by the company's or school's logo on a white tile (or its initial when content names no logo). Both
// images link to LinkedIn, which holds the full history. Everything comes from content/ and the logo files, so adding an entry there updates the
// cards with no code change.

import type { Role, School, YearMonth } from "../../content/types.ts";
import { profileUrls } from "../content.ts";
import { MONTHS } from "../dates.ts";
import { escapeXml } from "../escape.ts";
import {
  centeredBaseline,
  type FitResult,
  fitText,
  sectionHeading,
  snugWidth,
  svgDocument,
  themedImage,
  wrapLines,
} from "../svg.ts";
import { layout, type TextSlot, type Theme, type TypeStyle, timelineCard, typography } from "../theme.ts";
import type { BuildContext, Section } from "../types.ts";

const EXPERIENCE_HEADING = "Experience";
const EDUCATION_HEADING = "Education";
const MIN_SIZE = 12;

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

// --- Dates (AC-5): the fixed English month table in src/dates.ts, never the locale or the clock ---

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
const { padY } = timelineCard;
const textRight = layout.full - timelineCard.padX;
const columnWidth = textRight - textX;

const slot = (width: number, style: TypeStyle): TextSlot => ({ width, style, minSize: MIN_SIZE });
const nameSlot = slot(columnWidth - dateSlot - titleGap, typography.heading);
/** The initial drawn on a tile with no logo. */
const initialStyle = { size: 20, weight: 700, family: "sans" } as const satisfies TypeStyle;
const datesSlot = slot(dateSlot, typography.lead);
const columnSlot = slot(columnWidth, typography.lead);
const highlightSlot = slot(columnWidth - bulletIndent, typography.lead);

/** One row of an entry, drawn at its center y. */
type Row = (y: number) => string;

/** The tile's picture: a logo data URI from `ctx.logos`, or the first letter of the name. */
type Mark = { readonly kind: "logo"; readonly href: string } | { readonly kind: "initial"; readonly letter: string };

type Entry = { readonly mark: Mark; readonly rows: readonly Row[] };

type Logos = BuildContext["logos"];

function markOf(name: string, logo: string | undefined, logos: Logos): Mark {
  if (logo === undefined) return { kind: "initial", letter: [...name][0]?.toUpperCase() ?? "" };
  const href = logos.get(logo);
  if (href === undefined) throw new Error(`timeline: logo ${logo} for ${name} was not loaded`);
  return { kind: "logo", href };
}

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

function roleEntry(role: Role, logos: Logos): Entry {
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
  return {
    mark: markOf(role.company, role.logo, logos),
    rows: [nameRow(role.title, role), companyRow, ...highlightRows],
  };
}

const STAR = "\u2605";

/**
 * The honors note as a bright gold pill (spec 0010): `stars` ★ then the note, in `onHonor` on `honor`, so it stands
 * out from the degree line. One line: a long note is squeezed, never wrapped.
 */
function honorRow(note: string, stars: number): Row {
  const { honorHeight, honorPadX, starGap, starWidth } = timelineCard;
  const style = typography.strong;
  const starsWidth = stars === 0 ? 0 : Math.ceil(stars * starWidth * style.size) + starGap;
  const slot = {
    width: columnWidth - starsWidth - 2 * honorPadX,
    style,
    minSize: MIN_SIZE,
  } as const satisfies TextSlot;
  const fit = fitText(note, slot);
  const noteWidth = fit.textLength ?? Math.min(slot.width, snugWidth(note, fit.size));
  const width = 2 * honorPadX + starsWidth + noteWidth;
  // One line of text, the stars then the note, centered in the pill: the gap between them is the font's own, and
  // any error in the width estimate splits evenly into the two ends.
  const lead =
    stars === 0 ? "" : `<tspan font-size="${style.size}">${STAR.repeat(stars)}</tspan><tspan dx="${starGap}">`;
  const tail = stars === 0 ? "" : "</tspan>";
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  const noteText = fit.textLength ? `<tspan${squeeze}>${escapeXml(note)}</tspan>` : escapeXml(note);
  return (y) =>
    [
      `<rect x="${textX + 0.5}" y="${y - honorHeight / 2 + 0.5}" width="${width - 1}" height="${honorHeight - 1}" rx="${honorHeight / 2}" class="fill-honor stroke-onHonor" stroke-opacity="0.2" stroke-width="${layout.border}"/>`,
      `<text class="fill-onHonor" x="${textX + width / 2}" y="${centeredBaseline(y, style.size)}" text-anchor="middle" font-size="${fit.size}" font-weight="${style.weight}">${lead}${noteText}${tail}</text>`,
    ].join("\n");
}

function schoolEntry(school: School, logos: Logos): Entry {
  const degree = school.field === undefined ? school.degree : `${school.degree}, ${school.field}`;
  const noteRows = school.note === undefined ? [] : [honorRow(school.note, school.stars ?? 0)];
  return {
    mark: markOf(school.school, school.logo, logos),
    rows: [nameRow(school.school, school), ...wrappedRows(degree, textX, columnSlot, "fill-text"), ...noteRows],
  };
}

/** An entry is as tall as its rows, or its logo tile when that is taller. */
const entryBox = (entry: Entry): number => Math.max(entry.rows.length * lineHeight, timelineCard.logo);

/** The top y of each entry, then the card height (AC-8). */
function entryTops(entries: readonly Entry[]): { readonly tops: readonly number[]; readonly height: number } {
  const tops = entries.map((_entry, i) =>
    entries.slice(0, i).reduce<number>((top, previous) => top + entryBox(previous) + entryGap, padY),
  );
  const boxes = entries.reduce((sum, entry) => sum + entryBox(entry), 0);
  return { tops, height: 2 * padY + boxes + entryGap * (entries.length - 1) };
}

/** The white logo tile at the entry's top left, with the logo fitted inside, or the initial on a `track` tile. */
function tile(mark: Mark, top: number): string {
  const { logo: size, logoInset: inset, logoRadius } = timelineCard;
  const x = timelineCard.padX;
  const fill = mark.kind === "logo" ? "fill-logoTile" : "fill-track";
  const rect = `<rect x="${x + 0.5}" y="${top + 0.5}" width="${size - 1}" height="${size - 1}" rx="${logoRadius}" class="${fill} stroke-border" stroke-width="${layout.border}"/>`;
  const inner =
    mark.kind === "logo"
      ? `<image x="${x + inset}" y="${top + inset}" width="${size - 2 * inset}" height="${size - 2 * inset}" preserveAspectRatio="xMidYMid meet" href="${mark.href}"/>`
      : `<text class="fill-muted" x="${x + size / 2}" y="${top + size / 2}" dominant-baseline="central" text-anchor="middle" font-size="${initialStyle.size}" font-weight="${initialStyle.weight}">${escapeXml(mark.letter)}</text>`;
  return `${rect}\n${inner}`;
}

/** Each entry's tile and rows (AC-6), on the page itself: no card (spec 0010). Static: no animation class. */
function timelineSvg(theme: Theme, entries: readonly Entry[]): string {
  const { tops, height } = entryTops(entries);
  const rowY = (top: number, k: number): number => top + lineHeight / 2 + k * lineHeight;
  const drawn = entries.flatMap((entry, i) => [
    tile(entry.mark, tops[i]),
    ...entry.rows.map((row, k) => row(rowY(tops[i], k))),
  ]);
  return svgDocument(theme, { width: layout.full, height, body: drawn.join("\n") });
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
  if (school.note === undefined) return head;
  const stars = school.stars === undefined ? "" : ` (${school.stars} stars)`;
  return `${head} ${sentence(`${school.note}${stars}`)}`;
}

// --- Section (AC-1, AC-10) ---

export const timeline: Section = ({ content, logos }) => {
  const href = escapeXml(profileUrls(content.profile.accounts).linkedin);
  const roles = newestFirst(content.experience);
  const schools = newestFirst(content.education);

  const experience = themedImage({
    base: "timeline-experience",
    alt: `${EXPERIENCE_HEADING}: ${roles.map(roleAlt).join(" ")}`,
    width: "100%",
    render: (theme) =>
      timelineSvg(
        theme,
        roles.map((role) => roleEntry(role, logos)),
      ),
  });
  const education = themedImage({
    base: "timeline-education",
    alt: `${EDUCATION_HEADING}: ${schools.map(schoolAlt).join(" ")}`,
    width: "100%",
    render: (theme) =>
      timelineSvg(
        theme,
        schools.map((school) => schoolEntry(school, logos)),
      ),
  });
  const linked = (markdown: string): string => `<a href="${href}">${markdown}</a>`;
  const block = (markdown: string): string => ["<p>", markdown, "</p>"].join("\n");
  const experienceHeading = sectionHeading({ key: "experience", title: EXPERIENCE_HEADING, icon: "briefcase" });
  const educationHeading = sectionHeading({ key: "education", title: EDUCATION_HEADING, icon: "graduationcap" });

  const markdown = [
    experienceHeading.markdown,
    block(linked(experience.markdown)),
    educationHeading.markdown,
    block(linked(education.markdown)),
  ].join("\n\n");
  const assets = [experienceHeading, experience, educationHeading, education].flatMap((image) => image.assets ?? []);
  return { markdown, assets };
};
