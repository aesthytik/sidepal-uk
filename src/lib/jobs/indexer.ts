import { type AtsBoard, boardName, fetchAllJobs } from "../enrichment/ats";
import type { Http } from "../enrichment/http";
import { mapPool } from "../enrichment";
import { findCareers } from "../enrichment/careers";
import type { EnrichmentStore } from "../enrichment/store";
import type { SectorId } from "../sectors/taxonomy";
import type { AtsProvider, Job, Sponsor } from "../sponsorTypes";

const PROVIDERS: AtsProvider[] = ["greenhouse", "lever", "ashby", "workable"];
const SNIPPET_LENGTH = 300;
const RETRY_MISSING_MS = 30 * 24 * 60 * 60 * 1000;
const PRIORITY_SECTORS: SectorId[] = ["tech", "finance", "health", "science"];

/** A job in the index, with the sponsor details the jobs page needs. */
export interface IndexedJob extends Job {
  sponsorId: string;
  sponsor: string;
  rating: string;
  sector?: SectorId;
  visaTypes: string[];
  provider: AtsProvider;
}

export interface JobIndex {
  version: 1;
  generatedAt: string;
  sponsorsIndexed: number;
  jobs: IndexedJob[];
}

const LEGAL = /\b(limited|ltd|plc|llp|llc|inc|incorporated|uk|u k|group|holdings|company|co)\b/g;

/** Lower-case letters and digits only, with legal suffixes removed: "Monzo Bank Ltd" -> "monzo bank". */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(LEGAL, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Likely job-board slugs for a company. `exact` variants use the whole name;
 * the others (first word only) are riskier and must be confirmed by the board's own name.
 */
export function slugVariants(name: string): { slug: string; exact: boolean }[] {
  const names = [name.split(/\s+t\/a\s+/i)[0], name.split(/\s+t\/a\s+/i)[1]].filter((n): n is string => Boolean(n));
  const out = new Map<string, boolean>();
  for (const n of names) {
    const words = normalise(n).split(" ").filter(Boolean);
    if (words.length === 0) continue;
    for (const slug of [words.join(""), words.join("-")]) if (slug.length >= 3) out.set(slug, true);
    if (words.length > 1 && words[0].length >= 4 && !out.has(words[0])) out.set(words[0], false);
  }
  return Array.from(out, ([slug, exact]) => ({ slug, exact }));
}

// Words a company name may add to its brand without becoming a different company
const GENERIC_EXTRA = new Set([
  "bank", "partners", "technology", "technologies", "tech", "systems", "software", "labs", "capital",
  "solutions", "digital", "global", "international", "europe", "emea", "financial", "management", "advisors",
  "advisory", "research", "networks", "therapeutics", "ai", "data", "cloud", "security", "energy", "ventures",
]);

/**
 * Whether a board's self-reported company name plausibly belongs to the sponsor:
 * the same name, or the sponsor adds one generic word ("Monzo Bank" for "Monzo").
 * "Ebury Court Residential Home" or "Asana Healthcare" are not "Ebury" or "Asana".
 */
export function namesMatch(sponsor: string, board: string): boolean {
  const variants = sponsor.split(/\s+t\/a\s+/i).map(normalise).filter(Boolean);
  const b = normalise(board);
  if (!b) return false;
  const addsGenericWord = (long: string, short: string) =>
    long.startsWith(short + " ") && GENERIC_EXTRA.has(long.slice(short.length).trim());
  return variants.some((a) => a === b || (Math.min(a.length, b.length) >= 4 && (addsGenericWord(a, b) || addsGenericWord(b, a))));
}

/** Tries guessed slugs on each provider. Returns the board and its jobs, or null. */
export async function guessBoard(
  sponsorName: string,
  http: Http
): Promise<{ board: AtsBoard; jobs: Job[] } | null> {
  for (const { slug, exact } of slugVariants(sponsorName)) {
    for (const provider of PROVIDERS) {
      const board: AtsBoard = { provider, slug };
      const jobs = await fetchAllJobs(board, http);
      if (!jobs) continue;
      const reported = await boardName(board, http);
      // Providers that name their boards must agree; others are accepted on an exact-name slug only
      const confirmed = reported !== null ? namesMatch(sponsorName, reported) : exact;
      if (confirmed) return { board, jobs };
    }
  }
  return null;
}

/** Skilled Worker sponsors, A-rated, in sectors that hire on job boards come first. */
export function priority(s: Sponsor): number {
  return (
    (s.visaTypes.includes("Skilled Worker") ? 4 : 0) +
    (s.rating.startsWith("A") ? 2 : 0) +
    (s.sector && PRIORITY_SECTORS.includes(s.sector) ? 1 : 0)
  );
}

export interface IndexOptions {
  sponsors: Sponsor[];
  store: EnrichmentStore;
  http: Http;
  budgetMs: number; // Stop looking for new boards after this long
  concurrency?: number;
  now?: () => number;
  onProgress?: (message: string) => void;
}

function toIndexed(s: Sponsor, board: AtsBoard, jobs: Job[]): IndexedJob[] {
  return jobs
    .filter((j) => j.uk)
    .map((j) => ({
      ...j,
      snippet: j.snippet?.slice(0, SNIPPET_LENGTH),
      sponsorId: s.id,
      sponsor: s.name,
      rating: s.rating,
      sector: s.sector,
      visaTypes: s.visaTypes,
      provider: board.provider,
    }));
}

/**
 * Finds job boards for sponsors (remembering results in the store), then
 * collects every UK role from the boards it knows. Resumable: sponsors already
 * checked are skipped until their "nothing found" result goes stale.
 */
export async function buildIndex(opts: IndexOptions): Promise<JobIndex> {
  const { sponsors, store, http, budgetMs, concurrency = 16, onProgress } = opts;
  const now = opts.now ?? Date.now;
  const started = now();
  const stored = await store.get(sponsors.map((s) => s.name));

  const ordered = [...sponsors].sort((a, b) => priority(b) - priority(a));
  const needsLookup = ordered.filter((s) => {
    const rec = stored[s.name];
    if (rec?.ats) return false;
    if (rec?.ats === null && rec.checkedAt && now() - Date.parse(rec.checkedAt) < RETRY_MISSING_MS) return false;
    return true;
  });

  const byId = new Map<string, IndexedJob[]>();
  const boardKey = (b: AtsBoard) => `${b.provider}:${b.slug.toLowerCase()}`;
  // A board belongs to one sponsor. If two claim it we can't tell which is right, so neither gets it.
  const owners = new Map<string, Sponsor>();
  for (const s of sponsors) if (stored[s.name]?.ats) owners.set(boardKey(stored[s.name].ats as AtsBoard), s);
  const disputed = new Set<string>();
  let discovered = 0;
  let checked = 0;

  await mapPool(needsLookup, concurrency, async (s) => {
    if (now() - started > budgetMs) return;
    checked++;
    let found = await guessBoard(s.name, http);
    if (!found && stored[s.name]?.website) {
      const careers = await findCareers(http, stored[s.name].website as string);
      if (careers.ats) {
        const jobs = await fetchAllJobs(careers.ats, http);
        if (jobs) found = { board: careers.ats, jobs };
      }
    }
    if (found) {
      const key = boardKey(found.board);
      const other = owners.get(key);
      if (other && other.id !== s.id) {
        disputed.add(key);
        byId.delete(other.id);
        stored[other.name] = { ...stored[other.name], ats: null };
        await store.set({ [other.name]: { ...stored[other.name], ats: null, checkedAt: new Date(now()).toISOString() } });
        found = null;
      } else {
        owners.set(key, s);
      }
    }
    await store.set({
      [s.name]: { ...stored[s.name], ats: found?.board ?? null, checkedAt: new Date(now()).toISOString() },
    });
    if (found) {
      discovered++;
      byId.set(s.id, toIndexed(s, found.board, found.jobs));
    }
    if (checked % 200 === 0) onProgress?.(`checked ${checked}/${needsLookup.length}, found ${discovered} boards`);
  });

  // Refresh jobs for every board known from earlier runs
  const known = sponsors.filter((s) => stored[s.name]?.ats && !byId.has(s.id) && !disputed.has(boardKey(stored[s.name].ats as AtsBoard)));
  await mapPool(known, concurrency, async (s) => {
    const board = stored[s.name].ats as AtsBoard;
    const jobs = await fetchAllJobs(board, http);
    if (jobs) byId.set(s.id, toIndexed(s, board, jobs));
  });

  const seen = new Set<string>();
  const jobs = [...byId.values()]
    .flat()
    .filter((j) => !seen.has(j.url) && seen.add(j.url))
    .sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
  return { version: 1, generatedAt: new Date(now()).toISOString(), sponsorsIndexed: new Set(jobs.map((j) => j.sponsorId)).size, jobs };
}
