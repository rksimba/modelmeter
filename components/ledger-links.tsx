import Link from "next/link";

const links = [
  { href: "/", label: "Full comparison" },
  { href: "/providers", label: "Prices by provider" },
  { href: "/compare", label: "Same-tier comparisons" },
  { href: "/cheapest-ai-api", label: "Cheapest stored rates" },
  { href: "/largest-context-window-ai-models", label: "Largest context windows" },
  { href: "/calculator", label: "Cost calculator" },
  { href: "/releases", label: "Releases" },
];

export function LedgerLinks({ current }: { current?: string }) {
  const items = links.filter((link) => link.href !== current);
  return (
    <nav aria-label="Related pages">
      <h2 className="text-lg font-medium">More from the ledger</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {items.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-accent underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
