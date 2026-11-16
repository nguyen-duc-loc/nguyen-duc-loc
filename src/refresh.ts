// pnpm refresh: fetch every registered source, keep the last good snapshot for any that fail, then build.
// Exits 0 after a partial failure (the outputs are still valid). Exits non zero only on a hard error.

import { appendFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { build } from "./build.ts";
import { writeSnapshot } from "./snapshots.ts";
import { HttpError } from "./sources/http.ts";
import { sources } from "./sources/index.ts";
import type { Source } from "./types.ts";

const TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 2_000;

type Failure = { readonly source: string; readonly reason: string };

class SourceFailure extends Error {
  readonly reason: string;

  constructor(reason: string, cause: unknown) {
    super(reason, { cause });
    this.name = "SourceFailure";
    this.reason = reason;
  }
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** Network error, timeout, 5xx, or 429. A 4xx or a failed validation is never retried. */
function isRetryable(error: unknown): boolean {
  if (error instanceof HttpError) return error.status >= 500 || error.status === 429;
  if (isTimeout(error)) return true;
  return error instanceof TypeError; // fetch reports network errors as TypeError
}

function describe(error: unknown): string {
  if (error instanceof HttpError) return String(error.status);
  if (isTimeout(error)) return "timeout";
  if (error instanceof TypeError) return "network error";
  return "error";
}

async function fetchWithRetry(source: Source): Promise<unknown> {
  try {
    return await source.fetch(AbortSignal.timeout(TIMEOUT_MS));
  } catch (error) {
    if (!isRetryable(error)) throw new SourceFailure(describe(error), error);
    await sleep(RETRY_DELAY_MS);
    try {
      return await source.fetch(AbortSignal.timeout(TIMEOUT_MS));
    } catch (retryError) {
      throw new SourceFailure(describe(retryError), retryError);
    }
  }
}

async function refreshSource(source: Source): Promise<void> {
  const raw = await fetchWithRetry(source);
  let snapshot: unknown;
  try {
    snapshot = source.validate(raw);
  } catch (error) {
    throw new SourceFailure("validation failed", error);
  }
  await writeSnapshot(source.name, snapshot, source.sortKey);
}

async function report(failures: readonly Failure[]): Promise<void> {
  const { GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
  if (GITHUB_OUTPUT) {
    await appendFile(GITHUB_OUTPUT, `failed_sources=${failures.map((f) => f.source).join(",")}\n`);
  }
  if (failures.length === 0) return;

  const lines = failures.map((f) => `- ${f.source}: ${f.reason}`).join("\n");
  if (GITHUB_STEP_SUMMARY) {
    await appendFile(GITHUB_STEP_SUMMARY, `### Failed sources\n\n${lines}\n`);
  }
  console.warn(`refresh: kept the last good snapshot for these failed sources:\n${lines}`);
}

export async function refresh(): Promise<void> {
  const names = new Set(sources.map((s) => s.name));
  if (names.size !== sources.length) throw new Error("two registered sources share a name");

  const results = await Promise.allSettled(sources.map((source) => refreshSource(source)));
  const failures: Failure[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") return;
    const error = result.reason;
    if (!(error instanceof SourceFailure)) throw error; // a hard error, such as a failed snapshot write
    const source = sources[i].name;
    failures.push({ source, reason: error.reason });
    const cause = error.cause instanceof Error ? error.cause.message : String(error.cause);
    console.warn(`refresh: ${source} failed (${error.reason}): ${cause}`);
  });

  await report(failures);
  console.log(`refresh: ${sources.length - failures.length} of ${sources.length} sources updated`);
  await build();
}

if (import.meta.main) {
  try {
    await refresh();
    console.log("refresh: done");
  } catch (error) {
    console.error(`refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
