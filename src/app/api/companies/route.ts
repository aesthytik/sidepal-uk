import { NextRequest, NextResponse } from "next/server";
import { Sponsor, SponsorFilters } from "@/lib/sponsorTypes";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";

// Using Node.js runtime for file system operations

// Cache control - revalidate every 60 seconds
export const revalidate = 60;

// Path to the sponsors data file
const SPONSORS_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "sponsors.json"
);

// In-memory cache
let sponsorsCache: Sponsor[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Loads sponsors data from file or cache
 */
async function loadSponsors(): Promise<Sponsor[]> {
  const now = Date.now();

  // Return cached data if it's fresh
  if (sponsorsCache && now - lastFetchTime < CACHE_TTL) {
    return sponsorsCache;
  }

  try {
    // Check if the file exists
    if (!fs.existsSync(SPONSORS_FILE)) {
      console.warn("Sponsors data file not found");
      return [];
    }

    // Read and parse the file
    const data = fs.readFileSync(SPONSORS_FILE, "utf-8");
    const sponsors = JSON.parse(data) as Sponsor[];

    // Update cache
    sponsorsCache = sponsors;
    lastFetchTime = now;

    return sponsors;
  } catch (error) {
    console.error("Error loading sponsors data:", error);
    return [];
  }
}

/**
 * Filters sponsors based on provided criteria
 */
function filterSponsors(
  sponsors: Sponsor[],
  filters: SponsorFilters
): Sponsor[] {
  let results = [...sponsors];

  // Filter by sector
  if (filters.sector) {
    results = results.filter((sponsor) => sponsor.sector === filters.sector);
  }

  // Filter by region
  if (filters.region) {
    const regionLower = filters.region.toLowerCase();
    results = results.filter(
      (sponsor) =>
        sponsor.region.toLowerCase().includes(regionLower) ||
        sponsor.city.toLowerCase().includes(regionLower) ||
        sponsor.county.toLowerCase().includes(regionLower)
    );
  }

  // Filter by visa type
  if (filters.visaType) {
    const visaTypeLower = filters.visaType.toLowerCase();
    results = results.filter((sponsor) =>
      sponsor.visaTypes.some((type) =>
        type.toLowerCase().includes(visaTypeLower)
      )
    );
  }

  // Search query using Fuse.js for fuzzy matching
  if (filters.query && filters.query.trim() !== "") {
    const fuse = new Fuse(results, {
      keys: ["name", "city", "county", "region"],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const searchResults = fuse.search(filters.query);
    results = searchResults.map((result: { item: Sponsor }) => result.item);
  }

  return results;
}

/**
 * API route to get filtered sponsors
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: SponsorFilters = {
      sector: searchParams.get("sector") || undefined,
      region: searchParams.get("region") || undefined,
      visaType: searchParams.get("visa") || undefined,
      query: searchParams.get("q") || undefined,
    };

    // Load sponsors data
    const sponsors = await loadSponsors();

    // Apply filters
    const filteredSponsors = filterSponsors(sponsors, filters);

    // Return the results
    return NextResponse.json({
      success: true,
      count: filteredSponsors.length,
      sponsors: filteredSponsors,
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
