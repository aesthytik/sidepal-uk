import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, complete } from "@/lib/ai/openrouter";
import { lastJsonObject } from "@/lib/ai/json";
import { allow } from "@/lib/ai/rateLimit";
import { annualGbp } from "@/lib/eligibility/assess";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SYSTEM = `You help UK visa-sponsorship job seekers read a job ad. You are given a title, location, salary and the start of the description (public text only).
Reply with ONLY a JSON object: {"summary": string (max 25 words), "flags": string[] (max 4 short red flags or positives about visa sponsorship, right to work, security clearance, salary, seniority)}.
Be cautious: never promise eligibility, and say "unclear" when the ad doesn't say.`;

const cache = new Map<string, unknown>();

/** Body: { url, title, location?, snippet?, salary? } -> { summary, flags } (public job text only). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const title = str(body?.title, 150);
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!allow(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (!aiEnabled()) return NextResponse.json({ error: "AI is not configured" }, { status: 503 });

  const key = str(body?.url, 300) || title;
  if (cache.has(key)) return NextResponse.json(cache.get(key));

  const pay = annualGbp(body?.salary);
  const prompt = [
    `Title: ${title}`,
    `Location: ${str(body?.location, 100) || "unknown"}`,
    `Salary: ${pay ? `up to £${pay.toLocaleString("en-GB")} a year` : "not shown"}`,
    `Description: ${str(body?.snippet, 700) || "not available"}`,
  ].join("\n");

  try {
    const reply = await complete(SYSTEM, prompt);
    const parsed = lastJsonObject(reply);
    if (!parsed) throw new Error("No JSON in reply");
    const result = {
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : "",
      flags: Array.isArray(parsed.flags)
        ? parsed.flags.filter((f: unknown): f is string => typeof f === "string").slice(0, 4).map((f: string) => f.slice(0, 100))
        : [],
    };
    if (!result.summary && result.flags.length === 0) throw new Error("Empty analysis");
    if (cache.size > 500) cache.clear();
    cache.set(key, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI job check failed:", error);
    return NextResponse.json({ error: "AI check failed" }, { status: 503 });
  }
}
