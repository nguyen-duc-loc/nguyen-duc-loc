// The themed "under construction" sample card (spec 0003). Feature 5 replaces it with the banner and typing line.

import { escapeXml } from "../escape.ts";
import { card, enter, fitText, themedImage } from "../svg.ts";
import { layout, type TextSlot, typography } from "../theme.ts";
import type { Section } from "../types.ts";

const STATUS = "Profile under construction";
const WIDTH = layout.full;
const HEIGHT = 200;
const CENTER = WIDTH / 2;
const SLOT_WIDTH = WIDTH - 2 * layout.pad;
const MIN_SIZE = 20;

type Line = { readonly slot: TextSlot; readonly color: string; readonly y: number };

const lines = [
  { slot: { width: SLOT_WIDTH, style: typography.title, minSize: MIN_SIZE }, color: "fill-accent", y: 72 },
  { slot: { width: SLOT_WIDTH, style: typography.heading, minSize: MIN_SIZE }, color: "fill-text", y: 108 },
  { slot: { width: SLOT_WIDTH, style: typography.lead, minSize: MIN_SIZE }, color: "fill-muted", y: 140 },
  { slot: { width: SLOT_WIDTH, style: typography.lead, minSize: MIN_SIZE }, color: "fill-muted", y: 172 },
] as const satisfies readonly Line[];

function textLine(text: string, { slot, color, y }: Line, i: number): string {
  const fit = fitText(text, slot);
  const squeeze = fit.textLength ? ` textLength="${fit.textLength}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text ${enter(i, color)} x="${CENTER}" y="${y}" text-anchor="middle" font-size="${fit.size}" font-weight="${slot.style.weight}"${squeeze}>${escapeXml(text)}</text>`;
}

export const placeholder: Section = ({ content: { profile } }) => {
  const texts = [profile.name, profile.title, profile.location, STATUS];
  const body = texts.map((text, i) => textLine(text, lines[i], i)).join("\n");
  return themedImage({
    base: "placeholder-card",
    alt: `${profile.name}, ${profile.title}, ${profile.location}. ${STATUS}.`,
    width: "100%",
    render: (theme) => card(theme, { width: WIDTH, height: HEIGHT, body }),
  });
};
