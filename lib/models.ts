import { models, type Model } from "@/data/models";

export function getModel(slug: string): Model | undefined {
  return models.find((model) => model.slug === slug);
}

export function providers(): string[] {
  return [...new Set(models.map((model) => model.provider))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function pricedModels(): Model[] {
  return models.filter(
    (model) => model.inputUsdPerMillion !== null && model.outputUsdPerMillion !== null,
  );
}

/** Stable URL segment for a provider name. */
export function providerSlug(provider: string): string {
  return provider
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function providerFromSlug(slug: string): string | undefined {
  return providers().find((provider) => providerSlug(provider) === slug);
}

export function modelsByProvider(provider: string): Model[] {
  return models.filter((model) => model.provider === provider);
}

/** Latest `updatedAt` among the rows, or the ledger date when the list is empty. */
export function latestUpdate(rows: readonly Model[]): string {
  return rows.reduce(
    (latest, model) => (model.updatedAt > latest ? model.updatedAt : latest),
    rows[0]?.updatedAt ?? "",
  );
}
