import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { WorkspaceView } from "@/components/WorkspaceView";
import { getWorkspace } from "@/lib/storage";

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

  return (
    <main>
      <Header />
      <WorkspaceView workspace={workspace} />
    </main>
  );
}
