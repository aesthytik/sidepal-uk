import { supabaseRead } from "../supabase/client";
import { CHANGE_TYPES, type RecordedSponsorChange, type SponsorChangeType } from "./changes";

const COLUMNS = "id,sponsor_id,sponsor_name,location,change_type,previous_value,new_value,register_date,observed_at,source_url";
const PAGE_SIZE = 30;

interface ChangeRow {
  id: number;
  sponsor_id: string;
  sponsor_name: string;
  location: string;
  change_type: SponsorChangeType;
  previous_value: string | null;
  new_value: string | null;
  register_date: string | null;
  observed_at: string;
  source_url: string;
}

const toChange = (r: ChangeRow): RecordedSponsorChange => ({
  id: r.id, sponsorId: r.sponsor_id, sponsorName: r.sponsor_name, location: r.location,
  type: r.change_type, previousValue: r.previous_value, newValue: r.new_value,
  registerDate: r.register_date, observedAt: r.observed_at, source: r.source_url,
});

export interface ChangeFilters {
  type?: SponsorChangeType;
  location: string;
  page: number;
}

export function parseChangeFilters(params: Record<string, string | string[] | undefined>): ChangeFilters {
  const requested = typeof params.page === "string" ? Number(params.page) : NaN;
  return {
    type: CHANGE_TYPES.find((type) => type === params.type),
    location: typeof params.location === "string" ? params.location.trim().slice(0, 120) : "",
    page: Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 10_000) : 1,
  };
}

/** Public history is kept separately from sponsors so removals remain visible. */
export async function searchSponsorChanges(filters: ChangeFilters): Promise<{ items: RecordedSponsorChange[]; hasMore: boolean }> {
  let query = supabaseRead().from("sponsor_changes").select(COLUMNS)
    .order("observed_at", { ascending: false }).order("id", { ascending: false });
  if (filters.type) query = query.eq("change_type", filters.type);
  if (filters.location) {
    // Escape LIKE metacharacters; the location is a literal substring, never a filter expression.
    const location = filters.location.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("location", `%${location}%`);
  }
  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, error } = await query.range(from, from + PAGE_SIZE);
  if (error) throw new Error(`Sponsor changes failed: ${error.message}`);
  const rows = (data ?? []) as ChangeRow[];
  return { items: rows.slice(0, PAGE_SIZE).map(toChange), hasMore: rows.length > PAGE_SIZE };
}

export async function sponsorHistory(name: string): Promise<{ items: RecordedSponsorChange[]; licensedSince: RecordedSponsorChange | null }> {
  const db = supabaseRead();
  const [recent, licensed] = await Promise.all([
    db.from("sponsor_changes").select(COLUMNS).eq("sponsor_name", name)
      .order("observed_at", { ascending: false }).order("id", { ascending: false }).limit(20),
    // Fetch this independently: a sponsor can have more than 20 route/rating events.
    // The latest addition starts its current spell on the register if it was relicensed.
    db.from("sponsor_changes").select(COLUMNS).eq("sponsor_name", name).eq("change_type", "newly_licensed")
      .order("observed_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (recent.error) throw new Error(`Sponsor history failed: ${recent.error.message}`);
  if (licensed.error) throw new Error(`Sponsor history failed: ${licensed.error.message}`);
  return {
    items: ((recent.data ?? []) as ChangeRow[]).map(toChange),
    licensedSince: licensed.data ? toChange(licensed.data as ChangeRow) : null,
  };
}
