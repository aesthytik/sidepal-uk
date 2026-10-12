import type { SectorId } from "../sectors/taxonomy";
import { roleFamily } from "../sectors/taxonomy";
import type { SearchPage, SearchQuery, Sponsor } from "../sponsorTypes";
import { supabaseAdmin, supabaseRead } from "../supabase/client";
import { SPONSOR_COLUMNS, type SponsorRow, rowToSponsor } from "../supabase/mappers";
import { syncSponsors } from "../supabase/sync";
import { parseRegisterCsv, toSponsors } from "./core";

const REGISTER_PAGE_URL =
  "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

// A real register has well over 100k organisations; anything far smaller
// is a truncated or malformed download and must not replace good data.
const MIN_SPONSORS = 10_000;
const MAX_IDS = 200;
const INFO_CACHE_MS = 5 * 60_000;

interface SearchRow extends SponsorRow {
  total: number;
  page: number;
  page_count: number;
  fuzzy: boolean;
}

export async function searchSponsors(query: SearchQuery): Promise<SearchPage> {
  const family = query.role ? roleFamily(query.role) : undefined;
  const { data, error } = await supabaseRead().rpc("search_sponsors", {
    q: query.q ?? null,
    loc: query.location ?? null,
    visa: query.visa ?? null,
    rating_a: query.rating === "A",
    sector_filter: query.sector ?? null,
    sector_any: family ? [...family.sectors] : null,
    lim: query.limit ?? 20,
    pg: query.page ?? 1,
  });
  if (error) throw new Error(`Sponsor search failed: ${error.message}`);

  const rows = (data ?? []) as SearchRow[];
  if (rows.length === 0) return { items: [], total: 0, page: 1, pageCount: 1, fuzzy: false };
  const first = rows[0];
  return {
    items: rows.map(rowToSponsor),
    total: Number(first.total),
    page: first.page,
    pageCount: first.page_count,
    fuzzy: first.fuzzy,
  };
}

export async function getSponsors(ids: string[]): Promise<Sponsor[]> {
  const wanted = ids.slice(0, MAX_IDS);
  if (wanted.length === 0) return [];
  const { data, error } = await supabaseRead().from("sponsors").select(SPONSOR_COLUMNS).in("id", wanted);
  if (error) throw new Error(`Sponsor lookup failed: ${error.message}`);
  const byId = new Map((data as SponsorRow[]).map((r) => [r.id, rowToSponsor(r)]));
  return wanted.map((id) => byId.get(id)).filter((s): s is Sponsor => Boolean(s));
}

export async function suggestLocations(prefix: string, limit = 8): Promise<string[]> {
  const db = supabaseRead();
  const p = prefix.trim().replace(/[\\%_,()"]/g, " ").replace(/\s+/g, " ").trim();
  const base = () => db.from("places").select("place").order("n", { ascending: false });

  if (!p) {
    const { data, error } = await base().limit(limit);
    if (error) throw new Error(`Location lookup failed: ${error.message}`);
    return (data ?? []).map((r) => r.place as string);
  }

  const starts = await base().ilike("place", `${p}%`).limit(limit);
  if (starts.error) throw new Error(`Location lookup failed: ${starts.error.message}`);
  const out = (starts.data ?? []).map((r) => r.place as string);
  if (out.length >= limit) return out;

  const contains = await base().ilike("place", `%${p}%`).limit(limit * 2);
  if (contains.error) throw new Error(`Location lookup failed: ${contains.error.message}`);
  for (const r of contains.data ?? []) {
    if (out.length >= limit) break;
    if (!out.includes(r.place as string)) out.push(r.place as string);
  }
  return out;
}

let infoCache: { at: number; value: DirectoryInfo } | null = null;

export interface DirectoryInfo {
  count: number;
  source: string;
  registerDate: string | null;
  loadedAt: string | null;
}

/** Size and provenance of the register stored in Supabase. */
export async function directoryInfo(): Promise<DirectoryInfo> {
  if (infoCache && Date.now() - infoCache.at < INFO_CACHE_MS) return infoCache.value;
  const db = supabaseRead();
  const [count, latest] = await Promise.all([
    db.from("sponsors").select("id", { count: "exact", head: true }),
    db
      .from("sponsors")
      .select("register_date,updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (count.error) throw new Error(`Directory info failed: ${count.error.message}`);
  const value: DirectoryInfo = {
    count: count.count ?? 0,
    source: "GOV.UK register of licensed sponsors",
    registerDate: latest.data?.register_date ?? null,
    loadedAt: latest.data?.updated_at ?? null,
  };
  infoCache = { at: Date.now(), value };
  return value;
}

/** Finds the latest register CSV link on the GOV.UK publication page. */
async function findLatestCsvUrl(): Promise<string> {
  if (process.env.SPONSOR_CSV_URL) return process.env.SPONSOR_CSV_URL;
  const res = await fetch(REGISTER_PAGE_URL, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Failed to fetch register page: ${res.status}`);
  const match = (await res.text()).match(
    /https:\/\/assets\.publishing\.service\.gov\.uk\/[^"'\s]+?\.csv/i
  );
  if (!match) throw new Error("No CSV link found on the register page");
  return match[0];
}

/** Sector overrides saved by scripts/classify-sectors.ts, keyed by sponsor name. */
export async function loadSectorOverrides(): Promise<Record<string, SectorId | null>> {
  const db = supabaseAdmin();
  const out: Record<string, SectorId | null> = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("sponsors")
      .select("name,sector_override")
      .eq("override_set", true)
      .order("name")
      .range(from, from + 999);
    if (error) throw new Error(`Could not read sector overrides: ${error.message}`);
    for (const r of data ?? []) out[r.name] = r.sector_override as SectorId | null;
    if (!data || data.length < 1000) return out;
  }
}

/** Downloads the latest register from GOV.UK and stores it in Supabase. */
export async function refreshFromGovUk(): Promise<{ count: number; source: string; saved: boolean }> {
  const url = await findLatestCsvUrl();
  console.log("Fetching register from:", url);
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);

  const rows = parseRegisterCsv(await res.text());
  if (rows.length < MIN_SPONSORS) {
    throw new Error(`Downloaded CSV only had ${rows.length} sponsors; aborting`);
  }

  const overrides = await loadSectorOverrides();
  const sponsors = toSponsors(rows, overrides);
  const registerDate = decodeURIComponent(url).match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  await syncSponsors(supabaseAdmin(), sponsors, { overrides, registerDate });
  infoCache = null;
  return { count: sponsors.length, source: url, saved: true };
}
