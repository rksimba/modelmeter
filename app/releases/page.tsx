import type { Metadata } from "next";
import Link from "next/link";
import { models } from "@/data/models";
import { formatMonth, formatRelease, releaseSortValue } from "@/lib/format";

export const metadata: Metadata = {
  title: "Releases",
  description: "Reverse-chronological AI model releases, each linked to the provider announcement.",
};

export const ensureStatic = "navigation";

export default function ReleasesPage() {
  const dated = models
    .filter((model) => model.releaseDate || model.releaseMonth)
    .sort((a, b) => (releaseSortValue(b) ?? "").localeCompare(releaseSortValue(a) ?? ""));
  const undated = models.filter((model) => !model.releaseDate && !model.releaseMonth);

  const groups = new Map<string, typeof dated>();
  for (const model of dated) {
    const key = (model.releaseDate ?? model.releaseMonth ?? "").slice(0, 7);
    const list = groups.get(key) ?? [];
    list.push(model);
    groups.set(key, list);
  }

  return (
    <main className="page page-narrow">
      <header className="pt-6 sm:pt-10">
        <h1 className="display text-5xl text-ink sm:text-6xl">Releases</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Newest first. A month without a day is shown as the month only, because the source did
          not publish a day. Models with no release date on the pages we checked are listed at the
          end.
        </p>
      </header>
      {[...groups.entries()].map(([month, items]) => (
        <section key={month}>
          <h2 className="text-sm font-medium text-muted">
            {formatMonth(month)}
          </h2>
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {items.map((model) => (
              <li key={model.slug} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <Link href={`/models/${model.slug}`} className="font-medium transition-colors hover:text-accent">
                    {model.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {model.provider} · {formatRelease(model)}
                    {model.releaseDate ? "" : " (month only)"}
                  </p>
                </div>
                <a
                  href={model.releaseSourceUrl ?? model.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent underline"
                >
                  Announcement
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <section>
        <h2 className="text-sm font-medium text-muted">
          No day on the source
        </h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {undated.map((model) => (
            <li key={model.slug} className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <Link href={`/models/${model.slug}`} className="transition-colors hover:text-accent">
                {model.provider} — {model.name}
              </Link>
              <a href={model.sourceUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                Source
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
