import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authEnabled, isProtectedPath } from "@/lib/auth/config";

// Refreshes the Supabase session cookie and gates protected routes.
// No-op when auth is disabled (no Supabase) — the app stays anonymous.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!authEnabled()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Gate protected routes.
  if (isProtectedPath(path) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Bounce signed-in users away from the login page.
  if (path === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
