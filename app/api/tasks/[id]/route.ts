import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { getTaskOwner, toggleTask } from "@/lib/storage";
import { denyUnlessCanAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const owner = await getTaskOwner(id);
  const denied = await denyUnlessCanAccess(request, owner?.userId);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const result = await toggleTask(id, Boolean(body?.completed));

  if (!result) {
    return NextResponse.json(
      { error: "Task not found." },
      { status: 404, headers: apiHeaders(request) },
    );
  }

  return NextResponse.json(
    { workspaceId: result.workspaceId, task: result.task },
    { headers: apiHeaders(request) },
  );
}
