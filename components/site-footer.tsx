import Link from "next/link";
import { DATASET_CHECKED_ON } from "@/data/models";
import { formatIsoDate } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 text-sm leading-6 text-muted sm:px-8">
        <p className="max-w-3xl">
          Affiliate disclosure: ModelMeter does not sell model access. Some outbound
          links may later be affiliate links. None are active in this version. When an
          affiliate link is shown, it carries a visible “Affiliate link” label.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about" className="hover:text-ink">
            Methodology
          </Link>
          <Link href="/sponsor" className="hover:text-ink">
            Sponsor
          </Link>
          <a href="/llms.txt" className="hover:text-ink">
            llms.txt
          </a>
          <a href="/api/models.json" className="hover:text-ink">
            models.json
          </a>
          <span>Prices checked {formatIsoDate(DATASET_CHECKED_ON)}</span>
        </div>
      </div>
    </footer>
  );
}
