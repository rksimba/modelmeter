import { DATASET_CHECKED_ON, models, type Model, type ModelStatus } from "../data/models";
import { priceChanges, type PriceChangeKind } from "../data/price-changes";
import { comparisonPairs } from "../lib/comparisons";
import { pageFaqs } from "../lib/faq";
import {
  markdownAlternatePath,
  markdownResponse,
  markdownVersionsSentence,
  modelMarkdownDocument,
  modelMarkdownPath,
  providerMarkdownDocument,
  providerMarkdownPath,
} from "../lib/markdown";
import { HUB_MARKDOWN_PAGES } from "../lib/markdown-paths";
import {
  comparePairMarkdownDocument,
  hubPageMarkdown,
  indexMarkdownDocument,
  priceChangesMarkdownDocument,
  releasesMarkdownDocument,
} from "../lib/markdown-pages";
import { modelsInHomeTableOrder } from "../lib/model-sort";
import { providerSlug, providers } from "../lib/models";
import { absoluteUrl } from "../lib/metadata";
import { llmsFullTxt, llmsTxt } from "../lib/plain-text";
import { modelIsPriced, estimateCost } from "../lib/pricing";
import { indexablePaths } from "../lib/routes";
import { methodologyParagraphs } from "../lib/site";

const OFFICIAL_HOSTS = new Set([
  "openai.com",
  "developers.openai.com",
  "www.anthropic.com",
  "anthropic.com",
  "platform.claude.com",
  "ai.google.dev",
  "blog.google",
  "docs.x.ai",
  "x.ai",
  "docs.mistral.ai",
  "mistral.ai",
  "api-docs.deepseek.com",
  "cohere.com",
  "docs.cohere.com",
  "www.together.ai",
  "together.ai",
  "docs.together.ai",
  "console.groq.com",
  "groq.com",
  "dev.meta.ai",
  "about.fb.com",
  "platform.kimi.ai",
  "forum.moonshot.ai",
  "www.alibabacloud.com",
  "docs.modelstudio.console.alibabacloud.com",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;
const STATUSES = new Set<ModelStatus>(["active", "preview", "legacy", "limited", "deprecated"]);
const PRICE_CHANGE_KINDS = new Set<PriceChangeKind>([
  "price cut",
  "price increase",
  "price removed",
  "new model",
  "scheduled change",
]);
const errors: string[] = [];
const warnings: string[] = [];
const slugs = new Set<string>();
const now = Date.now();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function checkUrl(model: Model, field: "sourceUrl" | "limitsSourceUrl" | "releaseSourceUrl") {
  const value = model[field];
  if (!value) return;
  checkHost(`${model.slug} ${field}`, value);
}

function checkHost(label: string, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    errors.push(`${label} is not a URL: ${value}`);
    return;
  }
  if (url.protocol !== "https:") {
    errors.push(`${label} must be https: ${value}`);
  }
  if (!OFFICIAL_HOSTS.has(url.hostname)) {
    errors.push(`${label} host is not on the official list: ${url.hostname}`);
  }
}

function checkPrice(model: Model, field: "inputUsdPerMillion" | "cachedInputUsdPerMillion" | "outputUsdPerMillion") {
  const value = model[field];
  if (value === null) return;
  if (!Number.isFinite(value) || value < 0) {
    errors.push(`${model.slug} ${field} must be a non-negative number or null`);
  }
}

for (const model of models) {
  if (slugs.has(model.slug)) errors.push(`Duplicate slug ${model.slug}`);
  slugs.add(model.slug);

  if (!model.provider.trim()) errors.push(`${model.slug} is missing provider`);
  if (!model.name.trim()) errors.push(`${model.slug} is missing name`);
  if (!model.sourceUrl) errors.push(`${model.slug} is missing sourceUrl`);
  if (!model.updatedAt) errors.push(`${model.slug} is missing updatedAt`);
  if (model.updatedAt && !ISO_DATE.test(model.updatedAt)) {
    errors.push(`${model.slug} updatedAt must be YYYY-MM-DD`);
  }
  if (model.releaseDate && !ISO_DATE.test(model.releaseDate)) {
    errors.push(`${model.slug} releaseDate must be YYYY-MM-DD or null`);
  }
  if (model.releaseMonth && !ISO_MONTH.test(model.releaseMonth)) {
    errors.push(`${model.slug} releaseMonth must be YYYY-MM or null`);
  }
  if (!model.priceLabel.trim()) errors.push(`${model.slug} is missing priceLabel`);
  if (!model.notes.trim()) errors.push(`${model.slug} is missing notes`);
  if (!STATUSES.has(model.status)) {
    errors.push(`${model.slug} has unknown status ${model.status}`);
  }

  checkUrl(model, "sourceUrl");
  checkUrl(model, "limitsSourceUrl");
  checkUrl(model, "releaseSourceUrl");
  checkPrice(model, "inputUsdPerMillion");
  checkPrice(model, "cachedInputUsdPerMillion");
  checkPrice(model, "outputUsdPerMillion");

  if (model.updatedAt && ISO_DATE.test(model.updatedAt)) {
    const age = now - new Date(`${model.updatedAt}T00:00:00Z`).getTime();
    if (age > WEEK_MS) {
      warnings.push(`${model.slug} was last updated ${model.updatedAt}, which is older than 7 days`);
    }
  }
  if (model.updatedAt !== DATASET_CHECKED_ON) {
    errors.push(`${model.slug} updatedAt ${model.updatedAt} does not match the ledger check date ${DATASET_CHECKED_ON}`);
  }
}

const sample = models.find((model) => model.slug === "claude-sonnet-5-5");
if (!sample) {
  errors.push("Expected claude-sonnet-5-5 in the dataset");
} else {
  const cost = estimateCost(sample, {
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    requestsPerMonth: 1,
  });
  const expected = (sample.inputUsdPerMillion ?? 0) + (sample.outputUsdPerMillion ?? 0);
  if (!cost || Math.abs(cost.perRequest - expected) > 1e-9) {
    errors.push("Cost formula failed the 1M/1M token check");
  }
}

const providerSlugs = new Map<string, string>();
for (const provider of providers()) {
  const slug = providerSlug(provider);
  if (!slug) errors.push(`Provider slug for ${provider} is empty`);
  const existing = providerSlugs.get(slug);
  if (existing) errors.push(`Provider slug collision ${slug} (${existing} and ${provider})`);
  providerSlugs.set(slug, provider);
}

for (const model of models) {
  if (model.slug.includes("-vs-")) {
    errors.push(`${model.slug} contains "-vs-", which collides with comparison URLs`);
  }
}

const pairs = comparisonPairs();
const pairSlugs = new Set<string>();
for (const pair of pairs) {
  if (pairSlugs.has(pair.slug)) errors.push(`Duplicate comparison slug ${pair.slug}`);
  pairSlugs.add(pair.slug);
  if (pair.a.provider === pair.b.provider) errors.push(`${pair.slug} is not cross-provider`);
  if (!modelIsPriced(pair.a) || !modelIsPriced(pair.b)) {
    errors.push(`${pair.slug} includes an unpriced model`);
  }
}
if (pairs.length === 0) errors.push("Same-tier comparison rule produced no pairs");

const changeKeys = new Set<string>();
for (const change of priceChanges) {
  const key = `${change.modelSlug}|${change.date}|${change.kind}`;
  if (changeKeys.has(key)) errors.push(`Duplicate price change ${key}`);
  changeKeys.add(key);

  if (!ISO_DATE.test(change.date)) errors.push(`${key} date must be YYYY-MM-DD`);
  if (!PRICE_CHANGE_KINDS.has(change.kind)) errors.push(`${key} has unknown kind ${change.kind}`);
  if (!change.note.trim()) errors.push(`${key} is missing a note`);
  if (!change.provider.trim()) errors.push(`${key} is missing provider`);
  checkHost(`${key} sourceUrl`, change.sourceUrl);
  if (change.alsoSourceUrl) checkHost(`${key} alsoSourceUrl`, change.alsoSourceUrl);

  const model = models.find((row) => row.slug === change.modelSlug);
  if (!model) {
    errors.push(`${key} slug is not in the ledger`);
    continue;
  }
  if (model.provider !== change.provider) {
    errors.push(`${key} provider ${change.provider} does not match ${model.provider}`);
  }

  const rateFields = ["inputUsdPerMillion", "cachedInputUsdPerMillion", "outputUsdPerMillion"] as const;
  for (const field of rateFields) {
    const value = change.newRates[field];
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      errors.push(`${key} newRates.${field} must be a non-negative number or null`);
    }
    const previous = change.oldRates?.[field];
    if (change.oldRates && previous !== null && previous !== undefined && (!Number.isFinite(previous) || previous < 0)) {
      errors.push(`${key} oldRates.${field} must be a non-negative number or null`);
    }
  }

  if (change.kind === "new model" && change.oldRates !== null) {
    errors.push(`${key} is a new model and must have null old rates`);
  }
  if (change.kind !== "new model" && change.oldRates === null) {
    errors.push(`${key} must record the previous rates`);
  }
  if (change.kind === "scheduled change" && ISO_DATE.test(change.date) && change.date <= DATASET_CHECKED_ON) {
    errors.push(`${key} is scheduled on or before the ledger check date ${DATASET_CHECKED_ON}`);
  }
}

const deepseek = models.find((model) => model.slug === "deepseek-v4-1-flash-1017");
if (!deepseek) {
  errors.push("Expected deepseek-v4-1-flash-1017 in the dataset");
} else {
  if (deepseek.provider !== "Mistral") errors.push("deepseek-v4-1-flash-1017 provider must be Mistral");
  if (deepseek.name !== "DeepSeek V4.1 Flash 1017") errors.push("deepseek-v4-1-flash-1017 name mismatch");
  if (deepseek.apiId !== "deepseek-v4-1-flash-1017") errors.push("deepseek-v4-1-flash-1017 apiId mismatch");
  if (deepseek.weightsFrom !== "DeepSeek") errors.push("deepseek-v4-1-flash-1017 weightsFrom mismatch");
  if (deepseek.inputUsdPerMillion !== 0.3) errors.push("deepseek-v4-1-flash-1017 input rate mismatch");
  if (deepseek.cachedInputUsdPerMillion !== 0.007) errors.push("deepseek-v4-1-flash-1017 cached rate mismatch");
  if (deepseek.outputUsdPerMillion !== 1.2) errors.push("deepseek-v4-1-flash-1017 output rate mismatch");
  if (deepseek.priceLabel !== "Standard") errors.push("deepseek-v4-1-flash-1017 priceLabel mismatch");
  if (deepseek.contextTokens !== 1_000_000) errors.push("deepseek-v4-1-flash-1017 context mismatch");
  if (deepseek.maxOutputTokens !== 128_000) errors.push("deepseek-v4-1-flash-1017 max output mismatch");
  if (deepseek.status !== "preview") errors.push("deepseek-v4-1-flash-1017 status mismatch");
  if (deepseek.releaseDate !== "2026-10-28") errors.push("deepseek-v4-1-flash-1017 releaseDate mismatch");
  const source = "https://docs.mistral.ai/models/deepseek-v4-flash-1017";
  if (deepseek.sourceUrl !== source || deepseek.limitsSourceUrl !== source || deepseek.releaseSourceUrl !== source) {
    errors.push("deepseek-v4-1-flash-1017 source URLs mismatch");
  }
  if (!deepseek.inputModalities?.includes("text") || !deepseek.inputModalities?.includes("image")) {
    errors.push("deepseek-v4-1-flash-1017 input modalities mismatch");
  }
  if (deepseek.outputModalities?.join(",") !== "text") {
    errors.push("deepseek-v4-1-flash-1017 output modalities mismatch");
  }
  const added = priceChanges.find(
    (change) => change.modelSlug === deepseek.slug && change.date === "2026-11-01" && change.kind === "new model",
  );
  if (!added) errors.push("deepseek-v4-1-flash-1017 is missing its 2026-11-01 new model price change");
  else if (added.newRates.inputUsdPerMillion !== 0.3 || added.newRates.cachedInputUsdPerMillion !== 0.007 || added.newRates.outputUsdPerMillion !== 1.2) {
    errors.push("deepseek-v4-1-flash-1017 price change rates mismatch");
  } else if (added.sourceUrl !== source) {
    errors.push("deepseek-v4-1-flash-1017 price change source mismatch");
  }
}

const kimi = models.find((model) => model.slug === "kimi-k3-1-pro");
if (!kimi) {
  errors.push("Expected kimi-k3-1-pro in the dataset");
} else {
  if (kimi.sourceUrl !== "https://platform.kimi.ai/docs/pricing/chat") {
    errors.push("kimi-k3-1-pro sourceUrl must be the docs pricing table");
  }
  if (kimi.inputUsdPerMillion !== 2 || kimi.cachedInputUsdPerMillion !== 0.2 || kimi.outputUsdPerMillion !== 10) {
    errors.push("kimi-k3-1-pro stored rates changed");
  }
  if (/platform home/i.test(kimi.notes)) errors.push("kimi-k3-1-pro notes still cite the platform home");
  if (!kimi.notes.includes("docs pricing table")) errors.push("kimi-k3-1-pro notes must cite the docs pricing table");
  if (/promised/i.test(kimi.notes)) errors.push("kimi-k3-1-pro notes still say open weights are only promised");
  if (!kimi.notes.includes("https://huggingface.co/moonshotai/Kimi-K3.1-Pro")) {
    errors.push("kimi-k3-1-pro notes must link the Hugging Face weights");
  }
  if (!kimi.notes.includes("separate from the API rates")) {
    errors.push("kimi-k3-1-pro notes must keep the weight release separate from API pricing");
  }
}

const qwen = models.find((model) => model.slug === "qwen3-8-max");
if (!qwen) {
  errors.push("Expected qwen3-8-max in the dataset");
} else {
  if (qwen.provider !== "Alibaba Cloud") errors.push("qwen3-8-max provider must be Alibaba Cloud");
  if (qwen.name !== "Qwen3.8-Max") errors.push("qwen3-8-max name mismatch");
  if (qwen.apiId !== "qwen3.8-max") errors.push("qwen3-8-max apiId mismatch");
  if (qwen.weightsFrom !== "Alibaba (Qwen)") errors.push("qwen3-8-max weightsFrom mismatch");
  if (qwen.inputUsdPerMillion !== 2) errors.push("qwen3-8-max input rate mismatch");
  if (qwen.cachedInputUsdPerMillion !== 0.25) errors.push("qwen3-8-max cached rate mismatch");
  if (qwen.outputUsdPerMillion !== 6) errors.push("qwen3-8-max output rate mismatch");
  if (qwen.contextTokens !== 1_000_000) errors.push("qwen3-8-max context mismatch");
  if (qwen.maxOutputTokens !== 131_072) errors.push("qwen3-8-max max output mismatch");
  if (qwen.status !== "active") errors.push("qwen3-8-max status mismatch");
  if (qwen.releaseDate !== null || qwen.releaseMonth !== null) errors.push("qwen3-8-max release must be unpublished");
  if (qwen.priceLabel !== "Standard, International (Singapore) scope") errors.push("qwen3-8-max priceLabel mismatch");
  if (qwen.inputModalities?.join(",") !== "text,image,video") errors.push("qwen3-8-max input modalities mismatch");
  if (qwen.outputModalities?.join(",") !== "text") errors.push("qwen3-8-max output modalities mismatch");
  if (qwen.sourceUrl !== "https://www.alibabacloud.com/help/en/model-studio/model-pricing") {
    errors.push("qwen3-8-max sourceUrl mismatch");
  }
  if (qwen.limitsSourceUrl !== "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/qwen3-8-max") {
    errors.push("qwen3-8-max limitsSourceUrl mismatch");
  }
  if (qwen.releaseSourceUrl !== null) errors.push("qwen3-8-max releaseSourceUrl must be null");
  if (qwen.updatedAt !== DATASET_CHECKED_ON) errors.push("qwen3-8-max updatedAt must match the ledger check date");
  const added = priceChanges.find(
    (change) => change.modelSlug === qwen.slug && change.date === "2026-11-02" && change.kind === "new model",
  );
  if (!added) errors.push("qwen3-8-max is missing its 2026-11-02 new model price change");
  else if (added.oldRates !== null) errors.push("qwen3-8-max price change must have null old rates");
  else if (added.newRates.inputUsdPerMillion !== 2 || added.newRates.cachedInputUsdPerMillion !== 0.25 || added.newRates.outputUsdPerMillion !== 6) {
    errors.push("qwen3-8-max price change rates mismatch");
  } else if (added.sourceUrl !== qwen.sourceUrl) {
    errors.push("qwen3-8-max price change source mismatch");
  } else if (added.provider !== "Alibaba Cloud") {
    errors.push("qwen3-8-max price change provider mismatch");
  }
}

const markdownPaths = new Set<string>();
for (const model of models) {
  const body = modelMarkdownDocument(model.slug);
  const path = modelMarkdownPath(model.slug);
  markdownPaths.add(path);
  if (!body) {
    errors.push(`${model.slug} markdown document is missing`);
    continue;
  }
  if (!body.startsWith(`# ${model.provider} ${model.name} API price\n`)) {
    errors.push(`${model.slug} markdown heading mismatch`);
  }
  if (!body.includes(`Checked: ${model.updatedAt}`)) errors.push(`${model.slug} markdown is missing Checked`);
  if (!body.includes(`Canonical page: ${absoluteUrl(`/models/${model.slug}`)}`)) {
    errors.push(`${model.slug} markdown is missing the canonical page`);
  }
  if (!body.includes(`Dataset: ${absoluteUrl("/api/models.json")}`)) {
    errors.push(`${model.slug} markdown is missing the dataset link`);
  }
  if (model.inputUsdPerMillion === null && !body.includes("Input: n/a")) {
    errors.push(`${model.slug} markdown should show n/a input`);
  }
  if (model.weightsFrom && !body.includes(`Weights from: ${model.weightsFrom}`)) {
    errors.push(`${model.slug} markdown is missing weights from`);
  }
  if (!model.weightsFrom && body.includes("Weights from:")) {
    errors.push(`${model.slug} markdown includes weights from`);
  }
}
if (modelMarkdownDocument("not-a-model") !== null) errors.push("Unknown model markdown must be null");

for (const provider of providers()) {
  const slug = providerSlug(provider);
  const body = providerMarkdownDocument(slug);
  const path = providerMarkdownPath(slug);
  markdownPaths.add(path);
  if (!body) {
    errors.push(`${slug} provider markdown document is missing`);
    continue;
  }
  if (!body.startsWith(`# ${provider} API prices\n`)) errors.push(`${slug} provider markdown heading mismatch`);
  if (!body.includes("Checked:")) errors.push(`${slug} provider markdown is missing Checked`);
  for (const model of models.filter((row) => row.provider === provider)) {
    if (!body.includes(absoluteUrl(modelMarkdownPath(model.slug)))) {
      errors.push(`${slug} provider markdown is missing ${model.slug}`);
    }
    if (!body.includes(model.sourceUrl)) errors.push(`${slug} provider markdown is missing a source for ${model.slug}`);
  }
}
if (providerMarkdownDocument("not-a-provider") !== null) errors.push("Unknown provider markdown must be null");

for (const entry of indexablePaths()) {
  if (entry.path.endsWith(".md") || entry.path.includes("/api/md/")) {
    errors.push(`Sitemap path includes a Markdown route: ${entry.path}`);
  }
}

const llms = llmsTxt();
const llmsFull = llmsFullTxt();
if (!llms.includes(markdownVersionsSentence) || !llmsFull.includes(markdownVersionsSentence)) {
  errors.push("llms.txt and llms-full.txt must explain the Markdown pages");
}
for (const model of models) {
  const url = absoluteUrl(modelMarkdownPath(model.slug));
  if (!llms.includes(`Markdown: ${url}`)) errors.push(`llms.txt models list is missing ${url}`);
}
for (const provider of providers()) {
  const url = absoluteUrl(providerMarkdownPath(providerSlug(provider)));
  if (!llms.includes(`Markdown: ${url}`)) errors.push(`llms.txt provider pages are missing ${url}`);
  if (!llmsFull.includes(`Markdown: ${url}`)) errors.push(`llms-full.txt provider pages are missing ${url}`);
}
const machineReadable = pageFaqs().find((item) => item.answer.includes("/api/models.json"));
if (!machineReadable?.answer.includes(markdownVersionsSentence)) {
  errors.push("The machine-readable FAQ answer must mention Markdown pages");
}
if (!llmsFull.includes("Hub and list pages also have Markdown versions")) {
  errors.push("llms-full.txt must say hub pages have Markdown versions");
}
for (const htmlPath of ["/calculator", "/about", "/sponsor"]) {
  if (markdownAlternatePath(htmlPath) !== null) {
    errors.push(`${htmlPath} must not grow a Markdown alternate`);
  }
}

function markdownTableRows(body: string): string[][] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.startsWith("| ---"))
    .slice(1)
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

for (const entry of HUB_MARKDOWN_PAGES) {
  markdownPaths.add(entry.markdownPath);
  const body = hubPageMarkdown(entry.page);
  if (!body) {
    errors.push(`${entry.markdownPath} document is missing`);
    continue;
  }
  if (!body.startsWith("# ")) errors.push(`${entry.markdownPath} is missing a heading`);
  if (!body.includes(`Checked: ${DATASET_CHECKED_ON}`)) errors.push(`${entry.markdownPath} is missing Checked`);
  if (markdownAlternatePath(entry.htmlPath) !== entry.markdownPath) {
    errors.push(`${entry.htmlPath} Markdown alternate does not match ${entry.markdownPath}`);
  }
  const url = absoluteUrl(entry.markdownPath);
  if (!llms.includes(`Markdown: ${url}`)) errors.push(`llms.txt is missing ${url}`);
  if (!llmsFull.includes(`Markdown: ${url}`)) errors.push(`llms-full.txt is missing ${url}`);
}
if (hubPageMarkdown("not-a-page") !== null) errors.push("Unknown hub markdown must be null");
const providersBody = hubPageMarkdown("providers") ?? "";
if (!providersBody.includes(absoluteUrl("/providers/alibaba-cloud.md"))) {
  errors.push("providers.md is missing the Alibaba Cloud Markdown page");
}
const modelsBody = hubPageMarkdown("models") ?? "";
for (const model of models) {
  if (!modelsBody.includes(absoluteUrl(modelMarkdownPath(model.slug)))) {
    errors.push(`models.md is missing ${model.slug}`);
  }
}
const faqBody = hubPageMarkdown("faq") ?? "";
if (!faqBody.includes("## How are prices sourced?")) errors.push("faq.md is missing its questions");

const indexBody = indexMarkdownDocument();
if (!methodologyParagraphs.every((paragraph) => indexBody.includes(paragraph))) {
  errors.push("index.md is missing the methodology");
}
const indexRows = markdownTableRows(indexBody);
const homeOrder = modelsInHomeTableOrder(models);
if (indexRows.length !== models.length) {
  errors.push(`index.md table has ${indexRows.length} rows, expected ${models.length}`);
} else {
  for (let i = 0; i < homeOrder.length; i++) {
    if (indexRows[i]?.[1] !== homeOrder[i]?.name) {
      errors.push(`index.md sort diverges at row ${i}: ${indexRows[i]?.[1]} vs ${homeOrder[i]?.name}`);
      break;
    }
  }
}
const qwenRow = indexRows.find((row) => row[1] === "Qwen3.8-Max");
if (!qwenRow) {
  errors.push("index.md table is missing Qwen3.8-Max");
} else if (qwenRow.join(" | ") !== [
  "Alibaba Cloud",
  "Qwen3.8-Max",
  "$2.00",
  "$0.25",
  "$6.00",
  "Standard, International (Singapore) scope",
  "1M",
  "131,072",
  "Active",
  "n/a",
  "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
].join(" | ")) {
  errors.push(`index.md Qwen row mismatch: ${qwenRow.join(" | ")}`);
}
const rosalindRow = indexRows.find((row) => row[1] === "GPT-6 Rosalind");
if (!rosalindRow?.includes("n/a")) errors.push("index.md should show n/a for GPT-6 Rosalind's unpublished limits");

const changesBody = priceChangesMarkdownDocument();
for (const needle of ["qwen3-8-max", "2026-12-01", "gemini-4-argon", "2027-01-01", "gemini-3-8-flash", "https://ai.google.dev/gemini-api/docs/pricing"]) {
  if (!changesBody.includes(needle)) errors.push(`price-changes.md is missing ${needle}`);
}
const releasesBody = releasesMarkdownDocument();
if (!releasesBody.includes("Alibaba Cloud — Qwen3.8-Max: n/a.")) {
  errors.push("releases.md should show n/a for Qwen3.8-Max");
}

for (const pair of pairs) {
  const path = `/compare/${pair.slug}.md`;
  markdownPaths.add(path);
  const body = comparePairMarkdownDocument(pair.slug);
  if (!body) {
    errors.push(`${path} document is missing`);
    continue;
  }
  if (!body.includes(pair.a.name) || !body.includes(pair.b.name)) errors.push(`${path} is missing a model name`);
  if (!body.includes(pair.a.sourceUrl) || !body.includes(pair.b.sourceUrl)) errors.push(`${path} is missing a source`);
  if (!body.includes(`Checked: `)) errors.push(`${path} is missing Checked`);
  const url = absoluteUrl(path);
  if (!llms.includes(`Markdown: ${url}`)) errors.push(`llms.txt is missing ${url}`);
  if (!llmsFull.includes(`Markdown: ${url}`)) errors.push(`llms-full.txt is missing ${url}`);
}
if (comparePairMarkdownDocument("not-a-pair") !== null) errors.push("Unknown comparison markdown must be null");

const sampleMarkdown = markdownResponse("# Sample\n");
if (sampleMarkdown.headers.get("Content-Type") !== "text/markdown; charset=utf-8") {
  errors.push("Markdown responses must use Content-Type text/markdown; charset=utf-8");
}
if (sampleMarkdown.headers.get("Cache-Control") !== "public, max-age=3600") {
  errors.push("Markdown responses must use the public one-hour cache header");
}
const missingMarkdown = markdownResponse(null);
if (missingMarkdown.status !== 404) errors.push("Missing Markdown documents must return 404");

console.log(`ModelMeter dataset check — ${models.length} rows, ledger date ${DATASET_CHECKED_ON}`);
console.log(`Providers: ${providers().length}`);
console.log(`Markdown routes: ${markdownPaths.size}`);
console.log(`Comparison pairs: ${pairs.length}`);
console.log(`Price changes: ${priceChanges.length}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

if (warnings.length === 0 && errors.length === 0) {
  console.log("All rows have a source URL and an updated date. None are older than 7 days.");
}

if (errors.length > 0) {
  process.exit(1);
}
