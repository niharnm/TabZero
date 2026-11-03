import "server-only";
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth/config";
import { getUser } from "@/lib/auth/server";
import { apiHeaders } from "@/lib/http";

// Ownership gate for private workspace routes. When accounts are enabled the
// caller must be signed in and, if the workspace has an owner, must be that
// owner. Ownerless legacy/anonymous workspaces stay reachable by signed-in
// users (same rule as the workspace page). When accounts are disabled the app
// is anonymous by design and ids are unguessable UUIDs.
// Returns a NextResponse to send back on denial, or null when allowed.
export async function denyUnlessCanAccess(
  request: Request,
  ownerId: string | undefined,
): Promise<NextResponse | null> {
  if (!authEnabled()) return null;
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401, headers: apiHeaders(request) },
    );
  }
  if (ownerId && ownerId !== user.id) {
    // 404 rather than 403 so ids are not confirmed to exist.
    return NextResponse.json(
      { error: "Not found." },
      { status: 404, headers: apiHeaders(request) },
    );
  }
  return null;
}
