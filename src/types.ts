import type { Content } from "../content/types.ts";

/** Everything a section may read. Sections never touch the network or the file system. */
export type BuildContext = {
  /** Everything in content/, checked by checkContent before any section runs. */
  readonly content: Content;
  /** Last good snapshot per registered source, keyed by source name. */
  readonly snapshots: ReadonlyMap<string, unknown>;
  /** Every logo content names (spec 0010), keyed by file name, as a `data:image/...;base64,` URI. */
  readonly logos: ReadonlyMap<string, string>;
  /**
   * Outside images the sources asked for (`Source.images`), keyed by their URL, as small `data:image/png;base64,`
   * URIs (spec 0010). An image refresh couldn't fetch is missing, so a section must have a fallback.
   */
  readonly images: ReadonlyMap<string, string>;
};

/** A self contained file written under assets/generated/. */
export type GeneratedAsset = {
  /** File name relative to assets/generated/, for example `header-dark.svg`. */
  readonly file: string;
  readonly content: string;
};

export type SectionOutput = {
  readonly markdown: string;
  readonly assets?: readonly GeneratedAsset[];
};

export type Section = (ctx: BuildContext) => SectionOutput;

/** The contract every outside source in src/sources/ follows (spec 0001). */
export type Source<Snapshot = unknown> = {
  readonly name: string;
  /** Property used to sort arrays of objects in the snapshot, so API order alone never causes a commit. */
  readonly sortKey: string;
  fetch(signal: AbortSignal): Promise<unknown>;
  /** Throws (ideally a ValidationError) when the raw response is not usable. */
  validate(raw: unknown): Snapshot;
  /**
   * Outside image URLs the sections embed for this snapshot (spec 0010). `pnpm refresh` stores a small copy of each
   * in `data/snapshots/images/`, and `pnpm build` reads them from there; build never fetches.
   */
  images?(snapshot: unknown): readonly string[];
};
