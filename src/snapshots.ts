import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SNAPSHOT_DIR } from "./paths.ts";

export function snapshotPath(source: string): string {
  return join(SNAPSHOT_DIR, `${source}.json`);
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Sorts object keys at every level. Arrays of objects that carry `sortKey` are sorted by it;
 * any other array keeps its order (it is assumed to be meaningful, like a calendar).
 */
function normalize(value: unknown, sortKey: string): unknown {
  if (Array.isArray(value)) {
    const items = value.map((item) => normalize(item, sortKey));
    if (items.length > 0 && items.every((item) => isRecord(item) && sortKey in item)) {
      return (items as Record<string, unknown>[]).toSorted((a, b) => compare(a[sortKey], b[sortKey]));
    }
    return items;
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .toSorted()
        .map((key) => [key, normalize(value[key], sortKey)]),
    );
  }
  return value;
}

/** Deterministic snapshot text: sorted keys, 2 space indent, LF, exactly one trailing newline. */
export function serializeSnapshot(data: unknown, sortKey: string): string {
  return `${JSON.stringify(normalize(data, sortKey), null, 2)}\n`;
}

export async function readSnapshot(source: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(snapshotPath(source), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `missing snapshot ${source}: run pnpm refresh locally and commit data/snapshots/${source}.json`,
      );
    }
    throw error;
  }
  return JSON.parse(text);
}

/** Replaces the snapshot atomically: write a temp file beside it, then rename over it. */
export async function writeSnapshot(source: string, data: unknown, sortKey: string): Promise<void> {
  const target = snapshotPath(source);
  const temp = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temp, serializeSnapshot(data, sortKey), "utf8");
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}
