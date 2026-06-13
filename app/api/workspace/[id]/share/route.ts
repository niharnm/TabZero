import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { ensureShareSlug } from "@/lib/storage";
import { shareUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const slug = await ensureShareSlug(id);

  if (!slug) {
    return NextResponse.json(
      { error: "Workspace not found." },
      { status: 404, headers: apiHeaders() },
    );
  }

  return NextResponse.json(
    { slug, url: shareUrl(slug) },
    { headers: apiHeaders() },
  );
}
