import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { ensureShareSlug, getWorkspace } from "@/lib/storage";
import { denyUnlessCanAccess } from "@/lib/auth/access";
import { shareUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workspace = await getWorkspace(id);
  const denied = await denyUnlessCanAccess(request, workspace?.userId);
  if (denied) return denied;
  const slug = workspace ? await ensureShareSlug(id) : null;

  if (!slug) {
    return NextResponse.json(
      { error: "Workspace not found." },
      { status: 404, headers: apiHeaders(request) },
    );
  }

  return NextResponse.json(
    { slug, url: shareUrl(slug) },
    { headers: apiHeaders(request) },
  );
}
