import Link from "next/link";
import type { Model } from "@/data/models";
import { formatIsoDate, formatRate, formatTokens, statusLabel } from "@/lib/format";
import { providerSlug } from "@/lib/models";

export function RateList({
  rows,
  caption,
  showProvider = true,
  showRank = false,
}: {
  rows: Model[];
  caption: string;
  showProvider?: boolean;
  showRank?: boolean;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-paper-2 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-[13px] text-muted">
            <tr>
              {showRank ? (
                <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                  Rank
                </th>
              ) : null}
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Model
              </th>
              {showProvider ? (
                <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                  Provider
                </th>
              ) : null}
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Input
              </th>
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Output
              </th>
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Rate
              </th>
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Context
              </th>
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Max output
              </th>
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Updated
              </th>
              <th scope="col" className="border-b border-line px-4 py-3 font-medium">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((model, index) => (
              <tr key={model.slug} className="border-b border-line align-top last:border-b-0">
                {showRank ? <td className="num px-4 py-4">{index + 1}</td> : null}
                <th scope="row" className="px-4 py-4 font-medium">
                  <Link href={`/models/${model.slug}`} className="transition-colors hover:text-accent">
                    {model.name}
                  </Link>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    {statusLabel(model.status)}
                    {model.weightsFrom ? ` · ${model.weightsFrom} weights` : ""}
                  </span>
                </th>
                {showProvider ? (
                  <td className="px-4 py-4">
                    <Link
                      href={`/providers/${providerSlug(model.provider)}`}
                      className="transition-colors hover:text-accent"
                    >
                      {model.provider}
                    </Link>
                  </td>
                ) : null}
                <td className="num px-4 py-4">{formatRate(model.inputUsdPerMillion)}</td>
                <td className="num px-4 py-4">{formatRate(model.outputUsdPerMillion)}</td>
                <td className="px-4 py-4 text-muted">{model.priceLabel}</td>
                <td className="num px-4 py-4">{formatTokens(model.contextTokens)}</td>
                <td className="num px-4 py-4">{formatTokens(model.maxOutputTokens)}</td>
                <td className="px-4 py-4 whitespace-nowrap">{formatIsoDate(model.updatedAt)}</td>
                <td className="px-4 py-4">
                  <a
                    href={model.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    <span className="sr-only">{model.name} </span>
                    Price source
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((model, index) => (
          <li key={model.slug} className="rounded-2xl border border-line bg-paper-2 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                {showRank ? <p className="text-xs text-muted">Rank {index + 1}</p> : null}
                <Link href={`/models/${model.slug}`} className="font-medium transition-colors hover:text-accent">
                  {model.name}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {showProvider ? (
                    <Link href={`/providers/${providerSlug(model.provider)}`} className="underline">
                      {model.provider}
                    </Link>
                  ) : (
                    model.provider
                  )}
                  {model.weightsFrom ? ` · ${model.weightsFrom} weights` : ""} · {statusLabel(model.status)}
                </p>
              </div>
              <a href={model.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline">
                <span className="sr-only">{model.name} </span>
                Price source
              </a>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Input</dt>
                <dd className="num">{formatRate(model.inputUsdPerMillion)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Output</dt>
                <dd className="num">{formatRate(model.outputUsdPerMillion)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Context</dt>
                <dd className="num">{formatTokens(model.contextTokens)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Max output</dt>
                <dd className="num">{formatTokens(model.maxOutputTokens)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">{model.priceLabel}</p>
            <p className="mt-1 text-xs text-muted">Updated {formatIsoDate(model.updatedAt)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
