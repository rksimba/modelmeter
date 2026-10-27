import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const aiCrawlers = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
