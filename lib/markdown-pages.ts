import { DATASET_CHECKED_ON, models, type Model } from "@/data/models";
import { comparisonBySlug, comparisonPairs, sameTierRuleSentence } from "@/lib/comparisons";
import { pageFaqs } from "@/lib/faq";
import {
  formatIsoDate,
  formatModalities,
  formatMonth,
  formatRate,
  formatTokens,
  formatUsd,
  formatUsdExact,
  releaseSortValue,
  statusLabel,
} from "@/lib/format";
import { modelMarkdownPath, providerMarkdownPath } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/metadata";
import { modelsByProvider, providerSlug, providers } from "@/lib/models";
import { modelsInHomeTableOrder } from "@/lib/model-sort";
import { priceChangesPlainText } from "@/lib/price-changes";
import { CALCULATOR_DEFAULTS, DAYS_PER_MONTH, SAMPLE_WORKLOAD, estimateCost } from "@/lib/pricing";
import { methodologyParagraphs } from "@/lib/site";

function mdCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function mdTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.map(mdCell).join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`);
  return [head, rule, ...body].join("\n");
}

function releaseField(model: Model): string {
  if (model.releaseDate) return model.releaseDate;
  if (model.releaseMonth) return model.releaseMonth;
  return "n/a";
}

function checkedLine(): string {
  return `Checked: ${DATASET_CHECKED_ON}`;
}

function canonicalLine(path: string): string {
  return `Canonical page: ${absoluteUrl(path)}`;
}

const PRICE_HEADERS = [
  "Provider",
  "Model",
  "Input per 1M",
  "Cached input per 1M",
  "Output per 1M",
  "Rate label",
  "Context",
  "Max output",
  "Status",
  "Release date",
  "Source",
];

function priceCells(model: Model, release: boolean): string[] {
  const cells = [
    model.provider,
    model.name,
    formatRate(model.inputUsdPerMillion),
    formatRate(model.cachedInputUsdPerMillion),
    formatRate(model.outputUsdPerMillion),
    model.priceLabel,
    formatTokens(model.contextTokens),
    formatTokens(model.maxOutputTokens),
    statusLabel(model.status),
  ];
  if (release) cells.push(releaseField(model));
  cells.push(model.sourceUrl);
  return cells;
}

export function indexMarkdownDocument(): string {
  const providerCount = new Set(models.map((model) => model.provider)).size;
  const rows = modelsInHomeTableOrder(models);
  const lines = [
    "# AI API price comparison",
    "",
    checkedLine(),
    "",
    `Compare list prices, context windows, and release dates across ${providerCount} providers and ${models.length} models. Every row links to the official page the number came from. If that page does not publish a value, the cell says n/a.`,
    "",
    "Prices are USD per 1 million tokens. The table is sorted by input price, lowest first, with models that have no published input rate last. That is the home page's default sort. Context and max output use the same compact token counts as the home table.",
    "",
    "## Methodology",
    "",
    ...methodologyParagraphs.flatMap((paragraph) => [paragraph, ""]),
    "## List prices",
    "",
    mdTable(
      PRICE_HEADERS,
      rows.map((model) => priceCells(model, true)),
    ),
    "",
    canonicalLine("/"),
    "",
    `Dataset: ${absoluteUrl("/api/models.json")}`,
    "",
  ];
  return lines.join("\n");
}

export function modelsIndexMarkdownDocument(): string {
  const rows = [...models].sort((a, b) => {
    const byProvider = a.provider.localeCompare(b.provider);
    if (byProvider !== 0) return byProvider;
    return a.name.localeCompare(b.name);
  });
  const headers = [...PRICE_HEADERS.slice(0, 9), "Updated", "Source", "Markdown"];
  const body = rows.map((model) => [
    ...priceCells(model, false).slice(0, 9),
    model.updatedAt,
    model.sourceUrl,
    absoluteUrl(modelMarkdownPath(model.slug)),
  ]);
  return [
    "# AI models",
    "",
    checkedLine(),
    "",
    `${rows.length} models in the ledger, listed by the company that bills the API and then by name. Each price is the rate named on that row, copied from the official page linked on the model page.`,
    "",
    mdTable(headers, body),
    "",
    canonicalLine("/models"),
    "",
    `Dataset: ${absoluteUrl("/api/models.json")}`,
    "",
  ].join("\n");
}

export function providersIndexMarkdownDocument(): string {
  const names = providers();
  const lines = [
    "# AI API providers",
    "",
    checkedLine(),
    "",
    `The ledger groups models by the company that bills the API. A host such as Together AI or Groq is listed under that host, not under the lab that trained an open model. There are ${names.length} providers and ${models.length} models. Each price is the rate named on the row, copied from the official page linked there.`,
    "",
    "## Providers",
    "",
  ];
  for (const provider of names) {
    const rows = modelsByProvider(provider);
    const priced = rows.filter((model) => model.inputUsdPerMillion !== null);
    const inputs = priced.map((model) => model.inputUsdPerMillion ?? 0);
    const range =
      inputs.length === 0
        ? "no published input rate"
        : `input ${formatRate(Math.min(...inputs))}–${formatRate(Math.max(...inputs))} per 1M tokens`;
    lines.push(
      `- ${provider}: ${rows.length} ${rows.length === 1 ? "model" : "models"}. ${range}. Markdown: ${absoluteUrl(providerMarkdownPath(providerSlug(provider)))}`,
    );
    for (const model of rows) {
      lines.push(
        `  - ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, cached input ${formatRate(model.cachedInputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}). Markdown: ${absoluteUrl(modelMarkdownPath(model.slug))}`,
      );
    }
  }
  lines.push("", canonicalLine("/providers"), "", `Dataset: ${absoluteUrl("/api/models.json")}`, "");
  return lines.join("\n");
}

export function priceChangesMarkdownDocument(): string {
  return [
    "# AI API price changes",
    "",
    checkedLine(),
    "",
    "Newest effective date first. Each row is a change to a stored list price, a model added to the ledger, or a scheduled rate an official page has already published. Rates are USD per 1M tokens, shown as input / cached input / output.",
    "",
    `RSS: ${absoluteUrl("/price-changes.xml")}`,
    "",
    priceChangesPlainText(),
    "",
    canonicalLine("/price-changes"),
    "",
  ].join("\n");
}

export function releasesMarkdownDocument(): string {
  const dated = models
    .filter((model) => model.releaseDate || model.releaseMonth)
    .sort((a, b) => (releaseSortValue(b) ?? "").localeCompare(releaseSortValue(a) ?? ""));
  const undated = models.filter((model) => !model.releaseDate && !model.releaseMonth);
  const groups = new Map<string, Model[]>();
  for (const model of dated) {
    const key = (model.releaseDate ?? model.releaseMonth ?? "").slice(0, 7);
    const list = groups.get(key) ?? [];
    list.push(model);
    groups.set(key, list);
  }

  const lines = [
    "# Releases",
    "",
    checkedLine(),
    "",
    "Newest first. A month without a day is shown as the month only, because the source did not publish a day. Models with no release date on the pages checked are listed at the end.",
    "",
  ];
  for (const [month, items] of groups) {
    lines.push(`## ${formatMonth(month)}`, "");
    for (const model of items) {
      const when = model.releaseDate ? model.releaseDate : `${model.releaseMonth} (month only)`;
      const announcement = model.releaseSourceUrl ?? model.sourceUrl;
      lines.push(
        `- ${model.provider} — ${model.name}: ${when}. Announcement: ${announcement}. Markdown: ${absoluteUrl(modelMarkdownPath(model.slug))}`,
      );
    }
    lines.push("");
  }
  lines.push("## No day on the source", "");
  if (undated.length === 0) {
    lines.push("No model is missing a release date.", "");
  } else {
    for (const model of undated) {
      lines.push(
        `- ${model.provider} — ${model.name}: n/a. Source: ${model.sourceUrl}. Markdown: ${absoluteUrl(modelMarkdownPath(model.slug))}`,
      );
    }
    lines.push("");
  }
  lines.push(canonicalLine("/releases"), "");
  return lines.join("\n");
}

export function faqMarkdownDocument(): string {
  const lines = [
    "# FAQ",
    "",
    checkedLine(),
    "",
    `Answers are generated from the ledger checked on ${formatIsoDate(DATASET_CHECKED_ON)}.`,
    "",
  ];
  for (const item of pageFaqs()) {
    lines.push(`## ${item.question}`, "", item.answer, "");
  }
  lines.push(canonicalLine("/faq"), "");
  return lines.join("\n");
}

function rankedBy(
  field: "inputUsdPerMillion" | "outputUsdPerMillion",
): Model[] {
  return models
    .filter((model) => model[field] !== null)
    .sort((a, b) => {
      const delta = (a[field] ?? 0) - (b[field] ?? 0);
      if (delta !== 0) return delta;
      return a.name.localeCompare(b.name);
    });
}

function rankedTable(rows: Model[], showRank: boolean): string {
  const headers = [
    ...(showRank ? ["Rank"] : []),
    "Provider",
    "Model",
    "Input per 1M",
    "Cached input per 1M",
    "Output per 1M",
    "Rate label",
    "Context",
    "Max output",
    "Status",
    "Source",
  ];
  const body = rows.map((model, index) => [
    ...(showRank ? [String(index + 1)] : []),
    model.provider,
    model.name,
    formatRate(model.inputUsdPerMillion),
    formatRate(model.cachedInputUsdPerMillion),
    formatRate(model.outputUsdPerMillion),
    model.priceLabel,
    formatTokens(model.contextTokens),
    formatTokens(model.maxOutputTokens),
    statusLabel(model.status),
    model.sourceUrl,
  ]);
  return mdTable(headers, body);
}

export function cheapestMarkdownDocument(): string {
  const byInput = rankedBy("inputUsdPerMillion");
  const byOutput = rankedBy("outputUsdPerMillion");
  const unpriced = models
    .filter((model) => model.inputUsdPerMillion === null || model.outputUsdPerMillion === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const lines = [
    "# Cheapest AI API prices",
    "",
    checkedLine(),
    "",
    "Two rankings, both from the stored rate on each row. The first sorts by input price per 1M tokens. The second sorts by output price per 1M tokens. The rate label is the published label for that number. Off-peak and introductory rates stay in the ranking and keep that label. They are not removed, and they are not replaced with a peak or post-introductory price from the note. Models with the same rate are listed alphabetically. A tie is the same published price. This is not a quality ranking.",
    "",
    "## Lowest input rates",
    "",
    rankedTable(byInput, true),
    "",
    "## Lowest output rates",
    "",
    rankedTable(byOutput, true),
    "",
  ];
  if (unpriced.length > 0) {
    lines.push(
      "## No published token rate",
      "",
      "These rows have no published input rate or no published output rate, so they are not ranked. n/a is not zero and is not treated as free.",
      "",
      rankedTable(unpriced, false),
      "",
    );
  }
  lines.push(canonicalLine("/cheapest-ai-api"), "");
  return lines.join("\n");
}

export function largestContextMarkdownDocument(): string {
  const ranked = models
    .filter((model) => model.contextTokens !== null)
    .sort((a, b) => {
      const delta = (b.contextTokens ?? 0) - (a.contextTokens ?? 0);
      if (delta !== 0) return delta;
      return a.name.localeCompare(b.name);
    });
  const missing = models
    .filter((model) => model.contextTokens === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const largest = ranked[0]?.contextTokens ?? null;
  const lines = [
    "# Largest context window AI models",
    "",
    checkedLine(),
    "",
    `Sorted by the context window published for each model in this ledger.${largest !== null ? ` The largest published window on the check date is ${formatTokens(largest)} tokens.` : ""} A missing window is n/a and is not treated as zero. A larger window is not a quality ranking. Prices beside the window are the stored rate, and the rate label keeps off-peak, introductory, legacy, and short-prompt labels visible. Max output is a separate published figure when the source lists one.`,
    "",
    "## Published context windows",
    "",
    rankedTable(ranked, true),
    "",
  ];
  if (missing.length > 0) {
    lines.push("## No published context window", "", rankedTable(missing, false), "");
  }
  lines.push(canonicalLine("/largest-context-window-ai-models"), "");
  return lines.join("\n");
}

export function compareIndexMarkdownDocument(): string {
  const pairs = comparisonPairs();
  const lines = [
    "# Compare AI API prices",
    "",
    checkedLine(),
    "",
    `These ${pairs.length} pairs are built from the ledger. ${sameTierRuleSentence()} This is a price comparison of the stored rates. It is not a benchmark and not a recommendation.`,
    "",
    "## Pairs",
    "",
  ];
  for (const pair of pairs) {
    lines.push(
      `- ${pair.a.name} vs ${pair.b.name}. Markdown: ${absoluteUrl(`/compare/${pair.slug}.md`)}`,
      `  ${pair.a.provider} ${formatRate(pair.a.inputUsdPerMillion)} in / ${formatRate(pair.a.outputUsdPerMillion)} out · ${pair.a.priceLabel}`,
      `  ${pair.b.provider} ${formatRate(pair.b.inputUsdPerMillion)} in / ${formatRate(pair.b.outputUsdPerMillion)} out · ${pair.b.priceLabel}`,
    );
  }
  lines.push("", canonicalLine("/compare"), "");
  return lines.join("\n");
}

export function comparePairMarkdownDocument(slug: string): string | null {
  const pair = comparisonBySlug(slug);
  if (!pair) return null;
  const costA = estimateCost(pair.a, SAMPLE_WORKLOAD);
  const costB = estimateCost(pair.b, SAMPLE_WORKLOAD);
  if (!costA || !costB) return null;

  const checked = pair.a.updatedAt > pair.b.updatedAt ? pair.a.updatedAt : pair.b.updatedAt;
  const monthlyDelta = costA.perMonth - costB.perMonth;
  const cheaper = monthlyDelta < 0 ? pair.a : monthlyDelta > 0 ? pair.b : null;
  const dearer = cheaper === pair.a ? pair.b : pair.a;
  const heading = `${pair.a.name} vs ${pair.b.name}`;
  const table = mdTable(
    ["Field", pair.a.name, pair.b.name],
    [
      ["Input / 1M", formatRate(pair.a.inputUsdPerMillion), formatRate(pair.b.inputUsdPerMillion)],
      ["Cached input / 1M", formatRate(pair.a.cachedInputUsdPerMillion), formatRate(pair.b.cachedInputUsdPerMillion)],
      ["Output / 1M", formatRate(pair.a.outputUsdPerMillion), formatRate(pair.b.outputUsdPerMillion)],
      ["Rate", pair.a.priceLabel, pair.b.priceLabel],
      ["Context", formatTokens(pair.a.contextTokens), formatTokens(pair.b.contextTokens)],
      ["Max output", formatTokens(pair.a.maxOutputTokens), formatTokens(pair.b.maxOutputTokens)],
      ["Status", statusLabel(pair.a.status), statusLabel(pair.b.status)],
      ["Modalities", formatModalities(pair.a), formatModalities(pair.b)],
      ["Released", releaseField(pair.a), releaseField(pair.b)],
      ["Checked", pair.a.updatedAt, pair.b.updatedAt],
      ["Per request", formatUsdExact(costA.perRequest), formatUsdExact(costB.perRequest)],
      ["Per month", formatUsd(costA.perMonth), formatUsd(costB.perMonth)],
    ],
  );

  return [
    `# ${heading}`,
    "",
    `Checked: ${checked}`,
    ...(pair.a.updatedAt === pair.b.updatedAt
      ? [""]
      : [
          "",
          `${pair.a.name} was checked ${pair.a.updatedAt}. ${pair.b.name} was checked ${pair.b.updatedAt}.`,
          "",
        ]),
    `${pair.a.name} is billed by ${pair.a.provider}. ${pair.b.name} is billed by ${pair.b.provider}. ${sameTierRuleSentence()} The figures below are the rates stored on those two rows, the differences between them, and the cost of one sample workload. This page does not score quality.`,
    "",
    "## Stored rates",
    "",
    `${pair.a.name} (${pair.a.provider}, ${pair.a.priceLabel}) and ${pair.b.name} (${pair.b.provider}, ${pair.b.priceLabel}).`,
    "",
    table,
    "",
    "## Sample workload",
    "",
    `The sample is the calculator's starting workload: ${SAMPLE_WORKLOAD.inputTokens.toLocaleString("en-US")} input tokens and ${SAMPLE_WORKLOAD.outputTokens.toLocaleString("en-US")} output tokens per request, ${CALCULATOR_DEFAULTS.requestsPerDay.toLocaleString("en-US")} requests a day. A month in the calculator is ${DAYS_PER_MONTH} days, so that is ${SAMPLE_WORKLOAD.requestsPerMonth.toLocaleString("en-US")} requests. The cost uses the stored input and output rates only. Cache hits, batch discounts, long-context surcharges, peak hours, and prices scheduled after an introductory window are not included.`,
    "",
    `${pair.a.name} is ${formatUsdExact(costA.perRequest)} per request and ${formatUsd(costA.perMonth)} per month (${formatUsd(costA.inputPerMonth)} input and ${formatUsd(costA.outputPerMonth)} output over the month). ${pair.b.name} is ${formatUsdExact(costB.perRequest)} per request and ${formatUsd(costB.perMonth)} per month (${formatUsd(costB.inputPerMonth)} input and ${formatUsd(costB.outputPerMonth)} output over the month).`,
    "",
    cheaper
      ? `${cheaper.name} costs ${formatUsd(Math.abs(monthlyDelta))} less per month than ${dearer.name} on this sample, using the stored rates above.`
      : "On this sample the two stored rates cost the same amount.",
    "",
    "## Notes from the sources",
    "",
    `### ${pair.a.name}`,
    "",
    pair.a.priceLabel,
    "",
    pair.a.notes,
    "",
    `### ${pair.b.name}`,
    "",
    pair.b.priceLabel,
    "",
    pair.b.notes,
    "",
    "## Sources",
    "",
    `- ${pair.a.provider} price source for ${pair.a.name}: ${pair.a.sourceUrl}`,
    `- ${pair.b.provider} price source for ${pair.b.name}: ${pair.b.sourceUrl}`,
    "",
    canonicalLine(`/compare/${pair.slug}`),
    "",
  ].join("\n");
}

export function hubPageMarkdown(page: string): string | null {
  switch (page) {
    case "index":
      return indexMarkdownDocument();
    case "models":
      return modelsIndexMarkdownDocument();
    case "providers":
      return providersIndexMarkdownDocument();
    case "price-changes":
      return priceChangesMarkdownDocument();
    case "releases":
      return releasesMarkdownDocument();
    case "faq":
      return faqMarkdownDocument();
    case "cheapest-ai-api":
      return cheapestMarkdownDocument();
    case "largest-context-window-ai-models":
      return largestContextMarkdownDocument();
    case "compare":
      return compareIndexMarkdownDocument();
    default:
      return null;
  }
}
