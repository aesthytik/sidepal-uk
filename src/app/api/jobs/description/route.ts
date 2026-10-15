import { NextRequest, NextResponse } from "next/server";
import { jobByUrl } from "@/lib/jobs";
import { jobDescription } from "@/lib/jobs/description";
import { allow } from "@/lib/ai/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * GET ?url=<job url> -> { text, full }. Only jobs in today's index are looked up, so this can't
 * be used to fetch arbitrary pages. Falls back to the stored snippet (full: false).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!allow(`desc:${ip}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const job = url ? await jobByUrl(url) : null;
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(await jobDescription(job), { headers: { "Cache-Control": "private, max-age=3600" } });
}
