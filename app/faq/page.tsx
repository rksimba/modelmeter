import type { Metadata } from "next";
import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { DATASET_CHECKED_ON } from "@/data/models";
import { pageFaqs } from "@/lib/faq";
import { formatIsoDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbNode, faqNode, jsonLdGraph } from "@/lib/structured-data";

const description =
  "How ModelMeter sources API prices, what n/a and the rate labels mean, which stored rates are cheapest, and how to follow price changes. Answers come from the current ledger.";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description,
  path: "/faq",
});

export const ensureStatic = "navigation";

export default function FaqPage() {
  const faqs = pageFaqs();
  const structuredData = jsonLdGraph([
    breadcrumbNode([
      { name: "Compare", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
    faqNode(faqs),
  ]);

  return (
    <main className="page page-narrow">
      <JsonLd data={structuredData} />
      <header className="pt-6 sm:pt-10">
        <h1 className="display text-5xl text-ink sm:text-6xl">FAQ</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Answers are generated from the ledger checked on {formatIsoDate(DATASET_CHECKED_ON)}.
        </p>
      </header>
      <FaqList items={faqs} />
    </main>
  );
}
