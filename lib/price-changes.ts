import { DATASET_CHECKED_ON } from "@/data/models";
import {
  priceChanges,
  type PriceChange,
  type PriceChangeKind,
  type TokenRates,
} from "@/data/price-changes";
import { formatIsoDate, formatRate } from "@/lib/format";
import { absoluteUrl } from "@/lib/metadata";
import { getModel } from "@/lib/models";

export function priceChangeKindLabel(kind: PriceChangeKind): string {
  switch (kind) {
    case "price cut":
      return "Price cut";
    case "price increase":
      return "Price increase";
    case "price removed":
      return "Price removed";
    case "new model":
      return "New model";
    case "scheduled change":
      return "Scheduled change";
  }
}

/** Newest effective date first. Same-day rows stay in ledger order. */
export function priceChangesNewestFirst(): PriceChange[] {
  return priceChanges
    .map((change, index) => ({ change, index }))
    .sort((a, b) => {
      const byDate = b.change.date.localeCompare(a.change.date);
      if (byDate !== 0) return byDate;
      return a.index - b.index;
    })
    .map(({ change }) => change);
}

export function formatTokenRates(rates: TokenRates | null): string {
  if (!rates) return "n/a";
  return `${formatRate(rates.inputUsdPerMillion)} / ${formatRate(rates.cachedInputUsdPerMillion)} / ${formatRate(rates.outputUsdPerMillion)}`;
}

export function priceChangeModelName(change: PriceChange): string {
  return getModel(change.modelSlug)?.name ?? change.modelSlug;
}

export function priceChangeTitle(change: PriceChange): string {
  return `${formatIsoDate(change.date)} — ${priceChangeModelName(change)} ${priceChangeKindLabel(change.kind).toLowerCase()}`;
}

export function priceChangesPlainText(): string {
  const lines = priceChangesNewestFirst().map((change) => {
    const also = change.alsoSourceUrl ? ` Also: ${change.alsoSourceUrl}` : "";
    return [
      `- ${change.date} ${change.kind} — ${change.provider} — ${priceChangeModelName(change)} (${change.modelSlug})`,
      `  ${formatTokenRates(change.oldRates)} -> ${formatTokenRates(change.newRates)} per 1M tokens (input / cached input / output)`,
      `  ${change.note}`,
      `  Source: ${change.sourceUrl}${also}`,
      `  Model page: ${absoluteUrl(`/models/${change.modelSlug}`)}`,
    ].join("\n");
  });

  return [
    "## Price changes",
    "Newest effective date first. Scheduled rows are rate changes an official page has already published.",
    "Rates are USD per 1 million tokens: input / cached input / output. n/a means there was no previous stored rate.",
    ...lines,
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export function priceChangesRss(): string {
  const pageUrl = absoluteUrl("/price-changes");
  const items = priceChangesNewestFirst()
    .map((change) => {
      const title = priceChangeTitle(change);
      const link = absoluteUrl(`/models/${change.modelSlug}`);
      const guid = `${pageUrl}#${change.modelSlug}-${change.date}-${change.kind.replace(/\s+/g, "-")}`;
      const description = `${change.note} Previous: ${formatTokenRates(change.oldRates)}. New: ${formatTokenRates(change.newRates)} per 1M tokens (input / cached input / output). Source: ${change.sourceUrl}${change.alsoSourceUrl ? ` Also: ${change.alsoSourceUrl}` : ""}`;
      return [
        "    <item>",
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(guid)}</guid>`,
        `      <pubDate>${escapeXml(rfc822(change.date))}</pubDate>`,
        `      <description>${escapeXml(description)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0">`,
    `  <channel>`,
    `    <title>AI API price changes · ModelMeter</title>`,
    `    <link>${escapeXml(pageUrl)}</link>`,
    `    <description>Dated, sourced changes to AI model API list prices in the ModelMeter ledger, including new models and scheduled rates copied from official provider pages.</description>`,
    `    <language>en-us</language>`,
    `    <lastBuildDate>${escapeXml(rfc822(DATASET_CHECKED_ON))}</lastBuildDate>`,
    items,
    `  </channel>`,
    `</rss>`,
    "",
  ].join("\n");
}
