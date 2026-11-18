// LeetCode badges (spec 0009, redrawn like LeetCode's by spec 0010; docs/design.md "Badges card anatomy"): the right
// card of the summary row, with the badge count, the featured badge images, and the most recent badge. Not a
// section: `src/sections/leetcode.ts` places it. Pure: the badge images come from `ctx.images`, and a badge whose
// image refresh couldn't store is left out of the row.

import { formatMonthYear } from "../dates.ts";
import { escapeXml } from "../escape.ts";
import { FEATURED_BADGES, featuredBadges, type LeetcodeBadge, type LeetcodeSnapshot } from "../sources/leetcode.ts";
import { fitText, iconSvg } from "../svg.ts";
import { badgesCard, layout, type TextSlot, typography } from "../theme.ts";
import type { BuildContext } from "../types.ts";
import { groupDigits, textTag } from "./leetcode-text.ts";

const HEADING = "Badges";
const RECENT = "Most Recent Badge";
const EMPTY = "No badges yet";

const nameSlot = {
  width: badgesCard.nameSlot,
  style: typography.heading,
  minSize: badgesCard.nameMin,
} as const satisfies TextSlot;

/** The badge with the newest `earnedOn`, ties to the larger numeric `id`: the last one, since badges are sorted. */
function mostRecent({ badges }: LeetcodeSnapshot): LeetcodeBadge | undefined {
  return badges.at(-1);
}

type Art = { readonly badge: LeetcodeBadge; readonly href: string };

/** The featured badges that have a stored image, with the chosen badge in the middle, as on LeetCode. */
function artOf(snapshot: LeetcodeSnapshot, images: BuildContext["images"]): readonly Art[] {
  const art = featuredBadges(snapshot, FEATURED_BADGES).flatMap((badge) => {
    const href = images.get(badge.icon);
    return href === undefined ? [] : [{ badge, href }];
  });
  return art.length === 3 ? [art[1], art[0], art[2]] : art;
}

function artRow(art: readonly Art[], width: number): string {
  const { artSmall, artLarge, artGap, artCenterY } = badgesCard;
  const large = art.length === 3 ? 1 : -1;
  const sizes = art.map((_, i) => (i === large ? artLarge : artSmall));
  const total = sizes.reduce((sum, size) => sum + size, 0) + artGap * (art.length - 1);
  // Centered between the count column and the right edge, like LeetCode.
  const center = Math.min(badgesCard.artCenterX, width - layout.pad - total / 2);
  let x = Math.round(center - total / 2);
  return art
    .map(({ href }, i) => {
      const size = sizes[i];
      const tag = `<image x="${x}" y="${artCenterY - size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" href="${href}"/>`;
      x += size + artGap;
      return tag;
    })
    .join("\n");
}

/** The card body, drawn from (0, 0) inside a `width` wide card. */
export function badgesCardBody(snapshot: LeetcodeSnapshot, images: BuildContext["images"], width: number): string {
  const x = layout.pad;
  const text = (y: number, classes: string, style: TextSlot["style"], inner: string, slot?: TextSlot): string =>
    textTag(
      { x, y, anchor: "start", classes, style, fit: slot === undefined ? undefined : fitText(inner, slot) },
      escapeXml(inner),
    );
  const recent = mostRecent(snapshot);
  const detail =
    recent === undefined
      ? [text(badgesCard.recentY, "fill-muted", typography.body, EMPTY)]
      : [
          text(badgesCard.recentY, "fill-muted", typography.label, RECENT),
          text(badgesCard.nameY, "fill-text", typography.heading, recent.name, { ...nameSlot, width: width - 2 * x }),
        ];
  return [
    text(badgesCard.headingY, "fill-muted", typography.body, HEADING),
    iconSvg("leetcode", width - layout.pad - badgesCard.icon, badgesCard.iconY, badgesCard.icon, ""),
    text(badgesCard.countY, "fill-text", typography.title, groupDigits(snapshot.badges.length)),
    artRow(artOf(snapshot, images), width),
    ...detail,
  ].join("\n");
}

export function badgesAlt(snapshot: LeetcodeSnapshot): string {
  const recent = mostRecent(snapshot);
  if (recent === undefined) return "LeetCode badges: none earned yet.";
  const shown = featuredBadges(snapshot, FEATURED_BADGES).map((badge) => badge.name);
  return `LeetCode badges: ${groupDigits(snapshot.badges.length)} earned, featuring ${shown.join(", ")}. Most recent: ${recent.name}, ${formatMonthYear(recent.earnedOn)}.`;
}
