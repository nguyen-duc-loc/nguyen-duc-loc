import type { Source } from "../types.ts";
import { credly } from "./credly.ts";
import { leetcode } from "./leetcode.ts";

/**
 * Every outside source `pnpm refresh` fetches. Feature 12 adds its own here.
 * A registered source must have a committed snapshot in data/snapshots/<name>.json, or build fails.
 */
export const sources: readonly Source[] = [leetcode, credly];
