import fs from "fs/promises";
import path from "path";
import { assess } from "../eligibility/assess";
import { roleFamily } from "../sectors/taxonomy";
import type { SearchQuery } from "../sponsorTypes";
import type { IndexedJob, JobIndex } from "./indexer";

const FILE = path.join(process.cwd(), "public", "data", "jobs.json");
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

let loaded: Promise<JobIndex | null> | null = null;

function load(): Promise<JobIndex | null> {
  loaded ??= fs
    .readFile(FILE, "utf-8")
    .then((text) => JSON.parse(text) as JobIndex)
    .catch(() => null); // No index built yet
  return loaded;
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
  return paginate(filterJobs(index?.jobs ?? [], query), query);
}

export async function jobsInfo(): Promise<JobsInfo> {
  const index = await load();
  return { count: index?.jobs.length ?? 0, sponsors: index?.sponsorsIndexed ?? 0, generatedAt: index?.generatedAt ?? null };
}
