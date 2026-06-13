import type { Analysis, AnalyzeTabsRequest, AnalyzerProvider } from "@/lib/types";
import { mockAnalyze } from "@/lib/analyzer/mock";

// Provider priority: OpenAI > Gemini > deterministic mock.
export function activeProvider(): AnalyzerProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

// Run analysis using the best available provider, always falling back to the
// deterministic mock analyzer if an AI call fails. The mock analyzer is NOT demo
// data — it analyzes the exact tabs the user provided.
export async function analyzeTabs(
  req: AnalyzeTabsRequest,
): Promise<{ analysis: Analysis; provider: AnalyzerProvider }> {
  const provider = activeProvider();

  try {
    if (provider === "openai") {
      const { openaiAnalyze } = await import("@/lib/analyzer/openai");
      return { analysis: await openaiAnalyze(req), provider };
    }
    if (provider === "gemini") {
      const { geminiAnalyze } = await import("@/lib/analyzer/gemini");
      return { analysis: await geminiAnalyze(req), provider };
    }
  } catch (err) {
    // AI path failed (bad key, rate limit, network). Degrade gracefully.
    console.error(`[tabzero] ${provider} analysis failed, using mock fallback:`, err);
    return { analysis: mockAnalyze(req), provider: "mock" };
  }

  return { analysis: mockAnalyze(req), provider: "mock" };
}
