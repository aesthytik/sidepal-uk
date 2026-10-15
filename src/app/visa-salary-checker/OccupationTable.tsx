"use client";

import { useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { occupationPath } from "@/lib/seo";
import { OCCUPATIONS, type OccupationStatus, STATUS_LABELS, salaryRule } from "@/lib/soc";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const FILTERS = ["all", "eligible", "shortage", "health-education", "existing-only", "ineligible"] as const;

/**
 * Every occupation code with its rates. It reads no URL state, so the full table is in the
 * server-rendered HTML for search engines; filtering is a client-side extra.
 */
export function OccupationTable() {
  const [filter, setFilter] = useState<OccupationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const rows = OCCUPATIONS.filter(
    (o) => (filter === "all" || o.status === filter) && (!q || o.code.startsWith(q) || `${o.title} ${o.examples.join(" ")}`.toLowerCase().includes(q))
  );

  return (
    <section aria-labelledby="all-heading">
      <h2 id="all-heading" className="font-display text-2xl">
        Going rates for every occupation code
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <Chip key={s} selected={filter === s} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>
      <input
        className="mt-3 h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by code, occupation or job title"
        aria-label="Search occupations"
      />
      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">UK Skilled Worker visa going rates by SOC 2020 occupation code</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Code</th>
              <th scope="col" className="px-3 py-2 font-medium">Occupation</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Minimum salary</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Going rate</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">New entrant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((o) => {
              const closed = o.status === "ineligible" || o.status === "existing-only";
              const min = closed ? undefined : salaryRule(o).minimum;
              return (
                <tr key={o.code} className={cn(o.status === "ineligible" && "text-muted-foreground")}>
                  <td className="px-3 py-2 tabular-nums">{o.code}</td>
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <Link href={occupationPath(o)} className="font-medium hover:underline">
                      {o.title}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{STATUS_LABELS[o.status]}</span>
                  </th>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{min ? fmt(min) : closed ? "—" : "Pay scale"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.goingRate ? fmt(o.goingRate) : o.status === "health-education" ? "Pay scale" : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.newEntrantRate && !closed ? fmt(o.newEntrantRate) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {rows.length} of {OCCUPATIONS.length} codes. Rates are yearly for a 37.5-hour week. Also available as{" "}
        <a href="/visa-salary-checker/going-rates.json" className="underline">
          JSON
        </a>
        .
      </p>
    </section>
  );
}
