import type { Source } from "../types.ts";
import { leetcode } from "./leetcode.ts";

/**
 * Every outside source `pnpm refresh` fetches. Features 10 and 12 add theirs here.
 * A registered source must have a committed snapshot in data/snapshots/<name>.json, or build fails.
 */
export const sources: readonly Source[] = [leetcode];
