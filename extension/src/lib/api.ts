import { WEB_APP_URL } from "./config";
import type { BrowserTab } from "./collectTabs";

type AnalyzeResponse = {
  workspaceId?: string;
  workspace?: {
    id?: string;
  };
  error?: string;
};

export async function analyzeTabs(input: {
  tabs: BrowserTab[];
  goal: string;
  timeRemaining: string;
}) {
  const response = await fetch(`${WEB_APP_URL}/api/analyze-tabs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as AnalyzeResponse;
  const workspaceId = data.workspaceId || data.workspace?.id;

  if (!response.ok || !workspaceId) {
    throw new Error(data.error || "TabZero could not create a workspace.");
  }

  return workspaceId;
}

export function workspaceUrl(workspaceId: string) {
  return `${WEB_APP_URL}/workspace/${workspaceId}`;
}
