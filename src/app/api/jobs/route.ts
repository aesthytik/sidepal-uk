import { NextRequest, NextResponse } from "next/server";
import { jobsInfo, searchJobs } from "@/lib/jobs";
import { sanitizeProfile } from "@/lib/profile/types";
import { parseSearchParams } from "@/lib/searchParams";

export const dynamic = "force-dynamic";

/**
 * Searches indexed jobs, newest first.
 * Query params: q, location, visa, rating=A, sector, role, sponsored=likely, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const query = parseSearchParams(request.nextUrl.searchParams);
    const limit = Number(request.nextUrl.searchParams.get("limit")) || undefined;
    return NextResponse.json({ ...(await searchJobs({ ...query, limit })), info: await jobsInfo() });
  } catch (error) {
    console.error("Error searching jobs:", error);
    return NextResponse.json({ error: "Failed to search jobs" }, { status: 500 });
  }
}

/**
 * The same search, ranked for one user. Body: { params: "<query string>", profile }.
 * The profile is the derived one (skills, roles, places, pay floor), never CV text,
 * and is posted so it stays out of URLs and logs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const params = new URLSearchParams(typeof body?.params === "string" ? body.params.slice(0, 2000) : "");
    const query = parseSearchParams(params);
    const limit = Number(params.get("limit")) || undefined;
    return NextResponse.json({ ...(await searchJobs({ ...query, limit }, sanitizeProfile(body?.profile))), info: await jobsInfo() });
  } catch (error) {
    console.error("Error ranking jobs:", error);
    return NextResponse.json({ error: "Failed to search jobs" }, { status: 500 });
  }
}
