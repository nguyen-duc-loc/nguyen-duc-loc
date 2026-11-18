// Your tech stack, shown in file order within each group. Each group holds 1 to 8 items.
// `icon` is a key of the icon registry in src/icons.ts (Simple Icons slugs, https://simpleicons.org).
// For a new brand, copy its path into the registry first. Leave `icon` out when the brand has none.

import type { Stack } from "./types.ts";

export const stack = {
  languages: [
    { name: "TypeScript", icon: "typescript" },
    { name: "Go", icon: "go" },
    { name: "C++", icon: "cplusplus" },
    { name: "Bash", icon: "gnubash" },
  ],
  frameworks: [
    { name: "React", icon: "react" },
    { name: "Next.js", icon: "nextdotjs" },
  ],
  tools: [
    { name: "Git", icon: "git" },
    { name: "Docker", icon: "docker" },
    { name: "Terraform", icon: "terraform" },
    { name: "Linux", icon: "linux" },
    { name: "Kubernetes", icon: "kubernetes" },
  ],
  cloud: [{ name: "AWS", icon: "aws" }],
} as const satisfies Stack;
