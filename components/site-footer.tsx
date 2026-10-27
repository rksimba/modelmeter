import Link from "next/link";
import { DATASET_CHECKED_ON } from "@/data/models";
import { formatIsoDate } from "@/lib/format";
import { providerSlug, providers } from "@/lib/models";

export function SiteFooter() {
  const names = providers();
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 text-sm leading-6 text-muted sm:px-8">
        <p className="max-w-3xl">
          Affiliate disclosure: ModelMeter does not sell model access. Some outbound
          links may later be affiliate links. None are active in this version. When an
          affiliate link is shown, it carries a visible “Affiliate link” label.
        </p>
        <nav aria-label="Providers" className="flex flex-col gap-2">
          <p className="text-ink">Providers</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {names.map((provider) => (
              <li key={provider}>
                <Link href={`/providers/${providerSlug(provider)}`} className="hover:text-ink">
                  {provider}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about" className="hover:text-ink">
            Methodology
          </Link>
          <Link href="/providers" className="hover:text-ink">
            All providers
          </Link>
          <Link href="/compare" className="hover:text-ink">
            Comparisons
          </Link>
          <Link href="/cheapest-ai-api" className="hover:text-ink">
            Cheapest stored rates
          </Link>
          <Link href="/largest-context-window-ai-models" className="hover:text-ink">
            Largest context windows
          </Link>
          <Link href="/calculator" className="hover:text-ink">
            Calculator
          </Link>
          <Link href="/releases" className="hover:text-ink">
            Releases
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
        </nav>
      </div>
    </footer>
  );
}
