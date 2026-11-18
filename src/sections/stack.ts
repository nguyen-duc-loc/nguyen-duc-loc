// Tech stack (spec 0005, reshaped into a table by spec 0010; docs/design.md "Tech stack"): one table row per
// category, the label on the left and the items on the right. Each item is a small chip, its icon in the brand's
// own color plus its name (or the name alone when the item has no icon), one line each so a cell wraps them like
// words. Static: no animation.

import type { Stack, StackItem } from "../../content/types.ts";
import { escapeXml } from "../escape.ts";
import { fitText, iconClass, iconSvg, sectionHeading, svgDocument, textWidth, themedImage } from "../svg.ts";
import { layout, radius, stackChip, type TextSlot, type Theme, typography } from "../theme.ts";
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
  const nameWidth = Math.min(NAME_MAX, textWidth(item.name, style.size));
  const iconPart = item.icon === undefined ? 0 : iconSize + iconGap;
  return { width: 2 * margin + 2 * padX + iconPart + nameWidth, nameWidth };
}

function chipSvg(theme: Theme, item: StackItem, { width, nameWidth }: ChipSize): string {
  const slot = { width: nameWidth, style, minSize: typography.label.size } as const satisfies TextSlot;
  const fit = fitText(item.name, slot);
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  const fullHeight = height + 2 * margin;
  const left = margin + padX;
  const nameX = item.icon === undefined ? left : left + iconSize + iconGap;
  const body = [
    `<rect x="${margin + 0.5}" y="${margin + 0.5}" width="${width - 2 * margin - 1}" height="${height - 1}" rx="${radius.small}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
    ...(item.icon === undefined
      ? []
      : [iconSvg(item.icon, left, margin + (height - iconSize) / 2, iconSize, iconClass(item.icon, "fill-text"))]),
    `<text class="fill-text" x="${nameX}" y="${fullHeight / 2}" dominant-baseline="central" text-anchor="start" font-size="${fit.size}" font-weight="${style.weight}"${squeeze}>${escapeXml(item.name)}</text>`,
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
        render: (theme) => chipSvg(theme, item, size),
      });
    });
    const cell = chips.map((chip) => chip.markdown).join("\n");
    return { markdown: `<tr>\n<td><b>${escapeXml(label)}</b></td>\n<td>\n${cell}\n</td>\n</tr>`, chips };
  });

  const markdown = [heading.markdown, ["<table>", ...rows.map((row) => row.markdown), "</table>"].join("\n")].join(
    "\n\n",
  );
  const assets = [...(heading.assets ?? []), ...rows.flatMap((row) => row.chips.flatMap((chip) => chip.assets ?? []))];
  return { markdown, assets };
};
