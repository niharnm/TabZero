// Auth is enabled only when the public Supabase env vars are present.
// When disabled, the app runs anonymously with file-based storage (no login).
export function authEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Routes that require a signed-in user when auth is enabled.
export const PROTECTED_PREFIXES = ["/new", "/dashboard", "/workspace"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
