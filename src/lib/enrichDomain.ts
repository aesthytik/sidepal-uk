import axios from "axios";
import dns from "dns/promises";
import { isUsableWebsite } from "./enrichmentCache";

// Google API setup
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CSE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || "";

const USER_AGENT = "Mozilla/5.0 (compatible; SidepalSponsorFinder/1.0)";

// Google Custom Search API response types
interface GoogleSearchItem {
  link: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

const LEGAL_SUFFIXES =
  /\b(limited|ltd|llp|llc|plc|inc|uk|group|holdings|company|co|the|t\/a|services|international)\b/g;

/**
 * Reduces a company name to its distinctive core, e.g.
 * "Acme Widgets (UK) Limited" -> "acmewidgets"
 */
function coreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks that a site responds and that its homepage mentions the company,
 * so that a guessed domain like "abc.com" isn't attributed to "ABC Care Ltd".
 */
async function verifyWebsite(url: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;
    const html = (await res.text()).slice(0, 200_000).toLowerCase();
    const text = html.replace(/[^a-z0-9]/g, "");
    const core = coreName(name);
    if (core.length >= 4 && text.includes(core)) return true;

    // Fall back to requiring every significant word of the name
    const words = name
      .toLowerCase()
      .replace(/\(.*?\)/g, " ")
      .replace(LEGAL_SUFFIXES, " ")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3);
    return words.length > 0 && words.every((w) => html.includes(w));
  } catch {
    return false;
  }
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
        params: { key: GOOGLE_API_KEY, cx: GOOGLE_CSE_ID, q: query, num: 5 },
        timeout: 8000,
      }
    );

    for (const item of response.data.items || []) {
      const origin = new URL(item.link).origin;
      if (isUsableWebsite(origin)) return origin;
    }
  } catch (error) {
    console.error("Google search error:", error);
  }

  return null;
}

/**
 * Attempts DNS resolution for common domain variations, then verifies
 * the site actually belongs to the company.
 */
async function findDomainViaDNS(name: string): Promise<string | null> {
  const cleanName = coreName(name);
  // Very short names (e.g. "023") match unrelated domains far too often
  if (cleanName.length < 4) return null;

  // Full name first, then the first word ("Monzo Bank Ltd" -> monzo.com).
  // Both are still subject to homepage verification below.
  const firstWord = coreName(name.split(/\s+/)[0] || "");
  const stems = [cleanName];
  if (firstWord.length >= 5 && firstWord !== cleanName) stems.push(firstWord);

  const candidates = stems.flatMap((stem) => [
    `${stem}.co.uk`,
    `${stem}.com`,
    `${stem}.uk`,
    `${stem}.org.uk`,
    `${stem}.org`,
    `${stem}.io`,
  ]);

  const resolved = await Promise.all(
    candidates.map(async (domain) => {
      try {
        await dns.resolve(domain);
        return domain;
      } catch {
        return null;
      }
    })
  );

  for (const domain of resolved) {
    if (!domain) continue;
    const url = `https://${domain}`;
    if (await verifyWebsite(url, name)) return url;
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
    // 1. Google Custom Search if configured (most accurate)
    const googleDomain = await findDomainViaGoogle(name, town);
    if (googleDomain) return googleDomain;

    // 2. Guess common domains and verify them
    const dnsDomain = await findDomainViaDNS(name);
    if (dnsDomain) return dnsDomain;

    return "unknown";
  } catch (error) {
    console.error(`Error enriching domain for ${name}:`, error);
    return "unknown";
  }
}
