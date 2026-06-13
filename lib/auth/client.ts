import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for the login form (sign in / sign up / OAuth).
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
