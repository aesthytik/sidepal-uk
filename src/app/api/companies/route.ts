import { NextRequest, NextResponse } from "next/server";
import { Sponsor, SponsorFilters } from "@/lib/sponsorTypes";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import { Sector } from "@/lib/classifySector";
import { fetchLocalCsv as fetchCsv } from "@/lib/fetchCsv";
import { convertToSponsors as convert } from "@/lib/processSponsorData";

// Using Node.js runtime for file system operations

// Cache control - revalidate every 60 seconds
export const revalidate = 60;

// Path to the sponsors data file
const DATA_DIR = path.join(process.cwd(), "public", "data");
const SPONSORS_FILE = path.join(DATA_DIR, "sponsors.json");
const CACHE_FILE = path.join(DATA_DIR, "enrichment-cache.json");

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

    // Load enrichment cache if it exists
    let domainMap = new Map<string, string>();
    let sectorMap = new Map<string, Sector>();
    let careerUrlMap = new Map<string, string | null>();

    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      domainMap = new Map<string, string>(Object.entries(cacheData.domains));
      sectorMap = new Map<string, Sector>(Object.entries(cacheData.sectors));
      careerUrlMap = new Map<string, string | null>(
        Object.entries(cacheData.careerUrls)
      );
    }

    if (fs.existsSync(csvPath)) {
      const rawSponsors = await fetchCsv();

      // Convert raw sponsors to full sponsor objects with enrichment data
      const sponsors = convert(rawSponsors, domainMap, sectorMap, careerUrlMap);

      // Update cache with enriched data and timestamps
      const enrichedSponsors: Sponsor[] = sponsors.map((sponsor: Sponsor) => ({
        ...sponsor,
        lastUpdated: new Date().toISOString(),
        website: domainMap.get(sponsor.name) || "unknown",
      }));
      sponsorsCache = enrichedSponsors;
      lastFetchTime = Date.now();

      // Save updated enrichment cache
      const updatedCache = {
        domains: Object.fromEntries(domainMap),
        sectors: Object.fromEntries(sectorMap),
        careerUrls: Object.fromEntries(careerUrlMap),
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

      return enrichedSponsors;
    }

    // Fallback to sponsors.json if CSV not available
    console.log("Attempting to load sponsors from:", SPONSORS_FILE);
    if (!fs.existsSync(SPONSORS_FILE)) {
      console.warn("No sponsor data found");
      return [];
    }

    // Load JSON data and enrich with cached domains
    const data = fs.readFileSync(SPONSORS_FILE, "utf-8");
    const sponsors = JSON.parse(data) as Sponsor[];

    // Ensure we have the latest enrichment data
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      const domainMap = new Map<string, string>(
        Object.entries(cacheData.domains)
      );

      // Update sponsor websites from cache
      sponsors.forEach((sponsor) => {
        const cachedDomain = domainMap.get(sponsor.name);
        if (typeof cachedDomain === "string") {
          sponsor.website = cachedDomain;
        }
      });
    }

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

  // Filter by city
  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    results = results.filter((sponsor) =>
      sponsor.city.toLowerCase().includes(cityLower)
    );
  }

  // Filter by county
  if (filters.county) {
    const countyLower = filters.county.toLowerCase();
    results = results.filter(
      (sponsor) => sponsor.county?.toLowerCase().includes(countyLower) // Check for county existence
    );
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
      // sector: searchParams.get("sector") || undefined, // Removed sector
      city: searchParams.get("city") || undefined, // Added city
      county: searchParams.get("county") || undefined, // Added county
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

    // Return the results with website field included
    return NextResponse.json({
      success: true,
      count: filteredSponsors.length,
      totalCount: filteredSponsors.length,
      sponsors: paginatedSponsors.map((sponsor) => ({
        ...sponsor,
        website: sponsor.website || "unknown",
      })),
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
