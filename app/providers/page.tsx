import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { LedgerLinks } from "@/components/ledger-links";
import { DATASET_CHECKED_ON, models } from "@/data/models";
import { formatIsoDate, formatRate } from "@/lib/format";
import { modelsByProvider, providerSlug, providers } from "@/lib/models";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, jsonLdGraph, modelItemListNode } from "@/lib/structured-data";

export const metadata = pageMetadata({
  title: "AI API providers",
  description:
    "AI API providers in the ModelMeter ledger. Each page lists that company's models, stored list prices, and rate labels.",
  path: "/providers",
});

export const ensureStatic = "navigation";

export default function ProvidersPage() {
  const names = providers();
  const rows = names.flatMap((provider) => modelsByProvider(provider));
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "AI API providers", path: "/providers" },
    ]),
    modelItemListNode(
      rows.map((model) => ({ name: model.name, slug: model.slug })),
      "AI API providers",
    ),
  ]);
  return (
    <main className="page page-narrow">
      <JsonLd data={structuredData} />
      <header className="pt-6 sm:pt-10">
        <p className="text-sm text-muted">Last checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">AI API providers</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          The ledger groups models by the company that bills the API. A host such as Together AI
          or Groq is listed under that host, not under the lab that trained an open model. There
          are {names.length} providers and {models.length} models. Each price is the rate named on
          the row, copied from the official page linked there.
        </p>
      </header>
      <section>
        <h2 className="text-lg font-medium">Providers</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {names.map((provider) => {
            const rows = modelsByProvider(provider);
            const priced = rows.filter((model) => model.inputUsdPerMillion !== null);
            const inputs = priced.map((model) => model.inputUsdPerMillion ?? 0);
            const range =
              inputs.length === 0
                ? "no published input rate"
                : `input ${formatRate(Math.min(...inputs))}–${formatRate(Math.max(...inputs))} per 1M tokens`;
            return (
              <li key={provider} className="py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <Link
                    href={`/providers/${providerSlug(provider)}`}
                    className="font-medium transition-colors hover:text-accent"
                  >
                    {provider}
                  </Link>
                  <p className="text-sm text-muted">
                    {rows.length} {rows.length === 1 ? "model" : "models"} · {range}
                  </p>
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {rows.map((model) => (
                    <li key={model.slug}>
                      <Link href={`/models/${model.slug}`} className="text-sm text-accent underline">
                        {model.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
      <LedgerLinks current="/providers" />
    </main>
  );
}
