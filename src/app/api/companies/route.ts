import { NextRequest, NextResponse } from "next/server";
import { getSponsors, searchSponsors } from "@/lib/directory";
import { parseSearchParams } from "@/lib/searchParams";

export const dynamic = "force-dynamic";

/**
 * Searches the register.
 * Query params: q, location, visa, rating=A, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const query = parseSearchParams(request.nextUrl.searchParams);
    const limit = Number(request.nextUrl.searchParams.get("limit")) || undefined;
    return NextResponse.json(await searchSponsors({ ...query, limit }));
  } catch (error) {
    console.error("Error searching sponsors:", error);
    return NextResponse.json({ error: "Failed to search sponsors" }, { status: 500 });
  }
}

/**
 * Looks up specific sponsors by id (used by the Saved page).
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
    }
    const valid = ids.filter((id): id is string => typeof id === "string").slice(0, 1000);
    return NextResponse.json({ items: await getSponsors(valid) });
  } catch (error) {
    console.error("Error looking up sponsors:", error);
    return NextResponse.json({ error: "Failed to look up sponsors" }, { status: 500 });
  }
}
