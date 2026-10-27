import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor",
  description: "Sponsorship information for ModelMeter is coming soon.",
};

export const ensureStatic = "navigation";

export default function SponsorPage() {
  return (
    <main className="page page-narrow">
      <header className="pt-6 sm:pt-10">
        <h1 className="display text-5xl text-ink sm:text-6xl">Sponsor</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Sponsorship information is coming soon. This page will explain how a labelled placement
          works. It does not list prices, packages, or terms.
        </p>
      </header>
    </main>
  );
}
