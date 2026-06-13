import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { WorkspaceView } from "@/components/WorkspaceView";
import { getWorkspaceBySlug } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  return (
    <main>
      <Header />
      <WorkspaceView workspace={workspace} readOnly />
    </main>
  );
}
