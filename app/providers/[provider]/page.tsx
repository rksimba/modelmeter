import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { LedgerLinks } from "@/components/ledger-links";
import { RateList } from "@/components/rate-list";
import { comparisonsForProvider } from "@/lib/comparisons";
import { formatIsoDate } from "@/lib/format";
import { latestUpdate, modelsByProvider, providerFromSlug, providerSlug, providers } from "@/lib/models";
import { providerMarkdownPath } from "@/lib/markdown";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, jsonLdGraph, modelItemListNode } from "@/lib/structured-data";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return providers().map((provider) => ({ provider: providerSlug(provider) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider: slug } = await params;
  const provider = providerFromSlug(slug);
  if (!provider) return { title: "Provider" };
  const rows = modelsByProvider(provider);
  const checked = latestUpdate(rows);
  return pageMetadata({
    title: `${provider} API prices`,
    description: `${provider} API list prices on ModelMeter: ${rows.length} ${rows.length === 1 ? "model" : "models"}, USD per 1M tokens, each linked to the official source. Last checked ${formatIsoDate(checked)}.`,
    path: `/providers/${slug}`,
    markdownPath: providerMarkdownPath(slug),
  });
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider: slug } = await params;
  const provider = providerFromSlug(slug);
  if (!provider) notFound();
  const rows = modelsByProvider(provider);
  const checked = latestUpdate(rows);
  const pairs = comparisonsForProvider(provider);
  const hosts = [...new Set(rows.map((model) => model.weightsFrom).filter(Boolean))];
  const others = providers().filter((name) => name !== provider);
  const heading = `${provider} API prices`;
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "Providers", path: "/providers" },
      { name: heading, path: `/providers/${slug}` },
    ]),
    modelItemListNode(
      rows.map((model) => ({ name: model.name, slug: model.slug })),
      "Models and prices",
    ),
  ]);

  return (
    <main className="page">
      <JsonLd data={structuredData} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">
          <Link href="/providers" className="hover:text-ink">
            Providers
          </Link>
        </p>
        <p className="mt-4 text-sm text-muted">Last checked {formatIsoDate(checked)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">{heading}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          {provider} has {rows.length} {rows.length === 1 ? "model" : "models"} in this ledger.
          Each price is the rate named on the row, copied from that model&apos;s official page. If
          the page does not publish a number, the cell is n/a. Each row keeps its own updated
          date. ModelMeter does not sell {provider} access.
        </p>
        {hosts.length > 0 ? (
          <p className="mt-4 text-base leading-relaxed text-muted">
            Hosted models are labelled with the lab that trained the weights
            {hosts.length === 1 ? ` (${hosts[0]})` : ""}. The price is what {provider} bills.
          </p>
        ) : null}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Models and prices</h2>
        <RateList rows={rows} caption={`${provider} API list prices`} showProvider={false} />
      </section>

      {pairs.length > 0 ? (
        <section>
          <h2 className="text-lg font-medium">Same-tier comparisons</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            These pairs put a {provider} model next to a model from another provider with a
            published input rate and output rate in the same tier.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {pairs.map((pair) => (
              <li key={pair.slug}>
                <Link href={`/compare/${pair.slug}`} className="text-accent underline">
                  {pair.a.name} vs {pair.b.name}
                </Link>
                <span className="text-muted">
                  {" "}
                  · {pair.a.provider} and {pair.b.provider}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-medium">Other providers</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {others.map((name) => (
            <li key={name}>
              <Link href={`/providers/${providerSlug(name)}`} className="text-accent underline">
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LedgerLinks current={`/providers/${slug}`} />
    </main>
  );
}
