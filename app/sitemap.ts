import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";
import { indexablePaths } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePaths().map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: new Date(`${entry.lastModified}T00:00:00Z`),
  }));
}
