import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase is optional. When the env vars are missing we fall back to in-memory
// storage (see lib/storage.ts), so these helpers must tolerate absence.

export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

let cached: SupabaseClient | null = null;

// Server-side client. Prefers the service-role key (bypasses RLS for writes),
// falling back to the anon key if that's all that's configured.
export function getSupabaseServer(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
