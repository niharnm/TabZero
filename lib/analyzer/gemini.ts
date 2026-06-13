import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Analysis, AnalyzeTabsRequest } from "@/lib/types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  extractJson,
  normalizeAnalysis,
} from "@/lib/analyzer/prompt";

export async function geminiAnalyze(
  req: AnalyzeTabsRequest,
): Promise<Analysis> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(buildUserPrompt(req));
  const text = result.response.text();
  const parsed = extractJson(text);
  return normalizeAnalysis(parsed, req);
}
