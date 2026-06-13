"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard } from "lucide-react";
import { createBrowserSupabase } from "@/lib/auth/client";

const AUTH = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function Header() {
  // undefined = still loading, null = signed out, string = signed-in email
  const [email, setEmail] = useState<string | null | undefined>(
    AUTH ? undefined : null,
  );

  useEffect(() => {
    if (!AUTH) return;
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkCls =
    "hidden rounded-lg px-3 py-1.5 text-muted-foreground transition hover:text-foreground sm:block";

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
          <Link href="/download" className={linkCls}>
            Download
          </Link>

          {email ? (
            <>
              <Link href="/dashboard" className={linkCls}>
                Workspaces
              </Link>
              <Link
                href="/new"
                className="rounded-lg bg-primary px-3.5 py-1.5 font-medium text-primary-foreground transition hover:brightness-110"
              >
                New workspace
              </Link>
              <span className="ml-1 hidden max-w-[10rem] truncate text-xs text-muted-foreground md:block">
                {email}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  title="Sign out"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground ring-1 ring-inset ring-white/10 transition hover:text-foreground hover:ring-white/20"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : AUTH ? (
            <>
              <Link href="/login" className={linkCls}>
                Sign in
              </Link>
              <Link
                href="/login?next=/new"
                className="rounded-lg bg-white/[0.06] px-3.5 py-1.5 font-medium ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.1]"
              >
                Get started
              </Link>
            </>
          ) : (
            <>
              <Link href="/new" className={linkCls}>
                New workspace
              </Link>
              <Link
                href="/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3.5 py-1.5 font-medium ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.1]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
