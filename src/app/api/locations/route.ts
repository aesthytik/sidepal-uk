import { NextRequest, NextResponse } from "next/server";
import { suggestLocations } from "@/lib/directory";

/** Town and county names that start with (or contain) `q`, busiest first. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(await suggestLocations(q.slice(0, 50)), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
