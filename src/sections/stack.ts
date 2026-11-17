// Tech stack (spec 0005, docs/design.md "Tech stack" and "Stack card anatomy"): four half cards, one per
// category, each a heading and a two column grid of chips (icon plus name, or name only when the item has no
// icon). Every card shares the tallest card's height, so the two by two grid lines up. Static: no animation.

import type { Stack, StackItem } from "../../content/types.ts";
import { escapeXml } from "../escape.ts";
import { card, fitText, iconSvg, themedImage } from "../svg.ts";
import { layout, radius, stackCard, type TextSlot, type Theme, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const HEADING = "Tech stack";

type Category = { readonly key: keyof Stack; readonly label: string };

/** Card order and labels, one per key of `Stack`, in spec 0002's category order. */
const categories = [
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "tools", label: "Tools" },
  { key: "cloud", label: "Cloud" },
] as const satisfies readonly Category[];

const { columns, headingGap, chipHeight, gapX, gapY, chipPadX, iconGap } = stackCard;
const iconSize = stackCard.icon;
const nameMinSize = typography.label.size;
/** The heading box is one line of the `heading` style tall. */
const headingBox = typography.heading.size;
const chipWidth = (layout.half - 2 * layout.pad - (columns - 1) * gapX) / columns;
const chipsTop = layout.pad + headingBox + headingGap;
const rowStep = chipHeight + gapY;

const withIconSlot = {
  width: chipWidth - chipPadX - iconSize - iconGap - chipPadX,
  style: typography.body,
  minSize: nameMinSize,
} as const satisfies TextSlot;
const nameOnlySlot = { ...withIconSlot, width: chipWidth - 2 * chipPadX } as const satisfies TextSlot;

/** Height shared by every card: padding, heading, gap, then `rows` chip rows with `gapY` between them. */
const cardHeight = (rows: number): number => 2 * layout.pad + headingBox + headingGap + rows * rowStep - gapY;

function chip(item: StackItem, i: number): string {
  const x = layout.pad + (i % columns) * (chipWidth + gapX);
  const y = chipsTop + Math.floor(i / columns) * rowStep;
  const slot = item.icon === undefined ? nameOnlySlot : withIconSlot;
  const nameX = item.icon === undefined ? x + chipPadX : x + chipPadX + iconSize + iconGap;
  const fit = fitText(item.name, slot);
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return [
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${chipWidth - 1}" height="${chipHeight - 1}" rx="${radius.small}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
    ...(item.icon === undefined
      ? []
      : [iconSvg(item.icon, x + chipPadX, y + (chipHeight - iconSize) / 2, iconSize, "fill-accent")]),
    `<text class="fill-text" x="${nameX}" y="${y + chipHeight / 2}" dominant-baseline="central" text-anchor="start" font-size="${fit.size}" font-weight="${slot.style.weight}"${squeeze}>${escapeXml(item.name)}</text>`,
  ].join("\n");
}

function stackCardSvg(theme: Theme, label: string, items: readonly StackItem[], height: number): string {
  const { size, weight } = typography.heading;
  const heading = `<text class="fill-accent" x="${layout.pad}" y="${layout.pad + headingBox / 2}" dominant-baseline="central" text-anchor="start" font-size="${size}" font-weight="${weight}">${escapeXml(label)}</text>`;
  const body = [heading, ...items.map((item, i) => chip(item, i))].join("\n");
  return card(theme, { width: layout.half, height, body });
}

export const techStack: Section = ({ content: { stack } }) => {
  const rows = Math.ceil(Math.max(...categories.map(({ key }) => stack[key].length)) / columns);
  const height = cardHeight(rows);
  const cards = categories.map(({ key, label }) =>
    themedImage({
      base: `stack-${key}`,
      alt: `${label}: ${stack[key].map((item) => item.name).join(", ")}`,
      width: layout.half,
      render: (theme) => stackCardSvg(theme, label, stack[key], height),
    }),
  );

  const markdown = [
    `<h2 align="center">${HEADING}</h2>`,
    ['<p align="center">', ...cards.map((c) => c.markdown), "</p>"].join("\n"),
  ].join("\n\n");
  return { markdown, assets: cards.flatMap((c) => c.assets ?? []) };
};
