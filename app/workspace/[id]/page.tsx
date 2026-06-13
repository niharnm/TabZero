import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { WorkspaceView } from "@/components/WorkspaceView";
import { getWorkspace } from "@/lib/storage";
import { getUser } from "@/lib/auth/server";
import { authEnabled } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getWorkspace(id);
  if (!workspace) {
    notFound();
  }

  // When accounts are on, a workspace owned by someone else is not viewable here
  // (it can still be shared read-only via /share/[slug]). Anonymous (ownerless)
  // workspaces remain viewable.
  if (authEnabled() && workspace.userId) {
    const user = await getUser();
    if (workspace.userId !== user?.id) {
      notFound();
    }
  }

  return (
    <main>
      <Header />
      <WorkspaceView workspace={workspace} />
    </main>
  );
}
