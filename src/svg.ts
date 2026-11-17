// Shared SVG helpers every section draws through (spec 0003). Pure: strings in, strings out.
// Colors are class names only (`fill-accent`, `stroke-border`, `stop-accent2`); the values come from themeCss.

import { escapeXml } from "./escape.ts";
import { type IconName, icons } from "./icons.ts";
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

export type ThemedImageOptions = {
  /** Asset base name: writes `<base>-light.svg` and `<base>-dark.svg`. */
  readonly base: string;
  /** Raw alt text. Escaped here, once. */
  readonly alt: string;
  readonly width: "100%" | number;
  readonly render: (theme: Theme) => string;
};

/** A `<picture>` that follows the visitor's GitHub theme, plus both SVGs. The light file is the fallback. */
export function themedImage({ base, alt, width, render }: ThemedImageOptions): SectionOutput {
  const light = `${base}-light.svg`;
  const dark = `${base}-dark.svg`;
  const markdown = [
    "<picture>",
    `  <source media="(prefers-color-scheme: dark)" srcset="assets/generated/${dark}">`,
    `  <img alt="${escapeXml(alt)}" src="assets/generated/${light}" width="${width}">`,
    "</picture>",
  ].join("\n");
  return {
    markdown,
    assets: [
      { file: light, content: render(themes.light) },
      { file: dark, content: render(themes.dark) },
    ],
  };
}

/** An icon from `src/icons.ts` as a nested `size` × `size` SVG at (x, y), painted by `classes`. */
export function iconSvg(name: IconName, x: number, y: number, size: number, classes: string): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24"><path class="${classes}" d="${icons[name].path}"/></svg>`;
}

export type PillButtonOptions = { readonly icon: IconName; readonly label: string };

/**
 * A contact pill (spec 0004, docs/design.md "Button anatomy"): icon then label inside a bordered pill, with a
 * transparent `button.margin` around it so buttons sit apart in a row. Static: no animation.
 */
export function pillButton(theme: Theme, { icon, label }: PillButtonOptions): string {
  const { width, height, margin, padX, gap } = button;
  const iconX = margin + padX;
  const labelX = iconX + button.icon + gap;
  const slot = { width: width - padX - button.icon - gap - padX, style: typography.button, minSize: 12 };
  const fit = fitText(label, slot);
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  const body = [
    `<rect x="${margin + 0.5}" y="${margin + 0.5}" width="${width - 1}" height="${height - 1}" rx="${radius.pill}" class="fill-surface stroke-border" stroke-width="${layout.border}"/>`,
    iconSvg(icon, iconX, margin + (height - button.icon) / 2, button.icon, "fill-accent"),
    `<text class="fill-text" x="${labelX}" y="${margin + height / 2}" dominant-baseline="central" text-anchor="start" font-size="${fit.size}" font-weight="${slot.style.weight}"${squeeze}>${escapeXml(label)}</text>`,
  ].join("\n");
  return svgDocument(theme, { width: width + 2 * margin, height: height + 2 * margin, body });
}
