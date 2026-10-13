"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { isExistingWorker, isNewEntrant } from "@/lib/profile/types";
import { OCCUPATIONS, type Occupation, type OccupationStatus, SNAPSHOT_SOURCES, STATUS_LABELS, salaryRule } from "@/lib/soc";
import { suggestOccupations } from "@/lib/soc/match";
import { cn } from "@/lib/utils";
import { useProfile } from "@/store/useProfile";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const INPUT = "h-11 w-full rounded-md border border-input bg-card px-3 text-sm";

const TONE: Record<OccupationStatus, "success" | "warning" | "neutral" | "primary"> = {
  eligible: "success",
  shortage: "primary",
  "health-education": "success",
  "existing-only": "warning",
  ineligible: "neutral",
};

function OccupationResult({ occ, salary, who }: { occ: Occupation; salary: number | null; who: { newEntrant: boolean; existingWorker: boolean } }) {
  const rule = salaryRule(occ, who);
  const ok = rule.eligible && rule.minimum !== undefined && salary !== null ? salary >= rule.minimum : null;
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SOC {occ.code}</p>
          <h2 className="font-display text-xl font-semibold">{occ.title}</h2>
        </div>
        <Badge tone={TONE[occ.status]}>{STATUS_LABELS[occ.status]}</Badge>
      </div>

      {rule.eligible && rule.minimum !== undefined && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md bg-muted/60 p-3">
            <dt className="text-xs text-muted-foreground">You need at least</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{fmt(rule.minimum)}</dd>
          </div>
          {occ.goingRate !== undefined && (
            <div className="rounded-md bg-muted/60 p-3">
              <dt className="text-xs text-muted-foreground">Going rate</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{fmt(occ.goingRate)}</dd>
            </div>
          )}
          {occ.newEntrantRate !== undefined && (
            <div className="rounded-md bg-muted/60 p-3">
              <dt className="text-xs text-muted-foreground">New-entrant rate</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{fmt(occ.newEntrantRate)}</dd>
            </div>
          )}
        </dl>
      )}

      {ok !== null && (
        <p className={cn("mt-4 rounded-md p-3 text-sm font-medium", ok ? "bg-sage/10 text-sage" : "bg-clay/10 text-clay")}>
          {ok ? `✓ ${fmt(salary!)} is enough for this occupation.` : `✗ ${fmt(salary!)} is ${fmt(rule.minimum! - salary!)} short of the minimum.`}
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">{rule.explanation}</p>
      {occ.note && <p className="mt-2 text-sm text-muted-foreground">Note: {occ.note}</p>}
      {occ.examples.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Includes: {occ.examples.slice(0, 8).join(" · ")}</p>
      )}
    </article>
  );
}

/** Job title in, occupation code and the salary needed out. Plus a browsable table of every code. */
export function SalaryChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const profile = useProfile((s) => s.profile);
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [salaryText, setSalaryText] = useState(params.get("salary") ?? "");
  const [picked, setPicked] = useState<string | null>(null);
  const [newEntrant, setNewEntrant] = useState<boolean | null>(null);
  const [existing, setExisting] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<OccupationStatus | "all">("all");
  const [search, setSearch] = useState("");

  const who = {
    newEntrant: newEntrant ?? (profile ? isNewEntrant(profile) : false),
    existingWorker: existing ?? (profile ? isExistingWorker(profile) : false),
  };
  const salary = Number(salaryText.replace(/[£,\s]/g, "")) || null;
  const suggestions = useMemo(() => (title.trim().length >= 3 ? suggestOccupations(title) : []), [title]);
  const chosen = suggestions.find((o) => o.code === picked) ?? suggestions[0];

  // Keep the title in the URL so a result can be shared, without a history entry per keystroke
  function syncUrl(next: { title?: string; salary?: string }) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  }

  const q = search.trim().toLowerCase();
  const rows = OCCUPATIONS.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (!q || o.code.startsWith(q) || `${o.title} ${o.examples.join(" ")}`.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-8">
      <section className="card space-y-4 p-5" aria-label="Check a job">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Job title</span>
            <input
              className={INPUT}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setPicked(null);
              }}
              onBlur={() => syncUrl({ title: title.trim() })}
              placeholder="e.g. Software engineer, Staff nurse, Data analyst"
              autoFocus={!title}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Salary (£ a year)</span>
            <input
              className={INPUT}
              value={salaryText}
              inputMode="numeric"
              onChange={(e) => setSalaryText(e.target.value)}
              onBlur={() => syncUrl({ salary: salary ? String(salary) : "" })}
              placeholder="Optional"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip selected={who.newEntrant} onClick={() => setNewEntrant(!who.newEntrant)}>
            I&apos;m a new entrant
          </Chip>
          <Chip selected={who.existingWorker} onClick={() => setExisting(!who.existingWorker)}>
            Already on a Skilled Worker visa (before 22 July 2025)
          </Chip>
          {profile && newEntrant === null && existing === null && (
            <span className="self-center text-xs text-muted-foreground">Set from your profile</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          New entrants: under 26, recent graduates, switching from a Student or Graduate visa, or working towards a recognised professional
          qualification.
        </p>
      </section>

      {title.trim().length >= 3 &&
        (chosen ? (
          <section aria-label="Result" className="space-y-3">
            {suggestions.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Closest occupations:</span>
                {suggestions.map((o) => (
                  <Chip key={o.code} selected={o.code === chosen.code} onClick={() => setPicked(o.code)}>
                    {o.code} {o.title.length > 38 ? `${o.title.slice(0, 36)}…` : o.title}
                  </Chip>
                ))}
              </div>
            )}
            <OccupationResult occ={chosen} salary={salary} who={who} />
            <p className="text-xs text-muted-foreground">
              Your employer picks the code on your certificate of sponsorship. If none of these fits, search the table below or try the{" "}
              <a href="https://cascotweb.warwick.ac.uk/#/classification/soc2020" target="_blank" rel="noopener noreferrer" className="underline">
                CASCOT coding tool
              </a>
              .
            </p>
          </section>
        ) : (
          <p className="card p-5 text-sm text-muted-foreground">
            No clear occupation for &ldquo;{title}&rdquo;. Try a more standard title (e.g. &ldquo;software developer&rdquo; rather than
            &ldquo;ninja&rdquo;), or search the table below.
          </p>
        ))}

      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className="font-display text-2xl font-semibold">
          All occupation codes
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "eligible", "shortage", "health-education", "existing-only", "ineligible"] as const).map((s) => (
            <Chip key={s} selected={filter === s} onClick={() => setFilter(s)}>
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </Chip>
          ))}
        </div>
        <input
          className={cn(INPUT, "mt-3")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, occupation or job title"
          aria-label="Search occupations"
        />
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Occupation</th>
                <th className="px-3 py-2 text-right font-medium">Going rate</th>
                <th className="px-3 py-2 text-right font-medium">New entrant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.code} className={cn(o.status === "ineligible" && "text-muted-foreground")}>
                  <td className="px-3 py-2 tabular-nums">{o.code}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => {
                        setTitle(o.examples[0] ?? o.title);
                        setPicked(o.code);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {o.title}
                    </button>
                    <span className="block text-xs text-muted-foreground">{STATUS_LABELS[o.status]}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.goingRate ? fmt(o.goingRate) : o.status === "health-education" ? "Pay scale" : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.newEntrantRate ? fmt(o.newEntrantRate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {rows.length} of {OCCUPATIONS.length} codes. Rates are for a 37.5-hour week. Sources:{" "}
          {SNAPSHOT_SOURCES.map((url, i) => (
            <span key={url}>
              {i > 0 && ", "}
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                {i === 0 ? "Appendix Skilled Occupations" : "Temporary Shortage List"}
              </a>
            </span>
          ))}
          . A guide, not immigration advice. PhD discounts, the Immigration Salary List and pre-April-2024 transitional rates aren&apos;t
          covered. <Link href="/guide/visa-basics" className="underline">Visa basics</Link>.
        </p>
      </section>
    </div>
  );
}
