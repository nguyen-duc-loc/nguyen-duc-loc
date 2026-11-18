// pnpm build: content + snapshots -> README.md and assets/generated/. Never touches the network.

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { content } from "../content/index.ts";
import { assertContent, logoFiles } from "./content.ts";
import { checkContrast, checkReadme, checkReadmeAssets, checkSvgAssets } from "./guards.ts";
import { GENERATED_DIR, LOGO_DIR, README_FILE } from "./paths.ts";
import { renderReadme } from "./readme.ts";
import { readSnapshot } from "./snapshots.ts";
import { readImages } from "./sources/images.ts";
import { sources } from "./sources/index.ts";
import { contrastPairs, themes } from "./theme.ts";
import type { GeneratedAsset } from "./types.ts";

const SAFE_ASSET_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

function toFileText(text: string): string {
  return `${text.replace(/\r\n?/g, "\n").replace(/\n*$/, "")}\n`;
}

const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" } as const;

/** Each logo content names, read from `assets/static/logos/` as a data URI (spec 0010). */
async function readLogos(files: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const logos = new Map<string, string>();
  for (const file of files) {
    const extension = file.slice(file.lastIndexOf(".") + 1);
    const mime = extension === "png" || extension === "jpg" || extension === "jpeg" ? MIME[extension] : undefined;
    if (mime === undefined) throw new Error(`logo ${file}: must be a .png, .jpg, or .jpeg file`);
    let bytes: Buffer;
    try {
      bytes = await readFile(join(LOGO_DIR, file));
    } catch (error) {
      throw new Error(`logo ${file}: not found in assets/static/logos/`, { cause: error });
    }
    logos.set(file, `data:${mime};base64,${bytes.toString("base64")}`);
  }
  return logos;
}

/** Every outside image URL the registered sources ask for, for the snapshots on disk (spec 0010). */
export function imageUrls(snapshots: ReadonlyMap<string, unknown>): readonly string[] {
  const urls = sources.flatMap((source) => source.images?.(snapshots.get(source.name)) ?? []);
  return [...new Set(urls)].toSorted();
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
  // 1. Check content (a failed check writes nothing), then load snapshots, logos, and stored outside images.
  assertContent(content);
  const snapshots = new Map<string, unknown>();
  for (const source of sources) {
    snapshots.set(source.name, await readSnapshot(source.name));
  }

  // 2. Render in memory, then 3. run the guards. A failed guard writes nothing.
  const logos = await readLogos(logoFiles(content));
  const images = await readImages(imageUrls(snapshots));
  const { readme, assets } = renderReadme({ content, snapshots, logos, images });
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
