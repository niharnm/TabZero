import Link from "next/link";
import { ArrowRight, Plus, LayoutGrid } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge, urgencyTone } from "@/components/ui";
import { getUser } from "@/lib/auth/server";
import { listWorkspaces } from "@/lib/storage";
import { formatTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your workspaces — TabZero" };

export default async function DashboardPage() {
  const user = await getUser();
  const workspaces = user ? await listWorkspaces(user.id) : [];

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Your workspaces</span>
            <h1 className="h-display mt-3 text-4xl font-semibold sm:text-5xl">
              Welcome back
            </h1>
            {user?.email ? (
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
            ) : null}
          </div>
          <Link href="/new" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> New workspace
          </Link>
        </div>

        {workspaces.length === 0 ? (
          <div className="surface mt-10 flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <LayoutGrid className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold">No workspaces yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Paste your open tabs and TabZero turns them into an organized plan.
              Everything you create is saved to your account.
            </p>
            <Link href="/new" className="btn-primary mt-2">
              Create your first workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((w) => {
              const distractions =
                w.analysis.groups.find((g) => g.name === "Distractions")?.tabs.length ?? 0;
              return (
                <Link
                  key={w.id}
                  href={`/workspace/${w.id}`}
                  className="glass glass-hover group flex flex-col p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={urgencyTone(w.analysis.urgencyLevel)}>
                      {w.analysis.urgencyLevel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(w.createdAt)}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-semibold tracking-tight">
                    {w.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{w.analysis.totalTabs} tabs</span>
                    <span>{w.analysis.groups.length} groups</span>
                    {distractions ? <span>{distractions} distractions</span> : null}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
