import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";
import { SponsorRaw } from "./sponsorTypes";

export const DATA_DIR = path.join(process.cwd(), "public", "data");

const REGISTER_PAGE_URL =
  "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

/**
 * Extracts the rating from the "Type & Rating" column,
 * e.g. "Worker (A rating)" -> "A", "Worker (A (SME+))" -> "A (SME+)"
 */
function parseRating(typeAndRating: string): string {
  const match = typeAndRating.match(/\((.*)\)\s*$/);
  if (!match) return "";
  return match[1].replace(/\s*rating$/i, "").trim();
}

/**
 * Processes raw CSV text into structured sponsor data. The register has one
 * row per (organisation, route), so rows are grouped by organisation and
 * their routes merged.
 */
export function processCSVText(text: string): SponsorRaw[] {
  const { data, errors } = Papa.parse<Record<string, string>>(
    text.replace(/^﻿/, ""),
    {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    }
  );

  if (errors.length > 0) {
    console.error(`CSV parsing errors (${errors.length}):`, errors.slice(0, 5));
  }

  const byName = new Map<string, SponsorRaw>();

  for (const row of data) {
    const name = row["Organisation Name"]?.trim();
    if (!name) continue;

    const route = row["Route"]?.trim() || "";
    const rating = parseRating(row["Type & Rating"]?.trim() || "");
    const existing = byName.get(name);

    if (existing) {
      if (route && !existing.routes.includes(route)) existing.routes.push(route);
      if (!existing.rating && rating) existing.rating = rating;
      if (!existing.city && row["Town/City"]) existing.city = row["Town/City"].trim();
      if (!existing.county && row["County"]) existing.county = row["County"].trim();
    } else {
      byName.set(name, {
        name,
        city: row["Town/City"]?.trim() || "",
        county: row["County"]?.trim() || "",
        routes: route ? [route] : [],
        rating,
      });
    }
  }

  return Array.from(byName.values());
}

/**
 * Finds the most recent register CSV in public/data (by modification time).
 */
export async function findLocalCsvPath(): Promise<string | null> {
  try {
    const files = (await fs.readdir(DATA_DIR)).filter((f) =>
      f.toLowerCase().endsWith(".csv")
    );
    if (files.length === 0) return null;

    const withTimes = await Promise.all(
      files.map(async (f) => {
        const full = path.join(DATA_DIR, f);
        return { full, mtime: (await fs.stat(full)).mtimeMs };
      })
    );
    withTimes.sort((a, b) => b.mtime - a.mtime);
    return withTimes[0].full;
  } catch {
    return null;
  }
}

/**
 * Reads and parses the latest local sponsor list CSV file
 */
export async function fetchLocalCsv(): Promise<SponsorRaw[]> {
  const csvPath = await findLocalCsvPath();
  if (!csvPath) throw new Error(`No sponsor CSV found in ${DATA_DIR}`);
  console.log("Reading local CSV from:", csvPath);
  const text = await fs.readFile(csvPath, "utf-8");
  return processCSVText(text);
}

/**
 * Finds the URL of the latest register CSV by scanning the GOV.UK
 * publication page. SPONSOR_CSV_URL overrides this if set.
 */
export async function findLatestCsvUrl(): Promise<string> {
  if (process.env.SPONSOR_CSV_URL) return process.env.SPONSOR_CSV_URL;

  const res = await fetch(REGISTER_PAGE_URL, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch register page: ${res.status}`);
  }
  const html = await res.text();
  const match = html.match(
    /https:\/\/assets\.publishing\.service\.gov\.uk\/[^"'\s]+?\.csv/i
  );
  if (!match) throw new Error("No CSV link found on the register page");
  return match[0];
}

/**
 * Downloads the latest register CSV from GOV.UK.
 */
export async function downloadLatestCsv(): Promise<{
  url: string;
  fileName: string;
  text: string;
}> {
  const url = await findLatestCsvUrl();
  console.log("Fetching CSV from:", url);
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const fileName = decodeURIComponent(url.split("/").pop() || "register.csv");
  return { url, fileName, text };
}
