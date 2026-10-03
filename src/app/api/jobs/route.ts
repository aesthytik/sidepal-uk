import { NextRequest, NextResponse } from "next/server";
import { jobsInfo, searchJobs } from "@/lib/jobs";
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
