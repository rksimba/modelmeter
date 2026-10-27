# ModelMeter

Public ledger of AI model API list prices, context limits, and release dates. Prices are copied from official provider pages into `data/models.ts`. There is no database.

## Run locally

```bash
npm install
npm run dev
```

The dev server in this repo is started on port **43123**:

```bash
npm run dev -- --port 43123
```

`npm run build` prerenders the pages. `npm run verify-data` checks the dataset.

## Deploy on Vercel

Import the git repository. Framework preset: Next.js. No environment variables are required.

Optional:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for sitemap, Open Graph, and `llms.txt`. On Vercel this falls back to `VERCEL_PROJECT_PRODUCTION_URL` or `VERCEL_URL`. |
| `NEXT_PUBLIC_VERCEL_ANALYTICS` | Set to `1` to load Vercel Analytics. Off by default. No other tracking is included. |

Sponsored slots and affiliate links stay off until you change `lib/site.ts`.

## Daily data update

Do this once a day, or whenever a provider announces a price change. Do not copy numbers from another price-comparison site.

1. Open each row’s `sourceUrl` (and `limitsSourceUrl` / `releaseSourceUrl` when those fields are set).
2. Change a number only when the official page shows a different figure. If a value disappears from the page, set that field to `null`.
3. Set `updatedAt` to the day you checked the page, even when the price did not change. Use `YYYY-MM-DD`.
4. Keep `DATASET_CHECKED_ON` in `data/models.ts` on the same day.
5. Add a model by copying a row. `slug` must be unique. `sourceUrl` must be an `https` page on a host listed in `scripts/verify-data.ts`. Add a new host only when it is that provider’s own site.
6. Run:

```bash
npm run verify-data
npm run build
```

`verify-data` fails if any row is missing `sourceUrl` or `updatedAt`, if a URL is not on the official-host list, or if the cost formula breaks. It prints a warning, and still exits 0, when a row’s `updatedAt` is older than 7 days. Those warnings are the cue to re-check that provider.

7. Commit the data change and push. Vercel rebuilds the static pages from the file.

The calculator, `/api/models.json`, `/llms.txt`, and `/llms-full.txt` all read the same file. You do not update them separately.

## What a row means

Prices are USD per 1 million tokens. The number is the specific rate named in `priceLabel` (standard short context, introductory, off-peak, or legacy). Other published rates — long context, batch, peak, cache writes, a future list price — belong in `notes`, not in a second guessed column.

`null` is shown as **n/a**. That means the official page did not publish the value.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Sortable, filterable comparison |
| `/calculator` | Token and request cost estimate, plus three other models |
| `/releases` | Reverse-chronological releases with source links |
| `/models/[slug]` | One model, its rate, limits, source, and updated date |
| `/about` | Methodology and a newsletter form |
| `/sponsor` | Placeholder. No packages or terms |
| `/api/models.json` | Full dataset |
| `/llms.txt`, `/llms-full.txt` | Plain-text summary for chatbots |
| `/api/subscribe` | Newsletter stub. It stores nothing and sends nothing |

## Newsletter and monetisation

`/api/subscribe` validates the email shape and returns HTTP 501. Wire Resend later inside that route. Until then the form tells the visitor the address was not stored.

`lib/site.ts` holds `sponsoredSlots` and `affiliateLinks`, both `false`. The sponsored and affiliate components render nothing while those flags are false. The footer always carries an affiliate disclosure.
