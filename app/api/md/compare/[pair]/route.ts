import { comparisonPairs } from "@/lib/comparisons";
import { markdownResponse } from "@/lib/markdown";
import { comparePairMarkdownDocument } from "@/lib/markdown-pages";

export function generateStaticParams() {
  return comparisonPairs().map((pair) => ({ pair: pair.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  return markdownResponse(comparePairMarkdownDocument(pair));
}
