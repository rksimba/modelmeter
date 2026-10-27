"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Model } from "@/data/models";
import { formatRate, formatUsd } from "@/lib/format";
import { CALCULATOR_DEFAULTS, DAYS_PER_MONTH, estimateCost, modelIsPriced } from "@/lib/pricing";

const FALLBACK_SLUG = "claude-sonnet-5-5";
const COMPARE_ORDER = [
  "gpt-6-1-sol",
  "claude-sonnet-5-5",
  "gemini-3-8-flash",
  "grok-4-7",
  "deepseek-v4-pro",
  "mistral-large-4",
];

export function CalculatorForm({ models }: { models: Model[] }) {
  const priced = useMemo(() => models.filter(modelIsPriced), [models]);
  const requestedSlug = useSearchParams().get("model") ?? "";
  const slugFromUrl = models.some((model) => model.slug === requestedSlug) ? requestedSlug : "";
  const [override, setOverride] = useState<{ slug: string; forRequest: string } | null>(null);
  const slug =
    override && override.forRequest === requestedSlug
      ? override.slug
      : slugFromUrl || FALLBACK_SLUG;
  const [compareOverride, setCompareOverride] = useState<{ slug: string; items: string[] } | null>(
    null,
  );
  const compareSlugs =
    compareOverride && compareOverride.slug === slug
      ? compareOverride.items
      : defaultComparisons(slug, priced);
  const [inputTokens, setInputTokens] = useState<number>(CALCULATOR_DEFAULTS.inputTokens);
  const [outputTokens, setOutputTokens] = useState<number>(CALCULATOR_DEFAULTS.outputTokens);
  const [requests, setRequests] = useState<number>(CALCULATOR_DEFAULTS.requestsPerDay);
  const [period, setPeriod] = useState<"day" | "month">("day");

  const selected = models.find((model) => model.slug === slug) ?? priced[0];
  const requestsPerMonth = period === "month" ? requests : requests * DAYS_PER_MONTH;
  const workload = {
    inputTokens: clamp(inputTokens),
    outputTokens: clamp(outputTokens),
    requestsPerMonth: clamp(requestsPerMonth),
  };
  const cost = selected ? estimateCost(selected, workload) : null;

  const comparisons = useMemo(
    () =>
      compareSlugs
        .map((item) => models.find((model) => model.slug === item))
        .filter((model): model is Model => Boolean(model)),
    [compareSlugs, models],
  );

  function chooseModel(next: string) {
    setOverride({ slug: next, forRequest: requestedSlug });
    setCompareOverride(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
      <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Model" htmlFor="calc-model">
          <select
            id="calc-model"
            value={selected?.slug ?? ""}
            onChange={(event) => chooseModel(event.target.value)}
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm outline-none transition-colors focus:border-accent"
          >
            {models.map((model) => (
              <option key={model.slug} value={model.slug} disabled={!modelIsPriced(model)}>
                {model.provider} — {model.name}
                {modelIsPriced(model) ? "" : " (price n/a)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Input tokens per request" htmlFor="calc-input">
          <input
            id="calc-input"
            type="number"
            min={0}
            inputMode="numeric"
            value={inputTokens}
            onChange={(event) => setInputTokens(Number(event.target.value))}
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </Field>
        <Field label="Output tokens per request" htmlFor="calc-output">
          <input
            id="calc-output"
            type="number"
            min={0}
            inputMode="numeric"
            value={outputTokens}
            onChange={(event) => setOutputTokens(Number(event.target.value))}
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Requests</legend>
          <div className="mb-2 flex gap-2">
            {(["day", "month"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                aria-pressed={period === item}
                className={`h-9 rounded-full px-3.5 text-sm transition-colors ${period === item ? "bg-ink text-paper" : "border border-line hover:bg-paper-2"}`}
              >
                Per {item}
              </button>
            ))}
          </div>
          <input
            aria-label={`Requests per ${period}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={requests}
            onChange={(event) => setRequests(Number(event.target.value))}
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm outline-none transition-colors focus:border-accent"
          />
          <p className="mt-2 text-xs text-muted">A month is {DAYS_PER_MONTH} days.</p>
        </fieldset>
      </form>

      <div className="flex flex-col gap-6">
        {!selected || !cost ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper-2 px-5 py-10 text-sm text-muted">
            {selected?.name ?? "This model"} has no published input and output rate, so it cannot be costed. Pick a model with a price.
          </p>
        ) : (
          <>
            <section className="rounded-2xl border border-line bg-paper-2 p-6 sm:p-8">
              <p className="text-sm text-muted">
                {selected.provider} · {selected.name}
              </p>
              <p className="display mt-2 text-4xl tracking-tight sm:text-5xl">
                {formatUsd(cost.perMonth)}
                <span className="ml-2 font-sans text-base text-muted">/ month</span>
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted">Per request</dt>
                  <dd className="num">{formatUsd(cost.perRequest)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Per day</dt>
                  <dd className="num">{formatUsd(cost.perMonth / DAYS_PER_MONTH)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Requests / month</dt>
                  <dd className="num">{workload.requestsPerMonth.toLocaleString("en-US")}</dd>
                </div>
              </dl>
              <SplitBar input={cost.inputPerMonth} output={cost.outputPerMonth} />
              <p className="mt-4 text-sm text-muted">
                Uses {formatRate(selected.inputUsdPerMillion)} input and {formatRate(selected.outputUsdPerMillion)} output ({selected.priceLabel}). Cached tokens are not applied.{" "}
                <Link href={`/models/${selected.slug}`} className="text-accent underline">
                  Rate details
                </Link>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">Same workload, other models</h2>
              <div className="mt-3 grid gap-3">
                {comparisons.map((model, index) => {
                  const other = estimateCost(model, workload);
                  const delta = other && cost ? other.perMonth - cost.perMonth : null;
                  return (
                    <div key={model.slug} className="rounded-2xl border border-line bg-paper-2 p-5">
                      <label className="text-xs text-muted" htmlFor={`compare-${index}`}>
                        Comparison {index + 1}
                      </label>
                      <select
                        id={`compare-${index}`}
                        value={model.slug}
                        onChange={(event) => {
                          const next = event.target.value;
                          setCompareOverride({
                            slug,
                            items: compareSlugs.map((item, itemIndex) => (itemIndex === index ? next : item)),
                          });
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none transition-colors focus:border-accent"
                      >
                        {priced
                          .filter((option) => option.slug === model.slug || (option.slug !== slug && !compareSlugs.includes(option.slug)))
                          .map((option) => (
                            <option key={option.slug} value={option.slug}>
                              {option.provider} — {option.name}
                            </option>
                          ))}
                      </select>
                      {other && delta !== null ? (
                        <p className="mt-3 text-sm">
                          <span className="num text-base">{formatUsd(other.perMonth)}</span>
                          <span className="text-muted"> / month · </span>
                          <span className="text-ink">
                            {delta === 0
                              ? "same monthly cost"
                              : `${formatUsd(Math.abs(delta))} ${delta > 0 ? "more" : "less"} than ${selected.name}`}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-muted">Price n/a</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SplitBar({ input, output }: { input: number; output: number }) {
  const total = input + output;
  const inputShare = total > 0 ? (input / total) * 100 : 0;
  return (
    <div className="mt-4">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="bg-accent" style={{ width: `${inputShare}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Input {formatUsd(input)} · Output {formatUsd(output)} this month
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function clamp(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function defaultComparisons(selected: string, priced: Model[]): string[] {
  return COMPARE_ORDER.filter((slug) => slug !== selected && priced.some((model) => model.slug === slug)).slice(0, 3);
}
