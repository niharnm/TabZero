import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { getWorkspaceBySlug } from "@/lib/storage";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return optionsResponse();
}

// Public, read-only endpoint for a shared workspace.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);

  if (!workspace) {
    return NextResponse.json(
      { error: "Shared workspace not found." },
      { status: 404, headers: apiHeaders() },
    );
  }

  return NextResponse.json({ workspace }, { headers: apiHeaders() });
}
