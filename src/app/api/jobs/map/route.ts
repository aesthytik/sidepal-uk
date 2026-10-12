import { NextRequest, NextResponse } from "next/server";
import { jobMap } from "@/lib/jobs";
import { parseSearchParams } from "@/lib/searchParams";

export const dynamic = "force-dynamic";

/** Matching jobs counted by UK place, for the jobs map. Takes the same filters as /api/jobs. */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await jobMap(parseSearchParams(request.nextUrl.searchParams)), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Error building job map:", error);
    return NextResponse.json({ error: "Failed to load the job map" }, { status: 500 });
  }
}
