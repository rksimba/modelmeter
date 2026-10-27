import { models, type Model } from "@/data/models";
import { modelIsPriced } from "@/lib/pricing";

/** How many same-tier pairs the compare pages publish. */
export const COMPARISON_PAIR_LIMIT = 12;

/**
 * A pair is the same tier when the higher published input rate is at most
 * this multiple of the lower one, and the same is true of the output rates.
 */
export const SAME_TIER_RATIO = 1.5;

/** Stop one model from filling the list. Closer pairs are chosen first. */
export const MAX_MODEL_APPEARANCES = 2;

export type ComparisonPair = {
  slug: string;
  a: Model;
  b: Model;
  inputRatio: number;
  outputRatio: number;
};

function rateRatio(left: number, right: number): number {
  const high = Math.max(left, right);
  const low = Math.min(left, right);
  if (low === 0) return high === 0 ? 1 : Number.POSITIVE_INFINITY;
  return high / low;
}

function pairSlug(left: string, right: string): string {
  const [a, b] = [left, right].sort((x, y) => x.localeCompare(y));
  return `${a}-vs-${b}`;
}

/**
 * Cross-provider pairs whose stored input and output rates fall in the same
 * tier. Built only from the ledger. Order is closest rates first.
 */
export function comparisonPairs(): ComparisonPair[] {
  const priced = models.filter(modelIsPriced);
  const candidates: (ComparisonPair & { score: number })[] = [];

  for (let i = 0; i < priced.length; i++) {
    for (let j = i + 1; j < priced.length; j++) {
      const left = priced[i];
      const right = priced[j];
      if (left.provider === right.provider) continue;
      const inputRatio = rateRatio(left.inputUsdPerMillion ?? 0, right.inputUsdPerMillion ?? 0);
      const outputRatio = rateRatio(left.outputUsdPerMillion ?? 0, right.outputUsdPerMillion ?? 0);
      if (inputRatio > SAME_TIER_RATIO || outputRatio > SAME_TIER_RATIO) continue;
      const [a, b] = [left, right].sort((x, y) => x.slug.localeCompare(y.slug));
      candidates.push({
        slug: pairSlug(a.slug, b.slug),
        a,
        b,
        inputRatio,
        outputRatio,
        score: inputRatio - 1 + (outputRatio - 1),
      });
    }
  }

  candidates.sort((left, right) => left.score - right.score || left.slug.localeCompare(right.slug));

  const appearances = new Map<string, number>();
  const picked: ComparisonPair[] = [];
  for (const candidate of candidates) {
    const leftUses = appearances.get(candidate.a.slug) ?? 0;
    const rightUses = appearances.get(candidate.b.slug) ?? 0;
    if (leftUses >= MAX_MODEL_APPEARANCES || rightUses >= MAX_MODEL_APPEARANCES) continue;
    appearances.set(candidate.a.slug, leftUses + 1);
    appearances.set(candidate.b.slug, rightUses + 1);
    picked.push({
      slug: candidate.slug,
      a: candidate.a,
      b: candidate.b,
      inputRatio: candidate.inputRatio,
      outputRatio: candidate.outputRatio,
    });
    if (picked.length === COMPARISON_PAIR_LIMIT) break;
  }
  return picked;
}

export function comparisonBySlug(slug: string): ComparisonPair | undefined {
  return comparisonPairs().find((pair) => pair.slug === slug);
}

/** The same two models with the URL slugs swapped. One canonical URL is published. */
export function comparisonByReversedSlug(slug: string): ComparisonPair | undefined {
  return comparisonPairs().find((pair) => `${pair.b.slug}-vs-${pair.a.slug}` === slug);
}

export function comparisonsForModel(slug: string): ComparisonPair[] {
  return comparisonPairs().filter((pair) => pair.a.slug === slug || pair.b.slug === slug);
}

export function comparisonsForProvider(provider: string): ComparisonPair[] {
  return comparisonPairs().filter(
    (pair) => pair.a.provider === provider || pair.b.provider === provider,
  );
}

export function sameTierRuleSentence(): string {
  return `A pair is two models from different providers whose higher published input rate is at most ${SAME_TIER_RATIO} times the lower one, and whose higher published output rate is at most ${SAME_TIER_RATIO} times the lower one. Closer rates are listed first. Each model is in at most ${MAX_MODEL_APPEARANCES} pairs, and the list stops at ${COMPARISON_PAIR_LIMIT}.`;
}
