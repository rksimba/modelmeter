import Link from "next/link";

const links = [
  { href: "/", label: "Compare" },
  { href: "/providers", label: "Providers" },
  { href: "/models", label: "Models" },
  { href: "/compare", label: "Comparisons" },
  { href: "/cheapest-ai-api", label: "Cheapest" },
  { href: "/largest-context-window-ai-models", label: "Context" },
  { href: "/calculator", label: "Calculator" },
  { href: "/releases", label: "Releases" },
  { href: "/price-changes", label: "Price changes" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-nav backdrop-blur-xl">
      <div className="mx-auto flex min-h-12 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2 sm:px-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
          ModelMeter
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
