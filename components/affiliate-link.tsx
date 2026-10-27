import { siteConfig } from "@/lib/site";

/**
 * Outbound affiliate link. Renders nothing while affiliate links are off.
 * When enabled, the Affiliate link label is always visible.
 */
export function AffiliateLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  if (!siteConfig.monetization.affiliateLinks) return null;

  return (
    <a
      href={href}
      rel="sponsored noopener noreferrer"
      target="_blank"
      className="inline-flex items-center gap-2 text-sm"
    >
      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
        Affiliate link
      </span>
      <span className="underline">{children}</span>
    </a>
  );
}
