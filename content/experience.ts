// Your roles, any order (the timeline sorts them newest first). Two jobs at one company are two entries.
// Dates are `YYYY-MM`; `end: null` means current. Each role has 1 or 2 highlights of at most 120 characters.
// `logo` is a PNG or JPEG in assets/static/logos/; leave it out to show the company's initial instead.

import type { Role } from "./types.ts";

export const experience = [
  {
    company: "Noventiq Vietnam",
    title: "Junior Solutions Sales",
    start: "2025-05",
    end: null,
    highlights: ["Advise customers on Amazon Web Services (AWS) solutions in my first full time role."],
    location: "Hanoi, Vietnam",
    logo: "noventiq.png",
  },
  {
    company: "CMC Telecom",
    title: "Cloud Engineer",
    start: "2025-01",
    end: "2025-05",
    highlights: ["Learned AWS from zero on the job, the start of my path as a cloud engineer."],
    location: "Hanoi, Vietnam",
    logo: "cmc-telecom.png",
  },
  {
    company: "FPT Software",
    title: "Frontend Web Developer",
    start: "2024-06",
    end: "2024-08",
    highlights: ["Worked remotely on front end web development."],
    location: "Hanoi, Vietnam",
    logo: "fpt-software.png",
  },
] as const satisfies readonly Role[];
