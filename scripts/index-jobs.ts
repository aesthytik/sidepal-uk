/**
 * Builds the job index in Supabase: finds job boards for sponsors and collects their UK roles.
 * Resumable (boards found or ruled out are remembered in the sponsor_enrichment table).
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 *   npx ts-node-script --transpile-only \
 *     --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' \
 *     scripts/index-jobs.ts [budgetMinutes=40]
 */
import "./env";
import { buildIndex } from "../src/lib/jobs/indexer";
import { supabaseAdmin } from "../src/lib/supabase/client";
import { createSupabaseStore, fetchAllSponsors, syncJobs } from "../src/lib/supabase/sync";

async function main() {
  const minutes = process.argv[2] === undefined ? 40 : Number(process.argv[2]);
  const budgetMs = (Number.isFinite(minutes) ? minutes : 40) * 60_000;
  const db = supabaseAdmin();

  const sponsors = await fetchAllSponsors(db);
  if (sponsors.length === 0) throw new Error("No sponsors in Supabase; run scripts/migrate-to-supabase.ts first");
  console.log(`${sponsors.length} sponsors loaded`);

  const index = await buildIndex({
    sponsors,
    store: createSupabaseStore(db),
    http: fetch,
    budgetMs,
    onProgress: (m) => console.log(m),
  });

  // An empty result almost certainly means the boards were unreachable; keep yesterday's jobs
  if (index.jobs.length === 0) throw new Error("Index found no jobs; leaving the existing jobs untouched");
  await syncJobs(db, index.jobs, { generatedAt: index.generatedAt, sponsorsIndexed: index.sponsorsIndexed });
  console.log(`${index.jobs.length} UK jobs from ${index.sponsorsIndexed} sponsors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
