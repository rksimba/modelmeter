import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { LedgerLinks } from "@/components/ledger-links";
import { RateList } from "@/components/rate-list";
import { DATASET_CHECKED_ON, models } from "@/data/models";
import { formatIsoDate, formatTokens } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, jsonLdGraph, modelItemListNode } from "@/lib/structured-data";

export const metadata = pageMetadata({
  title: "Largest context window AI models",
  description:
    "AI models in the ModelMeter ledger with the largest published context windows, with the stored rate label beside each price.",
  path: "/largest-context-window-ai-models",
});

export const ensureStatic = "navigation";

export default function LargestContextPage() {
  const ranked = models
    .filter((model) => model.contextTokens !== null)
    .sort((a, b) => {
      const delta = (b.contextTokens ?? 0) - (a.contextTokens ?? 0);
      if (delta !== 0) return delta;
      return a.name.localeCompare(b.name);
    });
  const missing = models
    .filter((model) => model.contextTokens === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const largest = ranked[0]?.contextTokens ?? null;
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "Largest context window AI models", path: "/largest-context-window-ai-models" },
    ]),
    modelItemListNode(
      ranked.map((model) => ({ name: model.name, slug: model.slug })),
      "Published context windows",
    ),
  ]);

  return (
    <main className="page">
      <JsonLd data={structuredData} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">Last checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">Largest context window AI models</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Sorted by the context window published for each model in this ledger.
          {largest !== null
            ? ` The largest published window on the check date is ${formatTokens(largest)} tokens.`
            : ""}{" "}
          A missing window is n/a and is not treated as zero. A larger window is not a quality
          ranking. Prices beside the window are the stored rate, and the Rate column keeps
          off-peak, introductory, legacy, and short-prompt labels visible. Max output is a
          separate published figure when the source lists one.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Model pages link to the limits source when it is a different page from the price source.
          The{" "}
          <Link href="/" className="text-accent underline">
            full comparison
          </Link>{" "}
          can sort the same column.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Published context windows</h2>
        <RateList
          rows={ranked}
          caption="Models ranked by published context window"
          showRank
        />
      </section>

      {missing.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">No published context window</h2>
          <RateList rows={missing} caption="Models with no published context window" />
        </section>
      ) : null}

      <LedgerLinks current="/largest-context-window-ai-models" />
    </main>
  );
}
