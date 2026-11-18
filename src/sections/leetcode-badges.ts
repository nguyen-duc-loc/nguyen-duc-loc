// LeetCode badges (spec 0009, redrawn like LeetCode's by spec 0010; docs/design.md "Badges card anatomy"): the right
// card of the summary row, with the badge count, the featured badge art, and the most recent badge with its art. Not
// a section: `src/sections/leetcode.ts` places it. Pure: the badge art comes from `ctx.images`, and a badge whose
// image refresh couldn't store is left out.

import { formatMonthYear } from "../dates.ts";
import { escapeXml } from "../escape.ts";
import { imageKey } from "../images.ts";
import {
  BADGE_IMAGE,
  FEATURED_BADGES,
  featuredBadges,
  type LeetcodeBadge,
  type LeetcodeSnapshot,
  mostRecentBadge,
} from "../sources/leetcode.ts";
import { fitText } from "../svg.ts";
import { badgesCard, layout, type TextSlot, typography } from "../theme.ts";
import type { BuildContext } from "../types.ts";
import { groupDigits, textTag } from "./leetcode-text.ts";

const HEADING = "Badges";
const RECENT = "Most Recent Badge";
const EMPTY = "No badges yet";

type Images = BuildContext["images"];
type Art = { readonly badge: LeetcodeBadge; readonly href: string };

/** An `<image>` of stored badge art, `size` px square at (x, y). */
export function badgeImage(href: string, x: number, y: number, size: number): string {
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" href="${href}"/>`;
}

/** The featured badges that have stored art, with the chosen badge in the middle, as on LeetCode. */
function artOf(snapshot: LeetcodeSnapshot, images: Images): readonly Art[] {
  const art = featuredBadges(snapshot, FEATURED_BADGES).flatMap((badge) => {
    const href = images.get(imageKey({ url: badge.icon, size: BADGE_IMAGE.featured }));
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
      const tag = badgeImage(href, x, artCenterY - size / 2, size);
      x += size + artGap;
      return tag;
    })
    .join("\n");
}

/** `Most Recent Badge` and its name, after the badge's own art when refresh stored it. */
function recentRows(recent: LeetcodeBadge, images: Images, width: number): readonly string[] {
  const { recentArt, recentArtGap, recentY, nameY, nameMin } = badgesCard;
  const href = images.get(imageKey({ url: recent.icon, size: BADGE_IMAGE.recent }));
  const x = href === undefined ? layout.pad : layout.pad + recentArt + recentArtGap;
  const slot = { width: width - layout.pad - x, style: typography.name, minSize: nameMin } as const satisfies TextSlot;
  const art = href === undefined ? [] : [badgeImage(href, layout.pad, (recentY + nameY - recentArt) / 2, recentArt)];
  return [
    ...art,
    textTag({ x, y: recentY, anchor: "start", classes: "fill-muted", style: typography.label }, RECENT),
    textTag(
      { x, y: nameY, anchor: "start", classes: "fill-text", style: typography.name, fit: fitText(recent.name, slot) },
      escapeXml(recent.name),
    ),
  ];
}

/** The card body, drawn from (0, 0) inside a `width` wide card. */
export function badgesCardBody(snapshot: LeetcodeSnapshot, images: Images, width: number): string {
  const x = layout.pad;
  const text = (y: number, classes: string, style: TextSlot["style"], inner: string): string =>
    textTag({ x, y, anchor: "start", classes, style }, escapeXml(inner));
  const recent = mostRecentBadge(snapshot);
  const detail =
    recent === undefined
      ? [text(badgesCard.recentY, "fill-muted", typography.body, EMPTY)]
      : recentRows(recent, images, width);
  return [
    text(badgesCard.headingY, "fill-muted", typography.body, HEADING),
    text(badgesCard.countY, "fill-text", typography.title, groupDigits(snapshot.badges.length)),
    artRow(artOf(snapshot, images), width),
    ...detail,
  ].join("\n");
}

export function badgesAlt(snapshot: LeetcodeSnapshot): string {
  const recent = mostRecentBadge(snapshot);
  if (recent === undefined) return "LeetCode badges: none earned yet.";
  const shown = featuredBadges(snapshot, FEATURED_BADGES).map((badge) => badge.name);
  return `LeetCode badges: ${groupDigits(snapshot.badges.length)} earned, featuring ${shown.join(", ")}. Most recent: ${recent.name}, ${formatMonthYear(recent.earnedOn)}.`;
}
