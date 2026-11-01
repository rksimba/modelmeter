import { HUB_MARKDOWN_PAGES } from "@/lib/markdown-paths";
import { hubPageMarkdown } from "@/lib/markdown-pages";
import { markdownResponse } from "@/lib/markdown";

export function generateStaticParams() {
  return HUB_MARKDOWN_PAGES.map((entry) => ({ page: entry.page }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  const { page } = await params;
  return markdownResponse(hubPageMarkdown(page));
}
