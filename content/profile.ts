// Who you are. Edit this file, then run `pnpm build`. Never edit README.md by hand.
// Everything here is public, so never add a phone number, street address, or anything private.

import type { Profile } from "./types.ts";

export const profile = {
  name: "Loc Nguyen",
  title: "Cloud Developer",
  location: "Hanoi, Vietnam",
  bio: "You can't beat someone who is having fun.",
  typingPhrases: ["Cloud Developer", "LeetCode Guardian"],
  accounts: {
    github: "nguyen-duc-loc",
    linkedin: "nguyenducloc404",
    leetcode: "nguyenducloc",
    credly: "nguyenducloc",
  },
  email: "nguyenducloc404@gmail.com",
} as const satisfies Profile;
