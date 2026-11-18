// Output checks run on the rendered output before anything is written: the README (spec 0001, AC-8),
// theme contrast, and the inside of every generated SVG (spec 0003). Pure: each returns a list of problems.

import { brands } from "./brands.ts";
import { type ContrastPair, contrastRatio, type Theme, type ThemeName, themeCss, themes, tokenNames } from "./theme.ts";
import type { GeneratedAsset } from "./types.ts";

const IMG_TAG = /<img\b[^>]*>/gi;
const ALT_ATTR = /\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+))/i;
// Inline `![alt](url)` and reference style `![alt][ref]` images.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\s*[([]/g;
const HEADING = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
const TAGS = /<[^>]*>/g;

/** Index ranges of `<h2>` elements that carry their own text, where a decorative icon may have `alt=""` (spec 0010). */
function headingRanges(readme: string): readonly (readonly [number, number])[] {
  return [...readme.matchAll(HEADING)]
    .filter((m) => m[1].replace(TAGS, "").trim() !== "")
    .map((m) => [m.index, m.index + m[0].length] as const);
}

export function checkReadme(readme: string): string[] {
  const problems: string[] = [];
  const headings = headingRanges(readme);
  const inHeading = (index: number): boolean => headings.some(([start, end]) => index > start && index < end);

  for (const match of readme.matchAll(IMG_TAG)) {
    const alt = ALT_ATTR.exec(match[0]);
    const value = alt ? (alt[1] ?? alt[2] ?? alt[3] ?? "") : undefined;
    if (value === undefined) {
      problems.push(`<img> without alt text: ${match[0]}`);
    } else if (value.trim() === "" && !(value === "" && inHeading(match.index))) {
      // `alt=""` is allowed only on a decorative heading icon: the heading text already says it.
      problems.push(`<img> with blank alt text: ${match[0]}`);
    }
  }

  for (const match of readme.matchAll(MARKDOWN_IMAGE)) {
    problems.push(
      `Markdown image syntax is not allowed, use <img alt="..."> (inside <picture> for light and dark): ${match[0]}`,
    );
  }

  return problems;
}

// --- README asset references (spec 0007, AC-11) ---

const URL_ATTR = /\s(?:src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const GENERATED_REF = /^(?:\.\/)?assets\/generated\/(.+)$/;

/** Every `assets/generated/<file>` the README names in a `src` or `srcset` must be a generated asset. */
export function checkReadmeAssets(readme: string, assets: readonly GeneratedAsset[]): string[] {
  const written = new Set(assets.map(({ file }) => file));
  const missing = new Set<string>();
  for (const m of readme.matchAll(URL_ATTR)) {
    // A srcset is a comma separated list of `url [descriptor]` candidates.
    for (const candidate of (m[1] ?? m[2] ?? m[3]).split(",")) {
      const ref = GENERATED_REF.exec(candidate.trim().split(/\s+/)[0]);
      if (ref && !written.has(ref[1])) missing.add(ref[1]);
    }
  }
  return [...missing].map((file) => `README references a missing generated asset: ${file}`);
}

// --- Contrast (spec 0003, AC-3) ---

const THEME_ORDER = ["light", "dark"] as const satisfies readonly ThemeName[];
const HEX_FORMAT = /^#[0-9a-f]{6}$/;

/** Ratio floored (never rounded up) to 2 decimals, so a failing ratio never prints as passing. */
const floor2 = (ratio: number): string => (Math.floor(ratio * 100) / 100).toFixed(2);

/** Every token must be lowercase `#rrggbb`, and every pair must meet its minimum, in both themes. */
export function checkContrast(
  themeSet: { readonly [K in ThemeName]: Theme },
  pairs: readonly ContrastPair[],
): string[] {
  const problems: string[] = [];
  for (const name of THEME_ORDER) {
    const theme = themeSet[name];
    const valid = new Set(tokenNames.filter((token) => HEX_FORMAT.test(theme[token])));
    for (const token of tokenNames) {
      if (!valid.has(token)) problems.push(`contrast: ${name} ${token} is "${theme[token]}", needs lowercase #rrggbb`);
    }
    for (const { fg, bg, min } of pairs) {
      if (!valid.has(fg) || !valid.has(bg)) continue; // already listed as a format problem
      const ratio = contrastRatio(theme[fg], theme[bg]);
      if (ratio < min) problems.push(`contrast: ${name} ${fg} on ${bg} is ${floor2(ratio)}:1, needs ${min}:1`);
    }
  }
  return problems;
}

// --- Generated SVGs (spec 0003, AC-6 and AC-7) ---

/** Searched case insensitively anywhere in the file, in this order. */
const FORBIDDEN = [
  "<script",
  "<foreignObject",
  "<iframe",
  "<object",
  "<embed",
  "<!DOCTYPE",
  "<!ENTITY",
  "<?xml-stylesheet",
  "@import",
  "javascript:",
] as const;

const TAG = /<[^>]*>/g;
const STYLE_ELEMENT = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
const FIRST_STYLE = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/i;
const STYLE_ATTR = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const EVENT_ATTR = /\s(on[a-z]+)\s*=/gi;
const LINK_ATTR = /\s(href|xlink:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const CSS_URL = /url\(([^)]*)\)/gi;
const LOCAL_REF = /^#[A-Za-z_][\w.-]*$/;
/** An embedded raster image (spec 0010, the timeline logos): self contained, and base64 has no markup characters. */
const DATA_IMAGE = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
const DATA_SVG = /^data:image\/svg\+xml;base64,([A-Za-z0-9+/]+={0,2})$/;
/** Every vendored brand file (spec 0010): the only SVGs another SVG may embed. */
const BRAND_FILES: ReadonlySet<string> = new Set(
  Object.values(brands).flatMap((brand: { readonly light: string; readonly dark?: string }) =>
    brand.dark === undefined ? [brand.light] : [brand.light, brand.dark],
  ),
);

/** A `data:image/svg+xml` URI whose content is exactly one of the vendored brand files. */
function isBrandImage(value: string): boolean {
  const m = DATA_SVG.exec(value);
  return m !== null && BRAND_FILES.has(Buffer.from(m[1], "base64").toString("utf8"));
}
const INFINITE = /infinite/i;

const COLOR_PROPS = "fill|stroke|stop-color|color|flood-color|lighting-color|background-color|background";
const COLOR_ATTR = new RegExp(`\\s(${COLOR_PROPS})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "gi");
// A value runs to `;`, `}`, or a quote, but a url(...) inside it is kept whole.
const COLOR_DECL = new RegExp(`(?<![\\w-])(${COLOR_PROPS})\\s*:\\s*((?:url\\([^)]*\\)|[^;}"'])*)`, "gi");
const COLOR_FUNCTION = /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/gi;
const HEX_COLOR = /#[0-9a-f]{3,8}(?![\w-])/gi;
const LOCAL_URL = /url\(\s*["']?\s*#[A-Za-z_][\w.-]*\s*["']?\s*\)/gi;
const ALLOWED_COLOR = /^(none|currentcolor|transparent|inherit|url\(\s*["']?\s*#[A-Za-z_][\w.-]*\s*["']?\s*\))$/i;

const CLASS_ATTR = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const COLOR_CLASS = /^(?:fill|stroke|stop)-/;
const SVG_FILE = /\.svg$/i;
const THEMED_FILE = /^(.+)-(light|dark)\.svg$/;

const trimRef = (value: string): string =>
  value
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

/** Markup only: tags and `<style>` contents, never text content (which may say "#1" or "infinite"). */
function markupOf(svg: string): string {
  const tags = [...svg.matchAll(TAG)].map((m) => m[0]);
  const styles = [...svg.matchAll(STYLE_ELEMENT)].map((m) => m[1]);
  return [...tags, ...styles].join("\n");
}

function checkSelfContained(svg: string): string[] {
  const problems: string[] = [];
  const lower = svg.toLowerCase();
  for (const token of FORBIDDEN) {
    if (lower.includes(token.toLowerCase())) problems.push(`must not contain ${token}`);
  }
  for (const tag of svg.matchAll(TAG)) {
    for (const [, name] of tag[0].matchAll(EVENT_ATTR)) problems.push(`must not have an event attribute: ${name}`);
  }
  const styles = [
    ...[...svg.matchAll(STYLE_ELEMENT)].map((m) => m[1]),
    ...[...svg.matchAll(STYLE_ATTR)].map((m) => m[1] ?? m[2]),
  ];
  if (styles.some((css) => INFINITE.test(css))) problems.push("must not animate infinitely (motion ends within 5s)");
  const markup = markupOf(svg);
  for (const m of markup.matchAll(LINK_ATTR)) {
    const value = (m[2] ?? m[3] ?? m[4]).trim();
    if (DATA_IMAGE.test(value) || isBrandImage(value)) continue;
    if (!LOCAL_REF.test(value)) problems.push(`${m[1]} must point to #<id>, not ${value.slice(0, 80)}`);
  }
  for (const m of markup.matchAll(CSS_URL)) {
    if (!LOCAL_REF.test(trimRef(m[1]))) problems.push(`url() must point to #<id>, not ${m[1].trim()}`);
  }
  return problems;
}

function checkColors(svg: string, theme: Theme): string[] {
  const block = themeCss(theme);
  const first = FIRST_STYLE.exec(svg);
  if (!first?.[1].startsWith(block)) {
    return [`first <style> must start with the ${theme.name} color classes from themeCss`];
  }
  const contentStart = first.index + first[0].indexOf(">") + 1;
  // Everything outside the generated block names colors by class only.
  const markup = markupOf(svg.slice(0, contentStart) + svg.slice(contentStart + block.length));
  const allowed = (value: string): boolean => ALLOWED_COLOR.test(value.replace(/!important\s*$/i, "").trim());
  const problems: string[] = [];
  for (const m of markup.matchAll(COLOR_ATTR)) {
    const value = m[2] ?? m[3] ?? m[4];
    if (!allowed(value)) problems.push(`${m[1]}="${value}" must use a color class instead`);
  }
  for (const m of markup.matchAll(COLOR_DECL)) {
    if (!allowed(m[2])) problems.push(`${m[1]}:${m[2].trim()} must use a color class instead`);
  }
  // What is left: colors written anywhere else, such as in a gradient or a shorthand.
  const rest = markup.replace(COLOR_ATTR, " ").replace(COLOR_DECL, " ").replace(LINK_ATTR, " ").replace(LOCAL_URL, " ");
  for (const m of rest.matchAll(COLOR_FUNCTION))
    problems.push(`color function ${m[1]}() must use a color class instead`);
  for (const m of rest.matchAll(HEX_COLOR)) problems.push(`hex color ${m[0]} must use a color class instead`);
  // A color class the block doesn't define would draw in the default black (spec 0010).
  const defined = new Set([...block.matchAll(/\.([a-zA-Z0-9-]+)\{/g)].map((m) => m[1]));
  const used = [...markup.matchAll(CLASS_ATTR)].flatMap((m) => (m[1] ?? m[2]).split(/\s+/));
  for (const name of new Set(used.filter((c) => COLOR_CLASS.test(c) && !defined.has(c)))) {
    problems.push(`color class ${name} is not defined by themeCss`);
  }
  return problems;
}

/**
 * Every vendored brand file (spec 0010) is self contained: no script, event attribute, doctype, `@import`, or link
 * other than `#<id>`. Colors are not checked: a brand file keeps its own.
 */
export function checkBrands(): string[] {
  return Object.entries(brands).flatMap(([name, brand]: [string, { readonly light: string; readonly dark?: string }]) =>
    [brand.light, ...(brand.dark === undefined ? [] : [brand.dark])].flatMap((file, i) =>
      checkSelfContained(file).map((p) => `brand: ${name} ${i === 0 ? "light" : "dark"}: ${p}`),
    ),
  );
}

/** Self containment, light and dark twins, and the color rule, for every generated SVG sorted by name. */
export function checkSvgAssets(assets: readonly GeneratedAsset[]): string[] {
  const svgs = assets.filter(({ file }) => SVG_FILE.test(file)).toSorted((a, b) => (a.file < b.file ? -1 : 1));
  const names = new Set(svgs.map(({ file }) => file));
  return svgs.flatMap(({ file, content }) => {
    const problems = checkSelfContained(content);
    const themed = THEMED_FILE.exec(file);
    if (!themed) {
      problems.push("name must end in -light.svg or -dark.svg");
    } else {
      const name: ThemeName = themed[2] === "light" ? "light" : "dark";
      const other: ThemeName = name === "light" ? "dark" : "light";
      const twin = `${themed[1]}-${other}.svg`;
      if (!names.has(twin)) problems.push(`has no ${other} twin ${twin}`);
      problems.push(...checkColors(content, themes[name]));
    }
    return problems.map((p) => `svg: ${file}: ${p}`);
  });
}
