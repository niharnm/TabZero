import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/middleware";

// Next.js 16 proxy (formerly middleware): refreshes the Supabase session and
// gates protected routes. No-op when auth is disabled.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
