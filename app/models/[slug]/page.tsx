import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { models } from "@/data/models";
import {
  formatIsoDate,
  formatModalities,
  formatRate,
  formatRelease,
  formatTokens,
  statusLabel,
} from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

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
  const description = `${model.provider} ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens. Checked ${formatIsoDate(model.updatedAt)}.`;
  return {
    title: `${model.name} API price`,
    description,
    openGraph: { title: `${model.name} API price`, description },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = models.find((item) => item.slug === slug);
  if (!model) notFound();

  const origin = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${model.name} API list price`,
    dateModified: model.updatedAt,
    author: { "@type": "Organization", name: siteConfig.name },
    citation: model.sourceUrl,
    url: `${origin}/models/${model.slug}`,
    about: {
      "@type": "SoftwareApplication",
      name: model.name,
      applicationCategory: "DeveloperApplication",
      provider: { "@type": "Organization", name: model.provider },
      offers:
        model.inputUsdPerMillion === null
          ? undefined
          : {
              "@type": "Offer",
              priceCurrency: "USD",
              price: model.inputUsdPerMillion,
              description: `Provider list price per 1M input tokens (${model.priceLabel}). ModelMeter does not sell access.`,
              url: model.sourceUrl,
            },
    },
  };

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
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Compare
          </Link>
          <span aria-hidden="true"> / </span>
          {model.provider}
        </p>
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
