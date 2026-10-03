// Prints how much of the register the name rules classify. Run: npx tsx scripts/sector-coverage.ts
import fs from "fs";
import path from "path";
import { parseRegisterCsv } from "../src/lib/directory/core";
import { classifyByName } from "../src/lib/sectors/classify";

const dir = path.join(process.cwd(), "public", "data");
const csv = fs.readdirSync(dir).filter((f) => f.endsWith(".csv")).sort().pop()!;
const rows = parseRegisterCsv(fs.readFileSync(path.join(dir, csv), "utf-8"));
const counts = new Map<string, number>();
for (const r of rows) {
  const s = classifyByName(r.name) ?? "(unclassified)";
  counts.set(s, (counts.get(s) ?? 0) + 1);
}
for (const [s, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`${s.padEnd(16)} ${String(n).padStart(7)}  ${((n / rows.length) * 100).toFixed(1)}%`);
}
