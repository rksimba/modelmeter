import { publicDataset } from "@/lib/plain-text";

export function GET() {
  return Response.json(publicDataset(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
