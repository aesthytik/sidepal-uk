import { NextRequest, NextResponse } from "next/server";
import { Sponsor, SponsorFilters } from "@/lib/sponsorTypes";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import { fetchLocalCsv } from "@/lib/fetchCsv";
import { convertToSponsors } from "@/lib/processSponsorData";

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
    // First try to read from the CSV file directly
    const csvPath = path.join(
      process.cwd(),
      "public",
      "data",
      "2025-05-02_-_Worker_and_Temporary_Worker.csv"
    );

    if (fs.existsSync(csvPath)) {
      const { fetchLocalCsv } = require("@/lib/fetchCsv");
      const rawSponsors = await fetchLocalCsv();

      // Convert raw sponsors to full sponsor objects
      const { convertToSponsors } = require("@/lib/processSponsorData");
      const sponsors = convertToSponsors(
        rawSponsors,
        new Map(),
        new Map(),
        new Map()
      );

      // Cache the results
      sponsorsCache = sponsors;
      lastFetchTime = Date.now();

      return sponsors;
    }

    // Fallback to sponsors.json if CSV not available
    console.log("Attempting to load sponsors from:", SPONSORS_FILE);
    if (!fs.existsSync(SPONSORS_FILE)) {
      console.warn("No sponsor data found");
      return [];
    }

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

  // Filter by sector if specified and company has a sector
  if (filters.sector) {
    // If sector filter is "it", also include companies without a sector as they might be IT companies
    if (filters.sector.toLowerCase() === "it") {
      results = results.filter(
        (sponsor) => !sponsor.sector || sponsor.sector === "it"
      );
    } else {
      results = results.filter((sponsor) => sponsor.sector === filters.sector);
    }
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
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

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSponsors = filteredSponsors.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredSponsors.length / limit);

    console.log({
      total: filteredSponsors.length,
      pageSize: limit,
      totalPages,
      currentPage: page,
    });

    // Return the results
    return NextResponse.json({
      success: true,
      count: filteredSponsors.length,
      totalCount: filteredSponsors.length,
      sponsors: paginatedSponsors,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: filteredSponsors.length,
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
