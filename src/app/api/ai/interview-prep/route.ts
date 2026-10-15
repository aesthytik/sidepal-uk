import { NextRequest, NextResponse } from "next/server";
import { buildInterviewPrepPrompt, readInterviewPrepInput, validateInterviewPrepResponse } from "@/lib/ai/interviewPrep";
import { lastJsonObject } from "@/lib/ai/json";
import { aiEnabled, complete } from "@/lib/ai/openrouter";
import { allow } from "@/lib/ai/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Called only on request. The ad, profile and CV are never stored, cached or logged here. */
export async function POST(request: NextRequest) {
  const input = readInterviewPrepInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "A job title, the job description and your profile or CV are needed" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!allow(`interview-prep:${ip}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  if (!aiEnabled()) return NextResponse.json({ error: "AI is not configured" }, { status: 503 });

  const { system, user } = buildInterviewPrepPrompt(input);
  try {
    const result = validateInterviewPrepResponse(lastJsonObject(await complete(system, user, 12_000, 4500)), input);
    if (!result) throw new Error("Invalid interview prep reply");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Never log model output or errors that could contain the candidate's CV/profile.
    console.error("AI interview prep failed");
    return NextResponse.json({ error: "AI interview prep failed. Please try again." }, { status: 503 });
  }
}
