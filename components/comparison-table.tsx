"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusLabel } from "@/components/status-label";
import type { Model } from "@/data/models";
import {
  formatIsoDate,
  formatModalities,
  formatRate,
  formatRelease,
  formatTokens,
  releaseSortValue,
} from "@/lib/format";
import { providerSlug } from "@/lib/models";

type SortKey =
  | "provider"
  | "name"
  | "input"
  | "cached"
  | "output"
  | "context"
  | "release"
  | "updated";

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Model" },
  { key: "provider", label: "Provider" },
  { key: "input", label: "Input" },
  { key: "cached", label: "Cached" },
  { key: "output", label: "Output" },
  { key: "context", label: "Context" },
  { key: "release", label: "Released" },
  { key: "updated", label: "Updated" },
];

function sortValue(model: Model, key: SortKey): string | number | null {
  switch (key) {
    case "provider":
      return model.provider;
    case "name":
      return model.name;
    case "input":
      return model.inputUsdPerMillion;
    case "cached":
      return model.cachedInputUsdPerMillion;
    case "output":
      return model.outputUsdPerMillion;
    case "context":
      return model.contextTokens;
    case "release":
      return releaseSortValue(model);
    case "updated":
      return model.updatedAt;
  }
}

export function ComparisonTable({ models }: { models: Model[] }) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [modality, setModality] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("input");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const providerOptions = useMemo(
    () => [...new Set(models.map((model) => model.provider))].sort(),
    [models],
  );
  const modalityOptions = useMemo(() => {
    const values = new Set<string>();
    for (const model of models) {
      for (const item of model.inputModalities ?? []) values.add(item);
    }
    return [...values].sort();
  }, [models]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = models.filter((model) => {
      if (provider !== "all" && model.provider !== provider) return false;
      if (
        modality !== "all" &&
        !(model.inputModalities ?? []).includes(modality)
      ) {
        return false;
      }
      if (!needle) return true;
      const haystack = [
        model.name,
        model.provider,
        model.apiId,
        model.weightsFrom,
        formatModalities(model),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    const sign = direction === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av === null && bv === null) return a.name.localeCompare(b.name);
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
      return String(av).localeCompare(String(bv)) * sign || a.name.localeCompare(b.name);
    });
  }, [models, query, provider, modality, sortKey, direction]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "name" || key === "provider" || key === "release" || key === "updated" ? "asc" : "asc");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <label htmlFor="model-search" className="sr-only">
            Search models
          </label>
          <input
            id="model-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, provider, or API id"
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="provider-filter" className="sr-only">
            Provider
          </label>
          <select
            id="provider-filter"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm sm:w-44"
          >
            <option value="all">All providers</option>
            {providerOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="modality-filter" className="sr-only">
            Input modality
          </label>
          <select
            id="modality-filter"
            value={modality}
            onChange={(event) => setModality(event.target.value)}
            className="h-11 w-full rounded-xl border border-line bg-paper-2 px-3 text-sm sm:w-44"
          >
            <option value="all">All input types</option>
            {modalityOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {rows.length} of {models.length} models. Prices are USD per 1M tokens. The small
          label under a price names which published rate it is.
        </p>
        <div className="flex items-center gap-2 md:hidden">
          <label htmlFor="sort-key" className="text-sm text-muted">
            Sort
          </label>
          <select
            id="sort-key"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="h-10 rounded-xl border border-line bg-paper-2 px-3 text-sm"
          >
            {columns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDirection((current) => (current === "asc" ? "desc" : "asc"))}
            className="h-10 rounded-xl border border-line px-3 text-sm transition-colors hover:bg-paper-2"
          >
            {direction === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-paper-2 px-4 py-12 text-center text-sm text-muted">
          No models match that search. Clear the filters or try a provider name.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-line bg-paper-2 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                AI model API list prices, context windows, and release dates
              </caption>
              <thead className="text-[13px] text-muted">
                <tr>
                  {columns.map((column) => {
                    const active = sortKey === column.key;
                    return (
                      <th key={column.key} scope="col" aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"} className="border-b border-line px-4 py-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                        >
                          {column.label}
                          <span aria-hidden="true">{active ? (direction === "asc" ? "↑" : "↓") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                  </tr>
              </thead>
              <tbody>
                {rows.map((model) => (
                  <tr key={model.slug} className="border-b border-line align-top transition-colors last:border-b-0 hover:bg-chip">
                    <th scope="row" className="px-4 py-4 font-medium">
                      <Link href={`/models/${model.slug}`} className="transition-colors hover:text-accent">
                        {model.name}
                      </Link>
                      <span className="mt-1 block text-xs font-normal text-muted">
                        <StatusLabel status={model.status} />
                        {model.weightsFrom ? ` · ${model.weightsFrom} weights` : ""}
                      </span>
                      <a
                        href={model.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs font-normal text-accent underline"
                      >
                        Source
                      </a>
                    </th>
                    <td className="px-4 py-4">
                      <Link
                        href={`/providers/${providerSlug(model.provider)}`}
                        className="transition-colors hover:text-accent"
                      >
                        {model.provider}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <PriceCell value={model.inputUsdPerMillion} label={model.priceLabel} />
                    </td>
                    <td className="px-4 py-4">
                      <PriceCell value={model.cachedInputUsdPerMillion} label={model.cachedInputUsdPerMillion === null ? "" : model.priceLabel} />
                    </td>
                    <td className="px-4 py-4">
                      <PriceCell value={model.outputUsdPerMillion} label={model.priceLabel} />
                    </td>
                    <td className="num px-4 py-4">{formatTokens(model.contextTokens)}</td>
                    <td className="px-4 py-4">{formatRelease(model)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatIsoDate(model.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((model) => (
              <li key={model.slug} className="rounded-2xl border border-line bg-paper-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/models/${model.slug}`} className="font-medium transition-colors hover:text-accent">
                      {model.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      <Link href={`/providers/${providerSlug(model.provider)}`} className="underline">
                        {model.provider}
                      </Link>
                      {model.weightsFrom ? ` · ${model.weightsFrom} weights` : ""} · <StatusLabel status={model.status} />
                    </p>
                  </div>
                  <a href={model.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline">
                    Source
                  </a>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Input</dt>
                    <dd className="num">{formatRate(model.inputUsdPerMillion)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Cached</dt>
                    <dd className="num">{formatRate(model.cachedInputUsdPerMillion)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Output</dt>
                    <dd className="num">{formatRate(model.outputUsdPerMillion)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-muted">{model.priceLabel}</p>
                <p className="mt-2 text-xs text-muted">
                  Context {formatTokens(model.contextTokens)} · Max out {formatTokens(model.maxOutputTokens)} · Released {formatRelease(model)}
                </p>
                <p className="mt-1 text-xs text-muted">Updated {formatIsoDate(model.updatedAt)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function PriceCell({ value, label }: { value: number | null; label: string }) {
  return (
    <div>
      <div className="num">{formatRate(value)}</div>
      {value !== null && label ? <div className="mt-0.5 text-[11px] leading-tight text-muted">{label}</div> : null}
    </div>
  );
}
