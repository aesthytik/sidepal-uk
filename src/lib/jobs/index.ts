import { assess } from "../eligibility/assess";
import { placeOf } from "../geo/geocode";
import type { Place } from "../geo/places";
import { rankJobs } from "../match/score";
import { matchOccupation } from "../soc/match";
import type { Profile } from "../profile/types";
import { roleFamily } from "../sectors/taxonomy";
import type { Salary, SearchQuery } from "../sponsorTypes";
import { fetchAll, supabaseRead } from "../supabase/client";
import { type JobRow, rowToJob } from "../supabase/mappers";
import type { IndexedJob } from "./indexer";

// The index is small (hundreds of roles) and refreshed once a day, so each
// server instance keeps a copy for a few minutes instead of querying per request
const CACHE_MS = 5 * 60_000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface JobPage {
  items: IndexedJob[];
  total: number;
  page: number;
  pageCount: number;
}

export interface MapPlace extends Place {
  count: number;
}

export interface JobMap {
  places: MapPlace[]; // Busiest first
  remote: number; // Anywhere in the UK, or remote
  unplaced: number; // Locations we couldn't put on the map
  total: number;
}

export interface JobsInfo {
  count: number;
  sponsors: number;
  generatedAt: string | null;
}

interface LoadedJobs {
  jobs: IndexedJob[];
  sponsorsIndexed: number;
  generatedAt: string | null;
}

let cached: { at: number; index: LoadedJobs } | null = null;
let loading: Promise<LoadedJobs> | null = null;

async function fetchIndex(): Promise<LoadedJobs> {
  const db = supabaseRead();
  const [rows, run] = await Promise.all([
    fetchAll<JobRow>((from, to) =>
      db.from("jobs_view").select("*").order("posted_at", { ascending: false, nullsFirst: false }).order("url").range(from, to)
    ),
    db.from("index_runs").select("generated_at,sponsors_indexed").order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    jobs: rows.map(rowToJob),
    sponsorsIndexed: run.data?.sponsors_indexed ?? 0,
    generatedAt: run.data?.generated_at ? new Date(run.data.generated_at).toISOString() : null,
  };
}

async function load(): Promise<LoadedJobs> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.index;
  loading ??= fetchIndex()
    .then((index) => {
      cached = { at: Date.now(), index };
      return index;
    })
    .catch((error) => {
      console.error("Could not load jobs from Supabase:", error);
      // Serve the last good copy rather than an empty page
      return cached?.index ?? { jobs: [], sponsorsIndexed: 0, generatedAt: null };
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Filters jobs the same way for the API and for tests. */
export function filterJobs(jobs: IndexedJob[], query: SearchQuery): IndexedJob[] {
  const text = query.q?.trim().toLowerCase();
  const tokens = text ? text.split(/\s+/) : [];
  const place = query.location?.trim().toLowerCase();
  const visa = query.visa?.toLowerCase();
  const titles = query.role ? roleFamily(query.role)?.titles : undefined;

  return jobs.filter((j) => {
    if (tokens.length) {
      const haystack = `${j.title} ${j.sponsor} ${j.department ?? ""}`.toLowerCase();
      if (!tokens.every((t) => haystack.includes(t))) return false;
    }
    if (place && !j.location.toLowerCase().includes(place)) return false;
    if (visa && !j.visaTypes.some((v) => v.toLowerCase() === visa)) return false;
    if (query.rating === "A" && !j.rating.startsWith("A")) return false;
    if (query.sector && j.sector !== query.sector) return false;
    if (titles && !titles.test(j.title)) return false;
    if (query.sponsored === "likely" && assess(j, j.rating).verdict !== "likely") return false;
    if (query.place && placeKey(j) !== query.place) return false;
    return true;
  });
}

function placeKey(job: IndexedJob): string | null {
  const p = placeOf(job.location);
  return p === "remote" ? "remote" : (p?.id ?? null);
}

const PER_YEAR: Record<Salary["period"], number> = { year: 1, month: 12, week: 52, day: 230, hour: 1800 };

// Approximate pounds per unit, only so pay in other currencies sorts sensibly
const TO_GBP: Record<string, number> = { GBP: 1, USD: 0.75, EUR: 0.85, CAD: 0.55, AUD: 0.5, SGD: 0.57, CHF: 0.9 };

/** Rough yearly pay in pounds, for ordering only. Roles without pay (or in other currencies) come last. */
function yearlyPay(job: IndexedJob): number {
  const s = job.salary;
  const amount = s?.max ?? s?.min;
  const rate = s && TO_GBP[s.currency];
  return s && amount && rate ? amount * PER_YEAR[s.period] * rate : -1;
}

/**
 * Jobs arrive newest first, so only salary and match need sorting (stable, so ties stay newest first).
 * Sorting by match needs the user's profile; without one, jobs stay newest first.
 */
export function sortJobs(jobs: IndexedJob[], query: SearchQuery, profile?: Profile): IndexedJob[] {
  if (query.sort === "salary") return [...jobs].sort((a, b) => yearlyPay(b) - yearlyPay(a));
  if (query.sort === "match" && profile) return rankJobs(jobs, profile);
  return jobs;
}

/** How many matching jobs sit at each place, for the map. */
export function groupByPlace(jobs: IndexedJob[]): JobMap {
  const counts = new Map<string, MapPlace>();
  let remote = 0;
  let unplaced = 0;
  for (const j of jobs) {
    const p = placeOf(j.location);
    if (p === "remote") remote++;
    else if (!p) unplaced++;
    else {
      const entry = counts.get(p.id) ?? { ...p, count: 0 };
      entry.count++;
      counts.set(p.id, entry);
    }
  }
  return { places: [...counts.values()].sort((a, b) => b.count - a.count), remote, unplaced, total: jobs.length };
}

export function paginate(items: IndexedJob[], query: SearchQuery): JobPage {
  const limit = Math.min(Math.max(1, Math.floor(query.limit || DEFAULT_LIMIT)), MAX_LIMIT);
  const pageCount = Math.max(1, Math.ceil(items.length / limit));
  const page = Math.min(Math.max(1, Math.floor(query.page || 1)), pageCount);
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, pageCount };
}

export async function searchJobs(query: SearchQuery, profile?: Profile): Promise<JobPage> {
  const index = await load();
  return paginate(sortJobs(filterJobs(index.jobs, query), query, profile), query);
}

/** Matching jobs counted by place. Ignores `place` itself so the other pins stay visible. */
export async function jobMap(query: SearchQuery): Promise<JobMap> {
  const index = await load();
  return groupByPlace(filterJobs(index.jobs, { ...query, place: undefined }));
}

export async function jobsInfo(): Promise<JobsInfo> {
  const index = await load();
  return { count: index.jobs.length, sponsors: index.sponsorsIndexed, generatedAt: index.generatedAt };
}

/** Every indexed role at one sponsor, newest first. */
export async function jobsForSponsor(sponsorId: string): Promise<IndexedJob[]> {
  return (await load()).jobs.filter((j) => j.sponsorId === sponsorId);
}

let byOccupation: { index: LoadedJobs; map: Map<string, IndexedJob[]> } | null = null;

/** Live roles whose titles map to an occupation code, newest first. Grouped once per index load. */
export async function jobsForOccupation(code: string, limit = 6): Promise<{ items: IndexedJob[]; total: number }> {
  const index = await load();
  if (byOccupation?.index !== index) {
    const map = new Map<string, IndexedJob[]>();
    for (const j of index.jobs) {
      const occ = matchOccupation(j.title)?.occupation.code;
      if (!occ) continue;
      const list = map.get(occ);
      if (list) list.push(j);
      else map.set(occ, [j]);
    }
    byOccupation = { index, map };
  }
  const all = byOccupation.map.get(code) ?? [];
  return { items: all.slice(0, limit), total: all.length };
}

/** One indexed role by its URL, or null if it isn't in today's index. */
export async function jobByUrl(url: string): Promise<IndexedJob | null> {
  return (await load()).jobs.find((j) => j.url === url) ?? null;
}
