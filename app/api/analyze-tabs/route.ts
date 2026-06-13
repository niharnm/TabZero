import { NextResponse } from "next/server";
import { apiHeaders, optionsResponse } from "@/lib/http";
import { analyzeTabs } from "@/lib/analyzer";
import { sanitizeTabs } from "@/lib/analyzer/shared";
import { createWorkspace } from "@/lib/storage";
import { getUser } from "@/lib/auth/server";
import type { AnalyzeTabsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tabs = sanitizeTabs(body?.tabs);

    if (tabs.length === 0) {
      return NextResponse.json(
        { error: "Add at least one real tab title or URL to analyze." },
        { status: 400, headers: apiHeaders() },
      );
    }

    const goal = typeof body?.goal === "string" ? body.goal : undefined;
    const timeRemaining =
      typeof body?.timeRemaining === "string" ? body.timeRemaining : undefined;

    const { analysis } = await analyzeTabs({ tabs, goal, timeRemaining });
    const user = await getUser();
    const record = await createWorkspace({
      rawTabs: tabs,
      analysis,
      userId: user?.id,
    });

    const response: AnalyzeTabsResponse = {
      workspaceId: record.id,
      ...record.analysis,
    };

    return NextResponse.json(response, { headers: apiHeaders() });
  } catch (error) {
    console.error("[tabzero] analyze-tabs failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze tabs." },
      { status: 500, headers: apiHeaders() },
    );
  }
}
