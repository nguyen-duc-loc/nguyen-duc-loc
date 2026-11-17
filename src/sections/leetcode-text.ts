// Text helpers shared by the LeetCode cards (specs 0006 and 0009). Not a section: only `src/sections/leetcode.ts`
// and its card modules import it. Pure: numbers and strings in, markup out.

import type { FitResult } from "../svg.ts";
import type { TypeStyle } from "../theme.ts";

/** `6064` to `6,064`. Integers only. A fixed rule, never the locale. */
export function groupDigits(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export type Anchor = "start" | "middle" | "end";

export type TextOptions = {
  readonly x: number;
  readonly y: number;
  readonly anchor: Anchor;
  readonly classes: string;
  readonly style: TypeStyle;
  /** From `fitText`. Omitted: the style's own size. */
  readonly fit?: FitResult;
  readonly baseline?: "central" | "alphabetic";
};

/** A `<text>` element. `inner` is markup: escape outside text before passing it. */
export function textTag(
  { x, y, anchor, classes, style, fit, baseline = "central" }: TextOptions,
  inner: string,
): string {
  const size = fit?.size ?? style.size;
  const family = style.family === "mono" ? " font-mono" : "";
  const squeeze = fit?.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text class="${classes}${family}" x="${x}" y="${y}" dominant-baseline="${baseline}" text-anchor="${anchor}" font-size="${size}" font-weight="${style.weight}"${squeeze}>${inner}</text>`;
}
