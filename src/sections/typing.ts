// The typing line under the banner (spec 0003, docs/design.md "Typing line"). Each typing state is a whole
// prefix frame, shown one at a time by an opacity keyframe. The base style shows only the last phrase, so with
// animation off (or after it ends) the line rests on the last phrase with no cursor.

import { escapeXml } from "../escape.ts";
import { fitText, svgDocument, themedImage } from "../svg.ts";
import { layout, motion, type TextSlot, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const WIDTH = layout.full;
const HEIGHT = 48;
const CENTER = WIDTH / 2;
const CURSOR = "▌";
const MAX_PHRASES = 3;
const slot = {
  width: WIDTH - 2 * layout.pad,
  style: typography.typing,
  minSize: typography.typing.size,
} as const satisfies TextSlot;

/** One state of the line before the last phrase: its text and how long it shows, in ms. */
type Frame = { readonly text: string; readonly ms: number };
type Timeline = { readonly frames: readonly Frame[]; readonly final: string; readonly end: number };

const prefix = (chars: readonly string[], k: number): string => chars.slice(0, k).join("");

/** Every state before the last phrase rests, with `hold` ms on each full phrase except the last. */
function timeline(phrases: readonly string[], hold: number): Timeline {
  const { type, delete: del, pause } = motion.typing;
  const frames: Frame[] = [{ text: CURSOR, ms: pause }];
  phrases.forEach((phrase, i) => {
    const chars = [...phrase];
    const last = i === phrases.length - 1;
    // The last phrase's full frame is the final frame, so it isn't pushed here.
    const typed = last ? chars.length - 1 : chars.length;
    for (let k = 1; k <= typed; k++) {
      frames.push({ text: prefix(chars, k) + CURSOR, ms: k === chars.length ? hold : type });
    }
    if (last) return;
    for (let k = chars.length - 1; k >= 1; k--) frames.push({ text: prefix(chars, k) + CURSOR, ms: del });
    frames.push({ text: CURSOR, ms: pause });
  });
  const end = frames.reduce((sum, { ms }) => sum + ms, 0);
  return { frames, final: phrases.at(-1) ?? "", end };
}

/** Uses `motion.typing.hold`, shortened evenly when needed so the whole run ends within `motion.budget`. */
function fittedTimeline(phrases: readonly string[]): Timeline {
  const full = timeline(phrases, motion.typing.hold);
  if (full.end <= motion.budget) return full;
  const holds = phrases.length - 1;
  const fixed = timeline(phrases, 0).end;
  const hold = holds > 0 ? Math.floor((motion.budget - fixed) / holds) : -1;
  if (hold < 0) {
    throw new Error(
      `typing line: the phrases take ${fixed} ms to type even with no holds, over the ${motion.budget} ms motion budget. Use shorter phrases in content/profile.ts.`,
    );
  }
  return timeline(phrases, hold);
}

const CSS = [
  ".frame{opacity:0;animation:show 1ms linear}",
  "@keyframes show{from,to{opacity:1}}",
  "@keyframes hide{from,to{opacity:0}}",
].join("");

export const typingIntro: Section = ({ content: { profile } }) => {
  const phrases = profile.typingPhrases.slice(0, MAX_PHRASES);
  const { frames, final, end } = fittedTimeline(phrases);

  const longest = phrases.toSorted((a, b) => [...b].length - [...a].length)[0] ?? "";
  const fit = fitText(longest + CURSOR, slot);
  if (fit.textLength !== undefined) {
    throw new Error(`typing line: "${longest}" is too long to fit at ${slot.minSize}px. Use a shorter phrase.`);
  }
  const y = Math.round(HEIGHT / 2 + fit.size * 0.35);

  let start = 0;
  const frameTexts = frames.map(({ text, ms }) => {
    const style = `animation-duration:${ms}ms;animation-delay:${start}ms`;
    start += ms;
    return `<text class="frame" style="${style}" x="${CENTER}" y="${y}">${escapeXml(text)}</text>`;
  });
  const finalText = `<text style="animation:hide ${end}ms linear" x="${CENTER}" y="${y}">${escapeXml(final)}</text>`;

  const body = [
    `<g class="font-mono fill-accent" font-size="${fit.size}" font-weight="${slot.style.weight}" text-anchor="middle">`,
    ...frameTexts,
    finalText,
    "</g>",
  ].join("\n");

  return themedImage({
    base: "typing",
    alt: `Typing intro: ${phrases.join(", ")}`,
    width: "100%",
    render: (theme) => svgDocument(theme, { width: WIDTH, height: HEIGHT, css: CSS, body }),
  });
};
