import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { StatusLabel } from "@/components/status-label";
import { LedgerLinks } from "@/components/ledger-links";
import { comparisonByReversedSlug, comparisonBySlug, comparisonPairs, sameTierRuleSentence } from "@/lib/comparisons";
import {
  formatIsoDate,
  formatModalities,
  formatRate,
  formatRelease,
  formatTokens,
  formatUsd,
  formatUsdExact,
} from "@/lib/format";
import { providerSlug } from "@/lib/models";
import { pageMetadata } from "@/lib/metadata";
import { CALCULATOR_DEFAULTS, DAYS_PER_MONTH, SAMPLE_WORKLOAD, estimateCost } from "@/lib/pricing";
import { breadcrumbNode, jsonLdGraph } from "@/lib/structured-data";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return comparisonPairs().map((pair) => ({ pair: pair.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair: slug } = await params;
  const pair = comparisonBySlug(slug);
  if (!pair) return { title: "Comparison" };
  const description = `${pair.a.provider} ${pair.a.name} vs ${pair.b.provider} ${pair.b.name}: input ${formatRate(pair.a.inputUsdPerMillion)} (${pair.a.priceLabel}) vs ${formatRate(pair.b.inputUsdPerMillion)} (${pair.b.priceLabel}), output ${formatRate(pair.a.outputUsdPerMillion)} vs ${formatRate(pair.b.outputUsdPerMillion)}. Sample workload priced from the ledger.`;
  return pageMetadata({
    title: `${pair.a.name} vs ${pair.b.name}`,
    description,
    path: `/compare/${pair.slug}`,
  });
}

export default async function ComparePairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair: slug } = await params;
  const pair = comparisonBySlug(slug);
  if (!pair) {
    const reversed = comparisonByReversedSlug(slug);
    if (reversed) permanentRedirect(`/compare/${reversed.slug}`);
    notFound();
  }

  const costA = estimateCost(pair.a, SAMPLE_WORKLOAD);
  const costB = estimateCost(pair.b, SAMPLE_WORKLOAD);
  if (!costA || !costB) notFound();

  const checked = pair.a.updatedAt > pair.b.updatedAt ? pair.a.updatedAt : pair.b.updatedAt;
  const monthlyDelta = costA.perMonth - costB.perMonth;
  const cheaper = monthlyDelta < 0 ? pair.a : monthlyDelta > 0 ? pair.b : null;
  const dearer = cheaper === pair.a ? pair.b : pair.a;
  const heading = `${pair.a.name} vs ${pair.b.name}`;
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "Comparisons", path: "/compare" },
      { name: heading, path: `/compare/${pair.slug}` },
    ]),
  ]);

  const rows: { label: string; a: string; b: string }[] = [
    ["Input / 1M", formatRate(pair.a.inputUsdPerMillion), formatRate(pair.b.inputUsdPerMillion)],
    ["Cached input / 1M", formatRate(pair.a.cachedInputUsdPerMillion), formatRate(pair.b.cachedInputUsdPerMillion)],
    ["Output / 1M", formatRate(pair.a.outputUsdPerMillion), formatRate(pair.b.outputUsdPerMillion)],
    ["Rate", pair.a.priceLabel, pair.b.priceLabel],
    ["Context", formatTokens(pair.a.contextTokens), formatTokens(pair.b.contextTokens)],
    ["Max output", formatTokens(pair.a.maxOutputTokens), formatTokens(pair.b.maxOutputTokens)],
    ["Status", "", ""],
    ["Modalities", formatModalities(pair.a), formatModalities(pair.b)],
    ["Released", formatRelease(pair.a), formatRelease(pair.b)],
    ["Checked", formatIsoDate(pair.a.updatedAt), formatIsoDate(pair.b.updatedAt)],
    ["Per request", formatUsdExact(costA.perRequest), formatUsdExact(costB.perRequest)],
    ["Per month", formatUsd(costA.perMonth), formatUsd(costB.perMonth)],
  ].map(([label, a, b]) => ({ label, a, b }));

  return (
    <main className="page">
      <JsonLd data={structuredData} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">
          <Link href="/compare" className="hover:text-ink">
            Comparisons
          </Link>
        </p>
        <p className="mt-4 text-sm text-muted">
          Last checked {formatIsoDate(checked)}
          {pair.a.updatedAt === pair.b.updatedAt
            ? ""
            : `. ${pair.a.name} was checked ${formatIsoDate(pair.a.updatedAt)}. ${pair.b.name} was checked ${formatIsoDate(pair.b.updatedAt)}.`}
        </p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">{heading}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          {pair.a.name} is billed by {pair.a.provider}. {pair.b.name} is billed by {pair.b.provider}.{" "}
          {sameTierRuleSentence()} The figures below are the rates stored on those two rows, the
          differences between them, and the cost of one sample workload. This page does not score
          quality.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-medium">Stored rates</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          <Link href={`/models/${pair.a.slug}`} className="text-accent underline">
            {pair.a.name}
          </Link>{" "}
          ({pair.a.provider}, {pair.a.priceLabel}) and{" "}
          <Link href={`/models/${pair.b.slug}`} className="text-accent underline">
            {pair.b.name}
          </Link>{" "}
          ({pair.b.provider}, {pair.b.priceLabel}). Provider pages:{" "}
          <Link href={`/providers/${providerSlug(pair.a.provider)}`} className="text-accent underline">
            {pair.a.provider}
          </Link>{" "}
          and{" "}
          <Link href={`/providers/${providerSlug(pair.b.provider)}`} className="text-accent underline">
            {pair.b.provider}
          </Link>
          .
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper-2">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              {pair.a.name} and {pair.b.name} list prices and limits
            </caption>
            <thead className="text-[13px] text-muted">
              <tr>
                <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                  Field
                </th>
                <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                  {pair.a.name}
                </th>
                <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                  {pair.b.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-line align-top last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-medium text-muted">
                    {row.label}
                  </th>
                  <td className="px-4 py-3">
                    {row.label === "Status" ? <StatusLabel status={pair.a.status} /> : row.a}
                  </td>
                  <td className="px-4 py-3">
                    {row.label === "Status" ? <StatusLabel status={pair.b.status} /> : row.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Sample workload</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          The sample is the calculator&apos;s starting workload: {SAMPLE_WORKLOAD.inputTokens.toLocaleString("en-US")}{" "}
          input tokens and {SAMPLE_WORKLOAD.outputTokens.toLocaleString("en-US")} output tokens per
          request, {CALCULATOR_DEFAULTS.requestsPerDay.toLocaleString("en-US")} requests a day. A month in the calculator is {DAYS_PER_MONTH} days, so that is{" "}
          {SAMPLE_WORKLOAD.requestsPerMonth.toLocaleString("en-US")} requests. The cost uses the
          stored input and output rates only. Cache hits, batch discounts, long-context
          surcharges, peak hours, and prices scheduled after an introductory window are not
          included. The rate label and the notes below name those other published rates.
        </p>
        <p className="mt-4 text-sm leading-6">
          {pair.a.name} is {formatUsdExact(costA.perRequest)} per request and {formatUsd(costA.perMonth)} per
          month ({formatUsd(costA.inputPerMonth)} input and {formatUsd(costA.outputPerMonth)} output
          over the month). {pair.b.name} is {formatUsdExact(costB.perRequest)} per request and{" "}
          {formatUsd(costB.perMonth)} per month ({formatUsd(costB.inputPerMonth)} input and{" "}
          {formatUsd(costB.outputPerMonth)} output over the month).
        </p>
        <p className="mt-3 text-sm leading-6">
          {cheaper
            ? `${cheaper.name} costs ${formatUsd(Math.abs(monthlyDelta))} less per month than ${dearer.name} on this sample, using the stored rates above.`
            : "On this sample the two stored rates cost the same amount."}
        </p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href={`/calculator?model=${pair.a.slug}`} className="text-accent underline">
            Open {pair.a.name} in the calculator
          </Link>
          <Link href={`/calculator?model=${pair.b.slug}`} className="text-accent underline">
            Open {pair.b.name} in the calculator
          </Link>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium">Notes from the sources</h2>
        <h3 className="mt-4 text-base font-medium">{pair.a.name}</h3>
        <p className="mt-2 text-sm font-medium">{pair.a.priceLabel}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{pair.a.notes}</p>
        <h3 className="mt-6 text-base font-medium">{pair.b.name}</h3>
        <p className="mt-2 text-sm font-medium">{pair.b.priceLabel}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{pair.b.notes}</p>
      </section>

      <section className="text-sm">
        <h2 className="text-lg font-medium">Sources</h2>
        <ul className="mt-3 space-y-2">
          {[pair.a, pair.b].map((model) => (
            <li key={model.slug}>
              <a href={model.sourceUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                {model.provider} price source for {model.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <LedgerLinks current={`/compare/${pair.slug}`} />
    </main>
  );
}
