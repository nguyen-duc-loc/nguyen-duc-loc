// The shape of everything in content/ (spec 0002). Types catch typos at `pnpm typecheck`;
// src/content.ts checks the rules types can't express (lengths, counts, dates, URLs) at build time.
// All text is plain text: no Markdown or HTML. Every value here is public.

import type { IconName } from "../src/icons.ts";

/** `YYYY-MM`, for example `"2024-06"`. The exact format is checked at build time. */
export type YearMonth = `${number}-${number}`;

/** Usernames only, never full URLs. Buttons and fetchers both derive from these. */
export type Accounts = {
  readonly github: string;
  readonly linkedin: string;
  readonly leetcode: string;
  readonly credly: string;
};

export type Profile = {
  readonly name: string;
  readonly title: string;
  /** City and country only. */
  readonly location: string;
  readonly bio: string;
  readonly typingPhrases: readonly string[];
  readonly accounts: Accounts;
  /** Public on purpose. */
  readonly email: string;
};

export type StackItem = {
  readonly name: string;
  /**
   * A brand logo key in `src/brands.ts` (or a glyph in `src/icons.ts`), for example `"typescript"`. Leave it out
   * when the brand has none. A new brand needs its files added there first (specs 0005 and 0010).
   */
  readonly icon?: IconName;
};

export type Stack = {
  readonly languages: readonly StackItem[];
  readonly frameworks: readonly StackItem[];
  readonly tools: readonly StackItem[];
  readonly cloud: readonly StackItem[];
};

export type Role = {
  readonly company: string;
  readonly title: string;
  readonly start: YearMonth;
  /** `null` means this is your current role. */
  readonly end: YearMonth | null;
  readonly highlights: readonly string[];
  readonly location?: string;
  readonly companyUrl?: string;
  /** A PNG or JPEG file name in `assets/static/logos/`, for example `"fpt-software.png"`. Left out: an initial. */
  readonly logo?: string;
};

export type School = {
  readonly school: string;
  readonly degree: string;
  readonly field?: string;
  readonly start: YearMonth;
  /** `null` means you are still studying here. */
  readonly end: YearMonth | null;
  /** Honors or GPA. */
  readonly note?: string;
  /** 1 to 5 stars drawn before `note` (spec 0010), for example 4 for High Distinction. Needs a `note`. */
  readonly stars?: number;
  /** A PNG or JPEG file name in `assets/static/logos/`, for example `"uet.png"`. Left out: an initial. */
  readonly logo?: string;
};

export type Project = {
  readonly name: string;
  readonly description: string;
  /** Free names, not linked to the stack. */
  readonly tech: readonly string[];
  /** Set `repoUrl`, `demoUrl`, or both. */
  readonly repoUrl?: string;
  readonly demoUrl?: string;
};

export type Content = {
  readonly profile: Profile;
  readonly stack: Stack;
  readonly experience: readonly Role[];
  readonly education: readonly School[];
  readonly projects: readonly Project[];
};
