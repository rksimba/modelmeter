import Link from "next/link";
import { ComparisonTable } from "@/components/comparison-table";
import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { SponsoredSlot } from "@/components/sponsored-slot";
import { DATASET_CHECKED_ON, models } from "@/data/models";
import { homeFaqs } from "@/lib/faq";
import { formatIsoDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { datasetNode, faqNode, jsonLdGraph, organizationNode, websiteNode } from "@/lib/structured-data";

export const metadata = pageMetadata({
  title: "ModelMeter — AI API prices",
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

export const ensureStatic = "navigation";

export default function HomePage() {
  const providerCount = new Set(models.map((model) => model.provider)).size;
  const faqs = homeFaqs();
  const structuredData = jsonLdGraph([
    organizationNode(),
    websiteNode(),
    datasetNode(),
    faqNode(faqs),
  ]);

  return (
    <main className="page">
      <JsonLd data={structuredData} />
      <header className="max-w-3xl pt-6 sm:pt-10">
        <p className="text-sm text-muted">Last checked {formatIsoDate(DATASET_CHECKED_ON)}</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl lg:text-7xl">
          API prices, from the source.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          Compare list prices, context windows, and release dates across {providerCount} providers
          and {models.length} models. Every row links to the official page the number came from.
          If that page does not publish a value, the cell says n/a.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          <Link href="/cheapest-ai-api" className="text-accent underline">
            Cheapest stored rates
          </Link>
          {", "}
          <Link href="/largest-context-window-ai-models" className="text-accent underline">
            largest published context windows
          </Link>
          {", "}
          <Link href="/providers" className="text-accent underline">
            prices by provider
          </Link>
          {", and "}
          <Link href="/compare" className="text-accent underline">
            same-tier comparisons
          </Link>{" "}
          are generated from this ledger.
        </p>
      </header>
      <SponsoredSlot placement="home-above-table" />
      <section aria-labelledby="price-table-heading" className="flex flex-col gap-4">
        <h2 id="price-table-heading" className="text-lg font-medium">
          List prices
        </h2>
        <ComparisonTable models={models} />
      </section>
      <FaqList items={faqs} />
      <section className="rounded-2xl border border-line bg-paper-2 p-6 sm:p-10">
        <h2 className="text-lg font-medium">Price-change notes</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          A short email when a tracked price changes or a model launches.
        </p>
        <div className="mt-4 max-w-xl">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
