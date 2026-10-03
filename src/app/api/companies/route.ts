import { NextRequest, NextResponse } from "next/server";
import { SponsorFilters } from "@/lib/sponsorTypes";
import {
  getSponsorsByIds,
  querySponsors,
  withEnrichment,
} from "@/lib/processSponsorData";

// Reads the register from disk and enrichment from memory, so never cache statically
export const dynamic = "force-dynamic";

function toPositiveInt(value: string | null, fallback: number, max: number) {
  const n = parseInt(value || "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

/**
 * API route to get filtered sponsors.
 * Query params: q, city, county, region, visa, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const limit = toPositiveInt(searchParams.get("limit"), 10, 100);
    const filters: SponsorFilters = {
      city: searchParams.get("city") || undefined,
      county: searchParams.get("county") || undefined,
      region: searchParams.get("region") || undefined,
      visaType: searchParams.get("visa") || undefined,
      query: searchParams.get("q") || undefined,
    };

    const filtered = await querySponsors(filters);
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const page = Math.min(
      toPositiveInt(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER),
      totalPages
    );
    const start = (page - 1) * limit;
    const sponsors = filtered.slice(start, start + limit).map(withEnrichment);

    return NextResponse.json({
      success: true,
      count: filtered.length,
      sponsors,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: filtered.length,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error processing companies request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve companies",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: "ids must be an array" },
        { status: 400 }
      );
    }
    const sponsors = (
      await getSponsorsByIds(
        ids.filter((id): id is string => typeof id === "string").slice(0, 1000)
      )
    ).map(withEnrichment);
    return NextResponse.json({ success: true, count: sponsors.length, sponsors });
  } catch (error) {
    console.error("Error looking up companies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve companies" },
      { status: 500 }
    );
  }
}
