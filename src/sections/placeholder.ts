import type { Section } from "../types.ts";

// Removed once feature 5 (header) or 6 (about me) lands.
const UNDER_CONSTRUCTION =
  "> 🚧 Profile under construction. [Old notes](https://github.com/nguyen-duc-loc/verify-0001-missing-repo)";

export const placeholder: Section = ({ profile }) => ({
  markdown: [`# ${profile.name}`, `**${profile.title}**`, UNDER_CONSTRUCTION].join("\n\n"),
});
