import { DATASET_CHECKED_ON, models } from "@/data/models";
import type { FaqItem } from "@/lib/faq";
import { absoluteUrl } from "@/lib/metadata";
import { methodologyParagraphs, siteConfig } from "@/lib/site";

export function organizationNode() {
  const url = absoluteUrl("/");
  return {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: siteConfig.name,
    url,
    description: siteConfig.description,
  };
}

export function websiteNode() {
  const url = absoluteUrl("/");
  return {
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: siteConfig.name,
    url,
    description: siteConfig.description,
    inLanguage: "en",
    publisher: { "@id": `${url}/#organization` },
  };
}

/** Dataset for the public price table. No license is declared because the repo does not publish one. */
export function datasetNode() {
  const url = absoluteUrl("/");
  return {
    "@type": "Dataset",
    "@id": `${url}/#dataset`,
    name: "ModelMeter AI API price dataset",
    description: methodologyParagraphs.join(" "),
    url,
    dateModified: DATASET_CHECKED_ON,
    isAccessibleForFree: true,
    creator: { "@id": `${url}/#organization` },
    publisher: { "@id": `${url}/#organization` },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: absoluteUrl("/api/models.json"),
    },
    variableMeasured: [
      "input price per 1M tokens",
      "output price per 1M tokens",
      "context window",
    ],
    numberOfItems: models.length,
  };
}

export function faqNode(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jsonLdGraph(nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
