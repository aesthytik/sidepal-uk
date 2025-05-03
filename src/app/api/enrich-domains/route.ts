import { NextRequest, NextResponse } from "next/server";
import { enrichDomain } from "@/lib/enrichDomain";
import fs from "fs";
import path from "path";

const CACHE_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "enrichment-cache.json"
);

export async function POST(request: NextRequest) {
  try {
    const { sponsors } = await request.json();

    if (!Array.isArray(sponsors)) {
      return NextResponse.json(
        { success: false, error: "Invalid sponsors data" },
        { status: 400 }
      );
    }

    // Load existing cache
    let domainCache: Record<string, string> = {};
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      domainCache = cacheData.domains || {};
    }

    // Enrich domains for sponsors not in cache
    const results: Record<string, string> = {};
    const enrichmentPromises = sponsors
      .filter(
        (sponsor) =>
          !domainCache[sponsor.name] || domainCache[sponsor.name] === "unknown"
      )
      .map(async (sponsor) => {
        try {
          const domain = await enrichDomain(sponsor.name, sponsor.city);
          results[sponsor.name] = domain;
          domainCache[sponsor.name] = domain;
          return { name: sponsor.name, success: true };
        } catch (error) {
          console.error(`Error enriching domain for ${sponsor.name}:`, error);
          return { name: sponsor.name, success: false };
        }
      });

    await Promise.all(enrichmentPromises);

    // Update cache file with new domains
    const cacheData = {
      ...JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")),
      domains: domainCache,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

    return NextResponse.json({
      success: true,
      domains: results,
    });
  } catch (error) {
    console.error("Error in domain enrichment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to enrich domains",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
