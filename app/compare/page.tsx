import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { LedgerLinks } from "@/components/ledger-links";
import { DATASET_CHECKED_ON } from "@/data/models";
import { comparisonPairs, sameTierRuleSentence } from "@/lib/comparisons";
import { formatIsoDate, formatRate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, jsonLdGraph } from "@/lib/structured-data";

export const metadata = pageMetadata({
  title: "Compare AI API prices",
  description:
    "Same-tier AI API price comparisons across providers. Pairs are chosen from published input and output rates in the ModelMeter ledger.",
  path: "/compare",
});

export const ensureStatic = "navigation";

export default function CompareIndexPage() {
  const pairs = comparisonPairs();
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "Compare AI API prices", path: "/compare" },
    ]),
  ]);
  return (
    <main className="page page-narrow">
      <JsonLd data={structuredData} />
      <header className="pt-6 sm:pt-10">
        <p className="text-sm text-muted">Last checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">Compare AI API prices</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          These {pairs.length} pairs are built from the ledger. {sameTierRuleSentence()} This is a
          price comparison of the stored rates. It is not a benchmark and not a recommendation.
        </p>
      </header>
      <section>
        <h2 className="text-lg font-medium">Pairs</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {pairs.map((pair) => (
            <li key={pair.slug} className="py-4">
              <Link href={`/compare/${pair.slug}`} className="font-medium transition-colors hover:text-accent">
                {pair.a.name} vs {pair.b.name}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {pair.a.provider} {formatRate(pair.a.inputUsdPerMillion)} in / {formatRate(pair.a.outputUsdPerMillion)} out
                {" · "}
                {pair.a.priceLabel}
              </p>
              <p className="text-sm text-muted">
                {pair.b.provider} {formatRate(pair.b.inputUsdPerMillion)} in / {formatRate(pair.b.outputUsdPerMillion)} out
                {" · "}
                {pair.b.priceLabel}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <LedgerLinks current="/compare" />
    </main>
  );
}
