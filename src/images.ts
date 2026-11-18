// Outside image requests (spec 0010): which picture, at what size. Shared by the sources that ask for images, the
// image store in src/sources/images.ts, and the sections that embed them. Pure.

import { createHash } from "node:crypto";

/** An outside image to store and embed, shrunk to fit a `size` × `size` square. */
export type ImageRequest = { readonly url: string; readonly size: number };

/** The `ctx.images` key for a request: the same picture at two sizes is two images. */
export function imageKey({ url, size }: ImageRequest): string {
  return `${size} ${url}`;
}

/** The stored file name: the first 16 hex digits of SHA-256 of the key, plus `.png`. */
export function imageFile(request: ImageRequest): string {
  return `${createHash("sha256").update(imageKey(request)).digest("hex").slice(0, 16)}.png`;
}
