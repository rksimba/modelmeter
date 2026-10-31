import { markdownResponse, providerMarkdownDocument } from "@/lib/markdown";
import { providerSlug, providers } from "@/lib/models";

export function generateStaticParams() {
  return providers().map((provider) => ({ provider: providerSlug(provider) }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  return markdownResponse(providerMarkdownDocument(provider));
}
