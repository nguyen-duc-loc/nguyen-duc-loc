import type { Source } from "../types.ts";

/**
 * Every outside source `pnpm refresh` fetches. Features 8, 10, and 12 register the first ones.
 * A registered source must have a committed snapshot in data/snapshots/<name>.json, or build fails.
 */
export const sources: readonly Source[] = [];
