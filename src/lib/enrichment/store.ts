import fs from "fs";
import path from "path";
import type { AtsBoard } from "./ats";

/**
 * What has been learned about one sponsor. `undefined` means not looked up
 * yet; `null` means looked up and nothing was found.
 */
export interface StoredEnrichment {
  website?: string | null;
  careersUrl?: string | null;
  ats?: AtsBoard | null;
  checkedAt?: string; // ISO time of the last lookup
}

/** Where enrichment results persist between requests, keyed by sponsor name. */
export interface EnrichmentStore {
  get(names: string[]): Promise<Record<string, StoredEnrichment>>;
  set(entries: Record<string, StoredEnrichment>): Promise<void>;
}

export function createMemoryStore(initial: Record<string, StoredEnrichment> = {}): EnrichmentStore {
  const data = { ...initial };
  return {
    async get(names) {
      return Object.fromEntries(names.filter((n) => data[n]).map((n) => [n, data[n]]));
    },
    async set(entries) {
      Object.assign(data, entries);
    },
  };
}

interface CacheFile {
  version: 2;
  updatedAt: string;
  sponsors: Record<string, StoredEnrichment>;
}

/** Reads the cache file, migrating the old { domains, careerUrls } format. */
function readCacheFile(file: string): Record<string, StoredEnrichment> {
  try {
    if (!fs.existsSync(file)) return {};
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (raw.version === 2) return raw.sponsors ?? {};

    const sponsors: Record<string, StoredEnrichment> = {};
    for (const [name, domain] of Object.entries<string>(raw.domains ?? {})) {
      sponsors[name] = { website: domain && domain !== "unknown" ? domain : null };
    }
    for (const [name, url] of Object.entries<string | null>(raw.careerUrls ?? {})) {
      sponsors[name] = { ...sponsors[name], careersUrl: url };
    }
    return sponsors;
  } catch (error) {
    console.error("Error loading enrichment cache:", error);
    return {};
  }
}

/**
 * A JSON file store. Writes are debounced and best-effort: on read-only
 * hosts (e.g. Vercel) the data is still kept in memory for the instance.
 */
export function createFileStore(file: string): EnrichmentStore {
  const memory = createMemoryStore(readCacheFile(file));
  let all: Record<string, StoredEnrichment> | null = null;
  let timer: NodeJS.Timeout | null = null;

  return {
    get: memory.get,
    async set(entries) {
      await memory.set(entries);
      all = { ...(all ?? readCacheFile(file)), ...entries };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const data: CacheFile = { version: 2, updatedAt: new Date().toISOString(), sponsors: all! };
        try {
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, JSON.stringify(data, null, 1));
        } catch (error) {
          console.warn("Could not persist enrichment cache:", error);
        }
      }, 1000);
    },
  };
}
