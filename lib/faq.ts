import { DATASET_CHECKED_ON, models, type Model, type ModelStatus } from "@/data/models";
import { formatIsoDate, formatRate, formatTokens, formatUsd, statusLabel } from "@/lib/format";
import { methodologyParagraphs, siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";
import { CALCULATOR_DEFAULTS, DAYS_PER_MONTH, SAMPLE_WORKLOAD, estimateCost } from "@/lib/pricing";
import { markdownVersionsSentence } from "@/lib/markdown";
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

function modelsNamed(rows: readonly Pick<Model, "name" | "provider">[]): string {
  return joinList(rows.map((model) => `${model.name} (${model.provider})`));
}

function byName(rows: readonly Model[]): Model[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name) || a.provider.localeCompare(b.provider));
}

function statusClause(status: ModelStatus, meaning: string): string {
  const rows = byName(models.filter((model) => model.status === status));
  const label = statusLabel(status);
  if (rows.length === 0) {
    return `${label} means ${meaning} No row currently has this status.`;
  }
  return `${label} means ${meaning} Current ${rows.length === 1 ? "row" : "rows"}: ${modelsNamed(rows)}.`;
}

function priceLabelClause(pattern: RegExp, meaning: string): string {
  const rows = byName(models.filter((model) => pattern.test(model.priceLabel)));
  if (rows.length === 0) {
    return `${meaning} No row currently uses a price label like that.`;
  }
  const labels = [...new Set(rows.map((model) => model.priceLabel))];
  const described = labels.map((label) => {
    const named = modelsNamed(rows.filter((model) => model.priceLabel === label));
    return `"${label}" on ${named}`;
  });
  return `${meaning} Current ${labels.length === 1 ? "price label" : "price labels"}: ${joinList(described)}.`;
}

function extremeRateSentence(
  field: "inputUsdPerMillion" | "outputUsdPerMillion",
  label: string,
): string {
  const rows = models.filter((model) => model[field] !== null);
  if (rows.length === 0) return `No model in this ledger has a published ${label} rate.`;
  const min = Math.min(...rows.map((model) => model[field] ?? 0));
  const winners = byName(rows.filter((model) => model[field] === min));
  return `The lowest stored ${label} rate is ${formatRate(min)} per 1M tokens, on ${namedRates(winners, field)}.`;
}

function largestContextSentence(): string {
  const rows = models.filter((model) => model.contextTokens !== null);
  if (rows.length === 0) return "No model in this ledger has a published context window.";
  const max = Math.max(...rows.map((model) => model.contextTokens ?? 0));
  const winners = byName(rows.filter((model) => model.contextTokens === max));
  return `The largest published context window is ${formatTokens(max)} tokens, on ${modelsNamed(winners)}.`;
}

function sponsorshipAnswer(): string {
  const labelled =
    "Sponsored placements are always labelled. When a sponsored placement is shown, it carries a visible Sponsored label.";
  if (siteConfig.monetization.sponsoredSlots) return labelled;
  return `${labelled} Sponsored slots are switched off, so this version shows no sponsored listing.`;
}

/** Questions for /faq. Every figure is read from the ledger or the methodology text. */
export function pageFaqs(): FaqItem[] {
  const origin = getSiteUrl();
  const checked = formatIsoDate(DATASET_CHECKED_ON);
  const unpriced = byName(
    models.filter((model) => model.inputUsdPerMillion === null || model.outputUsdPerMillion === null),
  );
  const unpricedSentence =
    unpriced.length === 0
      ? "Every model in this ledger has a published input rate and a published output rate."
      : `Rows with no published input rate or no published output rate: ${joinList(
          unpriced.map(
            (model) =>
              `${model.name} (${model.provider}, status ${statusLabel(model.status)}, price label "${model.priceLabel}")`,
          ),
        )}.`;
  const updatedDates = [...new Set(models.map((model) => model.updatedAt))].sort();
  const updatedSentence =
    updatedDates.length === 1
      ? `Every row's updated date is ${formatIsoDate(updatedDates[0])}.`
      : `Row updated dates in this ledger are ${joinList(updatedDates.map((date) => formatIsoDate(date)))}.`;
  const hosted = [...models.filter((model) => model.weightsFrom)].sort(
    (a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name),
  );
  const hostedSentence =
    hosted.length === 0
      ? "No row currently sets a weights-from lab."
      : `Current hosted rows: ${joinList(
          hosted.map(
            (model) => `${model.name} is billed by ${model.provider} and the weights are from ${model.weightsFrom}`,
          ),
        )}.`;
  const missingContext = models.filter((model) => model.contextTokens === null).length;
  const missingContextSentence =
    missingContext === 0
      ? "Every model has a published context window."
      : `${missingContext} ${missingContext === 1 ? "model has" : "models have"} no published context window and ${missingContext === 1 ? "is" : "are"} left out.`;

  return [
    {
      question: "How are prices sourced?",
      answer: `${methodologyParagraphs[0]} ${methodologyParagraphs[1]} Each model row links to its source URL and shows the date that row was updated. The check date for the current ledger is ${checked}. The methodology is also written at ${origin}/about.`,
    },
    {
      question: "What does n/a mean?",
      answer: `${methodologyParagraphs[1]} ModelMeter does not estimate a missing price. A missing token price can be a rate the provider does not list on a public page, such as contact sales, or a price the provider removed when it deprecated the model. ${unpricedSentence}`,
    },
    {
      question:
        "What do labels like 'limited', 'preview', 'deprecated', 'off-peak', and 'priced for prompts up to 100K' mean?",
      answer: `${methodologyParagraphs[2]} Status and the price label are different fields. ${statusClause("limited", "the provider has not made the model generally available. The stored rate is still the published figure named in the price label.")} ${statusClause("preview", "the provider marks the model as a preview.")} ${statusClause("deprecated", "the provider has deprecated the model. The note records the retirement date and the replacement when the official page states them.")} ${priceLabelClause(/off-peak/i, "An off-peak price label means the stored input and output rates are the off-peak figures. The note records the peak figures when the official page published them.")} ${priceLabelClause(/100\s*k|100,000/i, "A price label that names a prompt-length band means the stored rate applies to that band. The note records the other band when the official page published it.")}`,
    },
    {
      question: "Why is a hosted open model listed under Together, Groq, or Mistral?",
      answer: `${methodologyParagraphs[3]} weightsFrom shows the lab that trained the weights. ${hostedSentence}`,
    },
    {
      question: "Which is the cheapest model right now?",
      answer: `${extremeRateSentence("inputUsdPerMillion", "input")} ${extremeRateSentence("outputUsdPerMillion", "output")} Rows with no published rate for that column are left out of the ranking. n/a is not treated as zero. The full rankings are at ${origin}/cheapest-ai-api.`,
    },
    {
      question: "Which model has the largest context window?",
      answer: `${largestContextSentence()} ${missingContextSentence} The full ranking is at ${origin}/largest-context-window-ai-models.`,
    },
    {
      question: "How often is data checked?",
      answer: `The dataset records the day it was checked. The current check date is ${checked}. ${updatedSentence} That date is the day the official pages were re-read. It is shown on the home page, the about page, and each model row.`,
    },
    {
      question: "How do I follow price changes?",
      answer: `Dated price changes, new models, and scheduled rates are at ${origin}/price-changes. The RSS feed is ${origin}/price-changes.xml. Machine-readable rows for the whole ledger are at ${origin}/api/models.json. ${markdownVersionsSentence}`,
    },
    {
      question: "Are any listings sponsored?",
      answer: sponsorshipAnswer(),
    },
  ];
}

export function faqsPlainText(items: FaqItem[]): string {
  return ["## FAQ", ...items.flatMap((item) => [`### ${item.question}`, item.answer, ""])].join("\n");
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
