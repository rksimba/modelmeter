import type { Model } from "@/data/models";

export const DAYS_PER_MONTH = 30;

/** Starting values on the calculator form. Comparison pages reuse this workload. */
export const CALCULATOR_DEFAULTS = {
  inputTokens: 2_000,
  outputTokens: 800,
  requestsPerDay: 1_000,
} as const;

export const SAMPLE_WORKLOAD: Workload = {
  inputTokens: CALCULATOR_DEFAULTS.inputTokens,
  outputTokens: CALCULATOR_DEFAULTS.outputTokens,
  requestsPerMonth: CALCULATOR_DEFAULTS.requestsPerDay * DAYS_PER_MONTH,
};

export type Workload = {
  inputTokens: number;
  outputTokens: number;
  requestsPerMonth: number;
};

export type CostBreakdown = {
  perRequest: number;
  perMonth: number;
  inputPerMonth: number;
  outputPerMonth: number;
};

export function modelIsPriced(model: Model): boolean {
  return model.inputUsdPerMillion !== null && model.outputUsdPerMillion !== null;
}

/** List-price estimate from the rates stored on the row. Ignores cache, batch, and long-context tiers. */
export function estimateCost(model: Model, workload: Workload): CostBreakdown | null {
  if (!modelIsPriced(model)) return null;
  const input = model.inputUsdPerMillion ?? 0;
  const output = model.outputUsdPerMillion ?? 0;
  const inputPerRequest = (workload.inputTokens / 1_000_000) * input;
  const outputPerRequest = (workload.outputTokens / 1_000_000) * output;
  const perRequest = inputPerRequest + outputPerRequest;
  return {
    perRequest,
    perMonth: perRequest * workload.requestsPerMonth,
    inputPerMonth: inputPerRequest * workload.requestsPerMonth,
    outputPerMonth: outputPerRequest * workload.requestsPerMonth,
  };
}
