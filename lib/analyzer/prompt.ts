import type {
  Analysis,
  AnalyzeTabsRequest,
  TabGroup,
  Task,
} from "@/lib/types";
import { GROUP_NAMES } from "@/lib/types";
import {
  buildFocusSession,
  deriveUrgency,
  parseTimeToMinutes,
  sanitizeTabs,
} from "@/lib/analyzer/shared";
import { mockAnalyze } from "@/lib/analyzer/mock";

// The instruction the AI must follow. We only ever send tab titles + URLs + goal + time.
export const SYSTEM_PROMPT = `You are TabZero's analysis engine. You turn a list of open browser tabs into an organized, actionable focus plan.

You ONLY receive tab titles and URLs, the user's goal, and time remaining. You never receive page contents. Reason only from titles, URLs, goal, and time.

Rules:
- Group every tab into exactly one of these groups: ${GROUP_NAMES.join(", ")}.
- Treat shopping, games, random YouTube, TikTok, Instagram, Spotify, Netflix, Amazon, and social feeds as Distractions UNLESS the goal clearly makes them relevant.
- If time remaining is short, give direct, decisive cut/keep advice. Favor finishing over polishing.
- Tasks must be concrete and tied to the user's actual tabs.
- Be honest and specific. No filler, no fake encouragement.
- Respond with STRICT, VALID JSON only — no markdown, no commentary, no code fences.`;

// The exact JSON shape we want back.
const SCHEMA_HINT = `Return JSON with exactly this shape (omit panicMode only if there is no time remaining):
{
  "title": string,
  "goal": string | null,
  "timeRemaining": string | null,
  "totalTabs": number,
  "urgencyLevel": "low" | "medium" | "high",
  "mainProblem": string,
  "focusRecommendation": string,
  "firstThingToDo": string,
  "riskWarning": string,
  "estimatedFocusMinutes": number,
  "groups": [{ "name": string, "explanation": string, "action": "keep"|"save"|"close", "priority": "high"|"medium"|"low", "tabs": [{ "title": string, "url": string, "active": boolean, "favIconUrl": string|null }] }],
  "nextTasks": [{ "title": string, "whyItMatters": string, "estimatedMinutes": number, "priority": "high"|"medium"|"low", "relatedTabs": [tab], "completed": false }],
  "panicMode": { "doNow": string[], "cut": string[], "ignore": string[], "finalSprintPlan": string[], "minimumViableSubmission": string[] },
  "focusSession": [{ "label": string, "minutes": number, "instructions": string }],
  "distractionCleanup": { "closeNow": [tab], "saveForLater": [tab], "keepPinned": [tab] },
  "shareSummary": string,
  "teammateMessage": string,
  "aiReasoning": string[]
}`;

export function buildUserPrompt(req: AnalyzeTabsRequest): string {
  const tabLines = req.tabs
    .map((t, i) => `${i + 1}. ${t.title || "(untitled)"} — ${t.url || "(no url)"}${t.active ? " [active]" : ""}`)
    .join("\n");

  return `GOAL: ${req.goal?.trim() || "(none provided)"}
TIME REMAINING: ${req.timeRemaining?.trim() || "(none provided)"}
NUMBER OF TABS: ${req.tabs.length}

TABS:
${tabLines || "(no tabs)"}

${SCHEMA_HINT}`;
}

// Validate and backfill the AI's JSON into a guaranteed-valid Analysis.
// Anything the model omits or malforms is repaired deterministically so the UI
// always renders. We never invent tabs that the user didn't provide.
export function normalizeAnalysis(
  raw: unknown,
  req: AnalyzeTabsRequest,
): Analysis {
  // Fallback skeleton computed deterministically from the real input.
  const fallback = mockAnalyze(req);
  if (!raw || typeof raw !== "object") return fallback;

  const r = raw as Record<string, unknown>;
  const minutes = parseTimeToMinutes(req.timeRemaining);
  const hasTimeRemaining = Boolean(req.timeRemaining && req.timeRemaining.trim());

  const str = (v: unknown, d: string): string =>
    typeof v === "string" && v.trim() ? v : d;
  const num = (v: unknown, d: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : d;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];

  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
    typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : d;

  const normGroups: TabGroup[] = Array.isArray(r.groups)
    ? (r.groups as unknown[])
        .map((g): TabGroup | null => {
          if (!g || typeof g !== "object") return null;
          const gg = g as Record<string, unknown>;
          const tabs = sanitizeTabs(gg.tabs);
          if (tabs.length === 0) return null;
          return {
            name: str(gg.name, "Other"),
            explanation: str(gg.explanation, ""),
            action: oneOf(gg.action, ["keep", "save", "close"] as const, "save"),
            priority: oneOf(gg.priority, ["high", "medium", "low"] as const, "medium"),
            tabs,
          };
        })
        .filter((x): x is TabGroup => x !== null)
    : [];

  const normTasks: Task[] = Array.isArray(r.nextTasks)
    ? (r.nextTasks as unknown[])
        .map((t): Task | null => {
          if (!t || typeof t !== "object") return null;
          const tt = t as Record<string, unknown>;
          const title = str(tt.title, "");
          if (!title) return null;
          return {
            title,
            whyItMatters: str(tt.whyItMatters, ""),
            estimatedMinutes: num(tt.estimatedMinutes, 20),
            priority: oneOf(tt.priority, ["high", "medium", "low"] as const, "medium"),
            relatedTabs: sanitizeTabs(tt.relatedTabs),
            completed: false,
          };
        })
        .filter((x): x is Task => x !== null)
    : [];

  const groups = normGroups.length > 0 ? normGroups : fallback.groups;
  const nextTasks = normTasks.length > 0 ? normTasks : fallback.nextTasks;

  const focusSessionRaw = Array.isArray(r.focusSession)
    ? (r.focusSession as unknown[])
        .map((b) => {
          if (!b || typeof b !== "object") return null;
          const bb = b as Record<string, unknown>;
          return {
            label: str(bb.label, "Focus Block"),
            minutes: num(bb.minutes, 25),
            instructions: str(bb.instructions, ""),
          };
        })
        .filter((x): x is { label: string; minutes: number; instructions: string } => x !== null)
    : [];
  const focusSession =
    focusSessionRaw.length > 0
      ? focusSessionRaw
      : buildFocusSession(minutes, fallback.firstThingToDo);

  const dcRaw = (r.distractionCleanup ?? {}) as Record<string, unknown>;
  const distractionCleanup = {
    closeNow: sanitizeTabs(dcRaw.closeNow),
    saveForLater: sanitizeTabs(dcRaw.saveForLater),
    keepPinned: sanitizeTabs(dcRaw.keepPinned),
  };
  const cleanupEmpty =
    distractionCleanup.closeNow.length === 0 &&
    distractionCleanup.saveForLater.length === 0 &&
    distractionCleanup.keepPinned.length === 0;

  let panicMode: Analysis["panicMode"];
  if (hasTimeRemaining) {
    const pm = (r.panicMode ?? {}) as Record<string, unknown>;
    const hasAny =
      strArr(pm.doNow).length ||
      strArr(pm.cut).length ||
      strArr(pm.ignore).length ||
      strArr(pm.finalSprintPlan).length ||
      strArr(pm.minimumViableSubmission).length;
    panicMode = hasAny
      ? {
          doNow: strArr(pm.doNow),
          cut: strArr(pm.cut),
          ignore: strArr(pm.ignore),
          finalSprintPlan: strArr(pm.finalSprintPlan),
          minimumViableSubmission: strArr(pm.minimumViableSubmission),
        }
      : fallback.panicMode;
  } else {
    panicMode = undefined;
  }

  return {
    title: str(r.title, fallback.title),
    goal: req.goal?.trim() || undefined,
    timeRemaining: req.timeRemaining?.trim() || undefined,
    totalTabs: req.tabs.length,
    urgencyLevel: oneOf(
      r.urgencyLevel,
      ["low", "medium", "high"] as const,
      deriveUrgency(minutes, hasTimeRemaining),
    ),
    mainProblem: str(r.mainProblem, fallback.mainProblem),
    focusRecommendation: str(r.focusRecommendation, fallback.focusRecommendation),
    firstThingToDo: str(r.firstThingToDo, fallback.firstThingToDo),
    riskWarning: str(r.riskWarning, fallback.riskWarning),
    estimatedFocusMinutes: num(r.estimatedFocusMinutes, fallback.estimatedFocusMinutes),
    groups,
    nextTasks,
    panicMode,
    focusSession,
    distractionCleanup: cleanupEmpty ? fallback.distractionCleanup : distractionCleanup,
    shareSummary: str(r.shareSummary, fallback.shareSummary),
    teammateMessage: str(r.teammateMessage, fallback.teammateMessage),
    aiReasoning: strArr(r.aiReasoning).length ? strArr(r.aiReasoning) : fallback.aiReasoning,
  };
}

// Best-effort JSON extraction from a model response that may include stray text.
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Find the outermost JSON object.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
