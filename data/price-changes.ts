/**
 * Dated changes to stored list prices, new models, and scheduled rates
 * that an official page has already published.
 *
 * Rates are USD per 1M tokens. `oldRates` is null when the model was not
 * in the ledger before the entry. Do not add a row from memory or from
 * another tracker.
 */
export type PriceChangeKind = "price cut" | "price increase" | "new model" | "scheduled change";

export type TokenRates = {
  inputUsdPerMillion: number | null;
  cachedInputUsdPerMillion: number | null;
  outputUsdPerMillion: number | null;
};

export type PriceChange = {
  /** Effective date, YYYY-MM-DD. For a scheduled change, the day the new rate starts. */
  date: string;
  modelSlug: string;
  provider: string;
  kind: PriceChangeKind;
  oldRates: TokenRates | null;
  newRates: TokenRates;
  sourceUrl: string;
  /** A second official page that publishes the same figures, when there is one. */
  alsoSourceUrl: string | null;
  /** One factual sentence. */
  note: string;
};

export const priceChanges: PriceChange[] = [
  {
    date: "2026-10-29",
    modelSlug: "mistral-large-4",
    provider: "Mistral",
    kind: "price cut",
    oldRates: {
      inputUsdPerMillion: 1.36,
      cachedInputUsdPerMillion: 0.14,
      outputUsdPerMillion: 4.18,
    },
    newRates: {
      inputUsdPerMillion: 0.7,
      cachedInputUsdPerMillion: 0.07,
      outputUsdPerMillion: 2.1,
    },
    sourceUrl: "https://mistral.ai/news/mistral-large-4-oss/",
    alsoSourceUrl: "https://docs.mistral.ai/inference/pricing",
    note: "Mistral's 29 October 2026 announcement set Mistral Large 4 at $0.70 input, $0.07 cached input, and $2.10 output per 1M tokens, down from the previous ledger rate of $1.36, $0.14, and $4.18, and the API pricing table lists the same rates; the ledger recorded this change on 30 October 2026.",
  },
  {
    date: "2026-10-28",
    modelSlug: "gemini-4-carbon",
    provider: "Google",
    kind: "new model",
    oldRates: null,
    newRates: {
      inputUsdPerMillion: 2,
      cachedInputUsdPerMillion: 0.1,
      outputUsdPerMillion: 10,
    },
    sourceUrl:
      "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/",
    alsoSourceUrl: null,
    note: "Google announced Gemini 4 Carbon on 28 October 2026 with access limited to Fairwind Program partners and an introductory rate of $2 input, $0.10 cached input, and $10 output per 1M tokens.",
  },
  {
    date: "2026-12-01",
    modelSlug: "gemini-4-argon",
    provider: "Google",
    kind: "scheduled change",
    oldRates: {
      inputUsdPerMillion: 2,
      cachedInputUsdPerMillion: 0.1,
      outputUsdPerMillion: 10,
    },
    newRates: {
      inputUsdPerMillion: 4,
      cachedInputUsdPerMillion: 0.2,
      outputUsdPerMillion: 20,
    },
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    alsoSourceUrl: null,
    note: "The Gemini API pricing page schedules Gemini 4 Argon's paid standard rate to move from $2 input, $0.10 cached input, and $10 output per 1M tokens to $4, $0.20, and $20 on 1 December 2026.",
  },
  {
    date: "2027-01-01",
    modelSlug: "gemini-3-8-flash",
    provider: "Google",
    kind: "scheduled change",
    oldRates: {
      inputUsdPerMillion: 0.75,
      cachedInputUsdPerMillion: 0.075,
      outputUsdPerMillion: 3.75,
    },
    newRates: {
      inputUsdPerMillion: 1.5,
      cachedInputUsdPerMillion: 0.15,
      outputUsdPerMillion: 7.5,
    },
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    alsoSourceUrl: null,
    note: "The Gemini API pricing page schedules Gemini 3.8 Flash's paid standard rate to move from $0.75 input, $0.075 cached input, and $3.75 output per 1M tokens to $1.50, $0.15, and $7.50 on 1 January 2027.",
  },
];
