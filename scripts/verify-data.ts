import { DATASET_CHECKED_ON, models, type Model } from "../data/models";
import { estimateCost } from "../lib/pricing";

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
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;
const errors: string[] = [];
const warnings: string[] = [];
const slugs = new Set<string>();
const now = Date.now();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function checkUrl(model: Model, field: "sourceUrl" | "limitsSourceUrl" | "releaseSourceUrl") {
  const value = model[field];
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    errors.push(`${model.slug} ${field} is not a URL: ${value}`);
    return;
  }
  if (url.protocol !== "https:") {
    errors.push(`${model.slug} ${field} must be https: ${value}`);
  }
  if (!OFFICIAL_HOSTS.has(url.hostname)) {
    errors.push(`${model.slug} ${field} host is not on the official list: ${url.hostname}`);
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

console.log(`ModelMeter dataset check — ${models.length} rows, ledger date ${DATASET_CHECKED_ON}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

if (warnings.length === 0 && errors.length === 0) {
  console.log("All rows have a source URL and an updated date. None are older than 7 days.");
}

if (errors.length > 0) {
  process.exit(1);
}
