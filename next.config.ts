import type { NextConfig } from "next";
import { HUB_MARKDOWN_PAGES } from "./lib/markdown-paths";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/models.json",
        destination: "/api/models.json",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // A ".md" suffix cannot be a dynamic segment next to the HTML page, so
    // these run before dynamic routes and keep /models/:slug and /providers/:slug.
    return [
      ...HUB_MARKDOWN_PAGES.map((entry) => ({
        source: entry.markdownPath,
        destination: `/api/md/pages/${entry.page}`,
      })),
      {
        source: "/models/:slug.md",
        destination: "/api/md/models/:slug",
      },
      {
        source: "/providers/:provider.md",
        destination: "/api/md/providers/:provider",
      },
      {
        source: "/compare/:pair.md",
        destination: "/api/md/compare/:pair",
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
