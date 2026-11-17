// LeetCode badges (spec 0009, docs/design.md "Badges card anatomy"): a static half card with the badge count and
// the most recent badge, and the row of badge PNGs. Not a section: `src/sections/leetcode.ts` places them. Pure.

import { formatMonthYear } from "../dates.ts";
import { escapeXml } from "../escape.ts";
import type { LeetcodeBadge, LeetcodeSnapshot } from "../sources/leetcode.ts";
import { card, fitText, iconSvg, outsideImage } from "../svg.ts";
import { badgeRow, badgesCard, layout, type TextSlot, type Theme, typography } from "../theme.ts";
import { groupDigits, textTag } from "./leetcode-text.ts";

const HEADING = "Badges";
const RECENT = "Most recent";
const EMPTY = "No badges yet";
/** Monthly Daily Coding Challenge badges: shown on the card, never in the row unless chosen on LeetCode. */
const DAILY_CHALLENGE = "DCC";

const nameSlot = {
  width: badgesCard.nameSlot,
  style: typography.heading,
  minSize: badgesCard.nameMin,
} as const satisfies TextSlot;

/** The badge with the newest `earnedOn`, ties to the larger numeric `id`: the last one, since badges are sorted. */
function mostRecent({ badges }: LeetcodeSnapshot): LeetcodeBadge | undefined {
  return badges.at(-1);
}

/** The chosen badge first, then the newest badges that aren't monthly, up to `badgeRow.max` (AC-4). */
export function rowBadges({ badges, activeBadgeId }: LeetcodeSnapshot): readonly LeetcodeBadge[] {
  const active = badges.find((badge) => badge.id === activeBadgeId);
  const rest = badges.filter((badge) => badge.category !== DAILY_CHALLENGE && badge !== active).toReversed();
  return (active === undefined ? rest : [active, ...rest]).slice(0, badgeRow.max);
}

export function badgesCardSvg(theme: Theme, snapshot: LeetcodeSnapshot, height: number): string {
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
          text(badgesCard.recentY, "fill-muted", typography.body, RECENT),
          text(badgesCard.nameY, "fill-text", typography.heading, recent.name, nameSlot),
          text(badgesCard.monthY, "fill-muted", typography.body, formatMonthYear(recent.earnedOn)),
        ];
  const body = [
    text(badgesCard.headingY, "fill-accent", typography.heading, HEADING),
    iconSvg("leetcode", layout.half - layout.pad - badgesCard.icon, badgesCard.iconY, badgesCard.icon, "fill-accent"),
    text(badgesCard.countY, "fill-text", typography.title, groupDigits(snapshot.badges.length)),
    ...detail,
  ].join("\n");
  return card(theme, { width: layout.half, height, body });
}

export function badgesAlt(snapshot: LeetcodeSnapshot): string {
  const recent = mostRecent(snapshot);
  if (recent === undefined) return "LeetCode badges: none earned yet.";
  return `LeetCode badges: ${groupDigits(snapshot.badges.length)} earned. Most recent: ${recent.name}, ${formatMonthYear(recent.earnedOn)}.`;
}

/** One line per badge: the profile link around the PNG. `href` is already escaped; `outsideImage` escapes the rest. */
export function badgeRowLines(snapshot: LeetcodeSnapshot, href: string): readonly string[] {
  return rowBadges(snapshot).map((badge) => {
    const alt = `${badge.name}, LeetCode badge earned ${formatMonthYear(badge.earnedOn)}`;
    return `<a href="${href}">${outsideImage({ src: badge.icon, alt, width: badgeRow.width })}</a>`;
  });
}
