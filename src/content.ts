// Content rules that types can't express, plus the link helpers (spec 0002).
// Pure functions: no network, no file system, no clock.

import type { Accounts, Content, Profile, Project, Role, School, Stack } from "../content/types.ts";
import { icons } from "./icons.ts";

const SHORT_TEXT_MAX = 80;
const BIO_MAX = 300;
const TYPING_PHRASE_MAX = 40;
const LONG_TEXT_MAX = 120;
/** Keeps all four tech stack cards at 1 to 4 chip rows, since they share the tallest height (spec 0005). */
const STACK_CATEGORY_MAX = 8;
/** Keeps the timeline cards a readable height: about 1,200px at 6 roles (spec 0007). */
const EXPERIENCE_MAX = 6;
const EDUCATION_MAX = 4;

const LINE_BREAK = /[\r\n\u2028\u2029]/;
const HTTPS_URL = /^https:\/\/\S+$/;
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const EMAIL = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** In the order problems are reported. */
const ACCOUNT_RULES = [
  ["github", /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/],
  ["linkedin", /^[A-Za-z0-9-]{3,100}$/],
  ["leetcode", /^[A-Za-z0-9_-]+$/],
  ["credly", /^[A-Za-z0-9._-]+$/],
] as const satisfies readonly (readonly [keyof Accounts, RegExp])[];

const STACK_CATEGORIES = ["languages", "frameworks", "tools", "cloud"] as const satisfies readonly (keyof Stack)[];

export type ProfileUrls = {
  readonly github: string;
  readonly linkedin: string;
  readonly leetcode: string;
  readonly credly: string;
};

/** Profile links built from usernames, so a button and a fetcher can never disagree. */
export function profileUrls(accounts: Accounts): ProfileUrls {
  return {
    github: `https://github.com/${accounts.github}`,
    linkedin: `https://www.linkedin.com/in/${accounts.linkedin}`,
    leetcode: `https://leetcode.com/u/${accounts.leetcode}`,
    credly: `https://www.credly.com/users/${accounts.credly}`,
  };
}

export function mailtoUrl(email: string): string {
  return `mailto:${email}`;
}

type Entry = { readonly path: string; readonly value: string };

const problem = (path: string, message: string): string => `${path}: ${message}`;

/** Characters as code points, so an emoji or a Vietnamese letter counts once. */
const charCount = (text: string): number => [...text].length;

const XML_MESSAGE = "must not contain a control character or a character XML doesn't allow";

/** XML 1.0 allows tab, LF, CR, and U+0020 and up, except U+FFFE and U+FFFF. */
const isXmlChar = (codePoint: number): boolean =>
  codePoint === 0x9 ||
  codePoint === 0xa ||
  codePoint === 0xd ||
  (codePoint >= 0x20 && codePoint !== 0xfffe && codePoint !== 0xffff);

/** No character XML forbids and no lone surrogate, so no content text can make an SVG invalid. */
const isXmlSafe = (text: string): boolean =>
  text.isWellFormed() && [...text].every((char) => isXmlChar(char.codePointAt(0) ?? 0));

function checkText(path: string, text: string, max: number): string[] {
  if (text === "") return [problem(path, "must not be empty")];
  const problems: string[] = [];
  if (text !== text.trim()) problems.push(problem(path, "must not start or end with whitespace"));
  if (LINE_BREAK.test(text)) problems.push(problem(path, "must not contain a line break"));
  if (!isXmlSafe(text)) problems.push(problem(path, XML_MESSAGE));
  if (text !== text.normalize("NFC")) problems.push(problem(path, "must be in NFC form"));
  const count = charCount(text);
  if (count > max) problems.push(problem(path, `must be at most ${max} characters (is ${count})`));
  return problems;
}

function checkOptionalText(path: string, text: string | undefined, max: number): string[] {
  return text === undefined ? [] : checkText(path, text, max);
}

function checkCount(path: string, items: readonly unknown[], min: number, max?: number): string[] {
  const count = items.length;
  if (count >= min && (max === undefined || count <= max)) return [];
  if (max === undefined) return [problem(path, `must have at least ${min} items (has ${count})`)];
  if (min === 0) return [problem(path, `must have at most ${max} items (has ${count})`)];
  return [problem(path, `must have ${min} to ${max} items (has ${count})`)];
}

/** Reports entry `index` when an earlier entry has the same value, ignoring case. */
function checkUnique(entries: readonly Entry[], index: number): string[] {
  const key = entries[index].value.toLowerCase();
  const earlier = entries.slice(0, index).find((entry) => entry.value.toLowerCase() === key);
  return earlier ? [problem(entries[index].path, `duplicate of ${earlier.path}`)] : [];
}

/** A stack icon must be a key of the registry. `Object.hasOwn`, so `toString` or `constructor` never pass. */
function checkStackIcon(path: string, icon: string | undefined): string[] {
  if (icon === undefined || Object.hasOwn(icons, icon)) return [];
  return [problem(path, "must be an icon in src/icons.ts")];
}

function checkPattern(path: string, value: string, pattern: RegExp): string[] {
  if (!isXmlSafe(value)) return [problem(path, XML_MESSAGE)];
  return pattern.test(value) ? [] : [problem(path, `must match ${pattern.source}`)];
}

function checkOptionalUrl(path: string, url: string | undefined): string[] {
  if (url === undefined) return [];
  if (!isXmlSafe(url)) return [problem(path, XML_MESSAGE)];
  if (HTTPS_URL.test(url) && URL.canParse(url)) return [];
  return [problem(path, "must be an https URL")];
}

function checkDates(base: string, entry: Role | School): string[] {
  const problems = checkPattern(`${base}.start`, entry.start, YEAR_MONTH);
  if (entry.end === null) return problems;
  problems.push(...checkPattern(`${base}.end`, entry.end, YEAR_MONTH));
  if (problems.length === 0 && entry.start > entry.end) {
    problems.push(problem(`${base}.end`, "start must not be after end"));
  }
  return problems;
}

function checkProfile(profile: Profile): string[] {
  const phrases = profile.typingPhrases.map((value, i) => ({ path: `profile.typingPhrases[${i}]`, value }));
  return [
    ...checkText("profile.name", profile.name, SHORT_TEXT_MAX),
    ...checkText("profile.title", profile.title, SHORT_TEXT_MAX),
    ...checkText("profile.location", profile.location, SHORT_TEXT_MAX),
    ...checkText("profile.bio", profile.bio, BIO_MAX),
    ...checkCount("profile.typingPhrases", phrases, 2, 5),
    ...phrases.flatMap((entry, i) => [
      ...checkText(entry.path, entry.value, TYPING_PHRASE_MAX),
      ...checkUnique(phrases, i),
    ]),
    ...ACCOUNT_RULES.flatMap(([key, pattern]) =>
      checkPattern(`profile.accounts.${key}`, profile.accounts[key], pattern),
    ),
    ...checkPattern("profile.email", profile.email, EMAIL),
  ];
}

function checkStack(stack: Stack): string[] {
  // Names are unique across every category, so collect them all first.
  const items = STACK_CATEGORIES.flatMap((category) =>
    stack[category].map((item, i) => ({ category, base: `stack.${category}[${i}]`, item })),
  );
  const names = items.map(({ base, item }) => ({ path: `${base}.name`, value: item.name }));
  return STACK_CATEGORIES.flatMap((category) => [
    ...checkCount(`stack.${category}`, stack[category], 1, STACK_CATEGORY_MAX),
    ...items.flatMap(({ category: itemCategory, base, item }, i) =>
      itemCategory !== category
        ? []
        : [
            ...checkText(names[i].path, item.name, SHORT_TEXT_MAX),
            ...checkUnique(names, i),
            ...checkStackIcon(`${base}.icon`, item.icon),
          ],
    ),
  ]);
}

function checkRole(role: Role, i: number): string[] {
  const base = `experience[${i}]`;
  return [
    ...checkText(`${base}.company`, role.company, SHORT_TEXT_MAX),
    ...checkText(`${base}.title`, role.title, SHORT_TEXT_MAX),
    ...checkDates(base, role),
    ...checkCount(`${base}.highlights`, role.highlights, 1, 2),
    ...role.highlights.flatMap((text, j) => checkText(`${base}.highlights[${j}]`, text, LONG_TEXT_MAX)),
    ...checkOptionalText(`${base}.location`, role.location, SHORT_TEXT_MAX),
    ...checkOptionalUrl(`${base}.companyUrl`, role.companyUrl),
  ];
}

function checkSchool(school: School, i: number): string[] {
  const base = `education[${i}]`;
  return [
    ...checkText(`${base}.school`, school.school, SHORT_TEXT_MAX),
    ...checkText(`${base}.degree`, school.degree, SHORT_TEXT_MAX),
    ...checkOptionalText(`${base}.field`, school.field, SHORT_TEXT_MAX),
    ...checkDates(base, school),
    ...checkOptionalText(`${base}.note`, school.note, LONG_TEXT_MAX),
  ];
}

function checkProject(project: Project, i: number, names: readonly Entry[]): string[] {
  const base = `projects[${i}]`;
  const tech = project.tech.map((value, j) => ({ path: `${base}.tech[${j}]`, value }));
  return [
    ...checkText(names[i].path, project.name, SHORT_TEXT_MAX),
    ...checkUnique(names, i),
    ...checkText(`${base}.description`, project.description, LONG_TEXT_MAX),
    ...checkCount(`${base}.tech`, tech, 1, 5),
    ...tech.flatMap((entry, j) => [...checkText(entry.path, entry.value, SHORT_TEXT_MAX), ...checkUnique(tech, j)]),
    ...checkOptionalUrl(`${base}.repoUrl`, project.repoUrl),
    ...checkOptionalUrl(`${base}.demoUrl`, project.demoUrl),
    ...(project.repoUrl === undefined && project.demoUrl === undefined
      ? [problem(base, "needs repoUrl or demoUrl")]
      : []),
  ];
}

/**
 * Every content rule from spec 0002, as `<path>: <problem>` lines in a fixed order.
 * An empty list means the content is valid. Shape errors are left to `pnpm typecheck`.
 */
export function checkContent(content: Content): readonly string[] {
  const projectNames = content.projects.map((project, i) => ({ path: `projects[${i}].name`, value: project.name }));
  return [
    ...checkProfile(content.profile),
    ...checkStack(content.stack),
    ...checkCount("experience", content.experience, 1, EXPERIENCE_MAX),
    ...content.experience.flatMap((role, i) => checkRole(role, i)),
    ...checkCount("education", content.education, 1, EDUCATION_MAX),
    ...content.education.flatMap((school, i) => checkSchool(school, i)),
    ...checkCount("projects", content.projects, 0, 6),
    ...content.projects.flatMap((project, i) => checkProject(project, i, projectNames)),
  ];
}

/** Throws a plain Error listing every problem, so the caller stops before it writes or fetches anything. */
export function assertContent(content: Content): void {
  const problems = checkContent(content);
  if (problems.length > 0) {
    throw new Error(`content check failed, nothing was written:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
}
