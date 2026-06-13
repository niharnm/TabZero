import type {
  Analysis,
  BrowserTab,
  FocusBlock,
  UrgencyLevel,
} from "@/lib/types";

// Parse a free-form "time remaining" string into minutes.
// Handles: "2 hours", "90 min", "1h30m", "1:30", "45 minutes", "tonight" (-> null).
export function parseTimeToMinutes(input?: string): number | null {
  if (!input) return null;
  const text = input.toLowerCase().trim();

  // "1:30" style (hours:minutes)
  const clock = text.match(/^(\d{1,2}):(\d{2})$/);
  if (clock) {
    return parseInt(clock[1], 10) * 60 + parseInt(clock[2], 10);
  }

  let minutes = 0;
  let matched = false;

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  if (hourMatch) {
    minutes += parseFloat(hourMatch[1]) * 60;
    matched = true;
  }

  const minMatch = text.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10);
    matched = true;
  }

  // Bare number with no unit -> assume minutes if small, hours if it reads like "2"
  if (!matched) {
    const bare = text.match(/^(\d+(?:\.\d+)?)$/);
    if (bare) {
      const n = parseFloat(bare[1]);
      // Heuristic: <= 12 likely means hours, otherwise minutes.
      minutes = n <= 12 ? n * 60 : n;
      matched = true;
    }
  }

  if (!matched || minutes <= 0) return null;
  return Math.round(minutes);
}

export function deriveUrgency(
  minutes: number | null,
  hasTimeRemaining: boolean,
): UrgencyLevel {
  if (!hasTimeRemaining || minutes === null) return "low";
  if (minutes <= 60) return "high";
  if (minutes <= 240) return "medium";
  return "low";
}

// Build timed focus blocks from a total minute budget. Deterministic, no AI needed.
export function buildFocusSession(
  totalMinutes: number | null,
  firstThingToDo: string,
): FocusBlock[] {
  // Default to a single 50-minute deep-work block when no time is given.
  if (totalMinutes === null) {
    return [
      {
        label: "Deep Work",
        minutes: 50,
        instructions: `Start here: ${firstThingToDo}`,
      },
      {
        label: "Break",
        minutes: 10,
        instructions: "Step away from the screen. Water, stretch, reset.",
      },
    ];
  }

  const blocks: FocusBlock[] = [];
  let remaining = totalMinutes;

  // Reserve a short final review block when there's enough time.
  const reserveReview = remaining > 30 ? Math.min(15, Math.round(remaining * 0.15)) : 0;
  remaining -= reserveReview;

  if (remaining <= 0) {
    return [
      {
        label: "Final Sprint",
        minutes: totalMinutes,
        instructions: `No time for breaks. Do this now: ${firstThingToDo}`,
      },
    ];
  }

  // Choose a work-block length that scales with available time.
  const workLen = remaining >= 180 ? 50 : remaining >= 90 ? 40 : 25;
  const breakLen = workLen >= 50 ? 10 : 5;

  let blockIndex = 1;
  while (remaining >= workLen + 1) {
    blocks.push({
      label: `Focus Block ${blockIndex}`,
      minutes: workLen,
      instructions:
        blockIndex === 1
          ? `Begin with the highest-priority task: ${firstThingToDo}`
          : "Continue the next high-priority task. No new tabs.",
    });
    remaining -= workLen;
    blockIndex++;
    if (remaining >= breakLen + workLen) {
      blocks.push({
        label: "Break",
        minutes: breakLen,
        instructions: "Quick reset. Do not open distraction tabs.",
      });
      remaining -= breakLen;
    }
  }

  // Fold any leftover time into a final working block.
  if (remaining > 0) {
    blocks.push({
      label: "Wrap-Up Work",
      minutes: remaining,
      instructions: "Tie off the current task. Close anything finished.",
    });
  }

  if (reserveReview > 0) {
    blocks.push({
      label: "Review & Submit",
      minutes: reserveReview,
      instructions:
        "Re-read requirements, verify the work is complete, and submit / save.",
    });
  }

  return blocks;
}

// Normalize / sanitize raw tabs coming from the request or the AI so the rest of
// the app can trust the shape. Drops empty entries.
export function sanitizeTabs(tabs: unknown): BrowserTab[] {
  if (!Array.isArray(tabs)) return [];
  const out: BrowserTab[] = [];
  for (const raw of tabs) {
    if (!raw || typeof raw !== "object") continue;
    const t = raw as Record<string, unknown>;
    const title = typeof t.title === "string" ? t.title.trim() : "";
    const url = typeof t.url === "string" ? t.url.trim() : "";
    if (!title && !url) continue;
    out.push({
      id: typeof t.id === "number" ? t.id : undefined,
      title: title || url,
      url,
      active: Boolean(t.active),
      favIconUrl:
        typeof t.favIconUrl === "string" && t.favIconUrl
          ? t.favIconUrl
          : undefined,
    });
  }
  return out;
}

// Compute distraction counts and other derived stats from an analysis.
export function countDistractions(analysis: Pick<Analysis, "groups">): number {
  const group = analysis.groups.find((g) => g.name === "Distractions");
  return group ? group.tabs.length : 0;
}
