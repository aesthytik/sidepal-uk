import { fetchLocalCsv } from "./fetchCsv";
import { enrichDomain } from "./enrichDomain";
import { classifySector, Sector } from "./classifySector";
import { findCareerUrl } from "./findCareerUrl";
import {
  SponsorRaw,
  Sponsor,
  generateSponsorId,
  extractVisaTypes,
  formatRegion,
} from "./sponsorTypes";
import fs from "fs";
import path from "path";

// Path to store the enriched data
const DATA_DIR = path.join(process.cwd(), "public", "data");
const SPONSORS_FILE = path.join(DATA_DIR, "sponsors.json");
const CACHE_FILE = path.join(DATA_DIR, "enrichment-cache.json");

interface EnrichmentCache {
  domains: Record<string, string>;
  sectors: Record<string, Sector>;
  careerUrls: Record<string, string | null>;
  lastUpdated: string;
}

/**
 * Loads the enrichment cache from disk if it exists
 */
async function loadCache(): Promise<EnrichmentCache> {
  try {
    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Check if cache file exists
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.error("Error loading cache:", error);
  }

  // Return empty cache if file doesn't exist or there was an error
  return {
    domains: {},
    sectors: {},
    careerUrls: {},
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Saves the enrichment cache to disk
 */
async function saveCache(cache: EnrichmentCache): Promise<void> {
  try {
    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Error saving cache:", error);
  }
}

/**
 * Converts raw sponsor data to enriched sponsor objects
 */
export function convertToSponsors(
  rawSponsors: SponsorRaw[],
  domainMap: Map<string, string>,
  sectorMap: Map<string, Sector>,
  careerUrlMap: Map<string, string | null>
): Sponsor[] {
  return rawSponsors.map((raw) => {
    const id = generateSponsorId(raw.name);
    const website = domainMap.get(raw.name) || undefined;
    const sector = sectorMap.get(raw.name);
    const careerUrl = careerUrlMap.get(raw.name) || undefined;

    return {
      id,
      name: raw.name,
      city: raw.city,
      county: raw.county,
      region: formatRegion(raw.city, raw.county),
      route: raw.route,
      rating: raw.rating,
      visaTypes: extractVisaTypes(raw.route),
      sector,
      website,
      careerUrl,
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Main function to process and enrich sponsor data
 */
export async function processSponsorData(): Promise<Sponsor[]> {
  console.log("Starting sponsor data processing...");

  // Step 1: Load cache
  const cache = await loadCache();
  const domainCache = new Map(Object.entries(cache.domains));
  const sectorCache = new Map(Object.entries(cache.sectors)) as Map<
    string,
    Sector
  >;
  const careerUrlCache = new Map(Object.entries(cache.careerUrls));

  // Step 2: Fetch raw sponsor data
  console.log("Fetching sponsor CSV data...");
  const rawSponsors = await fetchLocalCsv();
  console.log(`Fetched ${rawSponsors.length} sponsors from CSV`);

  // Step 3: Use domain cache
  console.log("Loading domain cache...");
  const domainMap = new Map(domainCache);

  // Step 4: Use sector cache
  console.log("Loading sector cache...");
  const sectorMap = new Map(sectorCache);

  // Step 5: Use career URL cache
  console.log("Loading career URL cache...");
  const careerUrlMap = new Map(careerUrlCache);

  // Step 6: Combine all data
  console.log("Combining all data...");
  const sponsors = convertToSponsors(
    rawSponsors,
    domainMap,
    sectorMap,
    careerUrlMap
  );

  // Step 7: Save enriched data
  console.log("Saving enriched data...");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  // Ensure enrichment data is properly persisted
  const enrichedSponsors = sponsors.map((sponsor) => {
    // Get the latest domain from the map
    const website = domainMap.get(sponsor.name);
    return {
      ...sponsor,
      website: website || "unknown",
    };
  });

  fs.writeFileSync(SPONSORS_FILE, JSON.stringify(enrichedSponsors, null, 2));

  // Step 8: Update and save cache with explicit domain data
  console.log("Updating cache...");
  const updatedCache: EnrichmentCache = {
    domains: Object.fromEntries(
      Array.from(domainMap.entries()).filter(
        ([_, domain]) => domain !== "unknown"
      )
    ),
    sectors: Object.fromEntries(sectorMap),
    careerUrls: Object.fromEntries(careerUrlMap),
    lastUpdated: new Date().toISOString(),
  };
  await saveCache(updatedCache);

  console.log("Sponsor data processing complete!");
  return sponsors;
}
