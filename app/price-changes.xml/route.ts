import { priceChangesRss } from "@/lib/price-changes";

export function GET() {
  return new Response(priceChangesRss(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
