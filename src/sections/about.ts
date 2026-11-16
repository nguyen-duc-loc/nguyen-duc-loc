// About me (spec 0004, docs/design.md "About me"): a centered heading, the bio, and the location as real
// Markdown text, so GitHub colors it for every theme and people can select and translate it.

import { escapeXml } from "../escape.ts";
import type { Section } from "../types.ts";

const HEADING = "About me";
const LOCATION_PREFIX = "📍 ";

export const about: Section = ({ content: { profile } }) => {
  const markdown = [
    `<h2 align="center">${HEADING}</h2>`,
    `<p align="center">${escapeXml(profile.bio)}</p>`,
    `<p align="center">${LOCATION_PREFIX}${escapeXml(profile.location)}</p>`,
  ].join("\n\n");
  return { markdown };
};
