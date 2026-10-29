import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { formatIsoDate } from "@/lib/format";
import { absoluteUrl, pageMetadata } from "@/lib/metadata";
import {
  formatTokenRates,
  priceChangeKindLabel,
  priceChangeModelName,
  priceChangeTitle,
  priceChangesNewestFirst,
} from "@/lib/price-changes";
import { breadcrumbNode, jsonLdGraph } from "@/lib/structured-data";

const description =
  "Dated, sourced changes to AI model API list prices in the ModelMeter ledger, including new models and scheduled rates already published on official provider pages.";

export const metadata: Metadata = pageMetadata({
  title: "AI API price changes",
  description,
  path: "/price-changes",
});

export const ensureStatic = "navigation";

export default function PriceChangesPage() {
  const changes = priceChangesNewestFirst();
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "Price changes", path: "/price-changes" },
    ]),
    {
      "@type": "ItemList",
      name: "AI API price changes",
      numberOfItems: changes.length,
      itemListElement: changes.map((change, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: priceChangeTitle(change),
        description: change.note,
        url: absoluteUrl(`/models/${change.modelSlug}`),
      })),
    },
  ]);

  return (
    <main className="page page-narrow">
      <JsonLd data={structuredData} />
      <header className="pt-6 sm:pt-10">
        <h1 className="display text-5xl text-ink sm:text-6xl">AI API price changes</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Newest effective date first. Each row is a change to a stored list price, a model added
          to the ledger, or a scheduled rate an official page has already published. Rates are USD
          per 1M tokens, shown as input / cached input / output.
        </p>
        <p className="mt-3 text-sm">
          <a href="/price-changes.xml" className="text-accent underline">
            RSS feed
          </a>
        </p>
      </header>
      <ol className="divide-y divide-line border-y border-line">
        {changes.map((change) => {
          const name = priceChangeModelName(change);
          const scheduled = change.kind === "scheduled change";
          return (
            <li key={`${change.modelSlug}-${change.date}-${change.kind}`} className="py-6">
              <p className="text-sm text-muted">
                <time dateTime={change.date}>{formatIsoDate(change.date)}</time>
                {" · "}
                {scheduled ? (
                  <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium leading-5 text-ink">
                    {priceChangeKindLabel(change.kind)}
                  </span>
                ) : (
                  priceChangeKindLabel(change.kind)
                )}
                {" · "}
                {change.provider}
              </p>
              <h2 className="mt-2 text-lg font-medium">
                <Link href={`/models/${change.modelSlug}`} className="transition-colors hover:text-accent">
                  {name}
                </Link>
              </h2>
              <p className="num mt-2 text-sm">
                {formatTokenRates(change.oldRates)}
                {" → "}
                {formatTokenRates(change.newRates)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{change.note}</p>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <a href={change.sourceUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                  Source
                </a>
                {change.alsoSourceUrl ? (
                  <a
                    href={change.alsoSourceUrl}
                    className="text-accent underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pricing table
                  </a>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
