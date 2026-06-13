import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";
import { authEnabled } from "@/lib/auth/config";

export const metadata = {
  title: "Sign in — TabZero",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/dashboard";
  const ready = authEnabled();

  return (
    <main>
      <Header />
      <section className="relative overflow-hidden px-5 pb-24 pt-24 text-center sm:pt-28">
        <div className="aurora" aria-hidden />
        <div className="aurora-veil" aria-hidden />

        <div className="mx-auto max-w-md animate-fade-up">
          <span className="eyebrow">Account</span>
          <h1 className="h-serif mt-4 text-4xl text-white sm:text-5xl">
            Sign in to TabZero
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm text-white/60">
            Save your workspaces and sync them across the web app, the macOS app,
            and the extension.
          </p>
        </div>

        <div className="mt-8">
          {ready ? (
            <LoginForm next={next} initialError={sp.error} />
          ) : (
            <div className="surface mx-auto max-w-md p-7 text-left">
              <h2 className="font-semibold">Accounts aren&apos;t configured here</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This deployment has no Supabase connection, so TabZero runs in
                anonymous mode — no sign-in needed. Configure Supabase to enable
                accounts and synced workspaces.
              </p>
              <Link href="/new" className="btn-primary mt-5 w-full">
                Use TabZero anonymously <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-white/40">
          Only tab titles and URLs are analyzed — never page contents.
        </p>
      </section>
    </main>
  );
}
