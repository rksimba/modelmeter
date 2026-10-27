import { DATASET_CHECKED_ON, models } from "@/data/models";
import { formatModalities, formatRate, formatRelease, formatTokens } from "@/lib/format";
import { methodologyParagraphs, siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

function rowLine(model: (typeof models)[number]): string {
  const cached =
    model.cachedInputUsdPerMillion === null
      ? "cached n/a"
      : `cached ${formatRate(model.cachedInputUsdPerMillion)}`;
  return [
    `${model.provider} — ${model.name} (${model.apiId ?? "api id n/a"})`,
    `input ${formatRate(model.inputUsdPerMillion)} / ${cached} / output ${formatRate(model.outputUsdPerMillion)} per 1M tokens`,
    `rate: ${model.priceLabel}`,
    `context ${formatTokens(model.contextTokens)}, max output ${formatTokens(model.maxOutputTokens)}`,
    `modalities ${formatModalities(model)}`,
    `released ${formatRelease(model)}`,
    `status ${model.status}`,
    `checked ${model.updatedAt}`,
    `source ${model.sourceUrl}`,
  ].join(" | ");
}

export function llmsTxt(): string {
  const origin = getSiteUrl();
  return [
    `# ${siteConfig.name}`,
    "",
    siteConfig.description,
    "",
    "## Methodology",
    ...methodologyParagraphs.map((paragraph) => paragraph),
    "",
    "## Dataset",
    `Checked: ${DATASET_CHECKED_ON}`,
    `Models: ${models.length}`,
    `JSON: ${origin}/api/models.json`,
    `Full text: ${origin}/llms-full.txt`,
    `Comparison: ${origin}/`,
    `Calculator: ${origin}/calculator`,
    `Releases: ${origin}/releases`,
    "",
    "## Models",
    ...models.map(
      (model) =>
        `- ${model.provider} — ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, cached ${formatRate(model.cachedInputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}). Source: ${model.sourceUrl}`,
    ),
    "",
    "ModelMeter does not sell API access. Sponsored placements and affiliate links are switched off.",
    "",
  ].join("\n");
}

export function llmsFullTxt(): string {
  const origin = getSiteUrl();
  const blocks = models.map((model) =>
    [
      `## ${model.provider} — ${model.name}`,
      rowLine(model),
      model.weightsFrom ? `Weights from: ${model.weightsFrom}` : null,
      model.limitsSourceUrl ? `Limits source: ${model.limitsSourceUrl}` : null,
      model.releaseSourceUrl ? `Release source: ${model.releaseSourceUrl}` : null,
      `Note: ${model.notes}`,
      `Page: ${origin}/models/${model.slug}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `# ${siteConfig.name} full dataset`,
    `Checked: ${DATASET_CHECKED_ON}`,
    "",
    ...methodologyParagraphs,
    "",
    "Rates are USD per 1 million tokens. n/a means the official page did not publish that value.",
    "",
    ...blocks,
    "",
  ].join("\n");
}

export function publicDataset() {
  return {
    name: siteConfig.name,
    description: siteConfig.description,
    checkedOn: DATASET_CHECKED_ON,
    currency: "USD",
    unit: "per 1M tokens",
    methodology: methodologyParagraphs,
    models,
  };
}
