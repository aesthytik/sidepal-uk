/**
 * One organisation from the register. The register has one row per
 * (organisation, route); rows are merged so each sponsor appears once.
 */
export interface Sponsor {
  id: string; // Stable slug generated from the name
  name: string;
  city: string;
  county: string;
  location: string; // "City, County" for display
  rating: string; // "A", "B", "A (SME+)", ...
  routes: string[]; // Raw register routes
  visaTypes: string[]; // Routes grouped into VISA_CATEGORIES
}

export interface SearchQuery {
  q?: string;
  location?: string; // Matches city or county
  visa?: string; // One of VISA_CATEGORIES
  rating?: "A"; // Only A-rated sponsors
  page?: number;
  limit?: number;
}

export interface SearchPage {
  items: Sponsor[];
  total: number;
  page: number;
  pageCount: number;
  fuzzy: boolean; // True when no exact match was found and these are near misses
}

export interface Job {
  title: string;
  url: string;
  location: string;
  uk: boolean;
}

export type AtsProvider = "greenhouse" | "lever" | "ashby" | "workable";

export interface JobSummary {
  provider: AtsProvider;
  total: number;
  uk: number;
  top: Job[]; // A handful of roles, UK first
}

/** What we could discover about a sponsor's web presence. */
export interface Enrichment {
  website?: string;
  careersUrl?: string;
  jobs?: JobSummary;
}

export type EnrichedSponsor = Sponsor & Enrichment;

/**
 * Visa categories shown in the filters, most commonly needed first.
 * Global Business Mobility sub-routes are grouped under one category.
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

export const POPULAR_LOCATIONS = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Edinburgh",
  "Glasgow",
  "Bristol",
  "Cambridge",
];
