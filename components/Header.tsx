import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-[0.7rem] font-bold text-primary-foreground">
            T0
          </span>
          <span className="text-[0.95rem]">TabZero</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/download"
            className="hidden rounded-lg px-3 py-1.5 text-muted-foreground transition hover:text-foreground sm:block"
          >
            Download
          </Link>
          <Link
            href="/new"
            className="hidden rounded-lg px-3 py-1.5 text-muted-foreground transition hover:text-foreground sm:block"
          >
            New workspace
          </Link>
          <Link
            href="/new"
            className="rounded-lg bg-white/[0.06] px-3.5 py-1.5 font-medium ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.1]"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
