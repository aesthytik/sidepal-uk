import fs from "fs/promises";
import path from "path";
import type { SectorId } from "../sectors/taxonomy";
import type { SearchPage, SearchQuery, Sponsor } from "../sponsorTypes";
import { createDirectory, parseRegisterCsv, type Directory } from "./core";

export const DATA_DIR = path.join(process.cwd(), "public", "data");

const REGISTER_PAGE_URL =
  "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

// A real register has well over 100k organisations; anything far smaller
// is a truncated or malformed download and must not replace good data.
const MIN_SPONSORS = 10_000;

interface Loaded {
  directory: Directory;
  source: string;
  loadedAt: string;
}

let current: Loaded | null = null;
let loading: Promise<Loaded> | null = null;

/** The most recent register CSV in public/data, by modification time. */
async function findLocalCsv(): Promise<string | null> {
  try {
    const files = (await fs.readdir(DATA_DIR)).filter((f) => f.toLowerCase().endsWith(".csv"));
    const withTimes = await Promise.all(
      files.map(async (f) => {
        const full = path.join(DATA_DIR, f);
        return { full, mtime: (await fs.stat(full)).mtimeMs };
      })
    );
    withTimes.sort((a, b) => b.mtime - a.mtime);
    return withTimes[0]?.full ?? null;
  } catch {
    return null;
  }
}

/** AI-classified sectors from scripts/classify-sectors.ts, if that has been run. */
async function loadSectorOverrides(): Promise<Record<string, SectorId | null>> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, "sector-overrides.json"), "utf-8"));
  } catch {
    return {};
  }
}

async function load(): Promise<Loaded> {
  if (current) return current;
  loading ??= (async () => {
    const csvPath = await findLocalCsv();
    if (!csvPath) throw new Error(`No sponsor CSV found in ${DATA_DIR}`);
    const rows = parseRegisterCsv(await fs.readFile(csvPath, "utf-8"));
    current = {
      directory: createDirectory(rows, await loadSectorOverrides()),
      source: path.basename(csvPath),
      loadedAt: new Date().toISOString(),
    };
    console.log(`Loaded ${current.directory.count} sponsors from ${current.source}`);
    return current;
  })().finally(() => {
    loading = null;
  });
  return loading;
}

export async function searchSponsors(query: SearchQuery): Promise<SearchPage> {
  return (await load()).directory.search(query);
}

export async function getSponsors(ids: string[]): Promise<Sponsor[]> {
  return (await load()).directory.getByIds(ids);
}

export async function suggestLocations(prefix: string): Promise<string[]> {
  return (await load()).directory.suggestLocations(prefix);
}

/**
 * Size and provenance of the loaded register. The register date is taken
 * from the GOV.UK file name, e.g. "...Register_-_2026-10-02.csv".
 */
export async function directoryInfo() {
  const { directory, source, loadedAt } = await load();
  return {
    count: directory.count,
    source,
    registerDate: source.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null,
    loadedAt,
  };
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

/**
 * Downloads the latest register from GOV.UK and swaps it in. The CSV is
 * saved to public/data when the filesystem is writable; otherwise the new
 * data is kept in memory for this instance only.
 */
export async function refreshFromGovUk(): Promise<{ count: number; source: string; saved: boolean }> {
  const url = await findLatestCsvUrl();
  console.log("Fetching register from:", url);
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  const text = await res.text();

  const rows = parseRegisterCsv(text);
  if (rows.length < MIN_SPONSORS) {
    throw new Error(`Downloaded CSV only had ${rows.length} sponsors; aborting`);
  }

  const fileName = decodeURIComponent(url.split("/").pop() || "register.csv");
  let saved = false;
  try {
    await fs.writeFile(path.join(DATA_DIR, fileName), text, "utf-8");
    // Remove older registers so the newest one is always loaded
    const others = (await fs.readdir(DATA_DIR)).filter(
      (f) => f.toLowerCase().endsWith(".csv") && f !== fileName
    );
    await Promise.all(others.map((f) => fs.unlink(path.join(DATA_DIR, f))));
    saved = true;
  } catch (error) {
    console.warn("Could not save CSV to disk, keeping in memory only:", error);
  }

  current = {
    directory: createDirectory(rows, await loadSectorOverrides()),
    source: fileName,
    loadedAt: new Date().toISOString(),
  };
  return { count: current.directory.count, source: url, saved };
}
