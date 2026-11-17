// Certifications (spec 0008, docs/design.md "Certifications"): every active Credly badge as Credly's own image,
// each linked to its badge page, in one centered block that wraps on narrow screens. Badges are grouped by
// issuer through the order alone. Data comes only from the committed snapshot; this section writes no assets.

import { escapeXml } from "../escape.ts";
import { type CredlyBadge, type CredlySnapshot, parseCredlySnapshot } from "../sources/credly.ts";
import { outsideImage } from "../svg.ts";
import { credlyGrid } from "../theme.ts";
import type { BuildContext, Section } from "../types.ts";

const HEADING = "Certifications";
const SOURCE = "credly";
const BADGE_PAGE = "https://www.credly.com/badges/";
/** Within an issuer, higher levels first. Any other level, or none, sorts after these. */
const LEVEL_ORDER = ["Advanced", "Intermediate", "Foundational"] as const satisfies readonly string[];

// --- Order (AC-6): JavaScript `<` on strings, never the locale ---

const compareAsc = (a: string, b: string): number => (a === b ? 0 : a < b ? -1 : 1);

function levelRank(level: string | null): number {
  const levels: readonly (string | null)[] = LEVEL_ORDER;
  const rank = levels.indexOf(level);
  return rank === -1 ? LEVEL_ORDER.length : rank;
}

/** Issuers with more badges first, ties by issuer name; then level, newest `issuedOn`, name, and id. */
function ordered(badges: readonly CredlyBadge[]): readonly CredlyBadge[] {
  const counts = new Map<string, number>();
  for (const { issuer } of badges) counts.set(issuer, (counts.get(issuer) ?? 0) + 1);
  const count = (issuer: string): number => counts.get(issuer) ?? 0;
  return badges.toSorted(
    (a, b) =>
      count(b.issuer) - count(a.issuer) ||
      compareAsc(a.issuer, b.issuer) ||
      levelRank(a.level) - levelRank(b.level) ||
      compareAsc(b.issuedOn, a.issuedOn) ||
      compareAsc(a.name, b.name) ||
      compareAsc(a.id, b.id),
  );
}

// --- Markup (AC-5): one line per badge, every attribute escaped once ---

function badgeLine({ id, name, issuer, imageUrl }: CredlyBadge): string {
  const image = outsideImage({ src: imageUrl, alt: `${name}, issued by ${issuer}`, width: credlyGrid.badgeWidth });
  return `<a href="${escapeXml(`${BADGE_PAGE}${id}`)}">${image}</a>`;
}

// --- Snapshot (AC-4) ---

function readCredly({ content, snapshots }: BuildContext): CredlySnapshot {
  let snapshot: CredlySnapshot;
  try {
    snapshot = parseCredlySnapshot(snapshots.get(SOURCE));
  } catch (error) {
    throw new Error(`credly snapshot: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  const expected = content.profile.accounts.credly;
  if (snapshot.username.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`credly snapshot is for ${snapshot.username}, but content has ${expected}: run pnpm refresh`);
  }
  return snapshot;
}

// --- Section (AC-5, AC-8) ---

export const credlyBadges: Section = (ctx) => {
  const { badges } = readCredly(ctx);
  const block = (lines: readonly string[]): string => ['<p align="center">', ...lines, "</p>"].join("\n");
  const markdown = [`<h2 align="center">${HEADING}</h2>`, block(ordered(badges).map(badgeLine))].join("\n\n");
  return { markdown };
};
