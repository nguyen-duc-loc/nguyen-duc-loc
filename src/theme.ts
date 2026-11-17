// The one source of colors, fonts, sizes, spacing, and motion timings (spec 0003).
// docs/design.md repeats these values for people; change both in the same commit.
// Pure: constants and two pure functions, no I/O.

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
  | "danger";
export type Theme = { readonly name: ThemeName } & { readonly [K in TokenName]: Hex };
export type ContrastPair = { readonly fg: TokenName; readonly bg: TokenName; readonly min: 3 | 4.5 };
export type TypeStyle = { readonly size: number; readonly weight: 400 | 600 | 700; readonly family: "sans" | "mono" };
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
] as const satisfies readonly TokenName[];

/** Catppuccin Latte (light) and Mocha (dark). `page` is GitHub's page background, used only by checks. */
export const themes = {
  light: {
    name: "light",
    page: "#ffffff",
    surface: "#eff1f5",
    border: "#ccd0da",
    track: "#dce0e8",
    text: "#4c4f69",
    muted: "#5c5f77",
    accent: "#8839ef",
    accent2: "#1e66f5",
    onAccent: "#ffffff",
    success: "#40a02b",
    warning: "#df8e1d",
    danger: "#d20f39",
  },
  dark: {
    name: "dark",
    page: "#0d1117",
    surface: "#1e1e2e",
    border: "#313244",
    track: "#45475a",
    text: "#cdd6f4",
    muted: "#a6adc8",
    accent: "#cba6f7",
    accent2: "#89b4fa",
    onAccent: "#11111b",
    success: "#a6e3a1",
    warning: "#f9e2af",
    danger: "#f38ba8",
  },
} as const satisfies { readonly [K in ThemeName]: Theme };

/** Checked for both themes on every build. Decorative and always labeled tokens are left out on purpose. */
export const contrastPairs = [
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "muted", bg: "surface", min: 4.5 },
  { fg: "accent", bg: "surface", min: 4.5 },
  { fg: "accent", bg: "page", min: 4.5 },
  { fg: "accent2", bg: "surface", min: 3 },
  { fg: "onAccent", bg: "accent", min: 4.5 },
  { fg: "onAccent", bg: "accent2", min: 4.5 },
] as const satisfies readonly ContrastPair[];

/** GitHub's own font stacks. System fonts only: an SVG in `<img>` can't load web fonts. */
export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
} as const satisfies { readonly [K in TypeStyle["family"]]: string };

/** Full width images use only 20px and up (they render at about 42% on a phone). */
export const typography = {
  display: { size: 48, weight: 700, family: "sans" },
  title: { size: 32, weight: 700, family: "sans" },
  heading: { size: 20, weight: 600, family: "sans" },
  lead: { size: 20, weight: 400, family: "sans" },
  body: { size: 14, weight: 400, family: "sans" },
  label: { size: 12, weight: 400, family: "sans" },
  number: { size: 24, weight: 600, family: "mono" },
  typing: { size: 22, weight: 400, family: "mono" },
  button: { size: 14, weight: 600, family: "sans" },
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
 * Tech stack cards (spec 0005, docs/design.md "Stack card anatomy"): chips in `columns` columns under the card
 * heading. `headingGap` runs from the heading box to the first chip row, `chipPadX` from the chip edge to the
 * icon (and from the text end to the chip edge), `iconGap` from the icon to the name.
 */
export const stackCard = {
  columns: 2,
  headingGap: 16,
  chipHeight: 32,
  gapX: 16,
  gapY: 8,
  chipPadX: 12,
  icon: 16,
  iconGap: 8,
} as const satisfies { readonly [name: string]: number };

/**
 * LeetCode solved card (spec 0006, docs/design.md "Solved card anatomy"): a 270 degree arc of Easy, Medium, and
 * Hard segments around (`cx`, `cy`), plus three difficulty chips on the right. Angles are in degrees. The card is
 * `2 × layout.pad + 3 × chipHeight + 2 × chipGap` tall. Chip offsets (`dotX` to `chipValueY`) are from the chip's
 * top left corner.
 */
export const solvedCard = {
  cx: 136,
  cy: 107,
  radius: 80,
  stroke: 6,
  span: 270,
  segmentGap: 6,
  trackOpacity: 0.25,
  numberBaseline: 112,
  numberSlot: 88,
  checkX: 104,
  checkY: 122,
  checkSize: 14,
  solvedX: 122,
  solvedY: 129,
  attemptingY: 162,
  attemptingSlot: 96,
  chipX: 264,
  chipWidth: 112,
  chipHeight: 44,
  chipGap: 8,
  dotX: 16,
  dotY: 14,
  dotRadius: 4,
  chipLabelX: 26,
  chipLabelY: 14,
  chipValueX: 12,
  chipValueY: 31,
  chipValueSlot: 88,
} as const satisfies { readonly [name: string]: number };

/**
 * LeetCode contest card (spec 0006, docs/design.md "Contest card anatomy"): `layout.full` wide. A left pane with the
 * stats row and the rating history chart, a divider at `dividerX + 0.5`, and a right pane with the Top value and the
 * rating histogram. `*X` and `*Slot` place each stat column; every text on this card is 20px or larger.
 */
export const contestCard = {
  height: 300,
  paneRight: 616,
  dividerX: 640,
  rightX: 664,
  rightWidth: 162,
  labelY: 34,
  valueY: 68,
  ratingX: 24,
  ratingSlot: 104,
  levelIconX: 144,
  levelIconY: 31,
  levelIcon: 40,
  levelX: 192,
  levelSlot: 120,
  rankX: 328,
  rankSlot: 176,
  attendedX: 520,
  attendedSlot: 96,
  chartLeft: 28,
  chartRight: 612,
  chartTop: 120,
  chartBottom: 240,
  flatSpan: 100,
  lineWidth: 2,
  dotRadius: 5,
  tipGap: 10,
  tipHeight: 28,
  tipPadX: 8,
  yearY: 266,
  barsBottom: 276,
  barsMaxHeight: 168,
  barGap: 2,
  barMinHeight: 2,
  barRadius: 1,
} as const satisfies { readonly [name: string]: number };

/**
 * Experience and education cards (spec 0007, docs/design.md "Timeline card anatomy"): `layout.full` wide, a
 * vertical rail at `railX` with a dot per entry, and text from `textX` to `layout.full − layout.pad`. Row 0 holds
 * the name and the dates, right aligned in `dateSlot`, `titleGap` apart. Rows are `lineHeight` apart, entries
 * `entryGap` apart, and highlight text starts `bulletIndent` after the bullet.
 */
export const timelineCard = {
  railX: 40,
  railWidth: 2,
  dotRadius: 7,
  dotStroke: 2,
  textX: 72,
  bulletIndent: 20,
  dateSlot: 228,
  titleGap: 16,
  lineHeight: 28,
  entryGap: 24,
} as const satisfies { readonly [name: string]: number };

/** Certifications (spec 0008, docs/design.md "Certifications"): each Credly badge PNG shows `badgeWidth` px wide. */
export const credlyGrid = { badgeWidth: 110 } as const satisfies { readonly [name: string]: number };

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
