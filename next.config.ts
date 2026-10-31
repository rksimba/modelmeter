import type { NextConfig } from "next";

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
      {
        source: "/models/:slug.md",
        destination: "/api/md/models/:slug",
      },
      {
        source: "/providers/:provider.md",
        destination: "/api/md/providers/:provider",
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
