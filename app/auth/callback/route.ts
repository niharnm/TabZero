import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// Exchanges the OAuth / email-confirmation code for a session cookie, then
// redirects to `next` (defaults to the dashboard).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
