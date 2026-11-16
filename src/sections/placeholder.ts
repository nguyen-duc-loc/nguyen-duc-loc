import type { Section } from "../types.ts";

// Removed once feature 5 (header) or 6 (about me) lands.
const UNDER_CONSTRUCTION = "> 🚧 Profile under construction.";

export const placeholder: Section = ({ content: { profile } }) => ({
  markdown: [`# ${profile.name}`, `**${profile.title}**`, UNDER_CONSTRUCTION].join("\n\n"),
});
