import { JsonLd } from "@/components/json-ld";
import { LedgerLinks } from "@/components/ledger-links";
import { RateList } from "@/components/rate-list";
import { DATASET_CHECKED_ON, models } from "@/data/models";
import { formatIsoDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, jsonLdGraph, modelItemListNode } from "@/lib/structured-data";

export const metadata = pageMetadata({
  title: "AI models",
  description:
    "Every AI model in the ModelMeter ledger, with the stored list price, rate label, and a link to the official source page.",
  path: "/models",
});

export const ensureStatic = "navigation";

export default function ModelsIndexPage() {
  const rows = [...models].sort((a, b) => {
    const byProvider = a.provider.localeCompare(b.provider);
    if (byProvider !== 0) return byProvider;
    return a.name.localeCompare(b.name);
  });
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "AI models", path: "/models" },
    ]),
    modelItemListNode(
      rows.map((model) => ({ name: model.name, slug: model.slug })),
      "Models",
    ),
  ]);

  return (
    <main className="page">
      <JsonLd data={structuredData} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">Last checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">AI models</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          {rows.length} models in the ledger, listed by the company that bills the API and then
          by name. Each price is the rate named on that row, copied from the official page linked
          on the model page. Open a model for the note, the source link, and the date that page
          was checked.
        </p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Models</h2>
        <RateList rows={rows} caption="Every model in the ModelMeter ledger" />
      </section>
      <LedgerLinks current="/models" />
    </main>
  );
}
