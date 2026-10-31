import type { Model } from "@/data/models";
import { formatModalities, formatRate, formatTokens, statusLabel } from "@/lib/format";
import { absoluteUrl } from "@/lib/metadata";
import { getModel, latestUpdate, modelsByProvider, providerFromSlug, providerSlug } from "@/lib/models";
import { formatTokenRates, priceChangesNewestFirst } from "@/lib/price-changes";

/** Shown in llms.txt, llms-full.txt, and the machine-readable FAQ answer. */
export const markdownVersionsSentence =
  "Every model page and every provider page has a Markdown version at the same path with .md appended.";

export function modelMarkdownPath(slug: string): string {
  return `/models/${slug}.md`;
}

export function providerMarkdownPath(slug: string): string {
  return `/providers/${slug}.md`;
}

/** Public Markdown path for a model or provider HTML page, or null for other paths. */
export function markdownAlternatePath(htmlPath: string): string | null {
  if (/^\/models\/[^/]+$/.test(htmlPath)) return `${htmlPath}.md`;
  if (/^\/providers\/[^/]+$/.test(htmlPath)) return `${htmlPath}.md`;
  return null;
}

const MARKDOWN_CACHE_CONTROL = "public, max-age=3600";

export function markdownResponse(body: string | null): Response {
  if (body === null) {
    return new Response("Not found\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": MARKDOWN_CACHE_CONTROL,
      },
    });
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": MARKDOWN_CACHE_CONTROL,
    },
  });
}

function tokenField(value: number | null): string {
  if (value === null) return "n/a";
  return `${formatTokens(value)} tokens`;
}

function releaseField(model: Model): string {
  if (model.releaseDate) return model.releaseDate;
  if (model.releaseMonth) return model.releaseMonth;
  return "n/a";
}

export function modelMarkdownDocument(slug: string): string | null {
  const model = getModel(slug);
  if (!model) return null;

  const lines = [
    `# ${model.provider} ${model.name} API price`,
    "",
    `${model.provider} ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, cached input ${formatRate(model.cachedInputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}).`,
    "",
    `- Input: ${formatRate(model.inputUsdPerMillion)} per 1M tokens`,
    `- Cached input: ${formatRate(model.cachedInputUsdPerMillion)} per 1M tokens`,
    `- Output: ${formatRate(model.outputUsdPerMillion)} per 1M tokens`,
    `- Rate label: ${model.priceLabel}`,
    `- Context window: ${tokenField(model.contextTokens)}`,
    `- Max output: ${tokenField(model.maxOutputTokens)}`,
    `- Modalities: ${formatModalities(model)}`,
    `- Status: ${statusLabel(model.status)}`,
    `- Release date: ${releaseField(model)}`,
    `- API id: ${model.apiId ?? "n/a"}`,
  ];
  if (model.weightsFrom) lines.push(`- Weights from: ${model.weightsFrom}`);
  lines.push("", model.notes, "", "## Sources", "", `- Pricing: ${model.sourceUrl}`);
  if (model.limitsSourceUrl) lines.push(`- Limits: ${model.limitsSourceUrl}`);
  if (model.releaseSourceUrl) lines.push(`- Release: ${model.releaseSourceUrl}`);
  lines.push(
    "",
    `Checked: ${model.updatedAt}`,
    "",
    `Canonical page: ${absoluteUrl(`/models/${model.slug}`)}`,
    "",
    `Dataset: ${absoluteUrl("/api/models.json")}`,
  );

  const changes = priceChangesNewestFirst().filter((change) => change.modelSlug === model.slug);
  if (changes.length > 0) {
    lines.push("", "## Price changes", "");
    for (const change of changes) {
      const also = change.alsoSourceUrl ? ` Also: ${change.alsoSourceUrl}` : "";
      lines.push(
        `- ${change.date} ${change.kind}: ${formatTokenRates(change.oldRates)} -> ${formatTokenRates(change.newRates)} per 1M tokens (input / cached input / output). ${change.note} Source: ${change.sourceUrl}${also}`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function providerMarkdownDocument(slug: string): string | null {
  const provider = providerFromSlug(slug);
  if (!provider) return null;
  const rows = modelsByProvider(provider);
  const lines = [
    `# ${provider} API prices`,
    "",
    `Checked: ${latestUpdate(rows)}`,
    "",
    `${provider} has ${rows.length} ${rows.length === 1 ? "model" : "models"} in this ledger. Each price is the rate named on the row.`,
    "",
  ];
  for (const model of rows) {
    lines.push(
      `- ${model.name}: input ${formatRate(model.inputUsdPerMillion)}, cached input ${formatRate(model.cachedInputUsdPerMillion)}, output ${formatRate(model.outputUsdPerMillion)} per 1M tokens (${model.priceLabel}). Markdown: ${absoluteUrl(modelMarkdownPath(model.slug))} Source: ${model.sourceUrl}`,
    );
  }
  lines.push(
    "",
    `Provider page: ${absoluteUrl(`/providers/${providerSlug(provider)}`)}`,
    "",
    `Dataset: ${absoluteUrl("/api/models.json")}`,
    "",
  );
  return lines.join("\n");
}
