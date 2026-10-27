import { DATASET_CHECKED_ON, models } from "@/data/models";
import { comparisonPairs, sameTierRuleSentence } from "@/lib/comparisons";
import { formatModalities, formatRate, formatRelease, formatTokens, formatUsd, formatUsdExact } from "@/lib/format";
import { SAMPLE_WORKLOAD, estimateCost } from "@/lib/pricing";
import { indexablePaths } from "@/lib/routes";
import { absoluteUrl } from "@/lib/metadata";
import { methodologyParagraphs, siteConfig } from "@/lib/site";

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
  return [
    `# ${siteConfig.name}`,
    "",
    siteConfig.description,
    "",
    "## Methodology",
    ...methodologyParagraphs.map((paragraph) => paragraph),
    "",
    "## Pages",
    ...indexablePaths()
      .filter((entry) => !entry.path.startsWith("/models/"))
      .map((entry) => `- ${entry.title}: ${absoluteUrl(entry.path)} — ${entry.summary}`),
    "",
    "## Dataset",
    `Checked: ${DATASET_CHECKED_ON}`,
    `Models: ${models.length}`,
    `JSON: ${absoluteUrl("/api/models.json")}`,
    `Full text: ${absoluteUrl("/llms-full.txt")}`,
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
  const blocks = models.map((model) =>
    [
      `## ${model.provider} — ${model.name}`,
      rowLine(model),
      model.weightsFrom ? `Weights from: ${model.weightsFrom}` : null,
      model.limitsSourceUrl ? `Limits source: ${model.limitsSourceUrl}` : null,
      model.releaseSourceUrl ? `Release source: ${model.releaseSourceUrl}` : null,
      `Note: ${model.notes}`,
      `Page: ${absoluteUrl(`/models/${model.slug}`)}`,
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
    "## Pages",
    ...indexablePaths().map(
      (entry) => `- ${entry.title}: ${absoluteUrl(entry.path)} — ${entry.summary}`,
    ),
    "",
    "## Same-tier comparisons",
    sameTierRuleSentence(),
    `Sample workload: ${SAMPLE_WORKLOAD.inputTokens} input tokens, ${SAMPLE_WORKLOAD.outputTokens} output tokens, ${SAMPLE_WORKLOAD.requestsPerMonth} requests per month. Costs use the stored input and output rates only.`,
    ...comparisonPairs().map((pair) => {
      const costA = estimateCost(pair.a, SAMPLE_WORKLOAD);
      const costB = estimateCost(pair.b, SAMPLE_WORKLOAD);
      const costLine =
        costA && costB
          ? `${pair.a.name} ${formatUsdExact(costA.perRequest)} per request / ${formatUsd(costA.perMonth)} per month; ${pair.b.name} ${formatUsdExact(costB.perRequest)} per request / ${formatUsd(costB.perMonth)} per month.`
          : "Sample cost n/a.";
      return [
        `### ${pair.a.name} vs ${pair.b.name}`,
        absoluteUrl(`/compare/${pair.slug}`),
        `${pair.a.provider} ${pair.a.name}: input ${formatRate(pair.a.inputUsdPerMillion)}, output ${formatRate(pair.a.outputUsdPerMillion)} (${pair.a.priceLabel}). Source: ${pair.a.sourceUrl}`,
        `${pair.b.provider} ${pair.b.name}: input ${formatRate(pair.b.inputUsdPerMillion)}, output ${formatRate(pair.b.outputUsdPerMillion)} (${pair.b.priceLabel}). Source: ${pair.b.sourceUrl}`,
        costLine,
      ].join("\n");
    }),
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
