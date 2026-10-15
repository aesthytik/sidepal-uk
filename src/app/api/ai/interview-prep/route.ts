import { NextRequest, NextResponse } from "next/server";
import { buildInterviewPrepPrompt, readInterviewPrepInput, validateInterviewPrepResponse } from "@/lib/ai/interviewPrep";
import { lastJsonObject } from "@/lib/ai/json";
import { aiEnabled, complete } from "@/lib/ai/openrouter";
import { allow } from "@/lib/ai/rateLimit";

export const dynamic = "force-dynamic";

// Long, strictly grounded JSON: the larger Nemotron models pass validation most often (checked October 2026);
// the fast Lightning model tends to invent CV quotes, which validation drops.
const PREP_MODELS = ["nvidia/nemotron-3-super-120b-a12b:free", "nvidia/nemotron-3-ultra-550b-a55b:free", "nvidia/nemotron-3.5-lightning:free"];
export const maxDuration = 60;

/** Called only on request. The ad, profile and CV are never stored, cached or logged here. */
export async function POST(request: NextRequest) {
  const input = readInterviewPrepInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "A job title, the job description and your profile or CV are needed" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!allow(`interview-prep:${ip}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  if (!aiEnabled()) return NextResponse.json({ error: "AI is not configured" }, { status: 503 });

  const { system, user } = buildInterviewPrepPrompt(input);
  const parse = (reply: string) => validateInterviewPrepResponse(lastJsonObject(reply), input);
  try {
    // Long JSON replies take free models 20–40s, so all three are asked at once and the first reply that
    // passes validation wins. 55s keeps the whole request inside maxDuration.
    const reply = await complete(system, user, { models: PREP_MODELS, race: true, timeoutMs: 55_000, maxTokens: 4500, accept: (r) => parse(r) !== null });
    const result = parse(reply);
    if (!result) throw new Error("Invalid interview prep reply");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Never log model output or errors that could contain the candidate's CV/profile.
    console.error("AI interview prep failed");
    return NextResponse.json({ error: "AI interview prep failed. Please try again." }, { status: 503 });
  }
}
