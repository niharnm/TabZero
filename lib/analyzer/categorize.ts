import type { BrowserTab, GroupName } from "@/lib/types";
import { cleanDomain } from "@/lib/utils";

// Keyword + domain categorization shared by the mock analyzer.
// Ordering matters: the first rule that matches wins.

function hay(tab: BrowserTab): string {
  return `${tab.title} ${tab.url}`.toLowerCase();
}

function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

// Distraction domains that are only distractions when the goal doesn't make them relevant.
const DISTRACTION_DOMAINS = [
  "tiktok.com",
  "instagram.com",
  "spotify.com",
  "netflix.com",
  "twitch.tv",
  "facebook.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "pinterest.com",
  "9gag.com",
  "hulu.com",
  "disneyplus.com",
];

const SHOPPING_DOMAINS = [
  "amazon.",
  "ebay.com",
  "etsy.com",
  "aliexpress.com",
  "walmart.com",
  "bestbuy.com",
  "target.com",
  "shein.com",
];

const GAME_KEYWORDS = [
  "game",
  "gaming",
  "steam",
  "roblox",
  "minecraft",
  "wordle",
  "chess.com",
  "play online",
  "epicgames",
];

const DISTRACTION_KEYWORDS = [
  "shopping",
  "buy now",
  "add to cart",
  "deal",
  "sale",
  "meme",
  "funny",
];

// Determine whether the goal text makes an otherwise-distracting tab relevant.
function goalMakesRelevant(tab: BrowserTab, goal: string): boolean {
  if (!goal) return false;
  const g = goal.toLowerCase();
  const domain = cleanDomain(tab.url);
  const root = domain.split(".")[0];
  // If the goal explicitly references this platform or its content type, keep it.
  if (root && root.length > 2 && g.includes(root)) return true;
  if (
    domain.includes("youtube") &&
    has(g, ["video", "youtube", "edit", "thumbnail", "channel", "stream"])
  )
    return true;
  if (
    has(g, ["music", "playlist", "song"]) &&
    domain.includes("spotify")
  )
    return true;
  if (has(g, ["shop", "buy", "purchase", "order"]) && SHOPPING_DOMAINS.some((d) => domain.includes(d)))
    return true;
  return false;
}

export function categorizeTab(tab: BrowserTab, goal = ""): GroupName {
  const text = hay(tab);
  const domain = cleanDomain(tab.url);

  // 1. Submit — competition / deliverable surfaces.
  if (
    has(text, [
      "devpost",
      "submission",
      "submit",
      "pitch",
      "judging",
      "judge",
      "presentation",
      "demo day",
      "deliverable",
    ])
  ) {
    return "Submit";
  }

  // 2. Opportunities — careers, applications, money.
  if (
    has(text, [
      "internship",
      "resume",
      "scholarship",
      "career",
      " job",
      "jobs",
      "linkedin",
      "application",
      "apply",
      "handshake",
      "indeed",
      "greenhouse",
      "lever.co",
      "workday",
    ])
  ) {
    return "Opportunities";
  }

  // 3. Communication — inboxes and chat.
  if (
    has(text, [
      "gmail",
      "mail.google",
      "discord",
      "slack",
      "messages",
      "outlook",
      "email",
      "inbox",
      "teams.microsoft",
      "whatsapp",
      "telegram",
    ])
  ) {
    return "Communication";
  }

  // 4. Build — code, infra, dev docs, local servers.
  if (
    has(text, [
      "github.com",
      "gitlab.com",
      "vercel",
      "supabase",
      "firebase",
      "localhost",
      "127.0.0.1",
      "stackoverflow",
      "stack overflow",
      "codesandbox",
      "codepen",
      "replit",
      "npmjs.com",
      "developer.mozilla",
      "vscode",
      "render.com",
      "netlify",
    ]) ||
    has(text, ["/api", "api reference", "api docs", " sdk", "endpoint"]) ||
    has(text, ["localhost:"])
  ) {
    return "Build";
  }

  // 5. Learn — structured learning material (incl. YouTube tutorials).
  if (
    has(text, [
      "khan academy",
      "khanacademy",
      "coursera",
      "udemy",
      "tutorial",
      "how to",
      "crash course",
      "lecture",
      "course",
      "documentation",
      "getting started",
      "guide",
      "freecodecamp",
      "w3schools",
    ]) ||
    (domain.includes("youtube") &&
      has(text, ["tutorial", "how to", "course", "lecture", "explained", "crash course"]))
  ) {
    return "Learn";
  }

  // 6. Research — reference reading and search.
  if (
    has(text, [
      "wikipedia",
      "research",
      "paper",
      "arxiv",
      "scholar.google",
      "article",
      "study",
      "journal",
      "google.com/search",
      "bing.com/search",
      "duckduckgo",
    ])
  ) {
    return "Research";
  }

  // 7. Distractions — only when the goal doesn't make them relevant.
  const isDistraction =
    DISTRACTION_DOMAINS.some((d) => domain.includes(d)) ||
    SHOPPING_DOMAINS.some((d) => domain.includes(d)) ||
    has(text, GAME_KEYWORDS) ||
    has(text, DISTRACTION_KEYWORDS) ||
    // Bare YouTube with no learning signal reads as random viewing.
    (domain.includes("youtube") && !has(text, ["tutorial", "how to", "course", "lecture"]));

  if (isDistraction && !goalMakesRelevant(tab, goal)) {
    return "Distractions";
  }

  // 8. Other — anything we can't confidently place.
  return "Other";
}
