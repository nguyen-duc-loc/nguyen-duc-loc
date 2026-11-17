// pnpm build: content + snapshots -> README.md and assets/generated/. Never touches the network.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { content } from "../content/index.ts";
import { assertContent } from "./content.ts";
import { checkContrast, checkReadme, checkReadmeAssets, checkSvgAssets } from "./guards.ts";
import { GENERATED_DIR, README_FILE } from "./paths.ts";
import { renderReadme } from "./readme.ts";
import { readSnapshot } from "./snapshots.ts";
import { sources } from "./sources/index.ts";
import { contrastPairs, themes } from "./theme.ts";
import type { GeneratedAsset } from "./types.ts";

const SAFE_ASSET_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

function toFileText(text: string): string {
  return `${text.replace(/\r\n?/g, "\n").replace(/\n*$/, "")}\n`;
}

function checkAssets(assets: readonly GeneratedAsset[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const { file } of assets) {
    if (!SAFE_ASSET_NAME.test(file) || file === ".gitkeep") {
      problems.push(`invalid generated asset name: ${file}`);
    } else if (seen.has(file)) {
      problems.push(`two sections generate the same asset: ${file}`);
    }
    seen.add(file);
  }
  return problems;
}

export async function build(): Promise<void> {
  // 1. Check content (a failed check writes nothing), then load snapshots.
  assertContent(content);
  const snapshots = new Map<string, unknown>();
  for (const source of sources) {
    snapshots.set(source.name, await readSnapshot(source.name));
  }

  // 2. Render in memory, then 3. run the guards. A failed guard writes nothing.
  const { readme, assets } = renderReadme({ content, snapshots });
  const problems = [
    ...checkReadme(readme),
    ...checkReadmeAssets(readme, assets),
    ...checkAssets(assets),
    ...checkContrast(themes, contrastPairs),
    ...checkSvgAssets(assets),
  ];
  if (problems.length > 0) {
    throw new Error(`guard failed, nothing was written:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }

  // 4. Clear assets/generated/ (keeping .gitkeep), then write everything.
  await mkdir(GENERATED_DIR, { recursive: true });
  for (const entry of await readdir(GENERATED_DIR)) {
    if (entry !== ".gitkeep") await rm(join(GENERATED_DIR, entry), { recursive: true, force: true });
  }
  for (const asset of assets) {
    await writeFile(join(GENERATED_DIR, asset.file), toFileText(asset.content), "utf8");
  }
  await writeFile(README_FILE, toFileText(readme), "utf8");
}

if (import.meta.main) {
  try {
    await build();
    console.log("build: wrote README.md");
  } catch (error) {
    console.error(`build failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
