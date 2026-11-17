// Credly badges (spec 0008): one GET of the public badges JSON behind the Credly profile page, no token.
// `validate` checks the raw response, keeps the accepted, public, unexpired badges (the only clock read), and
// maps them to the snapshot, which `parseCredlySnapshot` checks. The build runs the same parse on read and never
// reads the clock, so a snapshot that passes one passes the other. Module load does no I/O.

import { content } from "../../content/index.ts";
import { checkText, profileUrls } from "../content.ts";
import type { Source } from "../types.ts";
import { fetchJson, USER_AGENT, ValidationError } from "./http.ts";

const BADGES_PATH = "/badges.json";
/** Badges on one page of the badges JSON. Only page 1 is read (spec 0008, AC-1). */
const PAGE_SIZE = 48;
const NAME_MAX = 120;
const ISSUER_MAX = 100;

const USERNAME = /^[A-Za-z0-9._-]+$/;
const BADGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const LEVEL = /^[A-Za-z][A-Za-z ]{0,29}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_URL = /^https:\/\/images\.credly\.com\/images\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,64}$/;

export type CredlyBadge = {
  /** Credly's badge UUID, lowercase. The badge page is `https://www.credly.com/badges/<id>`. */
  readonly id: string;
  readonly name: string;
  readonly issuer: string;
  readonly level: string | null;
  /** `YYYY-MM-DD`. */
  readonly issuedOn: string;
  /** `YYYY-MM-DD`, or `null` when the badge never expires. */
  readonly expiresOn: string | null;
  readonly imageUrl: string;
};

export type CredlySnapshot = {
  readonly username: string;
  /** 1 to 48 badges with unique ids. */
  readonly badges: readonly CredlyBadge[];
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

/** A real calendar date in `YYYY-MM-DD` form. `Date` only checks the calendar here, it never reads the clock. */
function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function date(value: unknown, path: string): string {
  return isDate(value) ? value : fail(path, "must be a real YYYY-MM-DD date");
}

function matching(value: unknown, path: string, pattern: RegExp): string {
  return typeof value === "string" && pattern.test(value) ? value : fail(path, `must match ${pattern.source}`);
}

/** One line of outside text, checked by the same rules as content text. */
function text(value: unknown, path: string, max: number): string {
  if (typeof value !== "string") return fail(path, "must be a string");
  const [first] = checkText(path, value, max);
  if (first !== undefined) throw new ValidationError(first);
  return value;
}

function parseBadge(value: unknown, path: string): CredlyBadge {
  const fields = record(value, path);
  const id = matching(fields.id, `${path}.id`, BADGE_ID);
  const name = text(fields.name, `${path}.name`, NAME_MAX);
  const issuer = text(fields.issuer, `${path}.issuer`, ISSUER_MAX);
  const { level, expiresOn } = fields;
  if (level !== null && (typeof level !== "string" || !LEVEL.test(level))) {
    fail(`${path}.level`, `must be null or match ${LEVEL.source}`);
  }
  const issuedOn = date(fields.issuedOn, `${path}.issuedOn`);
  if (expiresOn !== null) {
    if (!isDate(expiresOn)) fail(`${path}.expiresOn`, "must be null or a real YYYY-MM-DD date");
    if ((expiresOn as string) < issuedOn) fail(`${path}.expiresOn`, "must not be before issuedOn");
  }
  const imageUrl = matching(fields.imageUrl, `${path}.imageUrl`, IMAGE_URL);
  return { id, name, issuer, level: level as string | null, issuedOn, expiresOn: expiresOn as string | null, imageUrl };
}

/** Checks a snapshot (from `validate`, or read from disk). Throws `ValidationError` with `<path>: <problem>`. */
export function parseCredlySnapshot(value: unknown): CredlySnapshot {
  if (!isRecord(value)) return fail("(root)", "must be an object");
  const username = matching(value.username, "username", USERNAME);
  const { badges } = value;
  if (!Array.isArray(badges)) return fail("badges", "must be an array");
  if (badges.length < 1 || badges.length > PAGE_SIZE) fail("badges", `must have 1 to ${PAGE_SIZE} entries`);
  const parsed = badges.map((badge, i) => parseBadge(badge, `badges[${i}]`));
  parsed.forEach((badge, i) => {
    const earlier = parsed.findIndex((other) => other.id === badge.id);
    if (earlier < i) fail(`badges[${i}].id`, `duplicate of badges[${earlier}].id`);
  });
  return { username, badges: parsed };
}

/** The `entity.name` of the first issuer entity marked `primary`, else of the first entity. */
function issuerName(issuer: unknown, path: string): unknown {
  const entities = isRecord(issuer) ? issuer.entities : undefined;
  if (!Array.isArray(entities) || entities.length === 0) {
    return fail(path, "issuer.entities must be a non empty array");
  }
  const chosen = entities.find((entry) => isRecord(entry) && entry.primary === true) ?? entities[0];
  return isRecord(chosen) && isRecord(chosen.entity) ? chosen.entity.name : undefined;
}

/**
 * The raw `{ username, body }` from `fetch` to a snapshot shape, for `parseCredlySnapshot` to check. Pure: `today`
 * (`YYYY-MM-DD`, UTC) is passed in, so verify scripts can call it with any date. Throws `ValidationError`.
 */
export function mapResponse(raw: unknown, today: string): unknown {
  const { username, body } = record(raw, "(raw)");
  const response = record(body, "(response)");
  const metadata = record(response.metadata, "metadata");
  if (metadata.total_pages !== 1) {
    fail("metadata.total_pages", "must be 1, Credly now pages the badges: raise the limit in src/sources/credly.ts");
  }
  const { data } = response;
  if (!Array.isArray(data)) return fail("data", "must be an array");
  if (data.length !== metadata.total_count) {
    fail("data", `has ${data.length} entries, but metadata.total_count is ${String(metadata.total_count)}`);
  }

  const entries = data.map((entry, i) => {
    const path = `data[${i}]`;
    const fields = record(entry, path);
    if (typeof fields.state !== "string") fail(`${path}.state`, "must be a string");
    if (typeof fields.public !== "boolean") fail(`${path}.public`, "must be a boolean");
    const expires = fields.expires_at_date;
    if (expires !== null && !isDate(expires)) {
      fail(`${path}.expires_at_date`, "must be null or a real YYYY-MM-DD date");
    }
    return fields;
  });

  const kept = entries.filter(
    (fields) =>
      fields.state === "accepted" &&
      fields.public === true &&
      (fields.expires_at_date === null || (fields.expires_at_date as string) >= today),
  );
  if (kept.length === 0) fail("data", "has no accepted, public, unexpired badge");

  const badges = kept.map((fields, i) => {
    const template = isRecord(fields.badge_template) ? fields.badge_template : {};
    const { level } = template;
    return {
      id: fields.id,
      name: template.name,
      issuer: issuerName(fields.issuer, `badges[${i}].issuer`),
      level: level === undefined || level === null || level === "" ? null : level,
      issuedOn: fields.issued_at_date,
      expiresOn: fields.expires_at_date,
      imageUrl: fields.image_url,
    };
  });
  return { username, badges };
}

/** The refresh run's date in UTC, `YYYY-MM-DD`. The only clock read in this feature, and only at refresh time. */
const todayUtc = (): string => new Date().toISOString().slice(0, 10);

export const credly = {
  name: "credly",
  sortKey: "id",
  async fetch(signal: AbortSignal): Promise<unknown> {
    const { accounts } = content.profile;
    const body = await fetchJson(`${profileUrls(accounts).credly}${BADGES_PATH}`, signal, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
    });
    return { username: accounts.credly, body };
  },
  validate(raw: unknown): CredlySnapshot {
    return parseCredlySnapshot(mapResponse(raw, todayUtc()));
  },
} as const satisfies Source<CredlySnapshot>;
