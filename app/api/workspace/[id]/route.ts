import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { getWorkspace } from "@/lib/storage";
import { workspaceToMarkdown } from "@/lib/markdown";
import { denyUnlessCanAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workspace = await getWorkspace(id);
  const notFound = () =>
    NextResponse.json(
      { error: "Workspace not found." },
      { status: 404, headers: apiHeaders(request) },
    );
  // Unauthenticated callers get 401 before any existence check.
  const denied = await denyUnlessCanAccess(request, workspace?.userId);
  if (denied) return denied;
  if (!workspace) return notFound();

  // Optional Markdown export: GET /api/workspace/[id]?format=md
  const format = new URL(request.url).searchParams.get("format");
  if (format === "md" || format === "markdown") {
    return new Response(workspaceToMarkdown(workspace), {
      status: 200,
      headers: {
        ...apiHeaders(request),
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="tabzero-${id}.md"`,
      },
    });
  }

  return NextResponse.json({ workspace }, { headers: apiHeaders(request) });
}
