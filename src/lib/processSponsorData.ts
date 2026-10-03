import fs from "fs/promises";
import path from "path";
import Fuse from "fuse.js";
import {
  DATA_DIR,
  downloadLatestCsv,
  fetchLocalCsv,
  findLocalCsvPath,
  processCSVText,
} from "./fetchCsv";
import {
  SponsorRaw,
  Sponsor,
  SponsorFilters,
  generateSponsorId,
  extractVisaTypes,
  formatRegion,
} from "./sponsorTypes";
import { getCareerUrl, getDomain, getSector } from "./enrichmentCache";

interface SponsorDataset {
  sponsors: Sponsor[];
  byId: Map<string, Sponsor>;
  searchText: string[]; // lowercase "name city county" per sponsor
  fuse: Fuse<Sponsor> | null; // built lazily on first fuzzy search
  loadedAt: string;
}

let dataset: SponsorDataset | null = null;
let loading: Promise<SponsorDataset> | null = null;

/**
 * Converts raw sponsor data to sponsor objects with unique ids
 */
function convertToSponsors(rawSponsors: SponsorRaw[]): Sponsor[] {
  const now = new Date().toISOString();
  const usedIds = new Map<string, number>();

  return rawSponsors.map((raw) => {
    const baseId = generateSponsorId(raw.name) || "sponsor";
    const seen = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, seen + 1);
    const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;

    return {
      id,
      name: raw.name,
      city: raw.city,
      county: raw.county,
      region: formatRegion(raw.city, raw.county),
      route: raw.routes.join(", "),
      rating: raw.rating,
      visaTypes: extractVisaTypes(raw.routes),
      lastUpdated: now,
    };
  });
}

function buildDataset(rawSponsors: SponsorRaw[]): SponsorDataset {
  const sponsors = convertToSponsors(rawSponsors);
  return {
    sponsors,
    byId: new Map(sponsors.map((s) => [s.id, s])),
    searchText: sponsors.map((s) =>
      `${s.name} ${s.city} ${s.county}`.toLowerCase()
    ),
    fuse: null,
    loadedAt: new Date().toISOString(),
  };
}

async function getDataset(): Promise<SponsorDataset> {
  if (dataset) return dataset;
  if (!loading) {
    loading = fetchLocalCsv()
      .then((raw) => {
        dataset = buildDataset(raw);
        console.log(`Loaded ${dataset.sponsors.length} sponsors`);
        return dataset;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

/**
 * Attaches cached enrichment (website, sector, careers page) to a sponsor
 */
export function withEnrichment(sponsor: Sponsor): Sponsor {
  return {
    ...sponsor,
    website: getDomain(sponsor.name),
    sector: getSector(sponsor.name),
    careerUrl: getCareerUrl(sponsor.name) || undefined,
  };
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  return (await getDataset()).sponsors;
}

export async function getSponsorsByIds(ids: string[]): Promise<Sponsor[]> {
  const { byId } = await getDataset();
  return ids
    .map((id) => byId.get(id))
    .filter((s): s is Sponsor => Boolean(s));
}

function matchesFilters(s: Sponsor, filters: SponsorFilters): boolean {
  if (filters.city && !s.city.toLowerCase().includes(filters.city.toLowerCase()))
    return false;
  if (
    filters.county &&
    !s.county.toLowerCase().includes(filters.county.toLowerCase())
  )
    return false;
  if (filters.region) {
    const r = filters.region.toLowerCase();
    if (!s.city.toLowerCase().includes(r) && !s.county.toLowerCase().includes(r))
      return false;
  }
  if (
    filters.visaType &&
    !s.visaTypes.some((v) => v.toLowerCase() === filters.visaType!.toLowerCase())
  )
    return false;
  return true;
}

/**
 * Filters and searches sponsors. Exact substring matches are ranked first
 * (name prefix > name contains > location contains); if nothing matches,
 * falls back to fuzzy matching on the name to tolerate typos.
 */
export async function querySponsors(filters: SponsorFilters): Promise<Sponsor[]> {
  const ds = await getDataset();
  const query = filters.query?.trim().toLowerCase();

  if (!query) {
    return ds.sponsors.filter((s) => matchesFilters(s, filters));
  }

  const tokens = query.split(/\s+/);
  const ranked: { s: Sponsor; score: number }[] = [];

  ds.sponsors.forEach((s, i) => {
    const text = ds.searchText[i];
    if (!tokens.every((t) => text.includes(t))) return;
    if (!matchesFilters(s, filters)) return;
    const name = s.name.toLowerCase();
    const score = name.startsWith(query) ? 0 : name.includes(query) ? 1 : 2;
    ranked.push({ s, score });
  });

  if (ranked.length > 0) {
    return ranked
      .sort((a, b) => a.score - b.score) // stable: keeps alphabetical order within a score
      .map((r) => r.s);
  }

  if (!ds.fuse) {
    ds.fuse = new Fuse(ds.sponsors, {
      keys: ["name"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }
  return ds.fuse
    .search(query, { limit: 500 })
    .map((r) => r.item)
    .filter((s) => matchesFilters(s, filters));
}

export async function getDatasetInfo() {
  const ds = await getDataset();
  const csvPath = await findLocalCsvPath();
  return {
    sponsorCount: ds.sponsors.length,
    loadedAt: ds.loadedAt,
    source: csvPath ? path.basename(csvPath) : null,
  };
}

/**
 * Downloads the latest register from GOV.UK and swaps it in.
 * The CSV is saved to public/data when the filesystem is writable;
 * otherwise the new data is kept in memory for this instance.
 */
export async function processSponsorData(): Promise<{
  count: number;
  source: string;
  saved: boolean;
}> {
  console.log("Starting sponsor data update...");
  const { url, fileName, text } = await downloadLatestCsv();

  const raw = processCSVText(text);
  // Guard against a truncated or malformed download replacing good data
  if (raw.length < 10_000) {
    throw new Error(`Downloaded CSV only had ${raw.length} sponsors; aborting`);
  }

  let saved = false;
  try {
    const target = path.join(DATA_DIR, fileName);
    await fs.writeFile(target, text, "utf-8");
    // Remove older register files so the newest one is always loaded
    const others = (await fs.readdir(DATA_DIR)).filter(
      (f) => f.toLowerCase().endsWith(".csv") && f !== fileName
    );
    await Promise.all(others.map((f) => fs.unlink(path.join(DATA_DIR, f))));
    saved = true;
  } catch (error) {
    console.warn("Could not save CSV to disk, keeping in memory only:", error);
  }

  dataset = buildDataset(raw);
  console.log(`Sponsor data updated: ${raw.length} sponsors from ${url}`);
  return { count: raw.length, source: url, saved };
}
