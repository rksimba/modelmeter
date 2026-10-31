import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "ModelMeter — AI API prices from the source",
} as const;

/** Absolute URL from NEXT_PUBLIC_SITE_URL, via getSiteUrl(). The site root has no trailing slash. */
export function absoluteUrl(path: string): string {
  const origin = getSiteUrl().replace(/\/$/, "");
  if (path === "" || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Unique title, description, canonical, Open Graph, and Twitter card.
 * `title` is the short title. The root template adds " · ModelMeter"
 * except when `absoluteTitle` is set (the home page, which is the same
 * segment as the root layout template).
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  markdownPath,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  /** Public Markdown URL for this page, when one exists. */
  markdownPath?: string;
}): Metadata {
  const canonical = absoluteUrl(path);
  const socialTitle = absoluteTitle ? title : `${title} · ${siteConfig.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      types: {
        "text/plain": [{ url: "/llms.txt", title: "llms.txt" }],
        "application/json": [{ url: "/api/models.json", title: "Model dataset" }],
        "application/rss+xml": [{ url: "/price-changes.xml", title: "AI API price changes" }],
        ...(markdownPath
          ? { "text/markdown": [{ url: markdownPath, title: "Markdown" }] }
          : {}),
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}
