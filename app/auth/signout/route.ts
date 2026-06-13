import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/auth/server";
import { authEnabled } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (authEnabled()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
