// Rebuilds src/lib/soc/occupations.json from the Immigration Rules on GOV.UK.
// Run: node --no-warnings scripts/update-going-rates.ts   (then review the diff and update LAST_VERIFIED in thresholds.ts)
import fs from "fs";
import path from "path";

const SKILLED_OCCUPATIONS = "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-occupations";
const SHORTAGE_LIST = "https://www.gov.uk/government/publications/skilled-worker-visa-temporary-shortage-list/skilled-worker-visa-temporary-shortage-list";
const OUT = path.join(process.cwd(), "src", "lib", "soc", "occupations.json");

type Status = "eligible" | "shortage" | "health-education" | "existing-only" | "ineligible";

interface Occupation {
  code: string;
  title: string;
  examples: string[];
  status: Status;
  goingRate?: number; // GBP a year: option A (or the shortage list's standard rate)
  newEntrantRate?: number; // GBP a year: option E (70% of the going rate, at least £33,400)
  payScale?: string; // Health and education: which national pay scale sets the rate
  note?: string; // Extra conditions GOV.UK attaches to the code
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&#8217;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "–")
    .replace(/&pound;/g, "£")
    .replace(/\s+/g, " ")
    .trim();

/** Each h2 section's tables as rows of cell text, keyed by heading. */
function sections(html: string): Map<string, string[][]> {
  const out = new Map<string, string[][]>();
  const parts = html.split(/(<h2[^>]*id="[^"]*"[^>]*>[\s\S]*?<\/h2>)/);
  for (let i = 1; i < parts.length; i += 2) {
    const rows = [...parts[i + 1].matchAll(/<tr[\s\S]*?<\/tr>/g)].map((tr) =>
      [...tr[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => decode(c[1]))
    );
    out.set(decode(parts[i]), rows.slice(1)); // Drop the header row
  }
  return out;
}

const table = (all: Map<string, string[][]>, prefix: string) => {
  const key = [...all.keys()].find((k) => k.startsWith(`${prefix}:`));
  if (!key) throw new Error(`Missing ${prefix} on GOV.UK page; the layout may have changed`);
  return all.get(key)!;
};

const money = (cell: string | undefined) => {
  const m = cell?.match(/£([\d,]+)/);
  return m ? Number(m[1].replace(/,/g, "")) : undefined;
};

/** "Care workers and home carers – Jobs with ... only eligible where ..." -> title and note. */
const splitTitle = (text: string): { title: string; note?: string } => {
  const m = text.match(/^(.+?)(?: – | - (?=ONLY)| Note: )(.+)$/);
  return m ? { title: m[1].trim(), note: m[2].trim() } : { title: text };
};

const splitCode = (cell: string) => {
  const m = cell.match(/^(\d{4}) (.+?)(?: \((England|Scotland|Wales|Northern Ireland)\))?$/);
  if (!m) throw new Error(`Unexpected occupation cell: ${cell}`);
  return { code: m[1], nation: m[3], ...splitTitle(m[2]) };
};

const examples = (cell: string) =>
  cell
    .split("•")
    .map((s) => s.trim())
    .filter((s) => s && !/not elsewhere classified$/i.test(s));

async function get(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Horus going-rate snapshot (https://horus.to)" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

async function main() {
  const [skilledHtml, shortageHtml] = await Promise.all([get(SKILLED_OCCUPATIONS), get(SHORTAGE_LIST)]);
  const skilled = sections(skilledHtml);
  const byCode = new Map<string, Occupation>();

  // Table 1: open to new applicants (RQF 6+), going rate and new-entrant rate
  for (const [occ, ex, rateA, , , rateE] of table(skilled, "Table 1")) {
    const { code, title, note } = splitCode(occ);
    byCode.set(code, { code, title, ...(note && { note }), examples: examples(ex), status: "eligible", goingRate: money(rateA), newEntrantRate: money(rateE) });
  }

  // Table 3: health and education jobs paid on national pay scales (option K, at least £25,000)
  const band5 = table(skilled, "Table 4").find((r) => r[0] === "Band 5")?.[1];
  const qualifiedTeacher = table(skilled, "Table 5").find((r) => /^Qualified teachers/.test(r[0]))?.[1];
  for (const [occ, , ex, rate] of table(skilled, "Table 3")) {
    const { code, title, nation } = splitCode(occ);
    if (byCode.has(code) || (nation && nation !== "England")) continue;
    const payScale = /Table 4/.test(rate)
      ? `NHS Agenda for Change band for the role (Band 5 is ${band5} in England)`
      : /Table 5/.test(rate)
        ? `Teacher pay scales (qualified teachers from ${qualifiedTeacher} in England)`
        : (rate.split("•").map((s) => s.trim()).find((s) => s.includes("£")) ?? rate).replace(/ These going rates.*$/, "").slice(0, 160) + " (England, entry level)";
    byCode.set(code, { code, title, examples: examples(ex), status: "health-education", payScale });
  }

  // Temporary Shortage List: medium-skilled jobs open to new applicants until the end of 2026
  const shortage = [...shortageHtml.matchAll(/<tr[\s\S]*?<\/tr>/g)]
    .map((tr) => [...tr[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => decode(c[1])))
    .filter((r) => /^\d{4}$/.test(r[0]));
  const older = new Map(table(skilled, "Table 1a").map((r) => [splitCode(r[0]).code, r]));
  for (const [code, text, standard] of shortage) {
    const goingRate = money(standard);
    const { title, note } = splitTitle(text);
    // "only the following job types: - Builders - Divers ..." limits the code to those jobs
    const only = note?.match(/^only the following job types: (.+)$/i)?.[1].split(/ - |^- /).map((s) => s.replace(/^- /, "").trim()).filter(Boolean);
    byCode.set(code, {
      code,
      title,
      ...(only ? { note: `Only these jobs: ${only.join(", ")}` } : note && { note }),
      examples: only ?? examples(older.get(code)?.[1] ?? ""),
      status: "shortage",
      goingRate,
      newEntrantRate: goingRate && Math.max(33_400, Math.round((goingRate * 0.7) / 100) * 100),
    });
  }

  // Table 1a: only for people already on a Skilled Worker visa before 22 July 2025
  for (const [occ, ex, rateA, , , rateE] of table(skilled, "Table 1a")) {
    const { code, title, note } = splitCode(occ);
    if (byCode.has(code)) continue;
    byCode.set(code, { code, title, ...(note && { note }), examples: examples(ex), status: "existing-only", goingRate: money(rateA), newEntrantRate: money(rateE) });
  }

  // Table 6: never eligible
  for (const [occ, ex] of table(skilled, "Table 6")) {
    const { code, title } = splitCode(occ);
    if (!byCode.has(code)) byCode.set(code, { code, title, examples: examples(ex), status: "ineligible" });
  }

  const occupations = [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  const snapshot = { fetchedAt: new Date().toISOString().slice(0, 10), sources: [SKILLED_OCCUPATIONS, SHORTAGE_LIST], occupations };
  fs.writeFileSync(OUT, `${JSON.stringify(snapshot)}\n`);
  const counts = occupations.reduce<Record<string, number>>((c, o) => ((c[o.status] = (c[o.status] ?? 0) + 1), c), {});
  console.log(`Wrote ${occupations.length} occupations to ${path.relative(process.cwd(), OUT)}`, counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
