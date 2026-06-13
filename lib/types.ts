// Core domain types for TabZero.
// Single source of truth shared by the API, analyzers, storage, and UI.

export type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

export const GROUP_NAMES = [
  "Build",
  "Submit",
  "Research",
  "Learn",
  "Opportunities",
  "Communication",
  "Distractions",
  "Other",
] as const;

export type GroupName = (typeof GROUP_NAMES)[number];
export type Priority = "high" | "medium" | "low";
export type GroupAction = "keep" | "save" | "close";
export type UrgencyLevel = "low" | "medium" | "high";
export type AnalyzerProvider = "openai" | "gemini" | "mock";

export type AnalyzeTabsRequest = {
  tabs: BrowserTab[];
  goal?: string;
  timeRemaining?: string;
};

export type TabGroup = {
  name: string;
  explanation: string;
  action: GroupAction;
  priority: Priority;
  tabs: BrowserTab[];
};

export type Task = {
  id?: string;
  title: string;
  whyItMatters: string;
  estimatedMinutes: number;
  priority: Priority;
  relatedTabs: BrowserTab[];
  completed?: boolean;
};

export type PanicMode = {
  doNow: string[];
  cut: string[];
  ignore: string[];
  finalSprintPlan: string[];
  minimumViableSubmission: string[];
};

export type FocusBlock = {
  label: string;
  minutes: number;
  instructions: string;
};

export type DistractionCleanup = {
  closeNow: BrowserTab[];
  saveForLater: BrowserTab[];
  keepPinned: BrowserTab[];
};

export type AnalyzeTabsResponse = {
  workspaceId: string;
  title: string;
  goal?: string;
  timeRemaining?: string;
  totalTabs: number;
  urgencyLevel: UrgencyLevel;
  mainProblem: string;
  focusRecommendation: string;
  firstThingToDo: string;
  riskWarning: string;
  estimatedFocusMinutes: number;
  groups: TabGroup[];
  nextTasks: Task[];
  panicMode?: PanicMode;
  focusSession: FocusBlock[];
  distractionCleanup: DistractionCleanup;
  shareSummary: string;
  teammateMessage: string;
  aiReasoning: string[];
};

// The analyzer produces everything except workspaceId (assigned at persist time).
export type Analysis = Omit<AnalyzeTabsResponse, "workspaceId">;

// What storage persists for a workspace.
export type WorkspaceRecord = {
  id: string;
  title: string;
  goal?: string;
  timeRemaining?: string;
  createdAt: string; // ISO timestamp
  updatedAt?: string;
  rawTabs: BrowserTab[];
  analysis: Analysis;
  shareSlug?: string;
  userId?: string; // owner (when accounts are enabled); absent for anonymous workspaces
};
