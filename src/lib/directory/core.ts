import Papa from "papaparse";
import Fuse from "fuse.js";
import { classifyByName } from "../sectors/classify";
import { type SectorId, roleFamily } from "../sectors/taxonomy";
import type { SearchPage, SearchQuery, Sponsor } from "../sponsorTypes";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** One organisation as read from the register, before ids are assigned. */
export interface SponsorRow {
  name: string;
  city: string;
  county: string;
  routes: string[];
  rating: string;
}

/**
 * Extracts the rating from the "Type & Rating" column,
 * e.g. "Worker (A rating)" -> "A", "Worker (A (SME+))" -> "A (SME+)"
 */
function parseRating(typeAndRating: string): string {
  const match = typeAndRating.match(/\((.*)\)\s*$/);
  if (!match) return "";
  return match[1].replace(/\s*rating$/i, "").trim();
}

/**
 * Parses the register CSV. The register has one row per (organisation,
 * route), so rows are grouped by organisation and their routes merged.
 */
export function parseRegisterCsv(text: string): SponsorRow[] {
  const { data, errors } = Papa.parse<Record<string, string>>(
    text.replace(/^﻿/, ""),
    { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() }
  );
  if (errors.length > 0) {
    console.error(`CSV parsing errors (${errors.length}):`, errors.slice(0, 5));
  }

  const byName = new Map<string, SponsorRow>();
  for (const row of data) {
    const name = row["Organisation Name"]?.trim();
    if (!name) continue;

    const route = row["Route"]?.trim() || "";
    const rating = parseRating(row["Type & Rating"]?.trim() || "");
    const city = row["Town/City"]?.trim() || "";
    const county = row["County"]?.trim() || "";
    const existing = byName.get(name);

    if (existing) {
      if (route && !existing.routes.includes(route)) existing.routes.push(route);
      if (!existing.rating && rating) existing.rating = rating;
      if (!existing.city && city) existing.city = city;
      if (!existing.county && county) existing.county = county;
    } else {
      byName.set(name, { name, city, county, routes: route ? [route] : [], rating });
    }
  }
  return Array.from(byName.values());
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function routeToVisaType(route: string): string {
  if (route.startsWith("Global Business Mobility")) return "Global Business Mobility";
  if (/intra[- ]company/i.test(route)) return "Global Business Mobility";
  if (/ministers of religion/i.test(route)) return "Religious Worker";
  return route;
}

function formatLocation(city: string, county: string): string {
  if (city && county && city.toLowerCase() !== county.toLowerCase()) {
    return `${city}, ${county}`;
  }
  return city || county || "Unknown location";
}

/**
 * Cleans a register place name so variants group together:
 * "LONDON", "london ", "Manchester," and "Manchester, England" all normalise.
 */
function normalisePlace(place: string): string {
  return place
    .split(",")[0]
    .replace(/[^a-z\s'-]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
}

function toSponsors(rows: SponsorRow[], overrides: Record<string, SectorId | null>): Sponsor[] {
  const usedIds = new Map<string, number>();
  return rows.map((row) => {
    const baseId = slugify(row.name) || "sponsor";
    const seen = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, seen + 1);
    return {
      id: seen === 0 ? baseId : `${baseId}-${seen + 1}`,
      name: row.name,
      city: row.city,
      county: row.county,
      location: formatLocation(row.city, row.county),
      rating: row.rating,
      routes: row.routes,
      sector: classifyByName(row.name) ?? overrides[row.name] ?? undefined,
      visaTypes: Array.from(
        new Set(row.routes.filter(Boolean).map((r) => routeToVisaType(r.trim())))
      ),
    };
  });
}

export interface Directory {
  count: number;
  search(query: SearchQuery): SearchPage;
  getByIds(ids: string[]): Sponsor[];
  suggestLocations(prefix: string, limit?: number): string[];
}

/**
 * Builds a searchable in-memory index of the register.
 */
export function createDirectory(rows: SponsorRow[], overrides: Record<string, SectorId | null> = {}): Directory {
  const sponsors = toSponsors(rows, overrides);
  const byId = new Map(sponsors.map((s) => [s.id, s]));
  const searchText = sponsors.map((s) => `${s.name} ${s.city} ${s.county}`.toLowerCase());
  const placeText = sponsors.map((s) => `${s.city} ${s.county}`.toLowerCase());
  let fuse: Fuse<Sponsor> | null = null; // Built on first fuzzy search

  // Places ranked by how many sponsors they have, for location suggestions
  const placeCounts = new Map<string, number>();
  for (const s of sponsors) {
    for (const place of [s.city, s.county]) {
      if (!place) continue;
      const key = normalisePlace(place);
      placeCounts.set(key, (placeCounts.get(key) ?? 0) + 1);
    }
  }
  // Places used only once or twice are mostly typos ("Manchster")
  const places = Array.from(placeCounts.entries())
    .filter(([place, n]) => place && n >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([place]) => place);

  function matchesFilters(s: Sponsor, i: number, query: SearchQuery): boolean {
    if (query.location && !placeText[i].includes(query.location.trim().toLowerCase())) {
      return false;
    }
    if (query.visa) {
      const visa = query.visa.toLowerCase();
      if (!s.visaTypes.some((v) => v.toLowerCase() === visa)) return false;
    }
    if (query.sector && s.sector !== query.sector) return false;
    if (query.role) {
      const family = roleFamily(query.role);
      if (family && !(s.sector && (family.sectors as readonly string[]).includes(s.sector))) return false;
    }
    if (query.rating === "A" && !s.rating.startsWith("A")) return false;
    return true;
  }

  function findMatches(query: SearchQuery): { matches: Sponsor[]; fuzzy: boolean } {
    const text = query.q?.trim().toLowerCase();
    if (!text) {
      return {
        matches: sponsors.filter((s, i) => matchesFilters(s, i, query)),
        fuzzy: false,
      };
    }

    // Every word must appear somewhere; rank name prefix > name contains > location
    const tokens = text.split(/\s+/);
    const ranked: { s: Sponsor; score: number }[] = [];
    sponsors.forEach((s, i) => {
      if (!tokens.every((t) => searchText[i].includes(t))) return;
      if (!matchesFilters(s, i, query)) return;
      const name = s.name.toLowerCase();
      ranked.push({ s, score: name.startsWith(text) ? 0 : name.includes(text) ? 1 : 2 });
    });
    if (ranked.length > 0) {
      // Stable sort keeps the register's alphabetical order within a score
      return { matches: ranked.sort((a, b) => a.score - b.score).map((r) => r.s), fuzzy: false };
    }

    // Nothing matched exactly: tolerate typos in the name
    fuse ??= new Fuse(sponsors, { keys: ["name"], threshold: 0.3, ignoreLocation: true });
    const fuzzyMatches = fuse
      .search(text, { limit: 200 })
      .map((r) => r.refIndex)
      .filter((i) => matchesFilters(sponsors[i], i, query))
      .map((i) => sponsors[i]);
    return { matches: fuzzyMatches, fuzzy: fuzzyMatches.length > 0 };
  }

  return {
    count: sponsors.length,

    search(query) {
      const { matches, fuzzy } = findMatches(query);
      const limit = Math.min(Math.max(1, Math.floor(query.limit || DEFAULT_LIMIT)), MAX_LIMIT);
      const pageCount = Math.max(1, Math.ceil(matches.length / limit));
      const page = Math.min(Math.max(1, Math.floor(query.page || 1)), pageCount);
      const start = (page - 1) * limit;
      return {
        items: matches.slice(start, start + limit),
        total: matches.length,
        page,
        pageCount,
        fuzzy,
      };
    },

    getByIds(ids) {
      return ids.map((id) => byId.get(id)).filter((s): s is Sponsor => Boolean(s));
    },

    suggestLocations(prefix, limit = 8) {
      const p = prefix.trim().toLowerCase();
      if (!p) return places.slice(0, limit);
      const starts = places.filter((place) => place.toLowerCase().startsWith(p));
      const contains = places.filter(
        (place) => !place.toLowerCase().startsWith(p) && place.toLowerCase().includes(p)
      );
      return [...starts, ...contains].slice(0, limit);
    },
  };
}
