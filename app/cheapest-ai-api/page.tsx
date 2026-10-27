import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { LedgerLinks } from "@/components/ledger-links";
import { RateList } from "@/components/rate-list";
import { DATASET_CHECKED_ON, models, type Model } from "@/data/models";
import { formatIsoDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, jsonLdGraph, modelItemListNode } from "@/lib/structured-data";

export const metadata = pageMetadata({
  title: "Cheapest AI API prices",
  description:
    "Cheapest AI API list prices in the ModelMeter ledger, ranked by published input and output rates per 1M tokens. Off-peak and introductory rates stay labelled.",
  path: "/cheapest-ai-api",
});

export const ensureStatic = "navigation";

function byRate(field: "inputUsdPerMillion" | "outputUsdPerMillion"): Model[] {
  return models
    .filter((model) => model[field] !== null)
    .sort((a, b) => {
      const delta = (a[field] ?? 0) - (b[field] ?? 0);
      if (delta !== 0) return delta;
      return a.name.localeCompare(b.name);
    });
}

export default function CheapestPage() {
  const byInput = byRate("inputUsdPerMillion");
  const byOutput = byRate("outputUsdPerMillion");
  const unpriced = models
    .filter((model) => model.inputUsdPerMillion === null || model.outputUsdPerMillion === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "Cheapest AI API prices", path: "/cheapest-ai-api" },
    ]),
    modelItemListNode(
      byInput.map((model) => ({ name: model.name, slug: model.slug })),
      "Lowest input rates",
    ),
  ]);

  return (
    <main className="page">
      <JsonLd data={structuredData} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">Last checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">Cheapest AI API prices</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Two rankings, both from the stored rate on each row. The first sorts by input price per
          1M tokens. The second sorts by output price per 1M tokens. The Rate column is the
          published label for that number: standard, introductory, off-peak, legacy, short-prompt,
          or another label copied from the source. Off-peak and introductory rates stay in the
          ranking and keep that label. They are not removed, and they are not replaced with a peak
          or post-introductory price from the note. Models with the same rate are listed
          alphabetically. A tie is the same published price. This is not a quality ranking.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Open a model for the note, which quotes other rates on the official page. Or start from
          the{" "}
          <Link href="/" className="text-accent underline">
            full comparison
          </Link>
          .
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Lowest input rates</h2>
        <RateList rows={byInput} caption="Models ranked by stored input price per 1M tokens" showRank />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Lowest output rates</h2>
        <RateList rows={byOutput} caption="Models ranked by stored output price per 1M tokens" showRank />
      </section>

      {unpriced.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">No published token rate</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            These rows have no published input rate or no published output rate, so they are not
            ranked. n/a is not zero and is not treated as free.
          </p>
          <RateList rows={unpriced} caption="Models with no published input or output rate" />
        </section>
      ) : null}

      <LedgerLinks current="/cheapest-ai-api" />
    </main>
  );
}
