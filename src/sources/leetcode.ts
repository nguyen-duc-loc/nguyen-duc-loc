// LeetCode stats (spec 0006), badges and submission calendar (spec 0009): one POST to LeetCode's public GraphQL endpoint, no token. `validate` maps the
// response to the snapshot and `parseLeetcodeSnapshot` checks it. The build runs the same parse on read, so a
// snapshot that passes one passes the other. Module load does no I/O.

import { content } from "../../content/index.ts";
import { isRealDate } from "../dates.ts";
import type { Source } from "../types.ts";
import { HttpError, USER_AGENT, ValidationError } from "./http.ts";

const ENDPOINT = "https://leetcode.com/graphql";
/** Keeps a long GraphQL error message from flooding the refresh log. */
const DETAIL_MAX = 300;

const QUERY = `query leetcodeStats($username: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $username) {
    username
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    badges { id displayName icon creationDate category }
    activeBadge { id }
    userCalendar { submissionCalendar }
  }
  userProfileUserQuestionProgressV2(userSlug: $username) { numFailedQuestions { difficulty count } }
  userContestRanking(username: $username) { attendedContestsCount rating globalRanking totalParticipants topPercentage badge { name } }
  userContestRankingHistory(username: $username) { attended rating contest { startTime } }
  contestRatingHistogram { userCount ratingStart ratingEnd }
}`;

const USERNAME = /^[A-Za-z0-9_-]+$/;
const BADGE = /^[A-Za-z][A-Za-z ]{0,29}$/;
const HISTORY_MAX = 1000;
const HISTOGRAM_MAX = 40;
const BADGE_ID = /^[0-9]{1,15}$/;
const BADGE_NAME = /^[A-Za-z0-9][A-Za-z0-9 .&'+:-]{0,59}$/;
const BADGE_ICON = /^https:\/\/(assets\.leetcode\.com\/|leetcode\.com\/static\/)[A-Za-z0-9_./%-]+\.png$/;
const BADGE_CATEGORY = /^[A-Z][A-Z_]{0,29}$/;
const BADGES_MAX = 500;
const CALENDAR_MAX = 400;
const CALENDAR_KEY = /^[0-9]{1,11}$/;
const SECONDS_PER_DAY = 86_400;
/** Prefixed to a badge `icon` that LeetCode returns as a site relative path. */
const ICON_ORIGIN = "https://leetcode.com";

export type Difficulty = "easy" | "medium" | "hard";
export const difficultyNames = ["easy", "medium", "hard"] as const satisfies readonly Difficulty[];

export type DifficultyStats = { readonly solved: number; readonly total: number; readonly attempting: number };

export type LeetcodeSnapshot = {
  readonly username: string;
  readonly difficulties: { readonly [K in Difficulty]: DifficultyStats };
  readonly contest: {
    /** Raw, unrounded. */
    readonly rating: number;
    readonly globalRanking: number;
    readonly totalParticipants: number;
    readonly topPercentage: number;
    readonly attended: number;
    readonly badge: string | null;
  };
  /** Attended contests only, strictly increasing by `startTime` (unix seconds). */
  readonly history: readonly { readonly startTime: number; readonly rating: number }[];
  /** Strictly increasing by `ratingStart`. */
  readonly histogram: readonly {
    readonly ratingStart: number;
    readonly ratingEnd: number;
    readonly userCount: number;
  }[];
  /** UTC date (`YYYY-MM-DD`) the response was read: the heatmap's last day. */
  readonly asOf: string;
  /** The badge chosen on LeetCode, an `id` in `badges`, or null. */
  readonly activeBadgeId: string | null;
  /** Ascending by `earnedOn`, then numeric `id`. */
  readonly badges: readonly LeetcodeBadge[];
  /** Days with at least one submission, strictly increasing by `date` (UTC). */
  readonly calendar: readonly { readonly date: string; readonly count: number }[];
};

export type LeetcodeBadge = {
  readonly id: string;
  readonly name: string;
  /** An absolute `https` PNG URL on LeetCode. */
  readonly icon: string;
  readonly earnedOn: string;
  readonly category: string;
};

type Fields = { readonly [key: string]: unknown };

function isRecord(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const fail = (path: string, problem: string): never => {
  throw new ValidationError(`${path}: ${problem}`);
};

function record(value: unknown, path: string): Fields {
  return isRecord(value) ? value : fail(path, "must be an object");
}

function list(value: unknown, path: string, min: number, max: number): readonly unknown[] {
  if (!Array.isArray(value)) return fail(path, "must be an array");
  if (value.length < min || value.length > max) return fail(path, `must have ${min} to ${max} entries`);
  return value;
}

function integer(value: unknown, path: string, min: number): number {
  return Number.isInteger(value) && (value as number) >= min
    ? (value as number)
    : fail(path, `must be an integer ≥ ${min}`);
}

function anyInteger(value: unknown, path: string): number {
  return Number.isInteger(value) ? (value as number) : fail(path, "must be an integer");
}

function positive(value: unknown, path: string): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fail(path, "must be a number > 0");
}

function parseDifficulty(value: unknown, path: string): DifficultyStats {
  const fields = record(value, path);
  const solved = integer(fields.solved, `${path}.solved`, 0);
  const total = integer(fields.total, `${path}.total`, 1);
  const attempting = integer(fields.attempting, `${path}.attempting`, 0);
  if (solved + attempting > total) fail(path, "solved + attempting must be ≤ total");
  return { solved, total, attempting };
}

function parseContest(value: unknown): LeetcodeSnapshot["contest"] {
  const fields = record(value, "contest");
  const rating = positive(fields.rating, "contest.rating");
  const totalParticipants = integer(fields.totalParticipants, "contest.totalParticipants", 1);
  const globalRanking = integer(fields.globalRanking, "contest.globalRanking", 1);
  if (globalRanking > totalParticipants) fail("contest.globalRanking", "must be ≤ totalParticipants");
  const topPercentage = positive(fields.topPercentage, "contest.topPercentage");
  if (topPercentage > 100) fail("contest.topPercentage", "must be ≤ 100");
  const attended = integer(fields.attended, "contest.attended", 1);
  const { badge } = fields;
  if (badge !== null && (typeof badge !== "string" || !BADGE.test(badge))) {
    fail("contest.badge", `must be null or match ${BADGE}`);
  }
  return { rating, globalRanking, totalParticipants, topPercentage, attended, badge: badge as string | null };
}

function parseHistory(value: unknown): LeetcodeSnapshot["history"] {
  const entries = list(value, "history", 1, HISTORY_MAX).map((entry, i) => {
    const fields = record(entry, `history[${i}]`);
    return {
      startTime: integer(fields.startTime, `history[${i}].startTime`, 1),
      rating: positive(fields.rating, `history[${i}].rating`),
    };
  });
  entries.forEach((entry, i) => {
    if (i > 0 && entry.startTime <= entries[i - 1].startTime) {
      fail(`history[${i}].startTime`, "must be greater than the previous entry's");
    }
  });
  return entries;
}

function parseHistogram(value: unknown): LeetcodeSnapshot["histogram"] {
  const buckets = list(value, "histogram", 1, HISTOGRAM_MAX).map((entry, i) => {
    const path = `histogram[${i}]`;
    const fields = record(entry, path);
    const ratingStart = anyInteger(fields.ratingStart, `${path}.ratingStart`);
    const ratingEnd = anyInteger(fields.ratingEnd, `${path}.ratingEnd`);
    if (ratingStart >= ratingEnd) fail(path, "ratingStart must be < ratingEnd");
    return { ratingStart, ratingEnd, userCount: integer(fields.userCount, `${path}.userCount`, 0) };
  });
  buckets.forEach((bucket, i) => {
    if (i > 0 && bucket.ratingStart <= buckets[i - 1].ratingStart) {
      fail(`histogram[${i}].ratingStart`, "must be greater than the previous bucket's");
    }
  });
  if (buckets.every((bucket) => bucket.userCount === 0)) fail("histogram", "needs at least one userCount > 0");
  return buckets;
}

function realDate(value: unknown, path: string): string {
  return isRealDate(value) ? value : fail(path, "must be a real date");
}

function matching(value: unknown, path: string, pattern: RegExp, problem = `must match ${pattern}`): string {
  return typeof value === "string" && pattern.test(value) ? value : fail(path, problem);
}

/** `earnedOn`, then numeric `id`, both ascending. */
function compareBadges(a: LeetcodeBadge, b: LeetcodeBadge): number {
  if (a.earnedOn !== b.earnedOn) return a.earnedOn < b.earnedOn ? -1 : 1;
  return Number(a.id) - Number(b.id);
}

function parseBadges(value: unknown, asOf: string): LeetcodeSnapshot["badges"] {
  const badges = list(value, "badges", 0, BADGES_MAX).map((entry, i): LeetcodeBadge => {
    const path = `badges[${i}]`;
    const fields = record(entry, path);
    const earnedOn = realDate(fields.earnedOn, `${path}.earnedOn`);
    if (earnedOn > asOf) fail(`${path}.earnedOn`, "must be no later than asOf");
    return {
      id: matching(fields.id, `${path}.id`, BADGE_ID),
      name: matching(fields.name, `${path}.name`, BADGE_NAME),
      icon: matching(fields.icon, `${path}.icon`, BADGE_ICON, "must be a LeetCode PNG URL"),
      earnedOn,
      category: matching(fields.category, `${path}.category`, BADGE_CATEGORY),
    };
  });
  const ids = new Set<string>();
  badges.forEach((badge, i) => {
    if (ids.has(badge.id)) fail(`badges[${i}].id`, "must be unique");
    ids.add(badge.id);
    if (i > 0 && compareBadges(badges[i - 1], badge) > 0) {
      fail(`badges[${i}]`, "must come after the previous entry by earnedOn, then numeric id");
    }
  });
  return badges;
}

function parseActiveBadgeId(value: unknown, badges: LeetcodeSnapshot["badges"]): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !badges.some((badge) => badge.id === value)) {
    return fail("activeBadgeId", "must be null or the id of an entry in badges");
  }
  return value;
}

function parseCalendar(value: unknown, asOf: string): LeetcodeSnapshot["calendar"] {
  const days = list(value, "calendar", 0, CALENDAR_MAX).map((entry, i) => {
    const path = `calendar[${i}]`;
    const fields = record(entry, path);
    const date = realDate(fields.date, `${path}.date`);
    if (date > asOf) fail(`${path}.date`, "must be no later than asOf");
    return { date, count: integer(fields.count, `${path}.count`, 1) };
  });
  days.forEach((day, i) => {
    if (i > 0 && day.date <= days[i - 1].date) fail(`calendar[${i}].date`, "must be later than the previous entry's");
  });
  return days;
}

/** Checks a snapshot (from `validate`, or read from disk). Throws `ValidationError` with `<path>: <problem>`. */
export function parseLeetcodeSnapshot(value: unknown): LeetcodeSnapshot {
  if (!isRecord(value)) return fail("(root)", "must be an object");
  const { username } = value;
  if (typeof username !== "string" || !USERNAME.test(username)) fail("username", `must match ${USERNAME}`);
  const difficulties = record(value.difficulties, "difficulties");
  const asOf = realDate(value.asOf, "asOf");
  const badges = parseBadges(value.badges, asOf);
  return {
    username: username as string,
    difficulties: {
      easy: parseDifficulty(difficulties.easy, "difficulties.easy"),
      medium: parseDifficulty(difficulties.medium, "difficulties.medium"),
      hard: parseDifficulty(difficulties.hard, "difficulties.hard"),
    },
    contest: parseContest(value.contest),
    history: parseHistory(value.history),
    histogram: parseHistogram(value.histogram),
    asOf,
    activeBadgeId: parseActiveBadgeId(value.activeBadgeId, badges),
    badges,
    calendar: parseCalendar(value.calendar, asOf),
  };
}

/** `[{ difficulty, count }]` to counts keyed by lowercase difficulty. The `All` row is ignored by the caller. */
function countsByDifficulty(value: unknown, path: string): ReadonlyMap<string, unknown> {
  if (!Array.isArray(value)) return fail(path, "must be an array");
  return new Map(value.filter(isRecord).map((row) => [String(row.difficulty).toLowerCase(), row.count] as const));
}

/** A required GraphQL object: `null` or missing is a glitch, never "no data" (spec 0006, AC-3). */
function required(data: Fields, key: string): Fields {
  const value = data[key];
  return isRecord(value) ? value : fail(key, "is null or missing");
}

/** `matchedUser.badges` to snapshot badges, with site relative icons made absolute, sorted (spec 0009). */
function mapBadges(value: unknown): readonly Fields[] {
  if (!Array.isArray(value)) return fail("matchedUser.badges", "is null or missing");
  return value
    .map((row, i) => {
      const { id, displayName, icon, creationDate, category } = record(row, `matchedUser.badges[${i}]`);
      const absolute = typeof icon === "string" && icon.startsWith("/") ? `${ICON_ORIGIN}${icon}` : icon;
      return { id, name: displayName, icon: absolute, earnedOn: creationDate, category };
    })
    .toSorted((a, b) =>
      a.earnedOn !== b.earnedOn ? (String(a.earnedOn) < String(b.earnedOn) ? -1 : 1) : Number(a.id) - Number(b.id),
    );
}

/** `activeBadge` may be `null` (no badge chosen), but the key must be there. */
function mapActiveBadge(user: Fields): unknown {
  if (!("activeBadge" in user)) return fail("matchedUser.activeBadge", "is missing");
  const { activeBadge } = user;
  return activeBadge === null ? null : record(activeBadge, "matchedUser.activeBadge").id;
}

/** The JSON string of unix seconds to counts, as dated entries with count 0 dropped, oldest first. */
function mapCalendar(user: Fields): readonly Fields[] {
  const calendar = user.userCalendar;
  if (!isRecord(calendar)) return fail("matchedUser.userCalendar", "is null or missing");
  const text = calendar.submissionCalendar;
  if (typeof text !== "string") return fail("matchedUser.userCalendar.submissionCalendar", "is null or missing");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("matchedUser.userCalendar.submissionCalendar", "must be a JSON object");
  }
  const days = record(parsed, "matchedUser.userCalendar.submissionCalendar");
  return Object.entries(days)
    .map(([key, count]) => {
      if (!CALENDAR_KEY.test(key) || Number(key) % SECONDS_PER_DAY !== 0) {
        fail("calendar", `key ${key} must be a UTC midnight in unix seconds`);
      }
      return { seconds: Number(key), count };
    })
    .filter(({ count }) => count !== 0)
    .toSorted((a, b) => a.seconds - b.seconds)
    .map(({ seconds, count }) => ({ date: new Date(seconds * 1000).toISOString().slice(0, 10), count }));
}

function mapResponse(raw: unknown): Fields {
  const body = record(raw, "(response)");
  const { errors } = body;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = isRecord(errors[0]) && typeof errors[0].message === "string" ? errors[0].message : "unknown";
    fail("errors", first);
  }
  const data = record(body.data, "data");
  const user = required(data, "matchedUser");
  const ranking = required(data, "userContestRanking");
  if (!Array.isArray(data.contestRatingHistogram)) fail("contestRatingHistogram", "is null or missing");
  const progress = required(data, "userProfileUserQuestionProgressV2");

  const totals = countsByDifficulty(data.allQuestionsCount, "allQuestionsCount");
  const solved = countsByDifficulty(
    record(user.submitStatsGlobal, "matchedUser.submitStatsGlobal").acSubmissionNum,
    "matchedUser.submitStatsGlobal.acSubmissionNum",
  );
  const attempting = countsByDifficulty(
    progress.numFailedQuestions,
    "userProfileUserQuestionProgressV2.numFailedQuestions",
  );
  const difficulties = Object.fromEntries(
    difficultyNames.map((name) => [
      name,
      { solved: solved.get(name), total: totals.get(name), attempting: attempting.get(name) },
    ]),
  );

  const historyRows = data.userContestRankingHistory;
  if (!Array.isArray(historyRows)) fail("userContestRankingHistory", "is null or missing");
  const history = (historyRows as unknown[])
    .filter((row) => isRecord(row) && row.attended === true)
    .map((row) => {
      const { contest, rating } = row as Fields;
      return { startTime: isRecord(contest) ? contest.startTime : undefined, rating };
    });
  if (history.length === 0) fail("userContestRankingHistory", "has no entry with attended: true");

  const histogram = (data.contestRatingHistogram as unknown[]).map((row) => {
    const { ratingStart, ratingEnd, userCount } = record(row, "contestRatingHistogram[]");
    return { ratingStart, ratingEnd, userCount };
  });

  const { badge } = ranking;
  return {
    username: user.username,
    difficulties,
    contest: {
      rating: ranking.rating,
      globalRanking: ranking.globalRanking,
      totalParticipants: ranking.totalParticipants,
      topPercentage: ranking.topPercentage,
      attended: ranking.attendedContestsCount,
      badge: badge === null ? null : isRecord(badge) ? badge.name : undefined,
    },
    history: history.toSorted((a, b) => Number(a.startTime) - Number(b.startTime)),
    histogram: histogram.toSorted((a, b) => Number(a.ratingStart) - Number(b.ratingStart)),
    activeBadgeId: mapActiveBadge(user),
    badges: mapBadges(user.badges),
    calendar: mapCalendar(user),
  };
}

/** The first GraphQL error message in a non 2xx body, on one line and capped, or undefined. */
async function errorDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (!isRecord(body) || !Array.isArray(body.errors) || !isRecord(body.errors[0])) return undefined;
    const { message } = body.errors[0];
    return typeof message === "string" ? message.replace(/\s+/g, " ").trim().slice(0, DETAIL_MAX) : undefined;
  } catch {
    return undefined; // not JSON (for example a Cloudflare page): the status alone is the report
  }
}

/** What `fetch` hands to `validate`: the parsed body and the UTC date it was read. */
export type LeetcodeResponse = { readonly asOf: string; readonly body: unknown };

export const leetcode = {
  name: "leetcode",
  sortKey: "startTime",
  async fetch(signal: AbortSignal): Promise<LeetcodeResponse> {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": USER_AGENT },
      body: JSON.stringify({ query: QUERY, variables: { username: content.profile.accounts.leetcode } }),
      signal,
    });
    if (!response.ok) throw new HttpError(response.status, ENDPOINT, await errorDetail(response));
    const body: unknown = await response.json();
    // Read after the body, so LeetCode's newest calendar day is never later than asOf (spec 0009).
    return { asOf: new Date().toISOString().slice(0, 10), body };
  },
  validate(raw: unknown): LeetcodeSnapshot {
    const response = record(raw, "(fetch)");
    if (typeof response.asOf !== "string") fail("asOf", "must be a string");
    return parseLeetcodeSnapshot({ ...mapResponse(response.body), asOf: response.asOf });
  },
} as const satisfies Source<LeetcodeSnapshot>;
