/**
 * One-off: classifies sponsors the name rules can't place, using the OpenRouter model,
 * and stores the results on the sponsors table (sector_override). Resumable; safe to stop and re-run.
 *
 *   OPENROUTER_API_KEY=... npx ts-node-script --transpile-only \
 *     --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' \
 *     scripts/classify-sectors.ts [maxNames]
 *
 * Only public company names are sent. Skilled Worker sponsors go first.
 */
import "./env";
import { lastJsonObject } from "../src/lib/ai/json";
import { complete } from "../src/lib/ai/openrouter";
import { classifyByName } from "../src/lib/sectors/classify";
import { SECTORS, isSectorId } from "../src/lib/sectors/taxonomy";
import { supabaseAdmin } from "../src/lib/supabase/client";
import { fetchAll } from "../src/lib/supabase/client";

const BATCH = 25;
const limit = Number(process.argv[2]) || Infinity;

const SYSTEM = `Classify UK companies by sector from their names. Sectors: ${SECTORS.map((s) => `${s.id} (${s.label})`).join("; ")}.
Reply with ONLY a JSON object mapping each given number to a sector id, or null if the name gives no clue. Never guess.`;

async function main() {
  const db = supabaseAdmin();
  const rows = await fetchAll<{ name: string; routes: string[]; override_set: boolean }>((from, to) =>
    db.from("sponsors").select("name,routes,override_set").order("ord").range(from, to)
  );
  const doneCount = rows.filter((r) => r.override_set).length;

  const todo = rows
    .filter((r) => !classifyByName(r.name) && !r.override_set)
    .sort((a, b) => Number(b.routes.includes("Skilled Worker")) - Number(a.routes.includes("Skilled Worker")))
    .slice(0, limit);
  console.log(`${todo.length} names to classify (${doneCount} already done)`);

  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    try {
      const reply = await complete(SYSTEM, batch.map((r, n) => `${n + 1}. ${r.name}`).join("\n"), { timeoutMs: 180_000, maxTokens: 8000 });
      const parsed = lastJsonObject(reply);
      if (!parsed) throw new Error(`No JSON in reply: ${reply.slice(0, 200)}`);
      // Save as we go so a long run can be interrupted
      await Promise.all(
        batch.map(async (r, n) => {
          const v = parsed[String(n + 1)];
          const sector = isSectorId(v) ? v : null; // null = looked at, nothing found
          const { error } = await db
            .from("sponsors")
            .update({ sector_override: sector, override_set: true, sector })
            .eq("name", r.name);
          if (error) throw new Error(error.message);
        })
      );
    } catch (error) {
      console.error(`Batch at ${i} failed, skipping:`, (error as Error).message);
    }
    console.log(`${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
