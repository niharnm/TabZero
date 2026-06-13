import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { getWorkspace } from "@/lib/storage";
import { workspaceToMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workspace = await getWorkspace(id);
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found." },
      { status: 404, headers: apiHeaders() },
    );
  }

  // Optional Markdown export: GET /api/workspace/[id]?format=md
  const format = new URL(request.url).searchParams.get("format");
  if (format === "md" || format === "markdown") {
    return new Response(workspaceToMarkdown(workspace), {
      status: 200,
      headers: {
        ...apiHeaders(),
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="tabzero-${id}.md"`,
      },
    });
  }

  return NextResponse.json({ workspace }, { headers: apiHeaders() });
}
