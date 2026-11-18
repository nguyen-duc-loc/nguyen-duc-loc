// Shared SVG helpers every section draws through (spec 0003). Pure: strings in, strings out.
// Colors are class names only (`fill-accent`, `stroke-border`, `stop-accent2`); the values come from themeCss.

import { brands } from "./brands.ts";
import { escapeXml } from "./escape.ts";
import { type IconName, icons, isBrand } from "./icons.ts";
import {
  button,
  fonts,
  layout,
  motion,
  radius,
  type TextSlot,
  type Theme,
  themeCss,
  themes,
  typography,
} from "./theme.ts";
import type { SectionOutput } from "./types.ts";

export type SvgOptions = {
  readonly width: number;
  readonly height: number;
  /** Extra CSS, keyframes and layout only. Never colors: use the color classes. */
  readonly css?: string;
  readonly body: string;
};

export type FitResult = { readonly size: number; readonly textLength?: number };

const ease = motion.easing;

/**
 * Base styles are the final frame; keyframes animate from the start state, and `both` keeps an item
 * hidden until its delay ends. So turning animation off always leaves the finished picture.
 */
const BASE_CSS = [
  `svg{font-family:${fonts.sans}}`,
  `.font-mono{font-family:${fonts.mono}}`,
  `.enter{animation:enter ${motion.enter.duration}ms ${ease} both}`,
  `@keyframes enter{from{opacity:0;transform:translateY(${motion.enter.distance}px)}}`,
  // Bars: scale from the left edge. Gauges: set --gauge-empty to the stroke-dashoffset of an empty gauge.
  `.grow{animation:grow ${motion.fill.duration}ms ${ease} both;transform-box:fill-box;transform-origin:left center}`,
  "@keyframes grow{from{transform:scaleX(0)}}",
  `.gauge{animation:gauge ${motion.fill.duration}ms ${ease} both}`,
  "@keyframes gauge{from{stroke-dashoffset:var(--gauge-empty)}}",
  // Vertical bars: scale up from the bottom edge.
  `.rise{animation:rise ${motion.fill.duration}ms ${ease} both;transform-box:fill-box;transform-origin:center bottom}`,
  "@keyframes rise{from{transform:scaleY(0)}}",
].join("");

const REDUCED_MOTION_CSS = "@media (prefers-reduced-motion: reduce){*{animation:none !important}}";

/** A complete, self contained SVG whose one `<style>` starts with the theme's color classes. */
export function svgDocument(theme: Theme, { width, height, css = "", body }: SvgOptions): string {
  const style = `${themeCss(theme)}${BASE_CSS}${css}${REDUCED_MOTION_CSS}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<style>${style}</style>`,
    body,
    "</svg>",
  ].join("\n");
}

/** `svgDocument` with the card background first: inset half a pixel so the border isn't clipped. */
export function card(theme: Theme, options: SvgOptions): string {
  const { width, height, body } = options;
  const rect = `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius.card}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`;
  return svgDocument(theme, { ...options, body: `${rect}\n${body}` });
}

/** Attribute text for the i-th item of a staggered entrance. */
export function enter(i: number, classes?: string): string {
  const names = classes ? `enter ${classes}` : "enter";
  return `class="${names}" style="animation-delay:${i * motion.enter.stagger}ms"`;
}

/**
 * Font size for `text` in `slot`, with no measuring: assumes each character is 0.6 × size wide.
 * Below `minSize`, returns `minSize` plus `textLength`, so the caller squeezes the text to fit exactly.
 */
export function fitText(text: string, slot: TextSlot): FitResult {
  const count = [...text].length;
  if (count === 0) return { size: slot.style.size };
  // width / (0.6 × count), in integers so the result never depends on float rounding.
  const size = Math.min(slot.style.size, Math.floor((slot.width * 5) / (3 * count)));
  return size < slot.minSize ? { size: slot.minSize, textLength: slot.width } : { size };
}

export type WrappedLine = { readonly text: string; readonly fit: FitResult };

/**
 * Splits `text` into lines for `slot`, with the same `0.6 × size` estimate as `fitText`: words are filled greedily
 * into lines of at most `floor(width × 5 / (3 × size))` characters. A word longer than a whole line gets its own
 * line, which `fitText` then squeezes. Text is never cut off.
 */
export function wrapLines(text: string, slot: TextSlot): readonly WrappedLine[] {
  const max = Math.max(1, Math.floor((slot.width * 5) / (3 * slot.style.size)));
  const words = text.split(/ +/).filter((word) => word !== "");
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last !== undefined && [...last].length + 1 + [...word].length <= max) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines.map((line) => ({ text: line, fit: fitText(line, slot) }));
}

export type ThemedImageOptions = {
  /** Asset base name: writes `<base>-light.svg` and `<base>-dark.svg`. */
  readonly base: string;
  /** Raw alt text. Escaped here, once. */
  readonly alt: string;
  readonly width: "100%" | number;
  readonly render: (theme: Theme) => string;
  /** One line with no spaces between tags, so a row of them wraps like words (table cells, headings). */
  readonly inline?: boolean;
};

/** A `<picture>` that follows the visitor's GitHub theme, plus both SVGs. The light file is the fallback. */
export function themedImage({ base, alt, width, render, inline = false }: ThemedImageOptions): SectionOutput {
  const light = `${base}-light.svg`;
  const dark = `${base}-dark.svg`;
  const lines = [
    "<picture>",
    `<source media="(prefers-color-scheme: dark)" srcset="assets/generated/${dark}">`,
    `<img alt="${escapeXml(alt)}" src="assets/generated/${light}" width="${width}">`,
    "</picture>",
  ];
  const markdown = inline ? lines.join("") : [lines[0], `  ${lines[1]}`, `  ${lines[2]}`, lines[3]].join("\n");
  return {
    markdown,
    assets: [
      { file: light, content: render(themes.light) },
      { file: dark, content: render(themes.dark) },
    ],
  };
}

export type OutsideImageOptions = { readonly src: string; readonly alt: string; readonly width: number };

/**
 * A third party image (spec 0008, docs/design.md "Certifications"), such as a Credly badge PNG, inside
 * `<picture>` with the dark source and the `<img>` both pointing at the same file. One line, so a row of them
 * wraps like inline images. `src` and `alt` are plain text, escaped once here.
 */
export function outsideImage({ src, alt, width }: OutsideImageOptions): string {
  const url = escapeXml(src);
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="${url}"><img alt="${escapeXml(alt)}" src="${url}" width="${width}"></picture>`;
}

const VIEW_BOX = /viewBox="([^"]*)"/;

/** A brand's file for `theme`: its `dark` file on the dark theme when it has one, else its `light` file. */
function brandFile(theme: Theme, name: IconName): string | undefined {
  if (!isBrand(name)) return undefined;
  const brand: { readonly light: string; readonly dark?: string } = brands[name];
  return theme.name === "dark" ? (brand.dark ?? brand.light) : brand.light;
}

/** Width over height of an icon: 1 for a glyph, from the light file's `viewBox` for a brand logo. */
function aspect(name: IconName): number {
  if (!isBrand(name)) return 1;
  const box = VIEW_BOX.exec(brands[name].light)?.[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return box === undefined || box.length !== 4 || !(box[2] > 0 && box[3] > 0) ? 1 : box[2] / box[3];
}

/** The drawn width of an icon `size` px tall: wider than `size` for a wide logo (AWS, Go). */
export function iconWidth(name: IconName, size: number): number {
  return Math.round(size * aspect(name));
}

/**
 * An icon at (x, y), `size` tall and `iconWidth` wide. A glyph from `src/icons.ts` is a nested SVG painted by
 * `classes`. A brand logo from `src/brands.ts` is its whole full color file for the theme, embedded as a
 * `data:image/svg+xml` image, so `classes` is not used for it (spec 0010).
 */
export function iconSvg(theme: Theme, name: IconName, x: number, y: number, size: number, classes: string): string {
  const width = iconWidth(name, size);
  const file = brandFile(theme, name);
  if (file !== undefined) {
    const href = `data:image/svg+xml;base64,${Buffer.from(file).toString("base64")}`;
    return `<image x="${x}" y="${y}" width="${width}" height="${size}" preserveAspectRatio="xMidYMid meet" href="${href}"/>`;
  }
  const glyph = isBrand(name) ? undefined : icons[name];
  return `<svg x="${x}" y="${y}" width="${width}" height="${size}" viewBox="0 0 24 24"><path class="${classes}" d="${glyph?.path ?? ""}"/></svg>`;
}

export type PillButtonOptions = { readonly icon: IconName; readonly label: string };

/** Estimated width of `text` at `size`, `0.6 × size` per character, in integers (the `fitText` estimate). */
export function textWidth(text: string, size: number): number {
  return Math.ceil((3 * size * [...text].length) / 5);
}

/**
 * A contact pill (spec 0004, centered by spec 0010; docs/design.md "Button anatomy"): the icon, in its brand color,
 * and the label, centered together inside a bordered pill, with a transparent `button.margin` around it so buttons
 * sit apart in a row. Static: no animation.
 */
export function pillButton(theme: Theme, { icon, label }: PillButtonOptions): string {
  const { width, height, margin, padX, gap } = button;
  const drawn = iconWidth(icon, button.icon);
  const slot = { width: width - padX - drawn - gap - padX, style: typography.button, minSize: 12 };
  const fit = fitText(label, slot);
  const labelWidth = fit.textLength ?? textWidth(label, fit.size);
  const groupX = margin + Math.round((width - (drawn + gap + labelWidth)) / 2);
  const labelX = groupX + drawn + gap;
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  const body = [
    `<rect x="${margin + 0.5}" y="${margin + 0.5}" width="${width - 1}" height="${height - 1}" rx="${radius.pill}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
    iconSvg(theme, icon, groupX, margin + (height - button.icon) / 2, button.icon, "fill-accent"),
    `<text class="fill-text" x="${labelX}" y="${margin + height / 2}" dominant-baseline="central" text-anchor="start" font-size="${fit.size}" font-weight="${slot.style.weight}"${squeeze}>${escapeXml(label)}</text>`,
  ].join("\n");
  return svgDocument(theme, { width: width + 2 * margin, height: height + 2 * margin, body });
}

/** Size of a section heading icon, in px: GitHub draws an `<h2>` at 24px. */
const HEADING_ICON = 24;

export type SectionHeadingOptions = {
  /** Writes `heading-<key>-light.svg` and `heading-<key>-dark.svg`. */
  readonly key: string;
  readonly title: string;
  readonly icon: IconName;
};

/**
 * A left aligned `<h2>` led by its icon (spec 0010, docs/design.md "Section headings"). The icon is decorative, so its
 * alt text is empty and a screen reader reads only the title. Brand icons use their brand color, others `accent`.
 */
export function sectionHeading({ key, title, icon }: SectionHeadingOptions): SectionOutput {
  const image = themedImage({
    base: `heading-${key}`,
    alt: "",
    width: HEADING_ICON,
    inline: true,
    render: (theme) =>
      svgDocument(theme, {
        width: HEADING_ICON,
        height: HEADING_ICON,
        body: iconSvg(theme, icon, 0, 0, HEADING_ICON, "fill-accent"),
      }),
  });
  return { markdown: `<h2>${image.markdown} ${escapeXml(title)}</h2>`, assets: image.assets };
}
