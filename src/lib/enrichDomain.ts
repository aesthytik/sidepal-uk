import OpenAI from "openai";
import axios from "axios";
import dns from "dns/promises";

// Initialize OpenAI client (kept as fallback)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Google API setup
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CSE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || "";

// Google Custom Search API response types
interface GoogleSearchItem {
  link: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

/**
 * Attempts to find a domain using Google Custom Search
 */
async function findDomainViaGoogle(
  name: string,
  town?: string
): Promise<string | null> {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) return null;

  try {
    const query = `${name} ${town || ""} official website`;
    const response = await axios.get<GoogleSearchResponse>(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: query,
          num: 1,
        },
      }
    );

    if (response.data.items?.[0]?.link) {
      const url = new URL(response.data.items[0].link);
      return url.origin;
    }
  } catch (error) {
    console.error("Google search error:", error);
  }

  return null;
}

/**
 * Attempts DNS resolution for common domain variations
 */
async function findDomainViaDNS(name: string): Promise<string | null> {
  // Clean company name and create domain variations
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/limited|ltd|llc|inc|plc/g, "");

  const variations = [
    `${cleanName}.com`,
    `${cleanName}.co.uk`,
    `${cleanName}.uk`,
    `${cleanName}.org`,
    `${cleanName}.net`,
  ];

  for (const domain of variations) {
    try {
      await dns.resolve(domain);
      return `https://${domain}`;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Uses multiple methods to find the official website domain for a company
 * @param name Company name to look up
 * @param town Optional town/city to improve accuracy
 * @returns The website URL or "unknown" if not found
 */
export async function enrichDomain(
  name: string,
  town?: string
): Promise<string> {
  try {
    // 1. Try DNS lookup first (fastest)
    const dnsDomain = await findDomainViaDNS(name);
    if (dnsDomain) return dnsDomain;

    // 2. Try Google Custom Search if configured
    const googleDomain = await findDomainViaGoogle(name, town);
    if (googleDomain) return googleDomain;

    // 3. Fallback to OpenAI as last resort
    const { choices } = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: `Return ONLY the official website URL for the UK company "${name}"${
            town ? ` in ${town}` : ""
          }. If unsure, respond "unknown".`,
        },
      ],
    });

    const result = choices[0].message.content?.trim() || "unknown";

    // Basic validation to ensure it's a URL or "unknown"
    if (result === "unknown" || result.startsWith("http")) {
      return result;
    }

    // If the model returned just a domain without http, add it
    if (result.includes(".") && !result.startsWith("http")) {
      return `https://${result}`;
    }

    return "unknown";
  } catch (error) {
    console.error(`Error enriching domain for ${name}:`, error);
    return "unknown";
  }
}

/**
 * Bulk enrichment function that respects rate limits
 * @param sponsors List of sponsors to enrich
 * @param cacheMap Optional cache of already enriched domains
 * @returns Map of company names to domains
 */
export async function bulkEnrichDomains(
  sponsors: { name: string; city?: string }[],
  cacheMap: Map<string, string> = new Map()
): Promise<Map<string, string>> {
  const results = new Map<string, string>(cacheMap);
  const queue = sponsors.filter((sponsor) => !cacheMap.has(sponsor.name));

  // Process in batches to respect rate limits
  const BATCH_SIZE = 30;
  const DELAY_MS = 20 * 1000; // 20 seconds between batches

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (sponsor) => {
      const domain = await enrichDomain(sponsor.name, sponsor.city);
      return { name: sponsor.name, domain };
    });

    const batchResults = await Promise.all(batchPromises);

    // Add results to map
    batchResults.forEach(({ name, domain }) => {
      results.set(name, domain);
    });

    // Log progress
    console.log(`Processed ${i + batch.length}/${queue.length} domains`);

    // Delay before next batch if not the last batch
    if (i + BATCH_SIZE < queue.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}
