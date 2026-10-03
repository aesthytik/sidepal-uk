/**
 * Builds public/data/jobs.json: finds job boards for sponsors and collects their UK roles.
 * Resumable (boards found or ruled out are remembered in public/data/enrichment-cache.json).
 *
 *   npx ts-node-script --transpile-only \
 *     --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' \
 *     scripts/index-jobs.ts [budgetMinutes=40]
 */
import fs from "fs";
import path from "path";
import { createDirectory, parseRegisterCsv } from "../src/lib/directory/core";
import { createFileStore } from "../src/lib/enrichment/store";
import { buildIndex } from "../src/lib/jobs/indexer";

const dir = path.join(process.cwd(), "public", "data");

async function main() {
  const budgetMs = (Number(process.argv[2]) || 40) * 60_000;
  const csv = fs.readdirSync(dir).filter((f) => f.endsWith(".csv")).sort().pop();
  if (!csv) throw new Error(`No register CSV in ${dir}`);
  const overridesFile = path.join(dir, "sector-overrides.json");
  const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, "utf-8")) : {};
  const sponsors = createDirectory(parseRegisterCsv(fs.readFileSync(path.join(dir, csv), "utf-8")), overrides).all();

  const store = createFileStore(path.join(dir, "enrichment-cache.json"));
  const index = await buildIndex({
    sponsors,
    store,
    http: fetch,
    budgetMs,
    onProgress: (m) => console.log(m),
  });

  fs.writeFileSync(path.join(dir, "jobs.json"), JSON.stringify(index));
  console.log(`${index.jobs.length} UK jobs from ${index.sponsorsIndexed} sponsors`);
  // The cache store writes after a short delay
  await new Promise((r) => setTimeout(r, 2000));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
