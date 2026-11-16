// The header banner (spec 0003, docs/design.md "Header banner"): name and title on a Mauve to Blue
// gradient, with two layered waves along the bottom edge. The back wave drifts one period, then settles.

import { escapeXml } from "../escape.ts";
import { enter, fitText, svgDocument, themedImage } from "../svg.ts";
import { layout, motion, radius, type TextSlot, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const WIDTH = layout.full;
const HEIGHT = 220;
const CENTER = WIDTH / 2;
const SLOT_WIDTH = WIDTH - 2 * layout.pad;
const MIN_SIZE = 20;
const GRADIENT_ID = "banner-gradient";

type Wave = { readonly baseline: number; readonly amplitude: number; readonly period: number };

/** The front wave closes the banner body. The back wave sits a little lower and peeks out below it. */
const FRONT = { baseline: 176, amplitude: 10, period: WIDTH / 2 } as const satisfies Wave;
const BACK = { baseline: 188, amplitude: 14, period: 340 } as const satisfies Wave;
/** Where the back wave's shape starts at the top. Hidden behind the opaque front, so any value above the front works. */
const BACK_TOP = FRONT.baseline - FRONT.amplitude - 20;

type Line = { readonly slot: TextSlot; readonly y: number };

const nameLine = { slot: { width: SLOT_WIDTH, style: typography.display, minSize: MIN_SIZE }, y: 84 } as const;
const titleLine = { slot: { width: SLOT_WIDTH, style: typography.heading, minSize: MIN_SIZE }, y: 122 } as const;

/**
 * A sine like curve from x = 0 to at least x = `to`, left to right, in half period steps.
 * Each `Q` or `T` step is half a period; the control point sits at twice the amplitude, so the crest is `amplitude`.
 */
function wavePath({ baseline, amplitude, period }: Wave, to: number): string {
  const half = period / 2;
  const steps = Math.ceil(to / half);
  const first = `Q${half / 2} ${baseline - 2 * amplitude} ${half} ${baseline}`;
  const rest = Array.from({ length: steps - 1 }, (_, i) => `T${(i + 2) * half} ${baseline}`);
  return [`M0 ${baseline}`, first, ...rest].join(" ");
}

/** The banner body: rounded top corners, straight sides, and the front wave as its bottom edge. */
function bodyPath(): string {
  const r = radius.card;
  return `${wavePath(FRONT, WIDTH)} V${r} A${r} ${r} 0 0 0 ${WIDTH - r} 0 H${r} A${r} ${r} 0 0 0 0 ${r} Z`;
}

/** The back wave, one period wider than the banner so it can drift a full period with no gap. */
function backPath(): string {
  return `${wavePath(BACK, WIDTH + BACK.period)} V${BACK_TOP} H0 Z`;
}

const CSS = [
  `.drift{animation:drift ${motion.wave.duration}ms ${motion.easing} both}`,
  `@keyframes drift{from{transform:translateX(-${BACK.period}px)}}`,
].join("");

function textLine(text: string, { slot, y }: Line, i: number): string {
  const fit = fitText(text, slot);
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text ${enter(i, "fill-onAccent")} x="${CENTER}" y="${y}" text-anchor="middle" font-size="${fit.size}" font-weight="${slot.style.weight}"${squeeze}>${escapeXml(text)}</text>`;
}

export const header: Section = ({ content: { profile } }) => {
  // userSpaceOnUse from (0,0) to (d,d) runs at 45 degrees on screen (CSS 135deg); d puts offset 1 on the far corner.
  const d = (WIDTH + HEIGHT) / 2;
  const body = [
    "<defs>",
    `<linearGradient id="${GRADIENT_ID}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${d}" y2="${d}">`,
    '<stop class="stop-accent" offset="0"/>',
    '<stop class="stop-accent2" offset="1"/>',
    "</linearGradient>",
    "</defs>",
    `<path class="drift" d="${backPath()}" fill="url(#${GRADIENT_ID})" fill-opacity="0.5"/>`,
    `<path d="${bodyPath()}" fill="url(#${GRADIENT_ID})"/>`,
    textLine(profile.name, nameLine, 0),
    textLine(profile.title, titleLine, 1),
  ].join("\n");
  return themedImage({
    base: "header",
    alt: `${profile.name}, ${profile.title}`,
    width: "100%",
    render: (theme) => svgDocument(theme, { width: WIDTH, height: HEIGHT, css: CSS, body }),
  });
};
