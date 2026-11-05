// CORS: only the app's own origin and explicitly configured origins (e.g. the
// extension, chrome-extension://<id>) are echoed back. The extension itself is
// covered by its manifest host permissions and does not need CORS.
function allowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const add = (value: string | undefined) => {
    if (!value) return;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore malformed entries
    }
  };
  add(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.NODE_ENV !== "production") add("http://localhost:3000");
  for (const entry of (process.env.TABZERO_ALLOWED_ORIGINS ?? "").split(",")) {
    add(entry.trim());
  }
  return origins;
}

export function apiHeaders(request?: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
  const origin = request?.headers.get("origin");
  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function optionsResponse(request?: Request) {
  return new Response(null, {
    status: 204,
    headers: apiHeaders(request),
  });
}
