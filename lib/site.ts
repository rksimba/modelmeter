/**
 * Site-wide switches. Monetisation is off in v1.
 * Flip a flag here only — do not scatter conditionals.
 */
export const siteConfig = {
  name: "ModelMeter",
  description:
    "Public list prices, context limits, and release dates for major AI model APIs. Every figure links to the provider page it came from.",
  monetization: {
    sponsoredSlots: false,
    affiliateLinks: false,
  },
  /** Set NEXT_PUBLIC_VERCEL_ANALYTICS=1 to load Vercel Analytics. Off by default. */
  analytics: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "1",
} as const;

export const methodologyParagraphs = [
  "Prices, context limits, and release dates come only from official provider pricing pages, model cards, changelogs, or announcements. ModelMeter does not copy another aggregator.",
  "Each row stores the source link and the date that source was checked. If a value is not on the official page, it is left empty and shown as n/a.",
  "One number rarely describes every rate a provider charges. The figure in the table is the specific rate named on that row — standard, introductory, off-peak, or legacy. The note records the other published rates, such as long context, batch, peak hours, or a scheduled price change.",
  "Hosted open models are labelled with the company that bills the API. A Together or Groq price is not a Meta list price.",
  "ModelMeter does not sell API access, run benchmarks, or publish reviews.",
] as const;
