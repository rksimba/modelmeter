import Link from "next/link";

const links = [
  { href: "/", label: "Compare" },
  { href: "/calculator", label: "Calculator" },
  { href: "/releases", label: "Releases" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-nav backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
          ModelMeter
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
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
