import type { MetadataRoute } from "next";
import { DATASET_CHECKED_ON, models } from "@/data/models";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const lastModified = new Date(`${DATASET_CHECKED_ON}T00:00:00Z`);
  const staticRoutes = ["", "/calculator", "/releases", "/about", "/sponsor"].map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified,
  }));
  const modelRoutes = models.map((model) => ({
    url: `${origin}/models/${model.slug}`,
    lastModified: new Date(`${model.updatedAt}T00:00:00Z`),
  }));
  return [...staticRoutes, ...modelRoutes];
}
