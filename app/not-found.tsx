import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Page not found · ModelMeter" },
  description: "That path is not in the ModelMeter ledger.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="page page-narrow">
      <h1 className="display pt-6 text-5xl text-ink sm:pt-10 sm:text-6xl">That page is not on the ledger.</h1>
      <p className="text-muted">The model slug or path does not match anything in this dataset.</p>
      <Link href="/" className="text-accent underline">
        Back to the comparison
      </Link>
    </main>
  );
}
