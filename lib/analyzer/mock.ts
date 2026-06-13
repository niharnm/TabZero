import type {
  Analysis,
  AnalyzeTabsRequest,
  BrowserTab,
  GroupAction,
  Priority,
  TabGroup,
  Task,
  PanicMode,
} from "@/lib/types";
import { GROUP_NAMES } from "@/lib/types";
import { categorizeTab } from "@/lib/analyzer/categorize";
import {
  buildFocusSession,
  deriveUrgency,
  parseTimeToMinutes,
} from "@/lib/analyzer/shared";
import { cleanDomain } from "@/lib/utils";

// Per-group metadata driving action, priority, and copy.
const GROUP_META: Record<
  string,
  { action: GroupAction; priority: Priority; explanation: string }
> = {
  Build: {
    action: "keep",
    priority: "high",
    explanation: "Code, infrastructure, and developer tooling — your actual work surface.",
  },
  Submit: {
    action: "keep",
    priority: "high",
    explanation: "Submission, judging, and presentation surfaces. Missing these means the work doesn't count.",
  },
  Research: {
    action: "keep",
    priority: "medium",
    explanation: "Reference reading and search. Useful, but easy to over-invest in.",
  },
  Learn: {
    action: "save",
    priority: "medium",
    explanation: "Tutorials and courses. Valuable, but rarely the fastest path to done right now.",
  },
  Opportunities: {
    action: "save",
    priority: "medium",
    explanation: "Careers, applications, and scholarships. Important, but usually not this session's goal.",
  },
  Communication: {
    action: "keep",
    priority: "medium",
    explanation: "Inboxes and chat. Keep one open for coordination; mute the rest.",
  },
  Distractions: {
    action: "close",
    priority: "low",
    explanation: "Entertainment, shopping, and social feeds. These are eating your focus.",
  },
  Other: {
    action: "save",
    priority: "low",
    explanation: "Tabs that don't fit a clear category. Triage or park them.",
  },
};

function titleCaseGoal(goal?: string): string {
  if (!goal) return "Tab Workspace";
  const trimmed = goal.trim();
  if (!trimmed) return "Tab Workspace";
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}

function groupTabs(tabs: BrowserTab[], goal: string): TabGroup[] {
  const buckets = new Map<string, BrowserTab[]>();
  for (const name of GROUP_NAMES) buckets.set(name, []);

  for (const tab of tabs) {
    const name = categorizeTab(tab, goal);
    buckets.get(name)!.push(tab);
  }

  const groups: TabGroup[] = [];
  for (const name of GROUP_NAMES) {
    const groupTabsList = buckets.get(name)!;
    if (groupTabsList.length === 0) continue;
    const meta = GROUP_META[name];
    groups.push({
      name,
      explanation: meta.explanation,
      action: meta.action,
      priority: meta.priority,
      tabs: groupTabsList,
    });
  }
  return groups;
}

function buildTasks(groups: TabGroup[], minutes: number | null): Task[] {
  const tasks: Task[] = [];
  const priorityOrder: Priority[] = ["high", "medium", "low"];

  // Generate one concrete task per high/medium-value working group.
  const taskableGroups = groups
    .filter((g) => ["Build", "Submit", "Research", "Communication", "Opportunities", "Learn"].includes(g.name))
    .sort(
      (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
    );

  const baseEstimate = minutes ? Math.max(15, Math.round(minutes / Math.max(taskableGroups.length, 1))) : 30;

  for (const group of taskableGroups) {
    const top = group.tabs.slice(0, 3);
    const verbs: Record<string, string> = {
      Build: "Make progress on the build using",
      Submit: "Complete and verify your submission via",
      Research: "Pull the key facts you need from",
      Communication: "Clear and reply to what matters in",
      Opportunities: "Advance one application using",
      Learn: "Extract only what unblocks you from",
    };
    const verb = verbs[group.name] ?? "Work through";
    const sample = top.map((t) => cleanDomain(t.url) || t.title).filter(Boolean);
    tasks.push({
      title: `${group.name}: ${verb} ${sample.slice(0, 2).join(", ") || "these tabs"}`,
      whyItMatters: group.explanation,
      estimatedMinutes: Math.min(baseEstimate, group.name === "Build" || group.name === "Submit" ? baseEstimate : Math.round(baseEstimate * 0.75)),
      priority: group.priority,
      relatedTabs: top,
      completed: false,
    });
  }

  // Always include a cleanup task if there are distractions.
  const distractions = groups.find((g) => g.name === "Distractions");
  if (distractions && distractions.tabs.length > 0) {
    tasks.push({
      title: `Close ${distractions.tabs.length} distraction tab${distractions.tabs.length > 1 ? "s" : ""}`,
      whyItMatters: "Removing visible distractions is the cheapest focus win available.",
      estimatedMinutes: 2,
      priority: "high",
      relatedTabs: distractions.tabs.slice(0, 5),
      completed: false,
    });
  }

  return tasks;
}

function buildPanicMode(
  groups: TabGroup[],
  goal: string,
  minutes: number,
): PanicMode {
  const build = groups.find((g) => g.name === "Build")?.tabs ?? [];
  const submit = groups.find((g) => g.name === "Submit")?.tabs ?? [];
  const distractions = groups.find((g) => g.name === "Distractions")?.tabs ?? [];
  const learn = groups.find((g) => g.name === "Learn")?.tabs ?? [];
  const research = groups.find((g) => g.name === "Research")?.tabs ?? [];

  const doNow: string[] = [];
  if (submit.length) doNow.push("Open your submission/judging tab and read the exact requirements.");
  if (build.length) doNow.push("Get the core feature working end-to-end, even if rough.");
  doNow.push(goal ? `Make the smallest version of "${goal}" that is actually finishable in ${minutes} min.` : "Ship the smallest finishable version of your goal.");

  const cut: string[] = [];
  if (learn.length) cut.push(`Stop the ${learn.length} tutorial/course tab${learn.length > 1 ? "s" : ""} — no new learning now.`);
  if (research.length > 2) cut.push("Cap research: you already have enough tabs open to proceed.");
  cut.push("No refactors, no polish, no nice-to-haves.");

  const ignore: string[] = [];
  if (distractions.length) ignore.push(`Ignore all ${distractions.length} distraction tab${distractions.length > 1 ? "s" : ""} entirely.`);
  ignore.push("Ignore non-urgent messages until you've submitted.");

  const finalSprintPlan: string[] = [
    `0–${Math.round(minutes * 0.6)} min: build/finish the core deliverable.`,
    `${Math.round(minutes * 0.6)}–${Math.round(minutes * 0.85)} min: test it works and fix only blockers.`,
    `${Math.round(minutes * 0.85)}–${minutes} min: submit/save and confirm it went through.`,
  ];

  const minimumViableSubmission: string[] = [
    "The single most important feature works without crashing.",
    submit.length ? "It is actually submitted in the right place before the deadline." : "It is saved/exported somewhere safe.",
    "There is a one-line description of what it does.",
  ];

  return { doNow, cut, ignore, finalSprintPlan, minimumViableSubmission };
}

export function mockAnalyze(req: AnalyzeTabsRequest): Analysis {
  const tabs = req.tabs;
  const goal = (req.goal ?? "").trim();
  const hasTimeRemaining = Boolean(req.timeRemaining && req.timeRemaining.trim());
  const minutes = parseTimeToMinutes(req.timeRemaining);
  const urgencyLevel = deriveUrgency(minutes, hasTimeRemaining);

  const groups = groupTabs(tabs, goal);

  const distractions = groups.find((g) => g.name === "Distractions")?.tabs ?? [];
  const build = groups.find((g) => g.name === "Build")?.tabs ?? [];
  const submit = groups.find((g) => g.name === "Submit")?.tabs ?? [];
  const research = groups.find((g) => g.name === "Research")?.tabs ?? [];
  const learn = groups.find((g) => g.name === "Learn")?.tabs ?? [];
  const communication = groups.find((g) => g.name === "Communication")?.tabs ?? [];

  const totalTabs = tabs.length;

  // First concrete action.
  let firstThingToDo: string;
  if (submit.length) {
    firstThingToDo = `Open "${submit[0].title}" and read exactly what's required to submit.`;
  } else if (build.length) {
    firstThingToDo = `Return to "${build[0].title}" and make one concrete change.`;
  } else if (communication.length) {
    firstThingToDo = `Check "${communication[0].title}" for anything blocking you, then close it.`;
  } else if (tabs.length) {
    firstThingToDo = `Pick "${tabs[0].title}" and spend 10 focused minutes on it.`;
  } else {
    firstThingToDo = "Add your open tabs to start a focus plan.";
  }

  const mainProblemParts: string[] = [];
  if (totalTabs >= 15) mainProblemParts.push(`${totalTabs} open tabs is well past where focus breaks down`);
  else if (totalTabs > 0) mainProblemParts.push(`${totalTabs} open tabs to triage`);
  if (distractions.length) mainProblemParts.push(`${distractions.length} are pure distraction`);
  if (build.length && submit.length) mainProblemParts.push("real work is split across building and submitting");
  const mainProblem =
    mainProblemParts.length > 0
      ? `${mainProblemParts.join(", ")}.`
      : "Your tabs are mostly on-task — the work now is execution, not cleanup.";

  const focusRecommendation = goal
    ? `Keep only what moves "${goal}" forward. Close distractions, park learning/opportunities, and work top-priority groups first.`
    : "Close the distraction tabs, keep your build/submit tabs, and work one group at a time.";

  let riskWarning: string;
  if (urgencyLevel === "high") {
    riskWarning = "Time is short. The biggest risk is polishing or researching instead of finishing and submitting.";
  } else if (distractions.length >= 3) {
    riskWarning = `With ${distractions.length} distraction tabs open, the biggest risk is drifting off-task. Close them first.`;
  } else if (learn.length + research.length >= 5) {
    riskWarning = "Lots of reading/learning tabs — the risk is researching forever instead of doing the work.";
  } else {
    riskWarning = "The main risk is context-switching between unrelated tabs. Work one group to completion before moving on.";
  }

  const estimatedFocusMinutes =
    minutes ?? Math.min(180, Math.max(30, (build.length + submit.length + research.length) * 15 + 30));

  const nextTasks = buildTasks(groups, minutes);
  const focusSession = buildFocusSession(minutes, firstThingToDo);
  const panicMode = hasTimeRemaining
    ? buildPanicMode(groups, goal, minutes ?? estimatedFocusMinutes)
    : undefined;

  // Distraction cleanup split.
  const closeNow = distractions;
  const saveForLater = [
    ...learn,
    ...(groups.find((g) => g.name === "Opportunities")?.tabs ?? []),
    ...(groups.find((g) => g.name === "Other")?.tabs ?? []),
  ];
  const keepPinned = [...submit, ...build].slice(0, 5);

  const aiReasoning: string[] = [
    `Categorized ${totalTabs} tab${totalTabs === 1 ? "" : "s"} into ${groups.length} group${groups.length === 1 ? "" : "s"} using domain + title heuristics.`,
    distractions.length
      ? `Flagged ${distractions.length} tab${distractions.length === 1 ? "" : "s"} as distractions${goal ? " (none matched your goal)" : ""}.`
      : "No clear distractions detected.",
    hasTimeRemaining
      ? `Parsed time remaining as ~${minutes ?? estimatedFocusMinutes} min and set urgency to ${urgencyLevel}.`
      : "No time limit given, so planned for a standard deep-work session.",
    `Prioritized ${(build.length + submit.length) || "no"} build/submit tab${build.length + submit.length === 1 ? "" : "s"} as the core work.`,
  ];

  const shareSummary = `${titleCaseGoal(goal)} — ${totalTabs} tabs organized into ${groups.length} groups${
    distractions.length ? `, ${distractions.length} distractions flagged` : ""
  }. Urgency: ${urgencyLevel}.`;

  const teammateMessage = goal
    ? `Heads up — focusing on "${goal}"${hasTimeRemaining ? ` for the next ${req.timeRemaining}` : ""}. Plan: ${firstThingToDo} I'll be heads-down and slow to reply until it's done.`
    : `Going heads-down to clear my tabs and focus. ${firstThingToDo} Slow to reply for a bit.`;

  return {
    title: titleCaseGoal(goal),
    goal: goal || undefined,
    timeRemaining: req.timeRemaining?.trim() || undefined,
    totalTabs,
    urgencyLevel,
    mainProblem,
    focusRecommendation,
    firstThingToDo,
    riskWarning,
    estimatedFocusMinutes,
    groups,
    nextTasks,
    panicMode,
    focusSession,
    distractionCleanup: { closeNow, saveForLater, keepPinned },
    shareSummary,
    teammateMessage,
    aiReasoning,
  };
}
