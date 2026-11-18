import type { Content } from "../content/types.ts";

/** Everything a section may read. Sections never touch the network or the file system. */
export type BuildContext = {
  /** Everything in content/, checked by checkContent before any section runs. */
  readonly content: Content;
  /** Last good snapshot per registered source, keyed by source name. */
  readonly snapshots: ReadonlyMap<string, unknown>;
  /** Every logo content names (spec 0010), keyed by file name, as a `data:image/...;base64,` URI. */
  readonly logos: ReadonlyMap<string, string>;
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
};
