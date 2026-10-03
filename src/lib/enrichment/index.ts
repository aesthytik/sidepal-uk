import dns from "dns/promises";
import path from "path";
import type { Enrichment, JobSummary } from "../sponsorTypes";
import { type AtsBoard, fetchJobs } from "./ats";
import { findCareers } from "./careers";
import type { Http } from "./http";
import { type EnrichmentStore, type StoredEnrichment, createFileStore } from "./store";
import { type WebsiteDeps, findWebsite } from "./website";

export { createMemoryStore, type EnrichmentStore } from "./store";

export const MAX_BATCH = 25;
const CONCURRENCY = 6;
const JOBS_TTL_MS = 6 * 60 * 60 * 1000;
// Lookups that found nothing are retried after this long
const RETRY_MISSING_MS = 30 * 24 * 60 * 60 * 1000;

export interface EnricherDeps {
  store: EnrichmentStore;
  http: Http;
  resolves: WebsiteDeps["resolves"];
  google?: WebsiteDeps["google"];
  now?: () => number;
}

export type Enricher = (
  sponsors: { name: string; city?: string }[]
) => Promise<Record<string, Enrichment>>;

/** Runs `fn` over `items` with at most `limit` in flight. */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    })
  );
  return results;
}

/**
 * Creates a function that discovers each sponsor's website, careers page and
 * open roles (when the careers page uses Greenhouse, Lever, Ashby or Workable).
 * Websites, careers pages and job boards are remembered in the store; job
 * lists are cached in memory for a few hours.
 */
export function createEnricher(deps: EnricherDeps): Enricher {
  const now = deps.now ?? Date.now;
  const jobsCache = new Map<string, { at: number; jobs: JobSummary | null }>();

  async function jobsFor(board: AtsBoard): Promise<JobSummary | null> {
    const key = `${board.provider}:${board.slug}`;
    const cached = jobsCache.get(key);
    if (cached && now() - cached.at < JOBS_TTL_MS) return cached.jobs;
    const jobs = await fetchJobs(board, deps.http);
    jobsCache.set(key, { at: now(), jobs });
    return jobs;
  }

  function isStale(rec: StoredEnrichment): boolean {
    // Entries migrated from the old cache have no date; retry them once
    if (!rec.checkedAt) return true;
    return now() - Date.parse(rec.checkedAt) > RETRY_MISSING_MS;
  }

  /** Fills in whatever is missing from a stored record. */
  async function discover(name: string, city: string | undefined, stored: StoredEnrichment) {
    const rec = { ...stored };
    let changed = false;

    if (rec.website === undefined || (rec.website === null && isStale(rec))) {
      rec.website = await findWebsite(deps, name, city);
      rec.careersUrl = undefined;
      rec.ats = undefined;
      changed = true;
    }
    if (rec.website && (rec.careersUrl === undefined || rec.ats === undefined)) {
      const careers = await findCareers(deps.http, rec.website);
      rec.careersUrl = careers.careersUrl;
      rec.ats = careers.ats;
      changed = true;
    }
    if (changed) rec.checkedAt = new Date(now()).toISOString();
    return { rec, changed };
  }

  return async function enrich(sponsors) {
    const batch = sponsors.slice(0, MAX_BATCH);
    const stored = await deps.store.get(batch.map((s) => s.name));
    const updates: Record<string, StoredEnrichment> = {};

    const results = await mapPool(batch, CONCURRENCY, async ({ name, city }) => {
      try {
        const { rec, changed } = await discover(name, city, stored[name] ?? {});
        if (changed) updates[name] = rec;
        const enrichment: Enrichment = {
          website: rec.website ?? undefined,
          careersUrl: rec.careersUrl ?? undefined,
        };
        if (rec.ats) enrichment.jobs = (await jobsFor(rec.ats)) ?? undefined;
        return [name, enrichment] as const;
      } catch (error) {
        // One unreachable site shouldn't fail the whole batch
        console.error(`Enrichment failed for ${name}:`, error);
        return [name, {}] as const;
      }
    });

    if (Object.keys(updates).length > 0) await deps.store.set(updates);
    return Object.fromEntries(results);
  };
}

let defaultEnricher: Enricher | null = null;

/** The production enricher: real network, cache file in public/data. */
export const enrich: Enricher = (sponsors) => {
  defaultEnricher ??= createEnricher({
    store: createFileStore(path.join(process.cwd(), "public", "data", "enrichment-cache.json")),
    http: fetch,
    resolves: async (domain) => {
      try {
        await dns.resolve(domain);
        return true;
      } catch {
        return false;
      }
    },
    google:
      process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID
        ? { key: process.env.GOOGLE_API_KEY, cx: process.env.GOOGLE_SEARCH_ENGINE_ID }
        : undefined,
  });
  return defaultEnricher(sponsors);
};
