import { models } from "@/data/models";
import { markdownResponse, modelMarkdownDocument } from "@/lib/markdown";

export function generateStaticParams() {
  return models.map((model) => ({ slug: model.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return markdownResponse(modelMarkdownDocument(slug));
}
