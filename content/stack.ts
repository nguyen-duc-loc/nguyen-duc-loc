// Your tech stack, shown in file order within each group.
// `icon` is a Simple Icons slug (https://simpleicons.org). Leave it out when the brand has none.

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
  cloud: [{ name: "AWS" }],
} as const satisfies Stack;
