// Certifications (spec 0008, reshaped into a table by spec 0010; docs/design.md "Certifications"): one table row
// per issuer, the issuer's name on the left and its active Credly badges on the right, each Credly's own image
// linked to its badge page. The Credly pill from About me follows as a see all button. Data comes only from the
// committed snapshot; this section writes only its heading icon.

import { profileUrls } from "../content.ts";
import { escapeXml } from "../escape.ts";
import { type CredlyBadge, type CredlySnapshot, parseCredlySnapshot } from "../sources/credly.ts";
import { outsideImage, pillButton, sectionHeading, themedImage } from "../svg.ts";
import { button, credlyGrid } from "../theme.ts";
import type { BuildContext, Section } from "../types.ts";

const HEADING = "Certifications";
const SOURCE = "credly";
const BADGE_PAGE = "https://www.credly.com/badges/";
/** Reuses the About me Credly pill files (spec 0004), so this section writes no button asset. */
const BUTTON_BASE = "contact-credly";
const BUTTON_ALT = "All badges on Credly";
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

// --- Section (AC-5, AC-7, AC-8) ---

/** Issuers in badge order, each with its badges, so the table rows follow `ordered`. */
function byIssuer(badges: readonly CredlyBadge[]): readonly (readonly [string, readonly CredlyBadge[]])[] {
  const groups = new Map<string, CredlyBadge[]>();
  for (const badge of ordered(badges)) groups.set(badge.issuer, [...(groups.get(badge.issuer) ?? []), badge]);
  return [...groups];
}

export const credlyBadges: Section = (ctx) => {
  const { badges } = readCredly(ctx);
  const heading = sectionHeading({ key: "certifications", title: HEADING, icon: "award" });
  // Only the markup: the files come from `about`, and `checkReadmeAssets` fails the build if they ever go missing.
  const { markdown: buttonMarkdown } = themedImage({
    base: BUTTON_BASE,
    alt: BUTTON_ALT,
    width: button.width + 2 * button.margin,
    render: (theme) => pillButton(theme, { icon: "credly", label: "Credly" }),
  });
  const seeAll = `<a href="${escapeXml(profileUrls(ctx.content.profile.accounts).credly)}">${buttonMarkdown}</a>`;
  const rows = byIssuer(badges).map(([issuer, group]) =>
    ["<tr>", `<td><b>${escapeXml(issuer)}</b></td>`, "<td>", ...group.map(badgeLine), "</td>", "</tr>"].join("\n"),
  );
  const table = ["<table>", ...rows, "</table>"].join("\n");
  const markdown = [heading.markdown, table, ["<p>", seeAll, "</p>"].join("\n")].join("\n\n");
  return { markdown, assets: heading.assets };
};
