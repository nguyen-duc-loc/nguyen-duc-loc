// Your schools, any order (the timeline sorts them newest first). Dates are `YYYY-MM`.
// `note` is for honors or a GPA, at most 120 characters. `logo` is a PNG or JPEG in assets/static/logos/.
// `stars` (1 to 5) are drawn before the note.

import type { School } from "./types.ts";

export const education = [
  {
    school: "VNU University of Engineering and Technology",
    degree: "Engineer's degree",
    field: "Computer Networks and Data Communications",
    start: "2021-09",
    end: "2026-02",
    note: "High Distinction",
    stars: 4,
    logo: "uet.png",
  },
  {
    school: "Hong Quang High School",
    degree: "High school diploma",
    start: "2018-09",
    end: "2021-07",
    logo: "hong-quang.png",
  },
] as const satisfies readonly School[];
