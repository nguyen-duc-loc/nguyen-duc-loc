// Escaping for content text (spec 0003). Each value is escaped exactly once, where it enters markup.

const XML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const;

/** Plain text to text that is safe inside SVG text and in quoted SVG or HTML attributes. */
export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => XML_ESCAPES[char as keyof typeof XML_ESCAPES]);
}
