import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectorId } from "../sectors/taxonomy";
import type { Sponsor } from "../sponsorTypes";
import { rankPlaces } from "../directory/core";
import { createChangeRecorder, type RegisterSnapshot, type SponsorChange } from "../directory/changes";
import type { IndexedJob } from "../jobs/indexer";
import type { EnrichmentStore, StoredEnrichment } from "../enrichment/store";
import { fetchAll } from "./client";
import { SPONSOR_COLUMNS, type SponsorRow, jobToRow, rowToSponsor, sponsorToRow } from "./mappers";

const BATCH = 500;
const CONCURRENCY = 3;

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

const SPONSOR_FIELDS = [
  "id", "name", "city", "county", "location", "rating", "routes", "visa_types",
  "sector", "sector_override", "override_set", "ord", "register_date",
] as const;

const signature = (row: Record<string, unknown>) => JSON.stringify(SPONSOR_FIELDS.map((f) => row[f] ?? null));

/**
 * Brings the register in Supabase in line with `sponsors`: upserts only organisations that
 * are new or changed (rewriting all 127k rows is slow and bloats the indexes), removes ones no
 * longer listed, and rebuilds the ranked places used for location suggestions.
 */
export async function syncSponsors(
  db: SupabaseClient,
  sponsors: Sponsor[],
  opts: { overrides: Record<string, SectorId | null>; snapshot: RegisterSnapshot }
): Promise<number> {
  const rows = sponsors.map((s, i) => sponsorToRow(s, i, {
    overrides: opts.overrides, registerDate: opts.snapshot.registerDate, stamp: opts.snapshot.observedAt,
  }));

  const existing = await fetchAll<SponsorRow & Record<string, unknown>>((from, to) =>
    db.from("sponsors").select(SPONSOR_FIELDS.join(",")).order("name").range(from, to).returns<(SponsorRow & Record<string, unknown>)[]>()
  );
  const stored = new Map(existing.map((r) => [r.name as string, signature(r)]));

  // Names are the natural key (enrichment is keyed by them); ids may shift if slugs collide
  const changed = rows.filter((r) => stored.get(r.name) !== signature(r));
  console.log(`Sponsors: ${changed.length} new or changed of ${rows.length}`);
  const current = new Set(rows.map((r) => r.name));
  const removed = existing.map((r) => r.name as string).filter((n) => !current.has(n));

  const recordChanges = createChangeRecorder({
    store: {
      async save(changes, snapshot) {
        const byName = new Map<string, SponsorChange[]>();
        for (const change of changes) {
          const events = byName.get(change.sponsorName) ?? [];
          events.push(change);
          byName.set(change.sponsorName, events);
        }
        const eventsFor = (names: string[]) => names.flatMap((name) => (byName.get(name) ?? []).map((c) => ({
          snapshot_key: snapshot.key, sponsor_id: c.sponsorId, sponsor_name: c.sponsorName,
          location: c.location, change_type: c.type, previous_value: c.previousValue, new_value: c.newValue,
          register_date: snapshot.registerDate, observed_at: snapshot.observedAt, source_url: snapshot.source,
        })));

        // The RPC commits each batch and its history together. A failed batch
        // leaves the old sponsors available to diff on the next refresh.
        await inBatches(changed, BATCH, async (batch) => {
          const { error } = await db.rpc("apply_sponsor_register_batch", {
            sponsor_rows: batch, removed_names: [], change_rows: eventsFor(batch.map((r) => r.name)),
          });
          if (error) throw new Error(`sponsors and history: ${error.message}`);
        });
        await inBatches(removed, 100, async (batch) => {
          const { error } = await db.rpc("apply_sponsor_register_batch", {
            sponsor_rows: [], removed_names: batch, change_rows: eventsFor(batch),
          });
          if (error) throw new Error(`sponsors cleanup and history: ${error.message}`);
        });
      },
    },
  });
  const changeCount = await recordChanges(existing.length ? existing.map(rowToSponsor) : null, sponsors, opts.snapshot);
  if (removed.length) console.log(`Sponsors: removed ${removed.length} no longer listed`);

  const places = rankPlaces(sponsors).map(([place, n]) => ({ place, n }));
  const cleared = await db.from("places").delete().neq("place", "");
  if (cleared.error) throw new Error(`places: ${cleared.error.message}`);
  await upsert(db, "places", places, "place");
  return changeCount;
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
