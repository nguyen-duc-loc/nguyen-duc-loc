import { fileURLToPath } from "node:url";

/** Repo root, resolved from this file so commands work from any working directory. */
export const ROOT = fileURLToPath(new URL("../", import.meta.url));

export const README_FILE = fileURLToPath(new URL("../README.md", import.meta.url));
export const GENERATED_DIR = fileURLToPath(new URL("../assets/generated/", import.meta.url));
export const LOGO_DIR = fileURLToPath(new URL("../assets/static/logos/", import.meta.url));
export const SNAPSHOT_DIR = fileURLToPath(new URL("../data/snapshots/", import.meta.url));
export const LAST_REFRESH_FILE = fileURLToPath(new URL("../.github/last-refresh", import.meta.url));
