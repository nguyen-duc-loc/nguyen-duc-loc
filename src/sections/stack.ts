// Tech stack (spec 0005, reshaped into a table by spec 0010; docs/design.md "Tech stack"): one table row per
// category, the label on the left and the items on the right. Each item is a small chip, its icon in the brand's
// own color plus its name (or the name alone when the item has no icon), one line each so a cell wraps them like
// words. Static: no animation.

import type { Stack, StackItem } from "../../content/types.ts";
import { escapeXml } from "../escape.ts";
import {
  centeredBaseline,
  fitText,
  iconSvg,
  iconWidth,
  sectionHeading,
  snugWidth,
  svgDocument,
  themedImage,
} from "../svg.ts";
import { layout, radius, stackChip, type TextSlot, type Theme, tableColumns, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const HEADING = "Tech stack";

type Category = { readonly key: keyof Stack; readonly label: string };

/** Row order and labels, one per key of `Stack`, in spec 0002's category order. */
const categories = [
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "tools", label: "Tools" },
  { key: "cloud", label: "Cloud" },
] as const satisfies readonly Category[];

const { height, padX, iconGap, margin } = stackChip;
const iconSize = stackChip.icon;
const style = typography.chip;
/** Names longer than this are squeezed, so a chip never grows past a sensible width. */
const NAME_MAX = 160;

/** The asset name: the icon key, else the name in lowercase with every other character as `-`. */
function chipKey(item: StackItem): string {
  return item.icon ?? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

type ChipSize = { readonly width: number; readonly nameWidth: number };

function chipSize(item: StackItem): ChipSize {
  const nameWidth = Math.min(NAME_MAX, snugWidth(item.name, style.size));
  const iconPart = item.icon === undefined ? 0 : iconWidth(item.icon, iconSize) + iconGap;
  return { width: 2 * margin + 2 * padX + iconPart + nameWidth, nameWidth };
}

/** The icon at the left padding, then the name filling the space after it, both centered on the chip's height. */
function chipSvg(theme: Theme, item: StackItem, { width, nameWidth }: ChipSize): string {
  // Sized against the cap, not the snug width: `fitText`'s wider estimate would shrink every name.
  const slot = { width: NAME_MAX, style, minSize: typography.label.size } as const satisfies TextSlot;
  const fit = fitText(item.name, slot);
  // Pinned to its estimated width with `lengthAdjust="spacing"`: a font a little wider or narrower than the estimate
  // only nudges the letter spacing, so the gap after the icon and the right padding stay the same on every system.
  // A name too long for the cap is squeezed instead.
  const pin = fit.textLength
    ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"`
    : ` textLength="${nameWidth}" lengthAdjust="spacing"`;
  const fullHeight = height + 2 * margin;
  const left = margin + padX;
  const nameX = item.icon === undefined ? left : left + iconWidth(item.icon, iconSize) + iconGap;
  const body = [
    `<rect x="${margin + 0.5}" y="${margin + 0.5}" width="${width - 2 * margin - 1}" height="${height - 1}" rx="${radius.small}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
    ...(item.icon === undefined
      ? []
      : [iconSvg(theme, item.icon, left, margin + (height - iconSize) / 2, iconSize, "fill-text")]),
    `<text class="fill-text" x="${nameX}" y="${centeredBaseline(fullHeight / 2, fit.size)}" text-anchor="start" font-size="${fit.size}" font-weight="${style.weight}"${pin}>${escapeXml(item.name)}</text>`,
  ].join("\n");
  return svgDocument(theme, { width, height: fullHeight, body });
}

export const techStack: Section = ({ content: { stack } }) => {
  const heading = sectionHeading({ key: "stack", title: HEADING, icon: "code" });
  const rows = categories.map(({ key, label }) => {
    const chips = stack[key].map((item) => {
      const size = chipSize(item);
      return themedImage({
        base: `stack-${chipKey(item)}`,
        alt: item.name,
        width: size.width,
        inline: true,
        align: "middle",
        render: (theme) => chipSvg(theme, item, size),
      });
    });
    const cell = chips.map((chip) => chip.markdown).join("\n");
    const [first, second] = tableColumns.stack;
    const markdown = `<tr>\n<td width="${first}%"><b>${escapeXml(label)}</b></td>\n<td width="${second}%">\n${cell}\n</td>\n</tr>`;
    return { markdown, chips };
  });

  const markdown = [heading.markdown, ["<table>", ...rows.map((row) => row.markdown), "</table>"].join("\n")].join(
    "\n\n",
  );
  const assets = [...(heading.assets ?? []), ...rows.flatMap((row) => row.chips.flatMap((chip) => chip.assets ?? []))];
  return { markdown, assets };
};
