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
