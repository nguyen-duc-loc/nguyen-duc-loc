// All content in one place. Sections read it through BuildContext; sources read usernames from it.

import { education } from "./education.ts";
import { experience } from "./experience.ts";
import { profile } from "./profile.ts";
import { projects } from "./projects.ts";
import { stack } from "./stack.ts";
import type { Content } from "./types.ts";

export const content = { profile, stack, experience, education, projects } as const satisfies Content;
