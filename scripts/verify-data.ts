import { DATASET_CHECKED_ON, models, type Model, type ModelStatus } from "../data/models";
import { priceChanges, type PriceChangeKind } from "../data/price-changes";
import { comparisonPairs } from "../lib/comparisons";
import { providerSlug, providers } from "../lib/models";
import { modelIsPriced, estimateCost } from "../lib/pricing";

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

console.log(`ModelMeter dataset check — ${models.length} rows, ledger date ${DATASET_CHECKED_ON}`);
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
