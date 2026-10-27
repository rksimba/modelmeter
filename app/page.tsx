import { ComparisonTable } from "@/components/comparison-table";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { SponsoredSlot } from "@/components/sponsored-slot";
import { DATASET_CHECKED_ON, models } from "@/data/models";
import { formatIsoDate } from "@/lib/format";
import { methodologyParagraphs, siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

export const ensureStatic = "navigation";

export default function HomePage() {
  const origin = getSiteUrl();
  const providerCount = new Set(models.map((model) => model.provider)).size;
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "ModelMeter AI API price dataset",
    description: methodologyParagraphs.join(" "),
    url: `${origin}/`,
    dateModified: DATASET_CHECKED_ON,
    creator: { "@type": "Organization", name: siteConfig.name },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${origin}/api/models.json`,
    },
    variableMeasured: ["input price per 1M tokens", "output price per 1M tokens", "context window"],
  };

  return (
    <main className="page">
      <JsonLd data={dataset} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">Checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl lg:text-7xl">
          API prices, from the source.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          Compare list prices, context windows, and release dates across {providerCount} providers
          and {models.length} models. Every row links to the official page the number came from.
          If that page does not publish a value, the cell says n/a.
        </p>
      </header>
      <SponsoredSlot placement="home-above-table" />
      <ComparisonTable models={models} />
      <section className="rounded-2xl border border-line bg-paper-2 p-6 sm:p-10">
        <h2 className="text-lg font-medium">Price-change notes</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          A short email when a tracked rate changes. The form is a stub: Resend is not connected,
          and this address is not stored.
        </p>
        <div className="mt-4 max-w-xl">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
