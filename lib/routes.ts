import { DATASET_CHECKED_ON, models } from "@/data/models";
import { comparisonPairs } from "@/lib/comparisons";
import { formatRate } from "@/lib/format";
import { latestUpdate, providerSlug, providers } from "@/lib/models";

export type IndexablePath = {
  path: string;
  lastModified: string;
  title: string;
  summary: string;
};

export function indexablePaths(): IndexablePath[] {
  const checked = DATASET_CHECKED_ON;
  const hubs: IndexablePath[] = [
    {
      path: "/",
      lastModified: checked,
      title: "AI API price comparison",
      summary: "Sortable list prices, context windows, and release dates for every model in the ledger.",
    },
    {
      path: "/calculator",
      lastModified: checked,
      title: "Cost calculator",
      summary: "Estimate a workload from the stored input and output rates. Cache, batch, and long-context rates are not applied.",
    },
    {
      path: "/releases",
      lastModified: checked,
      title: "Releases",
      summary: "Release dates copied from official announcements. Month-only dates stay month-only.",
    },
    {
      path: "/price-changes",
      lastModified: checked,
      title: "AI API price changes",
      summary:
        "Dated changes to stored list prices, new models, and scheduled rates, each linked to the official source. RSS: /price-changes.xml.",
    },
    {
      path: "/about",
      lastModified: checked,
      title: "About",
      summary: "How prices are copied from official provider pages, with a source link and a check date on every row.",
    },
    {
      path: "/sponsor",
      lastModified: checked,
      title: "Sponsor",
      summary: "Sponsorship information is not published yet. No packages or prices.",
    },
    {
      path: "/providers",
      lastModified: checked,
      title: "AI API providers",
      summary: "One page per company that bills an API in this ledger.",
    },
    {
      path: "/models",
      lastModified: checked,
      title: "AI models",
      summary: "Every model in the ledger, with its stored list price, rate label, and source link.",
    },
    {
      path: "/compare",
      lastModified: checked,
      title: "Compare AI API prices",
      summary: "Same-tier pairs across providers, chosen from published input and output rates.",
    },
    {
      path: "/cheapest-ai-api",
      lastModified: checked,
      title: "Cheapest AI API prices",
      summary: "Ranked by the stored input rate and, separately, the stored output rate. Off-peak and introductory labels stay visible.",
    },
    {
      path: "/largest-context-window-ai-models",
      lastModified: checked,
      title: "Largest context window AI models",
      summary: "Ranked by the published context window. Prices keep their rate labels.",
    },
  ];

  const providerPages: IndexablePath[] = providers().map((provider) => {
    const rows = models.filter((model) => model.provider === provider);
    return {
      path: `/providers/${providerSlug(provider)}`,
      lastModified: latestUpdate(rows) || checked,
      title: `${provider} API prices`,
      summary: `${rows.length} ${provider} ${rows.length === 1 ? "model" : "models"} with the stored list price, rate label, and source link.`,
    };
  });

  const comparePages: IndexablePath[] = comparisonPairs().map((pair) => ({
    path: `/compare/${pair.slug}`,
    lastModified:
      pair.a.updatedAt > pair.b.updatedAt ? pair.a.updatedAt : pair.b.updatedAt,
    title: `${pair.a.name} vs ${pair.b.name}`,
    summary: `${pair.a.provider} ${pair.a.name} (${formatRate(pair.a.inputUsdPerMillion)} input, ${formatRate(pair.a.outputUsdPerMillion)} output, ${pair.a.priceLabel}) and ${pair.b.provider} ${pair.b.name} (${formatRate(pair.b.inputUsdPerMillion)} input, ${formatRate(pair.b.outputUsdPerMillion)} output, ${pair.b.priceLabel}).`,
  }));

  const modelPages: IndexablePath[] = models.map((model) => ({
    path: `/models/${model.slug}`,
    lastModified: model.updatedAt,
    title: `${model.name} API price`,
    summary: `${model.provider} ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}).`,
  }));

  return [...hubs, ...providerPages, ...comparePages, ...modelPages];
}
