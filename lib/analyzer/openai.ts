import OpenAI from "openai";
import type { Analysis, AnalyzeTabsRequest } from "@/lib/types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  extractJson,
  normalizeAnalysis,
} from "@/lib/analyzer/prompt";

export async function openaiAnalyze(
  req: AnalyzeTabsRequest,
): Promise<Analysis> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(req) },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJson(content);
  return normalizeAnalysis(parsed, req);
}
