import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/extension-disclosures", label: "Extension disclosures" },
  { href: "/support", label: "Support" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">TabZero</p>
          <p className="mt-1">Tab titles and URLs only. Never page contents.</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
