import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { DATASET_CHECKED_ON } from "@/data/models";
import { formatIsoDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { methodologyParagraphs } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "How ModelMeter collects API prices: official provider pages only, with a source link and updated date on every row.",
  path: "/about",
});

export const ensureStatic = "navigation";

export default function AboutPage() {
  return (
    <main className="page page-narrow">
      <header className="pt-6 sm:pt-10">
        <h1 className="display text-5xl text-ink sm:text-6xl">About</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          ModelMeter is a public ledger of AI model API list prices. The dataset was last checked
          on {formatIsoDate(DATASET_CHECKED_ON)}.
        </p>
      </header>
      <section className="space-y-4 text-base leading-7">
        <h2 className="text-lg font-medium">Methodology</h2>
        {methodologyParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          Update the files in <code className="num">data/models.ts</code> when a provider changes a
          rate, then run <code className="num">npm run verify-data</code>. The README describes the
          daily check.
        </p>
      </section>
      <section className="space-y-3 text-sm leading-6">
        <h2 className="text-lg font-medium">Contact</h2>
        <p>
          A public contact address is not published in this version. Sponsorship enquiries can wait
          on the <Link href="/sponsor" className="text-accent underline">sponsor page</Link>, which
          does not list packages or terms yet.
        </p>
      </section>
      <section className="rounded-2xl border border-line bg-paper-2 p-6 sm:p-8">
        <h2 className="text-lg font-medium">Price-change notes</h2>
        <p className="mt-2 text-sm text-muted">
          A short email when a tracked price changes or a model launches.
        </p>
        <div className="mt-4">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
