import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BrowserTab } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract a clean, human-readable domain from a URL.
// "https://www.github.com/foo/bar" -> "github.com"
export function cleanDomain(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    // Not a valid absolute URL — strip protocol/path heuristically.
    const stripped = rawUrl
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();
    return stripped || rawUrl;
  }
}

// A short, deterministic, URL-safe slug generator that does not rely on randomness
// being collision-free — storage layers re-check uniqueness.
const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateSlug(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  return out;
}

export function generateId(): string {
  // Prefer the platform UUID when available (Node 18+, modern browsers).
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${generateSlug(12)}`;
}

export function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const URL_RE = /https?:\/\/[^\s]+/i;
const BARE_DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;

// Parse the /new textarea: one tab per line. Each line can be a raw URL, a bare
// domain, a "Title — url" / "Title | url" pair, or just a tab title. This only
// reads what the user typed — it never fabricates tabs.
export function parseTabsInput(text: string): BrowserTab[] {
  const tabs: BrowserTab[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const urlMatch = line.match(URL_RE);
    if (urlMatch) {
      const url = urlMatch[0].replace(/[)\].,]+$/, "");
      let title = line.replace(urlMatch[0], "").replace(/[\s|—–:\-]+$/, "").replace(/^[\s|—–:\-]+/, "").trim();
      if (!title) title = url;
      tabs.push({ title, url, active: false });
      continue;
    }

    // Bare domain like "github.com/foo" — treat as a URL.
    if (BARE_DOMAIN_RE.test(line)) {
      const url = `https://${line}`;
      tabs.push({ title: line, url, active: false });
      continue;
    }

    // Otherwise it's a plain tab title with no URL.
    tabs.push({ title: line, url: "", active: false });
  }
  return tabs;
}

// Build an absolute share URL when NEXT_PUBLIC_APP_URL is configured, else a relative path.
export function shareUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}/share/${slug}` : `/share/${slug}`;
}
