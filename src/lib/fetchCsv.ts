import Papa from "papaparse";

export interface SponsorRaw {
  name: string;
  city: string;
  county: string;
  route: string;
  rating: string;
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
    const uniqueSponsors = Array.from(
      new Map(sponsors.map((sponsor) => [sponsor.name, sponsor])).values()
    );

    return uniqueSponsors;
  } catch (error) {
    console.error("Error fetching or parsing CSV:", error);
    throw error;
  }
}
