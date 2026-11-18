// Your tech stack, shown in file order within each group. Each group holds 1 to 8 items.
// `icon` is a brand logo in src/brands.ts (full color files, for example from https://thesvg.org).
// For a new brand, add its files there first. Leave `icon` out when the brand has none.

import type { Stack } from "./types.ts";

export const stack = {
  languages: [
    { name: "TypeScript", icon: "typescript" },
    { name: "Go", icon: "go" },
    { name: "C++", icon: "cplusplus" },
    { name: "Bash", icon: "bash" },
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
  cloud: [{ name: "Amazon Web Services", icon: "aws" }],
} as const satisfies Stack;
