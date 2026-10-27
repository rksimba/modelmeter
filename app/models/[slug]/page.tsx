import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { models } from "@/data/models";
import { comparisonsForModel } from "@/lib/comparisons";
import {
  formatIsoDate,
  formatModalities,
  formatRate,
  formatRelease,
  formatTokens,
  statusLabel,
} from "@/lib/format";
import { modelsByProvider, providerSlug } from "@/lib/models";
import { absoluteUrl, pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { breadcrumbNode, jsonLdGraph } from "@/lib/structured-data";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return models.map((model) => ({ slug: model.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = models.find((item) => item.slug === slug);
  if (!model) return { title: "Model" };
  const description = `${model.provider} ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}). Checked ${formatIsoDate(model.updatedAt)}.`;
  return pageMetadata({
    title: `${model.name} API price`,
    description,
    path: `/models/${model.slug}`,
  });
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = models.find((item) => item.slug === slug);
  if (!model) notFound();

  const providerPath = `/providers/${providerSlug(model.provider)}`;
  const pagePath = `/models/${model.slug}`;
  const description = `${model.provider} ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}).`;
  const siblings = modelsByProvider(model.provider).filter((item) => item.slug !== model.slug);
  const pairs = comparisonsForModel(model.slug);
  const crumbs = [
    { name: "Compare", path: "/" },
    { name: model.provider, path: providerPath },
    { name: model.name, path: pagePath },
  ];

  const jsonLd = jsonLdGraph([
    breadcrumbNode(crumbs),
    {
      "@type": "TechArticle",
      headline: `${model.name} API list price`,
      description,
      dateModified: model.updatedAt,
      author: { "@type": "Organization", name: siteConfig.name, url: absoluteUrl("/") },
      citation: model.sourceUrl,
      url: absoluteUrl(pagePath),
      mainEntityOfPage: absoluteUrl(pagePath),
    },
  ]);

  const facts = [
    ["Input / 1M", formatRate(model.inputUsdPerMillion)],
    ["Cached input / 1M", formatRate(model.cachedInputUsdPerMillion)],
    ["Output / 1M", formatRate(model.outputUsdPerMillion)],
    ["Context", formatTokens(model.contextTokens)],
    ["Max output", formatTokens(model.maxOutputTokens)],
    ["Modalities", formatModalities(model)],
    ["Released", formatRelease(model)],
    ["Status", statusLabel(model.status)],
    ["API id", model.apiId ?? "n/a"],
    ["Updated", formatIsoDate(model.updatedAt)],
  ];

  return (
    <main className="page page-narrow">
      <JsonLd data={jsonLd} />
      <header className="pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <li>
              <Link href="/" className="hover:text-ink">
                Compare
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={providerPath} className="hover:text-ink">
                {model.provider}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{model.name}</li>
          </ol>
        </nav>
        <h1 className="display mt-3 text-5xl text-ink sm:text-6xl">{model.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {statusLabel(model.status)}
          {model.weightsFrom ? ` · Weights from ${model.weightsFrom}` : ""}
          {model.apiId ? ` · ${model.apiId}` : ""}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-paper-2 px-5 py-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="num mt-1 text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="text-lg font-medium">Which rate this is</h2>
        <p className="mt-2 text-sm font-medium text-ink">{model.priceLabel}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{model.notes}</p>
      </section>

      <section className="text-sm">
        <h2 className="text-lg font-medium">Sources</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <a href={model.sourceUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
              Price source
            </a>
          </li>
          {model.limitsSourceUrl ? (
            <li>
              <a href={model.limitsSourceUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                Limits source
              </a>
            </li>
          ) : null}
          {model.releaseSourceUrl ? (
            <li>
              <a href={model.releaseSourceUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                Release source
              </a>
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-muted">Updated {formatIsoDate(model.updatedAt)}.</p>
      </section>

      <section>
        <h2 className="text-lg font-medium">Related</h2>
        <p className="mt-3 text-sm">
          <Link href={providerPath} className="text-accent underline">
            All {model.provider} prices
          </Link>
        </p>
        {siblings.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {siblings.map((item) => (
              <li key={item.slug}>
                <Link href={`/models/${item.slug}`} className="text-accent underline">
                  {item.name}
                </Link>
                <span className="text-muted">
                  {" "}
                  · input {formatRate(item.inputUsdPerMillion)} · output {formatRate(item.outputUsdPerMillion)} · {item.priceLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No other {model.provider} models are in the ledger.</p>
        )}
        {pairs.length > 0 ? (
          <>
            <h3 className="mt-6 text-base font-medium">Same-tier comparisons</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {pairs.map((pair) => {
                const other = pair.a.slug === model.slug ? pair.b : pair.a;
                return (
                  <li key={pair.slug}>
                    <Link href={`/compare/${pair.slug}`} className="text-accent underline">
                      {model.name} vs {other.name}
                    </Link>
                    <span className="text-muted"> · {other.provider}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </section>

      <p>
        <Link
          href={`/calculator?model=${model.slug}`}
          className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-80"
        >
          Estimate a workload
        </Link>
      </p>
    </main>
  );
}
