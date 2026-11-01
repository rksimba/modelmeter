/**
 * Public Markdown paths. Kept free of other lib imports so metadata and
 * next.config can share the list with the route handlers.
 */
export const HUB_MARKDOWN_PAGES: { page: string; htmlPath: string; markdownPath: string }[] = [
  { page: "index", htmlPath: "/", markdownPath: "/index.md" },
  { page: "models", htmlPath: "/models", markdownPath: "/models.md" },
  { page: "providers", htmlPath: "/providers", markdownPath: "/providers.md" },
  { page: "price-changes", htmlPath: "/price-changes", markdownPath: "/price-changes.md" },
  { page: "releases", htmlPath: "/releases", markdownPath: "/releases.md" },
  { page: "faq", htmlPath: "/faq", markdownPath: "/faq.md" },
  { page: "cheapest-ai-api", htmlPath: "/cheapest-ai-api", markdownPath: "/cheapest-ai-api.md" },
  {
    page: "largest-context-window-ai-models",
    htmlPath: "/largest-context-window-ai-models",
    markdownPath: "/largest-context-window-ai-models.md",
  },
  { page: "compare", htmlPath: "/compare", markdownPath: "/compare.md" },
];

/** Public Markdown path for an HTML page, or null when that page has no Markdown version. */
export function markdownAlternatePath(htmlPath: string): string | null {
  const hub = HUB_MARKDOWN_PAGES.find((entry) => entry.htmlPath === htmlPath);
  if (hub) return hub.markdownPath;
  if (/^\/models\/[^/]+$/.test(htmlPath)) return `${htmlPath}.md`;
  if (/^\/providers\/[^/]+$/.test(htmlPath)) return `${htmlPath}.md`;
  if (/^\/compare\/[^/]+$/.test(htmlPath)) return `${htmlPath}.md`;
  return null;
}
