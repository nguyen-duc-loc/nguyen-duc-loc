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
} as const satisfies { readonly [name: string]: TypeStyle };

/** Spacing scale in px. */
export const space = [4, 8, 12, 16, 24, 32] as const satisfies readonly number[];

export const radius = { card: 12, small: 6 } as const satisfies { readonly [name: string]: number };

/** `full` renders at `width="100%"`, `half` at `width="400"` so two sit side by side on desktop. */
export const layout = { full: 850, half: 400, pad: 24, border: 1 } as const satisfies {
  readonly [name: string]: number;
};

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
