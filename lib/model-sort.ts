import type { Model } from "@/data/models";
import { releaseSortValue } from "@/lib/format";

/** Sort keys on the home comparison table. /index.md uses the default: input, ascending. */
export type LedgerSortKey =
  | "provider"
  | "name"
  | "input"
  | "cached"
  | "output"
  | "context"
  | "release"
  | "updated";

function sortValue(model: Model, key: LedgerSortKey): string | number | null {
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

/**
 * Same ordering as the home table. Missing values sort last in either
 * direction. Equal numbers keep ledger order (the caller sorts a copy).
 * Equal text falls back to the model name.
 */
export function compareLedgerModels(
  a: Model,
  b: Model,
  key: LedgerSortKey,
  direction: "asc" | "desc",
): number {
  const av = sortValue(a, key);
  const bv = sortValue(b, key);
  if (av === null && bv === null) return a.name.localeCompare(b.name);
  if (av === null) return 1;
  if (bv === null) return -1;
  const sign = direction === "asc" ? 1 : -1;
  if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
  return String(av).localeCompare(String(bv)) * sign || a.name.localeCompare(b.name);
}

/** Home page default: input price ascending, unpublished input rates last. */
export function modelsInHomeTableOrder(rows: readonly Model[]): Model[] {
  return [...rows].sort((a, b) => compareLedgerModels(a, b, "input", "asc"));
}
