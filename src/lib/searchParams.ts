import type { SearchQuery } from "./sponsorTypes";

/** The search as it appears in page and API URLs (without paging). */
export type SearchFilters = Pick<SearchQuery, "q" | "location" | "visa" | "rating">;

/**
 * Reads a search from URL params. Older links used city/county/region,
 * which all map to `location`.
 */
export function parseSearchParams(params: URLSearchParams): SearchFilters & { page?: number } {
  const get = (key: string) => params.get(key)?.trim() || undefined;
  return {
    q: get("q"),
    location: get("location") ?? get("city") ?? get("county") ?? get("region"),
    visa: get("visa"),
    rating: get("rating") === "A" ? "A" : undefined,
    page: Number(get("page")) || undefined,
  };
}

export function toSearchParams(filters: SearchFilters & { page?: number; limit?: number }): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ["q", "location", "visa", "rating", "page", "limit"] as const) {
    const value = filters[key];
    if (value) params.set(key, String(value));
  }
  return params;
}
