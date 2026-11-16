// node src/keepalive.ts --days <n>
// If the latest commit is older than <n> days, writes today's UTC date to .github/last-refresh.
// Never stages, commits, or pushes (the workflow does that). Exits 0 whether or not it wrote.

import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { LAST_REFRESH_FILE, ROOT } from "./paths.ts";

const DAY_MS = 86_400_000;

function parseDays(): number {
  const { values } = parseArgs({ options: { days: { type: "string" } } });
  const days = Number(values.days);
  if (values.days === undefined || !Number.isInteger(days) || days < 0) {
    throw new Error("usage: node src/keepalive.ts --days <whole number, 0 or more>");
  }
  return days;
}

function latestCommitMs(): number {
  let output: string;
  try {
    output = execFileSync("git", ["log", "-1", "--format=%ct"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(`not a git repository with commits: ${ROOT}`);
  }
  const seconds = Number(output.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("could not read the latest commit time");
  return seconds * 1000;
}

async function keepalive(): Promise<void> {
  const days = parseDays();
  const ageMs = Date.now() - latestCommitMs();
  if (ageMs < days * DAY_MS) {
    console.log(`keepalive: latest commit is ${Math.floor(ageMs / DAY_MS)} days old, nothing to do`);
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  await mkdir(dirname(LAST_REFRESH_FILE), { recursive: true });
  await writeFile(LAST_REFRESH_FILE, `${today}\n`, "utf8");
  console.log(`keepalive: wrote ${today} to .github/last-refresh`);
}

try {
  await keepalive();
} catch (error) {
  console.error(`keepalive failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
