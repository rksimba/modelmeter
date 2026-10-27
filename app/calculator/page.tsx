import type { Metadata } from "next";
import { Suspense } from "react";
import { CalculatorForm } from "@/components/calculator-form";
import { models } from "@/data/models";

export const metadata: Metadata = {
  title: "Cost calculator",
  description:
    "Estimate monthly API spend from published input and output rates. Compare a workload across three other models.",
};

export const ensureStatic = "navigation";

export default function CalculatorPage() {
  return (
    <main className="page">
      <header className="max-w-3xl pt-6 sm:pt-10">
        <h1 className="display text-5xl text-ink sm:text-6xl">Cost calculator</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Enter tokens per request and how often you call the model. The estimate uses the rate
          stored on that row and ignores cache hits, batch discounts, and long-context surcharges.
          Those are described on the model page.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted">Loading the calculator…</p>}>
        <CalculatorForm models={models} />
      </Suspense>
    </main>
  );
}
