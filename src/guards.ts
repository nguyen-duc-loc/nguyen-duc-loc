// Output checks run on the rendered README text before anything is written (spec 0001, AC-8).
// They check README.md only, not the inside of generated SVGs.

const IMG_TAG = /<img\b[^>]*>/gi;
const ALT_ATTR = /\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+))/i;
// Inline `![alt](url)` and reference style `![alt][ref]` images.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\s*[([]/g;

export function checkReadme(readme: string): string[] {
  const problems: string[] = [];

  for (const match of readme.matchAll(IMG_TAG)) {
    const alt = ALT_ATTR.exec(match[0]);
    const value = alt ? (alt[1] ?? alt[2] ?? alt[3] ?? "") : undefined;
    if (value === undefined) {
      problems.push(`<img> without alt text: ${match[0]}`);
    } else if (value.trim() === "") {
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
