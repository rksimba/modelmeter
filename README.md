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

Import the git repository. Framework preset: Next.js. The site builds and serves prices with no environment variables. Newsletter contact storage uses `RESEND_API_KEY` and `RESEND_SEGMENT_ID`, which are set in Vercel.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for sitemap, Open Graph, and `llms.txt`. On Vercel this falls back to `VERCEL_PROJECT_PRODUCTION_URL` or `VERCEL_URL`. |
| `NEXT_PUBLIC_VERCEL_ANALYTICS` | Set to `1` to load Vercel Analytics. Off by default. No other tracking is included. |
| `RESEND_API_KEY` | Resend API key. Set in Vercel. The subscribe route uses it only to store a contact. |
| `RESEND_SEGMENT_ID` | Resend segment id. Set in Vercel. Stored contacts are added to this segment. |

Sponsored slots and affiliate links stay off until you change `lib/site.ts`.

## Daily data update

Do this once a day, or whenever a provider announces a price change. Do not copy numbers from another price-comparison site.

1. Open each row’s `sourceUrl` (and `limitsSourceUrl` / `releaseSourceUrl` when those fields are set).
2. Change a number only when the official page shows a different figure. If a value disappears from the page, set that field to `null`.
3. Set `updatedAt` to the day you checked the page, even when the price did not change. Use `YYYY-MM-DD`.
4. Keep `DATASET_CHECKED_ON` in `data/models.ts` on the same day.
5. When a stored price changes, add an entry to the price-change data file, `data/price-changes.ts`. A new model and a scheduled rate that an official page already publishes belong in that file too. `/price-changes` and `/price-changes.xml` read it.
6. Add a model by copying a row. `slug` must be unique. `sourceUrl` must be an `https` page on a host listed in `scripts/verify-data.ts`. Add a new host only when it is that provider’s own site.
7. Run:

```bash
npm run verify-data
npm run build
```

`verify-data` fails if any row is missing `sourceUrl` or `updatedAt`, if a URL is not on the official-host list, or if the cost formula breaks. It prints a warning, and still exits 0, when a row’s `updatedAt` is older than 7 days. Those warnings are the cue to re-check that provider.

8. Commit the data change and push. Vercel rebuilds the static pages from the file.

The calculator, provider pages, same-tier comparisons, cheapest and context rankings, `/sitemap.xml`, `/api/models.json`, `/llms.txt`, and `/llms-full.txt` all read `data/models.ts`. You do not update them separately. `/price-changes`, `/price-changes.xml`, and the price-change section of `/llms-full.txt` read `data/price-changes.ts`.

`sitemap.xml` sets `lastmod` from each row’s `updatedAt` on model pages, from the latest `updatedAt` among a provider’s rows on provider pages, from the later of the two rows on a comparison, and from `DATASET_CHECKED_ON` on the other pages. Set `NEXT_PUBLIC_SITE_URL` to the public origin (for example `https://modelmeter.live`) so canonical URLs, Open Graph URLs, the sitemap, and `llms.txt` use that host. Without it, a Vercel production build uses `VERCEL_PROJECT_PRODUCTION_URL`.

Comparison URLs are chosen in `lib/comparisons.ts`. A pair is two priced models from different providers whose higher input rate is at most 1.5× the lower one, and the same for output. Closer pairs come first, each model appears in at most two pairs, and the list stops at 12. A price change can add or remove a URL on the next build. The pages that remain show the stored rate label, the source link, and the cost of the calculator’s starting workload (2,000 input tokens, 800 output tokens, 1,000 requests per day, 30-day month). Off-peak and introductory rates stay in the cheapest ranking with their labels. They are not dropped and not replaced with another rate from the note.

## What a row means

Prices are USD per 1 million tokens. The number is the specific rate named in `priceLabel` (standard short context, introductory, off-peak, or legacy). Other published rates — long context, batch, peak, cache writes, a future list price — belong in `notes`, not in a second guessed column.

`null` is shown as **n/a**. That means the official page did not publish the value.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Sortable, filterable comparison, plus a visible FAQ |
| `/calculator` | Token and request cost estimate, plus three other models, plus a visible FAQ |
| `/providers` | One link per company that bills an API in the ledger |
| `/providers/[provider]` | That provider’s models, stored rates, rate labels, and sources |
| `/compare` | The same-tier pairs currently produced from the ledger |
| `/compare/[a]-vs-[b]` | One pair: stored rates, source notes, and a sample workload cost |
| `/cheapest-ai-api` | Ranked by stored input rate and, separately, by stored output rate |
| `/largest-context-window-ai-models` | Ranked by the published context window |
| `/releases` | Reverse-chronological releases with source links |
| `/price-changes` | Dated list-price changes, new models, and scheduled rates, newest first |
| `/price-changes.xml` | RSS 2.0 feed of those entries |
| `/models` | Every model in the ledger, with its stored rate and a link to the model page |
| `/models/[slug]` | One model, its rate, limits, source, updated date, and related links |
| `/about` | Methodology and a newsletter form |
| `/sponsor` | Placeholder. No packages or terms |
| `/api/models.json` | Full dataset. `/models.json` permanently redirects here (HTTP 308) |
| `/llms.txt`, `/llms-full.txt` | Plain-text summary for chatbots, including the pages above |
| `/sitemap.xml` | Those pages, with `lastmod` from the ledger dates |
| `/api/subscribe` | Stores a newsletter contact in Resend. Sends no email. Returns 501 when `RESEND_API_KEY` or `RESEND_SEGMENT_ID` is missing. |

## Newsletter and monetisation

`/api/subscribe` validates the email shape, then stores the address as a Resend contact when `RESEND_API_KEY` and `RESEND_SEGMENT_ID` are set. Both variables are set in Vercel. The contact is created with `unsubscribed: false` and added to that segment. A duplicate contact is treated as success. The site never sends email: nothing in this route calls Resend's email API, and no confirmation is sent from the site. If either variable is missing, the route returns HTTP 501, stores nothing, and sends nothing.

`lib/site.ts` holds `sponsoredSlots` and `affiliateLinks`, both `false`. The sponsored and affiliate components render nothing while those flags are false. The footer always carries an affiliate disclosure.
