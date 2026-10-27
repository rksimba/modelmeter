import { siteConfig } from "@/lib/site";

/**
 * Reserved placement. Renders nothing while sponsored slots are off.
 * When enabled, the Sponsored label is always visible.
 */
export function SponsoredSlot({ placement }: { placement: string }) {
  if (!siteConfig.monetization.sponsoredSlots) return null;

  return (
    <aside
      aria-label="Sponsored"
      data-placement={placement}
      className="rounded-2xl border border-dashed border-accent bg-accent-soft px-5 py-4 text-sm"
    >
      <p className="text-xs font-medium text-accent">Sponsored</p>
      <p className="mt-1 text-ink">Sponsored placement ({placement}) is not configured.</p>
    </aside>
  );
}
