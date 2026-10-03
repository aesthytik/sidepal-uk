/**
 * One-off: classifies sponsors the name rules can't place, using the OpenRouter model,
 * and writes public/data/sector-overrides.json. Resumable; safe to stop and re-run.
 *
 *   OPENROUTER_API_KEY=... npx ts-node-script --transpile-only \
 *     --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' \
 *     scripts/classify-sectors.ts [maxNames]
 *
 * Only public company names are sent. Skilled Worker sponsors go first.
 */
import fs from "fs";
import path from "path";
import { parseRegisterCsv } from "../src/lib/directory/core";
import { lastJsonObject } from "../src/lib/ai/json";
import { complete } from "../src/lib/ai/openrouter";
import { classifyByName } from "../src/lib/sectors/classify";
import { SECTORS, isSectorId } from "../src/lib/sectors/taxonomy";

const BATCH = 25;
const dir = path.join(process.cwd(), "public", "data");
const outFile = path.join(dir, "sector-overrides.json");
const limit = Number(process.argv[2]) || Infinity;

const SYSTEM = `Classify UK companies by sector from their names. Sectors: ${SECTORS.map((s) => `${s.id} (${s.label})`).join("; ")}.
Reply with ONLY a JSON object mapping each given number to a sector id, or null if the name gives no clue. Never guess.`;

async function main() {
  const csv = fs.readdirSync(dir).filter((f) => f.endsWith(".csv")).sort().pop()!;
  const rows = parseRegisterCsv(fs.readFileSync(path.join(dir, csv), "utf-8"));
  const done: Record<string, string | null> = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf-8")) : {};

  const todo = rows
    .filter((r) => !classifyByName(r.name) && !(r.name in done))
    .sort((a, b) => Number(b.routes.includes("Skilled Worker")) - Number(a.routes.includes("Skilled Worker")))
    .slice(0, limit);
  console.log(`${todo.length} names to classify (${Object.keys(done).length} already done)`);

  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    try {
      const reply = await complete(SYSTEM, batch.map((r, n) => `${n + 1}. ${r.name}`).join("\n"), 180_000, 8000);
      const parsed = lastJsonObject(reply);
      if (!parsed) throw new Error(`No JSON in reply: ${reply.slice(0, 200)}`);
      batch.forEach((r, n) => {
        const v = parsed[String(n + 1)];
        done[r.name] = isSectorId(v) ? v : null; // null = looked at, nothing found
      });
    } catch (error) {
      console.error(`Batch at ${i} failed, skipping:`, (error as Error).message);
    }
    // Save as we go so a long run can be interrupted
    fs.writeFileSync(outFile, JSON.stringify(done));
    console.log(`${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
main();
