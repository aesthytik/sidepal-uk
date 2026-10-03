import fs from "fs";
import path from "path";
import type { Sector } from "./sponsorTypes";

const CACHE_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "enrichment-cache.json"
);

/**
 * Directory / aggregator sites that search results often return instead of
 * the company's own website. These are never a company's official domain.
 */
const BLOCKED_HOSTS = [
  "company-information.service.gov.uk",
  "find-and-update.company-information.service.gov.uk",
  "gov.uk",
  "cqc.org.uk",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "yell.com",
  "endole.co.uk",
  "companycheck.co.uk",
  "opencorporates.com",
  "bizdb.co.uk",
  "glassdoor.com",
  "glassdoor.co.uk",
  "indeed.com",
  "indeed.co.uk",
  "wikipedia.org",
  "google.com",
  "trustpilot.com",
];

export function isUsableWebsite(url: string | null | undefined): url is string {
  if (!url || url === "unknown") return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return !BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

interface EnrichmentCacheData {
  domains: Record<string, string>;
  sectors: Record<string, Sector>;
  careerUrls: Record<string, string | null>;
  lastUpdated: string;
}

let cache: EnrichmentCacheData | null = null;
let writeTimer: NodeJS.Timeout | null = null;

function load(): EnrichmentCacheData {
  if (cache) return cache;
  cache = { domains: {}, sectors: {}, careerUrls: {}, lastUpdated: "" };
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      cache.domains = data.domains || {};
      cache.sectors = data.sectors || {};
      cache.careerUrls = data.careerUrls || {};
      cache.lastUpdated = data.lastUpdated || "";
    }
  } catch (error) {
    console.error("Error loading enrichment cache:", error);
  }
  return cache;
}

/**
 * Persist the cache to disk shortly after the last change. Writes are
 * best-effort: on read-only hosts (e.g. Vercel) the in-memory cache is
 * still used for the lifetime of the instance.
 */
function scheduleWrite() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      const data = load();
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn("Could not persist enrichment cache:", error);
    }
  }, 1000);
}

export function getDomain(name: string): string | undefined {
  const domain = load().domains[name];
  return isUsableWebsite(domain) ? domain : undefined;
}

export function hasDomainEntry(name: string): boolean {
  return name in load().domains;
}

export function getSector(name: string): Sector | undefined {
  return load().sectors[name];
}

/** Returns undefined if never checked, null if checked and none found. */
export function getCareerUrl(name: string): string | null | undefined {
  return load().careerUrls[name];
}

export function setDomains(domains: Record<string, string>) {
  Object.assign(load().domains, domains);
  scheduleWrite();
}

export function setSectors(sectors: Record<string, Sector>) {
  Object.assign(load().sectors, sectors);
  scheduleWrite();
}

export function setCareerUrls(careerUrls: Record<string, string | null>) {
  Object.assign(load().careerUrls, careerUrls);
  scheduleWrite();
}
