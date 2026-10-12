import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectorId } from "../sectors/taxonomy";
import type { Sponsor } from "../sponsorTypes";
import { rankPlaces } from "../directory/core";
import type { IndexedJob } from "../jobs/indexer";
import type { EnrichmentStore, StoredEnrichment } from "../enrichment/store";
import { fetchAll } from "./client";
import { SPONSOR_COLUMNS, type SponsorRow, jobToRow, rowToSponsor, sponsorToRow } from "./mappers";

const BATCH = 1000;
const CONCURRENCY = 4;

async function inBatches<T>(rows: T[], size: number, run: (batch: T[]) => Promise<void>): Promise<void> {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += size) batches.push(rows.slice(i, i + size));
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
      while (next < batches.length) await run(batches[next++]);
    })
  );
}

async function upsert(db: SupabaseClient, table: string, rows: object[], onConflict: string) {
  await inBatches(rows, BATCH, async (batch) => {
    const { error } = await db.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  });
}

/**
 * Replaces the register in Supabase: upserts every sponsor, removes organisations
 * that are no longer listed, and rebuilds the ranked places used for suggestions.
 */
export async function syncSponsors(
  db: SupabaseClient,
  sponsors: Sponsor[],
  opts: { overrides: Record<string, SectorId | null>; registerDate: string | null }
): Promise<void> {
  const stamp = new Date().toISOString();
  const rows = sponsors.map((s, i) => sponsorToRow(s, i, { ...opts, stamp }));
  // Names are the natural key (enrichment is keyed by them); ids may shift if slugs collide
  await upsert(db, "sponsors", rows, "name");

  const stale = await db.from("sponsors").delete().lt("updated_at", stamp);
  if (stale.error) throw new Error(`sponsors cleanup: ${stale.error.message}`);

  const places = rankPlaces(sponsors).map(([place, n]) => ({ place, n }));
  const cleared = await db.from("places").delete().neq("place", "");
  if (cleared.error) throw new Error(`places: ${cleared.error.message}`);
  await upsert(db, "places", places, "place");
}

/** Stores a finished job index: upserts current jobs, drops ones no longer listed, logs the run. */
export async function syncJobs(
  db: SupabaseClient,
  jobs: IndexedJob[],
  run: { generatedAt: string; sponsorsIndexed: number }
): Promise<void> {
  const seenAt = run.generatedAt;
  await upsert(db, "jobs", jobs.map((j) => jobToRow(j, seenAt)), "url");
  const stale = await db.from("jobs").delete().lt("last_seen_at", seenAt);
  if (stale.error) throw new Error(`jobs cleanup: ${stale.error.message}`);
  const logged = await db.from("index_runs").insert({
    generated_at: run.generatedAt,
    sponsors_indexed: run.sponsorsIndexed,
    job_count: jobs.length,
  });
  if (logged.error) throw new Error(`index_runs: ${logged.error.message}`);
}

interface EnrichmentRow {
  name: string;
  data: StoredEnrichment;
  checked_at: string | null;
}

const toRow = (name: string, entry: StoredEnrichment) => ({
  name,
  data: entry,
  checked_at: entry.checkedAt ?? null,
  updated_at: new Date().toISOString(),
});

/** Bulk-loads enrichment records (used by the one-off migration). */
export async function syncEnrichment(db: SupabaseClient, entries: Record<string, StoredEnrichment>): Promise<void> {
  await upsert(db, "sponsor_enrichment", Object.entries(entries).map(([n, e]) => toRow(n, e)), "name");
}

/** Enrichment store backed by the sponsor_enrichment table (server-side, service role). */
export function createSupabaseStore(db: SupabaseClient): EnrichmentStore {
  return {
    async get(names) {
      const out: Record<string, StoredEnrichment> = {};
      // Names go in the query string, so big or awkward lookups read the whole table instead
      const awkward = names.some((n) => /["\\]/.test(n));
      if (names.length > 200 || awkward) {
        const wanted = new Set(names);
        const rows = await fetchAll<EnrichmentRow>((from, to) =>
          db.from("sponsor_enrichment").select("name,data,checked_at").order("name").range(from, to)
        );
        for (const r of rows) if (wanted.has(r.name)) out[r.name] = r.data;
        return out;
      }
      for (let i = 0; i < names.length; i += 100) {
        const { data, error } = await db
          .from("sponsor_enrichment")
          .select("name,data,checked_at")
          .in("name", names.slice(i, i + 100));
        if (error) throw new Error(`sponsor_enrichment: ${error.message}`);
        for (const r of (data ?? []) as EnrichmentRow[]) out[r.name] = r.data;
      }
      return out;
    },
    async set(entries) {
      await syncEnrichment(db, entries);
    },
  };
}

/** Reads the whole register back from Supabase, in register order (used by the scripts). */
export async function fetchAllSponsors(db: SupabaseClient): Promise<Sponsor[]> {
  const rows = await fetchAll<SponsorRow>((from, to) =>
    db.from("sponsors").select(SPONSOR_COLUMNS).order("ord").range(from, to)
  );
  return rows.map(rowToSponsor);
}
