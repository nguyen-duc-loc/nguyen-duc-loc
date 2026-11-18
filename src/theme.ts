// The one source of colors, fonts, sizes, spacing, and motion timings (spec 0003).
// docs/design.md repeats these values for people; change both in the same commit.
// Pure: constants and pure functions, no I/O.

export type ThemeName = "light" | "dark";
/** Lowercase `#rrggbb`. The format is checked at build time by `checkContrast`. */
export type Hex = `#${string}`;
export type TokenName =
  | "page"
  | "surface"
  | "border"
  | "track"
  | "text"
  | "muted"
  | "accent"
  | "accent2"
  | "onAccent"
  | "success"
  | "warning"
  | "danger"
  | "successText"
  | "warningText"
  | "dangerText"
  | "heat"
  | "leetcode"
  | "honor"
  | "logoTile";
export type Theme = { readonly name: ThemeName } & { readonly [K in TokenName]: Hex };
export type ContrastPair = { readonly fg: TokenName; readonly bg: TokenName; readonly min: 3 | 4.5 };
export type TypeStyle = {
  readonly size: number;
  readonly weight: 400 | 500 | 600 | 700;
  readonly family: "sans" | "mono";
};
export type TextSlot = { readonly width: number; readonly style: TypeStyle; readonly minSize: number };

/** Every token, in the order of the spec's token table. Color classes follow this order. */
export const tokenNames = [
  "page",
  "surface",
  "border",
  "track",
  "text",
  "muted",
  "accent",
  "accent2",
  "onAccent",
  "success",
  "warning",
  "danger",
  "successText",
  "warningText",
  "dangerText",
  "heat",
  "leetcode",
  "honor",
  "logoTile",
] as const satisfies readonly TokenName[];

/**
 * GitHub's own Primer colors (spec 0010), so cards sit on the page like GitHub's own UI. `page` is GitHub's page
 * background, used only by checks. `success`, `warning`, and `danger` are LeetCode's own difficulty colors, and the
 * `*Text` tokens are the same hues dark enough (light) or bright enough (dark) to read as text on `track`. `heat` is
 * LeetCode's green, for the submission heatmap, `leetcode` its orange, for the rating line. `honor` is a gold for the
 * honors note and its stars (Primer attention), checked as text on `page`.
 */
export const themes = {
  light: {
    name: "light",
    page: "#ffffff",
    surface: "#f6f8fa",
    border: "#d1d9e0",
    track: "#e6eaef",
    text: "#1f2328",
    muted: "#59636e",
    accent: "#0969da",
    accent2: "#8250df",
    onAccent: "#ffffff",
    success: "#00af9b",
    warning: "#ffb800",
    danger: "#ff2d55",
    successText: "#00705f",
    warningText: "#805600",
    dangerText: "#c0262d",
    heat: "#2cbb5d",
    leetcode: "#ffa116",
    honor: "#8a5c00",
    logoTile: "#ffffff",
  },
  dark: {
    name: "dark",
    page: "#0d1117",
    surface: "#151b23",
    border: "#3d444d",
    track: "#262c36",
    text: "#f0f6fc",
    muted: "#9198a1",
    accent: "#4493f8",
    accent2: "#ab7df8",
    onAccent: "#0d1117",
    success: "#1cbaba",
    warning: "#ffb700",
    danger: "#f63737",
    successText: "#1cbaba",
    warningText: "#ffb700",
    dangerText: "#ff6b6b",
    heat: "#2cbb5d",
    leetcode: "#ffa116",
    honor: "#e3b341",
    logoTile: "#ffffff",
  },
} as const satisfies { readonly [K in ThemeName]: Theme };

/** Checked for both themes on every build. Decorative and always labeled tokens are left out on purpose. */
export const contrastPairs = [
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "muted", bg: "surface", min: 4.5 },
  { fg: "accent", bg: "surface", min: 4.5 },
  { fg: "accent", bg: "page", min: 4.5 },
  { fg: "text", bg: "page", min: 4.5 },
  { fg: "muted", bg: "page", min: 4.5 },
  { fg: "accent2", bg: "surface", min: 4.5 },
  { fg: "onAccent", bg: "accent", min: 4.5 },
  { fg: "onAccent", bg: "accent2", min: 4.5 },
  { fg: "text", bg: "track", min: 4.5 },
  { fg: "successText", bg: "track", min: 4.5 },
  { fg: "warningText", bg: "track", min: 4.5 },
  { fg: "dangerText", bg: "track", min: 4.5 },
  { fg: "honor", bg: "page", min: 4.5 },
] as const satisfies readonly ContrastPair[];

/** GitHub's own font stacks. System fonts only: an SVG in `<img>` can't load web fonts. */
export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
} as const satisfies { readonly [K in TypeStyle["family"]]: string };

/** Card text is kept near GitHub's own 14 to 16px body size (spec 0010); only the banner uses larger sizes. */
export const typography = {
  display: { size: 48, weight: 700, family: "sans" },
  tagline: { size: 22, weight: 600, family: "sans" },
  title: { size: 24, weight: 500, family: "sans" },
  heading: { size: 16, weight: 600, family: "sans" },
  lead: { size: 14, weight: 400, family: "sans" },
  body: { size: 14, weight: 400, family: "sans" },
  label: { size: 12, weight: 400, family: "sans" },
  typing: { size: 22, weight: 400, family: "mono" },
  button: { size: 14, weight: 600, family: "sans" },
  chip: { size: 13, weight: 600, family: "sans" },
  strong: { size: 14, weight: 500, family: "sans" },
  name: { size: 16, weight: 500, family: "sans" },
} as const satisfies { readonly [name: string]: TypeStyle };

/** Spacing scale in px. */
export const space = [4, 8, 12, 16, 24, 32] as const satisfies readonly number[];

export const radius = { card: 12, small: 6, pill: 20 } as const satisfies { readonly [name: string]: number };

/** `full` renders at `width="100%"`, `half` at `width="400"` so two sit side by side on desktop. */
export const layout = { full: 850, half: 400, pad: 24, border: 1 } as const satisfies {
  readonly [name: string]: number;
};

/**
 * Contact pill buttons (spec 0004): a `width` × `height` pill inside a transparent `margin` on every side,
 * so the file is 148 × 48. `padX` runs from the pill edge to the icon, `gap` from the icon to the label.
 */
export const button = { width: 140, height: 40, margin: 4, padX: 16, icon: 16, gap: 8 } as const satisfies {
  readonly [name: string]: number;
};

/**
 * Tech stack chips (spec 0010, docs/design.md "Tech stack"): one pill per item, `height` tall and as wide as its
 * name needs (`padX`, icon, `iconGap`, the `chip` style estimate, `padX`), so the table cell wraps them like words.
 */
export const stackChip = { height: 32, padX: 10, icon: 18, iconGap: 8, margin: 2 } as const satisfies {
  readonly [name: string]: number;
};

/**
 * The LeetCode summary row (spec 0010): the solved card and the badges card side by side in one `layout.full` wide
 * image, so they always share a row. Each card is `(layout.full − gap) / 2` wide.
 */
export const summaryRow = { height: 196, gap: 16 } as const satisfies { readonly [name: string]: number };

/**
 * LeetCode solved card (spec 0006, chips restyled by spec 0010; docs/design.md "Solved card anatomy"): a 270 degree
 * arc of Easy, Medium, and Hard segments around (`cx`, `cy`), plus three difficulty chips on the right, drawn like
 * LeetCode's: a `track` tile with the colored difficulty name over the count. Angles are in degrees. Chip offsets
 * are from the chip's top left corner.
 */
export const solvedCard = {
  cx: 140,
  cy: 107,
  radius: 80,
  stroke: 6,
  span: 270,
  segmentGap: 6,
  trackOpacity: 0.25,
  numberBaseline: 112,
  numberSlot: 96,
  checkX: 108,
  checkY: 122,
  checkSize: 14,
  solvedX: 126,
  solvedY: 129,
  attemptingY: 162,
  attemptingSlot: 96,
  chipX: 281,
  chipWidth: 112,
  chipHeight: 44,
  chipGap: 8,
  chipLabelY: 14,
  chipValueY: 31,
  chipValueSlot: 96,
} as const satisfies { readonly [name: string]: number };

/**
 * LeetCode contest card (spec 0006, reshaped by spec 0010; docs/design.md "Contest card anatomy"): `layout.full`
 * wide. The stats row over the rating history chart, which spans the whole card. Contests are spaced evenly, one
 * step per attended contest, so a long break between contests leaves no empty stretch. `*X` and `*Slot` place each
 * stat column.
 */
export const contestCard = {
  height: 244,
  labelY: 32,
  valueY: 62,
  ratingX: 24,
  ratingSlot: 120,
  levelIconX: 168,
  levelIconY: 30,
  levelIcon: 32,
  levelX: 208,
  levelSlot: 150,
  rankX: 384,
  rankSlot: 230,
  attendedX: 640,
  attendedSlot: 120,
  chartLeft: 32,
  chartRight: 818,
  chartTop: 104,
  chartBottom: 196,
  flatSpan: 100,
  lineWidth: 2,
  dotRadius: 4,
  tipGap: 8,
  tipHeight: 24,
  tipPadX: 8,
  yearY: 220,
  yearMinGap: 48,
} as const satisfies { readonly [name: string]: number };

/**
 * Experience and education (spec 0007, reshaped by spec 0010; docs/design.md "Timeline anatomy"): `layout.full`
 * wide and drawn on the page, with no card. Each entry has its `logo` px logo tile at `padX` and text from `textX`
 * to `layout.full − padX`. Row 0 holds the name and the dates, right aligned in `dateSlot`, `titleGap` apart.
 * Rows are `lineHeight` apart, entries `entryGap` apart, and highlight text starts `bulletIndent` after the bullet.
 */
export const timelineCard = {
  padX: 1,
  padY: 4,
  logo: 48,
  logoInset: 4,
  logoRadius: 8,
  textX: 65,
  bulletIndent: 16,
  dateSlot: 200,
  titleGap: 16,
  lineHeight: 24,
  entryGap: 24,
  honorHeight: 22,
  honorPadX: 10,
  honorCharWidth: 0.56,
  starGap: 6,
} as const satisfies { readonly [name: string]: number };

/**
 * Table column widths in percent (spec 0010). GitHub sizes a table to its content; a first column whose content is
 * wider than its share of the README pushes the table out to the full width (the tech stack's 10% is narrower than
 * any label, so that column shrinks to the longest label and the chips get the rest).
 */
export const tableColumns = { certifications: [25, 75], stack: [10, 90] } as const satisfies {
  readonly [table: string]: readonly [number, number];
};

/** Certifications (specs 0008 and 0010, docs/design.md "Certifications"): each Credly badge PNG is `badgeWidth` px. */
export const credlyGrid = { badgeWidth: 96 } as const satisfies { readonly [name: string]: number };

/**
 * LeetCode badges card (spec 0009, redrawn by spec 0010; docs/design.md "Badges card anatomy"): the right card of the
 * summary row. Every y is a text center (`dominant-baseline="central"`). The featured badge art sits in a row centered
 * on `artCenterX`, the middle one `artLarge` px and the others `artSmall` px. The most recent badge's `recentArt` px
 * art sits at `layout.pad`, its label and name `recentArtGap` after it.
 */
export const badgesCard = {
  headingY: 30,
  countY: 58,
  artCenterX: 236,
  artCenterY: 88,
  artSmall: 60,
  artLarge: 76,
  artGap: 20,
  recentArt: 40,
  recentArtGap: 12,
  recentY: 150,
  nameY: 170,
  nameMin: 12,
} as const satisfies { readonly [name: string]: number };

/**
 * LeetCode submission heatmap (spec 0009, redrawn like LeetCode's by spec 0010; docs/design.md "Heatmap card
 * anatomy"): `layout.full` × `height`, the `windowDays` ending on the snapshot's `asOf`. A sentence with the
 * submission count on the left and the active days and max streak on the right, then the grid and the month names.
 * A month with its Daily Coding Challenge badge shows that badge's art (`monthArt` px) instead of its name. A day's
 * level is the highest k with `count ≥ level<k>Min`, drawn in `heat` at `fill-opacity` `opacity<k>`; level 0 is
 * `fill-track`.
 */
export const heatmap = {
  height: 196,
  windowDays: 365,
  headY: 34,
  headGap: 24,
  gridTop: 68,
  cell: 9,
  cellGap: 2,
  cellRadius: 2,
  monthGap: 6,
  monthY: 166,
  monthArt: 28,
  monthMinColumns: 3,
  level1Min: 1,
  level2Min: 2,
  level3Min: 3,
  level4Min: 5,
  opacity1: 0.3,
  opacity2: 0.55,
  opacity3: 0.8,
  opacity4: 1,
} as const satisfies { readonly [name: string]: number };

/** Every animation in every SVG ends by `budget` ms (WCAG 2.2.2), then holds its final frame. */
export const motion = {
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  enter: { duration: 600, stagger: 100, distance: 8, end: 1500 },
  fill: { duration: 1000 },
  wave: { duration: 4500 },
  typing: { type: 70, delete: 40, hold: 1000, pause: 300 },
  budget: 5000,
} as const;

function channel(hex: Hex, offset: number): number {
  const c = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: Hex): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** WCAG 2 contrast ratio of two `#rrggbb` colors, unrounded. */
export function contrastRatio(a: Hex, b: Hex): number {
  const [light, dark] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** The color class block every SVG's `<style>` starts with: fill, stroke, and stop classes per drawn token. */
export function themeCss(theme: Theme): string {
  return tokenNames
    .filter((token) => token !== "page")
    .map((token) => {
      const hex = theme[token];
      return `.fill-${token}{fill:${hex}}.stroke-${token}{stroke:${hex}}.stop-${token}{stop-color:${hex}}`;
    })
    .join("");
}
