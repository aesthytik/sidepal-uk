/**
 * One-off: loads the local data files in public/data into Supabase. Idempotent: safe to re-run.
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env or the environment).
 *
 *   npx ts-node-script --transpile-only \
 *     --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' \
 *     scripts/migrate-to-supabase.ts
 */
import "./env";
import fs from "fs";
import path from "path";
import { parseRegisterCsv, toSponsors } from "../src/lib/directory/core";
import type { IndexedJob } from "../src/lib/jobs/indexer";
import type { StoredEnrichment } from "../src/lib/enrichment/store";
import { supabaseAdmin } from "../src/lib/supabase/client";
import { syncEnrichment, syncJobs, syncSponsors } from "../src/lib/supabase/sync";

const dir = path.join(process.cwd(), "public", "data");
const readJson = <T>(file: string, fallback: T): T =>
  fs.existsSync(path.join(dir, file)) ? JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) : fallback;

async function main() {
  const db = supabaseAdmin();

  const csv = fs.readdirSync(dir).filter((f) => f.endsWith(".csv")).sort().pop();
  if (!csv) throw new Error(`No register CSV in ${dir}`);
  const overrides = readJson<Record<string, never>>("sector-overrides.json", {});
  const sponsors = toSponsors(parseRegisterCsv(fs.readFileSync(path.join(dir, csv), "utf-8")), overrides);
  const registerDate = csv.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  console.log(`Sponsors: ${sponsors.length} from ${csv}`);
  await syncSponsors(db, sponsors, { overrides, registerDate });

  const cache = readJson<{ version?: number; sponsors?: Record<string, StoredEnrichment> }>("enrichment-cache.json", {});
  if (cache.version !== 2) throw new Error("enrichment-cache.json is not the v2 format");
  const enrichment = cache.sponsors ?? {};
  console.log(`Enrichment: ${Object.keys(enrichment).length} sponsors`);
  await syncEnrichment(db, enrichment);

  const index = readJson<{ generatedAt: string; sponsorsIndexed: number; jobs: IndexedJob[] } | null>("jobs.json", null);
  if (index) {
    console.log(`Jobs: ${index.jobs.length}`);
    await syncJobs(db, index.jobs, { generatedAt: index.generatedAt, sponsorsIndexed: index.sponsorsIndexed });
  }
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
