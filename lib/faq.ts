import { DATASET_CHECKED_ON, models } from "@/data/models";
import { formatIsoDate, formatRate, formatUsd } from "@/lib/format";
import { methodologyParagraphs } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";
import { CALCULATOR_DEFAULTS, DAYS_PER_MONTH, SAMPLE_WORKLOAD, estimateCost } from "@/lib/pricing";
import { getModel } from "@/lib/models";

export type FaqItem = {
  question: string;
  answer: string;
};

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function namedRates(
  rows: typeof models,
  field: "inputUsdPerMillion" | "outputUsdPerMillion",
): string {
  return joinList(
    rows.map(
      (model) => `${model.name} (${model.provider}, ${model.priceLabel}, ${formatRate(model[field])})`,
    ),
  );
}

function sharedPricingFaqs(): FaqItem[] {
  const origin = getSiteUrl();
  const checked = formatIsoDate(DATASET_CHECKED_ON);
  const withInput = models.filter((model) => model.inputUsdPerMillion !== null);
  const inputValues = withInput.map((model) => model.inputUsdPerMillion ?? 0);
  const minInput = Math.min(...inputValues);
  const maxInput = Math.max(...inputValues);
  const cheapest = withInput.filter((model) => model.inputUsdPerMillion === minInput);
  const dearest = withInput.filter((model) => model.inputUsdPerMillion === maxInput);
  const unpriced = models.filter(
    (model) => model.inputUsdPerMillion === null || model.outputUsdPerMillion === null,
  );

  const example = getModel("claude-sonnet-5-5") ?? withInput[0];
  const exampleCost = example
    ? estimateCost(example, {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        requestsPerMonth: 1,
      })
    : null;

  const exampleSentence =
    example && exampleCost
      ? `For a worked example from this ledger, one request of 1,000,000 input tokens and 1,000,000 output tokens of ${example.name} (${example.provider}) is ${formatUsd(exampleCost.perRequest)} at the stored rate (${example.priceLabel}): ${formatRate(example.inputUsdPerMillion)} input plus ${formatRate(example.outputUsdPerMillion)} output.`
      : "This ledger has no priced example to add.";

  const unpricedSentence =
    unpriced.length === 0
      ? "Every model in the ledger has a published input rate and a published output rate."
      : `${unpriced.length === 1 ? "1 model has" : `${unpriced.length} models have`} no published input or output rate, so ${unpriced.length === 1 ? "it is" : "they are"} shown as n/a and left out of this range.`;

  return [
    {
      question: "How are prices sourced?",
      answer: `${methodologyParagraphs.join(" ")} The check date for the current ledger is ${checked}. The methodology is also written at ${origin}/about, and every model page links to the official page the number came from.`,
    },
    {
      question: "What are tokens?",
      answer:
        "API providers meter usage in tokens, and this ledger stores prices in the unit those providers publish: USD per 1 million tokens. ModelMeter does not convert words or characters into tokens. Tokenizers differ by provider, and this dataset does not include a conversion rate. The calculator uses the token counts you type in.",
    },
    {
      question: "What does 1M tokens cost?",
        answer: `The input and output columns are already the price of 1 million tokens for the rate named on that row. One million input tokens cost the input rate. One million output tokens cost the output rate. A request that sends both is the sum of those two rates, which is what the calculator computes. ${exampleSentence} Cache, batch, long-context, peak, and prices scheduled after an introductory window are not folded into that sum. When the official page published them, they are in the model note. On the ledger checked ${checked}, the lowest published input rate is ${formatRate(minInput)} per 1M tokens, on ${namedRates(cheapest, "inputUsdPerMillion")}. The highest published input rate is ${formatRate(maxInput)} per 1M tokens, on ${namedRates(dearest, "inputUsdPerMillion")}. ${unpricedSentence}`,
    },
  ];
}

export function homeFaqs(): FaqItem[] {
  return [
    ...sharedPricingFaqs(),
    {
      question: "Why is a price labelled off-peak or introductory?",
      answer:
        "The table keeps one rate per model: the rate named in that row's price label. If the official page's figure is an off-peak rate, an introductory rate, a legacy rate, or a short-prompt rate, the label says so. The note records the other figures on that page, such as peak hours or the price after the introductory date. Those figures stay in the note. They are not dropped, and they are not swapped in for the stored rate.",
    },
  ];
}

export function calculatorFaqs(): FaqItem[] {
  const requests = CALCULATOR_DEFAULTS.requestsPerDay.toLocaleString("en-US");
  const monthly = SAMPLE_WORKLOAD.requestsPerMonth.toLocaleString("en-US");
  return [
    {
      question: "How does the cost calculator work?",
      answer: `It multiplies the input and output rates stored on the model you pick by the token counts you enter, then multiplies that request cost by the number of requests. The form starts at ${CALCULATOR_DEFAULTS.inputTokens.toLocaleString("en-US")} input tokens, ${CALCULATOR_DEFAULTS.outputTokens.toLocaleString("en-US")} output tokens, and ${requests} requests per day. A month is ${DAYS_PER_MONTH} days, so the starting monthly figure is ${monthly} requests. Cached-input prices, batch discounts, and long-context surcharges are not applied. If the stored rate is off-peak or introductory, the estimate uses that labelled rate.`,
    },
    ...sharedPricingFaqs(),
  ];
}
