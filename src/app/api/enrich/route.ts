import { NextRequest, NextResponse } from "next/server";
import { getSponsors } from "@/lib/directory";
import { isRoleId } from "@/lib/sectors/taxonomy";
import { MAX_BATCH, enrich } from "@/lib/enrichment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Finds websites, careers pages and open roles for the given sponsors.
 * Body: { ids: string[] }  ->  { [id]: Enrichment }
 */
export async function POST(request: NextRequest) {
  try {
    const { ids, role } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
    }
    const sponsors = await getSponsors(
      ids.filter((id): id is string => typeof id === "string").slice(0, MAX_BATCH)
    );
    const byName = await enrich(
      sponsors.map(({ name, city }) => ({ name, city })),
      isRoleId(role) ? role : undefined
    );
    return NextResponse.json(Object.fromEntries(sponsors.map((s) => [s.id, byName[s.name] ?? {}])));
  } catch (error) {
    console.error("Error enriching sponsors:", error);
    return NextResponse.json({ error: "Failed to enrich sponsors" }, { status: 500 });
  }
}
