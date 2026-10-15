import { isRoleId, isSectorId } from "./sectors/taxonomy";
import type { SearchQuery } from "./sponsorTypes";

/** The search as it appears in page and API URLs (without paging). */
export type SearchFilters = Pick<SearchQuery, "q" | "location" | "visa" | "rating" | "sector" | "role" | "sponsored" | "place" | "sort"> & {
  view?: "map"; // Jobs page only: show the map instead of the list
};

export type PageSearchParams = Record<string, string | string[] | undefined>;

/** Next.js page props and the browser must read repeated parameters the same way. */
export function pageSearchParams(values: PageSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  return params;
}

export function validPage(params: URLSearchParams): boolean {
  const page = params.get("page");
  return page === null || (/^[1-9]\d*$/.test(page) && Number.isSafeInteger(Number(page)));
}

/** Filtered searches stay usable, while curated role/place pages carry the search intent. */
export function searchPageSeo(path: string, params: URLSearchParams) {
  const { page, ...filters } = parseSearchParams(params);
  const noIndex = !validPage(params) || Object.values(filters).some(Boolean);
  const canonical = page && page > 1 && validPage(params) ? `${path}?page=${page}` : path;
  return { page: page ?? 1, noIndex, canonical };
}

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
    sector: isSectorId(get("sector")) ? (get("sector") as SearchQuery["sector"]) : undefined,
    role: isRoleId(get("role")) ? (get("role") as SearchQuery["role"]) : undefined,
    sponsored: get("sponsored") === "likely" ? ("likely" as const) : undefined,
    place: get("place")?.toLowerCase(),
    sort: get("sort") === "salary" || get("sort") === "match" ? (get("sort") as SearchQuery["sort"]) : undefined,
    view: get("view") === "map" ? ("map" as const) : undefined,
    page: validPage(params) && get("page") ? Number(get("page")) : undefined,
  };
}

export function toSearchParams(filters: SearchFilters & { page?: number; limit?: number }): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ["q", "location", "visa", "rating", "sector", "role", "sponsored", "place", "sort", "view", "page", "limit"] as const) {
    const value = filters[key];
    if (value) params.set(key, String(value));
  }
  return params;
}

/** Data identity excludes presentation and campaign parameters. */
export function searchQueryKey(query: SearchFilters & { page?: number }): string {
  return toSearchParams({ ...query, page: query.page && query.page > 1 ? query.page : undefined, view: undefined }).toString();
}
