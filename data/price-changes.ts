/**
 * Dated changes to stored list prices, including a price a provider removed,
 * new models, and scheduled rates that an official page has already published.
 *
 * Rates are USD per 1M tokens. `oldRates` is null when the model was not
 * in the ledger before the entry. Do not add a row from memory or from
 * another tracker.
 */
export type PriceChangeKind =
  | "price cut"
  | "price increase"
  | "price removed"
  | "new model"
  | "scheduled change";

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
    date: "2026-11-01",
    modelSlug: "deepseek-v4-1-flash-1017",
    provider: "Mistral",
    kind: "new model",
    oldRates: null,
    newRates: {
      inputUsdPerMillion: 0.3,
      cachedInputUsdPerMillion: 0.007,
      outputUsdPerMillion: 1.2,
    },
    sourceUrl: "https://docs.mistral.ai/models/deepseek-v4-flash-1017",
    alsoSourceUrl: null,
    note: "DeepSeek V4.1 Flash 1017 (deepseek-v4-1-flash-1017), a DeepSeek open-weight model hosted by Mistral without modifications, is $0.30 input, $0.007 cached input, and $1.20 output per 1M tokens; the Mistral model card lists Public Preview and a release date of 28 October 2026, and this row was added to the ledger on 1 November 2026.",
  },
  {
    date: "2026-10-31",
    modelSlug: "mistral-medium-3-5",
    provider: "Mistral",
    kind: "price removed",
    oldRates: {
      inputUsdPerMillion: 1.5,
      cachedInputUsdPerMillion: 0.15,
      outputUsdPerMillion: 7.5,
    },
    newRates: {
      inputUsdPerMillion: null,
      cachedInputUsdPerMillion: null,
      outputUsdPerMillion: null,
    },
    sourceUrl: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
    alsoSourceUrl: "https://docs.mistral.ai/inference/pricing",
    note: "Mistral deprecated Mistral Medium 3.5 on 31 October 2026, with retirement on 30 April 2027 and Mistral Large 4 as the replacement, and removed the list price; the last published list price checked on 30 October 2026 was $1.50 input, $0.15 cached input, and $7.50 output per 1M tokens.",
  },
  {
    date: "2026-10-31",
    modelSlug: "mistral-large-3",
    provider: "Mistral",
    kind: "price removed",
    oldRates: {
      inputUsdPerMillion: 0.5,
      cachedInputUsdPerMillion: 0.05,
      outputUsdPerMillion: 1.5,
    },
    newRates: {
      inputUsdPerMillion: null,
      cachedInputUsdPerMillion: null,
      outputUsdPerMillion: null,
    },
    sourceUrl: "https://docs.mistral.ai/models/mistral-large-3-25-12",
    alsoSourceUrl: "https://docs.mistral.ai/inference/pricing",
    note: "Mistral deprecated Mistral Large 3 on 31 October 2026, with retirement on 30 April 2027 and Mistral Large 4 as the replacement, and removed the list price; the last published list price checked on 30 October 2026 was $0.50 input, $0.05 cached input, and $1.50 output per 1M tokens.",
  },
  {
    date: "2026-10-31",
    modelSlug: "gpt-6-rosalind",
    provider: "OpenAI",
    kind: "new model",
    oldRates: null,
    newRates: {
      inputUsdPerMillion: 15,
      cachedInputUsdPerMillion: 1.5,
      outputUsdPerMillion: 75,
    },
    sourceUrl: "https://developers.openai.com/api/docs/pricing",
    alsoSourceUrl: "https://developers.openai.com/api/docs/changelog",
    note: "OpenAI lists GPT-6 Rosalind, released 30 October 2026, at a short-context standard rate of $15 input, $1.50 cached input, and $75 output per 1M tokens for prompts up to 272K tokens, with access limited to organizations approved for Rosalind Research.",
  },
  {
    date: "2026-10-31",
    modelSlug: "glm-5-3",
    provider: "Mistral",
    kind: "new model",
    oldRates: null,
    newRates: {
      inputUsdPerMillion: 1.4,
      cachedInputUsdPerMillion: 0.14,
      outputUsdPerMillion: 4.4,
    },
    sourceUrl: "https://docs.mistral.ai/models/zai-glm-5-3",
    alsoSourceUrl: "https://mistral.ai/pricing",
    note: "GLM 5.3 (zai-glm-5-3), a Z.ai open-weight model hosted by Mistral without modifications, is $1.40 input, $0.14 cached input, and $4.40 output per 1M tokens; general availability on Mistral is 28 September 2026, and this row was added to the ledger on 31 October 2026.",
  },
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
