import { assess } from "../eligibility/assess";
import { roleFamily } from "../sectors/taxonomy";
import type { SearchQuery } from "../sponsorTypes";
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
    return true;
  });
}

export function paginate(items: IndexedJob[], query: SearchQuery): JobPage {
  const limit = Math.min(Math.max(1, Math.floor(query.limit || DEFAULT_LIMIT)), MAX_LIMIT);
  const pageCount = Math.max(1, Math.ceil(items.length / limit));
  const page = Math.min(Math.max(1, Math.floor(query.page || 1)), pageCount);
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, pageCount };
}

export async function searchJobs(query: SearchQuery): Promise<JobPage> {
  const index = await load();
  return paginate(filterJobs(index.jobs, query), query);
}

export async function jobsInfo(): Promise<JobsInfo> {
  const index = await load();
  return { count: index.jobs.length, sponsors: index.sponsorsIndexed, generatedAt: index.generatedAt };
}
