import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { toggleTask } from "@/lib/storage";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return optionsResponse();
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await toggleTask(id, Boolean(body?.completed));

  if (!result) {
    return NextResponse.json(
      { error: "Task not found." },
      { status: 404, headers: apiHeaders() },
    );
  }

  return NextResponse.json(
    { workspaceId: result.workspaceId, task: result.task },
    { headers: apiHeaders() },
  );
}
