import { Sector } from "./classifySector";

/**
 * Raw sponsor data from the CSV
 */
export interface SponsorRaw {
  name: string;
  city: string;
  county: string;
  route: string;
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
  route: string; // Visa route
  rating: string; // Rating (A or B)
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
  sector?: string;
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
 * Extract visa types from route information
 */
export function extractVisaTypes(route: string): string[] {
  const visaTypes: string[] = [];

  if (route.includes("Skilled Worker")) {
    visaTypes.push("Skilled Worker");
  }

  if (route.includes("Global Business Mobility")) {
    visaTypes.push("Global Business Mobility");
  }

  if (route.includes("Scale-up")) {
    visaTypes.push("Scale-up");
  }

  if (route.includes("Innovator")) {
    visaTypes.push("Innovator");
  }

  if (route.includes("Start-up")) {
    visaTypes.push("Start-up");
  }

  // If no specific types were identified, use the full route
  if (visaTypes.length === 0 && route.trim() !== "") {
    visaTypes.push(route.trim());
  }

  return visaTypes;
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
