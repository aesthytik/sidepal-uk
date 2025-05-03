import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
const CACHE_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "enrichment-cache.json"
);

/**
 * API route to check the health of the application
 * Returns the status and last update timestamp
 */
export async function GET() {
  try {
    let lastUpdate = null;
    let sponsorCount = 0;

    // Check if the sponsors file exists and get its last update time
    if (fs.existsSync(SPONSORS_FILE)) {
      const stats = fs.statSync(SPONSORS_FILE);
      lastUpdate = stats.mtime.toISOString();

      // Get the sponsor count
      try {
        const data = fs.readFileSync(SPONSORS_FILE, "utf-8");
        const sponsors = JSON.parse(data);
        sponsorCount = Array.isArray(sponsors) ? sponsors.length : 0;
      } catch (error) {
        console.error("Error reading sponsors file:", error);
      }
    } else if (fs.existsSync(CACHE_FILE)) {
      // If sponsors file doesn't exist but cache does, use cache last update time
      const stats = fs.statSync(CACHE_FILE);
      lastUpdate = stats.mtime.toISOString();
    }

    return NextResponse.json({
      status: "ok",
      lastUpdate,
      sponsorCount,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking health:", error);

    return NextResponse.json(
      {
        status: "error",
        error: "Failed to check health",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
