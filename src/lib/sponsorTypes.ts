/**
 * Possible industry sectors for classification
 */
export type Sector =
  | "it"
  | "finance"
  | "healthcare"
  | "education"
  | "retail"
  | "other";

/**
 * Raw sponsor data from the CSV (one entry per organisation)
 */
export interface SponsorRaw {
  name: string;
  city: string;
  county: string;
  routes: string[]; // All routes the organisation is licensed for
  rating: string;
}

/**
 * Enriched sponsor data with additional fields
 */
export interface Sponsor {
  id: string; // Unique identifier (generated from name)
  name: string; // Company name
  city: string; // Town/City
  county: string; // County
  region: string; // Combined location (city + county)
  route: string; // Visa routes, comma separated
  rating: string; // Rating (A, B, A (SME+), ...)
  visaTypes: string[]; // Types of visas sponsored
  sector?: Sector; // Industry sector
  website?: string; // Company website
  careerUrl?: string; // Careers page URL
  lastUpdated: string; // ISO date string of last update
}

/**
 * Filter parameters for sponsors
 */
export interface SponsorFilters {
  city?: string;
  county?: string;
  region?: string;
  visaType?: string;
  query?: string;
}

/**
 * Generate a unique ID from a company name
 */
export function generateSponsorId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Visa categories shown in the filter panel. Global Business Mobility
 * sub-routes are grouped under one category.
 */
export const VISA_CATEGORIES = [
  "Skilled Worker",
  "Global Business Mobility",
  "Scale-up",
  "Creative Worker",
  "Charity Worker",
  "Religious Worker",
  "International Sportsperson",
  "Government Authorised Exchange",
  "International Agreement",
  "Seasonal Worker",
];

/**
 * Map a register route to its visa category
 */
function routeToVisaType(route: string): string {
  if (route.startsWith("Global Business Mobility")) {
    return "Global Business Mobility";
  }
  if (/intra[- ]company/i.test(route)) return "Global Business Mobility";
  if (/ministers of religion/i.test(route)) return "Religious Worker";
  return route;
}

/**
 * Extract distinct visa types from an organisation's routes
 */
export function extractVisaTypes(routes: string[]): string[] {
  return Array.from(
    new Set(routes.filter(Boolean).map((r) => routeToVisaType(r.trim())))
  );
}

/**
 * Combine city and county into a region string
 */
export function formatRegion(city: string, county: string): string {
  if (city && county) {
    return `${city}, ${county}`;
  } else if (city) {
    return city;
  } else if (county) {
    return county;
  } else {
    return "Unknown location";
  }
}
