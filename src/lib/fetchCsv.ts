import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";

export interface SponsorRaw {
  name: string;
  city: string;
  county: string;
  route: string;
  rating: string;
}

/**
 * Processes raw CSV text into structured sponsor data
 */
function processCSVText(text: string): SponsorRaw[] {
  // Parse CSV using PapaParse
  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.error("CSV parsing errors:", errors);
  }

  // Transform and normalize the data
  const sponsors: SponsorRaw[] = data
    .filter(
      (row: Record<string, string>) =>
        // Filter out rows without organization name
        row["Organisation Name"] &&
        // Only include Worker routes (not Temporary Worker)
        row["Route"] &&
        row["Route"].includes("Worker")
    )
    .map((row: Record<string, string>) => ({
      name: row["Organisation Name"].trim(),
      city: row["Town/City"] ? row["Town/City"].trim() : "",
      county: row["County"] ? row["County"].trim() : "",
      route: row["Route"] ? row["Route"].trim() : "",
      rating: row["Rating"] ? row["Rating"].trim() : "",
    }));

  // Remove duplicates based on name
  return Array.from(
    new Map(sponsors.map((sponsor) => [sponsor.name, sponsor])).values()
  );
}

/**
 * Reads and parses the local sponsor list CSV file
 */
export async function fetchLocalCsv(): Promise<SponsorRaw[]> {
  try {
    const csvPath = path.join(
      process.cwd(),
      "public/data/2025-05-02_-_Worker_and_Temporary_Worker.csv"
    );
    console.log("Reading local CSV from:", csvPath);
    const text = await fs.readFile(csvPath, "utf-8");
    const allSponsors = processCSVText(text);
    return allSponsors.slice();
  } catch (error) {
    console.error("Error reading or parsing local CSV:", error);
    throw error;
  }
}

/**
 * Fetches the UK government's sponsor list CSV and parses it into structured data
 */
export async function fetchSponsorCsv(): Promise<SponsorRaw[]> {
  try {
    // Get CSV URL from environment variable or use default
    const csvUrl =
      process.env.SPONSOR_CSV_URL ||
      "https://assets.publishing.service.gov.uk/media/68148b58a87f19ba7b3a8286/2025-05-02_-_Worker_and_Temporary_Worker.csv";

    console.log("Fetching CSV from:", csvUrl);
    const res = await fetch(csvUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return processCSVText(text);
  } catch (error) {
    console.error("Error fetching or parsing CSV:", error);
    throw error;
  }
}
