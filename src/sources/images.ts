// The outside image store (spec 0010): small PNG copies of the images sections embed in their SVGs (LeetCode badge
// art), kept in data/snapshots/images/ so `pnpm build` never fetches. `pnpm refresh` calls `syncImages`; build calls
// `readImages`. Each file is named by a hash of its URL and size, so a changed request is a new file and a dropped
// one is removed.

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type ImageRequest, imageFile, imageKey } from "../images.ts";
import { IMAGE_DIR } from "../paths.ts";
import { decodePng, encodePng, fitSquare } from "../png.ts";
import { HttpError, USER_AGENT, ValidationError } from "./http.ts";

/** A larger download is refused (LeetCode's badge PNGs are about 1.7 MB). */
const MAX_BYTES = 8_000_000;
const TIMEOUT_MS = 15_000;
const STORED = /^[0-9a-f]{16}\.png$/;

async function download(url: string): Promise<Uint8Array> {
  if (!url.startsWith("https://")) throw new ValidationError(`image ${url}: must be an https URL`);
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new HttpError(response.status, url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new ValidationError(`image ${url}: larger than ${MAX_BYTES} bytes`);
  return bytes;
}

export type ImageSync = { readonly added: number; readonly removed: number; readonly failed: readonly string[] };

/**
 * Makes data/snapshots/images/ hold exactly one file per request: downloads, shrinks, and writes each missing one,
 * and removes files no request names. A request that fails is reported, never thrown, and keeps its old file.
 */
export async function syncImages(requests: readonly ImageRequest[]): Promise<ImageSync> {
  await mkdir(IMAGE_DIR, { recursive: true });
  const wanted = new Map(requests.map((request) => [imageFile(request), request]));
  const present = new Set((await readdir(IMAGE_DIR)).filter((file) => STORED.test(file)));
  let added = 0;
  const failed: string[] = [];
  for (const [file, { url, size }] of wanted) {
    if (present.has(file)) continue;
    try {
      const png = encodePng(fitSquare(decodePng(await download(url)), size));
      await writeFile(join(IMAGE_DIR, file), png);
      added++;
    } catch (error) {
      failed.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const stale = [...present].filter((file) => !wanted.has(file));
  for (const file of stale) await rm(join(IMAGE_DIR, file), { force: true });
  return { added, removed: stale.length, failed };
}

/** Each stored image, as a `data:image/png;base64,` URI keyed by `imageKey`. Missing files are left out. */
export async function readImages(requests: readonly ImageRequest[]): Promise<ReadonlyMap<string, string>> {
  const images = new Map<string, string>();
  for (const request of requests) {
    try {
      const bytes = await readFile(join(IMAGE_DIR, imageFile(request)));
      images.set(imageKey(request), `data:image/png;base64,${bytes.toString("base64")}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return images;
}
